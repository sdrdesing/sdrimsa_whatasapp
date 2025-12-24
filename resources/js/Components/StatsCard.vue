<script setup>
defineProps({
  title: String,
  value: [String, Number],
  description: String,
  color: String = 'bg-blue-500'
})
</script>

<template>
  <div :class="`p-4 rounded-xl shadow-md ${color} text-white w-full`">
    <div class="text-xs font-semibold uppercase">{{ title }}</div>
    <div class="text-2xl font-bold mt-2">{{ value }}</div>
    <div class="text-sm mt-1 opacity-75">{{ description }}</div>
  </div>
</template>
