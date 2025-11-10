<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Usuario;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Auth\Events\Registered;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;
use PHPOpenSourceSaver\JWTAuth\Exceptions\JWTException;
use Illuminate\Validation\ValidationException;
// ✅ IMPORTS ADICIONADOS
use Illuminate\Support\Facades\Log;
use App\Models\Tutor;
use App\Models\Pet;
use App\Models\Emergencia;

class AuthController extends Controller
{
    /**
     * Registrar novo usuário (Tutor, Veterinário ou Clínica)
     */
    public function register(Request $request)
    {
        try {
            $tipo = strtolower($request->tipo ?? '');

            if (!in_array($tipo, ['tutor','veterinario','clinica'])) {
                return response()->json(['error'=>'Tipo de usuário inválido.'], 422);
            }

            $validated = match ($tipo) {
                'tutor' => $request->validate([
                    'name' => 'required|string|max:255',
                    'email' => 'required|string|email|max:255|unique:usuarios',
                    'password' => 'required|string|min:8',
                    'tipo' => 'required|in:tutor',
                    'nome_completo' => 'required|string|max:255',
                    'telefone_principal' => 'required|string|max:20',
                    'telefone_alternativo' => 'nullable|string|max:20',
                    'cpf' => 'required|string|size:11|unique:tutors,cpf',
                ]),
                'veterinario' => $request->validate([
                    'name' => 'required|string|max:255',
                    'email' => 'required|string|email|max:255|unique:usuarios',
                    'password' => 'required|string|min:8',
                    'tipo' => 'required|in:veterinario',
                    'crmv' => 'required|string|unique:veterinarios,crmv',
                    'nome_completo' => 'required|string|max:255',
                    // localizacao/address/area_atuacao are optional for public autonomous vets;
                    // frontend may provide localizacao as "lat,lng" and area_atuacao as an object.
                    'localizacao' => 'nullable|string|max:255',
                    'especialidade' => 'nullable|string|max:255',
                    'telefone_emergencia' => 'nullable|string|max:20',
                    'disponivel_24h' => 'nullable|boolean',
                    'autonomo' => 'nullable|boolean',
                    'endereco' => 'nullable|string|max:255',
                    // accept array/object directly (frontend sends JSON body), or null
                    'area_atuacao' => 'nullable',
                ]),
                'clinica' => $request->validate([
                    'name' => 'required|string|max:255',
                    'email' => 'required|string|email|max:255|unique:usuarios',
                    'password' => 'required|string|min:8',
                    'tipo' => 'required|in:clinica',
                    'cnpj' => 'required|string|unique:clinicas,cnpj',
                    'nome_fantasia' => 'required|string|max:255',
                    'razao_social' => 'required|string|max:255',
                    'endereco' => 'required|string|max:255',
                    'telefone_principal' => 'required|string|max:255',
                    'telefone_emergencia' => 'required|string|max:255',
                    'horario_funcionamento' => 'required|string|max:255',
                    'disponivel_24h' => 'required|boolean',
                    'localizacao' => 'required|string|max:255',
                    'email_contato' => 'nullable|email|max:255',
                ]),
            };

            // Cria usuário
            $user = Usuario::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'tipo' => $validated['tipo'],
            ]);


            // Cria relação com o tipo específico
            // Precompute veterinario-specific normalization
            $area = null;
            $localizacao = null;
            $lat = $lng = null;
            if ($user->tipo === 'veterinario') {
                $area = $validated['area_atuacao'] ?? null;
                if (is_string($area)) {
                    $decoded = json_decode($area, true);
                    if (json_last_error() === JSON_ERROR_NONE) $area = $decoded;
                }
                $localizacao = $validated['localizacao'] ?? null;
                if ($localizacao && is_string($localizacao) && strpos($localizacao, ',') !== false) {
                    [$lat, $lng] = array_map('trim', explode(',', $localizacao, 2));
                }
            }

            match ($user->tipo) {
                'tutor' => $user->tutor()->create([
                    'nome_completo' => $validated['nome_completo'],
                    'telefone_principal' => $validated['telefone_principal'],
                    'telefone_alternativo' => $validated['telefone_alternativo'] ?? null,
                    'cpf' => $validated['cpf'],
                ]),
                'veterinario' => $user->veterinario()->create([
                    'nome_completo' => $validated['nome_completo'],
                    'crmv' => $validated['crmv'],
                    'localizacao' => $localizacao,
                    'especialidade' => $validated['especialidade'] ?? null,
                    'telefone_emergencia' => $validated['telefone_emergencia'] ?? null,
                    'disponivel_24h' => $validated['disponivel_24h'] ?? false,
                    // default to true for public registrations unless explicitly false
                    'autonomo' => $validated['autonomo'] ?? true,
                    'endereco' => $validated['endereco'] ?? null,
                    'area_atuacao' => $area,
                    'lat' => $lat !== null ? (float)$lat : null,
                    'lng' => $lng !== null ? (float)$lng : null,
                ]),
                'clinica' => $user->clinica()->create([
                    'cnpj' => $validated['cnpj'],
                    'nome_fantasia' => $validated['nome_fantasia'],
                    'razao_social' => $validated['razao_social'],
                    'endereco' => $validated['endereco'],
                    'telefone_principal' => $validated['telefone_principal'],
                    'telefone_emergencia' => $validated['telefone_emergencia'],
                    'email_contato' => $validated['email_contato'] ?? $validated['email'],
                    'horario_funcionamento' => $validated['horario_funcionamento'],
                    'disponivel_24h' => $validated['disponivel_24h'],
                    'localizacao' => $validated['localizacao'],
                ]),
            };

