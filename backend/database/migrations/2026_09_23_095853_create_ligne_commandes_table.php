<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lignes_commande', function (Blueprint $table) {
            $table->id();
            $table->foreignId('commande_id')->constrained('commandes')->cascadeOnDelete();
            $table->foreignId('produit_id')->nullable()->constrained('produits')->nullOnDelete();
            $table->foreignId('declinaison_id')->nullable()->constrained('declinaisons_produits')->nullOnDelete();
            $table->string('declinaison_valeur')->nullable();
            $table->string('nom_produit'); // copie figée, ex. "Hoka Noir — Pointure 42"
            $table->decimal('prix_unitaire', 10, 2);
            $table->integer('quantite');
            $table->decimal('sous_total', 10, 2);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lignes_commande');
    }
};
