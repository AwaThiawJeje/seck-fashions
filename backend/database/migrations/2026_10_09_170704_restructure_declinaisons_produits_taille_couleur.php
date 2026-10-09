<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Passe d'un seul champ "valeur" (taille OU couleur, jamais les deux) à deux
     * champs croisables "taille" et "couleur_nom" : un produit peut désormais
     * combiner les deux axes (ex: "Rouge" + "38"), chaque combinaison ayant son
     * propre stock.
     */
    public function up(): void
    {
        Schema::table('declinaisons_produits', function (Blueprint $table) {
            $table->string('taille')->nullable()->after('produit_id');
            $table->string('couleur_nom')->nullable()->after('couleur');
        });

        // Toutes les déclinaisons existantes sont, à ce jour, des tailles/pointures
        // simples : on les bascule telles quelles sur le nouveau champ "taille".
        DB::table('declinaisons_produits')->update(['taille' => DB::raw('valeur')]);

        // Le nouvel index unique doit exister AVANT qu'on supprime l'ancien : MySQL
        // refuse de retirer l'index sur (produit_id, valeur) tant qu'aucun autre
        // index ne reste disponible pour la clé étrangère produit_id.
        Schema::table('declinaisons_produits', function (Blueprint $table) {
            $table->unique(['produit_id', 'taille', 'couleur_nom']);
        });

        Schema::table('declinaisons_produits', function (Blueprint $table) {
            $table->dropUnique(['produit_id', 'valeur']);
            $table->dropColumn('valeur');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('declinaisons_produits', function (Blueprint $table) {
            $table->dropUnique(['produit_id', 'taille', 'couleur_nom']);
            $table->string('valeur')->nullable()->after('produit_id');
        });

        DB::table('declinaisons_produits')->update(['valeur' => DB::raw('taille')]);

        Schema::table('declinaisons_produits', function (Blueprint $table) {
            $table->dropColumn(['taille', 'couleur_nom']);
            $table->unique(['produit_id', 'valeur']);
        });
    }
};
