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

                $missing = [];
                if (!$request->number) {
                    $missing[] = 'number';
                }
                if (!$request->media_url && !$request->file_base64) {
                    $missing[] = '(media_url o file_base64)';
                }
                if (count($missing) > 0) {
                    return response()->json([
                        'status' => false,
                        'message' => 'Faltan parámetros: ' . implode(', ', $missing),
                        'faltantes' => $missing
                    ], 422);
                }

            $usingBase64 = (bool) $request->file_base64;
            $fileName = 'media';
            $fileBody = '';
            $headerMime = '';

            if ($usingBase64) {
                // Priorizar archivo enviado en base64 + nombre explícito
                $fileName = $request->file_name ?: 'media';
                $headerMime = $request->file_mime ?: '';
                $fileBody = base64_decode($request->file_base64, true);

                if ($fileBody === false) {
                    return response()->json([
                        'status' => false,
                        'message' => 'file_base64 no es válido'
                    ], 422);
                }
            } else {
                // Descargar el archivo remoto y enviarlo como multipart/form-data al bot
                $fileResponse = Http::timeout(15)->get($request->media_url);

                if (!$fileResponse->successful()) {
                    return response()->json([
                        'status' => false,
                        'message' => 'No se pudo descargar el archivo desde media_url'
                    ], 422);
                }

                // Permitir override explícito del nombre/MIME aunque venga por URL
                $fileName = $request->file_name ?: basename(parse_url($request->media_url, PHP_URL_PATH) ?? 'media');
                $fileBody = $fileResponse->body();
                $headerMime = $request->file_mime ?: ($fileResponse->header('Content-Type') ?? '');
            }

            // Resolver MIME de forma robusta por extensión y contenido
            $ext = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
            $mimeByExt = match ($ext) {
                'pdf' => 'application/pdf',
                'xml' => 'application/xml',
                'txt' => 'text/plain',
                'jpg', 'jpeg' => 'image/jpeg',
                'png' => 'image/png',
                'gif' => 'image/gif',
                'mp4' => 'video/mp4',
                'mp3' => 'audio/mpeg',
                'doc' => 'application/msword',
                'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'xls' => 'application/vnd.ms-excel',
                'xlsx' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'zip' => 'application/zip',
                default => ''
            };

            $detectedMime = '';
            if (function_exists('finfo_open')) {
                try {
                    $finfo = new \finfo(FILEINFO_MIME_TYPE);
                    $detectedMime = $finfo->buffer($fileBody) ?: '';
                } catch (\Throwable $t) {
                    $detectedMime = '';
                }
            }

            // Prioridad: por extensión -> por contenido -> header remoto -> octet-stream
            $mimeType = $mimeByExt ?: $detectedMime ?: $headerMime ?: 'application/octet-stream';


            $response = Http::timeout(30)
                ->attach('file', $fileBody, $fileName, ['Content-Type' => $mimeType])
                ->post($this->baseUrl() . '/api/send-medias', [
                    'number'   => $request->number,
                    'caption'  => $request->caption,
                    'tenantId' => $socketChannel,
                ]);
            
            return response()->json($response->json(), $response->status());
        } catch (\Exception $e) {
            Log::error('Error en send_media: ' . $e->getMessage());
            return response()->json([
                'error' => 'Error al enviar media: ' . $e->getMessage(),
                'message' => 'No se puede conectar al servicio de WhatsApp. Por favor, intenta más tarde.'
            ], 500);
        }
    }
}
