type AuthUser = {
  id: string
  email?: string
  name?: string
}

type AuthSessionResponse = {
  session: {
    id: string
  }
  user: AuthUser
}

const authUser = ref<AuthUser | null>(null)
const isAuthReady = ref(false)
let authRefreshPromise: Promise<AuthUser | null> | null = null

export function useAuthSession() {
  return {
    authUser,
    isAuthReady,
    refreshSession,
    signOut
  }
}

async function refreshSession() {
  if (authRefreshPromise) return authRefreshPromise

  authRefreshPromise = $fetch<AuthSessionResponse | null>('/api/auth/get-session')
    .then((response) => {
      authUser.value = response?.user ?? null
      isAuthReady.value = true
      return authUser.value
    })
    .catch(() => {
      authUser.value = null
      isAuthReady.value = true
      return null
    })
    .finally(() => {
      authRefreshPromise = null
    })

  return authRefreshPromise
}

async function signOut() {
  await $fetch('/api/auth/sign-out', { method: 'POST' }).catch(() => null)
  authUser.value = null
  await navigateTo('/login')
}
