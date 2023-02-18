<script setup lang="ts">
import { defineAsyncComponent } from 'vue'

const props = defineProps<{
  name: string
}>()

const icon = defineAsyncComponent(
  () => import(`../assets/icons/${props.name}.svg`),
)
</script>

<template>
  <component :is="icon" class="icon" />
</template>

<style>
.icon {
  @apply h-5 w-5 fill-current;
}
</style>
