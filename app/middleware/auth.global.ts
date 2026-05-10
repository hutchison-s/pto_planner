const publicRoutes = new Set(['/about', '/login', '/signup'])

export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return
  if (to.path.startsWith('/api')) return

  const { refreshSession } = useAuthSession()

  if (publicRoutes.has(to.path)) {
    refreshSession() // fire and forget — sets isAuthReady without blocking
    return
  }

  const user = await refreshSession()

  if (!user) {
    return navigateTo({
      path: '/login',
      query: { redirect: to.fullPath }
    })
  }
})