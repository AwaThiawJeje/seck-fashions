<?php

namespace App\Http\Controllers;

use App\Models\Categorie;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class CategorieController extends Controller
{
    public function index()
    {
        $categories = Categorie::whereNull('categorie_parente_id')
            ->with('enfants')
            ->get();

        return response()->json($categories);
    }

    public function store(Request $request)
    {
        $data = $this->validated($request);

        $categorie = Categorie::create($data);

        return response()->json($categorie, 201);
    }

    public function show(Categorie $categorie)
    {
        $categorie->load(['parente', 'enfants', 'produits']);

        return response()->json($categorie);
    }

    public function update(Request $request, Categorie $categorie)
    {
        $data = $this->validated($request, $categorie);

        $categorie->update($data);

        return response()->json($categorie->fresh(['parente', 'enfants']));
    }

    public function destroy(Categorie $categorie)
    {
        if ($categorie->produits()->exists()) {
            return response()->json([
                'message' => 'Impossible de supprimer une catégorie qui contient encore des produits.',
            ], 422);
        }

        $categorie->delete();

        return response()->json(null, 204);
    }

    private function validated(Request $request, ?Categorie $categorie = null): array
    {
        $data = $request->validate([
            'nom' => ['required', 'string', 'max:255'],
            'categorie_parente_id' => [
                'nullable',
                'exists:categories,id',
                Rule::notIn([$categorie?->id]),
            ],
        ], [
            'nom.required' => 'Le nom de la catégorie est obligatoire.',
            'nom.max' => 'Le nom ne doit pas dépasser 255 caractères.',
            'categorie_parente_id.exists' => "La catégorie parente sélectionnée n'existe pas.",
            'categorie_parente_id.not_in' => 'Une catégorie ne peut pas être sa propre catégorie parente.',
        ]);

        $data['slug'] = Str::slug($data['nom']);

        // Si ce slug existe déjà (deux catégories avec le même nom), on ajoute un suffixe
        $slugDeBase = $data['slug'];
        $compteur = 1;
        while (
            Categorie::where('slug', $data['slug'])
                ->when($categorie, fn ($q) => $q->whereKeyNot($categorie->id))
                ->exists()
        ) {
            $data['slug'] = "{$slugDeBase}-{$compteur}";
            $compteur++;
        }

        return $data;
    }
}