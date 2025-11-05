<?php

namespace App\Http\Controllers\Api;

use App\Models\Usuario;
use App\Models\Tutor;
use App\Models\Veterinario;
use App\Models\Clinica;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UsuarioController extends Controller
{
    public function __construct()
    {
        $this->authorizeResource(Usuario::class, 'usuario');
    }

    public function index()
    {
        return Usuario::all();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nome_completo' => 'required|string',
            'email' => 'required|email|unique:usuarios,email',
            'password' => 'required|string|min:6',
            'tipo' => 'required|string|in:tutor,veterinario,clinica',
        ]);

        $validated['password'] = Hash::make($validated['password']);

        $usuario = Usuario::create($validated);

        // Cria modelo associado com dados obrigatórios
        $this->ensureAssociatedModel($usuario, $request);

        return response()->json(array_merge(
            $usuario->toArray(),
            $this->attachedIds($usuario)
        ), 201);
    }

    public function show(Usuario $usuario)
    {
        return array_merge(
            $usuario->toArray(),
            $this->attachedIds($usuario)
        );
    }

    public function update(Request $request, Usuario $usuario)
    {
        $validated = $request->validate([
            'nome_completo' => 'required|string',
            'email' => 'sometimes|email|unique:usuarios,email,' . $usuario->id,
            'password' => 'sometimes|string|min:6',
            'tipo' => 'sometimes|string|in:tutor,veterinario,clinica'
        ]);

        if (isset($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        }

        $usuario->update($validated);

        $this->ensureAssociatedModel($usuario, $request);

        return array_merge(
            $usuario->toArray(),
            $this->attachedIds($usuario)
        );
    }

    public function destroy(Usuario $usuario)
    {
        $usuario->delete();
        return response()->noContent();
    }

    protected function attachedIds(Usuario $usuario)
    {
        return [
            'tutor_id' => $usuario->tutor->id ?? null,
            'veterinario_id' => $usuario->veterinario->id ?? null,
            'clinica_id' => $usuario->clinica->id ?? null,
        ];
    }

    /**
     * Cria o modelo associado com dados obrigatórios se não existir
     */
    protected function ensureAssociatedModel(Usuario $usuario, Request $request)
    {
        if ($usuario->isTutor()) {
            if (! $usuario->tutor) {
                $usuario->tutor()->create([
                    'nome_completo' => $request->input('nome_completo', ''),
                    'telefone_principal' => $request->input('telefone_principal', ''),
                    'telefone_alternativo' => $request->input('telefone_alternativo', null),
                    'cpf' => $request->input('cpf', ''),
                ]);
            }
        }

        if ($usuario->isVeterinario()) {
            if (! $usuario->veterinario) {
                $usuario->veterinario()->create([
                    'nome_completo' => $request->input('nome_completo', ''),
                    'crmv' => $request->input('crmv', ''),
                    'localizacao' => $request->input('localizacao', ''),
                    'especialidade' => $request->input('especialidade', ''),
                    'telefone_emergencia' => $request->input('telefone_emergencia', ''),
                    'disponivel_24h' => $request->input('disponivel_24h', false),
                ]);
            }
        }

        if ($usuario->isClinica()) {
            if (! $usuario->clinica) {
                $usuario->clinica()->create([
                    'cnpj' => $request->input('cnpj', ''),
                    'nome_fantasia' => $request->input('nome_fantasia', ''),
                    'razao_social' => $request->input('razao_social', ''),
                    'endereco' => $request->input('endereco', ''),
                    'telefone_principal' => $request->input('telefone_principal', ''),
                    'telefone_emergencia' => $request->input('telefone_emergencia', ''),
                    'email_contato' => $request->input('email_contato', $usuario->email),
                    'horario_funcionamento' => $request->input('horario_funcionamento', '08:00-18:00'),
                    'disponivel_24h' => $request->input('disponivel_24h', false),
                    'localizacao' => $request->input('localizacao', ''),
                ]);
            }
        }
    }
}