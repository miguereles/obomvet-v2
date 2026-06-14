<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class StoreVeterinarioRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return auth('api')->check();
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'usuario_id' => ['required_if:autonomo,false', 'nullable', 'integer', 'exists:usuarios,id'],
            'clinica_id' => ['required_if:autonomo,false', 'nullable', 'integer', 'exists:clinicas,id'],
            'nome_completo' => ['required', 'string', 'max:150'],
            'email' => ['required', 'email', 'max:100'],
            'crmv' => ['required', 'string', 'max:50', 'unique:veterinarios,crmv'],
            'especialidade' => ['nullable', 'string', 'max:100'],
            'telefone_emergencia' => ['required', 'string', 'max:20'],
            'disponivel_24h' => ['boolean'],
            'autonomo' => ['boolean'],
            'endereco' => ['nullable', 'string', 'max:255'],
            'lat' => ['nullable', 'numeric', 'between:-90,90'],
            'lng' => ['nullable', 'numeric', 'between:-180,180'],
            'descricao' => ['nullable', 'string', 'max:1000'],
            'foto' => ['nullable', 'image', 'mimes:jpeg,png,jpg,webp', 'max:5120'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'nome_completo.required' => 'O nome completo é obrigatório.',
            'crmv.required' => 'O CRMV é obrigatório.',
            'crmv.unique' => 'Já existe um veterinário cadastrado com este CRMV.',
            'email.required' => 'O e-mail é obrigatório.',
            'email.email' => 'O e-mail informado é inválido.',
            'telefone_emergencia.required' => 'O telefone de emergência é obrigatório.',
            'clinica_id.required_if' => 'A clínica é obrigatória para veterinários não autônomos.',
            'usuario_id.required_if' => 'O usuário é obrigatório para veterinários não autônomos.',
            'foto.max' => 'A imagem não pode ter mais de 5MB.',
        ];
    }
}
