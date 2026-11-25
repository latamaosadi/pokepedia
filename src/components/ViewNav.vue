<script setup lang="ts">
const views = [
  { name: 'home', label: 'Grid' },
  { name: 'dex', label: 'Pokédex' },
  { name: 'team', label: 'Team' },
]
</script>

<template>
  <nav
    aria-label="Views"
    class="flex shrink-0 rounded-lg bg-white p-1 text-sm font-bold shadow-sm dark:bg-neutral-800"
  >
    <RouterLink
      v-for="view in views"
      :key="view.name"
      :to="{ name: view.name }"
      class="rounded-md px-3 py-1 text-neutral-600 outline-none hover:text-neutral-900 focus-visible:ring-4 focus-visible:ring-blue-400 aria-[current=page]:bg-neutral-800 aria-[current=page]:text-white dark:text-neutral-300 dark:hover:text-white dark:aria-[current=page]:bg-neutral-100 dark:aria-[current=page]:text-neutral-900"
    >
      {{ view.label }}
    </RouterLink>
  </nav>
</template>
