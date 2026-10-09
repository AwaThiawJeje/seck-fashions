<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ProduitSupprime implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public int $produitId)
    {
    }

    public function broadcastOn(): array
    {
        return [new Channel('produits')];
    }

    public function broadcastAs(): string
    {
        return 'produit.supprime';
    }

    public function broadcastWith(): array
    {
        return ['id' => $this->produitId];
    }
}
