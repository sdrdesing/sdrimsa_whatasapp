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

    <Head title="Dashboard" />
    <AuthenticatedLayout>
        <div class="py-12">
            <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
                <div class="flex items-center justify-between mb-4">
                    <h2 class="font-semibold text-xl text-gray-800 leading-tight">Lista de Tenants Creados</h2>
                    <!-- <button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Crear
                        Tenant</button> -->
                    <button @click="showModal = true"
                        class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                        Crear Tenant
                    </button>
                </div>

                <div class="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                    <div class="p-6 text-gray-900">
                        <table>
                            <thead>
                                <tr style="background-color: #073f68;" class="text-white">
                                    <th class="px-16 py-4">#</th>
                                    <th class="px-16 py-4">Logo</th>
                                    <th class="px-16 py-4">Dominio</th>
                                    <th class="px-16 py-4">Cliente</th>
                                    <th class="px-16 py-4">RUC</th>
                                    <th class="px-16 py-4">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="tenant in $page.props.tenants" :key="tenant.id">
                                    <td class="border px-4 py-2">{{ tenant.id }}</td>
                                    <td class="border px-4 py-2">{{ tenant.name }}</td>
                                    <td>
                                        <template v-if="tenant.domain || (tenant.domains && tenant.domains.length)">
                                            <a :href="(tenant.domain || (tenant.domains && tenant.domains.length ? tenant.domains[0].domain : '')) ? `http://${tenant.domain || tenant.domains[0].domain}` : '#'"
                                                target="_blank" rel="noopener noreferrer"
                                                class="text-blue-600 hover:underline">
                                                {{ tenant.domain ? tenant.domain : (tenant.domains &&
                                                    tenant.domains.length ? tenant.domains[0].domain : '') }}
                                            </a>
                                        </template>
                                    </td>
                                    <td class="border px-4 py-2"></td>
                                    <td class="border px-4 py-2"></td>

                                    <td class="border px-4 py-2 flex gap-2">
                                        <PrimaryButton @click="openPasswordModal(tenant)">Cambiar Clave</PrimaryButton>
                                        <DangerButton @click="deleteTenant(tenant.id)">Eliminar</DangerButton>
                                    </td>
                                </tr>
                            </tbody>
                        </table>

                    </div>
                </div>
            </div>

        </div>

        <!-- Componente de formulario como modal -->
        <TenantForm :show="showModal" @close="showModal = false" />

        <!-- Componente modal para cambiar contraseña de tenant -->
        <Modal :show="showPasswordModal" @close="closePasswordModal">
            <div class="p-6">
                <h2 class="text-lg font-medium text-gray-900">
                    Cambiar Contraseña para {{ selectedTenant?.id }}
                </h2>

                <p class="mt-1 text-sm text-gray-600">
                    Ingresa la nueva contraseña. Esta será utilizada por el usuario administrador (admin@gmail.com) del tenant.
                </p>

                <div class="mt-6">
                    <InputLabel for="password" value="Nueva Contraseña" />

                    <TextInput
                        id="password"
                        ref="passwordInput"
                        v-model="passwordForm.password"
                        type="password"
                        class="mt-1 block w-full"
                        placeholder="Contraseña"
                        @keyup.enter="updatePassword"
                    />

                    <InputError :message="passwordForm.errors.password" class="mt-2" />
                </div>

                <div class="mt-6">
                    <InputLabel for="password_confirmation" value="Confirmar Contraseña" />

                    <TextInput
                        id="password_confirmation"
                        v-model="passwordForm.password_confirmation"
                        type="password"
                        class="mt-1 block w-full"
                        placeholder="Confirmar Contraseña"
                        @keyup.enter="updatePassword"
                    />

                    <InputError :message="passwordForm.errors.password_confirmation" class="mt-2" />
                </div>

                <div class="mt-6 flex justify-end">
                    <SecondaryButton @click="closePasswordModal">
                        Cancelar
                    </SecondaryButton>

                    <PrimaryButton
                        class="ml-3"
                        :class="{ 'opacity-25': passwordForm.processing }"
                        :disabled="passwordForm.processing"
                        @click="updatePassword"
                    >
                        Guardar Contraseña
                    </PrimaryButton>
                </div>
            </div>
        </Modal>
        
    </AuthenticatedLayout>
</template>