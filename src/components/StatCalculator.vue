<script setup lang="ts">
import type { IStat } from '@/types/pokemon'
import { isModern, limits, NATURES, statAt } from '@/utils/stats'
import { computed, reactive, ref } from 'vue'

const { stats, generation } = defineProps<{
  stats: IStat[]
  generation?: number
}>()

// Gen 3+ caps a Pokémon's EVs at 510 in total.
const MAX_TOTAL_EVS = 510

const max = limits(generation)
const level = ref(50)
const nature = ref('Hardy')
const ivs = reactive(Object.fromEntries(stats.map((stat) => [stat.name, max.iv])))
const evs = reactive(Object.fromEntries(stats.map((stat) => [stat.name, 0])))

const clamp = (value: number, highest: number) => Math.min(Math.max(Math.round(value) || 0, 0), highest)
const totalEvs = computed(() => Object.values(evs).reduce((sum, ev) => sum + ev, 0))
const rows = computed(() =>
  stats.map((stat) => ({
    ...stat,
    total: statAt(
      {
        name: stat.name,
        base: stat.value,
        iv: clamp(ivs[stat.name], max.iv),
        ev: clamp(evs[stat.name], max.ev),
      },
      clamp(level.value, 100) || 1,
      nature.value,
      generation,
    ),
  })),
)
const natureEffect = (name: string) => {
  const { up, down } = NATURES.find((n) => n.name === name)!
  return up === down ? 'neutral' : `+${up} −${down}`
}
const NUMBER_INPUT =
  'w-full min-w-0 rounded-md bg-white px-1.5 py-1 text-right shadow-sm outline-none focus-visible:ring-4 focus-visible:ring-blue-400 dark:bg-neutral-800'
</script>

<template>
  <div class="max-w-md space-y-3">
    <div class="flex flex-wrap gap-3">
      <label class="w-20">
        <span class="block text-sm font-bold">Level</span>
        <input
          v-model.number="level"
          type="number"
          min="1"
          max="100"
          :class="NUMBER_INPUT"
          @change="level = clamp(level, 100) || 1"
        />
      </label>
      <label v-if="isModern(generation)" class="min-w-0 flex-1">
        <span class="block text-sm font-bold">Nature</span>
        <select
          v-model="nature"
          class="select-chevron w-full rounded-md bg-white py-1 pr-10 pl-2 shadow-sm outline-none focus-visible:ring-4 focus-visible:ring-blue-400 dark:bg-neutral-800"
        >
          <option v-for="n in NATURES" :key="n.name" :value="n.name">
            {{ n.name }} ({{ natureEffect(n.name) }})
          </option>
        </select>
      </label>
    </div>

    <table class="w-full text-left">
      <thead class="text-xs text-neutral-500 uppercase dark:text-neutral-400">
        <tr>
          <th scope="col" class="py-1 font-bold">Stat</th>
          <th scope="col" class="w-12 py-1 text-right font-bold">Base</th>
          <th scope="col" class="w-16 py-1 pl-2 text-right font-bold">{{ isModern(generation) ? 'IV' : 'DV' }}</th>
          <th scope="col" class="w-20 py-1 pl-2 text-right font-bold">
            {{ isModern(generation) ? 'EV' : 'Stat exp.' }}
          </th>
          <th scope="col" class="w-14 py-1 text-right font-bold whitespace-nowrap">Lv. {{ clamp(level, 100) || 1 }}</th>
        </tr>
      </thead>
      <tbody class="font-pixel text-lg">
        <tr v-for="row in rows" :key="row.name">
          <th scope="row" class="py-0.5 font-normal whitespace-nowrap">{{ row.name }}</th>
          <td class="text-right">{{ row.value }}</td>
          <td class="py-0.5 pl-2">
            <input
              v-model.number="ivs[row.name]"
              type="number"
              min="0"
              :max="max.iv"
              :aria-label="`${row.name} ${isModern(generation) ? 'IV' : 'DV'}`"
              :class="NUMBER_INPUT"
              @change="ivs[row.name] = clamp(ivs[row.name], max.iv)"
            />
          </td>
          <td class="py-0.5 pl-2">
            <input
              v-model.number="evs[row.name]"
              type="number"
              min="0"
              :max="max.ev"
              :step="isModern(generation) ? 4 : 1"
              :aria-label="`${row.name} ${isModern(generation) ? 'EV' : 'stat experience'}`"
              :class="NUMBER_INPUT"
              @change="evs[row.name] = clamp(evs[row.name], max.ev)"
            />
          </td>
          <td class="text-right font-bold">{{ row.total }}</td>
        </tr>
      </tbody>
    </table>
    <p
      v-if="isModern(generation)"
      :class="['text-sm', totalEvs > MAX_TOTAL_EVS ? 'font-bold text-red-600 dark:text-red-400' : 'text-neutral-500 dark:text-neutral-400']"
    >
      {{ totalEvs }} / {{ MAX_TOTAL_EVS }} EVs
    </p>
  </div>
</template>
