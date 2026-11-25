<script setup lang="ts">
import type { IGame, ILearnedMove, IMoveRow } from '@/types/pokemon'
import { movesInGame, type MoveData } from '@/utils/game'
import { titleCase } from '@/utils/string'
import { computed, ref, shallowRef } from 'vue'
import TypeBadge from './TypeBadge.vue'

const { learnset, game } = defineProps<{
  learnset: ILearnedMove[]
  game: IGame
}>()

// Move stats for every game (~90 KB), so only loaded once a detail page needs them.
const data = shallowRef<MoveData>()
import('@/data/moves.json').then((module) => (data.value = module.default as unknown as MoveData))

const OTHER = 'other'
const METHODS = ['level-up', 'machine', 'egg', 'tutor']
const methodOf = (row: IMoveRow) => (METHODS.includes(row.method) ? row.method : OTHER)

const rows = computed(() => (data.value ? movesInGame(learnset, game, data.value) : []))

// Machines are TMs, plus HMs (Gens 1–6) or TRs (Sword / Shield), listed in that order.
const MACHINE_KINDS = ['TM', 'TR', 'HM']
const machineKind = (label?: string) => MACHINE_KINDS.indexOf(label?.slice(0, 2) ?? '')
const machineOrder = (label?: string) =>
  machineKind(label) < 0 ? Infinity : machineKind(label) * 1000 + Number(label!.slice(2))
const machineLabel = computed(
  () =>
    MACHINE_KINDS.filter((kind) => rows.value.some((row) => row.machine?.startsWith(kind))).join(
      ' & ',
    ) || 'TM',
)

const tabs = computed(() =>
  [
    { id: 'level-up', label: 'Level up' },
    { id: 'machine', label: machineLabel.value },
    { id: 'egg', label: 'Egg' },
    { id: 'tutor', label: 'Tutor' },
    { id: OTHER, label: 'Other' },
  ]
    .map((tab) => ({ ...tab, count: rows.value.filter((row) => methodOf(row) === tab.id).length }))
    .filter((tab) => tab.count),
)
const selected = ref('level-up')
const tab = computed(() => tabs.value.find((t) => t.id === selected.value) ?? tabs.value[0])

const shown = computed(() => {
  const list = rows.value.filter((row) => methodOf(row) === tab.value?.id)
  const byName = (a: IMoveRow, b: IMoveRow) => a.move.localeCompare(b.move)
  if (tab.value?.id === 'level-up') return list.sort((a, b) => a.level - b.level || byName(a, b))
  const unique = [...new Map(list.map((row) => [row.move, row])).values()]
  if (tab.value?.id === 'machine') {
    return unique.sort((a, b) => machineOrder(a.machine) - machineOrder(b.machine) || byName(a, b))
  }
  return unique.sort(byName)
})

const firstColumn = computed(() =>
  tab.value?.id === 'level-up' ? 'Lv.' : tab.value?.id === 'machine' ? machineLabel.value : '',
)
const firstCell = (row: IMoveRow) =>
  row.method === 'level-up' ? (row.level === 0 ? 'Evo.' : row.level) : (row.machine ?? '—')

const CATEGORIES: Record<string, { label: string; class: string }> = {
  physical: { label: 'Phys.', class: 'text-orange-600 dark:text-orange-400' },
  special: { label: 'Spec.', class: 'text-blue-600 dark:text-blue-400' },
  status: { label: 'Status', class: 'text-neutral-500 dark:text-neutral-400' },
}
</script>

<template>
  <div>
    <div role="group" aria-label="How the moves are learned" class="mb-3 flex flex-wrap gap-1">
      <button
        v-for="t in tabs"
        :key="t.id"
        type="button"
        :aria-pressed="t.id === tab?.id"
        class="rounded-full bg-white px-3 py-1 text-sm font-bold shadow-sm outline-none hover:bg-neutral-50 focus-visible:ring-4 focus-visible:ring-blue-400 aria-pressed:bg-neutral-800 aria-pressed:text-white dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:aria-pressed:bg-neutral-100 dark:aria-pressed:text-neutral-900"
        @click="selected = t.id"
      >
        {{ t.label }}
        <span class="font-normal opacity-60">{{ t.count }}</span>
      </button>
    </div>

    <p v-if="!data" class="font-pixel text-xl" aria-busy="true">Loading moves…</p>
    <table v-else class="w-full max-w-xl text-left">
      <thead class="text-xs text-neutral-500 uppercase dark:text-neutral-400">
        <tr>
          <th v-if="firstColumn" scope="col" class="py-1 pr-1.5 sm:pr-2 font-bold">{{ firstColumn }}</th>
          <th scope="col" class="py-1 pr-1.5 sm:pr-2 font-bold">Move</th>
          <th scope="col" class="py-1 pr-1.5 sm:pr-2 font-bold">Type</th>
          <th scope="col" class="py-1 pr-1.5 sm:pr-2 font-bold">Cat.</th>
          <th scope="col" class="py-1 pr-1.5 sm:pr-2 text-right font-bold">Pow.</th>
          <th scope="col" class="hidden py-1 pr-1.5 sm:pr-2 text-right font-bold sm:table-cell">Acc.</th>
          <th scope="col" class="py-1 text-right font-bold">PP</th>
        </tr>
      </thead>
      <tbody class="font-pixel text-base leading-tight sm:text-lg">
        <tr
          v-for="row in shown"
          :key="`${row.move}-${row.level}`"
          class="border-t border-neutral-200 dark:border-neutral-700"
        >
          <td v-if="firstColumn" class="py-1 pr-1.5 sm:pr-2 whitespace-nowrap">{{ firstCell(row) }}</td>
          <th scope="row" class="py-1 pr-1.5 sm:pr-2 font-normal">{{ titleCase(row.move) }}</th>
          <td class="py-1 pr-1.5 sm:pr-2"><TypeBadge :types="[{ name: row.type }]" /></td>
          <td class="py-1 pr-1.5 sm:pr-2" :class="CATEGORIES[row.category]?.class">
            {{ CATEGORIES[row.category]?.label ?? row.category }}
          </td>
          <td class="py-1 pr-1.5 sm:pr-2 text-right">{{ row.power ?? '—' }}</td>
          <td class="hidden py-1 pr-1.5 sm:pr-2 text-right sm:table-cell">{{ row.accuracy ?? '—' }}</td>
          <td class="py-1 text-right">{{ row.pp ?? '—' }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
