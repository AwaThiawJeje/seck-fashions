<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PanierLigne extends Model
{
    protected $table = 'panier_lignes';

    protected $fillable = ['user_id', 'produit_id', 'declinaison_id', 'quantite'];
}