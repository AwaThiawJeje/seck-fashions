<?php

namespace App\Http\Controllers;

use App\Models\ImageProduit;
use App\Models\Produit;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Intervention\Image\ImageManager;

class ImageProduitController extends Controller
{
    /**
     * Convertit l'image envoyée en WebP avant de la stocker — quel que soit le format
     * d'origine (jpg, png...), on ne garde que du WebP sur le disque : fichiers plus
     * légers, chargement plus rapide du catalogue, sans rien demander à l'admin.
     */
    private function convertirEtStocker(UploadedFile $fichier, string $dossier): string
    {
        $image = ImageManager::gd()->read($fichier);
        $chemin = "{$dossier}/" . Str::random(40) . '.webp';

        Storage::disk('public')->put($chemin, (string) $image->toWebp(82));

        return $chemin;
    }

    public function index(Produit $produit)
    {
        return response()->json(
            $produit->images()->orderBy('ordre')->get()
        );
    }

    public function store(Request $request, Produit $produit)
    {
        $data = $request->validate([
            'images' => ['required', 'array', 'min:1'],
            'images.*' => ['image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ], [
            'images.required' => 'Sélectionne au moins une image à envoyer.',
            'images.array' => "Le format envoyé n'est pas valide.",
            'images.min' => 'Sélectionne au moins une image à envoyer.',
            'images.*.image' => 'Le fichier doit être une image.',
            'images.*.mimes' => 'Le fichier doit être au format jpg, jpeg, png ou webp.',
            'images.*.max' => 'Le fichier dépasse la taille maximale autorisée (5 Mo).',
        ]);

        $prochainOrdre = ($produit->images()->max('ordre') ?? -1) + 1;

        $images = collect($data['images'])->map(function ($fichier, $index) use ($produit, $prochainOrdre) {
            $chemin = $this->convertirEtStocker($fichier, "produits/{$produit->id}");

            return $produit->images()->create([
                'chemin' => $chemin,
                'ordre' => $prochainOrdre + $index,
            ]);
        });

        return response()->json($images, 201);
    }

    public function show(ImageProduit $image)
    {
        return response()->json($image->load('produit'));
    }

    public function update(Request $request, ImageProduit $image)
    {
        $data = $request->validate([
            'image' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ], [
            'image.required' => 'Sélectionne une image de remplacement.',
            'image.image' => 'Le fichier envoyé doit être une image.',
            'image.mimes' => 'Le fichier doit être au format jpg, jpeg, png ou webp.',
            'image.max' => 'Le fichier dépasse la taille maximale autorisée (5 Mo).',
        ]);

        Storage::disk('public')->delete($image->chemin);

        $image->update([
            'chemin' => $this->convertirEtStocker($data['image'], "produits/{$image->produit_id}"),
        ]);

        return response()->json($image->fresh());
    }

    public function reorder(Request $request, Produit $produit)
    {
        $data = $request->validate([
            'ordre' => ['required', 'array'],
            'ordre.*' => ['integer', 'exists:images_produits,id'],
        ], [
            'ordre.required' => "L'ordre des images est obligatoire.",
            'ordre.*.exists' => "L'image en position :position n'existe pas.",
        ]);

        foreach ($data['ordre'] as $position => $imageId) {
            ImageProduit::where('id', $imageId)
                ->where('produit_id', $produit->id)
                ->update(['ordre' => $position]);
        }

        return response()->json(
            $produit->images()->orderBy('ordre')->get()
        );
    }

    public function destroy(ImageProduit $image)
    {
        Storage::disk('public')->delete($image->chemin);
        $image->delete();

        return response()->json(null, 204);
    }
}