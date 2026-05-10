<template>
  <SettingsEditShell title="Initial" @back="handleBack">
    <p class="text-sm font-semibold text-brand-blue">
      Initial
    </p>
    <h1 class="mt-1 text-2xl font-bold tracking-normal text-brand-ink">
      PTO accrual setup
    </h1>

    <form class="mt-6 grid gap-5" @submit.prevent="save">
      <label class="grid gap-2">
        <span class="text-sm font-semibold text-brand-muted">Starting balance</span>
        <input
          v-model.number="draft.startingBalance"
          class="rounded-card border border-brand-line bg-white px-4 py-3 text-base shadow-card outline-none transition focus:border-brand-blue focus:ring-4 focus:ring-brand-line"
          min="0"
          step="0.25"
          type="number"
        >
      </label>

      <label class="grid gap-2">
        <span class="text-sm font-semibold text-brand-muted">Starting date</span>
        <input
          v-model="draft.startingDate"
          class="rounded-card border border-brand-line bg-white px-4 py-3 text-base shadow-card outline-none transition focus:border-brand-blue focus:ring-4 focus:ring-brand-line"
          type="date"
        >
      </label>

      <label class="grid gap-2">
        <span class="text-sm font-semibold text-brand-muted">Accrual amount</span>
        <input
          v-model.number="draft.accrualAmount"
          class="rounded-card border border-brand-line bg-white px-4 py-3 text-base shadow-card outline-none transition focus:border-brand-blue focus:ring-4 focus:ring-brand-line"
          min="0"
          step="0.25"
          type="number"
        >
      </label>

      <label class="grid gap-2">
        <span class="text-sm font-semibold text-brand-muted">Accrual frequency</span>
        <select
          v-model="draft.accrualFrequency"
          class="rounded-card border border-brand-line bg-white px-4 py-3 text-base shadow-card outline-none transition focus:border-brand-blue focus:ring-4 focus:ring-brand-line"
        >
          <option disabled value="">Select frequency</option>
          <option value="weekly">Weekly</option>
          <option value="biweekly">Every 2 weeks</option>
          <option value="semimonthly">Twice a month</option>
          <option value="monthly">Monthly</option>
        </select>
      </label>

      <section
        v-if="draft.accrualFrequency === 'semimonthly'"
        class="rounded-card border border-brand-line bg-brand-panel p-4 shadow-card"
      >
        <p class="text-sm font-semibold text-brand-muted">
          Twice a month accrual pattern
        </p>

        <div class="mt-3 grid grid-cols-2 gap-2">
          <button
            class="rounded-button px-3 py-2 text-sm font-semibold shadow-card transition focus:outline-none focus:ring-4 focus:ring-brand-line"
            :class="draft.semimonthlyMode === 'daysOfMonth' ? 'bg-brand-blue text-white' : 'border border-brand-line bg-white text-brand-blue hover:bg-brand-blueSoft'"
            type="button"
            @click="draft.semimonthlyMode = 'daysOfMonth'"
          >
            Days of month
          </button>
          <button
            class="rounded-button px-3 py-2 text-sm font-semibold shadow-card transition focus:outline-none focus:ring-4 focus:ring-brand-line"
            :class="draft.semimonthlyMode === 'dayOfWeek' ? 'bg-brand-blue text-white' : 'border border-brand-line bg-white text-brand-blue hover:bg-brand-blueSoft'"
            type="button"
            @click="draft.semimonthlyMode = 'dayOfWeek'"
          >
            Day of week
          </button>
        </div>

        <div
          v-if="draft.semimonthlyMode === 'daysOfMonth'"
          class="mt-4 grid grid-cols-2 gap-3"
        >
          <label class="grid gap-2">
            <span class="text-sm font-semibold text-brand-muted">First day</span>
            <input
              v-model.number="draft.semimonthlyFirstDay"
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
              v-model.number="draft.semimonthlySecondDay"
              class="rounded-card border border-brand-line bg-white px-4 py-3 text-base shadow-card outline-none transition focus:border-brand-blue focus:ring-4 focus:ring-brand-line"
              max="31"
              min="1"
              step="1"
              type="number"
            >
          </label>
        </div>

        <label
          v-else
          class="mt-4 grid gap-2"
        >
          <span class="text-sm font-semibold text-brand-muted">Weekday</span>
          <select
            v-model.number="draft.semimonthlyWeekday"
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
      </section>

      <div class="flex flex-wrap items-center gap-2">
        <button
          class="rounded-button bg-brand-blue px-4 py-2 text-sm font-semibold text-white shadow-button transition hover:bg-brand-blueDark focus:outline-none focus:ring-4 focus:ring-brand-line"
          type="submit"
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
    </form>
  </SettingsEditShell>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { hasCompleteInitialSetup, type AccrualFrequency, type SemimonthlyAccrualMode } from '~/composables/usePtoSettings'

