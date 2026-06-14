<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class StoreAnexoRequest extends FormRequest
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
            'arquivo' => ['required', 'file', 'max:5120', 'mimes:pdf,doc,docx,jpg,jpeg,png,webp,xls,xlsx,txt,mp4,webm,mp3,wav,zip,rar'],
            'descricao' => ['nullable', 'string', 'max:500'],
            'tipo' => ['nullable', 'string', 'max:50'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'arquivo.required' => 'O arquivo é obrigatório.',
            'arquivo.file' => 'O upload deve ser um arquivo válido.',
            'arquivo.max' => 'O arquivo não pode ter mais de 5MB.',
            'arquivo.mimes' => 'O tipo de arquivo não é permitido. Tipos aceitos: PDF, DOC, DOCX, JPG, PNG, WEBP, XLS, XLSX, TXT, MP4, WEBM, MP3, WAV, ZIP, RAR.',
        ];
    }
}
