export type SaveToastState = 'idle' | 'saving' | 'saved' | 'error'

const saveToastState = ref<SaveToastState>('idle')
let saveToastTimer: ReturnType<typeof setTimeout> | null = null
let saveToastVersion = 0

export function useSaveToast() {
  return {
    saveToastState,
    showSaveError,
    showSaved,
    showSaving
  }
}

export function showSaving() {
  clearSaveToastTimer()
  saveToastVersion += 1
  saveToastState.value = 'saving'
  return saveToastVersion
}

export function showSaved(version = saveToastVersion) {
  if (version !== saveToastVersion) return

  clearSaveToastTimer()
  saveToastState.value = 'saved'
  saveToastTimer = setTimeout(() => {
    saveToastState.value = 'idle'
    saveToastTimer = null
  }, 1400)
}

export function showSaveError(version = saveToastVersion) {
  if (version !== saveToastVersion) return

  clearSaveToastTimer()
  saveToastState.value = 'error'
  saveToastTimer = setTimeout(() => {
    saveToastState.value = 'idle'
    saveToastTimer = null
  }, 2400)
}

function clearSaveToastTimer() {
  if (!saveToastTimer) return

  clearTimeout(saveToastTimer)
  saveToastTimer = null
}
