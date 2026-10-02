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
    public function index(Request $request)
    {
        $commandes = Commande::query()
            ->when($request->statut, fn ($query, $statut) => $query->where('statut', $statut))
            ->with(['user', 'lignes'])
            ->latest()
            ->paginate(20);

        return response()->json($commandes);
    }

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
     * Création côté client — invité ou connecté, via le site.
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
            [$lignes, $total] = $this->construireLignes($data['articles']);

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
     * Création par l'admin — un client l'a contacté directement sur WhatsApp,
     * sans passer par le site. Jamais liée au compte de l'admin : volontairement
     * traitée comme une commande "invité", avec les coordonnées saisies à la main.
     */
    public function storeManuelle(Request $request)
    {
        $data = $request->validate([
            'methode_paiement' => ['required', Rule::in(['paiement_livraison', 'wave', 'orange_money'])],
            'notes' => ['nullable', 'string'],
            'articles' => ['required', 'array', 'min:1'],
            'articles.*.produit_id' => ['required', 'exists:produits,id'],
            'articles.*.declinaison_id' => ['nullable', 'exists:declinaisons_produits,id'],
            'articles.*.quantite' => ['required', 'integer', 'min:1'],
            'livraison.nom_complet' => ['required', 'string', 'max:255'],
            'livraison.telephone' => ['required', 'string', 'max:30'],
            'livraison.adresse' => ['required', 'string', 'max:500'],
            'livraison.ville' => ['required', 'string', 'max:255'],
        ], [
            'methode_paiement.required' => 'Le mode de paiement est obligatoire.',
            'methode_paiement.in' => "Le mode de paiement choisi n'est pas valide.",
            'articles.required' => 'Ajoute au moins un article.',
            'articles.min' => 'Ajoute au moins un article.',
            'articles.*.produit_id.required' => 'Chaque article doit être lié à un produit.',
            'articles.*.produit_id.exists' => "Un des produits sélectionnés n'existe pas.",
            'articles.*.declinaison_id.exists' => "Une des déclinaisons sélectionnées n'existe pas.",
            'articles.*.quantite.required' => 'Chaque article doit avoir une quantité.',
            'articles.*.quantite.min' => 'La quantité doit être au moins 1.',
            'livraison.nom_complet.required' => 'Le nom du client est obligatoire.',
            'livraison.telephone.required' => 'Le téléphone du client est obligatoire.',
            'livraison.adresse.required' => "L'adresse du client est obligatoire.",
            'livraison.ville.required' => 'La ville du client est obligatoire.',
        ]);

        $commande = DB::transaction(function () use ($data) {
            [$lignes, $total] = $this->construireLignes($data['articles']);

            $commande = Commande::create([
                'user_id' => null,
                'statut' => 'en_attente',
                'total' => $total,
                'methode_paiement' => $data['methode_paiement'],
                'notes' => $data['notes'] ?? null,
            ]);

            $commande->lignes()->createMany($lignes);
            $commande->livraison()->create($data['livraison']);

            return $commande;
        });

        return response()->json($commande->load(['lignes', 'livraison']), 201);
    }

    /**
     * Construit les lignes (avec vérification de stock et prix promo) et calcule le
     * total — partagé entre store() et storeManuelle(), pour ne jamais avoir deux
     * versions de cette logique qui pourraient diverger.
     */
    private function construireLignes(array $articles): array
    {
        $total = 0;
        $lignes = [];

        foreach ($articles as $article) {
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

        return [$lignes, $total];
    }

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
                        continue;
                    }

                    if ($ligne->declinaison_valeur) {
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