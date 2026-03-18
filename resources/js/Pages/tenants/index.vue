<script setup>
import { ref, reactive, watch } from 'vue';
import { router, usePage, Head } from '@inertiajs/vue3';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue';
import { useForm } from '@inertiajs/vue3';
import PrimaryButton from '@/Components/PrimaryButton.vue';
import DangerButton from '@/Components/DangerButton.vue';
import SecondaryButton from '@/Components/SecondaryButton.vue';
import InputError from '@/Components/InputError.vue';
import InputLabel from '@/Components/InputLabel.vue';
import TextInput from '@/Components/TextInput.vue';
import Modal from '@/Components/Modal.vue';
import TenantForm from '@/Pages/tenants/form.vue';

const showModal = ref(false);
const showPasswordModal = ref(false);
const selectedTenant = ref(null);

const page = usePage();

const passwordForm = useForm({
    password: '',
    password_confirmation: '',
});

const openPasswordModal = (tenant) => {
    selectedTenant.value = tenant;
    showPasswordModal.value = true;
};

const closePasswordModal = () => {
    showPasswordModal.value = false;
    passwordForm.reset();
    passwordForm.clearErrors();
    selectedTenant.value = null;
};

const updatePassword = () => {
    passwordForm.put(route('system.tenants.password', selectedTenant.value.id), {
        preserveScroll: true,
        onSuccess: () => closePasswordModal(),
        onError: () => {
            if (passwordForm.errors.password) {
                passwordForm.reset('password', 'password_confirmation');
            }
        },
    });
};

const deleteTenant = (id) => {
    router.delete(`/tenants/${id}`);
};

</script>


