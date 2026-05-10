import { resetPtoSettingsForUser } from '../../repositories/ptoSettings'
import { getRequiredUserId } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const userId = await getRequiredUserId(event)
  await resetPtoSettingsForUser(userId)

  return {
    ok: true
  }
})
