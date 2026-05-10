import { createError, defineEventHandler } from 'h3'
import { clearNeonAuthCookies, proxyNeonAuthRequest } from '../../utils/neonAuth'

export default defineEventHandler(async (event) => {
  const path = event.context.params?.all
  const authPath = `/${Array.isArray(path) ? path.join('/') : path ?? ''}`

  if (authPath === '/') {
    throw createError({ statusCode: 400, statusMessage: 'Auth path is required' })
  }

  if (authPath === '/sign-out') {
    try {
      return await proxyNeonAuthRequest(event, authPath)
    } finally {
      clearNeonAuthCookies(event)
    }
  }

  return proxyNeonAuthRequest(event, authPath)
})
