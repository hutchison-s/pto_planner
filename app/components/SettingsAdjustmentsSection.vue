<template>
  <section class="mt-5 rounded-section border border-brand-line bg-brand-panel p-5 shadow-soft sm:p-6">
    <button
      class="flex w-full items-start justify-between gap-3 text-left focus:outline-none focus:ring-4 focus:ring-brand-line disabled:cursor-not-allowed disabled:opacity-60 sm:pointer-events-none sm:focus:ring-0 sm:disabled:opacity-100"
      :disabled="!isInitialSetupComplete"
      type="button"
      @click="$emit('toggle')"
    >
      <span>
        <span class="block text-sm font-semibold text-brand-blue">
          Adjustments
        </span>
        <span class="mt-1 block text-2xl font-bold tracking-normal">
          Balance corrections
        </span>
        <span class="mt-1 block text-sm font-semibold text-brand-muted sm:hidden">
          Set balance by date
        </span>
      </span>
      <span class="flex items-center gap-3">
        <span class="hidden text-sm font-semibold text-brand-muted sm:inline">
          Set balance by date
        </span>
        <ChevronDown
          class="h-5 w-5 shrink-0 text-brand-blue transition sm:hidden"
          :class="isOpen ? 'rotate-180' : ''"
          aria-hidden="true"
        />
      </span>
    </button>

    <p
      v-if="!isInitialSetupComplete"
      class="mt-3 text-sm text-brand-muted"
    >
      Complete the Initial section before adding balance corrections.
    </p>

    <div
      class="sm:block"
      :class="isInitialSetupComplete && isOpen ? 'block' : 'hidden'"
    >
      <form class="mt-5 grid gap-3" @submit.prevent="$emit('save')">
        <div class="grid gap-3 sm:grid-cols-[minmax(0,1fr)_9rem]">
          <label class="grid gap-2">
            <span class="text-sm font-semibold text-brand-muted">Date</span>
            <input
              v-model="draft.date"
              class="rounded-card border border-brand-line bg-white px-4 py-3 text-base shadow-card outline-none transition focus:border-brand-blue focus:ring-4 focus:ring-brand-line"
              type="date"
            >
          </label>

          <label class="grid gap-2">
            <span class="text-sm font-semibold text-brand-muted">Balance as of date</span>
            <input
              v-model.number="draft.balance"
              class="rounded-card border border-brand-line bg-white px-4 py-3 text-base shadow-card outline-none transition focus:border-brand-blue focus:ring-4 focus:ring-brand-line"
              step="0.25"
              type="number"
            >
          </label>
        </div>

        <label class="grid gap-2">
          <span class="text-sm font-semibold text-brand-muted">Note</span>
          <input
            v-model="draft.note"
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
            @click="$emit('resetDraft')"
          >
            Cancel
          </button>
        </div>
      </form>

      <div class="mt-5 border-t border-brand-lineSoft">
        <p
          v-if="adjustments.length === 0"
          class="py-4 text-sm text-brand-muted"
        >
          No balance corrections yet.
        </p>

        <div
          v-for="adjustment in adjustments"
          :key="adjustment.id"
          class="grid gap-3 border-b border-brand-lineSoft py-4 sm:grid-cols-[1fr_auto] sm:items-center"
        >
          <div>
            <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <p class="text-sm font-bold text-brand-ink">
                {{ formatDisplayDate(adjustment.date) }}
              </p>
              <p class="text-sm font-bold text-brand-blue">
                {{ formatHours(adjustment.balance) }}h balance
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
              @click="$emit('edit', adjustment.id)"
            >
              Edit
            </button>
            <button
              class="rounded-button border border-brand-line bg-white px-3 py-2 text-sm font-semibold text-brand-orange shadow-card transition hover:bg-orange-50 focus:outline-none focus:ring-4 focus:ring-brand-line"
              type="button"
              @click="$emit('delete', adjustment.id)"
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
</template>

<script setup lang="ts">
import { ChevronDown } from 'lucide-vue-next'
import type { BalanceAdjustment } from '~/composables/usePtoSettings'
import type { AdjustmentDraft } from '~/types/settings'

defineEmits<{
  delete: [id: string]
  edit: [id: string]
  resetDraft: []
  save: []
  toggle: []
}>()

defineProps<{
  adjustments: BalanceAdjustment[]
  draft: AdjustmentDraft
  editingAdjustmentId: string | null
  isInitialSetupComplete: boolean
  isOpen: boolean
}>()

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
