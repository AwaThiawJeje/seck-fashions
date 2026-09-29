<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class ImageProduit extends Model
{
    use HasFactory;

    protected $table = 'images_produits';

    protected $fillable = [
        'produit_id',
        'chemin',
        'ordre',
    ];

    protected $appends = ['url'];

    protected function url(): Attribute
    {
        return Attribute::make(
            get: fn () => Storage::disk('public')->url($this->chemin),
        );
    }

    public function produit()
    {
        return $this->belongsTo(Produit::class);
    }
}