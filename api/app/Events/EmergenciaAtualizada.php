<?php

namespace App\Events;

use App\Models\Emergencia;
use Illuminate\Broadcasting\Channel;
use Illuminate\Queue\SerializesModels;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Broadcasting\PrivateChannel; // [LINHA ADICIONADA]

class EmergenciaAtualizada implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $emergencia;

    /**
     * Cria uma nova instância do evento.
     */
    public function __construct(Emergencia $emergencia)
    {
        $this->emergencia = $emergencia->load(['tutor', 'clinica', 'pet']);
    }

    /**
     * [MÉTODO CORRIGIDO]
     * Canal de broadcast — envia para canais PRIVADOS (para logados)
     * E para o canal PÚBLICO (para anónimos) se o UUID existir.
     */
    public function broadcastOn()
    {
        // 1. Canais privados para utilizadores logados (Tutor e Clínica)
        //    Isto corrige o bug de "não atualizar" para utilizadores logados.
        $canais = [
            new PrivateChannel('emergencias.clinica.' . $this->emergencia->clinica_id),
            new PrivateChannel('emergencias.tutor.' . $this->emergencia->tutor_id),
        ];

        // 2. [LÓGICA ADICIONADA]
        //    Se esta emergência tiver um UUID público (criado no Controller),
        //    transmite também para o canal público para o utilizador anónimo.
        if (!empty($this->emergencia->public_uuid)) {
            $canais[] = new Channel('emergencia.publica.' . $this->emergencia->public_uuid);
        }

        return $canais;
    }

    /**
     * Nome do evento no frontend (ouvinte no Pusher/Echo).
     */
    public function broadcastAs()
    {
        return 'EmergenciaAtualizada';
    }

    /**
     * Dados enviados no broadcast.
     */
    public function broadcastWith()
    {
        return [
            'id' => $this->emergencia->id,
            'status' => $this->emergencia->status,
            'visita_tipo' => $this->emergencia->visita_tipo,
            'descricao_sintomas' => $this->emergencia->descricao_sintomas,
            'clinica' => [
                'id' => $this->emergencia->clinica->id ?? null,
                'nome' => $this->emergencia->clinica->nome_fantasia ?? 'Clínica',
            ],
            'tutor' => [
                'id' => $this->emergencia->tutor->id ?? null,
                'nome' => $this->emergencia->tutor->nome ?? 'Tutor', // [NOTA] O seu controller cria 'nome_completo', o evento envia 'nome'
            ],
            'pet' => [
                'id' => $this->emergencia->pet->id ?? null,
                'nome' => $this->emergencia->pet->nome ?? null,
            ],
            'data_conclusao' => $this->emergencia->data_conclusao,
            'updated_at' => $this->emergencia->updated_at,
        ];
    }
}