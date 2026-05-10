<template>
  <article class="rounded-xl bg-brand-blueSoft px-2 py-2">
    <p class="text-[11px] font-semibold leading-tight text-brand-muted sm:text-xs">
      {{ label }}
    </p>
    <p class="mt-1 text-base font-bold leading-tight tracking-normal text-brand-ink sm:text-lg">
      {{ formatHours(value) }}h
    </p>
  </article>
</template>

<script setup lang="ts">
defineProps<{
  label: string
  value: number
}>()

function formatHours(value: number) {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2
  }).format(value)
}
</script>
