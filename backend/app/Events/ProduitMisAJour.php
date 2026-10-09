<?php

namespace App\Events;

use App\Models\Produit;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Diffusé à chaque création/modification d'un produit (prix, stock, promo,
 * disponibilité...), sur un canal public : le site peut mettre à jour le
 * catalogue en temps réel chez tous les visiteurs, sans qu'ils aient besoin
 * d'être connectés.
 */
class ProduitMisAJour implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Produit $produit)
    {
    }

    public function broadcastOn(): array
    {
        return [new Channel('produits')];
    }

    public function broadcastAs(): string
    {
        return 'produit.maj';
    }

    public function broadcastWith(): array
    {
        return $this->produit->toArray();
    }
}
