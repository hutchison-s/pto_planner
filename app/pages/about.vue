<template>
  <PtoHeader
    subtitle="How the planner works"
    title="About"
  />

  <main class="mx-auto min-h-screen w-full max-w-3xl px-4 pb-8 pt-24 sm:px-6">
    <section class="rounded-section border border-brand-line bg-white p-5 shadow-soft sm:p-6">
      <p class="text-sm font-semibold text-brand-blue">
        PTO Planner
      </p>
      <h1 class="mt-1 text-2xl font-bold tracking-normal text-brand-ink sm:text-3xl">
        Plan time off without losing sight of your balance.
      </h1>
      <p class="mt-4 text-sm leading-6 text-brand-muted">
        This planner estimates your PTO balance using your starting balance, accrual schedule, balance corrections, planned PTO, and paid holidays. Everything is stored locally in this browser.
      </p>
    </section>

    <section class="mt-5 rounded-section border border-brand-line bg-white p-5 shadow-soft sm:p-6">
      <h2 class="text-lg font-bold text-brand-ink">
        Getting Started
      </h2>
      <ol class="mt-3 grid gap-3 text-sm leading-6 text-brand-muted">
        <li>
          <span class="font-semibold text-brand-ink">1. Set Initial values.</span>
          Add your starting balance, starting date, accrual amount, and accrual frequency in Settings.
        </li>
        <li>
          <span class="font-semibold text-brand-ink">2. Review paid holidays.</span>
          Enable the holidays your workplace pays for so those dates do not consume PTO.
        </li>
        <li>
          <span class="font-semibold text-brand-ink">3. Plan PTO.</span>
          Pick a date on the Planner and choose Full Day, Half Day, Hours, or Holiday.
        </li>
        <li>
          <span class="font-semibold text-brand-ink">4. Use corrections when needed.</span>
          If your real balance drifts, add a balance correction. It becomes the new balance anchor from that date forward.
        </li>
      </ol>
    </section>

    <section class="mt-5 rounded-section border border-brand-line bg-white p-5 shadow-soft sm:p-6">
      <h2 class="text-lg font-bold text-brand-ink">
        Calendar Colors
      </h2>
      <div class="mt-4 grid gap-2 text-sm text-brand-muted">
        <ColorKey swatch-class="bg-brand-limeSoft border-lime-200" label="Accrual day" />
        <ColorKey swatch-class="bg-brand-magenta border-brand-magenta" label="Full-day PTO" />
        <ColorKey swatch-class="bg-white border-brand-magenta" label="Partial PTO" />
        <ColorKey swatch-class="bg-amber-400 border-amber-300" label="Paid holiday" />
        <ColorKey swatch-class="bg-brand-orangeSoft border-orange-200" label="Balance below 8 hours" />
        <ColorKey swatch-class="bg-red-600 border-red-500" label="Balance at or below 0 hours" />
      </div>
    </section>

    <section class="mt-5 rounded-section border border-brand-line bg-white p-5 shadow-soft sm:p-6">
      <h2 class="text-lg font-bold text-brand-ink">
        Views
      </h2>
      <div class="mt-3 grid gap-3 text-sm leading-6 text-brand-muted">
        <p>
          <span class="font-semibold text-brand-ink">Planner</span> is the daily working view. Select dates, schedule PTO, mark one-off paid holidays, and watch the selected month update.
        </p>
        <p>
          <span class="font-semibold text-brand-ink">Summary</span> stacks compact monthly calendars and shows an end-of-week balance on the right side of each week.
        </p>
        <p>
          <span class="font-semibold text-brand-ink">Settings</span> controls initial setup, balance corrections, recurring paid holidays, and clearing browser data.
        </p>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { defineComponent, h } from 'vue'

const ColorKey = defineComponent({
  props: {
    label: {
      type: String,
      required: true
    },
    swatchClass: {
      type: String,
      required: true
    }
  },
  setup(props) {
    return () =>
      h('div', { class: 'flex items-center gap-3' }, [
        h('span', {
          class: [
            'h-5 w-5 rounded-lg border shadow-card',
            props.swatchClass
          ]
        }),
        h('span', props.label)
      ])
  }
})
</script>
