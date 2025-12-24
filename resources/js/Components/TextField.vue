<script setup>
defineProps({
    modelValue: {
        type: [String, Number],
        default: '',
    },
    label: {
        type: String,
        default: '',
    },
    placeholder: {
        type: String,
        default: '',
    },
    type: {
        type: String,
        default: 'text',
    },
    error: {
        type: String,
        default: '',
    },
})
defineEmits(['update:modelValue'])
</script>

<template>
    <div class="w-full">
        <!-- Label -->
        <label v-if="label" class="block text-sm font-medium text-gray-700 mb-1">
            {{ label }}
        </label>

        <!-- Input -->
        <input
            :type="type"
            :placeholder="placeholder"
            :value="modelValue"
            @input="$emit('update:modelValue', $event.target.value)"
            class="w-full rounded-xl border px-4 py-3 text-base
                   focus:outline-none focus:ring-2 focus:ring-indigo-500
                   transition"
            :class="error
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300'"
        />

        <!-- Error -->
        <p v-if="error" class="mt-1 text-sm text-red-600">
            {{ error }}
        </p>
    </div>
</template>
