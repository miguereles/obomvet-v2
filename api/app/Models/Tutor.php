<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
// ✅ [CORREÇÃO 1] Importa o Trait de Push Subscriptions
use NotificationChannels\WebPush\HasPushSubscriptions;

class Tutor extends Model
{
    // ✅ [CORREÇÃO 2] Adiciona os Traits Notifiable e HasPushSubscriptions
    use HasFactory, Notifiable, HasPushSubscriptions;

    protected $fillable = [
        'usuario_id',
        'nome_completo',
        'telefone_principal',
        'email_contato',
        'telefone_alternativo',
        'endereco_id',
        'cpf',
        'foto_url',
        'foto_perfil_path',
        'descricao',
        'preferencias_contato',
        'informacoes_adicionais',
        'anonymous_edit_token',
        'anonymous_edit_token_expires_at',
    ];

    protected $casts = [
        'preferencias_contato' => 'array',
        'anonymous_edit_token_expires_at' => 'datetime',
    ];

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'usuario_id');
    }

    public function pets(): HasMany
    {
        return $this->hasMany(Pet::class, 'tutor_id');
    }

    public function emergencias(): HasMany
    {
        return $this->hasMany(Emergencia::class, 'tutor_id');
    }
}