<?php

namespace App\Http\Middleware;

use Illuminate\Auth\Middleware\Authenticate as Middleware;
use Illuminate\Http\Request;

class Authenticate extends Middleware
{
    /**
     * Get the path the user should be redirected to when they are not authenticated.
     */
    protected function redirectTo(Request $request): ?string
    {
        if ($request->expectsJson()) {
            return null;
        }

        // Si estamos en contexto de tenant, redirigir al login del tenant
        if (tenant()) {
            return route('login');
        }

        // En el contexto central, redirigir al login del sistema
        return route('system.login');
    }
}
