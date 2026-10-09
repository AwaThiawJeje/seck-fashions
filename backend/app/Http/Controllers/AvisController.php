<?php

namespace App\Http\Controllers;

use App\Models\Avis;
use App\Models\Commande;
use App\Models\Produit;
use Illuminate\Http\Request;

class AvisController extends Controller
{
    /**
     * Avis validés d'un produit — public, affiché sur la fiche produit.
     */
    public function index(Produit $produit)
    {
        $avis = $produit->avisValides()
            ->with('user:id,name')
            ->latest()
            ->get(['id', 'produit_id', 'user_id', 'note', 'commentaire', 'created_at']);

        return response()->json($avis);
    }

    /**
     * Les avis déjà laissés par le client connecté (quel que soit leur statut
     * de modération) — sert à afficher "Modifier mon avis" plutôt que "Laisser
     * un avis" dans Mes commandes.
     */
    public function mesAvis(Request $request)
    {
        return response()->json(
            $request->user()->avis()->get(['id', 'produit_id', 'note', 'commentaire', 'valide'])
        );
    }

    /**
     * Créé ou met à jour l'avis du client connecté sur ce produit — réservé à
     * ceux qui l'ont reçu (commande livrée). Repasse en attente de modération
     * à chaque modification.
     */
    public function store(Request $request, Produit $produit)
    {
        $utilisateur = $request->user();

        $aRecuLeProduit = Commande::where('user_id', $utilisateur->id)
            ->where('statut', 'livree')
            ->whereHas('lignes', fn ($q) => $q->where('produit_id', $produit->id))
            ->exists();

        if (! $aRecuLeProduit) {
            abort(403, "Tu peux laisser un avis uniquement sur un produit que tu as reçu.");
        }

        $data = $request->validate([
            'note' => ['required', 'integer', 'min:1', 'max:5'],
            'commentaire' => ['nullable', 'string', 'max:1000'],
        ], [
            'note.required' => 'La note est obligatoire.',
            'note.min' => 'La note doit être comprise entre 1 et 5.',
            'note.max' => 'La note doit être comprise entre 1 et 5.',
            'commentaire.max' => 'Le commentaire ne doit pas dépasser 1000 caractères.',
        ]);

        $avis = Avis::updateOrCreate(
            ['produit_id' => $produit->id, 'user_id' => $utilisateur->id],
            ['note' => $data['note'], 'commentaire' => $data['commentaire'] ?? null, 'valide' => false]
        );

        return response()->json($avis);
    }

    /**
     * File de modération admin — tous les avis, filtrables par statut.
     */
    public function indexAdmin(Request $request)
    {
        $avis = Avis::query()
            ->when($request->has('valide'), fn ($q) => $q->where('valide', $request->boolean('valide')))
            ->with(['produit:id,nom,slug', 'user:id,name'])
            ->latest()
            ->paginate(20);

        return response()->json($avis);
    }

    public function valider(Avis $avis)
    {
        $avis->update(['valide' => true]);

        return response()->json($avis);
    }

    public function destroy(Avis $avis)
    {
        $avis->delete();

        return response()->json(null, 204);
    }
}
