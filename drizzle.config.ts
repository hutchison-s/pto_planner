import { defineConfig } from 'drizzle-kit'
import { existsSync, readFileSync } from 'node:fs'

loadLocalEnvFile('.env.local')
loadLocalEnvFile('.env')

export default defineConfig({
  schema: './server/db/schema.ts',
  out: './server/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? ''
  }
})

function loadLocalEnvFile(path: string) {
  if (!existsSync(path)) return

  const lines = readFileSync(path, 'utf8').split('\n')
  for (const line of lines) {
    const trimmedLine = line.trim()
    if (!trimmedLine || trimmedLine.startsWith('#')) continue

    const separatorIndex = trimmedLine.indexOf('=')
    if (separatorIndex === -1) continue

    const key = trimmedLine.slice(0, separatorIndex).trim()
    const value = trimmedLine.slice(separatorIndex + 1).trim().replace(/^["']|["']$/g, '')
    if (key && !process.env[key]) {
      process.env[key] = value
    }
  }
}
