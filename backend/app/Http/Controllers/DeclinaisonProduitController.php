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
            $produit->declinaisons()->ordonnees()->get()
        );
    }

    public function store(Request $request, Produit $produit)
    {
        $data = $this->validated($request, $produit);

        $declinaison = $produit->declinaisons()->create($data);
        $produit->touch(); // déclenche la diffusion temps réel (stock changé)

        return response()->json($declinaison, 201);
    }

    public function show(DeclinaisonProduit $declinaison)
    {
        return response()->json($declinaison->load('produit'));
    }

    public function update(Request $request, DeclinaisonProduit $declinaison)
    {
        $data = $this->validated($request, $declinaison->produit, $declinaison);

        $declinaison->update($data);
        $declinaison->produit->touch(); // déclenche la diffusion temps réel (stock changé)

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

        $declinaison->produit->touch(); // déclenche la diffusion temps réel (stock changé)
        $declinaison->delete();

        return response()->json(null, 204);
    }

    private function validated(Request $request, Produit $produit, ?DeclinaisonProduit $declinaison = null): array
    {
        return $request->validate([
            'taille' => [
                'nullable', 'string', 'max:50',
                Rule::unique('declinaisons_produits', 'taille')
                    ->where('produit_id', $produit->id)
                    ->where('couleur_nom', $request->input('couleur_nom'))
                    ->ignore($declinaison?->id),
            ],
            'couleur_nom' => ['nullable', 'string', 'max:50', 'required_with:couleur'],
            'couleur' => ['nullable', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'quantite' => ['required', 'integer', 'min:0'],
        ], [
            'taille.unique' => 'Cette déclinaison existe déjà pour ce produit.',
            'couleur_nom.required_with' => 'Donne un nom à la couleur choisie.',
            'couleur.regex' => 'La couleur doit être un code hexadécimal valide (#RRGGBB).',
            'quantite.required' => 'La quantité est obligatoire.',
            'quantite.integer' => 'La quantité doit être un nombre entier.',
            'quantite.min' => 'La quantité ne peut pas être négative.',
        ]);
    }
}
