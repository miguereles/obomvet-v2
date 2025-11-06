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

Route::get('/teste-cache', function () {
    return response()->json(['status' => 'cache limpo!']);
});
// ------------------------
// ROTAS PÚBLICAS
// ------------------------
Route::get('/veterinarios-autonomos', [VeterinarioController::class, 'getAutonomos']);

// AUTENTICAÇÃO
Route::prefix('auth')->group(function () {
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login', [AuthController::class, 'login']);
    Route::post('logout', [AuthController::class, 'logout'])->middleware('auth:api');
});

// Pets e emergências públicas (com throttle)
Route::post('/pets', [PetController::class, 'store'])->middleware('throttle:10,1');
Route::get('/pets/{pet}', [PetController::class, 'show']);
Route::patch('/pets/{pet}/edit-with-token', [PetController::class, 'updateWithToken']);
Route::delete('/pets/{pet}/delete-with-token', [PetController::class, 'destroyWithToken']);
Route::post('/emergencias', [EmergenciaController::class, 'store'])->middleware('throttle:10,1');
// Route::get('/emergencias/{emergencia}', [EmergenciaController::class, 'show']); // <-- LINHA PROBLEMÁTICA REMOVIDA
Route::patch('/tutores/{tutor}/edit-with-token', [TutorController::class, 'updateWithToken']);
Route::delete('/tutores/{tutor}/delete-with-token', [TutorController::class, 'destroyWithToken']);

// IA pública
Route::middleware('throttle:5,1')->group(function () {
    Route::post('ia/transcribe', [IAController::class, 'transcribeUnified']);
    Route::post('ia/analyze', [IAController::class, 'analyzeTextUnified']);
});

// Rota específica para clínicas. DEVE vir ANTES do apiResource.
Route::get('emergencias/por-clinica', [EmergenciaController::class, 'porClinica'])
    ->middleware('auth:api');

// apiResource de Emergências (agora vem depois da rota específica)
Route::apiResource('emergencias', EmergenciaController::class);

Route::get('/clinicas-publicas', [ClinicaController::class, 'indexPublic']);
// LINHA DUPLICADA REMOVIDA DAQUI
Route::apiResource('pets', PetController::class)->only(['store', 'show']);

