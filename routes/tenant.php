<?php

declare(strict_types=1);

use App\Http\Controllers\Auth\AuthenticatedSessionController;
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

use App\Http\Controllers\Tenant\TenantDashboardController;

Route::middleware([
    'web',
    InitializeTenancyByDomain::class,
    PreventAccessFromCentralDomains::class,
])->group(function () {

    // Ruta pública de login del tenant
    Route::get('/', [TenantDashboardController::class, 'login'])->name('login');

    Route::post('/', [AuthenticatedSessionController::class, 'store']);

    // Rutas protegidas por auth
    Route::middleware('auth')->group(function () {

        // Página principal del tenant (opcional)
        Route::get('/Home', [TenantDashboardController::class, 'home'])->name('home');

        // Perfil del tenant
        Route::get('/profile', [\App\Http\Controllers\Tenant\TenantProfileController::class, 'edit'])->name('tenant.profile.edit');
        Route::patch('/profile', [\App\Http\Controllers\Tenant\TenantProfileController::class, 'update'])->name('tenant.profile.update');
        Route::put('/password', [\App\Http\Controllers\Auth\PasswordController::class, 'update'])->name('tenant.password.update');


        // Rutas de WhatsApp
        Route::prefix('whatsapp')->name('whatsapp.')->group(function () {
            Route::get('/messages', [TenantDashboardController::class, 'messages'])->name('messages');
            Route::get('/tables', [WhatsappController::class, 'tables'])->name('tables');
            Route::get('/status', [WhatsappController::class, 'status'])->name('status');
            Route::get('/qr', [WhatsappController::class, 'qr'])->name('qr');
            Route::get('/groups', [WhatsappController::class, 'getGroups'])->name('groups');
            Route::post('/send', [WhatsappController::class, 'send'])->name('send');
            Route::post('/send-media', [WhatsappController::class, 'send_media'])->name('send_media');
            Route::post('/send-group', [WhatsappController::class, 'send_to_group'])->name('send_to_group');
            Route::post('/send-group-media', [WhatsappController::class, 'send_media_to_group'])->name('send_media_to_group');
            Route::post('/delete-session', [WhatsappController::class, 'deleteSession'])->name('delete_session');
        });

        // Logout del tenant
        Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');
    });
});
