<?php

namespace Database\Seeders;

use App\Models\Categorie;
use App\Models\Produit;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ProduitsReelsSeeder extends Seeder
{
    public function run(): void
    {
        // --- Catégories : l'arbre complet, existantes + nouvelles ---
        $chaussures = Categorie::firstOrCreate(['slug' => 'chaussures'], ['nom' => 'Chaussures']);
        $vetements = Categorie::firstOrCreate(['slug' => 'vetements'], ['nom' => 'Vêtements']);
        $accessoires = Categorie::firstOrCreate(['slug' => 'accessoires'], ['nom' => 'Accessoires']);

        $sneakers = Categorie::firstOrCreate(
            ['slug' => 'sneakers'],
            ['nom' => 'Sneakers', 'categorie_parente_id' => $chaussures->id]
        );
        $sandales = Categorie::firstOrCreate(
            ['slug' => 'sandales'],
            ['nom' => 'Sandales', 'categorie_parente_id' => $chaussures->id]
        );
        $claquettes = Categorie::firstOrCreate(
            ['slug' => 'claquettes'],
            ['nom' => 'Claquettes', 'categorie_parente_id' => $chaussures->id]
        );
        $tshirts = Categorie::firstOrCreate(
            ['slug' => 'tshirts'],
            ['nom' => 'T-shirts', 'categorie_parente_id' => $vetements->id]
        );
        $shorts = Categorie::firstOrCreate(
            ['slug' => 'shorts'],
            ['nom' => 'Shorts', 'categorie_parente_id' => $vetements->id]
        );
        $sacs = Categorie::firstOrCreate(
            ['slug' => 'sacs'],
            ['nom' => 'Sacs', 'categorie_parente_id' => $accessoires->id]
        );

        // --- Produits : prix et quantités en PLACEHOLDER, à corriger toi-même ---
        $produits = [
            [
                'nom' => 'Sac à dos Sport noir et rose',
                'cat' => $sacs, 'prix' => 15000, 'prix_promo' => 12900, 'quantite' => 8,
                'images' => ['sac-a-dos-noir-rose-1.jpg'],
            ],
            [
                'nom' => 'Crocs Classic noir NBA',
                'cat' => $claquettes, 'prix' => 13000, 'prix_promo' => 10900,
                'images' => ['crocs-noir-nba-1.jpg'],
                'decl' => ['38' => 3, '39' => 3, '40' => 3, '41' => 3, '42' => 3, '43' => 2, '44' => 2],
            ],
            [
                'nom' => 'Short en jean délavé multi-patchs',
                'cat' => $shorts, 'prix' => 12000,
                'images' => ['short-denim-patches-1.jpg'],
                'decl' => ['S' => 3, 'M' => 3, 'L' => 3, 'XL' => 2],
            ],
            [
                'nom' => 'T-shirt DUAA Nonstop',
                'cat' => $tshirts, 'prix' => 8000, 'prix_promo' => 6900,
                'images' => ['tshirt-duaa-nonstop-1.jpg'],
                'decl' => ['S' => 5, 'M' => 5, 'L' => 5, 'XL' => 3],
            ],
            [
                'nom' => 'T-shirt First Row strass',
                'cat' => $tshirts, 'prix' => 9500,
                'images' => ['tshirt-first-row-1.jpg'],
                'decl' => ['S' => 4, 'M' => 4, 'L' => 4, 'XL' => 2],
            ],
            [
                'nom' => 'T-shirt Valley Sports',
                'cat' => $tshirts, 'prix' => 8000,
                'images' => ['tshirt-valley-sports-1.jpg'],
                'decl' => ['S' => 4, 'M' => 4, 'L' => 4, 'XL' => 2],
            ],
            [
                // Nom volontairement générique, voir la remarque dans le chat
                'nom' => 'Sac bandoulière bleu motif chevron',
                'cat' => $sacs, 'prix' => 20000, 'quantite' => 3,
                'images' => ['sac-bandouliere-bleu-chevron-1.jpg'],
            ],
            [
                'nom' => 'Sneaker Nike Cortez marron',
                'cat' => $sneakers, 'prix' => 22000,
                'images' => ['sneaker-nike-cortez-marron-1.jpg'],
                'decl' => ['40' => 3, '41' => 3, '42' => 3, '43' => 2, '44' => 2],
            ],
            [
                'nom' => 'Sneaker Air Jordan 3 bleu',
                'cat' => $sneakers, 'prix' => 25000, 'prix_promo' => 20900,
                'images' => ['sneaker-jordan-3-bleu-1.jpg'],
                'decl' => ['40' => 3, '41' => 3, '42' => 3, '43' => 2, '44' => 2],
            ],
            [
                'nom' => 'Sneaker Asics noir',
                'cat' => $sneakers, 'prix' => 24000, 'prix_promo' => 19900,
                'images' => ['sneaker-asics-noir-1.jpg'],
                'decl' => ['40' => 3, '41' => 3, '42' => 3, '43' => 2, '44' => 2],
            ],
            [
                'nom' => 'Sneaker Saucony multicolore',
                'cat' => $sneakers, 'prix' => 20000, 'prix_promo' => 16900,
                'images' => ['sneaker-saucony-multicolore-1.jpg'],
                'decl' => ['38' => 3, '39' => 3, '40' => 3, '41' => 3, '42' => 2, '43' => 2],
            ],
            [
                'nom' => 'Sneaker Saucony blanc et rouge',
                'cat' => $sneakers, 'prix' => 20000,
                'images' => ['sneaker-saucony-blanc-rouge-1.jpg'],
                'decl' => ['38' => 3, '39' => 3, '40' => 3, '41' => 3, '42' => 2, '43' => 2],
            ],
            [
                'nom' => 'Crocs Pollex sabot lavande',
                'cat' => $claquettes, 'prix' => 15000,
                'images' => ['crocs-pollex-lavande-1.jpg'],
                'decl' => ['38' => 3, '39' => 3, '40' => 3, '41' => 3, '42' => 2],
            ],
        ];

        foreach ($produits as $p) {
            $produit = Produit::create([
                'categorie_id' => $p['cat']->id,
                'nom' => $p['nom'],
                'slug' => Str::slug($p['nom']),
                'description' => null,
                'prix' => $p['prix'],
                'prix_promo' => $p['prix_promo'] ?? null,
                'quantite' => $p['quantite'] ?? 0,
                'disponible' => true,
                'mis_en_avant' => false,
            ]);

            foreach ($p['decl'] ?? [] as $valeur => $quantite) {
                $produit->declinaisons()->create([
                    'valeur' => (string) $valeur,
                    'quantite' => $quantite,
                ]);
            }

            foreach ($p['images'] as $ordre => $fichier) {
                $source = database_path('seeders/images/'.$fichier);

                if (! file_exists($source)) {
                    $this->command?->warn("Image introuvable, ignorée : {$fichier}");
                    continue;
                }

                $chemin = "produits/{$produit->id}/{$fichier}";
                Storage::disk('public')->put($chemin, file_get_contents($source));

                $produit->images()->create([
                    'chemin' => $chemin,
                    'ordre' => $ordre,
                ]);
            }
        }
    }
}