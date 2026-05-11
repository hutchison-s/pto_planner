<template>
  <Transition name="save-toast">
    <div
      v-if="saveToastState !== 'idle'"
      class="pointer-events-none fixed inset-x-0 bottom-5 z-50 flex justify-center px-4"
      role="status"
      aria-live="polite"
    >
      <div class="flex min-w-36 items-center justify-center gap-2 rounded-button border border-brand-blue bg-brand-blueSoft px-4 py-2 text-sm font-bold text-brand-blueDark shadow-soft">
        <span
          v-if="saveToastState === 'saving'"
          class="inline-flex items-center"
        >
          Saving<span class="saving-dots" aria-hidden="true"><span>.</span><span>.</span><span>.</span></span>
        </span>

        <span
          v-else-if="saveToastState === 'saved'"
          class="inline-flex items-center gap-2"
        >
          <Check class="saved-check h-4 w-4 text-brand-blueDark" aria-hidden="true" />
          Saved
        </span>

        <span
          v-else
          class="text-brand-orange"
        >
          Save failed
        </span>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { Check } from 'lucide-vue-next'

const { saveToastState } = useSaveToast()
</script>

<style scoped>
.saving-dots span {
  animation: saving-dot 0.9s infinite;
  opacity: 0.2;
}

.saving-dots span:nth-child(2) {
  animation-delay: 0.15s;
}

.saving-dots span:nth-child(3) {
  animation-delay: 0.3s;
}

.saved-check {
  animation: saved-check-bounce 420ms cubic-bezier(0.34, 1.56, 0.64, 1);
  transform-origin: center;
}

.save-toast-enter-active,
.save-toast-leave-active {
  transition: opacity 260ms ease, transform 260ms ease;
}

.save-toast-enter-from {
  opacity: 0;
  transform: translateY(0.75rem);
}

.save-toast-leave-to {
  opacity: 0;
  transform: translateY(-0.75rem);
}

@keyframes saving-dot {
  0%,
  80%,
  100% {
    opacity: 0.2;
  }

  40% {
    opacity: 1;
  }
}

@keyframes saved-check-bounce {
  0% {
    opacity: 0;
    transform: scale(0.45);
  }

  65% {
    opacity: 1;
    transform: scale(1.25);
  }

  100% {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
