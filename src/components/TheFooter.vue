<script setup lang="ts">
import { computed } from 'vue'

const year = computed(() => new Date().getFullYear())
</script>

<template>
  <footer class="mx-auto max-w-sm py-8 text-center text-xs text-slate-900">
    <p class="text-content2">
      Designed & Built with ❤️ by
      <a href="https://latamaosadi.com">Robert Latamaosadi</a>
    </p>
    <p class="text-content2 mt-1">&copy; Copyright {{ year }}</p>
  </footer>
</template>
