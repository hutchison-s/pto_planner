<template>
  <main class="mx-auto min-h-screen w-full max-w-3xl px-4 py-5 sm:px-6">
    <NuxtLink
      class="inline-flex items-center gap-2 rounded-button border border-brand-line bg-white px-4 py-2 text-sm font-semibold text-brand-blue shadow-card transition hover:bg-brand-blueSoft focus:outline-none focus:ring-4 focus:ring-brand-line"
      to="/"
    >
      <ArrowLeft class="h-4 w-4" aria-hidden="true" />
      Home
    </NuxtLink>

    <section class="mt-5 rounded-section border border-brand-line bg-brand-panel p-5 shadow-soft sm:p-6">
      <button
        class="flex w-full items-center justify-between gap-3 text-left focus:outline-none focus:ring-4 focus:ring-brand-line sm:pointer-events-none sm:focus:ring-0"
        type="button"
        @click="initialSectionOpen = !initialSectionOpen"
      >
        <span>
          <span class="block text-sm font-semibold text-brand-blue">
            Initial
          </span>
          <span class="mt-1 block text-2xl font-bold tracking-normal sm:text-3xl">
            PTO accrual setup
          </span>
        </span>
        <ChevronDown
          class="h-5 w-5 shrink-0 text-brand-blue transition sm:hidden"
          :class="initialSectionOpen ? 'rotate-180' : ''"
          aria-hidden="true"
        />
      </button>

      <form
        class="mt-6 gap-5 sm:grid"
        :class="initialSectionOpen ? 'grid' : 'hidden'"
        @submit.prevent
      >
        <label class="grid gap-2">
          <span class="text-sm font-semibold text-brand-muted">Starting balance</span>
          <input
            v-model.number="settings.startingBalance"
            class="rounded-card border border-brand-line bg-white px-4 py-3 text-base shadow-card outline-none transition focus:border-brand-blue focus:ring-4 focus:ring-brand-line"
            min="0"
            step="0.25"
            type="number"
          >
        </label>

        <label class="grid gap-2">
          <span class="text-sm font-semibold text-brand-muted">Starting date</span>
          <input
            v-model="settings.startingDate"
            class="rounded-card border border-brand-line bg-white px-4 py-3 text-base shadow-card outline-none transition focus:border-brand-blue focus:ring-4 focus:ring-brand-line"
            type="date"
          >
        </label>

        <label class="grid gap-2">
          <span class="text-sm font-semibold text-brand-muted">Accrual amount</span>
          <input
            v-model.number="settings.accrualAmount"
            class="rounded-card border border-brand-line bg-white px-4 py-3 text-base shadow-card outline-none transition focus:border-brand-blue focus:ring-4 focus:ring-brand-line"
            min="0"
            step="0.25"
            type="number"
          >
        </label>

        <label class="grid gap-2">
          <span class="text-sm font-semibold text-brand-muted">Accrual frequency</span>
          <select
            v-model="settings.accrualFrequency"
            class="rounded-card border border-brand-line bg-white px-4 py-3 text-base shadow-card outline-none transition focus:border-brand-blue focus:ring-4 focus:ring-brand-line"
          >
            <option value="weekly">Weekly</option>
            <option value="biweekly">Every 2 weeks</option>
            <option value="semimonthly">Twice a month</option>
            <option value="monthly">Monthly</option>
          </select>
        </label>
      </form>
    </section>

    <section class="mt-5 rounded-section border border-brand-line bg-brand-panel p-5 shadow-soft sm:p-6">
      <button
        class="flex w-full items-start justify-between gap-3 text-left focus:outline-none focus:ring-4 focus:ring-brand-line sm:pointer-events-none sm:focus:ring-0"
        type="button"
        @click="adjustmentsSectionOpen = !adjustmentsSectionOpen"
      >
        <span>
          <span class="block text-sm font-semibold text-brand-blue">
            Adjustments
          </span>
          <span class="mt-1 block text-2xl font-bold tracking-normal">
            Balance corrections
          </span>
          <span class="mt-1 block text-sm font-semibold text-brand-muted sm:hidden">
            Net {{ formatHours(totalAdjustmentHours) }}h
          </span>
        </span>
        <span class="flex items-center gap-3">
          <span class="hidden text-sm font-semibold text-brand-muted sm:inline">
            Net {{ formatHours(totalAdjustmentHours) }}h
          </span>
          <ChevronDown
            class="h-5 w-5 shrink-0 text-brand-blue transition sm:hidden"
            :class="adjustmentsSectionOpen ? 'rotate-180' : ''"
            aria-hidden="true"
          />
        </span>
      </button>

      <div
        class="sm:block"
        :class="adjustmentsSectionOpen ? 'block' : 'hidden'"
      >
        <form class="mt-5 grid gap-3" @submit.prevent="saveAdjustment">
          <div class="grid gap-3 sm:grid-cols-[minmax(0,1fr)_9rem]">
          <label class="grid gap-2">
            <span class="text-sm font-semibold text-brand-muted">Date</span>
            <input
              v-model="adjustmentDraft.date"
              class="rounded-card border border-brand-line bg-white px-4 py-3 text-base shadow-card outline-none transition focus:border-brand-blue focus:ring-4 focus:ring-brand-line"
              type="date"
            >
          </label>

          <label class="grid gap-2">
            <span class="text-sm font-semibold text-brand-muted">Hours</span>
            <input
              v-model.number="adjustmentDraft.hours"
              class="rounded-card border border-brand-line bg-white px-4 py-3 text-base shadow-card outline-none transition focus:border-brand-blue focus:ring-4 focus:ring-brand-line"
              step="0.25"
              type="number"
            >
          </label>
          </div>

          <label class="grid gap-2">
          <span class="text-sm font-semibold text-brand-muted">Note</span>
          <input
            v-model="adjustmentDraft.note"
            class="rounded-card border border-brand-line bg-white px-4 py-3 text-base shadow-card outline-none transition focus:border-brand-blue focus:ring-4 focus:ring-brand-line"
            placeholder="Correction reason"
            type="text"
          >
          </label>

          <div class="flex flex-wrap items-center gap-2">
          <button
            class="rounded-button bg-brand-blue px-4 py-2 text-sm font-semibold text-white shadow-button transition hover:bg-brand-blueDark focus:outline-none focus:ring-4 focus:ring-brand-line"
            type="submit"
          >
            {{ editingAdjustmentId ? 'Update adjustment' : 'Add adjustment' }}
          </button>
          <button
            v-if="editingAdjustmentId"
            class="rounded-button border border-brand-line bg-white px-4 py-2 text-sm font-semibold text-brand-blue shadow-card transition hover:bg-brand-blueSoft focus:outline-none focus:ring-4 focus:ring-brand-line"
            type="button"
            @click="resetAdjustmentDraft"
          >
            Cancel
          </button>
          </div>
        </form>

        <div class="mt-5 border-t border-brand-lineSoft">
        <p
          v-if="sortedAdjustments.length === 0"
          class="py-4 text-sm text-brand-muted"
        >
          No balance corrections yet.
        </p>

        <div
          v-for="adjustment in sortedAdjustments"
          :key="adjustment.id"
          class="grid gap-3 border-b border-brand-lineSoft py-4 sm:grid-cols-[1fr_auto] sm:items-center"
        >
          <div>
            <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <p class="text-sm font-bold text-brand-ink">
                {{ formatDisplayDate(adjustment.date) }}
              </p>
              <p
                class="text-sm font-bold"
                :class="adjustment.hours >= 0 ? 'text-brand-lime' : 'text-brand-orange'"
              >
                {{ adjustment.hours >= 0 ? '+' : '' }}{{ formatHours(adjustment.hours) }}h
              </p>
            </div>
            <p class="mt-1 text-sm text-brand-muted">
              {{ adjustment.note || 'No note' }}
            </p>
          </div>

          <div class="flex items-center gap-2">
            <button
              class="rounded-button border border-brand-line bg-white px-3 py-2 text-sm font-semibold text-brand-blue shadow-card transition hover:bg-brand-blueSoft focus:outline-none focus:ring-4 focus:ring-brand-line"
              type="button"
              @click="editAdjustment(adjustment.id)"
            >
              Edit
            </button>
            <button
              class="rounded-button border border-brand-line bg-white px-3 py-2 text-sm font-semibold text-brand-orange shadow-card transition hover:bg-orange-50 focus:outline-none focus:ring-4 focus:ring-brand-line"
              type="button"
              @click="deleteAdjustment(adjustment.id)"
            >
              Delete
            </button>
          </div>
        </div>
        </div>

        <div class="mt-5 rounded-card border border-brand-lineSoft bg-brand-blueSoft px-4 py-3 text-sm text-brand-muted">
        Local storage saves changes automatically in this browser.
        </div>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { ArrowLeft, ChevronDown } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import type { BalanceAdjustment } from '~/composables/usePtoSettings'

