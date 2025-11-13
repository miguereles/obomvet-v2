<?php

namespace App\Listeners;

use App\Events\EmergenciaAtualizada;
use App\Notifications\TutorEmergenciaAtualizadaNotification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;

class NotifyTutorEmergenciaAtualizada implements ShouldQueue
{
    use InteractsWithQueue;

    /**
     * Cria o ouvinte de evento.
     */
    public function __construct()
    {
        //
    }

    /**
     * [MÉTODO ATUALIZADO E SIMPLIFICADO]
     * Manipula o evento.
     */
    public function handle(EmergenciaAtualizada $event)
    {
        $emergencia = $event->emergencia;

        // O evento (EmergenciaAtualizada) já carrega o 'tutor'
        $tutor = $emergencia->tutor;
        
        if (!$tutor) {
            Log::warning("Listener NotifyTutor: Emergência {$emergencia->id} sem tutor associado.");
            return;
        }

        // [LÓGICA SIMPLIFICADA]
        // Não precisamos de procurar o 'Usuario'.
        // Apenas dizemos ao 'Tutor' para se notificar.
        // O modelo 'Tutor' (usando o trait 'Notifiable' e o método 
        // 'routeNotificationForWebPush') irá automaticamente encontrar
        // a subscrição correta (seja do 'Tutor' anónimo ou do 'Usuario' logado).
        
        try {
            $tutor->notify(new TutorEmergenciaAtualizadaNotification($emergencia));
        } catch (\Exception $e) {
            // A exceção pode acontecer se a subscrição for inválida
            Log::error('Falha ao enviar Push para Tutor: ' . $e->getMessage(), [
                'tutor_id' => $tutor->id,
                'emergencia_id' => $emergencia->id
            ]);
        }
    }
}