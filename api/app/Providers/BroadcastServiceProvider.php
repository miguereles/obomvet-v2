<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Broadcast;
class BroadcastServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        Broadcast::routes([
            'middleware' => [
                \Illuminate\Http\Middleware\HandleCors::class,
                \App\Http\Middleware\ValidateBroadcastingAuth::class
            ],
            'prefix' => 'api'
        ]);

        require base_path('routes/channels.php');
    }
}
