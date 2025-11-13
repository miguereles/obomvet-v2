<?php

namespace App\Listeners;

use App\Events\NovaEmergencia;
use App\Models\Clinica;
use App\Notifications\EmergenciaPushNotification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;

class NotifyClinicaNovaEmergencia implements ShouldQueue
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
     * Manipula o evento.
     */
    public function handle(NovaEmergencia $event)
    {
        $emergencia = $event->emergencia;
        
        // O evento 'NovaEmergencia' já tem o clinica_id
        $clinica = Clinica::find($emergencia->clinica_id);

        if (!$clinica) {
            Log::warning("Listener NotifyClinica: Emergência {$emergencia->id} com clinica_id inválido.");
            return;
        }

        // Assume que o Model Clinica tem a relação 'usuario()'
        // como definido em app/Models/Clinica.php
        $usuarioClinica = $clinica->usuario; 

        if (!$usuarioClinica) {
            Log::warning("Listener NotifyClinica: Clínica {$clinica->id} sem usuário associado.");
            return;
        }

        // Verifica se o usuário da clínica tem uma assinatura de push
        if ($usuarioClinica->push_subscription) {
            try {
                // Usa a notificação que você já criou
                $usuarioClinica->notify(new EmergenciaPushNotification($emergencia));
            } catch (\Exception $e) {
                Log::error('Falha ao enviar Push para Clínica: ' . $e->getMessage(), [
                    'user_id' => $usuarioClinica->id,
                    'emergencia_id' => $emergencia->id
                ]);
            }
        }
    }
}