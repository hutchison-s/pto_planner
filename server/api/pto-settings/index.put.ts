import { readBody } from 'h3'
import type { PtoSettings } from '../../../app/composables/usePtoSettings'
import { savePtoSettingsForUser } from '../../repositories/ptoSettings'
import { getRequiredUserId } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const userId = await getRequiredUserId(event)
  const body = await readBody<{ settings: PtoSettings }>(event)
  const settings = await savePtoSettingsForUser(userId, body.settings)

  return {
    settings
  }
})
