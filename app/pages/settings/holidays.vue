<template>
  <SettingsEditShell title="Paid Holidays" @back="handleBack">
    <p class="text-sm font-semibold text-brand-blue">
      Paid Holidays
    </p>
    <h1 class="mt-1 text-2xl font-bold tracking-normal text-brand-ink">
      Company holidays
    </h1>
    <p class="mt-3 rounded-card border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      Enabled holidays show with a gold background and do not use PTO hours.
    </p>

    <form class="mt-5 grid gap-4" @submit.prevent="save">
      <label
        v-for="holiday in holidayDefinitions"
        :key="holiday.id"
        class="flex items-center justify-between gap-3 rounded-card border border-brand-lineSoft bg-white px-4 py-3 shadow-card"
      >
        <span class="text-sm font-semibold text-brand-ink">
          {{ holiday.label }}
        </span>
        <input
          class="h-5 w-5 rounded border-brand-line text-brand-blue focus:ring-brand-line"
          :checked="draftPaidHolidayIds.includes(holiday.id)"
          type="checkbox"
          @change="toggleHoliday(holiday.id)"
        >
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
import { holidayDefinitions } from '~/utils/holidays'

const router = useRouter()
const { settings } = usePtoSettings()
const draftPaidHolidayIds = ref([...settings.value.paidHolidayIds])
const savedSnapshot = computed(() => JSON.stringify([...settings.value.paidHolidayIds].sort()))
const draftSnapshot = computed(() => JSON.stringify([...draftPaidHolidayIds.value].sort()))
const isDirty = computed(() => draftSnapshot.value !== savedSnapshot.value)
const { allowNextNavigation, confirmBack } = useSettingsDraftGuard(isDirty)

function toggleHoliday(id: string) {
  draftPaidHolidayIds.value = draftPaidHolidayIds.value.includes(id)
    ? draftPaidHolidayIds.value.filter((holidayId) => holidayId !== id)
    : [...draftPaidHolidayIds.value, id]
}

function save() {
  settings.value = {
    ...settings.value,
    paidHolidayIds: draftPaidHolidayIds.value
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
</script>
