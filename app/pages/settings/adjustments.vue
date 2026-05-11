<template>
  <SettingsEditShell title="Adjustments" @back="handleBack">
    <p class="text-sm font-semibold text-brand-blue">
      Adjustments
    </p>
    <h1 class="mt-1 text-2xl font-bold tracking-normal text-brand-ink">
      Balance and accrual adjustments
    </h1>
    <p class="mt-3 text-sm leading-6 text-brand-muted">
      Balance corrections set the balance as of a date. Accrual adjustments change earning rules from that date forward.
    </p>

    <div class="flex justify-end">
    <button
      class="mt-5 inline-flex items-center gap-2 rounded-button bg-brand-blue px-4 py-2 text-sm font-semibold text-white shadow-button transition hover:bg-brand-blueDark focus:outline-none focus:ring-4 focus:ring-brand-line"
      type="button"
      @click="openNewAdjustmentModal"
    >
      <Plus class="h-4 w-4" aria-hidden="true" />
      Add New
    </button>
    </div>

    <Teleport to="body">
      <div
        v-if="isAdjustmentModalOpen"
        class="fixed inset-0 z-50 grid place-items-center bg-brand-ink/30 p-3 sm:p-6"
        role="dialog"
        aria-modal="true"
        @click.self="closeAdjustmentModal"
      >
        <div class="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-section border border-brand-line bg-white p-5 shadow-soft sm:p-6">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="text-sm font-semibold text-brand-blue">
                Adjustment
              </p>
              <h2 class="mt-1 text-xl font-bold tracking-normal text-brand-ink">
                {{ editingAdjustmentId ? 'Edit adjustment' : 'Add adjustment' }}
              </h2>
            </div>
            <button
              class="rounded-button border border-brand-line bg-white px-3 py-2 text-sm font-semibold text-brand-blue shadow-card transition hover:bg-brand-blueSoft focus:outline-none focus:ring-4 focus:ring-brand-line"
              type="button"
              @click="closeAdjustmentModal"
            >
              Close
            </button>
          </div>

          <form class="mt-5 grid gap-3" @submit.prevent="saveDraftAdjustment">
            <label class="grid gap-2">
              <span class="text-sm font-semibold text-brand-muted">Date</span>
              <input
                v-model="adjustmentDraft.date"
                class="rounded-card border border-brand-line bg-white px-4 py-3 text-base shadow-card outline-none transition focus:border-brand-blue focus:ring-4 focus:ring-brand-line"
                type="date"
              >
            </label>

            <div class="grid gap-2">
              <label class="flex items-center gap-3 rounded-card border border-brand-line bg-white px-4 py-3 text-sm font-semibold text-brand-ink shadow-card">
                <input
                  v-model="includeBalanceAdjustment"
                  class="h-4 w-4 accent-brand-blue"
                  type="checkbox"
                  @change="handleBalanceToggle"
                >
                <span>Balance Adjustment</span>
              </label>

              <label class="flex items-center gap-3 rounded-card border border-brand-line bg-white px-4 py-3 text-sm font-semibold text-brand-ink shadow-card">
                <input
                  v-model="includeAccrualAdjustment"
                  class="h-4 w-4 accent-brand-blue"
                  type="checkbox"
                  @change="handleAccrualToggle"
                >
                <span>Accrual Adjustment</span>
              </label>
            </div>

            <section
              v-if="includeBalanceAdjustment"
              class="rounded-card border border-brand-line bg-brand-panel p-4 shadow-card"
            >
        <label class="grid gap-2">
          <span class="text-sm font-semibold text-brand-muted">Balance correction</span>
          <input
            v-model.number="adjustmentDraft.balance"
            class="rounded-card border border-brand-line bg-white px-4 py-3 text-base shadow-card outline-none transition focus:border-brand-blue focus:ring-4 focus:ring-brand-line"
            step="0.01"
            type="number"
            placeholder="No balance change"
          >
        </label>
            </section>

            <section
              v-if="includeAccrualAdjustment"
              class="rounded-card border border-brand-line bg-brand-panel p-4 shadow-card"
            >
        <p class="text-sm font-semibold text-brand-muted">
          Accrual from this date forward
        </p>

        <div class="mt-3 grid gap-2 sm:grid-cols-2">
          <label class="flex items-center gap-3 rounded-card border border-brand-line bg-white px-4 py-3 text-sm font-semibold text-brand-ink shadow-card">
            <input
              v-model="includeAccrualAmount"
              class="h-4 w-4 accent-brand-blue"
              type="checkbox"
              @change="handleAccrualAmountToggle"
            >
            <span>Amount</span>
          </label>

          <label class="flex items-center gap-3 rounded-card border border-brand-line bg-white px-4 py-3 text-sm font-semibold text-brand-ink shadow-card">
            <input
              v-model="includeAccrualCadence"
              class="h-4 w-4 accent-brand-blue"
              type="checkbox"
              @change="handleAccrualCadenceToggle"
            >
            <span>Cadence</span>
          </label>
        </div>

        <div class="mt-3 grid gap-3">
          <label
            v-if="includeAccrualAmount"
            class="grid gap-2"
          >
            <span class="text-sm font-semibold text-brand-muted">Amount</span>
            <input
              v-model.number="adjustmentDraft.accrualAmount"
              class="rounded-card border border-brand-line bg-white px-4 py-3 text-base shadow-card outline-none transition focus:border-brand-blue focus:ring-4 focus:ring-brand-line"
              min="0"
              step="0.01"
              type="number"
            >
          </label>

          <label
            v-if="includeAccrualCadence"
            class="grid gap-2"
          >
            <span class="text-sm font-semibold text-brand-muted">Cadence</span>
            <select
              v-model="adjustmentDraft.accrualFrequency"
              class="rounded-card border border-brand-line bg-white px-4 py-3 text-base shadow-card outline-none transition focus:border-brand-blue focus:ring-4 focus:ring-brand-line"
              @change="handleAccrualFrequencyChange"
            >
              <option value="">No cadence change</option>
              <option value="weekly">Weekly</option>
              <option value="biweekly">Every 2 weeks</option>
              <option value="semimonthly">Twice a month</option>
              <option value="monthly">Monthly</option>
            </select>
          </label>
        </div>

        <div
          v-if="includeAccrualCadence && adjustmentDraft.accrualFrequency === 'semimonthly'"
          class="mt-4 grid gap-3"
        >
          <div class="grid grid-cols-2 gap-2">
            <button
              class="rounded-button px-3 py-2 text-sm font-semibold shadow-card transition focus:outline-none focus:ring-4 focus:ring-brand-line"
              :class="adjustmentDraft.semimonthlyMode === 'daysOfMonth' ? 'bg-brand-blue text-white' : 'border border-brand-line bg-white text-brand-blue hover:bg-brand-blueSoft'"
              type="button"
              @click="adjustmentDraft.semimonthlyMode = 'daysOfMonth'"
            >
              Days of month
            </button>
            <button
              class="rounded-button px-3 py-2 text-sm font-semibold shadow-card transition focus:outline-none focus:ring-4 focus:ring-brand-line"
              :class="adjustmentDraft.semimonthlyMode === 'dayOfWeek' ? 'bg-brand-blue text-white' : 'border border-brand-line bg-white text-brand-blue hover:bg-brand-blueSoft'"
              type="button"
              @click="adjustmentDraft.semimonthlyMode = 'dayOfWeek'"
            >
              Day of week
            </button>
          </div>

          <div
            v-if="adjustmentDraft.semimonthlyMode === 'daysOfMonth'"
            class="grid grid-cols-2 gap-3"
          >
            <label class="grid gap-2">
              <span class="text-sm font-semibold text-brand-muted">First day</span>
              <input
                v-model.number="adjustmentDraft.semimonthlyFirstDay"
                class="rounded-card border border-brand-line bg-white px-4 py-3 text-base shadow-card outline-none transition focus:border-brand-blue focus:ring-4 focus:ring-brand-line"
                max="31"
                min="1"
                step="1"
                type="number"
              >
            </label>
            <label class="grid gap-2">
              <span class="text-sm font-semibold text-brand-muted">Second day</span>
              <input
                v-model.number="adjustmentDraft.semimonthlySecondDay"
                class="rounded-card border border-brand-line bg-white px-4 py-3 text-base shadow-card outline-none transition focus:border-brand-blue focus:ring-4 focus:ring-brand-line"
                max="31"
                min="1"
                step="1"
                type="number"
              >
            </label>
          </div>

          <label v-else class="grid gap-2">
            <span class="text-sm font-semibold text-brand-muted">Weekday</span>
            <select
              v-model.number="adjustmentDraft.semimonthlyWeekday"
              class="rounded-card border border-brand-line bg-white px-4 py-3 text-base shadow-card outline-none transition focus:border-brand-blue focus:ring-4 focus:ring-brand-line"
            >
              <option
                v-for="weekday in weekdayOptions"
                :key="weekday.value"
                :value="weekday.value"
              >
                First and third {{ weekday.label }}
              </option>
            </select>
          </label>
        </div>
            </section>

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
                class="rounded-button border border-brand-line bg-white px-4 py-2 text-sm font-semibold text-brand-blue shadow-card transition hover:bg-brand-blueSoft focus:outline-none focus:ring-4 focus:ring-brand-line"
                type="button"
                @click="closeAdjustmentModal"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <div class="mt-5 border-t border-brand-lineSoft">
      <p
        v-if="sortedDraftAdjustments.length === 0"
        class="py-4 text-sm text-brand-muted"
      >
        No adjustments yet.
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
            <p
              v-if="adjustment.balance !== null"
              class="text-sm font-bold text-brand-blue"
            >
              {{ formatHours(adjustment.balance) }}h balance
            </p>
          </div>
          <p class="mt-1 text-sm text-brand-muted">
            {{ adjustment.note || 'No note' }}
          </p>
          <p class="mt-1 text-xs font-semibold text-brand-muted">
            {{ formatAccrualSummary(adjustment) }}
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
import { Plus } from 'lucide-vue-next'
import type { AccrualAdjustment, AccrualFrequency, BalanceAdjustment, SemimonthlyAccrualMode } from '~/composables/usePtoSettings'
import type { AdjustmentDraft } from '~/types/settings'

