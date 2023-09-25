<script setup lang="ts">
import { onMounted, computed, onBeforeUnmount, ref } from 'vue'
import { usePokemonStore } from '@/store/pokemon'
import { useRoute, useRouter } from 'vue-router'
import TypeBadge from '@/components/Pokedex/TypeBadge.vue'
import EvolutionChain from '@/components/Pokemon/EvolutionChain.vue'
import { padNumber } from '@/utils/string'
import { onKeyDown } from '@vueuse/core'
import DropDown from '@/components/DropDown.vue'
import { appColor, pokemonColors } from '@/utils/colors'
import CardPerspective from '@/components/CardPerspective.vue'

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
  // document.body.classList.add('overflow-y-hidden')
  await pokemonStore.getInfo(route.params.id as string)
  form.value = pokemon.value?.number || 0
  const themeMeta = document.querySelector('meta[name="theme-color"]')
  if (themeMeta) {
    themeMeta.setAttribute('content', pokemonColors[pokemon.value?.color || ''])
  }
})

function closeDetail() {
  router.back()
}

onKeyDown('Escape', closeDetail)
// onClickOutside(container, closeDetail)

onBeforeUnmount(() => {
  pokemonStore.clearInfo()
  // document.body.classList.remove('overflow-y-hidden')
  const themeMeta = document.querySelector('meta[name="theme-color"]')
  if (themeMeta) {
    themeMeta.setAttribute('content', appColor)
  }
})
</script>

<template>
  <div>
    <div v-if="!!pokemon" class="">
      <!-- <Transition name="fade" appear>
        <div class="fixed inset-0 bg-white/50 backdrop-blur-md"></div>
      </Transition> -->
      <div
        class="detail-container-wrapper flex h-full w-full items-end justify-center p-4 md:items-center"
      >
        <Transition name="fade-up" appear>
          <div
            v-if="!!pokemon"
            ref="container"
            class="detail-container container relative isolate mx-auto max-h-full max-w-full"
          >
            <div
              class="relative flex flex-col gap-4 lg:flex-row lg:items-center"
            >
              <div class="mx-auto w-full max-w-xs">
                <CardPerspective
                  class="group drop-shadow-lg"
                  :rotation="{ x: 8, y: 24, z: 0 }"
                  reset-on-hover
                >
                  <div
                    class="relative overflow-hidden rounded-2xl bg-slate-900"
                  >
                    <div
                      class="absolute inset-0 flex flex-nowrap justify-center"
                    >
                      <div
                        v-for="(type, index) in info?.types"
                        :key="type.id || index"
                        :class="[
                          'h-96 w-96 shrink-0 rounded-full blur-2xl',
                          `bg-type-${type.name}`,
                        ]"
                        :style="{
                          transform: `translateY(${
                            (index - 1 / 2) * 196
                          }px) translateX(${
                            (index + 1) * 64 * (index % 2 === 0 ? 1 : -1)
                          }px)`,
                        }"
                      ></div>
                    </div>
                    <div
                      class="rounded-2xl bg-slate-900/50 px-4 py-8 shadow-xl backdrop-blur-xl duration-300"
                    >
                      <div
                        class="relative isolate mx-auto w-full md:w-72"
                        style="transform: translateZ(40px)"
                      >
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
                      <TypeBadge
                        class="mt-1 justify-center"
                        :types="info?.types || []"
                      />
                      <div class="flex flex-1 flex-col">
                        <div
                          class="relative mt-4 bg-slate-200 text-center shadow-solid-sm"
                        >
                          <h1 class="font-pixel text-lg">
                            <span class="text-sm">No</span
                            >{{ padNumber(pokemon?.number || 0) }}
                            <span class="uppercase">{{ info?.name }}</span>
                          </h1>
                          <p class="font-pixel">{{ pokemon.genus }}</p>
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
                          class="order-first mt-2"
                        />
                      </div>
                    </div>
                  </div>
                </CardPerspective>
              </div>

              <div
                class="relative flex-1 px-4 pt-4 pb-8 md:max-h-full lg:overflow-auto"
                :class="`bg-poke-${pokemon.color}/30`"
              >
                <!-- <div
                  class="pattern-carbon absolute inset-0 opacity-20 bg-blend-overlay"
                ></div> -->
                <div
                  class="rounded-md border-2 border-dashed p-2 font-pixel md:text-lg"
                  :class="`border-poke-${pokemon.color}/70 bg-poke-${pokemon.color}/20`"
                >
                  {{ pokemon.description || 'No info yet' }}
                </div>
                <div class="max-w-sm">
                  <EvolutionChain
                    class="mt-2"
                    :evolution="pokemon.evolutionChain"
                  />
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </div>
</template>

<style scoped>
.detail-container-wrapper {
  perspective: 400px;
}

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
  transform: translateY(100%) rotateX(-30deg);
}
</style>
