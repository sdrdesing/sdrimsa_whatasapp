<script setup>
import TenantLayout from "@/Layouts/TenantLayout.vue";
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { io } from "socket.io-client";
import { Head } from "@inertiajs/vue3";

const faviconUrl = "/logos/favicon.png";
let socket = null;
const socketChannelRef = ref(null);

onMounted(async () => {
    // Obtener el socket_channel desde el servidor antes de iniciar la sesión
    const socketChannelValue = await fetchSocketChannel();
    socketChannelRef.value = socketChannelValue;
    console.log("🔑 socket_channel (mount) ->", socketChannelValue);

    const host = window.location.host; 
    const socketUrl = `${window.location.origin}`; 

    socket = io(socketUrl, {
        path: "/socket.io",
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 99999,
        secure: window.location.protocol === "https:",
        rejectUnauthorized: false,
    });

    socket.on("connect", () => {
        console.log("🟢 Socket conectado", socket.id);
    });

    socket.on("connect_error", (err) => {
        console.error("🔴 connect_error", err?.message || err);
    });

    socket.on("disconnect", (reason) => {
        console.log("🔌 Socket desconectado:", reason);
        if (reason === "io server disconnect") {
            socket.connect();
        }
    });

    socket.on("qr", (payload) => {
        console.log("📲 evento qr recibido ->", payload);
        if (!payload) {
            qrData.value = null;
            return;
        }
        if (typeof payload === "string") {
            qrData.value = payload;
        } else if (payload.qr) {
            qrData.value = payload.qr;
        } else if (payload.dataUrl) {
            qrData.value = payload.dataUrl;
        } else {
            const maybe = Object.values(payload).find(
                (v) => typeof v === "string" && v.startsWith("data:image"),
            );
            qrData.value = maybe || null;
        }
        errorMsg.value = "";
    });

    socket.on("connected", (data) => {
        console.log("✅ evento connected recibido ->", data);
        qrData.value = null;
        whatsappState.value = {
            authenticated: true,
            connectionStatus: "connected",
            number: data?.number || null,
        };
    });

    socket.on("authenticated", (data) => {
        console.log("✅ evento authenticated recibido ->", data);
        qrData.value = null;
        whatsappState.value = {
            authenticated: true,
            connectionStatus: "connected",
            phoneNumber: data?.phoneNumber || null,
        };
    });

    socket.on("status", (data) => {
        console.log("ℹ️ status ->", data);
        if (data && data.status) whatsappState.value = data;
        else whatsappState.value = data;
    });

    socket.on("error", (err) => {
        console.error("⚠️ socket error", err);
    });

    socket.emit("start-session", {
        tenantId: socketChannelRef.value || "default",
    });
});

onBeforeUnmount(() => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
});

function deleteSession() {
    if (!confirm("¿Eliminar la sesión del bot? Esto requerirá volver a escanear el QR.")) return;
    window.axios
        .post("/whatsapp/delete-session", {
            tenantId: socketChannelRef.value || (socket ? socket.id : null),
        })
        .then(() => {
            whatsappState.value = {
                authenticated: false,
                connectionStatus: "disconnected",
            };
            qrData.value = null;
        })
        .catch((err) => alert("Error al eliminar la sesión: " + err.message));
}

function clearMessageForm() {
    number.value = "";
    message.value = "";
}

async function fetchSocketChannel() {
    try {
        const res = await window.axios.get("/whatsapp/tables");
        return res.data?.socket_channel || null;
    } catch (e) {
        console.error("❌ Error al obtener socket_channel:", e);
        return null;
    }
}

const whatsappState = ref(null);
const whatsappStatus = ref("desconocido");

const displayStatusText = computed(() => {
    const s = whatsappState.value;
    if (!s) return "Desconectado";
    const cs = (s.connectionStatus || s.status || "").toString().toLowerCase();
    if (cs === "connected" || cs === "auth" || s.authenticated === true || cs === "authenticated") return "Conectado";
    if (cs === "connecting") return "Conectando...";
    return "Desconectado";
});

const uptimeText = computed(() => {
    const s = whatsappState.value;
    if (!s) return null;
    return s.uptimeFormatted || (typeof s.uptime === "number" ? formatUptime(s.uptime) : null);
});

function formatUptime(seconds) {
    if (!seconds || seconds <= 0) return null;
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
}

const qrData = ref(null);
const loadingQr = ref(false);
const errorMsg = ref("");

