import { appendHeader, createError, getHeader, getRequestURL, readRawBody, type H3Event } from 'h3'
import { loadLocalEnvFiles } from './localEnv'

export type NeonAuthSession = {
  session: {
    id: string
    token?: string
    userId?: string
  }
  user: {
    id: string
    email?: string
    name?: string
  }
}

// Parse and cache once at module load
const getNeonAuthBaseUrl = (() => {
  let cached: string | null = null

  return (): string => {
    if (cached) return cached

    loadLocalEnvFiles()

    const raw = process.env.NEON_AUTH_BASE_URL || process.env.VITE_NEON_AUTH_URL
    if (!raw) {
      throw createError({ statusCode: 500, statusMessage: 'NEON_AUTH_BASE_URL is required' })
    }

    let url: URL
    try {
      url = new URL(raw)
    } catch {
      throw createError({ statusCode: 500, statusMessage: 'NEON_AUTH_BASE_URL must be a valid http(s) URL' })
    }

    if (!['http:', 'https:'].includes(url.protocol)) {
      throw createError({ statusCode: 500, statusMessage: 'NEON_AUTH_BASE_URL must use http or https' })
    }

    cached = url.href.replace(/\/$/, '')
    return cached
  }
})()

export { getNeonAuthBaseUrl }

export async function proxyNeonAuthRequest(event: H3Event, path: string) {
  const response = await fetch(`${getNeonAuthBaseUrl()}${path}`, {
    body: allowsBody(event.method) ? await readRawBody(event, false) : undefined,
    headers: getForwardedHeaders(event),
    method: event.method,
  })

  forwardSetCookieHeaders(event, response)

  const body = await parseResponseBody(response)

  if (!response.ok) {
    throw createError({
      data: body,
      statusCode: response.status,
      statusMessage: extractMessage(body) ?? response.statusText,
    })
  }

  return body
}

export async function getNeonAuthSession(event: H3Event): Promise<NeonAuthSession | null> {
  let response: Response

  try {
    response = await fetch(`${getNeonAuthBaseUrl()}/get-session`, {
      headers: getForwardedHeaders(event),
      method: 'GET',
    })
  } catch (err) {
    console.warn('[neon-auth] /get-session fetch failed:', err)
    return null
  }

  forwardSetCookieHeaders(event, response)
  if (!response.ok) return null

  const body = await response.json().catch(() => null)
  return body?.data ?? body ?? null
}

// --- Helpers ---

function getForwardedHeaders(event: H3Event): Record<string, string> {
  const headers: Record<string, string> = { accept: 'application/json' }

  const forward = (name: string, key = name) => {
    const val = getHeader(event, name)
    if (val) headers[key] = val
  }

  forward('content-type')
  forward('cookie')
  forward('referer')
  forward('user-agent')
  forward('x-forwarded-for')

  const origin = getClientOrigin(event)
  if (origin) headers.origin = origin

  return headers
}

function getClientOrigin(event: H3Event): string | undefined {
  const origin = getHeader(event, 'origin')
  if (origin && origin !== 'null') return origin

  return getRequestURL(event).origin
}

function forwardSetCookieHeaders(event: H3Event, response: Response) {
  // getSetCookie() is available in Node 18+ and handles comma-in-value correctly
  const cookies: string[] = typeof (response.headers as any).getSetCookie === 'function'
    ? (response.headers as any).getSetCookie()
    : splitSetCookieHeader(response.headers.get('set-cookie'))

  for (const cookie of cookies) {
    appendHeader(event, 'set-cookie', stripCookieDomain(cookie))
  }
}

function splitSetCookieHeader(value: string | null): string[] {
  if (!value) return []
  // Heuristic split — only reliable when cookie values don't contain commas
  return value.split(/,(?=\s*[^;,]+=)/g)
}

function stripCookieDomain(cookie: string): string {
  return cookie.replace(/;\s*Domain=[^;]+/i, '')
}

function allowsBody(method?: string): boolean {
  return method !== 'GET' && method !== 'HEAD'
}

async function parseResponseBody(response: Response): Promise<unknown> {
  const ct = response.headers.get('content-type') ?? ''
  if (ct.includes('application/json')) {
    return response.json().catch(() => null)
  }
  return response.text()
}

function extractMessage(body: unknown): string | undefined {
  if (typeof body === 'object' && body !== null && 'message' in body) {
    return String((body as Record<string, unknown>).message)
  }
}
