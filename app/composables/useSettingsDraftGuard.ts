import { onBeforeRouteLeave } from 'vue-router'
import { ref } from 'vue'
import type { ComputedRef } from 'vue'

export function useSettingsDraftGuard(isDirty: ComputedRef<boolean>) {
  const skipNextPrompt = ref(false)

  onBeforeRouteLeave(() => {
    if (skipNextPrompt.value) return true
    if (!isDirty.value) return true
    return window.confirm('You have unsaved changes. Leave without saving?')
  })

  function confirmBack() {
    if (!isDirty.value) return true
    return window.confirm('You have unsaved changes. Leave without saving?')
  }

  return {
    allowNextNavigation,
    confirmBack
  }

  function allowNextNavigation() {
    skipNextPrompt.value = true
  }
}
