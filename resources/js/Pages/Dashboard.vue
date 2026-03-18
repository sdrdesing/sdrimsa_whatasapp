<script setup>
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout.vue";
import { Head } from "@inertiajs/vue3";
import { ref, onMounted, onBeforeUnmount } from "vue";

const stats = ref({
    uptime: "Iniciando...",
    sent: 0,
    received: 0,
    activeBots: 0,
    logs: [],
});

const loading = ref(true);
let interval = null;

async function fetchGlobalStats() {
    try {
        const res = await window.axios.get(route("system.global_status"));
        stats.value = {
            uptime: res.data.uptimeFormatted || "0s",
            sent: res.data.totalSent || 0,
            received: res.data.totalReceived || 0,
            activeBots: res.data.activeBots || 0,
            logs: res.data.logs || [],
        };
    } catch (e) {
        console.error("Error al obtener estadísticas globales:", e);
    } finally {
        loading.value = false;
    }
}

onMounted(() => {
    fetchGlobalStats();
    // Actualizar cada 10 segundos
    interval = setInterval(fetchGlobalStats, 10000);
});

onBeforeUnmount(() => {
    if (interval) clearInterval(interval);
});
</script>

<template>
    <Head title="Dashboard" />

    <AuthenticatedLayout>
        <div class="py-10 min-h-screen bg-[#071626] relative">
            <!-- Decorative top background -->
            <div class="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-[#0a233d] to-transparent pointer-events-none -z-10"></div>
            
            <div class="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-8">
                
                <!-- Header -->
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 sm:px-0">
                    <div>
                        <h1 class="text-3xl font-extrabold text-white tracking-tight drop-shadow-sm">Panel de Control Global</h1>
                        <p class="text-sm text-slate-400 mt-1 animate-pulse">Monitoreo en tiempo real de todos los Tenants</p>
                    </div>
                    <div class="mt-4 sm:mt-0 flex items-center gap-2 bg-[#0a233d]/80 backdrop-blur-md px-4 py-2 rounded-full shadow-lg border border-white/5">
                        <span class="relative flex h-3 w-3">
                          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span class="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                        </span>
                        <span class="text-xs font-bold text-slate-200 tracking-widest uppercase">Sistema Activo</span>
                    </div>
                </div>

                <!-- Cards Grid -->
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-4 sm:px-0">
                    <!-- Card: Tiempo Activo -->
                    <div class="bg-[#0e2a47] rounded-2xl p-6 shadow-xl border border-white/5 hover:border-blue-500/30 hover:shadow-[0_8px_30px_rgba(59,130,246,0.15)] transition-all duration-300 hover:-translate-y-1 group">
                        <div class="flex items-start justify-between">
                            <div>
                                <p class="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tiempo de Actividad</p>
                                <h3 class="text-3xl font-black text-white tracking-tight group-hover:text-blue-400 transition-colors">{{ stats.uptime }}</h3>
                                <p class="text-xs font-medium text-slate-400 mt-2 flex items-center gap-1">Servidor del Bot Node</p>
                            </div>
                            <div class="h-12 w-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/20 text-white transform group-hover:scale-110 group-hover:shadow-blue-500/40 transition-all duration-300">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l2 2m-2-10a9 9 0 110 18 9 9 0 010-18z" /></svg>
                            </div>
                        </div>
                    </div>

                    <!-- Card: Sent -->
                    <div class="bg-[#0e2a47] rounded-2xl p-6 shadow-xl border border-white/5 hover:border-emerald-500/30 hover:shadow-[0_8px_30px_rgba(16,185,129,0.15)] transition-all duration-300 hover:-translate-y-1 group">
                        <div class="flex items-start justify-between">
                            <div>
                                <p class="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Mensajes Enviados</p>
                                <h3 class="text-3xl font-black text-white tracking-tight group-hover:text-emerald-400 transition-colors">{{ stats.sent }}</h3>
                                <p class="text-xs font-medium text-slate-400 mt-2">Total de salidas globales</p>
                            </div>
                            <div class="h-12 w-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/20 text-white transform group-hover:scale-110 group-hover:shadow-emerald-500/40 transition-all duration-300">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                            </div>
                        </div>
                    </div>

                    <!-- Card: Received -->
                    <div class="bg-[#0e2a47] rounded-2xl p-6 shadow-xl border border-white/5 hover:border-purple-500/30 hover:shadow-[0_8px_30px_rgba(168,85,247,0.15)] transition-all duration-300 hover:-translate-y-1 group">
                        <div class="flex items-start justify-between">
                            <div>
                                <p class="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Mensajes Recibidos</p>
                                <h3 class="text-3xl font-black text-white tracking-tight group-hover:text-purple-400 transition-colors">{{ stats.received }}</h3>
                                <p class="text-xs font-medium text-slate-400 mt-2">Total de entradas globales</p>
                            </div>
                            <div class="h-12 w-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-purple-500 to-fuchsia-600 shadow-lg shadow-purple-500/20 text-white transform group-hover:scale-110 group-hover:shadow-purple-500/40 transition-all duration-300">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V7a2 2 0 00-2-2H6a2 2 0 00-2 2v6m14 0l-3-3m3 3l-3 3M6 13l3-3m-3 3l3 3" /></svg>
                            </div>
                        </div>
                    </div>

                    <!-- Card: Active Bots -->
                    <div class="bg-[#0e2a47] rounded-2xl p-6 shadow-xl border border-white/5 hover:border-amber-500/30 hover:shadow-[0_8px_30px_rgba(245,158,11,0.15)] transition-all duration-300 hover:-translate-y-1 group">
                        <div class="flex items-start justify-between">
                            <div>
                                <p class="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Bots Activos</p>
                                <h3 class="text-3xl font-black text-white tracking-tight group-hover:text-amber-400 transition-colors">{{ stats.activeBots }}</h3>
                                <p class="text-xs font-medium text-slate-400 mt-2">Conexiones simultáneas</p>
                            </div>
                            <div class="h-12 w-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-orange-500/20 text-white transform group-hover:scale-110 group-hover:shadow-orange-500/40 transition-all duration-300">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Table Section -->
                <div class="px-4 sm:px-0">
                    <div class="bg-[#0e2a47] rounded-2xl shadow-xl border border-white/5 overflow-hidden">
                        
                        <!-- Table Head/Controls -->
                        <div class="px-6 py-5 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h2 class="text-lg font-bold text-white">Últimos Eventos del Sistema</h2>
                                <p class="text-sm text-slate-400">Registro global de actividad de mensajería procesada.</p>
                            </div>
                        </div>

                        <!-- Table -->
                        <div class="overflow-x-auto">
                            <table class="w-full text-left whitespace-nowrap">
                                <thead>
                                    <tr class="bg-[#081e36] text-[10px] font-bold tracking-widest text-slate-400 uppercase border-b border-white/5">
                                        <th class="px-6 py-4">Tenant (Subdominio)</th>
                                        <th class="px-6 py-4">Status</th>
                                        <th class="px-6 py-4">Tipo</th>
                                        <th class="px-6 py-4 min-w-[250px]">Mensaje</th>
                                        <th class="px-6 py-4">Destinatario</th>
                                        <th class="px-6 py-4 text-right">Hora</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-white/5 bg-[#0e2a47]">
                                    <tr v-for="log in stats.logs" :key="log.id" class="hover:bg-white/[0.02] transition-colors duration-200 group">
                                        
                                        <!-- Tenant Name -->
                                        <td class="px-6 py-4">
                                            <div class="flex items-center gap-3">
                                                <div class="h-8 w-8 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-xs ring-1 ring-blue-500/30 group-hover:bg-blue-500 group-hover:text-white transition-colors duration-300">
                                                    {{ (log.tenantName || log.tenantId).charAt(0).toUpperCase() }}
                                                </div>
                                                <span class="font-semibold text-slate-200 text-sm tracking-tight">{{ log.tenantName || log.tenantId }}</span>
                                            </div>
                                        </td>

                                        <!-- Status Badge -->
                                        <td class="px-6 py-4">
                                            <span v-if="log.status === 'sent'" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm">
                                                <span class="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.8)]"></span>
                                                Enviado
                                            </span>
                                            <div v-else class="flex flex-col gap-1">
                                                <span class="inline-flex items-center gap-1.5 w-max px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-sm">
                                                    <span class="h-1.5 w-1.5 rounded-full bg-rose-500 shadow-[0_0_5px_rgba(244,63,94,0.8)]"></span>
                                                    Fallido
                                                </span>
                                                <span v-if="log.error" class="text-[10px] text-rose-400/80 max-w-[150px] truncate" :title="log.error">{{ log.error }}</span>
                                            </div>
                                        </td>

                                        <!-- Type -->
                                        <td class="px-6 py-4">
                                            <span class="px-2 py-1 rounded text-[10px] font-black tracking-wider uppercase bg-[#081e36] text-slate-400 border border-white/5">
                                                {{ log.type }}
                                            </span>
                                        </td>

                                        <!-- Message content with hover tooltip -->
                                        <td class="px-6 py-4">
                                            <div class="relative group/tooltip">
                                                <p class="text-sm text-slate-300 truncate max-w-[250px] font-medium" :title="log.messageContent || '-'">
                                                    {{ log.messageContent || '-' }}
                                                </p>
                                            </div>
                                        </td>

                                        <!-- Destination -->
                                        <td class="px-6 py-4">
                                            <div class="flex items-center gap-2 text-sm font-semibold text-slate-200">
                                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                                {{ log.number || log.groupJid }}
                                            </div>
                                        </td>

                                        <!-- Date -->
                                        <td class="px-6 py-4 text-right">
                                            <span class="text-xs font-semibold text-slate-400 tabular-nums bg-[#081e36] px-2 py-1.5 rounded-lg border border-white/5 shadow-inner">
                                                {{ new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) }}
                                            </span>
                                        </td>
                                    </tr>

                                    <tr v-if="stats.logs.length === 0">
                                        <td colspan="6" class="px-6 py-16 text-center">
                                            <div class="flex flex-col items-center justify-center space-y-3">
                                                <div class="h-16 w-16 bg-[#081e36] rounded-full flex items-center justify-center text-slate-500 mb-2 border border-white/5 box-shadow-inner">
                                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V7a2 2 0 00-2-2H6a2 2 0 00-2 2v6m14 0l-3-3m3 3l-3 3M6 13l3-3m-3 3l3 3" /></svg>
                                                </div>
                                                <h3 class="text-sm font-bold text-slate-300">No hay actividad reciente</h3>
                                                <p class="text-sm text-slate-500">Los mensajes procesados aparecerán aquí en vivo.</p>
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    </AuthenticatedLayout>
</template>
