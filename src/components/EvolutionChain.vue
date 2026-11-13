<script setup lang="ts">
import type { IEvolutionChain } from '@/types/pokemon'

defineProps<{
  evolution: IEvolutionChain
}>()
</script>

<template>
  <div class="font-pixel">
    <RouterLink
      :to="{ name: 'dex.detail', params: { id: evolution.name } }"
      class="inline-flex items-center gap-2 rounded-full pr-4 outline-none hover:bg-white/50 focus-visible:ring-4 focus-visible:ring-blue-400 aria-[current=page]:bg-white/70 dark:hover:bg-white/10 dark:aria-[current=page]:bg-white/20"
    >
      <img
        :src="evolution.sprite"
        alt=""
        width="96"
        height="96"
        loading="lazy"
        class="drop-shadow-solid-sm size-20 [image-rendering:pixelated]"
      />
      <span class="text-2xl">{{ evolution.formattedName }}</span>
    </RouterLink>
    <ul
      v-if="evolution.evolvesTo.length"
      class="ml-10 border-l-2 border-dashed border-neutral-400 pl-4"
    >
      <li v-for="next in evolution.evolvesTo" :key="next.name">
        <p class="flex items-center gap-1 pt-2 text-lg text-green-800 dark:text-green-300">
          <img v-if="next.itemSprite" :src="next.itemSprite" alt="" class="size-6" />
          {{ next.requirement }}
        </p>
        <EvolutionChain :evolution="next" />
      </li>
    </ul>
  </div>
</template>
