<script setup lang="ts">
import { onMounted, computed, onBeforeUnmount, ref } from 'vue'
import { usePokemonStore } from '@/store/pokemon'
import { useRoute, useRouter } from 'vue-router'
import TypeBadge from '@/components/Pokedex/TypeBadge.vue'
import EvolutionChain from '@/components/Pokemon/EvolutionChain.vue'
import { padNumber } from '@/utils/string'
import { onClickOutside } from '@vueuse/core'
import DropDown from '@/components/DropDown.vue'
import { appColor, pokemonColors } from '@/utils/colors'

const pokemonStore = usePokemonStore()
const route = useRoute()
const router = useRouter()
const container = ref(null)
const form = ref(0)

const pokemon = computed(() => pokemonStore.info)
const info = computed(() =>
  pokemon.value?.forms.find((pokemonForm) => pokemonForm.id === form.value),
)
const pokemonForms = computed(() => {
  return (pokemon.value?.forms || []).map((form) => ({
    label: form.name,
    value: form.id,
    image: form.artwork,
  }))
})

onMounted(async () => {
  document.body.classList.add('overflow-y-hidden')
  await pokemonStore.getInfo(parseInt(route.params.id as string))
  form.value = pokemon.value?.number || 0
  const themeMeta = document.querySelector('meta[name="theme-color"]')
  if (themeMeta) {
    themeMeta.setAttribute('content', pokemonColors[pokemon.value?.color || ''])
  }
})

onClickOutside(container, () => {
  router.push({ name: 'dex' })
})

onBeforeUnmount(() => {
  pokemonStore.clearInfo()
  document.body.classList.remove('overflow-y-hidden')
  const themeMeta = document.querySelector('meta[name="theme-color"]')
  if (themeMeta) {
    themeMeta.setAttribute('content', appColor)
  }
})
</script>

<template>
  <div>
    <div v-if="!!pokemon" class="fixed inset-0 z-10">
      <Transition name="fade" appear>
        <div class="fixed inset-0 bg-white/20 backdrop-blur"></div>
      </Transition>
      <div
        class="flex h-full w-full items-end justify-center md:items-center md:p-8"
      >
        <Transition name="fade-up" appear>
          <div
            v-if="!!pokemon"
            ref="container"
            class="relative mx-auto max-h-screen max-w-xl bg-white shadow-lg md:max-w-3xl"
          >
            <div
              class="pattern-carbon absolute inset-0 opacity-20 bg-blend-overlay"
            ></div>
            <div class="relative md:flex">
              <div
                class="flex gap-4 py-2 px-4 md:flex-col md:py-8"
                :class="`bg-poke-${pokemon.color}/60`"
              >
                <div>
                  <div class="mx-auto w-32 md:w-60">
                    <div
                      class="aspect-square drop-shadow-shine-md"
                      :class="`shadow-poke-${pokemon.color}`"
                    >
                      <img
                        :key="pokemon.number"
                        v-lazy="info?.artwork"
                        height="160"
                        width="160"
                        class="relative h-full w-full object-contain object-center"
                      />
                    </div>
                  </div>
                </div>
                <div class="flex flex-1 flex-col">
                  <div
                    class="relative md:mt-4 md:bg-slate-200 md:text-center md:shadow-solid-sm"
                  >
                    <h1 class="font-pixel text-lg">
                      <span class="text-sm">No</span
                      >{{ padNumber(pokemon?.number || 0) }}
                      <span class="uppercase">{{ info?.name }}</span>
                    </h1>
                    <p class="font-pixel">{{ pokemon.genus }}</p>
                    <TypeBadge
                      class="mt-1 md:justify-center"
                      :types="info?.types || []"
                    />
                    <div class="mt-1">
                      <ol class="font-pixel text-sm">
                        <li>Height: {{ info?.height }}</li>
                        <li>Weight: {{ info?.weight }}</li>
                      </ol>
                    </div>
                  </div>
                  <DropDown
                    v-if="pokemonForms.length > 1"
                    v-model="form"
                    :options="pokemonForms"
                    :color="pokemon.color"
                    class="mt-2 md:order-first"
                  />
                </div>
              </div>
              <div
                class="max-h-screen overflow-auto px-4 pt-4 pb-8"
                :class="`bg-poke-${pokemon.color}/30`"
              >
                <div
                  class="rounded-md border-2 border-dashed p-2 font-pixel md:text-lg"
                  :class="`border-poke-${pokemon.color}/70 bg-poke-${pokemon.color}/20`"
                >
                  {{ pokemon.description || 'No info yet' }}
                </div>
                <EvolutionChain
                  class="mt-2"
                  :evolution="pokemon.evolutionChain"
                />
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: all 300ms ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-up-enter-active,
.fade-up-leave-active {
  transition: all 300ms ease;
}
.fade-up-enter-from,
.fade-up-leave-to {
  opacity: 0;
  transform: translateY(100%);
}
</style>
