<script setup>
import { ref, reactive, watch } from 'vue';
import { router, usePage, Head } from '@inertiajs/vue3';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue';
import Modal from '@/Components/Modal.vue';
import InputLabel from '@/Components/InputLabel.vue';
import TextInput from '@/Components/TextInput.vue';
import PrimaryButton from '@/Components/PrimaryButton.vue';
import DangerButton from '@/Components/DangerButton.vue';

const showModal = ref(false);
const form = reactive({
    name: '',
    errors: {},
});

const submitForm = () => {
    form.errors = {};

    if (!form.name) {
        form.errors.name = 'El nombre del subdominio es obligatorio.';
        return;
    }
    const payload = {
        id: form.name,
        name: form.name,
    };
    router.post('/tenants', payload, {
        onSuccess: () => {
            showModal.value = false;
            form.name = '';
        },
        onError: (errors) => {
            form.errors = errors || {};
        },
    });
};

const deleteTenant = (id) => {
    router.delete(`/tenants/${id}`);
};

const page = usePage();

watch(() => page.props.flash && page.props.flash.success, (val) => {
    if (val) {
        showModal.value = false;
        form.name = '';
        form.errors = {};
    }
});

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

                                    <td class="border px-4 py-2">
                                        <!-- <PrimaryButton   >editar</PrimaryButton> -->

                                        <DangerButton @click="deleteTenant(tenant.id)">Eliminar</DangerButton>
                                    </td>
                                </tr>
                            </tbody>
                        </table>

                    </div>
                </div>
            </div>

        </div>

        <!-- Modal de ejemplo: reemplaza el contenido por tu formulario -->
        <Modal :show="showModal" @close="showModal = false">
            <div class="p-6">
                <h3 class="text-lg font-medium text-gray-900 mb-4">Crear Tenant</h3>

                <form @submit.prevent="submitForm" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <InputLabel for="name" value="Subdominio" class="mb-1" />
                                <TextInput v-model="form.name" placeholder="Ej: Mi Empresa" :error="form.errors.name">
                                </TextInput>
                            </div>
                        </div>
                        <div class="flex justify-end mt-4 space-x-2">
                            <button @click="showModal = false" type="button"
                                class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">Cerrar</button>
                            <button type="button" @click.prevent="submitForm"
                                class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Crear</button>
                        </div>
                    </div>
                </form>
            </div>
        </Modal>
    </AuthenticatedLayout>
</template>