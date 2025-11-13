<?php

namespace App\Http\Controllers\Api;

use App\Models\Emergencia;
use App\Models\Clinica;
use App\Models\Pet;
use App\Events\NovaEmergencia;
use App\Events\EmergenciaAtualizada;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Tutor;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Database\QueryException; // <-- ✅ ADICIONAR IMPORTAÇÃO
use Throwable; // <-- ✅ ADICIONAR IMPORTAÇÃO

class EmergenciaController extends Controller
{
    public function __construct()
    {
        // $this->authorizeResource(Emergencia::class, 'emergencia');
        
        // [ATUALIZAÇÃO]
        // Protege todas as rotas, EXCETO 'store' (criação anónima)
        // e 'showPublico' (visualização anónima)
        $this->middleware('auth:api')->except(['store', 'showPublico']);
    }

    /**
     * Função privada para calcular a distância Haversine em km.
     */
    private function haversineDistance($lat1, $lon1, $lat2, $lon2)
    {
        $earthRadius = 6371; // km

        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);

        $a = sin($dLat / 2) * sin($dLat / 2) +
             cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
             sin($dLon / 2) * sin($dLon / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }

    public function index()
    {
        return Emergencia::all();
    }

    public function store(Request $request)
    {
        $user = $request->user();
        $tutorToken = null; 
        $petToken = null; 


        // validações: se usuário tutor autenticado, exige pet_id; se anônimo exigir contato (nome/telefone) ou pet existente
        if (!$user || !$user->tutor) {
            $validated = $request->validate([
                'descricao_sintomas' => 'required|string',
                'nivel_urgencia' => 'required|in:baixa,media,alta,critica',
                
                // ✅ === INÍCIO DA CORREÇÃO ===
                // Adicionadas regras para campos da IA, tipo de visita e clínica manual
                'relatorio_detalhado_ia' => 'nullable|string',
                'materiais_provaveis' => 'nullable|string',
                'visita_tipo' => 'required|in:clinica,domicilio',
                'clinica_id' => 'nullable|exists:clinicas,id',
                // ✅ === FIM DA CORREÇÃO ===

                'pet_id' => 'nullable|exists:pets,id',
                'tutor_nome' => 'required_without:pet_id|string|max:100',
                'tutor_telefone' => 'required_without:pet_id|string|max:20',
                'tutor_email' => 'nullable|email|max:255',
                'location' => 'nullable|array',
                'location.latitude' => 'required_with:location|numeric',
                'location.longitude' => 'required_with:location|numeric',
                'recaptcha_token' => 'nullable|string',
                'pet_nome' => 'nullable|string|max:100', // (Vem do useEmergencyReport)
            ]);

            // opcional: verificar reCAPTCHA
            if (!empty($validated['recaptcha_token']) && env('RECAPTCHA_SECRET')) {
                try {
                    $resp = Http::asForm()->post('https://www.google.com/recaptcha/api/siteverify', [
                        'secret' => env('RECAPTCHA_SECRET'),
                        'response' => $validated['recaptcha_token']
                    ]);
                    $body = $resp->json();
                    if (empty($body['success']) || (isset($body['score']) && $body['score'] < 0.3)) {
                        return response()->json(['error' => 'reCAPTCHA inválido'], 400);
                    }
                } catch (\Exception $e) {
                    Log::warning('reCAPTCHA verification failed for anonymous emergencia: ' . $e->getMessage());
                }
            }

            // criar Tutor temporário se necessário
            $tutor = null;
            if (empty($validated['pet_id'])) {
                $tutor = Tutor::create([
                    'usuario_id' => null,
                    'nome_completo' => $validated['tutor_nome'],
                    'telefone_principal' => $validated['tutor_telefone'],
                    'email_contato' => $validated['tutor_email'] ?? null,
                ]);

                // gerar token de edição para tutor anônimo
                try {
                    $tutorToken = bin2hex(random_bytes(16));
                    $tutor->anonymous_edit_token = $tutorToken;
                    $tutor->anonymous_edit_token_expires_at = now()->addDays(7);
                    $tutor->save();
                } catch (\Exception $e) {
                    Log::warning('Falha ao gerar token para tutor anônimo na emergência: ' . $e->getMessage());
                }

                $validated['tutor_id'] = $tutor->id;
            }
        } else {
            $validated = $request->validate([
                'descricao_sintomas' => 'required|string',
                'nivel_urgencia' => 'required|in:baixa,media,alta,critica',

                // ✅ === INÍCIO DA CORREÇÃO ===
                // Adicionadas regras para campos da IA, tipo de visita e clínica manual
                'relatorio_detalhado_ia' => 'nullable|string',
                'materiais_provaveis' => 'nullable|string',
                'visita_tipo' => 'required|in:clinica,domicilio',
                'clinica_id' => 'nullable|exists:clinicas,id',
                // ✅ === FIM DA CORREÇÃO ===

                'pet_id' => 'required|exists:pets,id',
                'tutor_id' => 'nullable|exists:tutors,id',
                'location' => 'nullable|array',
                'location.latitude' => 'required_with:location|numeric',
                'location.longitude' => 'required_with:location|numeric',
            ]);
            $validated['tutor_id'] = $user->tutor->id;
        }



        $userLocation = $request->input('location');
        $clinicaAlvo = null;

        // Se necessário, criar pet temporário para emergência anônima (quando foi enviado pet_nome)
        if (empty($validated['pet_id']) && !empty($validated['pet_nome'])) {
            try {
                $pet = Pet::create([
                    'nome' => $validated['pet_nome'],
                    'especie' => $request->input('pet_especie', 'N/A'), // Pega do request, se houver
                    'tutor_id' => $validated['tutor_id'] ?? null,
                ]);
                $validated['pet_id'] = $pet->id;
                // gerar token para pet temporário
                try {
                    $petToken = bin2hex(random_bytes(16));
                    $pet->anonymous_edit_token = $petToken;
                    $pet->anonymous_edit_token_expires_at = now()->addDays(7);
                    $pet->save();
                } catch (\Exception $e) {
                    Log::warning('Falha ao gerar token para pet temporário na emergência: ' . $e->getMessage());
                }
            } catch (\Exception $e) {
                Log::warning('Falha ao criar pet temporário: ' . $e->getMessage());
            }
        }

        // ✅ === INÍCIO DA CORREÇÃO LÓGICA ===
        // Verifica se uma clínica já foi definida (pela escolha manual do utilizador)
        if (!empty($validated['clinica_id'])) {
            $clinicaAlvo = Clinica::find($validated['clinica_id']);
        }
        // ✅ === FIM DA CORREÇÃO LÓGICA ===
        
        // Se a $clinicaAlvo ainda for nula (sem escolha manual), 
        // procura a mais próxima ou a primeira
        if (!$clinicaAlvo) {
            // Busca todas as clínicas
            $todasClinicas = Clinica::all();
            if ($todasClinicas->isEmpty()) {
                //eventualmente precisa retirar isso daqui
                return response()->json(['error' => 'Nenhuma clínica cadastrada no sistema'], 400);
            }

            // Calcula a clínica mais próxima se o usuário enviou localização
            if ($userLocation && isset($userLocation['latitude']) && isset($userLocation['longitude'])) {
                $userLat = (float) $userLocation['latitude'];
                $userLon = (float) $userLocation['longitude'];

                $distanciaMinima = PHP_INT_MAX;
                $clinicaMaisProxima = null;

                foreach ($todasClinicas as $clinica) {
                    // Localização no formato "L:lat,G:lon" ou "lat,lon"
                    $coordsStr = str_replace(['L:', 'G:'], '', $clinica->localizacao);
                    $coords = explode(',', $coordsStr);
                    if (count($coords) !== 2) continue;

                    $clinicLat = (float) $coords[0];
                    $clinicLon = (float) $coords[1];

                    $distancia = $this->haversineDistance($userLat, $userLon, $clinicLat, $clinicLon);

                    if ($distancia < $distanciaMinima) {
                        $distanciaMinima = $distancia;
                        $clinicaMaisProxima = $clinica;
                    }
                }

                $clinicaAlvo = $clinicaMaisProxima;
            } else {
                // Fallback: pega a primeira clínica se sem localização
                $clinicaAlvo = $todasClinicas->first();
            }

            if (!$clinicaAlvo) {
                return response()->json(['error' => 'Não foi possível atribuir uma clínica'], 500);
            }

            $validated['clinica_id'] = $clinicaAlvo->id;
        }


        // Persistir localização da emergência no formato 'lat,lng' para futuras reatribuições
        if ($userLocation && isset($userLocation['latitude']) && isset($userLocation['longitude'])) {
            $validated['localizacao'] = $userLocation['latitude'] . ',' . $userLocation['longitude'];
        }

        // Remove location array para não dar erro
        unset($validated['location']);

        // Remover dados temporários e tokens
        unset($validated['recaptcha_token'], $validated['tutor_nome'], $validated['tutor_telefone'], $validated['tutor_email'], $validated['pet_nome']);
        
        // [LINHA ADICIONADA] Gera o UUID público para o acompanhamento anónimo
        $validated['public_uuid'] = (string) Str::uuid();


        // Log para auditoria mínima do request anônimo
        Log::info('Criando emergência', [
            'ip' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'tutor_id' => $validated['tutor_id'] ?? null,
        ]);

        // ✅ === INÍCIO DA CAPTURA DE ERRO ===
        try {
            $emergencia = Emergencia::create($validated);
        } catch (QueryException $e) {
            // Captura especificamente erros de SQL
            Log::error('Falha ao criar emergência (QueryException): ' . $e->getMessage(), [
                'sql' => $e->getSql(),
                'bindings' => $e->getBindings(),
                'validated_data' => $validated // Loga os dados exatos que falharam
            ]);
            return response()->json(['error' => 'Erro ao salvar no banco de dados. O administrador foi notificado.', 'message' => $e->getMessage()], 500);
        } catch (Throwable $e) {
            // Captura qualquer outro erro (ex: MassAssignmentException, se o cache estiver antigo)
            Log::error('Falha ao criar emergência (Throwable): ' . $e->getMessage(), [
                'exception_type' => get_class($e),
                'validated_data' => $validated // Loga os dados exatos que falharam
            ]);
            return response()->json(['error' => 'Erro interno do servidor. O administrador foi notificado.', 'message' => $e->getMessage()], 500);
        }
        // ✅ === FIM DA CAPTURA DE ERRO ===
        
        // Load related data before broadcasting so the event has complete data
        $emergencia->load(['tutor', 'clinica', 'pet']);
        
        NovaEmergencia::dispatch($emergencia);
        
        // [RESPOSTA CORRIGIDA]
        $response = [
            'emergencia' => $emergencia, 
            'clinica' => $clinicaAlvo,
            'public_uuid' => $emergencia->public_uuid // Devolve o UUID para o frontend
        ];

        // Devolve os tokens para o frontend (para o PushService e para edição futura)
        if (isset($tutorToken)) $response['edit_tokens']['tutor'] = $tutorToken;
        if (isset($petToken)) $response['edit_tokens']['pet'] = $petToken;

        return response()->json($response, 201);
    }

