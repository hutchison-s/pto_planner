<template>
  <PtoHeader
    subtitle="Preferences and data"
    title="Settings"
  />

  <main class="mx-auto min-h-screen w-full max-w-3xl px-4 pb-8 pt-24 sm:px-6">
    <section class="grid gap-4">
      <article
        v-for="section in sections"
        :key="section.to"
        class="rounded-section border border-brand-line bg-white p-5 shadow-soft sm:p-6"
      >
        <div class="flex items-start justify-between gap-4">
          <div class="min-w-0">
            <p class="text-sm font-semibold text-brand-blue">
              {{ section.eyebrow }}
            </p>
            <h2 class="mt-1 text-xl font-bold tracking-normal text-brand-ink">
              {{ section.title }}
            </h2>
            <p class="mt-2 text-sm leading-6 text-brand-muted">
              {{ section.summary }}
            </p>
          </div>

          <NuxtLink
            class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-button border border-brand-blue bg-white text-brand-blue shadow-card transition hover:bg-brand-blueSoft focus:outline-none focus:ring-4 focus:ring-brand-line"
            :aria-label="`Edit ${section.title}`"
            :to="section.to"
          >
            <Pencil class="h-4 w-4" aria-hidden="true" />
          </NuxtLink>
        </div>
      </article>
    </section>
  </main>
</template>

<script setup lang="ts">
import { Pencil } from 'lucide-vue-next'
import { computed } from 'vue'
import { frequencyLabelFor } from '~/utils/settingsFormat'

const { settings } = usePtoSettings()

const sections = computed(() => [
  {
    eyebrow: 'Initial',
    title: 'PTO accrual setup',
    summary: initialSummary.value,
    to: '/settings/initial'
  },
  {
    eyebrow: 'Adjustments',
    title: 'Balance corrections',
    summary: adjustmentsSummary.value,
    to: '/settings/adjustments'
  },
  {
    eyebrow: 'Paid Holidays',
    title: 'Company holidays',
    summary: `${settings.value.paidHolidayIds.length} recurring holidays enabled. One-off holiday dates can be added from the Planner.`,
    to: '/settings/holidays'
  },
  {
    eyebrow: 'Clear Data',
    title: 'Reset this planner',
    summary: 'Clear your initial setup, corrections, paid holidays, and scheduled PTO from this browser.',
    to: '/settings/clear-data'
  }
])

const initialSummary = computed(() => {
  if (!settings.value.initialSetupComplete) return 'Not set up yet.'

  return `${formatHours(Number(settings.value.startingBalance ?? 0))}h starting ${formatDate(settings.value.startingDate)}, accruing ${formatHours(Number(settings.value.accrualAmount ?? 0))}h ${frequencyLabelFor(settings.value.accrualFrequency).toLowerCase()}.`
})

const adjustmentsSummary = computed(() => {
  const count = settings.value.balanceAdjustments.length
  if (count === 0) return 'No balance corrections.'

  return `${count} balance correction${count === 1 ? '' : 's'} saved.`
})

function formatDate(value: string) {
  if (!value) return 'not set'

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
