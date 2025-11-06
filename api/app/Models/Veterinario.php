<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Veterinario extends Model
{
    use HasFactory;

    protected $fillable = [
        'usuario_id',
        'clinica_id',
        'nome_completo',
        'crmv',
        'visita_tipo',
        'localizacao',
        'especialidade',
        'telefone_emergencia',
        'disponivel_24h',
        'autonomo',
        'area_atuacao',
        'endereco',
        'lat',
        'lng',
        'descricao', // NOVO: Adicionado aqui
        'foto_url', // NOVO: Adicionado aqui
    ];

    protected $casts = [
        'disponivel_24h' => 'boolean',
        'autonomo' => 'boolean',
        'area_atuacao' => 'array',
        'lat' => 'float',
        'lng' => 'float',
    ];

    public function user()
    {
        return $this->belongsTo(Usuario::class);
    }

    public function emergencias()
    {
        return $this->hasMany(Emergencia::class);
    }
    public function anexos()
    {
        return $this->morphOne(Anexo::class, 'anexable');
    }

    public function historicoAtendimentos()
    {
        return $this->hasMany(HistoricoAtendimento::class);
    }
}