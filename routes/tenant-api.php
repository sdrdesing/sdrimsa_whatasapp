<?php

use App\Http\Controllers\Tenant\WhatsappController;
use Illuminate\Support\Facades\Route;

Route::prefix('whatsapp')->group(function () {
    Route::get('/status', [WhatsappController::class, 'status']);
    Route::get('/qr', [WhatsappController::class, 'qr']);
    Route::post('/send', [WhatsappController::class, 'send']);
    Route::post('/send_media', [WhatsappController::class, 'send_media']);
    Route::post('/send-group', [WhatsappController::class, 'send_to_group']);
    Route::post('/send-group-media', [WhatsappController::class, 'send_media_to_group']);
});
