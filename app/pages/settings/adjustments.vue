<template>
  <SettingsEditShell title="Adjustments" @back="handleBack">
    <p class="text-sm font-semibold text-brand-blue">
      Adjustments
    </p>
    <h1 class="mt-1 text-2xl font-bold tracking-normal text-brand-ink">
      Balance corrections
    </h1>
    <p class="mt-3 text-sm leading-6 text-brand-muted">
      Each correction sets the balance as of that date. The planner calculates forward from the latest correction.
    </p>

    <form class="mt-5 grid gap-3" @submit.prevent="saveDraftAdjustment">
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
          <span class="text-sm font-semibold text-brand-muted">Balance</span>
          <input
            v-model.number="adjustmentDraft.balance"
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
          {{ editingAdjustmentId ? 'Update correction' : 'Add correction' }}
        </button>
        <button
          v-if="editingAdjustmentId"
          class="rounded-button border border-brand-line bg-white px-4 py-2 text-sm font-semibold text-brand-blue shadow-card transition hover:bg-brand-blueSoft focus:outline-none focus:ring-4 focus:ring-brand-line"
          type="button"
          @click="resetAdjustmentDraft"
        >
          Cancel edit
        </button>
      </div>
    </form>

    <div class="mt-5 border-t border-brand-lineSoft">
      <p
        v-if="sortedDraftAdjustments.length === 0"
        class="py-4 text-sm text-brand-muted"
      >
        No balance corrections yet.
      </p>

      <div
        v-for="adjustment in sortedDraftAdjustments"
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
            @click="editDraftAdjustment(adjustment.id)"
          >
            Edit
          </button>
          <button
            class="rounded-button border border-brand-line bg-white px-3 py-2 text-sm font-semibold text-brand-orange shadow-card transition hover:bg-orange-50 focus:outline-none focus:ring-4 focus:ring-brand-line"
            type="button"
            @click="deleteDraftAdjustment(adjustment.id)"
          >
            Delete
          </button>
        </div>
      </div>
    </div>

    <div class="mt-5 flex flex-wrap items-center gap-2">
      <button
        class="rounded-button bg-brand-blue px-4 py-2 text-sm font-semibold text-white shadow-button transition hover:bg-brand-blueDark focus:outline-none focus:ring-4 focus:ring-brand-line"
        type="button"
        @click="save"
      >
        Save
      </button>
      <button
        class="rounded-button border border-brand-line bg-white px-4 py-2 text-sm font-semibold text-brand-blue shadow-card transition hover:bg-brand-blueSoft focus:outline-none focus:ring-4 focus:ring-brand-line"
        type="button"
        @click="cancel"
      >
        Cancel
      </button>
    </div>
  </SettingsEditShell>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { BalanceAdjustment } from '~/composables/usePtoSettings'
import type { AdjustmentDraft } from '~/types/settings'

const router = useRouter()
const { settings } = usePtoSettings()
const draftAdjustments = ref<BalanceAdjustment[]>(settings.value.balanceAdjustments.map((adjustment) => ({ ...adjustment })))
const editingAdjustmentId = ref<string | null>(null)
const adjustmentDraft = ref<AdjustmentDraft>(createAdjustmentDraft())
const savedSnapshot = computed(() => JSON.stringify(settings.value.balanceAdjustments))
const draftSnapshot = computed(() => JSON.stringify(draftAdjustments.value))
const isDirty = computed(() => draftSnapshot.value !== savedSnapshot.value)
const sortedDraftAdjustments = computed(() =>
  [...draftAdjustments.value].sort((left, right) => right.date.localeCompare(left.date))
)
const { allowNextNavigation, confirmBack } = useSettingsDraftGuard(isDirty)

function saveDraftAdjustment() {
  const nextAdjustment = {
    id: editingAdjustmentId.value || createId(),
    date: adjustmentDraft.value.date,
    balance: Number(adjustmentDraft.value.balance) || 0,
    note: adjustmentDraft.value.note.trim()
  }

  if (editingAdjustmentId.value) {
    draftAdjustments.value = draftAdjustments.value.map((adjustment) =>
      adjustment.id === editingAdjustmentId.value ? nextAdjustment : adjustment
    )
  } else {
    draftAdjustments.value = [...draftAdjustments.value, nextAdjustment]
  }

  resetAdjustmentDraft()
}

function editDraftAdjustment(id: string) {
  const adjustment = draftAdjustments.value.find((item) => item.id === id)
  if (!adjustment) return

  editingAdjustmentId.value = id
  adjustmentDraft.value = {
    date: adjustment.date,
    balance: adjustment.balance,
    note: adjustment.note
  }
}

function deleteDraftAdjustment(id: string) {
  draftAdjustments.value = draftAdjustments.value.filter((adjustment) => adjustment.id !== id)

  if (editingAdjustmentId.value === id) {
    resetAdjustmentDraft()
  }
}

function resetAdjustmentDraft() {
  editingAdjustmentId.value = null
  adjustmentDraft.value = createAdjustmentDraft()
}

function save() {
  settings.value = {
    ...settings.value,
    balanceAdjustments: draftAdjustments.value
  }

  allowNextNavigation()
  router.push('/settings')
}

function cancel() {
  allowNextNavigation()
  router.push('/settings')
}

function handleBack() {
  if (!confirmBack()) return
  allowNextNavigation()
  router.push('/settings')
}

function createAdjustmentDraft(): AdjustmentDraft {
  return {
    date: toDateInputValue(new Date()),
    balance: 0,
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
