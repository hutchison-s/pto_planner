<template>
  <div
    class="fixed inset-0 z-40 flex items-center justify-center bg-brand-ink/30 px-4"
    @click.self="$emit('close')"
  >
    <section
      aria-modal="true"
      class="w-full max-w-sm rounded-section border border-brand-line bg-white p-4 shadow-soft sm:p-5"
      role="dialog"
    >
      <div class="flex items-center justify-between gap-3">
        <h2 class="text-base font-bold text-brand-ink">
          Custom Hours
        </h2>
        <button
          aria-label="Close custom hours"
          class="inline-flex h-8 w-8 items-center justify-center rounded-button border border-brand-line bg-white text-brand-blue shadow-card transition hover:bg-brand-blueSoft focus:outline-none focus:ring-4 focus:ring-brand-line"
          type="button"
          @click="$emit('close')"
        >
          <X class="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <label class="mt-4 grid gap-1">
        <span class="text-xs font-semibold leading-tight text-brand-muted">
          PTO hours
        </span>
        <input
          :value="modelValue"
          class="h-11 rounded-card border border-brand-line bg-white px-3 text-sm font-semibold text-brand-ink outline-none transition focus:border-brand-blue focus:ring-4 focus:ring-brand-line"
          min="0"
          step="0.25"
          type="number"
          @input="$emit('update:modelValue', Number(($event.target as HTMLInputElement).value))"
        >
      </label>

      <div class="mt-4 grid grid-cols-3 gap-2">
        <button
          class="rounded-button border border-brand-line bg-white px-4 py-2 text-sm font-semibold text-brand-blue shadow-card transition hover:bg-brand-blueSoft focus:outline-none focus:ring-4 focus:ring-brand-line"
          type="button"
          @click="$emit('clear')"
        >
          Clear
        </button>
        <button
          class="rounded-button border border-brand-line bg-white px-4 py-2 text-sm font-semibold text-brand-blue shadow-card transition hover:bg-brand-blueSoft focus:outline-none focus:ring-4 focus:ring-brand-line"
          type="button"
          @click="$emit('close')"
        >
          Cancel
        </button>
        <button
          class="rounded-button bg-brand-blue px-4 py-2 text-sm font-semibold text-white shadow-button transition hover:bg-brand-blueDark focus:outline-none focus:ring-4 focus:ring-brand-line"
          type="button"
          @click="$emit('save')"
        >
          Save
        </button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { X } from 'lucide-vue-next'

defineEmits<{
  clear: []
  close: []
  save: []
  'update:modelValue': [value: number]
}>()

defineProps<{
  modelValue: number
}>()
</script>
