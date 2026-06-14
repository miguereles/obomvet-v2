<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class StorePetRequest extends FormRequest
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
            'tutor_id' => ['nullable', 'integer', 'exists:tutores,id'],
            'nome' => ['required', 'string', 'max:100'],
            'especie' => ['required', 'string', 'max:50'],
            'raca' => ['nullable', 'string', 'max:100'],
            'data_nascimento' => ['nullable', 'date', 'before:today'],
            'sexo' => ['nullable', 'in:Macho,Fêmea'],
            'castrado' => ['nullable', 'boolean'],
            'peso' => ['nullable', 'numeric', 'min:0.1', 'max:500'],
            'alergias' => ['nullable', 'string', 'max:500'],
            'medicamentos_continuos' => ['nullable', 'string', 'max:500'],
            'cuidados_especiais' => ['nullable', 'string', 'max:500'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'nome.required' => 'O nome do pet é obrigatório.',
            'nome.max' => 'O nome do pet não pode ter mais de 100 caracteres.',
            'especie.required' => 'A espécie do pet é obrigatória.',
            'data_nascimento.before' => 'A data de nascimento deve ser anterior a hoje.',
            'peso.min' => 'O peso deve ser maior que 0.',
            'sexo.in' => 'O sexo deve ser Macho ou Fêmea.',
        ];
    }
}