    /**
     * [MÉTODO ADICIONADO]
     * Busca uma emergência pelo seu UUID público.
     * Esta rota é pública e usada por tutores anónimos.
     */
    public function showPublico($uuid)
    {
        $emergencia = Emergencia::where('public_uuid', $uuid)
            ->with(['clinica', 'pet', 'tutor']) // Carrega as relações necessárias
            ->firstOrFail(); // Falha com 404 se não encontrar
            
        // Retorna os dados da emergência e da clínica associada
        return response()->json([
            'emergencia' => $emergencia,
            'clinica' => $emergencia->clinica,
        ]);
    }

    /**
     * Clínica cancela uma emergência e solicita reatribuição automática.
     */
    public function cancel(Request $request, Emergencia $emergencia)
    {
        $user = $request->user();
        if (!$user || !$user->clinica) {
            return response()->json(['error' => 'Usuário não é clínica autenticada.'], 403);
        }

        // Só a clínica atribuída pode cancelar
        if ($emergencia->clinica_id !== $user->clinica->id) {
            return response()->json(['error' => 'Emergência não pertence a esta clínica.'], 403);
        }

        $emergencia->status = 'cancelled';
        $emergencia->save();

        // ✅ DISPARA O EVENTO DE ATUALIZAÇÃO PARA O TUTOR
        event(new EmergenciaAtualizada($emergencia));

        // Tentar reatribuir automaticamente
        $this->redirectToClinic($request, $emergencia);

        return response()->json(['message' => 'Emergência cancelada e reatribuição solicitada.', 'emergencia' => $emergencia]);
    }