const { settings } = usePtoSettings()

type AdjustmentDraft = Omit<BalanceAdjustment, 'id'>

const initialSectionOpen = ref(true)
const adjustmentsSectionOpen = ref(true)
const editingAdjustmentId = ref<string | null>(null)
const adjustmentDraft = ref<AdjustmentDraft>(createAdjustmentDraft())
const sortedAdjustments = computed(() =>
  [...settings.value.balanceAdjustments].sort((left, right) => right.date.localeCompare(left.date))
)
const totalAdjustmentHours = computed(() =>
  settings.value.balanceAdjustments.reduce((total, adjustment) => total + adjustment.hours, 0)
)

function saveAdjustment() {
  const nextAdjustment = {
    id: editingAdjustmentId.value || createId(),
    date: adjustmentDraft.value.date,
    hours: Number(adjustmentDraft.value.hours) || 0,
    note: adjustmentDraft.value.note.trim()
  }

  if (editingAdjustmentId.value) {
    settings.value = {
      ...settings.value,
      balanceAdjustments: settings.value.balanceAdjustments.map((adjustment) =>
        adjustment.id === editingAdjustmentId.value ? nextAdjustment : adjustment
      )
    }
  } else {
    settings.value = {
      ...settings.value,
      balanceAdjustments: [...settings.value.balanceAdjustments, nextAdjustment]
    }
  }

  resetAdjustmentDraft()
}

function editAdjustment(id: string) {
  const adjustment = settings.value.balanceAdjustments.find((item) => item.id === id)
  if (!adjustment) return

  editingAdjustmentId.value = id
  adjustmentDraft.value = {
    date: adjustment.date,
    hours: adjustment.hours,
    note: adjustment.note
  }
}

function deleteAdjustment(id: string) {
  settings.value = {
    ...settings.value,
    balanceAdjustments: settings.value.balanceAdjustments.filter((adjustment) => adjustment.id !== id)
  }

  if (editingAdjustmentId.value === id) {
    resetAdjustmentDraft()
  }
}

function resetAdjustmentDraft() {
  editingAdjustmentId.value = null
  adjustmentDraft.value = createAdjustmentDraft()
}

function createAdjustmentDraft(): AdjustmentDraft {
  return {
    date: toDateInputValue(new Date()),
    hours: 0,
    note: ''
  }
}

function formatDisplayDate(value: string) {
  return parseLocalDate(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

function formatHours(value: number) {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2
  }).format(value)
}
</script>
