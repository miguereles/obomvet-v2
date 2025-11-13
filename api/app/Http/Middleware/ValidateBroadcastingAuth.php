<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;
use PHPOpenSourceSaver\JWTAuth\Exceptions\TokenExpiredException;
use PHPOpenSourceSaver\JWTAuth\Exceptions\JWTException;

class ValidateBroadcastingAuth
{
    public function handle(Request $request, Closure $next): Response
    {
        try {
            // Log incoming auth attempt (headers and body) for debugging
            Log::info('Broadcasting auth attempt', [
                'path' => $request->path(),
                'method' => $request->method(),
                'headers' => $request->headers->all(),
                'body' => $request->all(),
                'ip' => $request->ip(),
            ]);

            // Try to get token from: Authorization header (preferred) or POST body (fallback)
            $token = null;
            
            // First: try Authorization header
            if ($request->hasHeader('Authorization')) {
                $token = str_replace('Bearer ', '', $request->header('Authorization'));
                Log::info('Broadcasting auth: token from header', ['token_present' => !!$token]);
            }
            
            // Fallback: try POST body 'token' field
            if (!$token && $request->input('token')) {
                $token = $request->input('token');
                Log::info('Broadcasting auth: token from body', ['token_present' => !!$token]);
            }

            if (!$token) {
                Log::warning('Broadcasting auth failed: No token in header or body', [
                    'path' => $request->path(),
                    'body_keys' => array_keys($request->all()),
                    'has_auth_header' => $request->hasHeader('Authorization'),
                ]);
                return response()->json(['error' => 'Authorization token missing'], 401);
            }

            // Mask token for logs (keep first/last 4 chars) but use full token for auth
            $masked = substr($token, 0, 4) . '...' . substr($token, -4);
            Log::info('Broadcasting auth: token received (masked)', ['token_masked' => $masked]);

            // Validate token immediately and set the resolved user to avoid
            // exceptions being thrown later when the framework calls $request->user()
            try {
                $user = JWTAuth::setToken($token)->authenticate();
                if (!$user) {
                    Log::warning('Broadcasting auth failed: token did not resolve to a user', ['token_masked' => $masked]);
                    return response()->json(['error' => 'Invalid broadcasting authentication token'], 403);
                }

                // Set resolver to return the authenticated user (no further JWT calls)
                $request->setUserResolver(function () use ($user) {
                    return $user;
                });
            } catch (TokenExpiredException $ex) {
                Log::error('Broadcasting auth JWT parse failed', ['error' => $ex->getMessage(), 'class' => get_class($ex)]);
                return response()->json(['error' => 'Token has expired'], 401);
            } catch (JWTException $ex) {
                Log::error('Broadcasting auth JWT parse failed', ['error' => $ex->getMessage(), 'class' => get_class($ex)]);
                return response()->json(['error' => 'Invalid broadcasting authentication token'], 403);
            }

            return $next($request);
        } catch (\Throwable $e) {
            // Log full exception details to help debugging broadcasting auth 500s
            Log::error('Broadcasting auth error: ' . $e->getMessage(), [
                'exception' => $e,
                'path' => $request->path(),
                'body' => $request->all(),
                'ip' => $request->ip(),
            ]);

            // If it's an auth/token problem, return 403; otherwise return 500
            $class = get_class($e);
            if (stripos($class, 'Token') !== false || stripos($class, 'JWT') !== false) {
                return response()->json(['error' => 'Invalid broadcasting authentication token'], 403);
            }

            return response()->json(['error' => 'Broadcasting authentication error: ' . $e->getMessage()], 500);
        }
    }
}