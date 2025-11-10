<?php

namespace App\Http\Controllers\Api;

use App\Models\Tutor;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class TutorController extends Controller
{
    public function __construct()
    {
        // Aplica políticas de autorização nos métodos padrões (exceto métodos customizados)
        $this->authorizeResource(Tutor::class, 'tutor', [
            // ✅ CORREÇÃO: Adicionado 'meu' às exceções
            'except' => ['getByUsuario', 'getPets', 'getEmergencias', 'meu']
        ]);
    }

    // Listar todos os tutores
    public function index()
    {
        return response()->json(Tutor::all());
    }

    // Criar tutor
    public function store(Request $request)
    {
        $data = $request->validate([
            'usuario_id' => 'required|integer|exists:usuarios,id',
            'nome' => 'required|string|max:255',
            'telefone' => 'nullable|string|max:20',
            'endereco' => 'nullable|string|max:255',
        ]);

        $tutor = Tutor::create($data);
        return response()->json($tutor, 201);
    }

    // Mostrar tutor específico
    public function show(Tutor $tutor)
    {
        return response()->json($tutor);
    }

    // Atualizar tutor
    public function update(Request $request, Tutor $tutor)
    {
        $data = $request->validate([
            'nome' => 'sometimes|required|string|max:255',
            'telefone' => 'sometimes|nullable|string|max:20',
            'endereco' => 'sometimes|nullable|string|max:255',
        ]);

        $tutor->update($data);
        return response()->json($tutor);
    }

    // Deletar tutor
    public function destroy(Tutor $tutor)
    {
        $tutor->delete();
        return response()->noContent();
    }

    // Atualizar tutor usando token anônimo
    public function updateWithToken(Request $request, Tutor $tutor)
    {
        $token = $request->query('token') ?? $request->input('token');
        if (!$token || $tutor->anonymous_edit_token !== $token) {
            return response()->json(['error' => 'Token inválido'], 403);
        }

        if ($tutor->anonymous_edit_token_expires_at && now()->greaterThan($tutor->anonymous_edit_token_expires_at)) {
            return response()->json(['error' => 'Token expirado'], 403);
        }

        $data = $request->validate([
            'nome' => 'sometimes|required|string|max:255',
            'telefone' => 'sometimes|nullable|string|max:20',
            'endereco' => 'sometimes|nullable|string|max:255',
        ]);

        $tutor->update($data);
        return response()->json($tutor);
    }

    // Deletar tutor usando token anônimo
    public function destroyWithToken(Request $request, Tutor $tutor)
    {
        $token = $request->query('token') ?? $request->input('token');
        if (!$token || $tutor->anonymous_edit_token !== $token) {
            return response()->json(['error' => 'Token inválido'], 403);
        }

        if ($tutor->anonymous_edit_token_expires_at && now()->greaterThan($tutor->anonymous_edit_token_expires_at)) {
            return response()->json(['error' => 'Token expirado'], 403);
        }

        $tutor->delete();
        return response()->noContent();
    }

    // Retorna pets do tutor
    public function getPets(Tutor $tutor)
    {
        return response()->json($tutor->pets);
    }

    // Retorna emergências do tutor
    public function getEmergencias(Tutor $tutor)
    {
        return response()->json($tutor->emergencias);
    }

    // Adiciona pet ao tutor
    public function storePet(Request $request, Tutor $tutor)
    {
        $data = $request->validate([
            'nome' => 'required|string|max:255',
            'idade' => 'nullable|integer',
            'raca' => 'nullable|string|max:100',
            'peso' => 'nullable|numeric',
        ]);

        $pet = $tutor->pets()->create($data);
        return response()->json($pet, 201);
    }

    // Buscar tutor pelo usuário
    public function getByUsuario($usuario_id)
    {
        $tutor = Tutor::with(['pets', 'emergencias'])
                       ->where('usuario_id', $usuario_id)
                       ->first();

        if (!$tutor) {
            return response()->json(['message' => 'Tutor não encontrado'], 404);
        }

        return response()->json($tutor);
    }
    
    // ✅ NOVO MÉTODO
    /**
     * Retorna os dados do tutor logado (para o dashboard e hooks).
     * ROTA: GET /tutor/meu
     */
    public function meu(Request $request)
    {
        $user = $request->user();
        if (!$user || !$user->tutor) {
            return response()->json(['error' => 'Usuário não vinculado a um perfil de tutor.'], 403);
        }
        
        // Carrega o tutor com seus pets e emergências
        $tutor = $user->tutor()->with(['pets', 'emergencias'])->first();
        
        if (!$tutor) {
             return response()->json(['error' => 'Perfil de tutor não encontrado.'], 404);
        }

        return response()->json($tutor);
    }
}