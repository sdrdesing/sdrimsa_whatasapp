<script setup>
import TenantLayout from '@/Layouts/TenantLayout.vue';
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { io } from 'socket.io-client';

const faviconUrl = '/logos/favicon.png';
let socket = null;
const socketChannelRef = ref(null);


onMounted(async () => {
    // Obtener el socket_channel desde el servidor antes de iniciar la sesión
    const socketChannelValue = await fetchSocketChannel();
    socketChannelRef.value = socketChannelValue;
    console.log('🔑 socket_channel (mount) ->', socketChannelValue);

    const host = window.location.host; // ej: sdrimsac.xyz o demito.sdrimsac.xyz
    const socketUrl = `${window.location.origin}`; // esto incluye protocolo + host

    socket = io(socketUrl, {
        path: "/socket.io",
        transports: ["websocket", "polling"], // incluye polling como fallback
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 99999,
        secure: window.location.protocol === 'https:',
        rejectUnauthorized: false,
    });


    socket.on('connect', () => {
        console.log('🟢 Socket conectado', socket.id);
    });

    socket.on('connect_error', (err) => {
        console.error('🔴 connect_error', err && err.message ? err.message : err);
        console.error('📋 Error detalles:', err);
    });

    socket.on('disconnect', (reason) => {
        console.log('🔌 Socket desconectado:', reason);
        if (reason === 'io server disconnect') {
            socket.connect();
        }
    });

    // Registro de listeners ANTES de pedir start-session
    socket.on('qr', (payload) => {
        console.log('📲 evento qr recibido ->', payload);
        // El servidor envía { tenantId, qr: dataUrl }, pero mantenemos compatibilidad
        if (!payload) {
            qrData.value = null;
            return;
        }
        if (typeof payload === 'string') {
            // caso antiguo: payload es dataURL
            qrData.value = payload;
        } else if (payload.qr) {
            qrData.value = payload.qr;
        } else if (payload.dataUrl) {
            qrData.value = payload.dataUrl;
        } else {
            // fallback: si viene objeto con la base en otra clave
            const maybe = Object.values(payload).find(v => typeof v === 'string' && v.startsWith('data:image'));
            qrData.value = maybe || null;
        }
        errorMsg.value = '';
    });

    // El servidor emite "connected" cuando la sesión está abierta
    socket.on('connected', (data) => {
        console.log('✅ evento connected recibido ->', data);
        qrData.value = null;
        whatsappState.value = {
            authenticated: true,
            connectionStatus: 'connected',
            number: data?.number || null,
        };
    });

    // Mantener compatibilidad si el servidor emite "authenticated" en otro lugar
    socket.on('authenticated', (data) => {
        console.log('✅ evento authenticated recibido ->', data);
        // mismo comportamiento
        qrData.value = null;
        whatsappState.value = { authenticated: true, connectionStatus: 'connected', phoneNumber: data?.phoneNumber || null };
    });

    socket.on('status', (data) => {
        console.log('ℹ️ status ->', data);
        // algunas emisiones usan { tenantId, status } o objeto completo
        if (data && data.status) whatsappState.value = data;
        else whatsappState.value = data;
    });

    socket.on('disconnect', (reason) => {
        console.log('🔌 socket disconnected', reason);
        whatsappState.value = { authenticated: false, connectionStatus: 'disconnected' };
    });

    socket.on('error', (err) => {
        console.error('⚠️ socket error', err);
    });

    // Ahora que listeners están registrados pedimos iniciar la sesión
    // Usar el socketChannel obtenido (si existe) como tenantId; fallback 'default'
    socket.emit('start-session', { tenantId: socketChannelRef.value || 'default' });
});

onBeforeUnmount(() => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
});


function logoutBot() {
    if (!confirm('¿Cerrar sesión del bot?')) return;
    window.axios.post('/logout')
        .then(() => {
            alert('Sesión cerrada');
            whatsappState.value = { authenticated: false, connectionStatus: 'disconnected' };
            qrData.value = null;
        })
        .catch(err => alert('Error al cerrar sesión: ' + err.message));
}

function deleteSession() {
    if (!confirm('¿Eliminar la sesión del bot? Esto requerirá volver a escanear el QR.')) return;
    window.axios.post('/whatsapp/delete-session', {
        tenantId: socketChannelRef.value || (socket ? socket.id : null),

    })
        .then(() => {

            //alert('Sesión eliminada. Por favor, vuelve a escanear el QR.');
            whatsappState.value = { authenticated: false, connectionStatus: 'disconnected' };
            qrData.value = null;
        })
        .catch(err => alert('Error al eliminar la sesión: ' + err.message));
}

