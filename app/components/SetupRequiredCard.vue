<template>
  <section class="rounded-section border border-brand-line bg-white p-5 shadow-soft sm:p-6">
    <p class="text-sm font-semibold text-brand-blue">
      Setup Required
    </p>
    <h1 class="mt-1 text-2xl font-bold tracking-normal text-brand-ink sm:text-3xl">
      Add your initial PTO balance to start planning.
    </h1>
    <p class="mt-3 text-sm leading-tight text-brand-muted sm:text-base">
      Set your starting balance, starting date, accrual amount, and accrual frequency in Settings.
    </p>
    <NuxtLink
      class="mt-5 inline-flex items-center justify-center rounded-button bg-brand-blue px-4 py-2 text-sm font-semibold text-white shadow-button transition hover:bg-brand-blueDark focus:outline-none focus:ring-4 focus:ring-brand-line"
      to="/settings"
    >
      Open Settings
    </NuxtLink>
  </section>
</template>
