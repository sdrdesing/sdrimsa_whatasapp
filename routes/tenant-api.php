<?php

use App\Http\Controllers\Tenant\WhatsappController;
use Illuminate\Support\Facades\Route;

// Rutas públicas de WhatsApp API (sin autenticación)
// El tenant se identifica automáticamente por el subdominio
Route::prefix('whatsapp')->group(function () {
    Route::get('/status', [WhatsappController::class, 'status']);
    Route::get('/qr', [WhatsappController::class, 'qr']);
    Route::post('/send', [WhatsappController::class, 'send']);
    Route::post('/send_media', [WhatsappController::class, 'send_media']);
});
