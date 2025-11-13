<?php

namespace App\Events;

use App\Models\Emergencia;
use Illuminate\Broadcasting\Channel;
use Illuminate\Queue\SerializesModels;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Broadcasting\PrivateChannel;

class EmergenciaAtualizada implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $emergencia;

    /**
     * Cria uma nova instância do evento.
     */
    public function __construct(Emergencia $emergencia)
    {
        // Garante que todas as relações necessárias estão carregadas
        $this->emergencia = $emergencia->loadMissing(['tutor', 'clinica', 'pet']);
    }

    /**
     * [MÉTODO CORRIGIDO]
     * Define os canais de broadcast.
     */
    public function broadcastOn()
    {
        $canais = [];

        // 1. Canal para a Clínica
        if ($this->emergencia->clinica_id) {
            $canais[] = new PrivateChannel('emergencias.clinica.' . $this->emergencia->clinica_id);
        }
        
        // 2. Canal para o Tutor
        if ($this->emergencia->tutor_id) {
            $canais[] = new PrivateChannel('emergencias.tutor.' . $this->emergencia->tutor_id);
        }

        // 3. ✅ CORREÇÃO: Adiciona o canal para o Veterinário
        if ($this->emergencia->veterinario_id) {
            $canais[] = new PrivateChannel('veterinario.' . $this->emergencia->veterinario_id);
        }
        
        // 4. Canal público (para anônimos) se o UUID existir
        if (!empty($this->emergencia->public_uuid)) {
            $canais[] = new Channel('emergencia.publica.' . $this->emergencia->public_uuid);
        }

        return $canais;
    }

    /**
     * [MÉTODO CORRIGIDO]
     * Nome do evento no frontend (ouvinte no Pusher/Echo).
     */
    public function broadcastAs()
    {
        // ✅ CORREÇÃO: O frontend escuta ".emergencia.atualizada" (minúsculo)
        return 'emergencia.atualizada';
    }

    /**
     * [MÉTODO CORRIGIDO]
     * Dados enviados no broadcast.
     */
    public function broadcastWith()
    {
        // ✅ CORREÇÃO: O frontend espera um objeto { emergencia: { ... } }
        // E também precisa de todos os campos que a view 'emergenciasVet.tsx' utiliza.
        return [
            'emergencia' => [
                'id' => $this->emergencia->id,
                'status' => $this->emergencia->status,
                'visita_tipo' => $this->emergencia->visita_tipo,
                'descricao_caso' => $this->emergencia->descricao_caso ?? $this->emergencia->descricao_sintomas,
                'gravidade' => $this->emergencia->gravidade,
                'endereco' => $this->emergencia->endereco,
                'lat' => $this->emergencia->lat,
                'lng' => $this->emergencia->lng,
                'nome_tutor' => $this->emergencia->nome_tutor, // fallback para anônimo
                'telefone_tutor' => $this->emergencia->telefone_tutor, // fallback para anônimo
                'clinica' => [
                    'id' => $this->emergencia->clinica->id ?? null,
                    'nome' => $this->emergencia->clinica->nome_fantasia ?? 'Clínica',
                ],
                'tutor' => [
                    'id' => $this->emergencia->tutor->id ?? null,
                    'nome_completo' => $this->emergencia->tutor->nome_completo ?? null,
                    'telefone_principal' => $this->emergencia->tutor->telefone_principal ?? null,
                ],
                'pet' => [
                    'id' => $this->emergencia->pet->id ?? null,
                    'nome' => $this->emergencia->pet->nome ?? null,
                    'especie' => $this->emergencia->pet->especie ?? null,
                    'raca' => $this->emergencia->pet->raca ?? null,
                ],
                'data_conclusao' => $this->emergencia->data_conclusao,
                'created_at' => $this->emergencia->created_at,
                'updated_at' => $this->emergencia->updated_at,
            ]
        ];
    }
}