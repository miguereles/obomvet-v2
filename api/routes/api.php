<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\{
    AnexoController,
    ClinicaController,
    EmergenciaController,
    HistoricoAtendimentoController,
    PetController,
    ProntuarioController,
    TutorController,
    UsuarioController,
    VeterinarioController,
    IAController,
    PushController
};
use Illuminate\Foundation\Auth\EmailVerificationRequest;
use Illuminate\Http\Request;

// ------------------------
// AUTENTICAÇÃO
// ------------------------
Route::prefix('auth')->group(function () {
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login', [AuthController::class, 'login']);
    Route::post('logout', [AuthController::class, 'logout'])->middleware('auth:api');
});

// ------------------------
// ROTAS PÚBLICAS (com chave e throttle)
// ------------------------
Route::middleware('throttle:5,1')->group(function () {
    Route::post('ia/transcribe', [IAController::class, 'transcribeUnified']);
    Route::post('ia/analyze', [IAController::class, 'analyzeTextUnified']);
});


Route::get('/clinicas-publicas', [ClinicaController::class, 'indexPublic']);
Route::post('/emergencias', [EmergenciaController::class, 'store']);
Route::get('/emergencias', [EmergenciaController::class, 'store']);

// ------------------------
// ROTAS PROTEGIDAS (JWT)
// ------------------------
Route::middleware('auth:api')->group(function () {

    // Emergências
    Route::get('/clinica/emergencias', [EmergenciaController::class, 'porClinica']);
    
    // Usuários
    Route::apiResource('usuarios', UsuarioController::class);

    // Tutores
    Route::apiResource('tutores', TutorController::class);
    Route::get('tutores/usuario/{usuario}', [TutorController::class, 'getByUsuario']);
    Route::get('tutores/{tutor}/pets', [TutorController::class, 'getPets']);
    Route::get('tutores/{tutor}/emergencias', [TutorController::class, 'getEmergencias']);
    Route::post('tutores/{tutor}/pets', [TutorController::class, 'storePet']);
    Route::get('minhas-emergencias', [EmergenciaController::class, 'meus']);

    // Clínicas
    Route::apiResource('clinicas', ClinicaController::class);
    Route::get('clinicas/{clinica}/veterinarios', [ClinicaController::class, 'getVeterinarios']);
    Route::post('clinicas/{clinica}/veterinarios', [ClinicaController::class, 'storeVeterinario']);
    Route::get('clinicas/{clinica}/anexo', [ClinicaController::class, 'getAnexo']);
    Route::post('clinicas/{clinica}/anexo', [ClinicaController::class, 'storeAnexo']);

    // Prontuários
    Route::apiResource('prontuarios', ProntuarioController::class);
    Route::get('prontuarios/{prontuario}/pet', [ProntuarioController::class, 'getPet']);
    Route::get('prontuarios/{prontuario}/anexos', [ProntuarioController::class, 'getAnexos']);
    Route::post('prontuarios/{prontuario}/anexos', [ProntuarioController::class, 'storeAnexo']);

    // Veterinários
    Route::apiResource('veterinarios', VeterinarioController::class);
    Route::get('veterinarios/{veterinario}/emergencias', [VeterinarioController::class, 'getEmergencias']);
    Route::post('veterinarios/{veterinario}/emergencias', [VeterinarioController::class, 'storeEmergencia']);
    Route::get('veterinarios/{veterinario}/historicos', [VeterinarioController::class, 'getHistoricos']);
    Route::post('veterinarios/{veterinario}/historicos', [VeterinarioController::class, 'storeHistorico']);
    Route::get('veterinarios/{veterinario}/anexo', [VeterinarioController::class, 'getAnexo']);
    Route::post('veterinarios/{veterinario}/anexo', [VeterinarioController::class, 'storeAnexo']);

    // Anexos polimórficos
    Route::apiResource('anexos', AnexoController::class);
    Route::get('anexos/{anexo}/anexable', [AnexoController::class, 'getAnexable']);

    // Historicos
    Route::apiResource('historicos', HistoricoAtendimentoController::class);
    Route::get('historicos/{historico}/emergencia', [HistoricoAtendimentoController::class, 'getEmergencia']);
    Route::get('historicos/{historico}/anexo', [HistoricoAtendimentoController::class, 'getAnexo']);
    Route::post('historicos/{historico}/anexo', [HistoricoAtendimentoController::class, 'storeAnexo']);
    Route::get('meus-historicos', [HistoricoAtendimentoController::class, 'meus']);

    // Pets
    Route::apiResource('pets', PetController::class);
    Route::get('pets/{pet}/tutores', [PetController::class, 'getTutors']);
    Route::get('pets/{pet}/emergencias', [PetController::class, 'getEmergencias']);
    Route::post('pets/{pet}/emergencias', [PetController::class, 'storeEmergencia']);
    Route::get('pets/{pet}/prontuarios', [PetController::class, 'getProntuarios']);
    Route::post('pets/{pet}/prontuarios', [PetController::class, 'storeProntuario']);
    Route::get('pets/{pet}/foto', [PetController::class, 'getFoto']);

    // Push notifications
    Route::post('/push/subscribe', function (Request $request) {
        $request->user()->updatePushSubscription(
            $request->input('endpoint'),
            $request->input('keys.p256dh'),
            $request->input('keys.auth')
        );
    });

    // Email verification
    Route::get('/email/verify/{id}/{hash}', function (EmailVerificationRequest $request) {
        $request->fulfill();
        return response()->json(['message' => 'E-mail verificado com sucesso!']);
    })->middleware(['auth:sanctum', 'signed'])->name('verification.verify');
});

// Rota para reenviar link
Route::post('/email/resend', function (Request $request) {
    $request->user()->sendEmailVerificationNotification();
    return response()->json(['message' => 'Link de verificação reenviado!']);
})->middleware(['auth:sanctum'])->name('verification.send');


// routes/api.php
Route::post('/save-subscription', [PushController::class, 'store']);
Route::post('/send-push', [PushController::class, 'send']);