const router = useRouter()
const { saveSettingsNow, settings } = usePtoSettings()
const draftAdjustments = ref<AdjustmentDraft[]>(createDraftAdjustments())
const editingAdjustmentId = ref<string | null>(null)
const adjustmentDraft = ref<AdjustmentDraft>(createAdjustmentDraft())
const isAdjustmentModalOpen = ref(false)
const includeBalanceAdjustment = ref(false)
const includeAccrualAdjustment = ref(false)
const includeAccrualAmount = ref(false)
const includeAccrualCadence = ref(false)
const savedSnapshot = computed(() => JSON.stringify({
  accrualAdjustments: settings.value.accrualAdjustments,
  balanceAdjustments: settings.value.balanceAdjustments
}))
const draftSnapshot = computed(() => JSON.stringify(draftAdjustments.value))
const isDirty = computed(() => draftSnapshot.value !== savedSnapshot.value)
const sortedDraftAdjustments = computed(() =>
  [...draftAdjustments.value].sort((left, right) => right.date.localeCompare(left.date))
)
const { allowNextNavigation, confirmBack } = useSettingsDraftGuard(isDirty)
const weekdayOptions = [
  { label: 'Sunday', value: 0 },
  { label: 'Monday', value: 1 },
  { label: 'Tuesday', value: 2 },
  { label: 'Wednesday', value: 3 },
  { label: 'Thursday', value: 4 },
  { label: 'Friday', value: 5 },
  { label: 'Saturday', value: 6 }
]

