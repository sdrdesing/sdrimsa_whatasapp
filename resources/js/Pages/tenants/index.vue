<script setup>
import { ref, reactive, watch } from 'vue';
import { router, usePage, Head } from '@inertiajs/vue3';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue';
import PrimaryButton from '@/Components/PrimaryButton.vue';
import DangerButton from '@/Components/DangerButton.vue';
import TenantForm from '@/Pages/tenants/form.vue';

const showModal = ref(false);

const page = usePage();

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

        <!-- Componente de formulario como modal -->
        <TenantForm :show="showModal" @close="showModal = false" />
        
    </AuthenticatedLayout>
</template>