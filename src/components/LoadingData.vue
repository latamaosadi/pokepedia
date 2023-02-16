<script setup lang="ts">
import loading from '@/assets/images/loading.gif'
import { useIntervalFn } from '@vueuse/shared'
import { ref } from 'vue'
const counter = ref(1)
const loadingText = ref('')

useIntervalFn(() => {
  counter.value = counter.value > 4 ? 1 : counter.value + 1
  loadingText.value = '.'.repeat(counter.value)
}, 300)
</script>

<template>
  <div class="flex flex-col items-center justify-center">
    <div class="aspect-square w-32">
      <img
        :src="loading"
        alt=""
        class="pixelated h-full w-full object-contain object-center"
      />
    </div>
    <p class="font-pixel text-lg font-bold">Loading{{ loadingText }}</p>
  </div>
</template>
