<?php

use App\Http\Controllers\Tenant\WhatsappController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Rutas públicas de WhatsApp (sin autenticación, sin tenant middleware)
Route::prefix('whatsapp')->group(function () {
    Route::post('/send', [WhatsappController::class, 'send']);
    Route::post('/send_media', [WhatsappController::class, 'send_media']);
    Route::get('/status', [WhatsappController::class, 'status']);
    Route::get('/qr', [WhatsappController::class, 'qr']);
});

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});
