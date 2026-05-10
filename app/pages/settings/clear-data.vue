<template>
  <SettingsEditShell title="Clear Data" @back="handleBack">
    <p class="text-sm font-semibold text-brand-orange">
      Clear Data
    </p>
    <h1 class="mt-1 text-2xl font-bold tracking-normal text-brand-ink">
      Reset planner data
    </h1>

    <div class="mt-5 rounded-card border border-orange-200 bg-brand-orangeSoft px-4 py-3 text-sm text-brand-ink">
      Reset actions update data stored in your account and cannot be undone. Choose the smallest reset that matches what you need to clear.
    </div>

    <section class="mt-5 grid gap-3">
      <article
        v-for="option in resetOptions"
        :key="option.id"
        class="rounded-card border border-brand-line bg-white p-4 shadow-card"
      >
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div class="min-w-0">
            <h2 class="text-base font-bold tracking-normal text-brand-ink">
              {{ option.title }}
            </h2>
            <p class="mt-1 text-sm leading-6 text-brand-muted">
              {{ option.description }}
            </p>
          </div>

          <button
            class="inline-flex shrink-0 items-center justify-center rounded-button border border-brand-orange bg-white px-4 py-2 text-sm font-semibold text-brand-orange shadow-card transition hover:bg-brand-orangeSoft focus:outline-none focus:ring-4 focus:ring-brand-line"
            type="button"
            @click="option.action"
          >
            {{ option.buttonLabel }}
          </button>
        </div>
      </article>
    </section>

    <button
      class="mt-5 rounded-button border border-brand-line bg-white px-4 py-2 text-sm font-semibold text-brand-blue shadow-card transition hover:bg-brand-blueSoft focus:outline-none focus:ring-4 focus:ring-brand-line"
      type="button"
      @click="cancel"
    >
      Cancel
    </button>
  </SettingsEditShell>
</template>

<script setup lang="ts">
const router = useRouter()
const { resetBalanceCorrections, resetPlannedPto, resetSettings } = usePtoSettings()

const resetOptions = [
  {
    id: 'planned-pto',
    title: 'Reset planned PTO',
    description: 'Clears all scheduled PTO days and custom hour entries. Initial setup, balance corrections, and paid holidays stay intact.',
    buttonLabel: 'Reset PTO',
    action: clearPlannedPto
  },
  {
    id: 'balance-corrections',
    title: 'Reset balance corrections',
    description: 'Clears the correction ledger so balances calculate from the initial setup, accruals, holidays, and planned PTO only.',
    buttonLabel: 'Reset corrections',
    action: clearBalanceCorrections
  },
  {
    id: 'all-data',
    title: 'Reset all',
    description: 'Clears initial setup, balance corrections, paid holidays, and scheduled PTO from your account.',
    buttonLabel: 'Reset all',
    action: clearAllData
  }
]

function clearPlannedPto() {
  if (!window.confirm('Reset all planned PTO? This cannot be undone.')) return
  resetPlannedPto()
  router.push('/settings')
}

function clearBalanceCorrections() {
  if (!window.confirm('Reset all balance corrections? This cannot be undone.')) return
  resetBalanceCorrections()
  router.push('/settings')
}

function clearAllData() {
  if (!window.confirm('Reset all planner data? This cannot be undone.')) return
  resetSettings()
  router.push('/settings')
}

function cancel() {
  router.push('/settings')
}

function handleBack() {
  router.push('/settings')
}
</script>