const router = useRouter()
const { saveSettingsNow, settings } = usePtoSettings()
const draft = ref({
  accrualAmount: settings.value.accrualAmount,
  accrualFrequency: settings.value.accrualFrequency,
  semimonthlyFirstDay: settings.value.semimonthlyFirstDay,
  semimonthlyMode: settings.value.semimonthlyMode,
  semimonthlySecondDay: settings.value.semimonthlySecondDay,
  semimonthlyWeekday: settings.value.semimonthlyWeekday,
  startingBalance: settings.value.startingBalance,
  startingDate: settings.value.startingDate
})
const savedSnapshot = computed(() => JSON.stringify({
  accrualAmount: settings.value.accrualAmount,
  accrualFrequency: settings.value.accrualFrequency,
  semimonthlyFirstDay: settings.value.semimonthlyFirstDay,
  semimonthlyMode: settings.value.semimonthlyMode,
  semimonthlySecondDay: settings.value.semimonthlySecondDay,
  semimonthlyWeekday: settings.value.semimonthlyWeekday,
  startingBalance: settings.value.startingBalance,
  startingDate: settings.value.startingDate
}))
const draftSnapshot = computed(() => JSON.stringify(draft.value))
const isDirty = computed(() => draftSnapshot.value !== savedSnapshot.value)
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

async function save() {
  const nextSettings = {
    ...settings.value,
    accrualAmount: normalizeOptionalNumber(draft.value.accrualAmount),
    accrualFrequency: draft.value.accrualFrequency as AccrualFrequency | '',
    semimonthlyFirstDay: normalizeDayOfMonth(draft.value.semimonthlyFirstDay, settings.value.semimonthlyFirstDay),
    semimonthlyMode: draft.value.semimonthlyMode as SemimonthlyAccrualMode,
    semimonthlySecondDay: normalizeDayOfMonth(draft.value.semimonthlySecondDay, settings.value.semimonthlySecondDay),
    semimonthlyWeekday: normalizeWeekday(draft.value.semimonthlyWeekday, settings.value.semimonthlyWeekday),
    startingBalance: normalizeOptionalNumber(draft.value.startingBalance),
    startingDate: draft.value.startingDate
  }

  settings.value = {
    ...nextSettings,
    initialSetupComplete: hasCompleteInitialSetup(nextSettings)
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

function normalizeOptionalNumber(value: unknown) {
  if (value === null || value === undefined || value === '') return null

  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : null
}

function normalizeDayOfMonth(value: unknown, fallback: number) {
  const numberValue = Number(value)
  if (!Number.isFinite(numberValue)) return fallback
  return Math.min(31, Math.max(1, Math.trunc(numberValue)))
}

function normalizeWeekday(value: unknown, fallback: number) {
  const numberValue = Number(value)
  if (!Number.isFinite(numberValue)) return fallback
  return Math.min(6, Math.max(0, Math.trunc(numberValue)))
}
</script>
