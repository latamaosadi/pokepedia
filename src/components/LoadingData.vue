<script setup lang="ts">
import { useIntervalFn } from '@vueuse/shared'
import { ref } from 'vue'
import SlowPoke from './SlowPoke.vue'
const counter = ref(1)
const loadingText = ref('')

useIntervalFn(() => {
  counter.value = counter.value > 4 ? 1 : counter.value + 1
  loadingText.value = '.'.repeat(counter.value)
}, 300)
</script>

<template>
  <div class="flex flex-col items-center justify-center">
    <div class="w-40">
      <SlowPoke class="animate-wiggle" />
    </div>
    <p class="mt-6 font-pixel text-lg font-bold">Loading{{ loadingText }}</p>
  </div>
</template>
