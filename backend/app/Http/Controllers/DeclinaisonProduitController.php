<?php

namespace App\Http\Controllers;

use App\Models\DeclinaisonProduit;
use App\Models\Produit;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class DeclinaisonProduitController extends Controller
{
    public function index(Produit $produit)
    {
        return response()->json(
            $produit->declinaisons()->orderBy('valeur')->get()
        );
    }

    public function store(Request $request, Produit $produit)
    {
        $data = $request->validate([
            'valeur' => [
                'required', 'string',
                Rule::unique('declinaisons_produits', 'valeur')
                    ->where('produit_id', $produit->id),
            ],
            'quantite' => ['required', 'integer', 'min:0'],
        ], [
            'valeur.required' => 'La valeur (pointure, taille...) est obligatoire.',
            'valeur.unique' => 'Cette valeur existe déjà pour ce produit.',
            'quantite.required' => 'La quantité est obligatoire.',
            'quantite.integer' => 'La quantité doit être un nombre entier.',
            'quantite.min' => 'La quantité ne peut pas être négative.',
        ]);

        $declinaison = $produit->declinaisons()->create($data);

        return response()->json($declinaison, 201);
    }

    public function show(DeclinaisonProduit $declinaison)
    {
        return response()->json($declinaison->load('produit'));
    }

    public function update(Request $request, DeclinaisonProduit $declinaison)
    {
        $data = $request->validate([
            'valeur' => [
                'sometimes', 'required', 'string',
                Rule::unique('declinaisons_produits', 'valeur')
                    ->where('produit_id', $declinaison->produit_id)
                    ->ignore($declinaison->id),
            ],
            'quantite' => ['sometimes', 'required', 'integer', 'min:0'],
        ], [
            'valeur.required' => 'La valeur (pointure, taille...) est obligatoire.',
            'valeur.unique' => 'Cette valeur existe déjà pour ce produit.',
            'quantite.required' => 'La quantité est obligatoire.',
            'quantite.integer' => 'La quantité doit être un nombre entier.',
            'quantite.min' => 'La quantité ne peut pas être négative.',
        ]);

        $declinaison->update($data);

        return response()->json($declinaison->fresh());
    }

    public function destroy(DeclinaisonProduit $declinaison)
    {
        $nb = $declinaison->commandesEnAttente()->count();

        if ($nb > 0) {
            return response()->json([
                'message' => "Impossible de supprimer cette déclinaison : elle figure dans {$nb} commande(s) en attente. Valide ou annule d'abord ces commandes. Pour ne plus la vendre, mets sa quantité à 0.",
            ], 422);
        }

        $declinaison->delete();

        return response()->json(null, 204);
    }
}