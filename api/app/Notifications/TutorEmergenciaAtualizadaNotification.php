<?php

namespace App\Notifications;

use App\Models\Emergencia;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use NotificationChannels\WebPush\WebPushMessage;

class TutorEmergenciaAtualizadaNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * Cria uma nova instância da notificação.
     */
    public function __construct(public Emergencia $emergencia)
    {
        // O $emergencia já deve vir carregado do evento/listener
    }

    /**
     * Define o canal de envio (apenas webpush).
     */
    public function via($notifiable)
    {
        return ['webpush'];
    }

    /**
     * Monta a mensagem de Web Push.
     */
    public function toWebPush($notifiable, $notification)
    {
        // Tenta carregar o pet se não estiver carregado, 
        // embora o evento 'EmergenciaAtualizada' já faça isso.
        $this->emergencia->loadMissing('pet');

        $petNome = $this->emergencia->pet->nome ?? 'seu pet';

        // Formata o status para algo legível
        $statusTexto = match ($this->emergencia->status) {
            'accepted', 'em_atendimento' => "Aceita! A clínica aguarda {$petNome}.",
            'concluida' => "Atendimento de {$petNome} concluído.",
            'rejected', 'cancelada' => "Emergência de {$petNome} foi cancelada.",
            'assigned', 'pendente', 'aberta' => "Aguardando aceite da clínica para {$petNome}.",
            default => 'Status atualizado.',
        };

        return (new WebPushMessage)
            ->title('Status da Emergência Atualizado!')
            ->icon('/icon-192x192.png') // Opcional: adicione um ícone
            ->body($statusTexto)
            ->action('Ver Acompanhamento', 'abrir_emergencia') // 'abrir_emergencia' deve ser tratado no seu service worker
            ->data([
                'emergencia_id' => $this->emergencia->id,
                'url' => '/acompanhamento/' . $this->emergencia->id // URL para abrir ao clicar
            ]);
    }
}