<?php

namespace App\Http\Controllers\Api;

use App\Models\Pet;
use App\Models\Tutor;
use App\Events\NovaEmergencia;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PetController extends Controller
{
    // Construtor removido para permitir acesso público a criação de pets

    public function index()
    {
        return Pet::all();
    }

    public function store(Request $request)
    {
        // ================== CORREÇÃO AQUI ==================
        $user = $request->user();
        // Verifica se é um tutor logado ANTES da validação
        $isLoggedInTutor = ($user && method_exists($user, 'tutor') && $user->tutor);

        // Define as regras básicas
        $rules = [
            'nome' => 'required|string|max:100',
            'especie' => 'required|string|max:100',
            'raca' => 'nullable|string|max:100',
            'data_nascimento' => 'nullable|date',
            'peso' => 'nullable|numeric|min:0',
            'alergias' => 'nullable|string',
            'medicamentos_continuos' => 'nullable|string',
            'cuidados_especiais' => 'nullable|string',
            'tutor_id' => 'nullable|exists:tutors,id',
            'recaptcha_token' => 'nullable|string'
        ];

        // Adiciona regras de anônimo SOMENTE se o usuário NÃO ESTIVER LOGADO
        if (!$isLoggedInTutor) {
            $rules['tutor_nome'] = 'required_without:tutor_id|string|max:100';
            $rules['tutor_telefone'] = 'required_without:tutor_id|string|max:20';
        }

        // Validação adaptada
        $validated = $request->validate($rules);
        // ================== FIM DA CORREÇÃO ==================


        // Optional reCAPTCHA verification (requires RECAPTCHA_SECRET in env)
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
                Log::warning('reCAPTCHA verification failed: ' . $e->getMessage());
            }
        }

        try {
            \DB::beginTransaction();

            // Se o usuário estiver autenticado e tiver tutor, associe o tutor existente
            // Usamos a variável que já checamos
            if ($isLoggedInTutor) {
                $validated['tutor_id'] = $user->tutor->id;
            }

            // Se ainda não tiver tutor_id (ANÔNIMO), criar um Tutor temporário
            if (empty($validated['tutor_id'])) {
                $tutor = Tutor::create([
                    'usuario_id' => null,
                    'nome_completo' => $validated['tutor_nome'],
                    'telefone_principal' => $validated['tutor_telefone']
                ]);
                // gerar token de edição para tutor anônimo
                try {
                    $tutorToken = bin2hex(random_bytes(16));
                    $tutor->anonymous_edit_token = $tutorToken;
                    $tutor->anonymous_edit_token_expires_at = now()->addDays(7);
                    $tutor->save();
                } catch (\Exception $e) {
                    Log::warning('Falha ao gerar token para tutor anônimo: ' . $e->getMessage());
                }

                $validated['tutor_id'] = $tutor->id;
            }

            // Remover campos extras
            unset($validated['tutor_nome'], $validated['tutor_telefone'], $validated['recaptcha_token']);

            $pet = Pet::create($validated);

            // gerar token para pet anônimo
            try {
                $petToken = bin2hex(random_bytes(16));
                $pet->anonymous_edit_token = $petToken;
                $pet->anonymous_edit_token_expires_at = now()->addDays(7);
                $pet->save();
            } catch (\Exception $e) {
                Log::warning('Falha ao gerar token para pet anônimo: ' . $e->getMessage());
            }

            \DB::commit();

            // retornar tokens gerados (quando aplicável) para o cliente
            $response = ['pet' => $pet];
            if (isset($tutorToken)) $response['edit_tokens']['tutor'] = $tutorToken;
            if (isset($petToken)) $response['edit_tokens']['pet'] = $petToken;

            return response()->json($response, 201);
        } catch (\Exception $e) {
            \DB::rollback();
            return response()->json(['error' => 'Erro ao cadastrar pet: ' . $e->getMessage()], 500);
        }
    }

    public function show(Pet $pet)
    {
        return $pet;
    }

    public function update(Request $request, Pet $pet)
    {
        $pet->update($request->all());
        return $pet;
    }

    public function destroy(Pet $pet)
    {
        $pet->delete();
        return response()->noContent();
    }

    // Atualizar pet usando token anônimo
    public function updateWithToken(Request $request, Pet $pet)
    {
        $token = $request->query('token') ?? $request->input('token');
        if (!$token || $pet->anonymous_edit_token !== $token) {
            return response()->json(['error' => 'Token inválido'], 403);
        }

        if ($pet->anonymous_edit_token_expires_at && now()->greaterThan($pet->anonymous_edit_token_expires_at)) {
            return response()->json(['error' => 'Token expirado'], 403);
        }

        $data = $request->validate([
            'nome' => 'sometimes|required|string|max:100',
            'especie' => 'sometimes|required|string|max:100',
            'raca' => 'sometimes|nullable|string|max:100',
            'data_nascimento' => 'sometimes|nullable|date',
            'peso' => 'sometimes|nullable|numeric|min:0',
            'alergias' => 'sometimes|nullable|string',
            'medicamentos_continuos' => 'sometimes|nullable|string',
            'cuidados_especiais' => 'sometimes|nullable|string',
        ]);

        $pet->update($data);
        return response()->json($pet);
    }

    // Deletar pet usando token anônimo
    public function destroyWithToken(Request $request, Pet $pet)
    {
        $token = $request->query('token') ?? $request->input('token');
        if (!$token || $pet->anonymous_edit_token !== $token) {
            return response()->json(['error' => 'Token inválido'], 403);
        }

        if ($pet->anonymous_edit_token_expires_at && now()->greaterThan($pet->anonymous_edit_token_expires_at)) {
            return response()->json(['error' => 'Token expirado'], 403);
        }

        $pet->delete();
        return response()->noContent();
    }

    public function getTutors(Pet $pet)
    {
        return $pet->tutor;
    }

    public function getEmergencias(Pet $pet)
    {
        return $pet->emergencias()->get();
    }

    public function storeEmergencia(Request $request, Pet $pet)
    {
        $data = $request->all();
        $tutor = $pet->tutor;
        $data['tutor_id'] = $tutor ? $tutor->id : null;
        $data['veterinario_id'] = $data['veterinario_id'] ?? null;
        
        $emergencia = $pet->emergencias()->create($data);

        NovaEmergencia::dispatch($emergencia);
        
        return response()->json($emergencia, 201);
    }

    public function storeProntuario(Request $request, Pet $pet)
    {
        $prontuario = $pet->prontuarios()->create($request->all());
        return response()->json($prontuario, 201);
    }

    public function getProntuarios(Pet $pet)
    {
        return $pet->prontuarios()->get();
    }

    public function getFoto(Pet $pet)
    {
        return $pet->fotoPet;
    }
}