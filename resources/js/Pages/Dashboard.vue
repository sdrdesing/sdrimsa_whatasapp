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
        <div class="py-12">
            <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
                <div
                    class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
                >
                    <!-- Card: Tiempo activo -->
                    <div
                        class="relative overflow-hidden rounded-lg p-6 shadow-md bg-gradient-to-br from-slate-800 to-slate-900 text-white"
                    >
                        <div class="flex items-start justify-between">
                            <div>
                                <div class="text-xs text-slate-300 uppercase">
                                    Tiempo activo (Global)
                                </div>
                                <div class="mt-2 text-2xl font-semibold">
                                    {{ stats.uptime }}
                                </div>
                                <div class="mt-1 text-sm text-slate-400">
                                    Servidor del Bot
                                </div>
                            </div>
                            <div class="flex flex-col items-end space-y-2">
                                <div
                                    class="h-10 w-10 rounded-md flex items-center justify-center bg-blue-500"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        class="h-5 w-5 text-white"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                    >
                                        <path
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            stroke-width="2"
                                            d="M12 8v4l2 2"
                                        />
                                        <circle
                                            cx="12"
                                            cy="12"
                                            r="9"
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            stroke-width="2"
                                        />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Card: Mensajes enviados -->
                    <div
                        class="relative overflow-hidden rounded-lg p-6 shadow-md bg-gradient-to-br from-slate-800 to-slate-900 text-white"
                    >
                        <div class="flex items-start justify-between">
                            <div>
                                <div class="text-xs text-slate-300 uppercase">
                                    Mensajes enviados
                                </div>
                                <div class="mt-2 text-2xl font-semibold">
                                    {{ stats.sent }}
                                </div>
                                <div class="mt-1 text-sm text-slate-400">
                                    Total acumulado
                                </div>
                            </div>
                            <div class="flex flex-col items-end space-y-2">
                                <div
                                    class="h-10 w-10 rounded-md flex items-center justify-center bg-green-500"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        class="h-5 w-5 text-white"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                    >
                                        <path
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            stroke-width="2"
                                            d="M22 2L11 13"
                                        />
                                        <path
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            stroke-width="2"
                                            d="M22 2l-7 20  -4-9-9-4 20-7z"
                                        />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Card: Mensajes recibidos -->
                    <div
                        class="relative overflow-hidden rounded-lg p-6 shadow-md bg-gradient-to-br from-slate-800 to-slate-900 text-white"
                    >
                        <div class="flex items-start justify-between">
                            <div>
                                <div class="text-xs text-slate-300 uppercase">
                                    Mensajes recibidos
                                </div>
                                <div class="mt-2 text-2xl font-semibold">
                                    {{ stats.received }}
                                </div>
                                <div class="mt-1 text-sm text-slate-400">
                                    Total acumulado
                                </div>
                            </div>
                            <div class="flex flex-col items-end space-y-2">
                                <div
                                    class="h-10 w-10 rounded-md flex items-center justify-center bg-purple-600"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        class="h-5 w-5 text-white"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                    >
                                        <path
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            stroke-width="2"
                                            d="M20 13V7a2 2 0 00-2-2H6a2 2 0 00-2 2v6"
                                        />
                                        <path
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            stroke-width="2"
                                            d="M7 13l3 3 7-7"
                                        />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Card: Bots Activos -->
                    <div
                        class="relative overflow-hidden rounded-lg p-6 shadow-md bg-gradient-to-br from-slate-800 to-slate-900 text-white"
                    >
                        <div class="flex items-start justify-between">
                            <div>
                                <div class="text-xs text-slate-300 uppercase">
                                    Bots Activos
                                </div>
                                <div class="mt-2 text-2xl font-semibold">
                                    {{ stats.activeBots }}
                                </div>
                                <div class="mt-1 text-sm text-slate-400">
                                    Conexiones abiertas
                                </div>
                            </div>
                            <div class="flex flex-col items-end space-y-2">
                                <div
                                    class="h-10 w-10 rounded-md flex items-center justify-center bg-slate-700"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        class="h-5 w-5 text-white"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                    >
                                        <path
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            stroke-width="2"
                                            d="M12 2l9 4-9 4-9-4 9-4z"
                                        />
                                        <path
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            stroke-width="2"
                                            d="M12 10v10"
                                        />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <!-- Sección de Logs / Cola Global -->
        <div class="mt-8">
            <div
                class="bg-slate-800 rounded-lg shadow-md overflow-hidden text-white"
            >
                <div
                    class="p-6 border-b border-slate-700 flex justify-between items-center"
                >
                    <div>
                        <h2 class="text-xl font-bold">
                            Registro de Mensajes Global
                        </h2>
                        <p class="text-sm text-slate-400">
                            Últimos eventos procesados por todos los clientes
                        </p>
                    </div>
                    <div class="flex items-center gap-2">
                        <span
                            class="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"
                        ></span>
                        <span
                            class="text-xs text-slate-400 uppercase tracking-wider"
                            >En tiempo real</span
                        >
                    </div>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left">
                        <thead
                            class="bg-slate-900 text-xs uppercase text-slate-300"
                        >
                            <tr>
                                <th class="px-6 py-3">Tenant</th>
                                <th class="px-6 py-3">Tipo</th>
                                <th class="px-6 py-3">Destino</th>
                                <th class="px-6 py-3">Estado</th>
                                <th class="px-6 py-3">Fecha</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-700">
                            <tr
                                v-for="log in stats.logs"
                                :key="log.id"
                                class="hover:bg-slate-700/50 transition-colors"
                            >
                                <td
                                    class="px-6 py-4 font-mono text-emerald-400 text-sm"
                                >
                                    {{ log.tenantName || log.tenantId }}
                                </td>
                                <td class="px-6 py-4">
                                    <span
                                        class="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-700 text-slate-300 border border-slate-600"
                                    >
                                        {{ log.type }}
                                    </span>
                                </td>
                                <td class="px-6 py-4 text-sm font-medium">
                                    {{ log.number }}
                                </td>
                                <td class="px-6 py-4">
                                    <span
                                        v-if="log.status === 'sent'"
                                        class="text-emerald-500 flex items-center gap-1.5 text-sm font-medium"
                                    >
                                        <svg
                                            class="w-4 h-4"
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                        >
                                            <path
                                                fill-rule="evenodd"
                                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                clip-rule="evenodd"
                                            ></path>
                                        </svg>
                                        Enviado
                                    </span>
                                    <div
                                        v-else
                                        class="flex flex-col gap-1"
                                    >
                                        <span class="text-red-500 flex items-center gap-1.5 text-sm font-medium" :title="log.error">
                                            <svg
                                                class="w-4 h-4"
                                                fill="currentColor"
                                                viewBox="0 0 20 20"
                                            >
                                                <path
                                                    fill-rule="evenodd"
                                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                                    clip-rule="evenodd"
                                                ></path>
                                            </svg>
                                            Fallido
                                        </span>
                                        <span v-if="log.error" class="text-xs text-red-400 break-words max-w-xs">{{ log.error }}</span>
                                    </div>
                                </td>
                                <td
                                    class="px-6 py-4 text-xs text-slate-400 font-mono"
                                >
                                    {{
                                        new Date(
                                            log.timestamp,
                                        ).toLocaleTimeString()
                                    }}
                                </td>
                            </tr>
                            <tr v-if="stats.logs.length === 0">
                                <td
                                    colspan="5"
                                    class="px-6 py-12 text-center text-slate-500 italic"
                                >
                                    No hay actividad reciente en la cola de
                                    mensajería.
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </AuthenticatedLayout>
</template>
