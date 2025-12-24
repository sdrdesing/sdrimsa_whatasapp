<script setup>
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue';
import { Head } from '@inertiajs/vue3';
</script>

<template>
    <Head title="Dashboard" />

    <AuthenticatedLayout>
        <!-- <template #header>
            <h2 class="font-semibold text-xl text-gray-800 leading-tight">Dashboard fsdfgfdf</h2>
        </template> -->

        <div class="py-12">
            <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

                    <!-- Card: Tiempo activo -->
                    <div class="relative overflow-hidden rounded-lg p-6 shadow-md bg-gradient-to-br from-slate-800 to-slate-900 text-white">
                        <div class="flex items-start justify-between">
                            <div>
                                <div class="text-xs text-slate-300 uppercase">Tiempo activo</div>
                                <div class="mt-2 text-2xl font-semibold">20h 54m</div>
                                <div class="mt-1 text-sm text-slate-400">Desde el inicio del servicio</div>
                            </div>
                            <div class="flex flex-col items-end space-y-2">
                                <div class="h-10 w-10 rounded-md flex items-center justify-center bg-blue-500">
                                    <!-- clock svg -->
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l2 2" />
                                        <circle cx="12" cy="12" r="9" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" />
                                    </svg>
                                </div>
                                <button class="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-slate-200 hover:bg-white/20" aria-label="info">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 110-16 8 8 0 010 16z"/>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Card: Mensajes enviados -->
                    <div class="relative overflow-hidden rounded-lg p-6 shadow-md bg-gradient-to-br from-slate-800 to-slate-900 text-white">
                        <div class="flex items-start justify-between">
                            <div>
                                <div class="text-xs text-slate-300 uppercase">Mensajes enviados</div>
                                <div class="mt-2 text-2xl font-semibold">0</div>
                                <div class="mt-1 text-sm text-slate-400">Total de mensajes procesados</div>
                            </div>
                            <div class="flex flex-col items-end space-y-2">
                                <div class="h-10 w-10 rounded-md flex items-center justify-center bg-green-500">
                                    <!-- send svg -->
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M22 2L11 13" />
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M22 2l-7 20  -4-9-9-4 20-7z" />
                                    </svg>
                                </div>
                                <button class="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-slate-200 hover:bg-white/20" aria-label="info">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 110-16 8 8 0 010 16z"/>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Card: Mensajes recibidos -->
                    <div class="relative overflow-hidden rounded-lg p-6 shadow-md bg-gradient-to-br from-slate-800 to-slate-900 text-white">
                        <div class="flex items-start justify-between">
                            <div>
                                <div class="text-xs text-slate-300 uppercase">Mensajes recibidos</div>
                                <div class="mt-2 text-2xl font-semibold">22</div>
                                <div class="mt-1 text-sm text-slate-400">Total de mensajes entrantes</div>
                            </div>
                            <div class="flex flex-col items-end space-y-2">
                                <div class="h-10 w-10 rounded-md flex items-center justify-center bg-purple-600">
                                    <!-- inbox svg -->
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V7a2 2 0 00-2-2H6a2 2 0 00-2 2v6" />
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 13l3 3 7-7" />
                                    </svg>
                                </div>
                                <button class="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-slate-200 hover:bg-white/20" aria-label="info">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 110-16 8 8 0 010 16z"/>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Card: Estado del sistema -->
                    <div class="relative overflow-hidden rounded-lg p-6 shadow-md bg-gradient-to-br from-slate-800 to-slate-900 text-white">
                        <div class="flex items-start justify-between">
                            <div>
                                <div class="text-xs text-slate-300 uppercase">Estado del sistema</div>
                                <div class="mt-2 text-2xl font-semibold">100%</div>
                                <div class="mt-1 text-sm text-slate-400">Operatividad del bot</div>
                            </div>
                            <div class="flex flex-col items-end space-y-2">
                                <div class="h-10 w-10 rounded-md flex items-center justify-center bg-slate-700">
                                    <!-- shield svg -->
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 2l9 4-9 4-9-4 9-4z" />
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v10" />
                                    </svg>
                                </div>
                                <button class="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-slate-200 hover:bg-white/20" aria-label="info">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 110-16 8 8 0 010 16z"/>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    </AuthenticatedLayout>
</template>
