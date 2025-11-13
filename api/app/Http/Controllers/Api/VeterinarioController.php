<?php

namespace App\Http\Controllers\Api;

use App\Models\Veterinario;
use App\Models\Emergencia;
use App\Events\NovaEmergencia;
use App\Events\EmergenciaAtualizada;
use App\Http\Controllers\Api\EmergenciaController as EmergenciaControllerApi;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Auth;

class VeterinarioController extends Controller
{
    public function __construct()
    {
        $this->authorizeResource(Veterinario::class, 'veterinario');
    }

    public function index()
    {
        return Veterinario::with('usuario')->get();
    }

    public function store(Request $request)
    {
        return Veterinario::create($request->all());
    }

    public function show(Veterinario $veterinario)
    {
        $veterinario->load('usuario', 'clinica');
        return $veterinario;
    }

    public function update(Request $request, Veterinario $veterinario)
    {
        $validated = $request->validate([
            'clinica_id' => 'nullable|exists:clinicas,id',
            'autonomo' => 'sometimes|boolean',
            'nome_completo' => 'sometimes|string|max:255',
            'crmv' => 'sometimes|string|max:50',
            'especialidade' => 'sometimes|nullable|string|max:255',
            'telefone_emergencia' => 'sometimes|string|max:50',
            'disponivel_24h' => 'sometimes|boolean',
            'endereco' => 'sometimes|nullable|string|max:255',
            'descricao' => 'sometimes|nullable|string|max:500',
        ]);

        if (isset($validated['autonomo']) && $validated['autonomo'] === true) {
            $validated['clinica_id'] = null;
        }
        if (!empty($validated['clinica_id'])) {
            $validated['autonomo'] = false;
        }

        $veterinario->update($validated);

        return response()->json($veterinario->load('usuario'));
    }

    public function destroy(Veterinario $veterinario)
    {
        if ($veterinario->usuario) {
            $veterinario->usuario->delete();
        }
        
        if ($veterinario->foto_url && Storage::disk('public')->exists($veterinario->foto_url)) {
             Storage::disk('public')->delete($veterinario->foto_url);
        }
        
        $veterinario->delete();

        return response()->noContent();
    }

    public function meu(Request $request)
    {
        $user = $request->user();
        if (!$user || !$user->veterinario) {
            return response()->json(['error' => 'Usuário não vinculado a um veterinário.'], 403);
        }
        
        $veterinario = $user->veterinario;
        if ($veterinario->foto_url) {
             $veterinario->foto_url = Storage::url($veterinario->foto_url);
        }
        
        return response()->json($veterinario);
    }

    public function minhasEmergencias(Request $request)
    {
        $user = Auth::user();

        if (!$user || $user->tipo !== 'veterinario' || !$user->veterinario) {
            return response()->json(['error' => 'Usuário não é um veterinário válido.'], 403);
        }

        $veterinario = $user->veterinario;

        return $veterinario->emergencias()->with(['pet', 'tutor'])->get();
    }

    public function uploadFoto(Request $request, Veterinario $veterinario)
    {
        $user = $request->user();
        if (!$user || !$user->veterinario || $user->veterinario->id !== $veterinario->id) {
            if ($user->tipo !== 'admin') {
                 return response()->json(['error' => 'Não autorizado.'], 403);
            }
        }

        $request->validate([
            'foto' => 'required|image|max:2048',
        ]);

        if ($veterinario->foto_url && Storage::disk('public')->exists($veterinario->foto_url)) {
            Storage::disk('public')->delete($veterinario->foto_url);
        }

        $path = $request->file('foto')->store('veterinarios/fotos', 'public');
        
        $veterinario->foto_url = $path;
        $veterinario->save();

        return response()->json(['foto_url' => Storage::url($path)]);
    }

    public function getEmergencias(Veterinario $veterinario)
    {
        return $veterinario->emergencias()->with(['pet', 'tutor'])->get();
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
            $veterinarios = Veterinario::with(['usuario'])
                ->where('autonomo', true)
                ->get();

            $resultados = $veterinarios->map(function ($veterinario) use ($lat, $lng) {
                
                $distancia = null;
                if ($lat && $lng && $veterinario->lat && $veterinario->lng) {
                    $earthRadius = 6371;
                    $latFrom = deg2rad($lat);
                    $lngFrom = deg2rad($lng);
                    $latTo = deg2rad($veterinario->lat);
                    $lngTo = deg2rad($veterinario->lng);
                    $latDelta = $latTo - $latFrom;
                    $lngDelta = $lngTo - $lngFrom;
                    $angle = 2 * asin(sqrt(pow(sin($latDelta / 2), 2) +
                        cos($latFrom) * cos($latTo) * pow(sin($lngDelta / 2), 2)));
                    $distancia = $angle * $earthRadius * 1000;
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
                    'avaliacao' => 0,
                    'telefone_emergencia' => $veterinario->telefone_emergencia,
                    'descricao' => $veterinario->descricao, 
                    'foto_url' => $veterinario->foto_url ? Storage::url($veterinario->foto_url) : null, 
                ];
            });
            
            if ($lat && $lng) {
                $resultados = $resultados->filter(function ($item) {
                    return $item['distancia'] !== null && $item['distancia'] < 50000;
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

        $emergencia->veterinario_id = $veterinario->id;
        $emergencia->status = 'accepted';
        $emergencia->save();

        broadcast(new EmergenciaAtualizada($emergencia))->toOthers();

        return response()->json(['message' => 'Emergência aceita', 'emergencia' => $emergencia]);
    }

    public function rejectEmergencia(Request $request, Veterinario $veterinario, Emergencia $emergencia)
    {
        $user = $request->user();
        if (!$user || !$user->veterinario || $user->veterinario->id !== $veterinario->id) {
            return response()->json(['error' => 'Não autorizado'], 403);
        }

        $emergencia->veterinario_id = null;
        $emergencia->status = 'rejected';
        $emergencia->save();

        broadcast(new EmergenciaAtualizada($emergencia))->toOthers();
        
        $emergenciaController = new EmergenciaControllerApi();
        return $emergenciaController->redirectToClinic($request, $emergencia);
    }
}