    /**
     * Redireciona uma emergência para outra clínica (automático ou manual).
     */
    public function redirectToClinic(Request $request, Emergencia $emergencia)
    {
        // Encontrar clínica alvo: se enviado clinic_id use ele, caso contrário escolha a mais próxima diferente da atual
        $targetClinicaId = $request->input('clinica_id');

        if ($targetClinicaId) {
            $target = Clinica::find($targetClinicaId);
        } else {
            // escolher automaticamente a clínica mais próxima (exclui a atual)
            $todasClinicas = Clinica::whereNotNull('localizacao')->get()->filter(function($c) use ($emergencia) {
                return $c->id !== $emergencia->clinica_id;
            });

            if ($todasClinicas->isEmpty()) {
                return response()->json(['error' => 'Nenhuma outra clínica disponível'], 400);
            }

            $coords = null;
            if ($emergencia->localizacao) {
                $coords = explode(',', $emergencia->localizacao);
            }

            $best = null;
            $min = PHP_INT_MAX;
            foreach ($todasClinicas as $clinica) {
                // Prefer explicit lat/lng columns if available
                if (!empty($clinica->lat) && !empty($clinica->lng)) {
                    $clinicLat = (float) $clinica->lat;
                    $clinicLon = (float) $clinica->lng;
                } else {
                    $coordsStr = str_replace(['L:', 'G:'], '', $clinica->localizacao);
                    $ccoords = explode(',', $coordsStr);
                    if (count($ccoords) !== 2) continue;
                    // Suporta formatos "L:lat,G:lon" ou "lat,lon"
                    $rawLat = trim($ccoords[0]);
                    $rawLon = trim($ccoords[1]);
                    $clinicLat = (float) $rawLat;
                    $clinicLon = (float) $rawLon;
                }

                if ($coords && count($coords) === 2) {
                    $dist = $this->haversineDistance((float)$coords[0], (float)$coords[1], $clinicLat, $clinicLon);
                } else {
                    $dist = 0; // fallback
                }

                if ($dist < $min) { $min = $dist; $best = $clinica; }
            }
            $target = $best;
        }

        if (!$target) return response()->json(['error'=>'Não foi possível encontrar clínica alvo'], 400);

        // Salva a mudança de clínica e status
        $emergencia->clinica_id = $target->id;
        $emergencia->status = 'assigned'; // 'assigned' ou 'aberta'
        $emergencia->save();

        // Load related data before broadcasting
        $emergencia->load(['tutor', 'clinica', 'pet']);

        // Notificar a NOVA clínica
        NovaEmergencia::dispatch($emergencia);

        // Notificar o TUTOR da mudança
        event(new EmergenciaAtualizada($emergencia));

        return response()->json(['message'=>'Emergência reatribuída', 'emergencia' => $emergencia, 'clinica' => $target]);
    }

