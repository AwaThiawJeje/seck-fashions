<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('declinaisons_produits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('produit_id')->constrained('produits')->cascadeOnDelete();
            $table->string('valeur'); // ex: "42" (pointure), "L" (taille), "500ml"...
            $table->integer('quantite')->default(0);
            $table->timestamps();

            $table->unique(['produit_id', 'valeur']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('declinaisons_produits');
    }
};