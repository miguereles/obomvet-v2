<?php

namespace App\Providers;

use Illuminate\Auth\Events\Registered;
use Illuminate\Auth\Listeners\SendEmailVerificationNotification;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Event;

class EventServiceProvider extends ServiceProvider
{
    /**
     * Os mapeamentos de ouvinte de evento para a aplicação.
     *
     * @var array
     */
    protected $listen = [
        Registered::class => [
            SendEmailVerificationNotification::class,
        ],

        // ✅ Ligando Evento 'NovaEmergencia' ao seu Listener
        \App\Events\NovaEmergencia::class => [
            \App\Listeners\NotifyClinicaNovaEmergencia::class,
        ],

        // ✅ Ligando Evento 'EmergenciaAtualizada' ao seu Listener
        \App\Events\EmergenciaAtualizada::class => [
            \App\Listeners\NotifyTutorEmergenciaAtualizada::class,
        ],
    ];

    /**
     * Registra quaisquer eventos para sua aplicação.
     */
    public function boot(): void
    {
        //
    }

    /**
     * Determina se os eventos e ouvintes devem ser descobertos automaticamente.
     */
    public function shouldDiscoverEvents(): bool
    {
        return false;
    }
}