<?php

namespace App\Models;

use App\Events\ProduitMisAJour;
use App\Events\ProduitSupprime;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Casts\Attribute;

class Produit extends Model
{
    use HasFactory;

    /**
     * Diffuse en temps réel (Reverb) à chaque création/modification/suppression —
     * couvre à la fois les éditions directes (prix, disponibilité...) et les
     * changements de stock via les déclinaisons, qui appellent `touch()` sur le
     * produit pour déclencher ce même hook plutôt que de dupliquer la diffusion
     * dans chaque contrôleur.
     */
    protected static function booted(): void
    {
        static::saved(function (Produit $produit) {
            broadcast(new ProduitMisAJour(
                $produit->fresh(['categorie', 'images', 'declinaisons'])
            ))->toOthers();
        });

        static::deleted(function (Produit $produit) {
            broadcast(new ProduitSupprime($produit->id))->toOthers();
        });
    }

    protected $fillable = [
        'categorie_id',
        'nom',
        'slug',
        'description',
        'prix',
        'prix_promo',
        'quantite',
        'disponible',
        'reference',
        'mis_en_avant',
    ];

    protected $appends = ['en_promotion', 'pourcentage_reduction'];

    protected $casts = [
        'disponible' => 'boolean',
        'mis_en_avant' => 'boolean',
        'prix' => 'decimal:2',
        'prix_promo' => 'decimal:2',
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

    public function avis()
    {
        return $this->hasMany(Avis::class);
    }

    public function avisValides()
    {
        return $this->hasMany(Avis::class)->where('valide', true);
    }

    public function commandesEnAttente()
    {
        return Commande::where('statut', 'en_attente')
            ->whereHas('lignes', fn ($q) => $q->where('produit_id', $this->id));
    }

    protected function enPromotion(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->prix_promo !== null && (float) $this->prix_promo < (float) $this->prix,
        );
    }

    protected function pourcentageReduction(): Attribute
    {
        return Attribute::make(
            get: function () {
                if (! $this->en_promotion) {
                    return null;
                }

                return (int) round((1 - ((float) $this->prix_promo / (float) $this->prix)) * 100);
            },
        );
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    public function scopeEnVente($query)
    {
        return $query->where('disponible', true)->where(function ($q) {
            $q->where(function ($q2) {
                $q2->whereDoesntHave('declinaisons')->where('quantite', '>', 0);
            })->orWhereHas('declinaisons', fn ($dq) => $dq->where('quantite', '>', 0));
        });
    }
}
