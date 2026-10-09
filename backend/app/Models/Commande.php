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

    protected static function booted(): void
    {
        // Numéro séquentiel affiché au client/vendeur — jamais l'id technique,
        // pour ne pas exposer de donnée interne et rester stable dans le temps.
        static::creating(function (self $commande) {
            $commande->numero = (self::max('numero') ?? 0) + 1;
        });
    }

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
