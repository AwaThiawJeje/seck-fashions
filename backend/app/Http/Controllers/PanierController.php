<?php

namespace App\Http\Controllers;

use App\Models\DeclinaisonProduit;
use App\Models\Produit;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PanierController extends Controller
{
    public function show(Request $request)
    {
        return response()->json($this->lignesDe($request->user()));
    }

    /**
     * Remplace tout le panier du client connecté par la liste envoyée.
     */
    public function remplacer(Request $request)
    {
        $data = $request->validate([
            'lignes' => ['present', 'array', 'max:100'],
            'lignes.*.produit_id' => ['required', 'integer'],
            'lignes.*.declinaison_id' => ['nullable', 'integer'],
            'lignes.*.quantite' => ['required', 'integer', 'min:1', 'max:999'],
        ], [
            'lignes.max' => 'Le panier contient trop d\'articles différents.',
        ]);

        $lignes = collect($data['lignes']);

        $produitsExistants = Produit::whereIn('id', $lignes->pluck('produit_id'))->pluck('id');
        $produitDeLaDeclinaison = DeclinaisonProduit::whereIn('id', $lignes->pluck('declinaison_id')->filter())
            ->pluck('produit_id', 'id'); // [id de la déclinaison => id du produit]

        // On écarte ce qui n'existe plus (produit supprimé, taille retirée) et on regroupe les doublons.
        $propres = $lignes
            ->filter(function ($ligne) use ($produitsExistants, $produitDeLaDeclinaison) {
                if (! $produitsExistants->contains($ligne['produit_id'])) {
                    return false;
                }

                $declinaisonId = $ligne['declinaison_id'] ?? null;

                return $declinaisonId === null
                    || (int) ($produitDeLaDeclinaison[$declinaisonId] ?? 0) === (int) $ligne['produit_id'];
            })
            ->groupBy(fn ($ligne) => $ligne['produit_id'].'-'.($ligne['declinaison_id'] ?? 0))
            ->map(fn ($groupe) => [
                'produit_id' => (int) $groupe->first()['produit_id'],
                'declinaison_id' => $groupe->first()['declinaison_id'] ?? null,
                'quantite' => min((int) $groupe->sum('quantite'), 999),
            ])
            ->values()
            ->all();

        $user = $request->user();

        DB::transaction(function () use ($user, $propres) {
            $user->panierLignes()->delete();
            $user->panierLignes()->createMany($propres);
        });

        return response()->json($this->lignesDe($user));
    }

    private function lignesDe(User $user)
    {
        return $user->panierLignes()->orderBy('id')->get(['produit_id', 'declinaison_id', 'quantite']);
    }
}