            event(new Registered($user));

            // ✅ LÓGICA DE REIVINDICAÇÃO ADICIONADA AQUI
            $this->reclaimAnonymousData($user);

            $token = JWTAuth::fromUser($user);

            // Carregamos o relacionamento baseado no tipo
            $user->load($user->tipo);
            
            // Preparamos o ID específico baseado no tipo
            $tipo_id = null;
            if ($user->tipo === 'clinica' && $user->clinica) {
                $tipo_id = ['clinica_id' => $user->clinica->id];
            } elseif ($user->tipo === 'veterinario' && $user->veterinario) {
                $tipo_id = ['veterinario_id' => $user->veterinario->id];
            } elseif ($user->tipo === 'tutor' && $user->tutor) {
                $tipo_id = ['tutor_id' => $user->tutor->id];
            }

            $response = array_merge([
                'message' => 'Usuário criado com sucesso!',
                'usuario' => $user,
                'access_token' => $token,
                'token_type' => 'bearer',
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'tipo' => $user->tipo,
            ], $tipo_id ?? []);

            if ($user->tipo === 'clinica') $response['clinica_id'] = $user->clinica->id ?? null;
            if ($user->tipo === 'veterinario') $response['veterinario_id'] = $user->veterinario->id ?? null;
            if ($user->tipo === 'tutor') $response['tutor_id'] = $user->tutor->id ?? null;

            return response()->json($response, 201);

        } catch (ValidationException $e) {
            return response()->json([
                'error' => 'Erro de validação',
                'messages' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ], 500);
        }
    }

    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => 'required|string|email',
            'password' => 'required|string|min:8',
        ]);

        try {
            if (!$token = JWTAuth::attempt($credentials)) {
                return response()->json(['message' => 'Credenciais inválidas.'], 401);
            }
        } catch (JWTException $e) {
            return response()->json(['message' => 'Erro ao gerar token.'], 500);
        }

        $user = auth()->user();
        
        // Carrega o relacionamento específico baseado no tipo
        $user->load($user->tipo);
        
        $response = [
            'access_token' => $token,
            'token_type' => 'bearer',
            'expires_in' => JWTAuth::factory()->getTTL() * 60,
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'tipo' => $user->tipo,
        ];

        // Adiciona o ID específico baseado no tipo
        if ($user->tipo === 'clinica' && $user->clinica) {
            $response['clinica_id'] = $user->clinica->id;
        } elseif ($user->tipo === 'veterinario' && $user->veterinario) {
            $response['veterinario_id'] = $user->veterinario->id;
        } elseif ($user->tipo === 'tutor' && $user->tutor) {
            $response['tutor_id'] = $user->tutor->id;
        }

        // Log para debug
        \Log::info('Login response:', [
            'user_id' => $user->id,
            'tipo' => $user->tipo,
            'clinica_id' => $user->clinica->id ?? null,
            'veterinario_id' => $user->veterinario->id ?? null,
            'tutor_id' => $user->tutor->id ?? null
        ]);

        return response()->json($response);
    }

    public function logout(Request $request)
    {
        try {
            $token = JWTAuth::getToken();
            if (!$token) return response()->json(['error' => 'Token ausente.'], 401);

            JWTAuth::invalidate($token);
            return response()->json(['message' => 'Logout realizado com sucesso.']);
        } catch (JWTException $e) {
            return response()->json(['message' => 'Falha ao deslogar.'], 500);
        }
    }

    public function me()
    {
        return response()->json(auth()->user());
    }

    // ✅ NOVA FUNÇÃO ADICIONADA
    /**
     * Transfere dados de um tutor anônimo (por e-mail) para um novo usuário tutor.
     */
    private function reclaimAnonymousData(Usuario $user)
    {
        // Só executa se o novo usuário for um tutor
        if ($user->tipo !== 'tutor' || !$user->tutor) {
            return;
        }

        $newTutor = $user->tutor;
        $email = $user->email;

        // Procura por um tutor anônimo (sem usuario_id) com o mesmo e-mail de contato
        $anonymousTutor = Tutor::where('email_contato', $email)
                               ->whereNull('usuario_id')
                               ->first();

        // Se encontrou um tutor anônimo correspondente
        if ($anonymousTutor) {
            Log::info("Reivindicando dados anônimos para o novo usuário {$user->id} (Tutor: {$newTutor->id}) a partir do tutor anônimo {$anonymousTutor->id}");

            // 1. Transfere os Pets
            Pet::where('tutor_id', $anonymousTutor->id)
               ->update(['tutor_id' => $newTutor->id]);

            // 2. Transfere as Emergências
            Emergencia::where('tutor_id', $anonymousTutor->id)
                      ->update(['tutor_id' => $newTutor->id]);

            // 3. Remove o tutor anônimo
            $anonymousTutor->delete();
        }
    }
}