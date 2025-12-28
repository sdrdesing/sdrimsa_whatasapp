<template>
    <TenantLayout>
        <Head title="Home" />

        <div class="py-12">
            <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
                <div class="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                    <div class="p-6 text-gray-900 dark:text-gray-100">
                        <h2 class="text-2xl font-bold mb-4">Bienvenido al Tenant</h2>
                        <p class="mb-4">Esta es tu página de inicio del tenant.</p>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                            <!-- WhatsApp Card -->
                            <Link :href="route('whatsapp.tables')" class="block p-4 bg-green-50 dark:bg-green-900 rounded-lg hover:shadow-lg transition">
                                <div class="flex items-center">
                                    <div class="text-3xl mr-4">📱</div>
                                    <div>
                                        <h3 class="font-bold text-green-800 dark:text-green-200">WhatsApp</h3>
                                        <p class="text-sm text-green-600 dark:text-green-300">Gestiona tus tablas</p>
                                    </div>
                                </div>
                            </Link>

                            <!-- Status Card -->
                            <Link :href="route('whatsapp.status')" class="block p-4 bg-blue-50 dark:bg-blue-900 rounded-lg hover:shadow-lg transition">
                                <div class="flex items-center">
                                    <div class="text-3xl mr-4">✅</div>
                                    <div>
                                        <h3 class="font-bold text-blue-800 dark:text-blue-200">Estado</h3>
                                        <p class="text-sm text-blue-600 dark:text-blue-300">Ver estado del sistema</p>
                                    </div>
                                </div>
                            </Link>

                            <!-- QR Card -->
                            <Link :href="route('whatsapp.qr')" class="block p-4 bg-purple-50 dark:bg-purple-900 rounded-lg hover:shadow-lg transition">
                                <div class="flex items-center">
                                    <div class="text-3xl mr-4">📲</div>
                                    <div>
                                        <h3 class="font-bold text-purple-800 dark:text-purple-200">Código QR</h3>
                                        <p class="text-sm text-purple-600 dark:text-purple-300">Escanear QR</p>
                                    </div>
                                </div>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </TenantLayout>
</template>

<script setup>
import { Head, Link } from '@inertiajs/vue3';
import TenantLayout from '@/Layouts/TenantLayout.vue';
</script>
