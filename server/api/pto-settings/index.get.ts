import { getPtoSettingsForUser } from '../../repositories/ptoSettings'
import { getRequiredUserId } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const userId = await getRequiredUserId(event)
  const settings = await getPtoSettingsForUser(userId)

  return {
    settings
  }
})
