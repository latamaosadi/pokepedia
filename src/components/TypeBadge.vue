<script setup lang="ts">
import type { IType } from '@/types/pokemon'
import { titleCase } from '@/utils/string'

defineProps<{
  types: IType[]
}>()
</script>

<template>
  <ul class="flex gap-0.5">
    <!-- <div class="absolute inset-0 shadow-3d"></div> -->
    <li
      v-for="(type, index) in types"
      :key="index"
      :class="[
        'font-pixel shadow-3d flex h-4 items-center justify-center rounded border px-1 text-xs leading-none font-bold text-white uppercase sm:h-5 sm:text-sm',
      ]"
      :style="`background-color: var(--color-type-${type.name}); border-color: var(--color-type-${type.name})`"
    >
      <span class="drop-shadow-solid">{{ titleCase(type.name) }}</span>
    </li>
  </ul>
</template>
