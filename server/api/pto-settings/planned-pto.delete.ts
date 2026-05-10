import { resetPlannedPtoForUser } from '../../repositories/ptoSettings'
import { getRequiredUserId } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const userId = await getRequiredUserId(event)
  await resetPlannedPtoForUser(userId)

  return {
    ok: true
  }
})
