<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class StoreClinicaRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return auth('api')->check() && auth('api')->user()->tipo === 'clinica';
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'nome_fantasia' => ['required', 'string', 'max:150'],
            'razao_social' => ['nullable', 'string', 'max:150'],
            'cnpj' => ['nullable', 'string', 'regex:/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/'],
            'endereco' => ['nullable', 'string', 'max:255'],
            'telefone_principal' => ['nullable', 'string', 'max:20'],
            'telefone_emergencia' => ['nullable', 'string', 'max:20'],
            'email_contato' => ['nullable', 'email', 'max:100'],
            'horario_funcionamento' => ['nullable', 'string', 'max:200'],
            'disponivel_24h' => ['boolean'],
            'publica' => ['boolean'],
            'descricao' => ['nullable', 'string', 'max:1000'],
            'foto' => ['nullable', 'image', 'mimes:jpeg,png,jpg,webp', 'max:5120'],
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
            'nome_fantasia.required' => 'O nome fantasia da clínica é obrigatório.',
            'cnpj.regex' => 'O CNPJ deve estar no formato: 00.000.000/0000-00',
            'email_contato.email' => 'O e-mail informado é inválido.',
            'foto.image' => 'O arquivo deve ser uma imagem válida.',
            'foto.mimes' => 'A imagem deve estar em um dos formatos: jpeg, png, jpg, webp.',
            'foto.max' => 'A imagem não pode ter mais de 5MB.',
        ];
    }
}
