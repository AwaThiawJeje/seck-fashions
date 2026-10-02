<?php

use App\Http\Controllers\CategorieController;
use App\Http\Controllers\CommandeController;
use App\Http\Controllers\DeclinaisonProduitController;
use App\Http\Controllers\FavoriController;
use App\Http\Controllers\ImageProduitController;
use App\Http\Controllers\ProduitController;
use App\Http\Controllers\LivraisonController;
use App\Http\Controllers\ParametreController;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum'])->get('/user', function (Request $request) {
    return $request->user();
});

/*
|--------------------------------------------------------------------------
| Public : lecture du catalogue
|--------------------------------------------------------------------------
*/
Route::get('/categories', [CategorieController::class, 'index']);
Route::get('/categories/{categorie}', [CategorieController::class, 'show']);

Route::get('/produits', [ProduitController::class, 'index']);
Route::get('/produits/{produit}', [ProduitController::class, 'show']);
Route::get('/produits/{produit}/declinaisons', [DeclinaisonProduitController::class, 'index']);
Route::get('/produits/{produit}/images', [ImageProduitController::class, 'index']);

Route::get('/parametres', [ParametreController::class, 'index']);

// Création de commande : invité ou client connecté (limitée pour éviter le spam)
Route::post('/commandes', [CommandeController::class, 'store'])->middleware('throttle:10,1');

/*
|--------------------------------------------------------------------------
| Client connecté
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/favoris', [FavoriController::class, 'index']);
    Route::post('/favoris', [FavoriController::class, 'store']);
    Route::post('/favoris/sync', [FavoriController::class, 'sync']);
    Route::delete('/favoris/{produit}', [FavoriController::class, 'destroy']);

    Route::get('/mes-commandes', [CommandeController::class, 'mesCommandes']);
    Route::get('/mes-commandes/{commande}', [CommandeController::class, 'show']);
});

/*
|--------------------------------------------------------------------------
| Admin uniquement
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {
    // Catégories
    Route::post('/categories', [CategorieController::class, 'store']);
    Route::put('/categories/{categorie}', [CategorieController::class, 'update']);
    Route::delete('/categories/{categorie}', [CategorieController::class, 'destroy']);

    // Produits
    Route::post('/produits', [ProduitController::class, 'store']);
    Route::put('/produits/{produit}', [ProduitController::class, 'update']);
    Route::delete('/produits/{produit}', [ProduitController::class, 'destroy']);
    Route::patch('/produits/{produit}/prix', [ProduitController::class, 'modifierPrix']);
    
    // Déclinaisons (pointures, tailles...)
    Route::post('/produits/{produit}/declinaisons', [DeclinaisonProduitController::class, 'store']);
    Route::put('/declinaisons/{declinaison}', [DeclinaisonProduitController::class, 'update']);
    Route::delete('/declinaisons/{declinaison}', [DeclinaisonProduitController::class, 'destroy']);

    // Images
    Route::post('/produits/{produit}/images', [ImageProduitController::class, 'store']);
    Route::put('/produits/{produit}/images/reorder', [ImageProduitController::class, 'reorder']);
    Route::post('/images/{image}', [ImageProduitController::class, 'update']); // POST volontaire, voir note 3
    Route::delete('/images/{image}', [ImageProduitController::class, 'destroy']);

    // Commandes
    Route::get('/commandes', [CommandeController::class, 'index']);
    Route::get('/commandes/{commande}', [CommandeController::class, 'show']);
    Route::put('/commandes/{commande}/valider', [CommandeController::class, 'valider']);
    Route::put('/commandes/{commande}/annuler', [CommandeController::class, 'annuler']);
    Route::put('/commandes/{commande}/livraison', [LivraisonController::class, 'enregistrer']);
    Route::post('/commandes/manuelle', [CommandeController::class, 'storeManuelle']);
});