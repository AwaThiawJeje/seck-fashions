<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('declinaisons_produits', function (Blueprint $table) {
            // Code couleur hex (#RRGGBB) quand la déclinaison est une couleur plutôt
            // qu'une taille/pointure — null sinon.
            $table->string('couleur', 7)->nullable()->after('valeur');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('declinaisons_produits', function (Blueprint $table) {
            $table->dropColumn('couleur');
        });
    }
};
