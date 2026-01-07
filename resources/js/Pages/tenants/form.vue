<script setup>
import { reactive } from 'vue';
import { router } from '@inertiajs/vue3';
import Modal from '@/Components/Modal.vue';
import InputLabel from '@/Components/InputLabel.vue';
import TextInput from '@/Components/TextInput.vue';

const props = defineProps({
    show: Boolean,
});

const emit = defineEmits(['close']);

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
            emit('close');
            form.name = '';
            form.errors = {};
        },
        onError: (errors) => {
            form.errors = errors || {};
        },
    });
};

const closeModal = () => {
    form.name = '';
    form.errors = {};
    emit('close');
};
</script>

<template>
    <Modal :show="show" @close="closeModal">
        <div class="p-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Crear Tenant</h3>

            <form @submit.prevent="submitForm" class="space-y-4">
                <div>
                    <InputLabel for="name" value="Subdominio" class="mb-1" />
                    <TextInput 
                        id="name"
                        v-model="form.name" 
                        placeholder="Ej: Mi Empresa" 
                        :error="form.errors.name"
                    />
                    <span v-if="form.errors.name" class="text-red-500 text-sm">{{ form.errors.name }}</span>
                </div>

                <div class="flex justify-end mt-6 space-x-2">
                    <button 
                        @click="closeModal" 
                        type="button"
                        class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">
                        Cerrar
                    </button>
                    <button 
                        type="submit"
                        class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                        Crear
                    </button>
                </div>
            </form>
        </div>
    </Modal>
</template>