    public function show(Emergencia $emergencia)
    {
        // [ATUALIZAÇÃO] Este método agora é protegido por 'auth:api'
        // A sua rota 'routes/api.php' o coloca dentro de 'apiResource', que é protegida
        $emergencia->load(['pet', 'tutor', 'clinica', 'veterinario', 'prontuario', 'anexos']);
        return $emergencia;
    }

    public function update(Request $request, Emergencia $emergencia)
    {
        $emergencia->update($request->all());

        // ✅ CORREÇÃO ADICIONADA:
        // Dispara o evento para notificar o tutor (via Pusher e Web Push)
        // que o status da emergência mudou (ex: 'aceita', 'concluída', etc.)
        $emergencia->load(['tutor', 'clinica', 'pet']); // Recarrega para ter dados no evento
        event(new EmergenciaAtualizada($emergencia));

        return $emergencia;
    }

    public function destroy(Emergencia $emergencia)
    {
        $emergencia->delete();
        return response()->noContent();
    }

    public function getHistoricos(Emergencia $emergencia)
    {
        return $emergencia->historicoAtendimentos()->get();
    }

    public function getAnexo(Emergencia $emergencia)
    {
        return $emergencia->anexos;
    }

    public function storeHistorico(Request $request, Emergencia $emergencia)
    {
        $historico = $emergencia->historicoAtendimentos()->create($request->all());
        return response()->json($historico, 201);
    }

