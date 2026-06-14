<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreEmergenciaRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'pet_id' => ['nullable', 'integer', 'exists:pets,id'],
            'tutor_id' => ['nullable', 'integer', 'exists:tutores,id'],
            'clinica_id' => ['nullable', 'integer', 'exists:clinicas,id'],
            'descricao_sintomas' => ['required', 'string', 'max:1000'],
            'nivel_urgencia' => ['required', Rule::in(['baixa', 'media', 'alta', 'critica'])],
            'visita_tipo' => ['nullable', Rule::in(['domicilio', 'clinica'])],
            'localizacao' => ['nullable', 'string', 'max:255'],
            'endereco' => ['nullable', 'string', 'max:500'],
            'lat' => ['nullable', 'numeric', 'between:-90,90'],
            'lng' => ['nullable', 'numeric', 'between:-180,180'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'descricao_sintomas.required' => 'A descrição dos sintomas é obrigatória.',
            'descricao_sintomas.max' => 'A descrição não pode ter mais de 1000 caracteres.',
            'nivel_urgencia.required' => 'O nível de urgência é obrigatório.',
            'nivel_urgencia.in' => 'O nível de urgência deve ser: baixa, media, alta ou critica.',
            'pet_id.exists' => 'O pet informado não existe.',
            'tutor_id.exists' => 'O tutor informado não existe.',
            'clinica_id.exists' => 'A clínica informada não existe.',
        ];
    }
}
