<script setup>
import TenantLayout from "@/Layouts/TenantLayout.vue";
import { ref, onMounted, computed } from "vue";
import { Head, usePage } from "@inertiajs/vue3";
import axios from "axios";

const page = usePage();
const socketChannel = ref(null);

onMounted(async () => {
    try {
        const res = await axios.get("/whatsapp/tables");
        socketChannel.value = res.data?.socket_channel || null;
    } catch (e) {
        console.error("Error fetching socket channel:", e);
    }
});

const sendingType = ref("numbers"); // 'numbers' or 'groups'
const targets = ref("");
const messageBody = ref("");
const isSending = ref(false);
const progress = ref(0);
const logs = ref([]);

const targetPlaceholder = computed(() => {
    return sendingType.value === "numbers"
        ? "Ingresa números separados por comas o saltos de línea (ej: 51935921640, 51999888777)"
        : "Ingresa JIDs de grupos separados por comas (ej: 123456789@g.us)";
});

async function startBulkSend() {
    if (!targets.value || !messageBody.value) {
        alert("Por favor completa los destinatarios y el mensaje.");
        return;
    }

    const targetList = targets.value
        .split(/[\n,]+/)
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

    if (targetList.length === 0) {
        alert("No se encontraron destinatarios válidos.");
        return;
    }

    if (
        !confirm(
            `¿Estás seguro de enviar este mensaje a ${targetList.length} destinatarios?`,
        )
    ) {
        return;
    }

    isSending.value = true;
    progress.value = 0;
    logs.value = [];

    for (let i = 0; i < targetList.length; i++) {
        const target = targetList[i];
        const currentProgress = Math.round(((i + 1) / targetList.length) * 100);

        try {
            await axios.post("/whatsapp/send", {
                number: target,
                message: messageBody.value,
                tenantId: socketChannel.value,
            });

            logs.value.unshift({
                id: Date.now() + i,
                target: target,
                status: "success",
                time: new Date().toLocaleTimeString(),
            });
        } catch (error) {
            logs.value.unshift({
                id: Date.now() + i,
                target: target,
                status: "error",
                message: error.response?.data?.message || error.message,
                time: new Date().toLocaleTimeString(),
            });
        }

        progress.value = currentProgress;
        // Pequeño delay para no saturar
        await new Promise((r) => setTimeout(r, 1000));
    }

    isSending.value = false;
    alert("Proceso de envío masivo finalizado.");
}

function clearForm() {
    targets.value = "";
    messageBody.value = "";
    logs.value = [];
    progress.value = 0;
}
</script>

