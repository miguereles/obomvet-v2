<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Throwable;

class JsonApiErrorResponse
{
    /**
     * Handle the request.
     */
    public function handle(Request $request, Closure $next)
    {
        try {
            return $next($request);
        } catch (Throwable $exception) {
            return $this->handleException($exception);
        }
    }

    /**
     * Handle the exception and return a JSON response.
     */
    private function handleException(Throwable $exception)
    {
        $status = 500;
        $message = 'Internal Server Error';

        if (method_exists($exception, 'getStatusCode')) {
            $status = $exception->getStatusCode();
        }

        if (method_exists($exception, 'getMessage')) {
            $message = $exception->getMessage() ?: $message;
        }

        $response = [
            'success' => false,
            'message' => $message,
        ];

        if (config('app.debug')) {
            $response['exception'] = class_basename($exception);
            $response['file'] = $exception->getFile();
            $response['line'] = $exception->getLine();
        }

        return response()->json($response, $status);
    }
}
