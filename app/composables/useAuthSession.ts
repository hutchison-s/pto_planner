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

  logAuth('refresh:start')

  authRefreshPromise = $fetch<AuthSessionResponse | null>('/api/auth/get-session')
    .then((response) => {
      authUser.value = response?.user ?? null
      isAuthReady.value = true
      logAuth('refresh:success', response)
      return authUser.value
    })
    .catch((error) => {
      authUser.value = null
      isAuthReady.value = true
      logAuth('refresh:error', error)
      return null
    })
    .finally(() => {
      authRefreshPromise = null
    })

  return authRefreshPromise
}

async function signOut() {
  logAuth('sign-out:start', authUser.value)
  await $fetch('/api/auth/sign-out', {
    method: 'POST',
    body: {}
  })
    .then((response) => logAuth('sign-out:success', response))
    .catch((error) => logAuth('sign-out:error', error))
  authUser.value = null
  logAuth('sign-out:cleared')
  await navigateTo('/login')
}

function logAuth(event: string, payload?: unknown) {
  if (!import.meta.dev || import.meta.server) return

  console.info(`[auth] ${event}`, sanitizeAuthLogPayload(payload))
}

function sanitizeAuthLogPayload(payload: unknown): unknown {
  if (!payload || typeof payload !== 'object') return payload

  if ('user' in payload || 'session' in payload) {
    const response = payload as AuthSessionResponse
    return {
      session: response.session
        ? {
            id: maskValue(response.session.id)
          }
        : null,
      user: response.user
        ? {
            id: maskValue(response.user.id),
            email: response.user.email,
            name: response.user.name
          }
        : null
    }
  }

  if ('id' in payload) {
    const user = payload as AuthUser
    return {
      id: maskValue(user.id),
      email: user.email,
      name: user.name
    }
  }

  return payload
}

function maskValue(value?: string) {
  if (!value) return value
  if (value.length <= 8) return '***'

  return `${value.slice(0, 4)}...${value.slice(-4)}`
}
