<?php

namespace App\Policies;

use App\Models\Emergencia;
use App\Models\Tutor;
use App\Models\Veterinario;
use App\Models\Usuario;
use Illuminate\Auth\Access\HandlesAuthorization;
use Illuminate\Auth\Access\Response;

class EmergenciaPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(Usuario $user): bool
    {
        return in_array($user->tipo, ['tutor', 'veterinario', 'clinica', 'admin']);
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(Usuario $user, Emergencia $emergencia): bool
    {
        return true;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(Usuario $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(Usuario $user, Emergencia $emergencia): bool
    {
        if ($user->tipo === 'admin') {
            return true;
        }
        
        if ($user->tipo === 'tutor' && $user->tutor) {
            return $emergencia->tutor_id === $user->tutor->id;
        }
        
        if ($user->tipo === 'veterinario' && $user->veterinario) {
            return $emergencia->veterinario_id === $user->veterinario->id;
        }
        
        if ($user->tipo === 'clinica' && $user->clinica) {
            return $emergencia->clinica_id === $user->clinica->id;
        }
        
        return false;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(Usuario $user, Emergencia $emergencia): bool
    {
        return $user->tipo === 'tutor' && $emergencia->tutor_id === $user->tutor->id;
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(Usuario $user, Emergencia $emergencia): bool
    {
        return $user->tipo === 'admin';
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(Usuario $user, Emergencia $emergencia): bool
    {
        return $user->tipo === 'admin';
    }
}