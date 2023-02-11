<script setup lang="ts">
import { IType } from '@/types/pokemon'
import { titleCase } from '@/utils/string'

defineProps<{
  type: IType
}>()
</script>

<template>
  <li class="badge" :class="[`bg-type-${type.name}`]">
    <span class="drop-shadow-solid">{{ titleCase(type.name) }}</span>
  </li>
</template>

<style scoped>
.badge {
  @apply flex h-4 items-center justify-center rounded px-1 font-pixel text-xs font-bold uppercase leading-none text-white shadow-3d sm:h-5 sm:text-sm;
  /* @apply rounded px-1 font-pixel text-sm uppercase text-white shadow-3d; */
}
</style>
