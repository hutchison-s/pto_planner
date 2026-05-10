<template>
  <section class="mt-5 rounded-section border border-red-200 bg-red-50 p-4 shadow-card sm:p-5">
    <p class="text-sm font-bold text-red-700">
      PTO balance warning
    </p>
    <p class="mt-1 text-sm text-red-700">
      Your balance is at or below 0 hours during:
    </p>
    <div class="mt-3 flex flex-wrap gap-2">
      <span
        v-for="range in ranges"
        :key="`${range.startDateKey}-${range.endDateKey}`"
        class="rounded-button border border-red-200 bg-white px-3 py-1.5 text-sm font-semibold text-red-700 shadow-card"
      >
        {{ formatRange(range) }}
      </span>
    </div>
  </section>
</template>

<script setup lang="ts">
export type ZeroBalanceRange = {
  startDate: Date
  startDateKey: string
  endDate: Date
  endDateKey: string
}

defineProps<{
  ranges: ZeroBalanceRange[]
}>()

function formatRange(range: ZeroBalanceRange) {
  if (range.startDateKey === range.endDateKey) {
    return formatDate(range.startDate)
  }

  return `${formatDate(range.startDate)} - ${formatDate(range.endDate)}`
}

function formatDate(date: Date) {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })
}
</script>
