<?php

namespace App\Http\Controllers\Api;

use App\Models\Clinica;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage; // ADICIONADO

class ClinicaController extends Controller
{
    public function __construct()
    {
        $this->authorizeResource(Clinica::class, 'clinica');
    }

    public function index()
    {
        return Clinica::all();
    }

    public function store(Request $request)
    {
        return Clinica::create($request->all());
    }

    public function show(Clinica $clinica)
    {
        return $clinica;
    }

    public function update(Request $request, Clinica $clinica)
    {
        $validated = $request->validate([
            'nome_fantasia' => 'sometimes|required|string|max:255',
            'endereco' => 'sometimes|required|string|max:255',
            'telefone_emergencia' => 'sometimes|required|string|max:255',
            'email_contato' => 'sometimes|nullable|email|max:255',
            'horario_funcionamento' => 'sometimes|nullable|string|max:255',
            'disponivel_24h' => 'sometimes|boolean',
            'publica' => 'sometimes|boolean',
            'descricao' => 'sometimes|nullable|string|max:255',
        ]);
        
        $clinica->update($validated);
        return $clinica;
    }
    
    /**
     * NOVO: Retorna os dados da clínica logada (para o dashboard).
     * ROTA: GET /clinicas/minha
     */
    public function minha(Request $request)
    {
        $user = $request->user();
        if (!$user || !$user->clinica) {
            return response()->json(['error' => 'Usuário não vinculado a uma clínica.'], 403);
        }
        
        $clinica = $user->clinica->load(['veterinarios']);
        
        // CORREÇÃO: Converte o caminho para URL pública
        if ($clinica->foto_url) {
             $clinica->foto_url = Storage::url($clinica->foto_url);
        }

        // Retorna a clínica completa, carregando os novos campos
        return response()->json($clinica);
    }
    
    /**
     * NOVO: Faz upload da foto de perfil da clínica.
     * ROTA: POST /clinicas/{id}/foto
     */
    public function uploadFoto(Request $request, Clinica $clinica)
    {
        $user = $request->user();
        // A política de autorização (ClinicaPolicy) deve garantir que apenas o dono possa atualizar.
        // Se a política não estiver 100%, esta verificação extra ajuda:
        if (!$user || !$user->clinica || $user->clinica->id !== $clinica->id) {
            return response()->json(['error' => 'Não autorizado.'], 403);
        }

        $request->validate([
            'foto' => 'required|image|max:2048', // max 2MB
        ]);

        // Deleta foto antiga se existir
        if ($clinica->foto_url && Storage::disk('public')->exists($clinica->foto_url)) {
            Storage::disk('public')->delete($clinica->foto_url);
        }

        // Salva nova foto
        $path = $request->file('foto')->store('clinicas/fotos', 'public');
        
        // Salva o caminho no banco
        $clinica->foto_url = $path;
        $clinica->save();

        // Retorna a URL completa que o frontend espera
        return response()->json(['foto_url' => Storage::url($path)]);
    }

    public function destroy(Clinica $clinica)
    {
        $clinica->delete();
        return response()->noContent();
    }
    
    public function indexPublic()
   { 
    // Retorna apenas os campos necessários para o mapa, incluindo os novos
    $clinicas = Clinica::select('id', 'nome_fantasia', 'endereco', 'localizacao', 'publica', 'telefone_emergencia', 'descricao', 'foto_url')->get();
    
    // Converte o caminho para URL pública na coleção de resultados
    $clinicas->each(function ($clinica) {
        if ($clinica->foto_url) {
            $clinica->foto_url = Storage::url($clinica->foto_url);
        }
    });

    return $clinicas;
   }
    public function getVeterinarios(Request $request, $clinica_id)
    {
        try {
            $clinica = Clinica::findOrFail($clinica_id);
            return response()->json($clinica->veterinarios()->get());
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'error' => 'Clínica não encontrada',
                'message' => 'A clínica especificada não existe'
            ], 404);
        } catch (\Exception $e) {
            \Log::error('Erro ao buscar veterinários:', [
                'clinica_id' => $clinica_id,
                'error' => $e->getMessage()
            ]);
            return response()->json([
                'error' => 'Erro interno',
                'message' => 'Ocorreu um erro ao buscar os veterinários'
            ], 500);
        }
    }

    public function getAnexo(Clinica $clinica)
    {
        return $clinica->anexos ?? null;
    }

    public function storeVeterinario(Request $request, Clinica $clinica)
    {
        $veterinario = $clinica->veterinarios()->create($request->all());
        return response()->json($veterinario, 201);
    }

    public function storeAnexo(Request $request, Clinica $clinica)
    {
        $arquivo = $request->file('arquivo');
        $anexo = $clinica->anexo()->create([
            'arquivo' => $arquivo->store('anexos', 'public'),
            'descricao' => $request->descricao
        ]);
        return response()->json($anexo, 201);
    }
}