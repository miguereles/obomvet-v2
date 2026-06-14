<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Prontuario extends Model
{
    use HasFactory;

    protected $fillable = [
        'pet_id',
        'veterinario_id',
        'clinica_id',
        'emergencia_id', // opcional
        'tipo_registro', // Ex: consulta, exame, vacina, cirurgia
        'descricao',
        'diagnostico',
        'prescricao',
        'data_registro',
    ];

    protected $casts = [
        'data_registro' => 'datetime',
    ];

    // RELACIONAMENTOS
    public function pet()
    {
        return $this->belongsTo(Pet::class);
    }

    public function veterinario()
    {
        return $this->belongsTo(Veterinario::class);
    }

    public function clinica()
    {
        return $this->belongsTo(Clinica::class);
    }

    public function emergencia()
    {
        return $this->belongsTo(Emergencia::class);
    }

    // RELACIONAMENTO POLIMÓRFICO COM ANEXOS
    public function anexos()
    {
        return $this->morphMany(Anexo::class, 'anexable');
    }
}
}