<script setup lang="ts">
import TheFooter from '@/components/TheFooter.vue'
</script>

<template>
  <div class="app-container">
    <!-- <div class="pattern-carbon bg-opacity-20"> -->
    <div class="inner-container">
      <router-view />
    </div>
    <TheFooter class="relative" />
    <!-- </div> -->
  </div>
</template>

<style>
.bg-pattern {
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' height='100%25' width='100%25'%3E%3Cdefs%3E%3Cpattern id='doodad' width='62' height='62' viewBox='0 0 40 40' patternUnits='userSpaceOnUse' patternTransform='rotate(131)'%3E%3Crect width='100%25' height='100%25' fill='rgba(42, 67, 101,1)'/%3E%3Cpath d='M0 28a 8-8 0 0 0 8-8a 12-12 0 0 1 12-12v4a-8 8 0 0 0-8 8a-12 12 0 0 1-12 12zM0 68a 8-8 0 0 0 8-8a 12-12 0 0 1 12-12v4a-8 8 0 0 0-8 8a-12 12 0 0 1-12 12z' fill='rgba(26, 32, 44,1)'/%3E%3Cpath d='M20 28.5a 8.5-8.5 0 0 0 8.5-8.5a 11.5-11.5 0 0 1 11.5-11.5v3a-8.5 8.5 0 0 0-8.5 8.5a-11.5 11.5 0 0 1-11.5 11.5z' fill='rgba(236, 201, 75,1)'/%3E%3C/pattern%3E%3C/defs%3E%3Crect fill='url(%23doodad)' height='200%25' width='200%25'/%3E%3C/svg%3E ");
}
.app-container {
  @apply bg-white bg-fixed;
}
.inner-container {
  @apply container relative mx-auto min-h-screen pb-8 antialiased backdrop-blur-md md:px-8;
  /* @apply bg-gradient-to-br from-rose-400/70 to-indigo-400/70; */
  @apply bg-gradient-to-br from-rose-400/30 to-indigo-400/30;
  /* @apply bg-slate-100; */
}
</style>