const dynamicStats = computed(() => {
    const s = whatsappState.value;
    const sent = s?.messageStats?.sent ?? 0;
    const received = s?.messageStats?.received ?? 0;
    const uptime = uptimeText.value || "0s";

    return [
        {
            id: 1,
            title: "Tiempo Activo",
            value: uptime,
            icon: "clock",
            color: "from-blue-500 to-indigo-600",
            glow: "shadow-blue-500/20"
        },
        {
            id: 2,
            title: "Enviados",
            value: sent,
            icon: "send",
            color: "from-emerald-400 to-emerald-600",
            glow: "shadow-emerald-500/20"
        },
        {
            id: 3,
            title: "Recibidos",
            value: received,
            icon: "inbox",
            color: "from-purple-500 to-fuchsia-600",
            glow: "shadow-purple-500/20"
        },
        {
            id: 4,
            title: "Estado Operativo",
            value: "100%",
            icon: "shield",
            color: "from-amber-400 to-orange-500",
            glow: "shadow-orange-500/20"
        },
    ];
});

const number = ref("");
const message = ref("");

function sendMessage() {
    if (!number.value || !message.value) {
        alert("Por favor, completa el número de WhatsApp y el mensaje.");
        return;
    }

    window.axios
        .post("/whatsapp/send", {
            number: number.value,
            message: message.value,
            tenantId: socketChannelRef.value || (socket ? socket.id : null),
        })
        .then(() => {
            alert("Mensaje enviado correctamente.");
            clearMessageForm();
        })
        .catch((err) => {
            alert("Error: " + (err?.response?.data?.message || err.message));
        });
}

async function fetchWhatsappStatus() {
    try {
        const url = socketChannelRef.value
            ? `/whatsapp/status?tenantId=${socketChannelRef.value}`
            : "/whatsapp/status";
        const res = await window.axios.get(url);
        if (res.data) {
            whatsappState.value = { ...whatsappState.value, ...res.data };
        }
    } catch (e) {}
}

let statusInterval = null;
onMounted(() => {
    statusInterval = setInterval(fetchWhatsappStatus, 5000);
});
onBeforeUnmount(() => {
    if (statusInterval) clearInterval(statusInterval);
});
</script>

