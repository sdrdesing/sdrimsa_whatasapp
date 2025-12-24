
<script setup>
import TenantLayout from '@/Layouts/TenantLayout.vue';
/* import { Head } from '@inertiajs/vue3'; */
import { ref } from 'vue';

const stats = [
    { id: 1, title: 'TIEMPO ACTIVO', value: '20h 54m', description: 'Desde el inicio del servicio', bg: 'bg-gradient-to-r from-sky-600 to-blue-800' },
    { id: 2, title: 'MENSAJES ENVIADOS', value: 0, description: 'Total de mensajes procesados', bg: 'bg-gradient-to-r from-emerald-500 to-green-600' },
    { id: 3, title: 'MENSAJES RECIBIDOS', value: 22, description: 'Total de mensajes entrantes', bg: 'bg-gradient-to-r from-indigo-500 to-violet-600' },
    { id: 4, title: 'ESTADO DEL SISTEMA', value: '100%', description: 'Operatividad del bot', bg: 'bg-gradient-to-r from-gray-600 to-gray-800' }
];

const connected = ref(true);
const phone = ref('');
const message = ref('');

function sendMessage() {
    // placeholder: aquí iría la llamada al endpoint Inertia/axios
    console.log('sending', phone.value, message.value);
    alert('Mensaje enviado (simulado)');
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
                            <img src="/logos/favicon.png" alt="logo" class="h-16 w-16 object-contain hidden sm:block" />
                            <div>
                                <h1 class="text-3xl font-bold text-white">Sdrimsac WhatsApp Bot</h1>
                                <p class="text-sm text-slate-300">Panel de Control y Gestión de Mensajes</p>
                            </div>
                        </div>

                        <div class="flex items-center gap-4">
                            <button class="px-4 py-2 rounded-full text-white bg-emerald-500 shadow" aria-pressed="true">
                                <span class="inline-block mr-2">●</span> Conectado
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Stats cards -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div v-for="item in stats" :key="item.id" class="rounded-lg p-4 shadow-md bg-slate-800 text-white">
                        <div class="flex items-center justify-between">
                            <div>
                                <div class="text-xs font-semibold text-slate-300">{{ item.title }}</div>
                                <div class="text-2xl font-bold mt-2">{{ item.value }}</div>
                                <div class="text-xs text-slate-400 mt-1">{{ item.description }}</div>
                            </div>
                            <div class="h-12 w-12 rounded-lg flex items-center justify-center" :class="item.bg">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Status box + logout -->
                <div class="mb-6 rounded-lg p-4 bg-slate-800 text-white shadow">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-4">
                            <div class="px-4 py-2 bg-emerald-600 rounded text-sm font-semibold flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 00-1.414 0L9 11.586 6.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l7-7a1 1 0 000-1.414z" clip-rule="evenodd"/></svg>
                                Bot autenticado y funcionando correctamente
                            </div>
                            <div class="text-slate-300">Sistema operativo y listo para recibir peticiones API</div>
                        </div>

                        <div>
                            <button class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded">Cerrar Sesión</button>
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
                            <input v-model="phone" type="text" placeholder="Incluye código de país sin +" class="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white" />
                        </div>

                        <div>
                            <label class="block text-sm text-slate-300 mb-1">Mensaje</label>
                            <textarea v-model="message" rows="4" class="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white" placeholder="Escribe tu mensaje..." />
                        </div>

                        <div class="flex items-center gap-3">
                            <button type="submit" class="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded">Enviar</button>
                            <button type="button" class="bg-slate-700 text-white px-4 py-2 rounded">Limpiar</button>
                        </div>
                    </form>
                </div>

            </div>
        </div>
    </TenantLayout>
</template>
