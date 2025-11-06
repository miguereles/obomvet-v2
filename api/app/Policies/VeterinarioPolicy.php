<?php

namespace App\Policies;

use App\Models\Veterinario;
use App\Models\Usuario;

class VeterinarioPolicy
{
    public function viewAny(Usuario $user): bool
    {
        return true;
    }

    public function view(Usuario $user, Veterinario $veterinario): bool
    {
        return true;
    }

    public function create(Usuario $user): bool
    {
        // Apenas usuários vinculados a uma clínica podem criar veterinários para essa clínica
        return isset($user->clinica);
    }

    public function update(Usuario $user, Veterinario $veterinario): bool
    {
        // Apenas a clínica proprietária pode atualizar um veterinário vinculado a ela
        return isset($user->clinica) && $veterinario->clinica_id === $user->clinica->id;
    }

    public function delete(Usuario $user, Veterinario $veterinario): bool
    {
        // Apenas a clínica proprietária pode deletar o veterinário
        return isset($user->clinica) && $veterinario->clinica_id === $user->clinica->id;
    }
}