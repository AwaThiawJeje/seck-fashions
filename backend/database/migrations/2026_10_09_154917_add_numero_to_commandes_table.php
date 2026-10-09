<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('commandes', function (Blueprint $table) {
            $table->unsignedInteger('numero')->nullable()->unique()->after('id');
        });

        // Numéro affiché au client/vendeur, distinct de l'id technique — attribué
        // ici dans l'ordre de création pour les commandes déjà existantes.
        DB::table('commandes')->orderBy('id')->pluck('id')->each(function ($id, $index) {
            DB::table('commandes')->where('id', $id)->update(['numero' => $index + 1]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('commandes', function (Blueprint $table) {
            $table->dropColumn('numero');
        });
    }
};