function clearMessageForm() {
    number.value = '';
    message.value = '';
}

// petion get para obtener el socket_channel
async function fetchSocketChannel() {
    try {
        const res = await window.axios.get('/whatsapp/tables');
        if (res.data && res.data.socket_channel) {
            console.log('🔑 socket_channel obtenido:', res.data.socket_channel);
            return res.data.socket_channel;
        } else {
            console.warn('⚠️ socket_channel no encontrado en la respuesta');
            return null;
        }
    } catch (e) {
        console.error('❌ Error al obtener socket_channel:', e);
        return null;
    }
}


const whatsappState = ref(null);
const whatsappStatus = ref('desconocido');
const displayWhatsappStatus = computed(() => {
    const s = whatsappState.value;
    // Si no hay objeto, mostramos el texto simple (compatibilidad atrás)
    if (!s) return whatsappStatus.value || 'desconocido';

    const cs = (s.connectionStatus || s.status || '').toString().toLowerCase();
    const up = s.uptimeFormatted || (typeof s.uptime === 'number' ? formatUptime(s.uptime) : null);

    // Casos claros
    if (cs === 'connected' || cs === 'auth' || s.authenticated === true || cs === 'authenticated') {
        return up ? `Conectado • ${up}` : 'Conectado';
    }

    if (cs === 'disconnected' || cs === 'offline' || s.authenticated === false) {
        return 'Desconectado';
    }

    if (cs === 'connecting') {
        return 'Conectando...';
    }

    // Fallback: mostrar connectionStatus si existe o el objeto serializado
    return s.connectionStatus || s.status || JSON.stringify(s);
});

// Computed classes for the status button and the small dot
const statusButtonClass = computed(() => {
    const s = whatsappState.value;
    const cs = (s?.connectionStatus || s?.status || '').toString().toLowerCase();
    if (cs === 'connected' || cs === 'auth' || s?.authenticated === true || cs === 'authenticated') {
        return 'px-4 py-2 rounded-full text-white shadow bg-emerald-500 hover:bg-emerald-600';
    }

    if (cs === 'disconnected' || cs === 'offline' || s?.authenticated === false) {
        return 'px-4 py-2 rounded-full text-white shadow bg-red-600 hover:bg-red-700';
    }

    if (cs === 'connecting') {
        return 'px-4 py-2 rounded-full text-white shadow bg-yellow-500 hover:bg-yellow-600';
    }

    return 'px-4 py-2 rounded-full text-white shadow bg-slate-700';
});

const dotClass = computed(() => {
    const s = whatsappState.value;
    const cs = (s?.connectionStatus || s?.status || '').toString().toLowerCase();
    if (cs === 'connected' || cs === 'auth' || s?.authenticated === true || cs === 'authenticated') {
        return 'inline-block mr-2 text-emerald-200';
    }
    if (cs === 'disconnected' || cs === 'offline' || s?.authenticated === false) {
        return 'inline-block mr-2 text-red-300';
    }
    if (cs === 'connecting') {
        return 'inline-block mr-2 text-yellow-200 animate-pulse';
    }
    return 'inline-block mr-2 text-slate-400';
});

function formatUptime(seconds) {
    // seconds puede venir como número de segundos. Formatea a Hh Mm
    if (!seconds || seconds <= 0) return null;
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
}
const qrData = ref(null); // puede ser dataURL o objectURL
const loadingStatus = ref(false);
const loadingQr = ref(false);
const errorMsg = ref('');

// dynamicStats is defined above
const dynamicStats = computed(() => {
    const s = whatsappState.value;
    const sent = s?.messageStats?.sent ?? 0;
    const received = s?.messageStats?.received ?? 0;
    const uptime = s?.uptimeFormatted || '0s';
    
    return [
        { id: 1, title: 'TIEMPO ACTIVO', value: uptime, description: 'Desde el inicio del servicio', bg: 'bg-gradient-to-r from-sky-600 to-blue-800' },
        { id: 2, title: 'MENSAJES ENVIADOS', value: sent, description: 'Total de mensajes procesados', bg: 'bg-gradient-to-r from-emerald-500 to-green-600' },
        { id: 3, title: 'MENSAJES RECIBIDOS', value: received, description: 'Total de mensajes entrantes', bg: 'bg-gradient-to-r from-indigo-500 to-violet-600' },
        { id: 4, title: 'ESTADO DEL SISTEMA', value: '100%', description: 'Operatividad del bot', bg: 'bg-gradient-to-r from-gray-600 to-gray-800' }
    ];
});

