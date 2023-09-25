<script setup lang="ts">
import {
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
  ListboxLabel,
} from '@headlessui/vue'
import { computed } from 'vue'
import TheIcon from './TheIcon.vue'

const props = defineProps<{
  modelValue: string | number
  options: {
    label: string
    value: string | number | null
    image?: string
  }[]
  label?: string
  color?: string
}>()
const emit = defineEmits(['update:modelValue'])

const selectedLabel = computed(
  () =>
    props.options.find((option) => option.value === props.modelValue)?.label,
)
</script>

<template>
  <Listbox
    :model-value="modelValue"
    by="value"
    as="div"
    @update:model-value="(value) => emit('update:modelValue', value.value)"
  >
    <ListboxLabel v-if="label">{{ label }}:</ListboxLabel>
    <div
      class="relative rounded-sm bg-black text-white ring-1 ring-slate-100 ring-opacity-50"
    >
      <ListboxButton
        class="relative flex w-full cursor-default items-center justify-between rounded-sm px-2 text-left font-pixel shadow-inner focus:outline-none sm:text-sm md:py-1"
        :class="`bg-poke-${color}/50`"
      >
        <span class="block truncate">{{ selectedLabel }}</span>
        <TheIcon class="h-4 w-4" name="chevron-down" />
      </ListboxButton>
      <transition
        leave-active-class="transition duration-100 ease-in"
        enter-active-class="transition duration-100 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-50 translate-y-4"
        enter-from-class="opacity-50 translate-y-4"
        enter-to-class="opacity-100 translate-y-0"
      >
        <ListboxOptions
          class="absolute z-10 mt-1 max-h-32 w-full overflow-auto rounded-sm bg-black text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm"
        >
          <ListboxOption
            v-for="(option, index) in options"
            :key="index"
            v-slot="{ active, selected }"
            :value="option"
          >
            <li
              class="font-pixel"
              :class="[
                active && `bg-poke-${color}/80`,
                'relative flex cursor-default select-none items-center gap-2 py-1 px-2',
                `bg-poke-${color}/60`,
              ]"
            >
              <div class="aspect-square w-12 shrink-0 overflow-hidden rounded">
                <img
                  :key="option?.value || 0"
                  v-lazy="option.image"
                  height="20"
                  width="20"
                  class="h-16 w-16 object-cover object-center"
                />
              </div>
              <span
                :class="[
                  selected ? 'font-medium' : 'font-normal',
                  'block truncate text-lg',
                ]"
                >{{ option.label }}</span
              >
            </li>
          </ListboxOption>
        </ListboxOptions>
      </transition>
    </div>
  </Listbox>
</template>
