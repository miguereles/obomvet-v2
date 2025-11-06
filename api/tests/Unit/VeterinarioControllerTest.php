<?php

namespace Tests\Unit;

use Tests\TestCase;
use Illuminate\Http\Request;
use App\Http\Controllers\Api\VeterinarioController;
use App\Models\Veterinario;
use App\Models\Usuario;

// A lightweight Emergenica-like class that doesn't touch DB on save
class TestEmergencia extends \App\Models\Emergencia
{
    public $saved = false;
    public function save(array $options = [])
    {
        // Just mark as saved and don't call parent to avoid DB
        $this->saved = true;
        return true;
    }
}

class VeterinarioControllerTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        // Ensure Eloquent has a connection resolver in the test environment
        \Illuminate\Database\Eloquent\Model::setConnectionResolver($this->app['db']);

        // Bind a simple events dispatcher to avoid DI errors when dispatching events
        $this->app->instance('events', new class implements \Illuminate\Contracts\Events\Dispatcher {
            public function listen($events, $listener = null) {}
            public function hasListeners($eventName) { return false; }
            public function push($event, $payload = []) {}
            public function subscribe($subscriber) {}
            public function until($event, $payload = []) { return null; }
            public function dispatch($event, $payload = [], $halt = false) { return $event; }
            public function forget($event) {}
            public function flush($event) {}
            public function forgetPushed() {}
        });
    }

    public function test_accept_emergencia_sets_veterinario_and_status()
    {
        $controller = new VeterinarioController();

        // Prepare user and veterinarian
        $user = new Usuario();
        $v = new Veterinario(['id' => 7]);
        $user->veterinario = $v;

        // Prepare emergencia stub
        $em = new TestEmergencia();
        $em->id = 123;
        $em->status = 'assigned';

        // Prepare request and set user resolver
        $request = Request::create('/','POST');
        $request->setUserResolver(function () use ($user) { return $user; });

        $response = $controller->acceptEmergencia($request, $v, $em);

        // Expect response array with message and emergencia
        $this->assertIsArray($response->getData(true));
        $data = $response->getData(true);
        $this->assertEquals('accepted', $data['emergencia']->status);
        $this->assertEquals(7, $data['emergencia']->veterinario_id);
    }
}
