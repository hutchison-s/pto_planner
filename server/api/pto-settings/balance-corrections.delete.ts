import { resetBalanceCorrectionsForUser } from '../../repositories/ptoSettings'
import { getRequiredUserId } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const userId = await getRequiredUserId(event)
  await resetBalanceCorrectionsForUser(userId)

  return {
    ok: true
  }
})