const connected = ref(true);
const number = ref('');
const message = ref('');

function sendMessage() {

    if (!number.value || !message.value) {
        alert('Por favor, completa el número de WhatsApp y el mensaje.');
        return;
    }

    window.axios.post('/whatsapp/send', {
        number: number.value,
        message: message.value,
        // Pasar el identificador del canal/socket para que el backend sepa qué conexión
        // está realizando la petición. Preferimos el socketChannel (canal lógico) si
        // está disponible, y como fallback el id del socket.
        tenantId: socketChannelRef.value || (socket ? socket.id : null),
    })
        .then(() => {
            alert('Mensaje enviado correctamente.');
            clearMessageForm();
        })
        .catch(err => {
            alert('Error al enviar el mensaje: ' + (err?.response?.data?.message || err.message));
        });


}

async function fetchWhatsappStatus() {
    loadingStatus.value = true;
    errorMsg.value = '';
    try {
        const res = await window.axios.get('/whatsapp/status');
        if (res.data && typeof res.data === 'object') {
            whatsappState.value = res.data;
            whatsappStatus.value = res.data.status ?? whatsappStatus.value;
        } else if (res.data && res.data.status) {
            whatsappState.value = { status: res.data.status };
            whatsappStatus.value = res.data.status;
        } else {
            // fallback: guardar como texto
            whatsappState.value = null;
            whatsappStatus.value = JSON.stringify(res.data);
        }
    } catch (e) {
        errorMsg.value = e?.response?.data?.message || e.message || 'Error al obtener estado';
    } finally {
        loadingStatus.value = false;
    }
}

let currentQrObjectUrl = null;
function revokeQrObjectUrl() {
    if (currentQrObjectUrl) {
        URL.revokeObjectURL(currentQrObjectUrl);
        currentQrObjectUrl = null;
    }
}

async function fetchWhatsappQr() {
    loadingQr.value = true;
    errorMsg.value = '';
    // limpiar QR previo
    qrData.value = null;
    revokeQrObjectUrl();
    try {
        const res = await window.axios.get('/whatsapp/qr');
        if (res.data && res.data.qr) {
            const maybe = res.data.qr;
            if (/^data:image\//.test(maybe)) {
                qrData.value = maybe;
            } else if (/^[A-Za-z0-9+/=\n]+$/.test(maybe)) {
                // parece base64 sin prefijo
                qrData.value = `data:image/png;base64,${maybe}`;
            } else {
                // fallback: mostrar el contenido como texto
                qrData.value = null;
                errorMsg.value = 'Respuesta inesperada del servidor para el QR';
            }
        } else {
            // Si no viene en JSON, pedimos como blob (imagen)
            const blobRes = await window.axios.get('/whatsapp/qr', { responseType: 'blob' });
            const blob = blobRes.data;
            if (blob && blob.size) {
                const url = URL.createObjectURL(blob);
                currentQrObjectUrl = url;
                qrData.value = url;
            } else {
                errorMsg.value = 'No se recibió imagen QR';
            }
        }
    } catch (e) {
        errorMsg.value = e?.response?.data?.message || e.message || 'Error al obtener QR';
    } finally {
        loadingQr.value = false;
    }
}
</script>

