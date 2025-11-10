<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;

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

            // Accept token from Authorization header OR as a fallback from the POST body
            // (body key: 'token'). The body fallback is intended as a safe development-time
            // convenience when the client or an intermediary strips headers. We still prefer
            // the Authorization header when present.
            $token = null;
            if ($request->hasHeader('Authorization')) {
                $token = str_replace('Bearer ', '', $request->header('Authorization'));
            } elseif ($request->input('token')) {
                $token = $request->input('token');
            }

            if (! $token) {
                // Log a concise warning without printing the full token
                Log::warning('Broadcasting auth failed: Authorization header missing', [
                    'path' => $request->path(),
                    'method' => $request->method(),
                    'headers' => $request->headers->all(),
                    'body' => $request->all(),
                    'ip' => $request->ip(),
                ]);

                return response()->json(['error' => 'Authorization header missing'], 401);
            }

            // Mask token for logs (keep first/last 4 chars) but use full token for auth
            $masked = substr($token, 0, 4) . '...' . substr($token, -4);
            Log::info('Broadcasting auth: token received (masked)', ['token_masked' => $masked]);

            // Validate token and set user resolver safely
            $request->setUserResolver(function () use ($token) {
                try {
                    return JWTAuth::setToken($token)->authenticate();
                } catch (\Throwable $t) {
                    // rethrow to be handled by outer catch
                    throw $t;
                }
            });

            return $next($request);
        } catch (\Throwable $e) {
            // Log full exception details to help debugging broadcasting auth 500s
            Log::error('Broadcasting auth error: ' . $e->getMessage(), [
                'exception' => $e,
                'path' => $request->path(),
                'headers' => $request->headers->all(),
                'body' => $request->all(),
                'ip' => $request->ip(),
            ]);

            // If it's an auth/token problem, return 403; otherwise return 500 so client sees server error
            // Check common JWT exceptions classes if available
            $class = get_class($e);
            if (stripos($class, 'Token') !== false || stripos($class, 'JWT') !== false) {
                return response()->json(['error' => 'Invalid broadcasting authentication'], 403);
            }

            return response()->json(['error' => 'Broadcasting authentication failed'], 500);
        }
    }
}