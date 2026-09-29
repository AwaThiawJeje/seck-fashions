<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LigneCommande extends Model
{
    use HasFactory;

    // La migration crée la table 'lignes_commande' (et non 'ligne_commandes',
    // le nom que Eloquent devinerait par convention) : sans ceci, toute requête
    // sur ce modèle échoue avec "table doesn't exist".
    protected $table = 'lignes_commande';

    protected $fillable = [
        'commande_id',
        'produit_id',
        'declinaison_id',
        'declinaison_valeur',
        'nom_produit',
        'prix_unitaire',
        'quantite',
        'sous_total',
    ];

    public function commande()
    {
        return $this->belongsTo(Commande::class);
    }

    public function produit()
    {
        return $this->belongsTo(Produit::class);
    }

    public function declinaison()
    {
        return $this->belongsTo(DeclinaisonProduit::class, 'declinaison_id');
    }
}
