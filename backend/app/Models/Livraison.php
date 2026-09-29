<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Livraison extends Model
{
    use HasFactory;

    protected $fillable = [
        'commande_id',
        'nom_complet',
        'telephone',
        'adresse',
        'ville',
        'statut',
        'date_prevue',
        'date_reelle',
    ];

    protected $casts = [
        'date_prevue' => 'date',
        'date_reelle' => 'date',
    ];

    public function commande()
    {
        return $this->belongsTo(Commande::class);
    }
}
