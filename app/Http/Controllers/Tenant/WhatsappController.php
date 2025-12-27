<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\tenant\TenantSocket;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class WhatsappController extends Controller
{

    public function tables()
    {
        $socket = TenantSocket::first();
        return response()->json([
            'socket_channel' => $socket ? $socket->socket_channel : null,
        ]);
    }
    /* private function baseUrl()
    {
        return 'http://baileys-bot:3000';
    } */

    private function baseUrl()
    {
        return env('WHATSAPP_NODE_URL', 'http://host.docker.internal:3000');
    }
    public function status()
    {
        return Http::get($this->baseUrl() . '/status')->json();
    }
    
    public function deleteSession(Request $request)
    {
        return Http::post($this->baseUrl() . '/api/session/delete', [
            'tenantId' => $request->tenantId,
        ])->json();
    }

    public function send(Request $request)
    {
        /* dump($request->all()); */
        return Http::post($this->baseUrl() . '/api/send-messages', [
            'number'  => $request->number,
            'message' => $request->message,
            'tenantId' => $request->tenantId,
        ])->json();
    }

    public function qr()
    {
        return Http::get($this->baseUrl() . '/qr')->json();
    }

    public function send_media(Request $request)
    {
        return Http::post($this->baseUrl() . '/api/send-medias', [
            'number'    => $request->number,
            'caption'   => $request->caption,
            'media_url' => $request->media_url,
        ])->json();
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
