<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\Relations\HasOne; // ✅ [CORREÇÃO 1] Importação adicionada

class Emergencia extends Model
{
    use HasFactory;

    protected $fillable = [
        'pet_id',
        'tutor_id',
        'clinica_id',
        'veterinario_id',
        'prontuario_id',
        'status',
        'descricao_sintomas',
        'relatorio_detalhado_ia',
        'materiais_provaveis',
        'nivel_urgencia',
        'localizacao',
        'visita_tipo',
        'public_uuid',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'localizacao' => 'string',
    ];

    public function pet(): BelongsTo
    {
        return $this->belongsTo(Pet::class);
    }

    public function tutor(): BelongsTo
    {
        return $this->belongsTo(Tutor::class);
    }

    public function clinica(): BelongsTo
    {
        return $this->belongsTo(Clinica::class);
    }

    public function veterinario(): BelongsTo
    {
        return $this->belongsTo(Veterinario::class, 'veterinario_id');
    }

    // ✅ [CORREÇÃO 2] Relação 'prontuario' adicionada
    /**
     * Obtém o prontuário associado a esta emergência.
     */
    public function prontuario(): HasOne
    {
        // Assumindo que a tabela 'prontuarios' tem uma coluna 'emergencia_id'
        return $this->hasOne(Prontuario::class);
    }

    public function historicoAtendimentos(): HasMany
    {
        return $this->hasMany(HistoricoAtendimento::class, 'emergencia_id');
    }

    public function anexos(): MorphMany
    {
        return $this->morphMany(Anexo::class, 'anexable');
    }
}