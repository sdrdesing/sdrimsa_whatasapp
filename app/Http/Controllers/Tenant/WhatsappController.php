<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\tenant\TenantSocket;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WhatsappController extends Controller
{

    public function tables()
    {
        $socket = TenantSocket::first();
        return response()->json([
            'socket_channel' => $socket ? $socket->socket_channel : null,
        ]);
    }
    private function baseUrl()
    {
        return env('WHATSAPP_NODE_URL', 'http://baileys:3000');
    }

    private function getTenantSocketChannel()
    {
        $socket = TenantSocket::first();
        return $socket ? $socket->socket_channel : null;
    }

    public function status()
    {
        try {
            return Http::get($this->baseUrl() . '/status')->json();
        } catch (\Exception $e) {
            Log::error('Error en status: ' . $e->getMessage());
            return response()->json([
                'error' => 'Error al obtener estado: ' . $e->getMessage()
            ], 500);
        }
    }
    
    public function deleteSession(Request $request)
    {
        try {
            $socketChannel = $this->getTenantSocketChannel();
            
            if (!$socketChannel) {
                return response()->json([
                    'status' => false,
                    'message' => 'Bot no está configurado para este tenant'
                ], 422);
            }

            $response = Http::post($this->baseUrl() . '/api/session/delete', [
                'tenantId' => $socketChannel,
            ]);
            
            return response()->json($response->json(), $response->status());
        } catch (\Exception $e) {
            Log::error('Error en deleteSession: ' . $e->getMessage());
            return response()->json([
                'error' => 'Error al eliminar sesión: ' . $e->getMessage()
            ], 500);
        }
    }

    public function send(Request $request)
    {
        try {
            $socketChannel = $this->getTenantSocketChannel();
            
            if (!$socketChannel) {
                return response()->json([
                    'status' => false,
                    'message' => 'Bot no está configurado para este tenant'
                ], 422);
            }

            $response = Http::post($this->baseUrl() . '/api/send-messages', [
                'number'  => $request->number,
                'message' => $request->message,
                'tenantId' => $socketChannel,
            ]);
            
            return response()->json($response->json(), $response->status());
        } catch (\Exception $e) {
            Log::error('Error en send: ' . $e->getMessage());
            return response()->json([
                'error' => 'Error al enviar mensaje: ' . $e->getMessage(),
                'message' => 'No se puede conectar al servicio de WhatsApp. Por favor, intenta más tarde.'
            ], 500);
        }
    }

    public function qr()
    {
        try {
            return Http::get($this->baseUrl() . '/qr')->json();
        } catch (\Exception $e) {
            Log::error('Error en qr: ' . $e->getMessage());
            return response()->json([
                'error' => 'Error al obtener QR: ' . $e->getMessage()
            ], 500);
        }
    }

    public function send_media(Request $request)
    {
        try {
            $socketChannel = $this->getTenantSocketChannel();
            
            if (!$socketChannel) {
                return response()->json([
                    'status' => false,
                    'message' => 'Bot no está configurado para este tenant'
                ], 422);
            }

            $response = Http::post($this->baseUrl() . '/api/send-medias', [
                'number'    => $request->number,
                'caption'   => $request->caption,
                'media_url' => $request->media_url,
                'tenantId'  => $socketChannel,
            ]);
            
                        if (!$request->number || !$request->media_url) {
                            return response()->json([
                                'status' => false,
                                'message' => 'Faltan parámetros: number, media_url'
                            ], 422);
                        }

                        // Descargar el archivo remoto y enviarlo como multipart/form-data al bot
                        $fileResponse = Http::timeout(15)->get($request->media_url);

                        if (!$fileResponse->successful()) {
                            return response()->json([
                                'status' => false,
                                'message' => 'No se pudo descargar el archivo desde media_url'
                            ], 422);
                        }

                        $fileName = basename(parse_url($request->media_url, PHP_URL_PATH) ?? 'media');
                        $fileBody = $fileResponse->body();

                        $response = Http::timeout(30)
                            ->attach('file', $fileBody, $fileName)
                            ->post($this->baseUrl() . '/api/send-medias', [
                                'number'   => $request->number,
                                'caption'  => $request->caption,
                                'tenantId' => $socketChannel,
                            ]);
            ], 500);
        }
    }



    /* public function send(Request $request)
    {
        return Http::post($this->baseUrl() . '/api/send-messages', [
            'number' => $request->number,
            'message' => $request->message,
        ])->json();
    }
    public function qr()
    {
        return Http::get('http://whatsapp:3001/api/qr')->json();
    } */

    public function restart()
    {
        return Http::post('http://whatsapp:3001/api/restart')->json();
    }

    /* public function send_media(Request $request)
    {
        return Http::post('http://whatsapp:3001/api/send-medias', [
            'number' => $request->number,
            'caption' => $request->caption,
            'media_url' => $request->media_url,
        ])->json();
    } */
}