<template>

    <Head title="Tenants" />
    <AuthenticatedLayout>
        <div class="py-10 min-h-screen bg-[#071626] relative">
            <!-- Decorative top background -->
            <div class="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-[#0a233d] to-transparent pointer-events-none -z-10"></div>
            
            <div class="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-8">
                
                <!-- Header -->
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 sm:px-0">
                    <div>
                        <h1 class="text-3xl font-extrabold text-white tracking-tight drop-shadow-sm">Administración de Tenants</h1>
                        <p class="text-sm text-slate-400 mt-1">Gestión integral de clientes y subdominios conectados</p>
                    </div>
                    <div class="mt-4 sm:mt-0">
                        <button @click="showModal = true" class="group relative inline-flex items-center justify-center px-6 py-2.5 text-sm font-semibold text-white transition-all duration-200 bg-blue-600 border border-transparent rounded-full hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 focus:ring-offset-[#071626] shadow-[0_0_15px_rgba(37,99,235,0.4)] hover:shadow-[0_0_25px_rgba(37,99,235,0.6)] hover:-translate-y-0.5">
                            <svg class="w-5 h-5 mr-2 -ml-1 transition-transform group-hover:rotate-90" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                            </svg>
                            Crear Nuevo Tenant
                        </button>
                    </div>
                </div>

                <!-- Table Section -->
                <div class="px-4 sm:px-0">
                    <div class="bg-[#0e2a47] rounded-2xl shadow-xl border border-white/5 overflow-hidden">
                        
                        <!-- Table Head/Controls -->
                        <div class="px-6 py-5 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0a233d]/30">
                            <div>
                                <h2 class="text-lg font-bold text-white">Lista de Tenants Creados</h2>
                                <p class="text-sm text-slate-400">Total de plataformas activas en tu distribución.</p>
                            </div>
                        </div>

                        <!-- Table -->
                        <div class="overflow-x-auto">
                            <table class="w-full text-left whitespace-nowrap">
                                <thead>
                                    <tr class="bg-[#081e36] text-[10px] font-bold tracking-widest text-slate-400 uppercase border-b border-white/5">
                                        <th class="px-6 py-4">Tenant / Identificador</th>
                                        <th class="px-6 py-4">Dominio Activo</th>
                                        <th class="px-6 py-4">Cliente</th>
                                        <th class="px-6 py-4">RUC</th>
                                        <th class="px-6 py-4 text-center">Acciones y Seguridad</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-white/5 bg-[#0e2a47]">
                                    <tr v-for="tenant in $page.props.tenants" :key="tenant.id" class="hover:bg-white/[0.02] transition-colors duration-200 group">
                                        
                                        <!-- Tenant Name -->
                                        <td class="px-6 py-4">
                                            <div class="flex items-center gap-3">
                                                <div class="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-sm ring-1 ring-blue-500/30 group-hover:bg-blue-500 group-hover:text-white transition-all duration-300 shadow-inner">
                                                    {{ tenant.id.charAt(0).toUpperCase() }}
                                                </div>
                                                <div>
                                                    <span class="block font-semibold text-slate-200 text-sm tracking-tight">{{ tenant.id }}</span>
                                                    <span class="block text-xs text-slate-500 mt-0.5">ID Interno</span>
                                                </div>
                                            </div>
                                        </td>

                                        <!-- Domain -->
                                        <td class="px-6 py-4">
                                            <template v-if="tenant.domain || (tenant.domains && tenant.domains.length)">
                                                <a :href="(tenant.domain || (tenant.domains && tenant.domains.length ? tenant.domains[0].domain : '')) ? `http://${tenant.domain || tenant.domains[0].domain}` : '#'"
                                                    target="_blank" rel="noopener noreferrer"
                                                    class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm hover:bg-emerald-500 hover:text-white transition-all duration-300">
                                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                    </svg>
                                                    {{ tenant.domain ? tenant.domain : (tenant.domains && tenant.domains.length ? tenant.domains[0].domain : '') }}
                                                </a>
                                            </template>
                                            <span v-else class="text-xs text-slate-500 italic">Sin dominio asignado</span>
                                        </td>

                                        <!-- Cliente -->
                                        <td class="px-6 py-4 text-sm text-slate-300">
                                            - <!-- Espacio para cliente -->
                                        </td>

                                        <!-- RUC -->
                                        <td class="px-6 py-4 text-sm text-slate-300 font-mono">
                                            - <!-- Espacio para RUC -->
                                        </td>

                                        <!-- Actions -->
                                        <td class="px-6 py-4">
                                            <div class="flex items-center justify-center gap-2">
                                                <button @click="openPasswordModal(tenant)" class="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-700/50 hover:bg-blue-600 text-slate-200 text-xs font-semibold rounded-lg border border-white/10 hover:border-blue-500 transition-all shadow-sm">
                                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                                                    Clave
                                                </button>
                                                <button @click="deleteTenant(tenant.id)" class="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-600 text-rose-400 hover:text-white text-xs font-semibold rounded-lg border border-rose-500/20 hover:border-rose-500 transition-all shadow-sm">
                                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                    Eliminar
                                                </button>
                                            </div>
                                        </td>
                                    </tr>

                                    <tr v-if="!$page.props.tenants || $page.props.tenants.length === 0">
                                        <td colspan="5" class="px-6 py-16 text-center">
                                            <div class="flex flex-col items-center justify-center space-y-3">
                                                <div class="h-16 w-16 bg-[#081e36] rounded-full flex items-center justify-center text-slate-500 mb-2 border border-white/5 box-shadow-inner">
                                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                                    </svg>
                                                </div>
                                                <h3 class="text-sm font-bold text-slate-300">No hay Tenants</h3>
                                                <p class="text-sm text-slate-500">Comienza creando tu primer cliente.</p>
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

        <TenantForm :show="showModal" @close="showModal = false" />

        <Modal :show="showPasswordModal" @close="closePasswordModal">
            <div class="p-6 bg-[#0e2a47] border border-white/10 rounded-lg">
                <h2 class="text-lg font-bold text-white">
                    Cambiar Contraseña para <span class="text-blue-400">{{ selectedTenant?.id }}</span>
                </h2>

                <p class="mt-2 text-sm text-slate-400">
                    Ingresa la nueva contraseña. Esta será utilizada por el usuario administrador <span class="text-emerald-400 font-mono">(admin@gmail.com)</span> del tenant.
                </p>

                <div class="mt-6">
                    <InputLabel for="password" value="Nueva Contraseña" class="text-slate-300 mb-1" />
                    <TextInput
                        id="password"
                        ref="passwordInput"
                        v-model="passwordForm.password"
                        type="password"
                        class="mt-1 block w-full bg-[#081e36] border-slate-700 text-white rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Contraseña"
                        @keyup.enter="updatePassword"
                    />
                    <InputError :message="passwordForm.errors.password" class="mt-2" />
                </div>

                <div class="mt-4">
                    <InputLabel for="password_confirmation" value="Confirmar Contraseña" class="text-slate-300 mb-1" />
                    <TextInput
                        id="password_confirmation"
                        v-model="passwordForm.password_confirmation"
                        type="password"
                        class="mt-1 block w-full bg-[#081e36] border-slate-700 text-white rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Confirmar Contraseña"
                        @keyup.enter="updatePassword"
                    />
                    <InputError :message="passwordForm.errors.password_confirmation" class="mt-2" />
                </div>

                <div class="mt-8 flex justify-end gap-3">
                    <button type="button" @click="closePasswordModal" class="px-4 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-lg border border-white/10 transition-colors">
                        Cancelar
                    </button>

                    <button @click="updatePassword" :disabled="passwordForm.processing" class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-colors disabled:opacity-50">
                        Generar Clave
                    </button>
                </div>
            </div>
        </Modal>
        
    </AuthenticatedLayout>
</template>