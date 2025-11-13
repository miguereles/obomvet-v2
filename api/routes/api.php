<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Broadcast;
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
use Illuminate\Support\Facades\Log;

Broadcast::routes(['middleware' => ['api', \App\Http\Middleware\ValidateBroadcastingAuth::class]]);

Route::get('/teste-cache', function () {
    return response()->json(['status' => 'cache limpo!']);
});

Route::get('/veterinarios-autonomos', [VeterinarioController::class, 'getAutonomos']);

Route::prefix('auth')->group(function () {
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login', [AuthController::class, 'login']);
    
    Route::post('logout', [AuthController::class, 'logout'])->middleware('auth:api');
    Route::post('refresh', [AuthController::class, 'refresh'])->middleware('auth:api');
    Route::get('me', [AuthController::class, 'me'])->middleware('auth:api');
});

Route::post('/pets', [PetController::class, 'store'])->middleware('throttle:10,1');
Route::get('/pets/{pet}', [PetController::class, 'show']);
Route::patch('/pets/{pet}/edit-with-token', [PetController::class, 'updateWithToken']);
Route::delete('/pets/{pet}/delete-with-token', [PetController::class, 'destroyWithToken']);
Route::patch('/tutores/{tutor}/edit-with-token', [TutorController::class, 'updateWithToken']);
Route::delete('/tutores/{tutor}/delete-with-token', [TutorController::class, 'destroyWithToken']);

Route::post('/emergencias', [EmergenciaController::class, 'store'])->middleware('throttle:10,1');
Route::get('emergencias/publico/{uuid}', [EmergenciaController::class, 'showPublico']);
Route::post('/save-subscription', [PushController::class, 'store']);


Route::middleware('throttle:5,1')->group(function () {
    Route::post('ia/transcribe', [IAController::class, 'transcribeUnified']);
    Route::post('ia/analyze', [IAController::class, 'analyzeTextUnified']);
    Route::post('ia/continue', [IAController::class, 'continueAnalysis']);
});

Route::get('emergencias/por-clinica', [EmergenciaController::class, 'porClinica'])
    ->middleware('auth:api');

Route::get('emergencias/meus', [EmergenciaController::class, 'meus'])
    ->middleware('auth:api');

Route::apiResource('emergencias', EmergenciaController::class)->except(['store']);


Route::get('/clinicas-publicas', [ClinicaController::class, 'indexPublic']);

Route::get('clinicas/minha', [ClinicaController::class, 'minha'])
    ->middleware('auth:api');

Route::get('clinicas/{clinica}', [ClinicaController::class, 'show']);

Route::apiResource('pets', PetController::class)->only(['store', 'show']);

