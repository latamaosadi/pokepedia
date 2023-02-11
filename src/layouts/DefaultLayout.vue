<script setup lang="ts">
import { onBeforeMount } from 'vue'
import { useBaseStore } from '@/store/base'

const baseStore = useBaseStore()

onBeforeMount(async () => {
  await Promise.all([baseStore.getTypeList(), baseStore.getColorList()])
})
</script>

<template>
  <div class="overflow-x-hidden bg-slate-200">
    <div class="mx-auto min-h-screen max-w-xl antialiased">
      <router-view />
    </div>
  </div>
</template>
