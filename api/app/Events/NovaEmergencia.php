<?php

namespace App\Events;

use App\Models\Emergencia;
use Illuminate\Broadcasting\Channel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Queue\SerializesModels;
use Illuminate\Broadcasting\PrivateChannel; // Importação correta
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Broadcasting\InteractsWithSockets;

class NovaEmergencia implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $emergencia;

    public function __construct(Emergencia $emergencia)
    {
        // Load related data so they can be serialized in the broadcast payload
        $this->emergencia = $emergencia->load(['tutor', 'clinica', 'pet']);
    }

    public function broadcastOn()
    {
        // Broadcast to a per-clinic private channel when possible so only the target clinic receives the event.
        // Lógica correta que você forneceu:
        $channel = 'clinicas';
        if ($this->emergencia && $this->emergencia->clinica_id) {
            $channel = 'clinicas.' . $this->emergencia->clinica_id;
        }
        return new PrivateChannel($channel); // Usa PrivateChannel
    }

    public function broadcastAs() 
    { 
        return 'NovaEmergencia'; 
    }

    public function broadcastWith()
    {
        // Payload detalhado que você forneceu
        return [
            'id' => $this->emergencia->id,
            'descricao_sintomas' => $this->emergencia->descricao_sintomas,
            'status' => $this->emergencia->status,
            'nivel_urgencia' => $this->emergencia->nivel_urgencia,
            'visita_tipo' => $this->emergencia->visita_tipo,
            'localizacao' => $this->emergencia->localizacao,
            'clinica_id' => $this->emergencia->clinica_id,
            'veterinario_id' => $this->emergencia->veterinario_id,
            'pet_id' => $this->emergencia->pet_id,
            'tutor_id' => $this->emergencia->tutor_id,
            'created_at' => $this->emergencia->created_at,
            'updated_at' => $this->emergencia->updated_at,
            // Include related data if loaded
            'pet' => $this->emergencia->pet ? [
                'id' => $this->emergencia->pet->id,
                'nome' => $this->emergencia->pet->nome,
            ] : null,
            'tutor' => $this->emergencia->tutor ? [
                'id' => $this->emergencia->tutor->id,
                'nome_completo' => $this->emergencia->tutor->nome_completo,
            ] : null,
            'clinica' => $this->emergencia->clinica ? [
                'id' => $this->emergencia->clinica->id,
                'nome_fantasia' => $this->emergencia->clinica->nome_fantasia,
            ] : null,
        ];
    }
}