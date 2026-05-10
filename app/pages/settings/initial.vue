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
import { hasCompleteInitialSetup, type AccrualFrequency } from '~/composables/usePtoSettings'

const router = useRouter()
const { settings } = usePtoSettings()
const draft = ref({
  accrualAmount: settings.value.accrualAmount,
  accrualFrequency: settings.value.accrualFrequency,
  startingBalance: settings.value.startingBalance,
  startingDate: settings.value.startingDate
})
const savedSnapshot = computed(() => JSON.stringify({
  accrualAmount: settings.value.accrualAmount,
  accrualFrequency: settings.value.accrualFrequency,
  startingBalance: settings.value.startingBalance,
  startingDate: settings.value.startingDate
}))
const draftSnapshot = computed(() => JSON.stringify(draft.value))
const isDirty = computed(() => draftSnapshot.value !== savedSnapshot.value)
const { allowNextNavigation, confirmBack } = useSettingsDraftGuard(isDirty)

function save() {
  const nextSettings = {
    ...settings.value,
    accrualAmount: normalizeOptionalNumber(draft.value.accrualAmount),
    accrualFrequency: draft.value.accrualFrequency as AccrualFrequency | '',
    startingBalance: normalizeOptionalNumber(draft.value.startingBalance),
    startingDate: draft.value.startingDate
  }

  settings.value = {
    ...nextSettings,
    initialSetupComplete: hasCompleteInitialSetup(nextSettings)
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

function normalizeOptionalNumber(value: unknown) {
  if (value === null || value === undefined || value === '') return null

  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : null
}
</script>
