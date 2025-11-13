<?php

namespace App\Http\Controllers\Api;

use App\Models\Veterinario;
use App\Models\Emergencia; // Adicionado
use App\Events\NovaEmergencia; // Adicionado
use App\Http\Controllers\Api\EmergenciaController as EmergenciaControllerApi; // Adicionado
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log; // Adicionado
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class VeterinarioController extends Controller
{
    public function __construct()
    {
        // Protege todas as ações. O Admin (via AuthServiceProvider) terá acesso total.
        $this->authorizeResource(Veterinario::class, 'veterinario');
    }

    /**
     * Display a listing of the resource (PARA ADMIN).
     */
    public function index()
    {
        // Carrega o 'usuario' associado para podermos mostrar o email/nome
        return Veterinario::with('usuario')->get();
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        // (Opcional: Admin pode criar vets por aqui, mas a lógica de 'store'
        // principal deve estar no AuthController ou UsuarioController para
        // criar o 'Usuario' primeiro)
        return Veterinario::create($request->all());
    }

    /**
     * Display the specified resource.
     */
    public function show(Veterinario $veterinario)
    {
        $veterinario->load('usuario', 'clinica');
        return $veterinario;
    }

    /**
     * Update the specified resource in storage (PARA ADMIN E PARA O PRÓPRIO VET).
     * A Policy (VeterinarioPolicy@update) irá diferenciar as permissões.
     */
    public function update(Request $request, Veterinario $veterinario)
    {
        // Mescla as regras de validação das duas versões
        $validated = $request->validate([
            // Regras do Admin
            'clinica_id' => 'nullable|exists:clinicas,id',
            'autonomo' => 'sometimes|boolean',
            
            // Regras do Próprio Vet (meuPerfilVet)
            'nome_completo' => 'sometimes|string|max:255',
            'crmv' => 'sometimes|string|max:50',
            'especialidade' => 'sometimes|nullable|string|max:255',
            'telefone_emergencia' => 'sometimes|string|max:50',
            'disponivel_24h' => 'sometimes|boolean',
            'endereco' => 'sometimes|nullable|string|max:255',
            'descricao' => 'sometimes|nullable|string|max:500',
        ]);

        // Lógica de vínculo (do Admin)
        if (isset($validated['autonomo']) && $validated['autonomo'] === true) {
            $validated['clinica_id'] = null;
        }
        if (!empty($validated['clinica_id'])) {
            $validated['autonomo'] = false;
        }

        $veterinario->update($validated);

        return response()->json($veterinario->load('usuario'));
    }

    /**
     * Remove the specified resource from storage (PARA ADMIN).
     */
    public function destroy(Veterinario $veterinario)
    {
        // Opcional: Apagar o utilizador associado
        if ($veterinario->usuario) {
            $veterinario->usuario->delete();
        }
        
        // Apagar foto do S3/Storage
        if ($veterinario->foto_url && Storage::disk('public')->exists($veterinario->foto_url)) {
             Storage::disk('public')->delete($veterinario->foto_url);
        }
        
        $veterinario->delete();

        return response()->noContent();
    }

    // --- Métodos Específicos do Veterinário (da sua versão colada) ---

    /**
     * Retorna os dados do veterinário logado (para o dashboard).
     * ROTA: GET /veterinarios/meu
     */
    public function meu(Request $request)
    {
        $user = $request->user();
        if (!$user || !$user->veterinario) {
            return response()->json(['error' => 'Usuário não vinculado a um veterinário.'], 403);
        }
        
        $veterinario = $user->veterinario;
        // Converte o caminho para URL pública
        if ($veterinario->foto_url) {
             $veterinario->foto_url = Storage::url($veterinario->foto_url);
        }
        
        return response()->json($veterinario);
    }

    /**
     * Faz upload da foto de perfil do veterinário.
     * ROTA: POST /veterinarios/{id}/foto
     */
    public function uploadFoto(Request $request, Veterinario $veterinario)
    {
        // A Policy de autorização (VeterinarioPolicy@update) já foi verificada
        // pelo authorizeResource no __construct, mas podemos verificar novamente
        // se o ID do utilizador logado bate com o ID do veterinário.
        $user = $request->user();
        if (!$user || !$user->veterinario || $user->veterinario->id !== $veterinario->id) {
            // Um Admin pode chegar aqui, por isso verificamos se ele NÃO é admin
            if ($user->tipo !== 'admin') {
                 return response()->json(['error' => 'Não autorizado.'], 403);
            }
        }

        $request->validate([
            'foto' => 'required|image|max:2048', // max 2MB
        ]);

        // Deleta foto antiga se existir
        if ($veterinario->foto_url && Storage::disk('public')->exists($veterinario->foto_url)) {
            Storage::disk('public')->delete($veterinario->foto_url);
        }

        // Salva nova foto
        $path = $request->file('foto')->store('veterinarios/fotos', 'public');
        
        // Salva o caminho no banco
        $veterinario->foto_url = $path;
        $veterinario->save();

        // Retorna a URL completa que o frontend espera
        return response()->json(['foto_url' => Storage::url($path)]);
    }

    public function getEmergencias(Veterinario $veterinario)
    {
        return $veterinario->emergencias()->get();
    }

    public function getHistoricos(Veterinario $veterinario)
    {
        return $veterinario->historicoAtendimentos()->get();
    }

    public function getAutonomos(Request $request)
    {
        $lat = $request->get('lat');
        $lng = $request->get('lng');

        try {
            $veterinarios = Veterinario::with(['usuario']) // Corrigido de 'user' para 'usuario'
                ->where('autonomo', true)
                ->get();

            $resultados = $veterinarios->map(function ($veterinario) use ($lat, $lng) {
                
                $distancia = null;
                // ... (lógica de cálculo de distância) ...
                if ($lat && $lng && $veterinario->lat && $veterinario->lng) {
                    $earthRadius = 6371; // Raio da Terra em km
                    $latFrom = deg2rad($lat);
                    $lngFrom = deg2rad($lng);
                    $latTo = deg2rad($veterinario->lat);
                    $lngTo = deg2rad($veterinario->lng);
                    $latDelta = $latTo - $latFrom;
                    $lngDelta = $lngTo - $lngFrom;
                    $angle = 2 * asin(sqrt(pow(sin($latDelta / 2), 2) +
                        cos($latFrom) * cos($latTo) * pow(sin($lngDelta / 2), 2)));
                    $distancia = $angle * $earthRadius * 1000; // Converter para metros
                }

                $endereco = $veterinario->endereco;
                $localizacao = null;
                if ($veterinario->lat && $veterinario->lng) {
                    $localizacao = "{$veterinario->lat},{$veterinario->lng}";
                }

                return [
                    'id' => $veterinario->id,
                    'tipo' => 'veterinario',
                    'nome_fantasia' => $veterinario->nome_completo,
                    'nome_completo' => $veterinario->nome_completo,
                    'crmv' => $veterinario->crmv,
                    'especialidade' => $veterinario->especialidade,
                    'endereco' => $endereco,
                    'localizacao' => $localizacao,
                    'lat' => $veterinario->lat,
                    'lng' => $veterinario->lng,
                    'distancia' => $distancia ? round($distancia) : null,
                    'disponivel_24h' => $veterinario->disponivel_24h,
                    'avaliacao' => 0, // Placeholder
                    'telefone_emergencia' => $veterinario->telefone_emergencia,
                    'descricao' => $veterinario->descricao, 
                    'foto_url' => $veterinario->foto_url ? Storage::url($veterinario->foto_url) : null, 
                ];
            });
            
            if ($lat && $lng) {
                $resultados = $resultados->filter(function ($item) {
                    return $item['distancia'] !== null && $item['distancia'] < 50000; // 50km
                })
                ->sortBy('distancia') 
                ->values(); 
            } else {
                $resultados = $resultados->values();
            }

            return response()->json($resultados);
        } catch (\Exception $e) {
            Log::error('Erro em getAutonomos: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]); 
            return response()->json([
                'error' => 'Erro ao processar dados: ' . $e->getMessage()
            ], 500);
        }
    }


    public function storeHistorico(Request $request, Veterinario $veterinario)
    {
        $historico = $veterinario->historicoAtendimentos()->create($request->all());
        return response()->json($historico, 201);
    }

    public function storeAnexo(Request $request, Veterinario $veterinario)
    {
        $arquivo = $request->file('arquivo');
        $anexo = $veterinario->anexo()->create([
            'arquivo' => $arquivo->store('anexos', 'public'),
            'descricao' => $request->descricao
        ]);
        return response()->json($anexo, 201);
    }

    public function getAnexo(Veterinario $veterinario)
    {
        return $veterinario->anexos;
    }

    public function acceptEmergencia(Request $request, Veterinario $veterinario, Emergencia $emergencia)
    {
        $user = $request->user();
        if (!$user || !$user->veterinario || $user->veterinario->id !== $veterinario->id) {
            return response()->json(['error' => 'Não autorizado'], 403);
        }

        // Marcar como atendida por este veterinário
        $emergencia->veterinario_id = $veterinario->id;
        $emergencia->status = 'accepted';
        $emergencia->save();

        // Notificar (re-disparar evento para atualizar UIs)
        NovaEmergencia::dispatch($emergencia);

        return response()->json(['message' => 'Emergência aceita', 'emergencia' => $emergencia]);
    }

    public function rejectEmergencia(Request $request, Veterinario $veterinario, Emergencia $emergencia)
    {
        $user = $request->user();
        if (!$user || !$user->veterinario || $user->veterinario->id !== $veterinario->id) {
            return response()->json(['error' => 'Não autorizado'], 403);
        }

        // Limpar vínculo e marcar como rejeitada
        $emergencia->veterinario_id = null;
        $emergencia->status = 'rejected';
        $emergencia->save();

        // Automaticamente solicitar reatribuição para outra clínica
        $emergenciaController = new EmergenciaControllerApi();
        return $emergenciaController->redirectToClinic($request, $emergencia);
    }
}