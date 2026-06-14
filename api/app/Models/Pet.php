<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Pet extends Model
{
    use HasFactory;

    protected $fillable = [
        'nome',
        'especie',
        'raca',
        'data_nascimento',
        'peso',
        'alergias',
        'medicamentos_continuos',
        'cuidados_especiais',
        'sexo',
        'castrado',
        'tutor_id',
    ];

    protected $casts = [
        'data_nascimento' => 'date',
    ];

    public function tutor()
    {
        return $this->belongsTo(Tutor::class, 'tutor_id');
    }
     public function fotoPet()
    {
        return $this->morphOne(Anexo::class, 'anexable');
    }
    public function emergencias()
    {
        return $this->hasMany(Emergencia::class);
    }
}