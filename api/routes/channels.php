<?php

use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Log;
use App\Models\Usuario;
use App\Models\Clinica;
use App\Models\Tutor;
use App\Models\Veterinario;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('clinicas.{clinicaId}', function (Usuario $user, $clinicaId) {
    if (!$user->relationLoaded('clinica')) {
        $user->load('clinica');
    }
    
    if ($user->tipo === 'clinica' && $user->clinica && $user->clinica->id == $clinicaId) {
        Log::info("Usuário {$user->id} autorizado para canal clinicas.{$clinicaId}");
        return true;
    }
    
    Log::warning("Usuário {$user->id} NÃO autorizado para canal clinicas.{$clinicaId}", [
        'user_type' => $user->tipo,
        'user_clinica_id' => $user->clinica->id ?? null,
        'expected_clinica_id' => $clinicaId,
    ]);
    return false;
});

Broadcast::channel('emergencias.clinica.{clinicaId}', function (Usuario $user, $clinicaId) {
    if (!$user->relationLoaded('clinica')) {
        $user->load('clinica');
    }
    
    if ($user->tipo === 'clinica' && $user->clinica && $user->clinica->id == $clinicaId) {
        Log::info("Usuário {$user->id} autorizado para canal emergencias.clinica.{$clinicaId}");
        return true;
    }
    
    Log::warning("Usuário {$user->id} NÃO autorizado para canal emergencias.clinica.{$clinicaId}", [
        'user_type' => $user->tipo,
        'user_clinica_id' => $user->clinica->id ?? null,
        'expected_clinica_id' => $clinicaId,
    ]);
    return false;
});

Broadcast::channel('emergencias.tutor.{tutorId}', function (Usuario $user, $tutorId) {
    if (!$user->relationLoaded('tutor')) {
        $user->load('tutor');
    }
    
    if ($user->tipo === 'tutor' && $user->tutor && $user->tutor->id == $tutorId) {
        Log::info("Usuário {$user->id} autorizado para canal emergencias.tutor.{$tutorId}");
        return true;
    }
    
    Log::warning("Usuário {$user->id} NÃO autorizado para canal emergencias.tutor.{$tutorId}", [
        'user_type' => $user->tipo,
        'user_tutor_id' => $user->tutor->id ?? null,
        'expected_tutor_id' => $tutorId,
    ]);
    return false;
});

Broadcast::channel('veterinario.{veterinarioId}', function (Usuario $user, $veterinarioId) {
    if (!$user->relationLoaded('veterinario')) {
        $user->load('veterinario');
    }

    if ($user->tipo === 'veterinario' && $user->veterinario && $user->veterinario->id == $veterinarioId) {
        Log::info("Usuário {$user->id} autorizado para canal veterinario.{$veterinarioId}");
        return true;
    }
    
    Log::warning("Usuário {$user->id} NÃO autorizado para canal veterinario.{$veterinarioId}", [
         'user_type' => $user->tipo,
         'user_vet_id' => $user->veterinario->id ?? null,
         'expected_vet_id' => $veterinarioId,
    ]);
    return false;
});

Broadcast::channel('clinicas', function ($user) {
    Log::info('Tentativa de inscrição no canal clinicas (GENÉRICO)', [
        'user_id' => $user ? ($user->id ?? null) : null,
        'tipo' => $user ? ($user->tipo ?? 'não definido') : 'não definido',
        'ip' => request()->ip()
    ]);
    
    if (!$user) {
        Log::warning('Usuário não autenticado tentando acessar canal clinicas (GENÉRICO)');
        return false;
    }
    
    return $user->tipo === 'clinica';
});

Broadcast::channel('emergencias', function ($user) {
    Log::info('Tentativa de inscrição no canal emergencias (GENÉRICO)', [
        'user_id' => $user ? ($user->id ?? null) : null,
        'tipo' => $user ? ($user->tipo ?? 'não definido') : 'não definido'
    ]);
    
    if (!$user) {
        Log::warning('Usuário não autenticado tentando acessar canal emergencias (GENÉRICO)');
        return false;
    }
    
    return $user->tipo === 'clinica' || $user->tipo === 'veterinario';
});

Broadcast::channel('veterinarios', function ($user) {
    Log::info('Tentativa de inscrição no canal veterinarios (GENÉRICO)', [
        'user_id' => $user ? ($user->id ?? null) : null,
        'tipo' => $user ? ($user->tipo ?? 'não definido') : 'não definido'
    ]);
    
    if (!$user) {
        Log::warning('Usuário não autenticado tentando acessar canal veterinarios (GENÉRICO)');
        return false;
    }
    
    return $user->tipo === 'veterinario';
});

Broadcast::channel('tutores', function ($user) {
    Log::info('Tentativa de inscrição no canal tutores (GENÉRICO)', [
        'user_id' => $user ? ($user->id ?? null) : null,
        'tipo' => $user ? ($user->tipo ?? 'não definido') : 'não definido'
    ]);
    
    if (!$user) {
        Log::warning('Usuário não autenticado tentando acessar canal tutores (GENÉRICO)');
        return false;
    }
    return $user->tipo === 'tutor';
});