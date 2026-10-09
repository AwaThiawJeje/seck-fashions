<?php

namespace App\Http\Controllers;

use App\Models\Commande;
use App\Models\Produit;

class TableauDeBordController extends Controller
{
    public function index()
    {
        $parStatut = Commande::query()
            ->selectRaw('statut, COUNT(*) as nombre')
            ->groupBy('statut')
            ->pluck('nombre', 'statut');

        // Épuisé = visible sur le site, mais plus rien en stock (c'est l'inverse de "en vente").
        $epuises = Produit::where('disponible', true)
            ->whereNotIn('id', Produit::enVente()->select('produits.id'))
            ->orderBy('nom')
            ->get(['id', 'nom', 'slug'])
            ->map(fn ($p) => ['id' => $p->id, 'nom' => $p->nom, 'slug' => $p->slug]) // évite les champs calculés du modèle
            ->values();

        return response()->json([
            'commandes_a_valider' => (int) ($parStatut['en_attente'] ?? 0),
            'commandes_a_livrer' => (int) ($parStatut['confirmee'] ?? 0),
            'commandes_en_livraison' => (int) ($parStatut['expediee'] ?? 0),
            'produits_epuises' => $epuises,
        ]);
    }
}