<template>
    <Head title="Bot Dashboard" />

    <TenantLayout>
        <div class="py-10 min-h-screen bg-[#071626] relative overflow-hidden">
            <!-- Decorative Elements -->
            <div class="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[120px] -z-10 translate-x-1/2 -translate-y-1/2"></div>
            <div class="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-600/5 rounded-full blur-[100px] -z-10 -translate-x-1/3 translate-y-1/3"></div>

            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
                
                <!-- Hero Section -->
                <div class="relative group">
                    <div class="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-3xl blur opacity-20 group-hover:opacity-30 transition duration-1000"></div>
                    <div class="relative bg-[#0e2a47] rounded-3xl p-8 shadow-2xl border border-white/5 overflow-hidden">
                        <div class="flex flex-col md:flex-row items-center gap-8 relative z-10">
                            <div class="relative">
                                <div class="h-20 w-20 rounded-2xl bg-[#0a233d] p-3 shadow-inner ring-1 ring-white/10 flex items-center justify-center">
                                    <img :src="faviconUrl" alt="logo" class="h-12 w-12 object-contain" />
                                </div>
                                <div class="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-emerald-500 border-4 border-[#0e2a47] shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse"></div>
                            </div>
                            
                            <div class="text-center md:text-left flex-1">
                                <h1 class="text-4xl font-black text-white tracking-tight">Sdrimsac WhatsApp Bot</h1>
                                <p class="text-slate-400 mt-2 font-medium">Gestión avanzada de mensajería y automatización en tiempo real</p>
                            </div>

                            <div class="flex flex-col items-center md:items-end gap-3">
                                <div class="px-6 py-2.5 rounded-2xl bg-[#0a233d]/80 backdrop-blur-xl border border-white/5 shadow-xl flex items-center gap-3">
                                    <span class="relative flex h-3 w-3">
                                        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span class="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                                    </span>
                                    <span class="text-sm font-bold text-white tracking-wide uppercase">{{ displayStatusText }}</span>
                                    <span v-if="uptimeText" class="text-xs text-slate-400 font-mono pl-2 border-l border-white/10">{{ uptimeText }}</span>
                                </div>
                                <div class="flex gap-2">
                                    <span class="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">API v2.4</span>
                                    <span class="px-3 py-1 rounded-lg bg-blue-500/10 text-blue-400 text-[10px] font-black uppercase tracking-widest border border-blue-500/20">Online</span>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Decorative Wave -->
                        <div class="absolute bottom-0 right-0 opacity-10 pointer-events-none">
                            <svg class="w-64 h-64" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                                <path fill="#FFFFFF" d="M44.7,-76.4C58.8,-69.2,71.8,-59.1,79.6,-45.8C87.4,-32.6,90,-16.3,88.5,-0.9C86.9,14.6,81.1,29.1,72.1,41.4C63.1,53.7,50.8,63.7,37.1,70.9C23.4,78.1,8.3,82.4,-5.9,82.7C-20,83.1,-33.3,79.5,-45.5,72.1C-57.7,64.7,-68.9,53.5,-76.4,40.4C-83.9,27.3,-87.7,12.3,-87.3,-2.6C-86.9,-17.5,-82.3,-32.3,-73.4,-44.6C-64.4,-56.9,-51.1,-66.6,-37.1,-73.9C-23.1,-81.2,-8.5,-85.9,6.2,-86.6C20.8,-87.3,44.7,-76.4Z" transform="translate(100 100)" />
                            </svg>
                        </div>
                    </div>
                </div>

                <!-- Stats Grid -->
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div v-for="item in dynamicStats" :key="item.id" 
                         class="bg-[#0e2a47] rounded-3xl p-6 border border-white/5 hover:border-white/10 hover:shadow-2xl transition-all duration-300 group relative">
                        <div class="flex flex-col gap-4">
                            <div class="flex items-center justify-between">
                                <p class="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">{{ item.title }}</p>
                                <div :class="[`h-10 w-10 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white shadow-lg transition-all duration-500 transform group-hover:scale-110 group-hover:rotate-6 shadow-md`]">
                                    <svg v-if="item.icon === 'clock'" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    <svg v-if="item.icon === 'send'" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                                    <svg v-if="item.icon === 'inbox'" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V7a2 2 0 00-2-2H6a2 2 0 00-2 2v6m14 0l-3-3m3 3l-3 3M6 13l3-3m-3 3l3 3" /></svg>
                                    <svg v-if="item.icon === 'shield'" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                                </div>
                            </div>
                            <div>
                                <h3 class="text-3xl font-black text-white tracking-tighter">{{ item.value }}</h3>
                                <div class="mt-2 h-1.5 w-full bg-[#0a233d] rounded-full overflow-hidden">
                                    <div :class="[`h-full bg-gradient-to-r ${item.color} shadow-[0_0_10px_white/10]`]" style="width: 75%"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <!-- WhatsApp Status & QR -->
                    <div class="lg:col-span-4 space-y-8">
                        <div class="bg-[#0e2a47] rounded-3xl p-8 border border-white/5 shadow-2xl relative overflow-hidden group">
                            <h3 class="text-xl font-black text-white mb-6 flex items-center gap-2">
                                <svg class="w-6 h-6 text-emerald-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12.012 2c-5.508 0-9.987 4.479-9.987 9.987 0 1.763.454 3.424 1.258 4.876l-1.283 4.67 4.777-1.251c1.403.766 2.992 1.2 4.686 1.2 5.511 0 9.991-4.481 9.991-9.987 0-5.508-4.481-9.987-9.991-9.987zM18.103 16.539c-.263.743-1.524 1.349-2.106 1.441-.502.079-1.155.114-1.841-.114-.411-.137-.935-.297-1.597-.571-2.821-1.163-4.646-4.04-4.787-4.228-.141-.188-1.144-1.524-1.144-2.903 0-1.38.706-2.057 1.01-2.37.304-.313.665-.391.884-.391.219 0 .438.001.627.01.201.009.467-.076.732.553.268.643.916 2.231.996 2.395.08.164.134.356.022.583-.111.226-.168.368-.335.563-.167.195-.35.435-.499.583-.165.163-.338.342-.146.671.192.329.852 1.408 1.83 2.278.854.761 1.572 1.258 2.39 1.667.625.312 1.096.25 1.503-.223.407-.472 1.731-2.01 2.193-2.697.463-.687.926-.573 1.562-.338s4.032 1.901 4.726 2.247c.694.346 1.157.519 1.325.808.168.289.168 1.667-.095 2.411z"/></svg>
                                Estado de Sesión
                            </h3>
                            
                            <div class="space-y-6 relative z-10">
                                <div class="bg-[#0a233d] rounded-2xl p-5 border border-white/5 ring-1 ring-inset ring-white/5 shadow-inner">
                                    <div class="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Estado Conexión</div>
                                    <div class="text-2xl font-black text-white">{{ displayStatusText }}</div>
                                </div>

                                <div class="relative group/qr bg-[#0a233d] rounded-3xl p-4 border border-white/5 flex items-center justify-center min-h-[220px] shadow-inner overflow-hidden">
                                    <div v-if="loadingQr" class="flex flex-col items-center gap-3">
                                        <div class="h-10 w-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                                        <p class="text-[10px] font-black uppercase text-slate-500 tracking-tighter">Generando Código...</p>
                                    </div>
                                    <div v-else-if="qrData" class="text-center group-hover:scale-105 transition-transform duration-500">
                                        <img :src="qrData" alt="QR" class="rounded-2xl shadow-2xl border-4 border-white ring-8 ring-white/5 max-h-48" />
                                        <p class="mt-4 text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] animate-pulse">Escanea desde WhatsApp</p>
                                    </div>
                                    <div v-else class="text-center px-6">
                                        <div class="h-16 w-16 bg-[#071626] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/5 shadow-xl">
                                            <svg class="w-8 h-8 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
                                        </div>
                                        <p class="text-xs text-slate-500 font-medium">No hay código activo disponible ahora</p>
                                    </div>
                                </div>

                                <button @click="deleteSession" class="w-full py-4 rounded-2xl bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white text-sm font-bold border border-rose-500/20 transition-all duration-300 transform active:scale-95 flex items-center justify-center gap-2">
                                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    Finalizar Sesión Activa
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Message Console -->
                    <div class="lg:col-span-8 flex flex-col">
                        <div class="bg-[#0e2a47] rounded-3xl border border-white/5 shadow-2xl overflow-hidden flex-1 relative group">
                            <!-- Glow header -->
                            <div class="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500"></div>
                            
                            <div class="p-8">
                                <div class="flex items-center justify-between mb-8">
                                    <h3 class="text-xl font-black text-white flex items-center gap-2">
                                        <svg class="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                                        Consola de Envío
                                    </h3>
                                    <div class="flex gap-2">
                                        <button class="px-4 py-1.5 rounded-xl bg-blue-600/20 text-blue-400 text-xs font-black uppercase tracking-tighter border border-blue-500/30">Texto Plano</button>
                                        <button class="px-4 py-1.5 rounded-xl bg-slate-800 text-slate-500 text-xs font-bold uppercase tracking-tighter border border-white/5">Multimedia</button>
                                    </div>
                                </div>

                                <form @submit.prevent="sendMessage" class="space-y-6">
                                    <div class="space-y-2">
                                        <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Destinatario (WhatsApp Number)</label>
                                        <div class="relative group/input">
                                            <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <svg class="h-5 w-5 text-slate-600 group-focus-within/input:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                            </div>
                                            <input v-model="number" type="text" placeholder="Ej: 51935921640" 
                                                   class="w-full bg-[#0a233d] border-white/5 rounded-2xl pl-12 pr-4 py-4 text-white font-bold placeholder:text-slate-700 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-inner" />
                                        </div>
                                    </div>

                                    <div class="space-y-2">
                                        <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Cuerpo del Mensaje</label>
                                        <textarea v-model="message" rows="6" placeholder="Escribe tu mensaje aquí..." 
                                                  class="w-full bg-[#0a233d] border-white/5 rounded-2xl px-4 py-4 text-white font-medium placeholder:text-slate-700 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-inner resize-none"></textarea>
                                    </div>

                                    <div class="flex items-center gap-4 pt-2">
                                        <button type="submit" class="flex-1 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest shadow-[0_10px_30px_rgba(37,99,235,0.3)] hover:shadow-[0_15px_40px_rgba(37,99,235,0.4)] transition-all transform active:scale-95 flex items-center justify-center gap-3">
                                            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                            Ejecutar Envío
                                        </button>
                                        <button @click="clearMessageForm" type="button" class="px-8 py-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-400 font-bold uppercase tracking-tighter border border-white/5 transition-all">
                                            Limpiar
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    </TenantLayout>
</template>

<style scoped>
@keyframes pulse-slow {
    0%, 100% { opacity: 0.1; transform: scale(1); }
    50% { opacity: 0.2; transform: scale(1.1); }
}
</style>
