<script setup lang="ts">
import { IType } from '@/types/pokemon'
import { titleCase } from '@/utils/string'

defineProps<{
  types: IType[]
}>()
</script>

<template>
  <ul class="badge-container">
    <!-- <div class="absolute inset-0 shadow-3d"></div> -->
    <li
      v-for="(type, index) in types"
      :key="index"
      class="badge"
      :class="[`bg-type-${type.name} border-type-${type.name}`]"
    >
      <span class="drop-shadow-solid">{{ titleCase(type.name) }}</span>
    </li>
  </ul>
</template>

<style scoped>
.badge-container {
  @apply flex gap-0.5;
}
.badge {
  @apply flex h-4 items-center justify-center rounded border px-1 font-pixel text-xs font-bold uppercase leading-none text-white shadow-3d sm:h-5 sm:text-sm;
  /* @apply rounded px-1 font-pixel text-sm uppercase text-white shadow-3d; */
}
/* .badge:only-child {
  @apply rounded-r;
}
.badge + .badge {
  @apply rounded-l-none rounded-r border-l-0;
} */
</style>