function saveDraftAdjustment() {
  const nextAdjustment = normalizeDraftForSave({
    ...adjustmentDraft.value,
    id: editingAdjustmentId.value || adjustmentDraft.value.id || createId()
  })

  if (!nextAdjustment.date || (!hasBalanceDraftValue(nextAdjustment) && !hasAccrualDraftValue(nextAdjustment))) return

  if (editingAdjustmentId.value) {
    draftAdjustments.value = draftAdjustments.value.map((adjustment) =>
      adjustment.id === editingAdjustmentId.value ? nextAdjustment : adjustment
    )
  } else {
    draftAdjustments.value = [...draftAdjustments.value, nextAdjustment]
  }

  closeAdjustmentModal()
}

function editDraftAdjustment(id: string) {
  const adjustment = draftAdjustments.value.find((item) => item.id === id)
  if (!adjustment) return

  editingAdjustmentId.value = id
  adjustmentDraft.value = { ...adjustment }
  setDraftVisibility(adjustment)
  isAdjustmentModalOpen.value = true
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
  setDraftVisibility(adjustmentDraft.value)
}

function openNewAdjustmentModal() {
  resetAdjustmentDraft()
  isAdjustmentModalOpen.value = true
}

function closeAdjustmentModal() {
  isAdjustmentModalOpen.value = false
  resetAdjustmentDraft()
}

