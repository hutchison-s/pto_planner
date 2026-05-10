import { createError, defineEventHandler } from 'h3'
import { proxyNeonAuthRequest } from '../../utils/neonAuth'

export default defineEventHandler((event) => {
  const path = event.context.params?.all
  const authPath = `/${Array.isArray(path) ? path.join('/') : path ?? ''}`

  if (authPath === '/') {
    throw createError({ statusCode: 400, statusMessage: 'Auth path is required' })
  }

  return proxyNeonAuthRequest(event, authPath)
})