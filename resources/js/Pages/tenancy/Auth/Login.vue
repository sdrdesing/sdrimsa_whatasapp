<template>
    <div class="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div class="sm:mx-auto sm:w-full sm:max-w-md">
            <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
                Inicia sesión en tu cuenta
            </h2>
        </div>

        <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
            <div class="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
                <form @submit.prevent="handleLogin" class="space-y-6">
                    <div>
                        <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Correo electrónico
                        </label>
                        <input
                            v-model="form.email"
                            type="email"
                            id="email"
                            required
                            class="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                            placeholder="tu@email.com"
                        />
                        <div v-if="errors.email" class="mt-2 text-sm text-red-600">
                            {{ errors.email[0] }}
                        </div>
                    </div>

                    <div>
                        <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Contraseña
                        </label>
                        <input
                            v-model="form.password"
                            type="password"
                            id="password"
                            required
                            class="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                            placeholder="••••••••"
                        />
                        <div v-if="errors.password" class="mt-2 text-sm text-red-600">
                            {{ errors.password[0] }}
                        </div>
                    </div>

                    <div class="flex items-center justify-between">
                        <div class="flex items-center">
                            <input
                                v-model="form.remember"
                                type="checkbox"
                                id="remember"
                                class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded dark:border-gray-600"
                            />
                            <label for="remember" class="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                                Recuérdame
                            </label>
                        </div>

                        <div class="text-sm">
                            <a href="#" class="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400">
                                ¿Olvidaste tu contraseña?
                            </a>
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            :disabled="loading"
                            class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span v-if="!loading">Iniciar sesión</span>
                            <span v-else>Iniciando...</span>
                        </button>
                    </div>

                    <!-- Alerta de error general -->
                    <div v-if="errors.message || generalError" class="rounded-md bg-red-50 dark:bg-red-900 p-4 border border-red-200 dark:border-red-700">
                        <div class="flex">
                            <div class="flex-shrink-0">
                                <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                                </svg>
                            </div>
                            <div class="ml-3">
                                <p class="text-sm font-medium text-red-800 dark:text-red-100">
                                    {{ errors.message || generalError }}
                                </p>
                            </div>
                        </div>
                    </div>

                    <!-- Alerta de credenciales inválidas -->
                    <div v-if="errors.login_failed" class="rounded-md bg-yellow-50 dark:bg-yellow-900 p-4 border border-yellow-200 dark:border-yellow-700">
                        <div class="flex">
                            <div class="flex-shrink-0">
                                <svg class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                                </svg>
                            </div>
                            <div class="ml-3">
                                <p class="text-sm font-medium text-yellow-800 dark:text-yellow-100">
                                    El correo o contraseña son incorrectos. Intenta de nuevo.
                                </p>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import { useForm } from '@inertiajs/vue3';
import { router } from '@inertiajs/vue3';

const form = useForm({
    email: '',
    password: '',
    remember: false,
});

const loading = ref(false);
const errors = ref({});
const generalError = ref('');

// Validar formato del email
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Validar antes de enviar
const validateForm = () => {
    generalError.value = '';
    const newErrors = {};

    // Validar email
    if (!form.email.trim()) {
        newErrors.email = ['El correo electrónico es requerido'];
    } else if (!isValidEmail(form.email)) {
        newErrors.email = ['Por favor ingresa un correo electrónico válido'];
    }

    // Validar contraseña
    if (!form.password.trim()) {
        newErrors.password = ['La contraseña es requerida'];
    } else if (form.password.length < 6) {
        newErrors.password = ['La contraseña debe tener al menos 6 caracteres'];
    }

    errors.value = newErrors;
    return Object.keys(newErrors).length === 0;
};

const handleLogin = () => {
    // Validar formulario primero
    if (!validateForm()) {
        return;
    }

    loading.value = true;
    errors.value = {};
    generalError.value = '';

    router.post('/', form.data(), {
        onError: (serverErrors) => {
            loading.value = false;
            
            // Manejar errores del servidor
            if (serverErrors && Object.keys(serverErrors).length > 0) {
                errors.value = serverErrors;
                
                // Si hay error de credenciales
                if (serverErrors.email || serverErrors.password) {
                    generalError.value = 'Credenciales inválidas. Verifica tu correo y contraseña.';
                } else if (serverErrors.message) {
                    generalError.value = serverErrors.message;
                } else if (serverErrors.login_failed) {
                    generalError.value = 'El correo o contraseña son incorrectos. Intenta de nuevo.';
                }
            } else {
                generalError.value = 'Ocurrió un error al iniciar sesión. Intenta de nuevo.';
            }
        },
        onSuccess: () => {
            loading.value = false;
            generalError.value = '';
        },
    });
};
</script>