async function save() {
  settings.value = {
    ...settings.value,
    accrualAdjustments: draftAdjustments.value.filter(hasAccrualDraftValue).map(toAccrualAdjustment),
    balanceAdjustments: draftAdjustments.value.filter(hasBalanceDraftValue).map(toBalanceAdjustment)
  }

  await saveSettingsNow()
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

function createDraftAdjustments(): AdjustmentDraft[] {
  return [
    ...settings.value.balanceAdjustments.map((adjustment): AdjustmentDraft => ({
      ...emptyAccrualDraft(),
      id: `balance-${adjustment.id}`,
      balanceId: adjustment.id,
      date: adjustment.date,
      balance: adjustment.balance,
      note: adjustment.note
    })),
    ...settings.value.accrualAdjustments.map((adjustment): AdjustmentDraft => ({
      ...emptyBalanceDraft(),
      id: `accrual-${adjustment.id}`,
      accrualId: adjustment.id,
      date: adjustment.date,
      note: adjustment.note,
      accrualAmount: adjustment.accrualAmount,
      accrualFrequency: adjustment.accrualFrequency,
      semimonthlyFirstDay: adjustment.semimonthlyFirstDay,
      semimonthlyMode: adjustment.semimonthlyMode,
      semimonthlySecondDay: adjustment.semimonthlySecondDay,
      semimonthlyWeekday: adjustment.semimonthlyWeekday
    }))
  ].sort((left, right) => right.date.localeCompare(left.date))
}

function createAdjustmentDraft(): AdjustmentDraft {
  return {
    ...emptyBalanceDraft(),
    ...emptyAccrualDraft(),
    date: toDateInputValue(new Date()),
    id: createId(),
    note: ''
  }
}

function emptyBalanceDraft() {
  return {
    balance: null,
    balanceId: null
  }
}

function emptyAccrualDraft() {
  return {
    accrualAmount: null,
    accrualFrequency: '' as AccrualFrequency | '',
    accrualId: null,
    semimonthlyFirstDay: null,
    semimonthlyMode: '' as SemimonthlyAccrualMode | '',
    semimonthlySecondDay: null,
    semimonthlyWeekday: null
  }
}

function normalizeDraftForSave(draft: AdjustmentDraft): AdjustmentDraft {
  const balance = includeBalanceAdjustment.value ? normalizeOptionalNumber(draft.balance) : null
  const accrualAmount = includeAccrualAdjustment.value && includeAccrualAmount.value
    ? normalizeOptionalNumber(draft.accrualAmount)
    : null
  const accrualFrequency = includeAccrualAdjustment.value && includeAccrualCadence.value
    ? draft.accrualFrequency as AccrualFrequency | ''
    : ''
  const semimonthlyMode = draft.semimonthlyMode || (accrualFrequency === 'semimonthly' ? settings.value.semimonthlyMode : '')

  return {
    ...draft,
    accrualAmount,
    accrualFrequency,
    balance,
    note: draft.note.trim(),
    semimonthlyFirstDay: accrualFrequency === 'semimonthly'
      ? normalizeOptionalDayOfMonth(draft.semimonthlyFirstDay)
      : null,
    semimonthlyMode: accrualFrequency === 'semimonthly' ? semimonthlyMode : '',
    semimonthlySecondDay: accrualFrequency === 'semimonthly'
      ? normalizeOptionalDayOfMonth(draft.semimonthlySecondDay)
      : null,
    semimonthlyWeekday: accrualFrequency === 'semimonthly'
      ? normalizeOptionalWeekday(draft.semimonthlyWeekday)
      : null
  }
}

function handleBalanceToggle() {
  if (!includeBalanceAdjustment.value) {
    adjustmentDraft.value.balance = null
  }
}

function handleAccrualToggle() {
  if (includeAccrualAdjustment.value) return

  includeAccrualAmount.value = false
  includeAccrualCadence.value = false
  clearAccrualAmount()
  clearAccrualCadence()
}

function handleAccrualAmountToggle() {
  if (!includeAccrualAmount.value) {
    clearAccrualAmount()
  }
}

function handleAccrualCadenceToggle() {
  if (!includeAccrualCadence.value) {
    clearAccrualCadence()
  }
}

function handleAccrualFrequencyChange() {
  if (adjustmentDraft.value.accrualFrequency === 'semimonthly' && !adjustmentDraft.value.semimonthlyMode) {
    adjustmentDraft.value.semimonthlyMode = settings.value.semimonthlyMode
  }

  if (adjustmentDraft.value.accrualFrequency !== 'semimonthly') {
    adjustmentDraft.value.semimonthlyFirstDay = null
    adjustmentDraft.value.semimonthlyMode = ''
    adjustmentDraft.value.semimonthlySecondDay = null
    adjustmentDraft.value.semimonthlyWeekday = null
  }
}

function setDraftVisibility(adjustment: AdjustmentDraft) {
  includeBalanceAdjustment.value = hasBalanceDraftValue(adjustment)
  includeAccrualAmount.value = adjustment.accrualAmount !== null
  includeAccrualCadence.value = hasAccrualCadenceValue(adjustment)
  includeAccrualAdjustment.value = includeAccrualAmount.value || includeAccrualCadence.value
}

function clearAccrualAmount() {
  adjustmentDraft.value.accrualAmount = null
}

function clearAccrualCadence() {
  adjustmentDraft.value.accrualFrequency = ''
  adjustmentDraft.value.semimonthlyFirstDay = null
  adjustmentDraft.value.semimonthlyMode = ''
  adjustmentDraft.value.semimonthlySecondDay = null
  adjustmentDraft.value.semimonthlyWeekday = null
}

function hasBalanceDraftValue(adjustment: AdjustmentDraft) {
  return adjustment.balance !== null
}

function hasAccrualDraftValue(adjustment: AdjustmentDraft) {
  return adjustment.accrualAmount !== null ||
    hasAccrualCadenceValue(adjustment)
}

function hasAccrualCadenceValue(adjustment: AdjustmentDraft) {
  return Boolean(adjustment.accrualFrequency) ||
    adjustment.semimonthlyFirstDay !== null ||
    Boolean(adjustment.semimonthlyMode) ||
    adjustment.semimonthlySecondDay !== null ||
    adjustment.semimonthlyWeekday !== null
}

function toBalanceAdjustment(adjustment: AdjustmentDraft): BalanceAdjustment {
  return {
    id: adjustment.balanceId || createId(),
    date: adjustment.date,
    balance: Number(adjustment.balance ?? 0),
    note: adjustment.note
  }
}

function toAccrualAdjustment(adjustment: AdjustmentDraft): AccrualAdjustment {
  return {
    id: adjustment.accrualId || createId(),
    date: adjustment.date,
    note: adjustment.note,
    accrualAmount: adjustment.accrualAmount,
    accrualFrequency: adjustment.accrualFrequency,
    semimonthlyFirstDay: adjustment.semimonthlyFirstDay,
    semimonthlyMode: adjustment.semimonthlyMode,
    semimonthlySecondDay: adjustment.semimonthlySecondDay,
    semimonthlyWeekday: adjustment.semimonthlyWeekday
  }
}

function formatDisplayDate(value: string) {
  return parseLocalDate(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

function formatHours(value: number | null) {
  const numericValue = Number(value ?? 0)
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
    minimumFractionDigits: Number.isInteger(numericValue) ? 0 : 2
  }).format(numericValue)
}

function formatAccrualSummary(adjustment: AdjustmentDraft) {
  if (!hasAccrualDraftValue(adjustment)) return 'No accrual change'

  const parts = []
  if (adjustment.accrualAmount !== null) {
    parts.push(`${formatHours(adjustment.accrualAmount)}h`)
  }

  const frequencyLabel = frequencyLabelFor(adjustment)
  if (frequencyLabel !== 'not set') {
    parts.push(frequencyLabel)
  }

  return parts.length > 0 ? `Accrual change: ${parts.join(', ')}` : 'Accrual change'
}

function frequencyLabelFor(adjustment: AdjustmentDraft) {
  if (adjustment.accrualFrequency === 'weekly') return 'weekly'
  if (adjustment.accrualFrequency === 'biweekly') return 'every 2 weeks'
  if (adjustment.accrualFrequency === 'monthly') return 'monthly'
  if (adjustment.accrualFrequency === 'semimonthly' && adjustment.semimonthlyMode === 'dayOfWeek') {
    return `twice a month on the first and third ${weekdayOptions.find((weekday) => weekday.value === adjustment.semimonthlyWeekday)?.label ?? 'selected weekday'}`
  }
  if (adjustment.accrualFrequency === 'semimonthly') {
    return `twice a month on days ${adjustment.semimonthlyFirstDay} and ${adjustment.semimonthlySecondDay}`
  }

  return 'not set'
}

function normalizeOptionalNumber(value: unknown) {
  if (value === null || value === undefined || value === '') return null

  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : null
}

function normalizeOptionalDayOfMonth(value: unknown) {
  if (value === null || value === undefined || value === '') return null

  const numberValue = Number(value)
  if (!Number.isFinite(numberValue)) return null
  return Math.min(31, Math.max(1, Math.trunc(numberValue)))
}

function normalizeOptionalWeekday(value: unknown) {
  if (value === null || value === undefined || value === '') return null

  const numberValue = Number(value)
  if (!Number.isFinite(numberValue)) return null
  return Math.min(6, Math.max(0, Math.trunc(numberValue)))
}
</script>
