<?php

declare(strict_types=1);

use App\Http\Controllers\Tenant\WhatsappController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Stancl\Tenancy\Middleware\InitializeTenancyByDomain;
use Stancl\Tenancy\Middleware\PreventAccessFromCentralDomains;

/*
|--------------------------------------------------------------------------
| Tenant Routes
|--------------------------------------------------------------------------
|
| Here you can register the tenant routes for your application.
| These routes are loaded by the TenantRouteServiceProvider.
|
| Feel free to customize them however you want. Good luck!
|
*/

Route::middleware([
    'web',
    InitializeTenancyByDomain::class,
    PreventAccessFromCentralDomains::class,
])->group(function () {

    // Ruta pública de login del tenant
    Route::get('/', function () {
        return Inertia::render('tenancy/Auth/Login');
    })->name('tenant.login');

    // Rutas protegidas por auth
    Route::middleware('auth')->name('tenant.')->group(function () {

        // Dashboard principal
        Route::get('/dashboard', function () {
            return Inertia::render('tenancy/Dashboard');
        })->name('dashboard');

        // Página principal del tenant (opcional)
        Route::get('/tenant', function () {
            return Inertia::render('tenancy/Tenant');
        })->name('home');

        // Rutas de WhatsApp
        Route::prefix('whatsapp')->group(function () {
            Route::get('/tables', [WhatsappController::class, 'tables'])->name('whatsapp.tables');
            Route::get('/status', [WhatsappController::class, 'status'])->name('whatsapp.status');
            Route::get('/qr', [WhatsappController::class, 'qr'])->name('whatsapp.qr');
            Route::post('/send', [WhatsappController::class, 'send'])->name('whatsapp.send');
            Route::post('/send-media', [WhatsappController::class, 'send_media'])->name('whatsapp.send_media');
            Route::post('/delete-session', [WhatsappController::class, 'deleteSession'])->name('whatsapp.delete_session');
        });
    });

    // Rutas de autenticación (profile, logout, etc.)
    require __DIR__ . '/auth.php';
});
