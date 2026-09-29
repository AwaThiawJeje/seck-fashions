<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Produit extends Model
{
    use HasFactory;

    protected $fillable = [
        'categorie_id',
        'nom',
        'slug',
        'description',
        'prix',
        'quantite',
        'disponible',
        'reference',
        'mis_en_avant',
    ];

    protected $casts = [
        'disponible' => 'boolean',
        'mis_en_avant' => 'boolean',
        'prix' => 'decimal:2',
    ];

    public function categorie()
    {
        return $this->belongsTo(Categorie::class);
    }

    public function images()
    {
        return $this->hasMany(ImageProduit::class)->orderBy('ordre');
    }

    public function declinaisons()
    {
        return $this->hasMany(DeclinaisonProduit::class);
    }

    public function lignesCommande()
    {
        return $this->hasMany(LigneCommande::class);
    }

    public function commandesEnAttente()
    {
        return Commande::where('statut', 'en_attente')
            ->whereHas('lignes', fn ($q) => $q->where('produit_id', $this->id));
    }
}
