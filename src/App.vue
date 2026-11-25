<script setup lang="ts">
import { RouterView } from 'vue-router'
import UpdatePrompt from './components/UpdatePrompt.vue'
</script>

<template>
  <div class="mx-auto max-w-5xl overflow-x-clip p-6">
    <RouterView />
  </div>
  <UpdatePrompt />
</template>
