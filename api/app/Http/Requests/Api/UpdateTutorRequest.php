<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTutorRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return auth('api')->check() && auth('api')->user()->tipo === 'tutor';
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'nome_completo' => ['required', 'string', 'max:150'],
            'email_contato' => ['nullable', 'email', 'max:100'],
            'telefone_principal' => ['required', 'string', 'max:20'],
            'telefone_alternativo' => ['nullable', 'string', 'max:20'],
            'cpf' => ['required', 'string', 'regex:/^\d{3}\.\d{3}\.\d{3}-\d{2}$/'],
            'descricao' => ['nullable', 'string', 'max:500'],
            'foto' => ['nullable', 'image', 'mimes:jpeg,png,jpg,webp', 'max:5120'],
            'endereco' => ['nullable', 'string', 'max:255'],
            'cidade' => ['nullable', 'string', 'max:100'],
            'estado' => ['nullable', 'string', 'size:2'],
            'cep' => ['nullable', 'string', 'regex:/^\d{5}-\d{3}$/'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'nome_completo.required' => 'O nome completo é obrigatório.',
            'telefone_principal.required' => 'O telefone principal é obrigatório.',
            'cpf.regex' => 'O CPF deve estar no formato: 000.000.000-00',
            'email_contato.email' => 'O e-mail informado é inválido.',
            'foto.image' => 'O arquivo deve ser uma imagem válida.',
            'foto.max' => 'A imagem não pode ter mais de 5MB.',
            'cep.regex' => 'O CEP deve estar no formato: 00000-000',
            'estado.size' => 'O estado deve ter 2 caracteres (ex: SP, RJ).',
        ];
    }
}
