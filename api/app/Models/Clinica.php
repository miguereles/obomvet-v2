<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Clinica extends Model
{
    use HasFactory;

    protected $fillable = [
        'nome_fantasia',
        'razao_social',
        'cnpj',
        'endereco',
        'telefone_principal',
        'telefone_emergencia',
        'email_contato',
        'horario_funcionamento',
        'disponivel_24h',
        'publica',
        'localizacao',
        'descricao', // NOVO: Adicionado aqui
        'foto_url', // NOVO: Adicionado aqui
        'usuario_id',
    ];

    protected $casts = [
        'disponivel_24h' => 'boolean',
        'publica' => 'boolean',
    ];

    /**
     * Uma clínica pode ter vários veterinários.
     */

    public function user()
    {
        return $this->belongsTo(Usuario::class);
    }
    public function anexos()
    {
        return $this->morphOne(Anexo::class, 'anexable');
    }
    public function clinica()
    {
        return $this->belongsTo(Clinica::class);
    }
    public function veterinarios()
{
    return $this->hasMany(Veterinario::class, 'clinica_id');
}

}