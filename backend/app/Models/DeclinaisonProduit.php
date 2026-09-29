<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DeclinaisonProduit extends Model
{
    use HasFactory;
    
    protected $table = 'declinaisons_produits';

    protected $fillable = [
        'produit_id',
        'valeur',
        'quantite',
    ];

    public function produit()
    {
        return $this->belongsTo(Produit::class);
    }

    public function lignesCommande()
    {
        return $this->hasMany(LigneCommande::class, 'declinaison_id');
    }

    public function commandesEnAttente()
    {
        return Commande::where('statut', 'en_attente')
            ->whereHas('lignes', fn ($q) => $q->where('declinaison_id', $this->id));
    }
}
