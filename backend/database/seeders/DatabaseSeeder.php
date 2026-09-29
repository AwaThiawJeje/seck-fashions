<?php

namespace Database\Seeders;

use App\Models\Categorie;
use App\Models\Produit;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        if (! User::where('email', 'admin@test.com')->exists()) {
            User::forceCreate([
                'name' => 'Admin',
                'email' => 'admin@test.com',
                'password' => bcrypt('password'),
                'role' => 'admin',
            ]);
        }

        // Catégories : deux racines avec des sous-catégories
        $chaussures = Categorie::create(['nom' => 'Chaussures', 'slug' => 'chaussures']);
        $vetements = Categorie::create(['nom' => 'Vêtements', 'slug' => 'vetements']);

        $sneakers = Categorie::create([
            'nom' => 'Sneakers', 'slug' => 'sneakers', 'categorie_parente_id' => $chaussures->id,
        ]);
        $sandales = Categorie::create([
            'nom' => 'Sandales', 'slug' => 'sandales', 'categorie_parente_id' => $chaussures->id,
        ]);
        $tshirts = Categorie::create([
            'nom' => 'T-shirts', 'slug' => 'tshirts', 'categorie_parente_id' => $vetements->id,
        ]);

        // Produits : quantite = 0 car le stock est porté par les déclinaisons
        $produits = [
            ['cat' => $sneakers, 'nom' => 'Sneaker Noir Classic', 'prix' => 25000, 'mis_en_avant' => true,
                'decl' => ['40' => 5, '41' => 3, '42' => 0, '43' => 2]],
            ['cat' => $sneakers, 'nom' => 'Sneaker Blanc Urban', 'prix' => 27500.50, 'mis_en_avant' => false,
                'decl' => ['39' => 4, '40' => 6, '41' => 1]],
            ['cat' => $sandales, 'nom' => 'Sandale Cuir Marron', 'prix' => 12000, 'mis_en_avant' => false,
                'decl' => ['38' => 2, '39' => 2, '40' => 0]],
            ['cat' => $tshirts, 'nom' => 'T-shirt Coton Uni', 'prix' => 6500, 'mis_en_avant' => true,
                'decl' => ['S' => 10, 'M' => 8, 'L' => 0, 'XL' => 3]],
        ];

        foreach ($produits as $p) {
            $produit = Produit::create([
                'categorie_id' => $p['cat']->id,
                'nom' => $p['nom'],
                'slug' => Str::slug($p['nom']),
                'description' => 'Produit de test.',
                'prix' => $p['prix'],
                'quantite' => 0,
                'disponible' => true,
                'mis_en_avant' => $p['mis_en_avant'],
            ]);

            foreach ($p['decl'] as $valeur => $quantite) {
                $produit->declinaisons()->create([
                    'valeur' => (string) $valeur,
                    'quantite' => $quantite,
                ]);
            }
        }
    }
}