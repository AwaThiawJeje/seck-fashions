<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Categorie extends Model
{
    use HasFactory;

    protected $fillable = [
        'nom',
        'slug',
        'categorie_parente_id',
    ];

    public function parente()
    {
        return $this->belongsTo(Categorie::class, 'categorie_parente_id');
    }

    public function enfants()
    {
        return $this->hasMany(Categorie::class, 'categorie_parente_id');
    }

    public function produits()
    {
        return $this->hasMany(Produit::class);
    }
}
