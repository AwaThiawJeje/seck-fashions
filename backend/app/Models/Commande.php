<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Commande extends Model
{
    use HasFactory;
    
    protected $fillable = [
        'user_id',
        'statut',
        'total',
        'methode_paiement',
        'notes',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function lignes()
    {
        return $this->hasMany(LigneCommande::class);
    }

    public function livraison()
    {
        return $this->hasOne(Livraison::class);
    }
}