// ------------------------
// ROTAS PROTEGIDAS (JWT)
// ------------------------
Route::middleware('auth:api')->group(function () {

    // 🔹 ROTA CORRIGIDA — precisa vir ANTES do apiResource
    Route::post('/usuarios/veterinarios', [UsuarioController::class, 'storeVeterinario']);

    // ------------------------
    // USUÁRIOS
    // ------------------------
    Route::apiResource('usuarios', UsuarioController::class);

    // ------------------------
    // TUTORES
    // ------------------------
    Route::apiResource('tutores', TutorController::class);
    Route::get('tutores/usuario/{usuario}', [TutorController::class, 'getByUsuario']);
    Route::get('tutores/{tutor}/pets', [TutorController::class, 'getPets']);
    Route::get('tutores/{tutor}/emergencias', [TutorController::class, 'getEmergencias']);
    Route::post('tutores/{tutor}/pets', [TutorController::class, 'storePet']);
    Route::get('minhas-emergencias', [EmergenciaController::class, 'meus']);

    // ------------------------
    // EMERGÊNCIAS (Rotas específicas)
    // ------------------------
    // (A rota 'por-clinica' foi movida para fora, antes do apiResource)

    // ------------------------
    // CLÍNICAS (Perfil e Foto) - NOVO
    // ------------------------
    Route::get('clinicas/minha', [ClinicaController::class, 'minha']); // ✅ Adicionado
    Route::post('clinicas/{clinica}/foto', [ClinicaController::class, 'uploadFoto']); // ✅ Adicionado
    
    // CLÍNICAS (Padrão)
    Route::apiResource('clinicas', ClinicaController::class);
    Route::get('clinicas/{clinica}/veterinarios', [ClinicaController::class, 'getVeterinarios']);
    Route::post('clinicas/{clinica}/veterinarios', [ClinicaController::class, 'storeVeterinario']);
    Route::get('clinicas/{clinica}/anexo', [ClinicaController::class, 'getAnexo']);
    Route::post('clinicas/{clinica}/anexo', [ClinicaController::class, 'storeAnexo']);

    // ------------------------
    // PRONTUÁRIOS
    // ------------------------
    Route::apiResource('prontuarios', ProntuarioController::class);
    Route::get('prontuarios/{prontuario}/pet', [ProntuarioController::class, 'getPet']);
    Route::get('prontuarios/{prontuario}/anexos', [ProntuarioController::class, 'getAnexos']);
    Route::post('prontuarios/{prontuario}/anexos', [ProntuarioController::class, 'storeAnexo']);

    // ------------------------
    // VETERINÁRIOS (Perfil e Foto) - NOVO
    // ------------------------
    Route::get('veterinarios/meu', [VeterinarioController::class, 'meu']); // ✅ Adicionado
    Route::post('veterinarios/{veterinario}/foto', [VeterinarioController::class, 'uploadFoto']); // ✅ Adicionado
    
    // VETERINÁRIOS (Padrão)
    Route::apiResource('veterinarios', VeterinarioController::class);
    Route::get('veterinarios/{veterinario}/emergencias', [VeterinarioController::class, 'getEmergencias']);
    Route::post('veterinarios/{veterinario}/emergencias/{emergencia}/accept', [VeterinarioController::class, 'acceptEmergencia']);
    Route::post('veterinarios/{veterinario}/emergencias/{emergencia}/reject', [VeterinarioController::class, 'rejectEmergencia']);
    Route::post('veterinarios/{veterinario}/emergencias', [VeterinarioController::class, 'storeEmergencia']);
    Route::get('veterinarios/{veterinario}/historicos', [VeterinarioController::class, 'getHistoricos']);
    Route::post('veterinarios/{veterinario}/historicos', [VeterinarioController::class, 'storeHistorico']);
    Route::get('veterinarios/{veterinario}/anexo', [VeterinarioController::class, 'getAnexo']);
    Route::post('veterinarios/{veterinario}/anexo', [VeterinarioController::class, 'storeAnexo']);

    // ------------------------
    // ANEXOS POLIMÓRFICOS
    // ------------------------
    Route::apiResource('anexos', AnexoController::class);
    Route::get('anexos/{anexo}/anexable', [AnexoController::class, 'getAnexable']);

    // ------------------------
    // HISTÓRICOS
    // ------------------------
    Route::apiResource('historicos', HistoricoAtendimentoController::class);
    Route::get('historicos/{historico}/emergencia', [HistoricoAtendimentoController::class, 'getEmergencia']);
    Route::get('historicos/{historico}/anexo', [HistoricoAtendimentoController::class, 'getAnexo']);
    Route::post('historicos/{historico}/anexo', [HistoricoAtendimentoController::class, 'storeAnexo']);
    Route::get('meus-historicos', [HistoricoAtendimentoController::class, 'meus']);

    // ------------------------
    // PETS
    // ------------------------
    Route::apiResource('pets', PetController::class);
    Route::get('pets/{pet}/tutores', [PetController::class, 'getTutors']);
    Route::get('pets/{pet}/emergencias', [PetController::class, 'getEmergencias']);
    Route::post('pets/{pet}/emergencias', [PetController::class, 'storeEmergencia']);
    Route::get('pets/{pet}/prontuarios', [PetController::class, 'getProntuarios']);
    Route::post('pets/{pet}/prontuarios', [PetController::class, 'storeProntuario']);
    Route::get('pets/{pet}/foto', [PetController::class, 'getFoto']);

    // ------------------------
    // PUSH NOTIFICATIONS
    // ------------------------
    Route::post('/push/subscribe', function (Request $request) {
        // - Esta lógica está correta
        $request->user()->updatePushSubscription(
            $request->input('endpoint'),
            $request->input('keys.p256dh'),
            $request->input('keys.auth')
        );
        return response()->json(['success' => true], 200); // Adicione um retorno de sucesso
    });

    Broadcast::routes(['middleware' => ['auth:api']]);
});

// ------------------------
// VERIFICAÇÃO DE EMAIL
// ------------------------
Route::get('/email/verify/{id}/{hash}', function (EmailVerificationRequest $request) {
    $request->fulfill();
    return response()->json(['message' => 'E-mail verificado com sucesso!']);
})->middleware(['auth:sanctum', 'signed'])->name('verification.verify');

Route::post('/email/resend', function (Request $request) {
    $request->user()->sendEmailVerificationNotification();
    return response()->json(['message' => 'Link de verificação reenviado!']);
})->middleware(['auth:sanctum'])->name('verification.send');

// ------------------------
// PUSH PÚBLICO
// ------------------------
Route::post('/save-subscription', [PushController::class, 'store']);
Route::post('/send-push', [PushController::class, 'send']);