    public function storeAnexo(Request $request, Emergencia $emergencia)
    {
        $arquivo = $request->file('arquivo');
        $anexo = $emergencia->anexos()->create([
            'arquivo' => $arquivo->store('anexos', 'public'),
            'descricao' => $request->descricao
        ]);
        return response()->json($anexo, 201);
    }

    public function meus(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['error' => 'Usuário não autenticado'], 401);
        }

        if (!$user->tutor) {
            return response()->json(['error' => 'Usuário não é tutor'], 403);
        }

        $emergencias = Emergencia::with('pet')
            ->where('tutor_id', $user->tutor->id)
            ->orderByDesc('created_at')
            ->get();

        return response()->json($emergencias);
    }

    // ======================================================
    // FUNÇÃO CORRIGIDA (V3 - Consulta Manual + Lazy Loading)
    // =G====================================================
    public function porClinica(Request $request)
    {
        try {
            $user = $request->user();

            if (!$user) {
                return response()->json(['error' => 'Usuário não autenticado'], 401);
            }

            // 1. Consulta manual pela clínica
            // (Isto usa o Model Clinica)
            $clinica = \App\Models\Clinica::where('usuario_id', $user->id)->first();

            if (!$clinica) {
                // Adiciona um Log para sabermos *quem* tentou acessar
                Log::warning('Tentativa de acesso a porClinica falhou. Usuário não é uma clínica.', ['user_id' => $user->id, 'email' => $user->email]);
                return response()->json(['error' => 'Nenhum registro de clínica encontrado para este usuário.'], 403);
            }

            // 2. Busca emergências SEM o 'with()' primeiro, para isolar o erro
            $emergencias = \App\Models\Emergencia::where('clinica_id', $clinica->id)
                ->orderByDesc('created_at')
                ->get();

            // 3. Carrega as relações 'pet' e 'tutor' manualmente (Lazy Loading)
            // O frontend 'emergenciaClinica.tsx' precisa delas.
            // Se houver um erro 500 aqui, o problema está nas definições
            // das relações 'pet()' ou 'tutor()' no Model 'Emergencia.php'.
            $emergencias->load(['pet', 'tutor']);

            return response()->json($emergencias);

        } catch (\Exception $e) {
            // Se um erro 500 ocorrer, isto irá capturá-lo e reportá-lo
            Log::error('Erro fatal em porClinica: ' . $e->getMessage(), [
                'user_id' => $user->id ?? 'null',
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json(['error' => 'Erro interno do servidor. O administrador foi notificado.'], 500);
        }
    }
}