<template>

    <!-- <Head title="Dashboard" /> -->

    <TenantLayout>

        <div class="py-8">
            <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
                <!-- Hero -->
                <div class="rounded-lg overflow-hidden shadow-lg bg-gradient-to-r from-slate-800 to-slate-900 p-8 mb-6">
                    <div class="flex items-center justify-between gap-4">
                        <div class="flex items-center gap-4">
                            <img :src="faviconUrl" alt="logo" class="h-16 w-16 object-contain hidden sm:block" />
                            <div>
                                <h1 class="text-3xl font-bold text-white">Sdrimsac WhatsApp Bot</h1>
                                <p class="text-sm text-slate-300">Panel de Control y Gestión de Mensajes</p>
                            </div>
                        </div>

                        <div class="flex items-center gap-4">
                            <button :class="statusButtonClass" aria-pressed="true">
                                <span :class="dotClass">●</span> {{ displayWhatsappStatus }}
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Stats cards -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div v-for="item in dynamicStats" :key="item.id" class="rounded-lg p-4 shadow-md bg-slate-800 text-white">
                        <div class="flex items-center justify-between">
                            <div>
                                <div class="text-xs font-semibold text-slate-300">{{ item.title }}</div>
                                <div class="text-2xl font-bold mt-2">{{ item.value }}</div>
                                <div class="text-xs text-slate-400 mt-1">{{ item.description }}</div>
                            </div>
                            <div class="h-12 w-12 rounded-lg flex items-center justify-center" :class="item.bg">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-white" fill="none"
                                    viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
                <!-- <div class="mb-6 rounded-lg p-4 bg-slate-800 text-white shadow">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-4">
                            <div class="px-4 py-2 bg-emerald-600 rounded text-sm font-semibold flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20"
                                    fill="currentColor">
                                    <path fill-rule="evenodd"
                                        d="M16.707 5.293a1 1 0 00-1.414 0L9 11.586 6.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l7-7a1 1 0 000-1.414z"
                                        clip-rule="evenodd" />
                                </svg>
                                Bot autenticado y funcionando correctamente
                            </div>
                            <div class="text-slate-300">Sistema operativo y listo para recibir peticiones API</div>
                        </div>

                        <div>
                            <button class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded">Cerrar
                                Sesión</button>
                        </div>
                    </div>
                </div> -->

                <!-- WhatsApp status & QR -->
                <div class="mb-6 rounded-lg p-6 bg-slate-800 text-white shadow">
                    <h3 class="text-lg font-semibold mb-4">WhatsApp - Estado y QR</h3>

                    <div class="flex flex-col md:flex-row md:items-start gap-4">
                        <div class="flex-1">
                            <div class="mb-3">
                                <div class="text-sm text-slate-300">Estado actual</div>
                                <div class="text-xl font-bold mt-1">{{ displayWhatsappStatus }}</div>
                            </div>

                            <div class="flex items-center gap-3">


                                <button @click="deleteSession" class="bg-red-600 text-white px-3 py-2 rounded">Eliminar
                                    Sesión</button>
                            </div>

                            <div v-if="errorMsg" class="mt-3 text-sm text-red-400">{{ errorMsg }}</div>
                        </div>

                        <div class="w-full md:w-64">
                            <div class="border border-slate-700 rounded p-3 bg-slate-900">
                                <div class="text-sm text-slate-300 mb-2">QR para escanear</div>
                                <div class="flex items-center justify-center h-48">
                                    <template v-if="qrData">
                                        <img :src="qrData" alt="QR" class="max-h-44" />
                                    </template>
                                    <template v-else>
                                        <div class="text-xs text-slate-500">Ningún QR disponible. Pulsa "Obtener QR".
                                        </div>
                                    </template>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Enviar Mensajes -->
                <div class="rounded-lg p-6 bg-slate-800 text-white shadow">
                    <h3 class="text-lg font-semibold mb-4">Enviar Mensajes</h3>

                    <div class="mb-4">
                        <nav class="flex gap-2 text-sm">
                            <button class="px-3 py-1 bg-slate-700 rounded">Mensaje de Texto</button>
                            <button class="px-3 py-1 bg-slate-700 rounded">Enviar Archivo</button>
                        </nav>
                    </div>

                    <form @submit.prevent="sendMessage" class="space-y-4">
                        <div>
                            <label class="block text-sm text-slate-300 mb-1">Número de WhatsApp</label>
                            <input v-model="number" type="text" placeholder="Incluye código de país sin +"
                                class="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white" />
                        </div>

                        <div>
                            <label class="block text-sm text-slate-300 mb-1">Mensaje</label>
                            <textarea v-model="message" rows="4"
                                class="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white"
                                placeholder="Escribe tu mensaje..." />
                        </div>

                        <div class="flex items-center gap-3">
                            <button type="submit"
                                class="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded">Enviar</button>
                            <button type="button" class="bg-slate-700 text-white px-4 py-2 rounded">Limpiar</button>
                        </div>
                    </form>
                </div>

            </div>
        </div>
    </TenantLayout>
</template>
