<?php

use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Log;
use App\Models\Usuario; // Importa o modelo de Usuário

/*
|--------------------------------------------------------------------------
| Canals de Broadcast
|--------------------------------------------------------------------------
|
| Aqui você pode registrar todos os canais de broadcast de eventos que
| sua aplicação suporta.
|
*/

/**
 * Canal para UMA clínica específica.
 * O frontend vai assinar: echo.private('clinicas.123')
 * O Evento (NovaEmergencia) [cite: app/Events/NovaEmergencia.php] vai disparar em: new PrivateChannel('clinicas.123')
 */
Broadcast::channel('clinicas.{clinicaId}', function (Usuario $user, $clinicaId) {
    // Apenas o usuário logado que pertence a ESTA clínica pode ouvir.
    // Carrega a relação clinica se não estiver carregada
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

/**
 * Canal para UMA clínica específica (para atualizações de emergência)
 * O frontend vai assinar: echo.private('emergencias.clinica.123')
 * O Evento (EmergenciaAtualizada) [cite: app/Events/EmergenciaAtualizada.php] vai disparar em: new Channel('emergencias.clinica.123')
 */
Broadcast::channel('emergencias.clinica.{clinicaId}', function (Usuario $user, $clinicaId) {
    // Mesma lógica: só o usuário da clínica pode ouvir
    // Carrega a relação clinica se não estiver carregada
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

/**
 * Canal para UM tutor específico.
 * O frontend (acompanhamentoEmergencia.tsx) [cite: src/pages/acompanhamentoEmergencia.tsx] vai assinar: echo.private('emergencias.tutor.456')
 * O Evento (EmergenciaAtualizada) [cite: app/Events/EmergenciaAtualizada.php] vai disparar em: new Channel('emergencias.tutor.456')
 */
Broadcast::channel('emergencias.tutor.{tutorId}', function (Usuario $user, $tutorId) {
    // Apenas o usuário logado que pertence a ESTE tutor pode ouvir.
    // Carrega a relação tutor se não estiver carregada
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

// Os canais genéricos abaixo não são usados pelos eventos de emergência
// e podem ser removidos se você não os usar em outro lugar.
// Vou mantê-los, como você pediu para "não remover".
Broadcast::channel('clinicas', function ($user) {
    // Protege contra $user nulo ao logar
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