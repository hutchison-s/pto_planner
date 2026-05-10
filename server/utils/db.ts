import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from '../db/schema'
import { loadLocalEnvFiles } from './localEnv'

type Database = ReturnType<typeof drizzle<typeof schema>>

let database: Database | null = null

export function getDb() {
  if (database) return database

  loadLocalEnvFiles()

  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required for database access.')
  }

  database = drizzle(neon(databaseUrl), { schema })
  return database
}