<template>
    <Head title="Envío Masivo - WhatsApp" />

    <TenantLayout>
        <div
            class="py-10 min-h-screen bg-[#071626] relative overflow-hidden w-full"
        >
            <!-- Decorative Elements -->
            <div
                class="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[120px] -z-10 translate-x-1/2 -translate-y-1/2"
            ></div>
            <div
                class="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-600/5 rounded-full blur-[100px] -z-10 -translate-x-1/3 translate-y-1/3"
            ></div>

            <div
                class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 w-full"
            >
                <!-- Header Section -->
                <div class="relative group">
                    <div
                        class="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-3xl blur opacity-20 group-hover:opacity-30 transition duration-1000"
                    ></div>
                    <div
                        class="relative bg-[#0e2a47] rounded-3xl p-8 shadow-2xl border border-white/5 overflow-hidden"
                    >
                        <div
                            class="flex flex-col md:flex-row items-center gap-6 relative z-10"
                        >
                            <div
                                class="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shrink-0"
                            >
                                <svg
                                    class="w-8 h-8"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
                                    />
                                </svg>
                            </div>
                            <div class="text-center md:text-left flex-1">
                                <h1
                                    class="text-3xl font-black text-white tracking-tight"
                                >
                                    WhatsApp Mensajes
                                </h1>
                                <p
                                    class="text-slate-400 mt-1 font-medium italic"
                                >
                                    Campañas de envío masivo y comunicación
                                    directa
                                </p>
                            </div>
                            <div
                                v-if="isSending"
                                class="flex flex-col items-end gap-2 shrink-0"
                            >
                                <span
                                    class="text-xs font-black text-blue-400 uppercase tracking-widest animate-pulse"
                                    >Procesando Envío...</span
                                >
                                <div
                                    class="w-48 h-2 bg-[#0a233d] rounded-full overflow-hidden border border-white/5"
                                >
                                    <div
                                        class="h-full bg-blue-500 transition-all duration-500"
                                        :style="{ width: progress + '%' }"
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <!-- Configuración del Envío -->
                    <div class="lg:col-span-12 xl:col-span-8">
                        <div
                            class="bg-[#0e2a47] rounded-3xl border border-white/5 shadow-2xl overflow-hidden group h-full"
                        >
                            <div
                                class="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 to-emerald-500 opacity-50"
                            ></div>
                            <div class="p-8 h-full flex flex-col">
                                <div
                                    class="flex items-center justify-between mb-8"
                                >
                                    <h3
                                        class="text-xl font-black text-white flex items-center gap-3"
                                    >
                                        <svg
                                            class="w-6 h-6 text-emerald-400"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                stroke-linecap="round"
                                                stroke-linejoin="round"
                                                stroke-width="2"
                                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2-2z"
                                            />
                                        </svg>
                                        Configuración de Campaña
                                    </h3>
                                    <div
                                        class="flex bg-[#0a233d] p-1 rounded-xl border border-white/5"
                                    >
                                        <button
                                            @click="sendingType = 'numbers'"
                                            :class="[
                                                sendingType === 'numbers'
                                                    ? 'bg-blue-600 text-white shadow-lg'
                                                    : 'text-slate-500 hover:text-slate-300',
                                            ]"
                                            class="px-4 py-2 rounded-lg text-xs font-black uppercase tracking-tighter transition-all duration-200"
                                        >
                                            Números
                                        </button>
                                        <button
                                            @click="sendingType = 'groups'"
                                            :class="[
                                                sendingType === 'groups'
                                                    ? 'bg-blue-600 text-white shadow-lg'
                                                    : 'text-slate-500 hover:text-slate-300',
                                            ]"
                                            class="px-4 py-2 rounded-lg text-xs font-black uppercase tracking-tighter transition-all duration-200"
                                        >
                                            Grupos
                                        </button>
                                    </div>
                                </div>

                                <div class="space-y-6">
                                    <div class="space-y-2">
                                        <label
                                            class="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1"
                                            >Destinatarios</label
                                        >
                                        <textarea
                                            v-model="targets"
                                            rows="4"
                                            :placeholder="targetPlaceholder"
                                            class="w-full bg-[#0a233d] border-white/5 rounded-2xl px-4 py-4 text-white font-medium placeholder:text-slate-700 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-inner resize-none"
                                        ></textarea>
                                        <p
                                            class="text-[10px] text-slate-500 italic ml-1"
                                        >
                                            * Puedes copiar y pegar desde Excel
                                            o texto cualquier lista.
                                        </p>
                                    </div>

                                    <div class="space-y-2">
                                        <label
                                            class="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1"
                                            >Mensaje de la Campaña</label
                                        >
                                        <textarea
                                            v-model="messageBody"
                                            rows="6"
                                            placeholder="Escribe el mensaje que recibirán todos los contactos..."
                                            class="w-full bg-[#0a233d] border-white/5 rounded-2xl px-4 py-4 text-white font-medium placeholder:text-slate-700 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-inner resize-none"
                                        ></textarea>
                                    </div>

                                    <div
                                        class="flex items-center gap-4 pt-4 border-t border-white/5"
                                    >
                                        <button
                                            @click="startBulkSend"
                                            :disabled="isSending"
                                            class="flex-1 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white font-black uppercase tracking-widest shadow-xl transform active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                                        >
                                            <svg
                                                v-if="!isSending"
                                                class="h-5 w-5"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    stroke-linecap="round"
                                                    stroke-linejoin="round"
                                                    stroke-width="2"
                                                    d="M13 10V3L4 14h7v7l9-11h-7z"
                                                />
                                            </svg>
                                            <div
                                                v-else
                                                class="h-5 w-5 border-2 border-white/20 border-t-white rounded-full animate-spin"
                                            ></div>
                                            {{
                                                isSending
                                                    ? "Enviando..."
                                                    : "Iniciar Envío Masivo"
                                            }}
                                        </button>
                                        <button
                                            @click="clearForm"
                                            :disabled="isSending"
                                            class="px-8 py-4 rounded-2xl bg-[#0a233d] hover:bg-[#123154] text-slate-400 font-bold uppercase tracking-tighter border border-white/5 transition-all disabled:opacity-30"
                                        >
                                            Reiniciar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Log de Actividad Actual -->
                    <div class="lg:col-span-12 xl:col-span-4">
                        <div
                            class="bg-[#0e2a47] rounded-3xl border border-white/5 shadow-2xl h-full flex flex-col overflow-hidden"
                        >
                            <div
                                class="p-6 border-b border-white/5 flex items-center justify-between bg-[#0a233d]/30"
                            >
                                <h3
                                    class="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2"
                                >
                                    <span
                                        class="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"
                                    ></span>
                                    Log de Envío
                                </h3>
                                <span
                                    class="text-[10px] text-slate-500 font-bold"
                                    >{{ logs.length }} registros</span
                                >
                            </div>

                            <div
                                class="flex-1 overflow-y-auto p-4 space-y-3 max-h-[600px] scrollbar-thin scrollbar-thumb-white/10"
                            >
                                <div
                                    v-if="logs.length === 0"
                                    class="flex flex-col items-center justify-center py-20 text-center opacity-30"
                                >
                                    <svg
                                        class="w-12 h-12 text-slate-500 mb-4"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            stroke-width="2"
                                            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                                        />
                                    </svg>
                                    <p class="text-xs font-bold uppercase">
                                        Esperando inicio...
                                    </p>
                                </div>

                                <div
                                    v-for="log in logs"
                                    :key="log.id"
                                    class="p-4 rounded-2xl bg-[#0a233d] border border-white/5 flex items-center justify-between animate-fadeIn transition-all hover:border-white/10"
                                >
                                    <div class="flex items-center gap-3">
                                        <div
                                            :class="[
                                                log.status === 'success'
                                                    ? 'bg-emerald-500/10 text-emerald-500'
                                                    : 'bg-rose-500/10 text-rose-500',
                                            ]"
                                            class="h-8 w-8 rounded-xl flex items-center justify-center border border-white/5 shadow-inner"
                                        >
                                            <svg
                                                v-if="log.status === 'success'"
                                                class="w-4 h-4"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    stroke-linecap="round"
                                                    stroke-linejoin="round"
                                                    stroke-width="2"
                                                    d="M5 13l4 4L19 7"
                                                />
                                            </svg>
                                            <svg
                                                v-else
                                                class="w-4 h-4"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    stroke-linecap="round"
                                                    stroke-linejoin="round"
                                                    stroke-width="2"
                                                    d="M6 18L18 6M6 6l12 12"
                                                />
                                            </svg>
                                        </div>
                                        <div class="flex flex-col">
                                            <span
                                                class="text-xs font-bold text-slate-200"
                                                >{{ log.target }}</span
                                            >
                                            <span
                                                class="text-[10px] text-slate-500 font-medium"
                                                >{{ log.time }}</span
                                            >
                                        </div>
                                    </div>
                                    <span
                                        v-if="log.status === 'error'"
                                        class="text-[9px] font-black text-rose-400 bg-rose-500/10 px-2 py-1 rounded-md uppercase tracking-tighter"
                                        >Error</span
                                    >
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </TenantLayout>
</template>

<style scoped>
.scrollbar-thin::-webkit-scrollbar {
    width: 4px;
}
.scrollbar-thin::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 10px;
}
@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
.animate-fadeIn {
    animation: fadeIn 0.3s ease-out forwards;
}
</style>
