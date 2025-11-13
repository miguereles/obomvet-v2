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

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use App\Models\Tutor;
use App\Models\Clinica;
use App\Models\Veterinario;
use App\Models\Pet;
use App\Models\Emergencia;

class AuthController extends Controller
{
    /**
     * (As rotas 'logout', 'refresh' e 'me' são protegidas
     * individualmente no arquivo routes/api.php)
     */
    public function __construct()
    {
        // $this->middleware('auth:api', ['except' => ['login', 'register']]);
    }

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
                    'localizacao' => 'nullable|string|max:255',
                    'especialidade' => 'nullable|string|max:255',
                    'telefone_emergencia' => 'nullable|string|max:20',
                    'disponivel_24h' => 'nullable|boolean',
                    'autonomo' => 'nullable|boolean',
                    'endereco' => 'nullable|string|max:255',
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

            $this->reclaimAnonymousData($user);

            $token = JWTAuth::fromUser($user);

            $user->load($user->tipo);
            
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
        
        if ($user->tipo === 'clinica') {
            $user->clinica = Clinica::where('usuario_id', $user->id)->first();
        } elseif ($user->tipo === 'veterinario') {
            $user->veterinario = Veterinario::where('usuario_id', $user->id)->first();
        } elseif ($user->tipo === 'tutor') {
            $user->tutor = Tutor::where('usuario_id', $user->id)->first();
        }
        
        $response = [
            'access_token' => $token,
            'token_type' => 'bearer',
            'expires_in' => JWTAuth::factory()->getTTL() * 60, // Em segundos
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'tipo' => $user->tipo,
        ];

        if ($user->tipo === 'clinica' && $user->clinica) {
            $response['clinica'] = $user->clinica;
            $response['clinica_id'] = $user->clinica->id;
        } elseif ($user->tipo === 'veterinario' && $user->veterinario) {
            $response['veterinario'] = $user->veterinario;
            $response['veterinario_id'] = $user->veterinario->id;
        } elseif ($user->tipo === 'tutor' && $user->tutor) {
            $response['tutor'] = $user->tutor;
            $response['tutor_id'] = $user->tutor->id;
        }

        Log::info('Login response:', [
            'user_id' => $user->id,
            'tipo' => $user->tipo,
            'clinica_id' => $user->clinica->id ?? null,
            'veterinario_id' => $user->veterinario->id ?? null,
            'tutor_id' => $user->tutor->id ?? null
        ]);

        // Utiliza o método helper para formatar a resposta
        return $this->respondWithToken($token, $response);
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

    /**
     * Renova um token expirado (dentro da janela de refresh_ttl).
     * ROTA: POST /auth/refresh
     */
    public function refresh()
    {
        try {
            $newToken = auth('api')->refresh(true, true);
            return $this->respondWithToken($newToken, [
                'message' => 'Token renovado'
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Token não pode ser renovado', 
                'details' => $e->getMessage()
            ], 401);
        }
    }

    /**
     * Formata a resposta padrão do token.
     */
    protected function respondWithToken($token, $data = [])
    {
        $defaultData = [
            'access_token' => $token,
            'token_type' => 'bearer',
            'expires_in' => auth('api')->factory()->getTTL() * 60 // Em segundos
        ];

        return response()->json(array_merge($defaultData, $data));
    }

    /**
     * Transfere dados de um tutor anônimo (por e-mail) para um novo usuário tutor.
     */
    private function reclaimAnonymousData(Usuario $user)
    {
        if ($user->tipo !== 'tutor' || !$user->tutor) {
            return;
        }

        $newTutor = $user->tutor;
        $email = $user->email;

        $anonymousTutor = Tutor::where('email_contato', $email)
                                ->whereNull('usuario_id')
                                ->first();

        if ($anonymousTutor) {
            Log::info("Reivindicando dados anônimos para o novo usuário {$user->id} (Tutor: {$newTutor->id}) a partir do tutor anônimo {$anonymousTutor->id}");

            Pet::where('tutor_id', $anonymousTutor->id)
                ->update(['tutor_id' => $newTutor->id]);

            Emergencia::where('tutor_id', $anonymousTutor->id)
                        ->update(['tutor_id' => $newTutor->id]);

            $anonymousTutor->delete();
        }
    }
}