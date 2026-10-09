<?php

namespace App\Http\Controllers;

use App\Models\Favori;
use App\Models\Produit;
use Illuminate\Http\Request;

class FavoriController extends Controller
{
    public function index(Request $request)
    {
        $favoris = $request->user()
            ->favoris()
            ->with([
                'produit.categorie',
                'produit.images' => fn ($q) => $q->orderBy('ordre'),
                'produit.declinaisons' => fn ($q) => $q->ordonnees(),
            ])
            ->orderBy('id')
            ->get();

        return response()->json($favoris);
    }

    public function sync(Request $request)
    {
        $data = $request->validate([
            'produit_ids' => ['required', 'array', 'max:200'],
            'produit_ids.*' => ['integer'],
        ], [
            'produit_ids.required' => 'La liste des produits à synchroniser est obligatoire.',
        ]);

        // Un produit supprimé depuis est simplement ignoré, au lieu de tout faire échouer.
        $ids = Produit::whereIn('id', $data['produit_ids'])->pluck('id');

        foreach ($ids as $produitId) {
            Favori::firstOrCreate([
                'user_id' => $request->user()->id,
                'produit_id' => $produitId,
            ]);
        }

        return response()->json($request->user()->favoris()->with('produit')->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'produit_id' => ['required', 'exists:produits,id'],
        ], [
            'produit_id.required' => 'Le produit à ajouter aux favoris est obligatoire.',
            'produit_id.exists' => "Ce produit n'existe pas.",
        ]);

        $favori = Favori::firstOrCreate([
            'user_id' => $request->user()->id,
            'produit_id' => $data['produit_id'],
        ]);

        return response()->json($favori->load('produit'), 201);
    }

    public function destroy(Request $request, Produit $produit)
    {
        $request->user()
            ->favoris()
            ->where('produit_id', $produit->id)
            ->delete();

        return response()->json(null, 204);
    }
}