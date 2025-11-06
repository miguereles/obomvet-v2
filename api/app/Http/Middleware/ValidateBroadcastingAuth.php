<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;

class ValidateBroadcastingAuth
{
    public function handle(Request $request, Closure $next): Response
    {
        try {
            // Parse token from Authorization header
            if ($request->hasHeader('Authorization')) {
                $token = str_replace('Bearer ', '', $request->header('Authorization'));
                // Validate token and set user
                $request->setUserResolver(function () use ($token) {
                    return JWTAuth::setToken($token)->authenticate();
                });
            }

            return $next($request);
        } catch (\Exception $e) {
            // Return JSON error for invalid auth
            return response()->json(['error' => 'Invalid broadcasting authentication'], 403);
        }
    }
}