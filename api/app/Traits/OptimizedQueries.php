<?php

namespace App\Traits;

use Illuminate\Database\Query\Builder as QueryBuilder;
use Illuminate\Database\Eloquent\Builder;

trait OptimizedQueries
{
    /**
     * Get all emergencias with optimized eager loading.
     */
    public function getAllEmergenciasOptimized()
    {
        return \App\Models\Emergencia::with([
            'pet',
            'tutor',
            'veterinario',
            'clinica',
            'historicoAtendimentos',
        ])->paginate(15);
    }

    /**
     * Get all tutors with optimized eager loading.
     */
    public function getAllTutorsOptimized()
    {
        return \App\Models\Tutor::with('pets')->paginate(15);
    }

    /**
     * Get all veterinarios with optimized eager loading.
     */
    public function getAllVeterinarioOptimized()
    {
        return \App\Models\Veterinario::with(['clinica', 'usuario'])->paginate(15);
    }

    /**
     * Get all clinicas with optimized eager loading.
     */
    public function getAllClinicasOptimized()
    {
        return \App\Models\Clinica::with('veterinarios')->paginate(15);
    }

    /**
     * Get all pets with optimized eager loading.
     */
    public function getAllPetsOptimized()
    {
        return \App\Models\Pet::with('tutor')->paginate(15);
    }
}
