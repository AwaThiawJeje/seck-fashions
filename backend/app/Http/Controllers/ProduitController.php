<?php

namespace App\Http\Controllers;

use App\Models\Produit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Support\Str;

class ProduitController extends Controller
{
    public function index(Request $request)
    {
        $produits = Produit::query()
            ->where('disponible', true)
            ->when($request->categorie, fn ($query, $slug) =>
                $query->whereHas('categorie', fn ($q) => $q->where('slug', $slug))
            )
            ->when($request->valeur, fn ($query, $valeur) =>
                $query->whereHas('declinaisons', fn ($q) =>
                    $q->where('valeur', $valeur)->where('quantite', '>', 0)
                )
            )
            ->when($request->recherche, fn ($query, $terme) =>
                $query->where('nom', 'like', "%{$terme}%")
            )
            ->when($request->ids, fn ($query, $ids) =>
                $query->whereIn('id', is_array($ids) ? $ids : explode(',', $ids))
            )
            ->with([
                'categorie',
                'images' => fn ($q) => $q->orderBy('ordre'),
                'declinaisons' => fn ($q) => $q->orderBy('id'),
            ])
            ->paginate(20);

        return response()->json($produits);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    public function store(Request $request)
    {
        $data = $this->validated($request);

        $produit = DB::transaction(function () use ($data) {
            $produit = Produit::create(collect($data)->except('declinaisons')->all());

            if (! empty($data['declinaisons'])) {
                $produit->declinaisons()->createMany($data['declinaisons']);
            }

            return $produit;
        });

        return response()->json(
            $produit->load(['categorie', 'declinaisons']),
            201
        );
    }

    public function show(Produit $produit)
    {
        $produit->load(['categorie', 'images', 'declinaisons']);

        return response()->json($produit);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Produit $produit)
    {
        //
    }

    public function update(Request $request, Produit $produit)
    {
        $data = $this->validated($request, $produit);

        DB::transaction(function () use ($data, $produit) {
            $produit->update(collect($data)->except('declinaisons')->all());

            if (array_key_exists('declinaisons', $data)) {
                $envoyees = collect($data['declinaisons']);

                $retirees = $produit->declinaisons()
                    ->whereNotIn('valeur', $envoyees->pluck('valeur'))
                    ->get();

                foreach ($retirees as $declinaison) {
                    if ($declinaison->commandesEnAttente()->exists()) {
                        abort(422, "Impossible de retirer \"{$declinaison->valeur}\" : cette déclinaison figure dans une commande en attente. Valide ou annule d'abord la commande, ou mets sa quantité à 0.");
                    }
                }

                $retirees->each->delete();

                foreach ($envoyees as $declinaison) {
                    $produit->declinaisons()->updateOrCreate(
                        ['valeur' => $declinaison['valeur']],
                        ['quantite' => $declinaison['quantite']]
                    );
                }
            }
        });

        return response()->json($produit->fresh(['categorie', 'declinaisons']));
    }

    public function destroy(Produit $produit)
    {
        $nb = $produit->commandesEnAttente()->count();

        if ($nb > 0) {
            return response()->json([
                'message' => "Impossible de supprimer ce produit : il figure dans {$nb} commande(s) en attente. Valide ou annule d'abord ces commandes. Pour le retirer de la vente, passe-le en indisponible.",
            ], 422);
        }

        $produit->delete();

        return response()->json(null, 204);
    }

    private function validated(Request $request, ?Produit $produit = null): array
    {
        $data = $request->validate([
            'categorie_id' => ['required', 'exists:categories,id'],
            'nom' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'prix' => ['required', 'numeric', 'min:0'],
            'prix_promo' => [
                'nullable', 'numeric', 'min:0',
                function ($attribute, $value, $fail) use ($request) {
                    if ($value !== null && (float) $value >= (float) $request->input('prix')) {
                        $fail('Le prix promotionnel doit être inférieur au prix normal.');
                    }
                },
            ],
            'reduction_pourcentage' => [
                'nullable', 'numeric', 'min:1', 'max:99',
                function ($attribute, $value, $fail) use ($request) {
                    if ($value !== null && $request->filled('prix_promo')) {
                        $fail('Indique soit un prix promotionnel, soit un pourcentage de réduction, pas les deux.');
                    }
                },
            ],
            'quantite' => ['nullable', 'integer', 'min:0'],
            'disponible' => ['boolean'],
            'reference' => [
                'nullable', 'string',
                Rule::unique('produits', 'reference')->ignore($produit?->id),
            ],
            'mis_en_avant' => ['boolean'],
            'declinaisons' => ['nullable', 'array'],
            'declinaisons.*.valeur' => ['required_with:declinaisons', 'string'],
            'declinaisons.*.quantite' => ['required_with:declinaisons', 'integer', 'min:0'],
        ], [
            'categorie_id.required' => 'La catégorie est obligatoire.',
            'categorie_id.exists' => "La catégorie sélectionnée n'existe pas.",
            'nom.required' => 'Le nom du produit est obligatoire.',
            'nom.max' => 'Le nom ne doit pas dépasser 255 caractères.',
            'prix.required' => 'Le prix est obligatoire.',
            'prix.numeric' => 'Le prix doit être un nombre valide (décimales autorisées).',
            'prix.min' => 'Le prix ne peut pas être négatif.',
            'prix_promo.numeric' => 'Le prix promotionnel doit être un nombre valide.',
            'prix_promo.min' => 'Le prix promotionnel ne peut pas être négatif.',
            'reduction_pourcentage.numeric' => 'Le pourcentage de réduction doit être un nombre.',
            'reduction_pourcentage.min' => 'Le pourcentage de réduction doit être entre 1 et 99.',
            'reduction_pourcentage.max' => 'Le pourcentage de réduction doit être entre 1 et 99.',
            'quantite.integer' => 'La quantité doit être un nombre entier.',
            'quantite.min' => 'La quantité ne peut pas être négative.',
            'reference.unique' => 'Cette référence est déjà utilisée par un autre produit.',
            'declinaisons.*.valeur.required_with' => 'Chaque déclinaison doit avoir une valeur (pointure, taille...).',
            'declinaisons.*.quantite.required_with' => 'Chaque déclinaison doit avoir une quantité.',
            'declinaisons.*.quantite.integer' => 'La quantité de la déclinaison :position doit être un nombre entier.',
            'declinaisons.*.quantite.min' => 'La quantité de la déclinaison :position ne peut pas être négative.',
        ]);

        // Un pourcentage envoyé se convertit en prix promo — seul prix_promo est stocké
        if (! empty($data['reduction_pourcentage'])) {
            $data['prix_promo'] = round($data['prix'] * (1 - $data['reduction_pourcentage'] / 100), 2);
        }
        unset($data['reduction_pourcentage']);

        $data['slug'] = Str::slug($data['nom']);

        $slugDeBase = $data['slug'];
        $compteur = 1;
        while (
            Produit::where('slug', $data['slug'])
                ->when($produit, fn ($q) => $q->whereKeyNot($produit->id))
                ->exists()
        ) {
            $data['slug'] = "{$slugDeBase}-{$compteur}";
            $compteur++;
        }

        return $data;
    }
}
