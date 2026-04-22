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

    public function status(Request $request)
    {
        try {
            $tenantId = $request->query('tenantId');
            $url = $this->baseUrl() . '/status';
            if ($tenantId) {
                $url .= '?tenantId=' . urlencode($tenantId);
            }
            return Http::get($url)->json();
        } catch (\Exception $e) {
            Log::error('Error en status: ' . $e->getMessage());
            return response()->json([
                'error' => 'Error al obtener estado: ' . $e->getMessage()
            ], 500);
        }
    }

    public function globalStatus()
    {
        try {
            $data = Http::get($this->baseUrl() . '/global-status')->json();
            
            if (isset($data['logs']) && is_array($data['logs'])) {
                $tenantSockets = collect($data['logs'])->pluck('tenantId')->filter()->unique()->toArray();
                if (!empty($tenantSockets)) {
                    $map = [];
                    $tenants = \App\Models\Tenant::with('domains')->get();
                    foreach ($tenants as $t) {
                        try {
                            $t->run(function () use (&$map, $t) {
                                $socket = \App\Models\tenant\TenantSocket::first();
                                if ($socket && $socket->socket_channel) {
                                    $domain = $t->domains->first();
                                    $map[$socket->socket_channel] = $domain ? $domain->domain : $t->id;
                                }
                            });
                        } catch (\Exception $e) {}
                    }
                    
                    foreach ($data['logs'] as &$log) {
                        $id = $log['tenantId'] ?? null;
                        if ($id && isset($map[$id])) {
                            $log['tenantName'] = $map[$id];
                        }
                    }
                }
            }
            
            return response()->json($data);
        } catch (\Exception $e) {
            Log::error('Error en globalStatus: ' . $e->getMessage());
            return response()->json([
                'error' => 'Error al obtener estado global: ' . $e->getMessage()
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

    /**
     * Obtener lista de grupos con sus JIDs
     */
    public function getGroups()
    {
        try {
            $socketChannel = $this->getTenantSocketChannel();
            
            if (!$socketChannel) {
                return response()->json([
                    'status' => false,
                    'message' => 'Bot no está configurado para este tenant',
                    'groups' => [],
                    'totalGroups' => 0
                ], 422);
            }

            $response = Http::get($this->baseUrl() . '/api/groups', [
                'tenantId' => $socketChannel,
            ]);
            
            return response()->json($response->json(), $response->status());
        } catch (\Exception $e) {
            Log::error('Error en getGroups: ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'error' => 'Error al obtener grupos: ' . $e->getMessage(),
                'groups' => [],
                'totalGroups' => 0
            ], 500);
        }
    }

    public function send_media(Request $request)
    {
        try {
            $socketChannel = $this->getTenantSocketChannel();
            if (!$socketChannel) {
                return response()->json(['status' => false, 'message' => 'Bot no está configurado para este tenant'], 422);
            }

            if (!$request->number) {
                return response()->json(['status' => false, 'message' => 'Falta el parámetro: number'], 422);
            }

            $media = $this->prepareMediaData($request);
            if (isset($media['error'])) return response()->json($media, 422);

            $response = Http::timeout(30)
                ->attach('file', $media['body'], $media['name'], ['Content-Type' => $media['mime']])
                ->post($this->baseUrl() . '/api/send-medias', [
                    'number'   => $request->number,
                    'caption'  => $request->caption,
                    'tenantId' => $socketChannel,
                ]);
            
            return response()->json($response->json(), $response->status());
        } catch (\Exception $e) {
            Log::error('Error en send_media: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Enviar mensaje de texto a un grupo por su JID
     */
    public function send_to_group(Request $request)
    {
        try {
            $socketChannel = $this->getTenantSocketChannel();
            if (!$socketChannel) return response()->json(['status' => false, 'message' => 'Bot no configurado'], 422);
            if (!$request->groupJid || !$request->message) {
                return response()->json(['status' => false, 'message' => 'Faltan parámetros: groupJid, message'], 400);
            }

            $response = Http::post($this->baseUrl() . '/api/send-group', [
                'groupJid' => $request->groupJid,
                'message'  => $request->message,
                'tenantId' => $socketChannel,
            ]);
            
            return response()->json($response->json(), $response->status());
        } catch (\Exception $e) {
            return response()->json(['status' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Enviar media (video, imagen, archivo) a un grupo por su JID
     */
    public function send_media_to_group(Request $request)
    {
        try {
            $socketChannel = $this->getTenantSocketChannel();
            if (!$socketChannel) return response()->json(['status' => false, 'message' => 'Bot no configurado'], 422);
            if (!$request->groupJid) {
                return response()->json(['status' => false, 'message' => 'Falta el parámetro: groupJid'], 422);
            }

            $media = $this->prepareMediaData($request);
            if (isset($media['error'])) return response()->json($media, 422);

            $response = Http::timeout(60)
                ->attach('file', $media['body'], $media['name'], ['Content-Type' => $media['mime']])
                ->post($this->baseUrl() . '/api/send-group-media', [
                    'groupJid' => $request->groupJid,
                    'caption'  => $request->caption,
                    'tenantId' => $socketChannel,
                ]);
            
            return response()->json($response->json(), $response->status());
        } catch (\Exception $e) {
            return response()->json(['status' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Método privado para procesar la media (Common logic)
     */
    private function prepareMediaData(Request $request)
    {
        if (!$request->media_url && !$request->file_base64) {
            return ['error' => 'No se proporcionó media_url ni file_base64', 'status' => false];
        }

        $usingBase64 = (bool) $request->file_base64;
        $fileName = 'media';
        $fileBody = '';
        $headerMime = '';

        if ($usingBase64) {
            $fileName = $request->file_name ?: 'media';
            $headerMime = $request->file_mime ?: '';
            $fileBody = base64_decode($request->file_base64, true);
            if ($fileBody === false) return ['error' => 'Base64 inválido', 'status' => false];
        } else {
            $fileResponse = Http::timeout(15)->get($request->media_url);
            if (!$fileResponse->successful()) return ['error' => 'Error descargando media_url', 'status' => false];
            $fileName = $request->file_name ?: basename(parse_url($request->media_url, PHP_URL_PATH) ?? 'media');
            $fileBody = $fileResponse->body();
            $headerMime = $request->file_mime ?: ($fileResponse->header('Content-Type') ?? '');
        }

        $ext = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
        $mimeByExt = match ($ext) {
            'pdf' => 'application/pdf',
            'jpg', 'jpeg' => 'image/jpeg',
            'png' => 'image/png',
            'gif' => 'image/gif',
            'mp4' => 'video/mp4',
            'mp3' => 'audio/mpeg',
            'zip' => 'application/zip',
            default => ''
        };

        $mime = $mimeByExt ?: $headerMime ?: 'application/octet-stream';

        return [
            'body' => $fileBody,
            'name' => $fileName,
            'mime' => $mime
        ];
    }


    public function sendMessageByName(Request $request)
    {
        try {
            $socketChannel = $this->getTenantSocketChannel();
            
            if (!$socketChannel) {
                return response()->json([
                    'status' => false,
                    'message' => 'Bot no está configurado para este tenant'
                ], 422);
            }

            $response = Http::post($this->baseUrl() . '/api/send-message-by-name', [
                'name'    => $request->name,
                'message' => $request->message,
                'tenantId' => $socketChannel,
            ]);
            
            return response()->json($response->json(), $response->status());
        } catch (\Exception $e) {
            Log::error('Error en send-message-by-name: ' . $e->getMessage());
            return response()->json([
                'error' => 'Error al enviar mensaje por nombre: ' . $e->getMessage(),
                'message' => 'No se puede conectar al servicio de WhatsApp. Por favor, intenta más tarde.'
            ], 500);
        }
    }
}
