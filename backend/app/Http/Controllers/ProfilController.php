<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules;

class ProfilController extends Controller
{
    public function update(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'telephone' => ['required', 'string', 'max:30', Rule::unique('users', 'telephone')->ignore($user->id)],
        ], [
            'name.required' => 'Le nom est obligatoire.',
            'telephone.required' => 'Le numéro de téléphone est obligatoire.',
            'telephone.unique' => 'Ce numéro de téléphone est déjà utilisé par un autre compte.',
        ]);

        $user->update($data);

        return response()->json($user->fresh());
    }

    public function motDePasse(Request $request)
    {
        $data = $request->validate([
            'mot_de_passe_actuel' => ['required', 'current_password'],
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ], [
            'mot_de_passe_actuel.required' => 'Entre ton mot de passe actuel.',
            'mot_de_passe_actuel.current_password' => 'Le mot de passe actuel est incorrect.',
            'password.required' => 'Le nouveau mot de passe est obligatoire.',
            'password.confirmed' => 'Les deux mots de passe ne correspondent pas.',
            'password.min' => 'Le nouveau mot de passe doit contenir au moins 8 caractères.',
        ]);

        $request->user()->update(['password' => $data['password']]);

        return response()->noContent();
    }
}