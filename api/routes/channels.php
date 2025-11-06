<?php

use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Log;

Broadcast::channel('clinicas', function ($user) {
    Log::info('Tentativa de inscrição no canal clinicas', [
        'user_id' => $user->id ?? null,
        'tipo' => $user->tipo ?? 'não definido',
        'ip' => request()->ip()
    ]);
    
    if (!$user) {
        Log::warning('Usuário não autenticado tentando acessar canal clinicas');
        return false;
    }
    
    return $user->tipo === 'clinica';
});

Broadcast::channel('emergencias', function ($user) {
    Log::info('Tentativa de inscrição no canal emergencias', [
        'user_id' => $user->id ?? null,
        'tipo' => $user->tipo ?? 'não definido'
    ]);
    
    if (!$user) {
        Log::warning('Usuário não autenticado tentando acessar canal emergencias');
        return false;
    }
    
    return $user->tipo === 'clinica' || $user->tipo === 'veterinario';
});

Broadcast::channel('veterinarios', function ($user) {
    Log::info('Tentativa de inscrição no canal veterinarios', [
        'user_id' => $user->id ?? null,
        'tipo' => $user->tipo ?? 'não definido'
    ]);
    
    if (!$user) {
        Log::warning('Usuário não autenticado tentando acessar canal veterinarios');
        return false;
    }
    
    return $user->tipo === 'veterinario';
});

Broadcast::channel('tutores', function ($user) {
    Log::info('Tentativa de inscrição no canal tutores', [
        'user_id' => $user->id ?? null,
        'tipo' => $user->tipo ?? 'não definido'
    ]);
    
    if (!$user) {
        Log::warning('Usuário não autenticado tentando acessar canal tutores');
        return false;
    }
    Broadcast::routes(['middleware' => ['auth:api']]);
    return $user->tipo === 'tutor';
});