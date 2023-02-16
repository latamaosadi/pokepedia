<script setup lang="ts"></script>

<template>
  <div class="bg-white bg-gradient-to-br from-rose-400 to-indigo-400">
    <div class="pattern-carbon fixed inset-0 opacity-20"></div>
    <div
      class="container relative mx-auto min-h-screen bg-white/20 pb-20 antialiased lg:px-8"
    >
      <router-view />
    </div>
  </div>
</template>
