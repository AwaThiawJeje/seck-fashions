<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('livraisons', function (Blueprint $table) {
            $table->id();
            $table->foreignId('commande_id')->constrained('commandes')->cascadeOnDelete();
            $table->string('nom_complet');
            $table->string('telephone');
            $table->string('adresse');
            $table->string('ville');
            $table->enum('statut', ['en_attente', 'en_cours', 'livree', 'echouee'])->default('en_attente');
            $table->date('date_prevue')->nullable();
            $table->date('date_reelle')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('livraisons');
    }
};
