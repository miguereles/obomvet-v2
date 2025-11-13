<?php

namespace App\Notifications;

use App\Models\Emergencia;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use NotificationChannels\WebPush\WebPushMessage;
use Illuminate\Contracts\Queue\ShouldQueue;

class EmergenciaPushNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public Emergencia $emergencia)
    {
    }

    public function via($notifiable)
    {
        return ['broadcast'];
    }

    public function toWebPush($notifiable, $notification)
    {
        return (new WebPushMessage)
            ->title('🚨 Nova Emergência!')
            ->body("{$this->emergencia->descricao_sintomas}")
            ->action('Ver Detalhes', 'abrir_emergencia')
            ->data(['emergencia_id' => $this->emergencia->id]);
    }
}