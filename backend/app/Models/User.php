<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    // 'role' n'est volontairement pas ici : impossible de l'attribuer par masse depuis une requête
    protected $fillable = [
        'name',
        'email',
        'telephone',
        'password',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function commandes()
    {
        return $this->hasMany(Commande::class);
    }

    public function favoris()
    {
        return $this->hasMany(Favori::class);
    }
}