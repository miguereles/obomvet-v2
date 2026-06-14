<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class StoreProntuarioRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return auth('api')->check() && in_array(auth('api')->user()->tipo, ['veterinario', 'clinica', 'admin']);
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'pet_id' => ['required', 'integer', 'exists:pets,id'],
            'veterinario_id' => ['nullable', 'integer', 'exists:veterinarios,id'],
            'clinica_id' => ['nullable', 'integer', 'exists:clinicas,id'],
            'emergencia_id' => ['nullable', 'integer', 'exists:emergencias,id'],
            'tipo_registro' => ['required', 'string', 'max:100'],
            'diagnostico' => ['required', 'string', 'max:2000'],
            'tratamento' => ['nullable', 'string', 'max:2000'],
            'prescricao' => ['nullable', 'string', 'max:1000'],
            'observacoes' => ['nullable', 'string', 'max:1000'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'pet_id.required' => 'O pet é obrigatório.',
            'pet_id.exists' => 'O pet informado não existe.',
            'tipo_registro.required' => 'O tipo de registro é obrigatório.',
            'diagnostico.required' => 'O diagnóstico é obrigatório.',
        ];
    }
}
