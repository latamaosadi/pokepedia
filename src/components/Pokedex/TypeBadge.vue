<script setup lang="ts">
import { IType } from '@/types/pokemon'
import { titleCase } from '@/utils/string'

defineProps<{
  type: IType
}>()
</script>

<template>
  <li class="badge" :class="[`bg-type-${type.name}`]">
    {{ titleCase(type.name) }}
  </li>
</template>

<style scoped>
.badge {
  @apply text-shadow rounded px-1 font-pixel text-sm font-bold uppercase text-white shadow-3d;
}
</style>