Route::middleware('auth:api')->group(function () {

    Route::get('emergencias/{emergencia}/historicos', [EmergenciaController::class, 'getHistoricos']);
    Route::post('emergencias/{emergencia}/historicos', [EmergenciaController::class, 'storeHistorico']);

    Route::post('/usuarios/veterinarios', [UsuarioController::class, 'storeVeterinario']);

    Route::apiResource('usuarios', UsuarioController::class);

    Route::get('tutor/meu', [TutorController::class, 'meu']);

    Route::apiResource('tutores', TutorController::class);
    Route::get('tutores/usuario/{usuario}', [TutorController::class, 'getByUsuario']);
    Route::get('tutores/{tutor}/pets', [TutorController::class, 'getPets']);
    Route::get('tutores/{tutor}/emergencias', [TutorController::class, 'getEmergencias']);
    Route::post('tutores/{tutor}/pets', [TutorController::class, 'storePet']);
    
    Route::post('clinicas/{clinica}/foto', [ClinicaController::class, 'uploadFoto']);
    
    Route::apiResource('clinicas', ClinicaController::class)->except(['show']);

    Route::get('clinicas/{clinica}/veterinarios', [ClinicaController::class, 'getVeterinarios']);
    Route::post('clinicas/{clinica}/veterinarios', [ClinicaController::class, 'storeVeterinario']);
    Route::get('clinicas/{clinica}/anexo', [ClinicaController::class, 'getAnexo']);
    Route::post('clinicas/{clinica}/anexo', [ClinicaController::class, 'storeAnexo']);

    Route::apiResource('prontuarios', ProntuarioController::class);
    Route::get('prontuarios/{prontuario}/pet', [ProntuarioController::class, 'getPet']);
    Route::get('prontuarios/{prontuario}/anexos', [ProntuarioController::class, 'getAnexos']);
    Route::post('prontuarios/{prontuario}/anexos', [ProntuarioController::class, 'storeAnexo']);

    Route::get('veterinarios/meu', [VeterinarioController::class, 'meu']);
    Route::post('veterinarios/{veterinario}/foto', [VeterinarioController::class, 'uploadFoto']);
    
    Route::get('veterinario/emergencias/minhas', [VeterinarioController::class, 'minhasEmergencias']);

    Route::apiResource('veterinarios', VeterinarioController::class);
    Route::get('veterinarios/{veterinario}/emergencias', [VeterinarioController::class, 'getEmergencias']);
    Route::post('veterinarios/{veterinario}/emergencias/{emergencia}/accept', [VeterinarioController::class, 'acceptEmergencia']);
    Route::post('veterinarios/{veterinario}/emergencias/{emergencia}/reject', [VeterinarioController::class, 'rejectEmergencia']);
    Route::post('veterinarios/{veterinario}/emergencias', [VeterinarioController::class, 'storeEmergencia']);
    Route::get('veterinarios/{veterinario}/historicos', [VeterinarioController::class, 'getHistoricos']);
    Route::post('veterinarios/{veterinario}/historicos', [VeterinarioController::class, 'storeHistorico']);
    Route::get('veterinarios/{veterinario}/anexo', [VeterinarioController::class, 'getAnexo']);
    Route::post('veterinarios/{veterinario}/anexo', [VeterinarioController::class, 'storeAnexo']);

    Route::apiResource('anexos', AnexoController::class);
    Route::get('anexos/{anexo}/anexable', [AnexoController::class, 'getAnexable']);

    Route::get('meus-historicos', [HistoricoAtendimentoController::class, 'meus']);

    Route::apiResource('historicos', HistoricoAtendimentoController::class);
    Route::get('historicos/{historico}/emergencia', [HistoricoAtendimentoController::class, 'getEmergencia']);
    Route::get('historicos/{historico}/anexo', [HistoricoAtendimentoController::class, 'getAnexo']);
    Route::post('historicos/{historico}/anexo', [HistoricoAtendimentoController::class, 'storeAnexo']);
    
    Route::apiResource('pets', PetController::class)->except(['store', 'show']);

    Route::get('pets/{pet}/tutores', [PetController::class, 'getTutors']);
    Route::get('pets/{pet}/emergencias', [PetController::class, 'getEmergencias']);
    Route::post('pets/{pet}/emergencias', [PetController::class, 'storeEmergencia']);
    Route::get('pets/{pet}/prontuarios', [PetController::class, 'getProntuarios']);
    Route::post('pets/{pet}/prontuarios', [PetController::class, 'storeProntuario']);
    Route::get('pets/{pet}/foto', [PetController::class, 'getFoto']);

    Route::post('/push/subscribe', function (Request $request) {
        $request->user()->updatePushSubscription(
            $request->input('endpoint'),
            $request->input('keys.p256dh'),
            $request->input('keys.auth')
        );
        return response()->json(['success' => true], 200);
    });
});

Route::get('/email/verify/{id}/{hash}', function (EmailVerificationRequest $request) {
    $request->fulfill();
    return response()->json(['message' => 'E-mail verificado com sucesso!']);
})->middleware(['auth:sanctum', 'signed'])->name('verification.verify');

Route::post('/email/resend', function (Request $request) {
    $request->user()->sendEmailVerificationNotification();
    return response()->json(['message' => 'Link de verificação reenviado!']);
})->middleware(['auth:sanctum'])->name('verification.send');


Route::post('/send-push', [PushController::class, 'send']);

Route::post('/debug/echo-headers', function (Request $request) {
    $headers = $request->headers->all();
    $body = $request->all();
    Log::info('Debug echo-headers received', ['headers' => $headers, 'body' => $body, 'ip' => $request->ip()]);
    return response()->json(['headers' => $headers, 'body' => $body]);
});