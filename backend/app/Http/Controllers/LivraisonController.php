<?php

namespace App\Http\Controllers;

use App\Models\Commande;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class LivraisonController extends Controller
{
    public function enregistrer(Request $request, Commande $commande)
    {
        if ($commande->statut === 'annulee') {
            return response()->json([
                'message' => "Impossible de modifier la livraison d'une commande annulée.",
            ], 422);
        }

        $data = $request->validate([
            'nom_complet' => ['required', 'string', 'max:255'],
            'telephone' => ['required', 'string', 'max:30'],
            'adresse' => ['required', 'string', 'max:500'],
            'ville' => ['required', 'string', 'max:255'],
            'statut' => ['sometimes', Rule::in(['en_attente', 'en_cours', 'livree', 'echouee'])],
            'date_prevue' => ['nullable', 'date'],
            'date_reelle' => ['nullable', 'date'],
        ], [
            'nom_complet.required' => 'Le nom complet du destinataire est obligatoire.',
            'telephone.required' => 'Le téléphone du destinataire est obligatoire.',
            'adresse.required' => "L'adresse de livraison est obligatoire.",
            'ville.required' => 'La ville est obligatoire.',
            'statut.in' => "Le statut de livraison choisi n'est pas valide.",
            'date_prevue.date' => "La date prévue n'est pas une date valide.",
            'date_reelle.date' => "La date de livraison réelle n'est pas une date valide.",
        ]);

        $statut = $data['statut'] ?? 'en_attente';

        if (in_array($statut, ['en_cours', 'livree']) && $commande->statut === 'en_attente') {
            return response()->json([
                'message' => "Valide d'abord la commande avant de la marquer en cours de livraison ou livrée.",
            ], 422);
        }

        if ($statut === 'livree' && empty($data['date_reelle'])) {
            $data['date_reelle'] = now()->toDateString();
        }

        $livraison = DB::transaction(function () use ($commande, $data, $statut) {
            $livraison = $commande->livraison()->updateOrCreate([], $data);

            if ($statut === 'en_cours' && $commande->statut === 'confirmee') {
                $commande->update(['statut' => 'expediee']);
            } elseif ($statut === 'livree' && in_array($commande->statut, ['confirmee', 'expediee'])) {
                $commande->update(['statut' => 'livree']);
            }

            return $livraison;
        });

        return response()->json($livraison, 200);
    }
}