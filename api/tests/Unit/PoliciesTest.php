<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Policies\ClinicaPolicy;
use App\Policies\VeterinarioPolicy;
use App\Models\Usuario;
use App\Models\Clinica;
use App\Models\Veterinario;

class PoliciesTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        // Ensure Eloquent has a connection resolver in the test environment
        \Illuminate\Database\Eloquent\Model::setConnectionResolver($this->app['db']);
    }

    public function test_clinica_policy_update_and_delete_allowed_only_for_linked_user()
    {
        $policy = new ClinicaPolicy();

        $user = new Usuario();
        $clinica = new Clinica(['id' => 10]);

        // user not linked to clinic
        $this->assertFalse($policy->update($user, $clinica));
        $this->assertFalse($policy->delete($user, $clinica));

        // link user to clinic
        $user->clinica = $clinica;
        $this->assertTrue($policy->update($user, $clinica));
        $this->assertTrue($policy->delete($user, $clinica));
    }

    public function test_veterinario_policy_create_update_delete_rules()
    {
        $policy = new VeterinarioPolicy();

        $user = new Usuario();
        $clinica = new Clinica(['id' => 5]);
        $veterinario = new Veterinario(['clinica_id' => 5]);

        // without clinic link, cannot create
        $this->assertFalse($policy->create($user));

        // link user to clinic
        $user->clinica = $clinica;
        $this->assertTrue($policy->create($user));

        // update/delete only if vet belongs to user's clinic
        $this->assertTrue($policy->update($user, $veterinario));
        $this->assertTrue($policy->delete($user, $veterinario));

        // different clinic
        $veterinario2 = new Veterinario(['clinica_id' => 999]);
        $this->assertFalse($policy->update($user, $veterinario2));
        $this->assertFalse($policy->delete($user, $veterinario2));
    }
}
