<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DeclinaisonProduit extends Model
{
    use HasFactory;

    protected $table = 'declinaisons_produits';

    protected $fillable = [
        'produit_id',
        'taille',
        'couleur',
        'couleur_nom',
        'quantite',
    ];

    protected $appends = ['label'];

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

    /**
     * Texte affichable combinant les deux axes possibles (ex: "Rouge — 38",
     * "Rouge" seul, ou "38" seul) — utilisé partout où on montre la déclinaison
     * sans avoir à recombiner taille/couleur_nom à chaque endroit.
     */
    protected function label(): Attribute
    {
        return Attribute::make(
            get: fn () => collect([$this->couleur_nom, $this->taille])->filter()->implode(' — '),
        );
    }

    public function scopeOrdonnees($query)
    {
        return $query->orderBy('couleur_nom')->orderBy('taille');
    }
}
