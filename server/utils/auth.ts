import { createError, type H3Event } from 'h3'
import { getNeonAuthSession } from './neonAuth'

export async function getRequiredUserId(event: H3Event) {
  const session = await getNeonAuthSession(event)
  const userId = session?.user.id ?? session?.session.userId

  if (!userId) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication required'
    })
  }

  return userId
}
