<?php

namespace App\Http\Controllers\Api;

use App\Models\Emergencia;
use App\Models\Clinica;
use App\Events\NovaEmergencia;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class EmergenciaController extends Controller
{
    public function __construct()
    {
        // $this->authorizeResource(Emergencia::class, 'emergencia');
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

        if (!$user || !$user->tutor) {
            $validated = $request->validate([
                'descricao_sintomas' => 'required|string',
                'nivel_urgencia' => 'required|in:baixa,media,alta,critica',
                'pet_id' => 'nullable|exists:pets,id',
                'location' => 'nullable|array',
                'location.latitude' => 'required_with:location|numeric',
                'location.longitude' => 'required_with:location|numeric',
            ]);
            // return response()->json(['error' => 'Usuário tutor não autenticado'], 401);
        }else{
            $validated = $request->validate([
                'descricao_sintomas' => 'required|string',
                'nivel_urgencia' => 'required|in:baixa,media,alta,critica',
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

        // Busca todas as clínicas
        $todasClinicas = Clinica::all();
        if ($todasClinicas->isEmpty()) {
            return response()->json(['error' => 'Nenhuma clínica cadastrada no sistema'], 400);
        }

        // Calcula a clínica mais próxima se o usuário enviou localização
        if ($userLocation && isset($userLocation['latitude']) && isset($userLocation['longitude'])) {
            $userLat = (float) $userLocation['latitude'];
            $userLon = (float) $userLocation['longitude'];

            $distanciaMinima = PHP_INT_MAX;
            $clinicaMaisProxima = null;

            foreach ($todasClinicas as $clinica) {
                // Localização no formato "L:lat,G:lon"
                $coords = explode(',', $clinica->localizacao);
                if (count($coords) !== 2) continue;

                $clinicLat = (float) str_replace('L:', '', $coords[0]);
                $clinicLon = (float) str_replace('G:', '', $coords[1]);

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

        // Remove location para não dar erro
        unset($validated['location']);

        $emergencia = Emergencia::create($validated);
        NovaEmergencia::dispatch($emergencia);
        return response()->json([
            'emergencia' => $emergencia,
            'clinica' => $clinicaAlvo
        ], 201);
    }

    public function show(Emergencia $emergencia)
    {
        return $emergencia;
    }

    public function update(Request $request, Emergencia $emergencia)
    {
        $emergencia->update($request->all());
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
    public function porClinica(Request $request)
{
    $user = $request->user();

    // Garante que o usuário é de uma clínica
    if (!$user || !$user->clinica) {
        return response()->json(['error' => 'Usuário não é uma clínica autenticada.'], 403);
    }

    // Busca emergências associadas à clínica
    $emergencias = \App\Models\Emergencia::with(['pet', 'tutor'])
        ->where('clinica_id', $user->clinica->id)
        ->orderByDesc('created_at')
        ->get();

    return response()->json($emergencias);
}

}