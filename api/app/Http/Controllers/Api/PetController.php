<?php

namespace App\Http\Controllers\Api;

use App\Models\Pet;
use App\Events\NovaEmergencia;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class PetController extends Controller
{
    public function __construct()
    {
        $this->authorizeResource(Pet::class, 'pet');
    }

    public function index()
    {
        return Pet::all();
    }

    public function store(Request $request)
    {
        // ✅ Validação mínima para evitar erro 500
        $validated = $request->validate([
            'nome' => 'required|string|max:100',
            'especie' => 'required|string|max:100',
            'raca' => 'nullable|string|max:100',
            'data_nascimento' => 'nullable|date',
            'peso' => 'nullable|numeric|min:0',
            'alergias' => 'nullable|string',
            'medicamentos_continuos' => 'nullable|string',
            'cuidados_especiais' => 'nullable|string',
            'tutor_id' => 'required|exists:usuarios,id',
        ]);

        
        $pet = Pet::create($validated);
        return response()->json($pet, 201);
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

    public function getTutors(Pet $pet)
    {
        return $pet->tutor()->get();
    }

    public function getEmergencias(Pet $pet)
    {
        return $pet->emergencias()->get();
    }

    public function storeEmergencia(Request $request, Pet $pet)
    {
        $data = $request->all();
        $data['tutor_id'] = $pet->tutor()->first()->id;
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