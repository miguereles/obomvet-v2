<?php

namespace App\Events;

use App\Models\Emergencia;
use Illuminate\Broadcasting\Channel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Queue\SerializesModels;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Broadcasting\InteractsWithSockets;

class NovaEmergencia implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $emergencia;

    public function __construct(Emergencia $emergencia)
    {
        $this->emergencia = $emergencia;
    }

    public function broadcastOn()
    {
        // Broadcast to a per-clinic private channel when possible so only the target clinic receives the event.
        $channel = 'clinicas';
        if ($this->emergencia && $this->emergencia->clinica_id) {
            $channel = 'clinicas.' . $this->emergencia->clinica_id;
        }
        return new PrivateChannel($channel);
    }

    public function broadcastAs() 
    { 
        return 'NovaEmergencia'; 
    }

    public function broadcastWith()
    {
        return [
            'id' => $this->emergencia->id,
            'descricao_sintomas' => $this->emergencia->descricao_sintomas,
            'status' => $this->emergencia->status,
            'clinica_id' => $this->emergencia->clinica_id,
            'veterinario_id' => $this->emergencia->veterinario_id,
            'criado_em' => $this->emergencia->created_at,
        ];
    }
}