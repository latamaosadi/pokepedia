<script setup lang="ts">
import { onBeforeMount } from 'vue'
import * as Pokedex from './components/Pokedex'
import { useBaseStore } from './store/base'

const baseStore = useBaseStore()

onBeforeMount(async () => {
  await Promise.all([baseStore.getTypeList(), baseStore.getColorList()])
})
</script>

<template>
  <div class="overflow-x-hidden bg-slate-100">
    <div class="mx-auto min-h-screen max-w-lg p-2 antialiased">
      <Pokedex.List />
    </div>
  </div>
</template>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
