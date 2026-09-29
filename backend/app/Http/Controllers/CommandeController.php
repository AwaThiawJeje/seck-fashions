<?php

namespace App\Http\Controllers;

use App\Models\Commande;
use App\Models\DeclinaisonProduit;
use App\Models\Produit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class CommandeController extends Controller
{
    /**
     * Toutes les commandes — admin uniquement.
     */
    public function index(Request $request)
    {
        $commandes = Commande::query()
            ->when($request->statut, fn ($query, $statut) => $query->where('statut', $statut))
            ->with(['user', 'lignes'])
            ->latest()
            ->paginate(20);

        return response()->json($commandes);
    }

    /**
     * L'historique du client connecté uniquement.
     */
    public function mesCommandes(Request $request)
    {
        $commandes = $request->user()
            ->commandes()
            ->with('lignes')
            ->latest()
            ->paginate(20);

        return response()->json($commandes);
    }

    public function show(Request $request, Commande $commande)
    {
        $utilisateur = $request->user();

        if (! $utilisateur || ($utilisateur->role !== 'admin' && $commande->user_id !== $utilisateur->id)) {
            abort(403, "Tu n'as pas accès à cette commande.");
        }

        return response()->json($commande->load(['lignes', 'user', 'livraison']));
    }

    /**
     * Création — accessible à un invité (user_id null) ou un client connecté.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'methode_paiement' => ['required', Rule::in(['paiement_livraison', 'wave', 'orange_money'])],
            'notes' => ['nullable', 'string'],
            'articles' => ['required', 'array', 'min:1'],
            'articles.*.produit_id' => ['required', 'exists:produits,id'],
            'articles.*.declinaison_id' => ['nullable', 'exists:declinaisons_produits,id'],
            'articles.*.quantite' => ['required', 'integer', 'min:1'],
        ], [
            'methode_paiement.required' => 'Le mode de paiement est obligatoire.',
            'methode_paiement.in' => "Le mode de paiement choisi n'est pas valide.",
            'articles.required' => 'Le panier est vide.',
            'articles.min' => 'Le panier est vide.',
            'articles.*.produit_id.required' => 'Chaque article doit être lié à un produit.',
            'articles.*.produit_id.exists' => "Un des produits du panier n'existe plus.",
            'articles.*.declinaison_id.exists' => "Une des déclinaisons sélectionnées n'existe plus.",
            'articles.*.quantite.required' => 'Chaque article doit avoir une quantité.',
            'articles.*.quantite.min' => 'La quantité doit être au moins 1.',
        ]);

        $commande = DB::transaction(function () use ($data, $request) {
            $total = 0;
            $lignes = [];

            foreach ($data['articles'] as $article) {
                $produit = Produit::findOrFail($article['produit_id']);
                $declinaison = null;
                $nomLigne = $produit->nom;

                if (! empty($article['declinaison_id'])) {
                    $declinaison = DeclinaisonProduit::where('id', $article['declinaison_id'])
                        ->where('produit_id', $produit->id)
                        ->first();

                    if (! $declinaison) {
                        abort(422, "La déclinaison sélectionnée ne correspond pas au produit \"{$produit->nom}\".");
                    }

                    if ($declinaison->quantite < $article['quantite']) {
                        abort(422, "Stock insuffisant pour \"{$produit->nom}\" ({$declinaison->valeur}) — il n'en reste que {$declinaison->quantite}.");
                    }

                    $nomLigne .= " — {$declinaison->valeur}";
                } elseif ($produit->quantite < $article['quantite']) {
                    abort(422, "Stock insuffisant pour \"{$produit->nom}\" — il n'en reste que {$produit->quantite}.");
                }

                $prixUnitaire = $produit->en_promotion ? $produit->prix_promo : $produit->prix;
                $sousTotal = $prixUnitaire * $article['quantite'];
                $total += $sousTotal;

                $lignes[] = [
                    'produit_id' => $produit->id,
                    'declinaison_id' => $declinaison?->id,
                    'declinaison_valeur' => $declinaison?->valeur,
                    'nom_produit' => $nomLigne,
                    'prix_unitaire' => $prixUnitaire,
                    'quantite' => $article['quantite'],
                    'sous_total' => $sousTotal,
                ];
            }

            $commande = Commande::create([
                'user_id' => $request->user('sanctum')?->id, // null si invité
                'statut' => 'en_attente',
                'total' => $total,
                'methode_paiement' => $data['methode_paiement'],
                'notes' => $data['notes'] ?? null,
            ]);

            $commande->lignes()->createMany($lignes);

            return $commande;
        });

        return response()->json($commande->load('lignes'), 201);
    }

    /**
     * L'action centrale : admin confirme la commande WhatsApp → stock décrémenté.
     */
    public function valider(Commande $commande)
    {
        DB::transaction(function () use ($commande) {
            $commande = Commande::lockForUpdate()->findOrFail($commande->id);

            if ($commande->statut !== 'en_attente') {
                abort(422, "Seule une commande en attente peut être validée (statut actuel : {$commande->statut}).");
            }

            foreach ($commande->lignes as $ligne) {
                if ($ligne->declinaison_valeur) {
                    $declinaison = DeclinaisonProduit::lockForUpdate()
                        ->where('produit_id', $ligne->produit_id)
                        ->where('valeur', $ligne->declinaison_valeur)
                        ->first();

                    if (! $declinaison) {
                        abort(422, "\"{$ligne->nom_produit}\" n'existe plus au catalogue — impossible de valider la commande.");
                    }

                    if ($declinaison->quantite < $ligne->quantite) {
                        abort(422, "Stock insuffisant pour \"{$ligne->nom_produit}\" — impossible de valider la commande.");
                    }

                    $declinaison->decrement('quantite', $ligne->quantite);
                } elseif ($ligne->produit_id) {
                    $produit = Produit::lockForUpdate()->find($ligne->produit_id);

                    if (! $produit || $produit->quantite < $ligne->quantite) {
                        abort(422, "Stock insuffisant pour \"{$ligne->nom_produit}\" — impossible de valider la commande.");
                    }

                    $produit->decrement('quantite', $ligne->quantite);
                }
            }

            $commande->update(['statut' => 'confirmee']);
        });

        return response()->json($commande->fresh(['lignes']));
    }

    public function annuler(Commande $commande)
    {
        DB::transaction(function () use ($commande) {
            $commande = Commande::lockForUpdate()->findOrFail($commande->id);

            if ($commande->statut === 'annulee') {
                abort(422, 'Cette commande est déjà annulée.');
            }

            if ($commande->statut === 'livree') {
                abort(422, 'Une commande livrée ne peut plus être annulée.');
            }

            if (in_array($commande->statut, ['confirmee', 'expediee'])) {
                foreach ($commande->lignes as $ligne) {
                    if (! $ligne->produit_id) {
                        continue; // produit supprimé depuis : rien à restocker
                    }

                    if ($ligne->declinaison_valeur) {
                        // Si cette déclinaison a été supprimée depuis, aucune ligne n'est touchée
                        DeclinaisonProduit::where('produit_id', $ligne->produit_id)
                            ->where('valeur', $ligne->declinaison_valeur)
                            ->increment('quantite', $ligne->quantite);
                    } else {
                        Produit::whereKey($ligne->produit_id)->increment('quantite', $ligne->quantite);
                    }
                }
            }

            $commande->update(['statut' => 'annulee']);
        });

        return response()->json($commande->fresh(['lignes']));
    }
}