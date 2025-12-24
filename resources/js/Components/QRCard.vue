<script setup>
defineProps({
  qrGenerating: { type: Boolean, default: true }
})
</script>

<template>
  <div class="bg-gray-800 rounded-xl p-6 text-center text-white mt-6">
    <div class="text-lg font-bold mb-2">🔒 Autenticación Requerida</div>
    <div class="text-sm opacity-70 mb-4">
      Escanea el código QR con WhatsApp:
      WhatsApp › Configuración › Dispositivos vinculados › Vincular dispositivo
    </div>

    <div v-if="qrGenerating" class="flex justify-center my-4">
      <div class="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
    </div>
    <div v-else>
      <!-- Aquí va tu QR real -->
      <img src="/path/to/qr.png" alt="QR" class="mx-auto"/>
    </div>

    <button class="mt-4 bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded text-white">
      Actualizar código
    </button>
  </div>
</template>
