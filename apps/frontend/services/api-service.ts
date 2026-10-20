import { ApiError } from "@/lib/api-error"
import { emitAuthInvalidated } from "@/lib/auth/events"


type RequestOptions = RequestInit & {
  skipAuthRedirect?: boolean
  /** In-memory cache TTL for GETs, in ms. Defaults to 15s; 0 disables. */
  cacheTtlMs?: number
  /** Bypass the in-memory cache for this call. */
  force?: boolean
}


const API_BASE = "/api"

/**
 * A dashboard load fans out into a dozen API calls (cooperatives, members,
 * rules, trust, notifications…). Without a shared cache those calls repeat on
 * every navigation and burn through the backend's token bucket, which is what
 * produced the 429s. Two small guards live here:
 *
 *  1. identical in-flight GETs share one request;
 *  2. successful GETs are kept briefly (15s by default) and the whole cache is
 *     dropped whenever a mutation succeeds.
 */
const DEFAULT_GET_TTL_MS = 15_000
const inflight = new Map<string, Promise<unknown>>()
const responseCache = new Map<string, { expiresAt: number; value: unknown }>()

/** Cap concurrent requests so a page mount can't burst the API. */
const MAX_CONCURRENT_REQUESTS = 6
let activeRequests = 0
const waiters: Array<() => void> = []

function acquireSlot(): Promise<void> {
  if (activeRequests < MAX_CONCURRENT_REQUESTS) {
    activeRequests += 1
    return Promise.resolve()
  }
  return new Promise((resolve) => {
    waiters.push(() => {
      activeRequests += 1
      resolve()
    })
  })
}

function releaseSlot() {
  activeRequests = Math.max(0, activeRequests - 1)
  const next = waiters.shift()
  if (next) next()
}

function invalidateCache() {
  responseCache.clear()
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Retry-After is either seconds or an HTTP date; mirror both. */
function retryAfterMs(response: Response, attempt: number) {
  const header = response.headers.get("Retry-After")
  if (header) {
    const seconds = Number(header)
    if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000)
    const date = Date.parse(header)
    if (!Number.isNaN(date)) return Math.max(0, date - Date.now())
  }
  return Math.min(4000, 600 * 2 ** attempt) + Math.random() * 250
}

async function fetchWithRetry(
  input: string,
  init: RequestInit
): Promise<Response> {
  const method = (init.method ?? "GET").toUpperCase()
  const canRetry = method === "GET" || method === "HEAD"
  const maxRetries = canRetry ? 2 : 0

  for (let attempt = 0; ; attempt += 1) {
    await acquireSlot()
    let response: Response
    try {
      response = await fetch(input, init)
    } finally {
      releaseSlot()
    }

    if (response.status !== 429 || attempt >= maxRetries) {
      return response
    }

    await sleep(retryAfterMs(response, attempt))
  }
}

async function request<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {

  const {
    skipAuthRedirect,
    cacheTtlMs,
    force,
    ...fetchOptions
  } = options

  const method = (fetchOptions.method ?? "GET").toUpperCase()
  const isGet = method === "GET"
  const url = `${API_BASE}${path}`

  if (isGet && !force) {
    const ttl = cacheTtlMs ?? DEFAULT_GET_TTL_MS
    const cached = responseCache.get(url)
    if (ttl > 0 && cached && cached.expiresAt > Date.now()) {
      return cached.value as T
    }

    const pending = inflight.get(url)
    if (pending) {
      return pending as Promise<T>
    }
  }

  const run = async (): Promise<T> => {
    const isFormData = fetchOptions.body instanceof FormData

    const response = await fetchWithRetry(url, {
      credentials: "include",
      cache: "no-store",

      headers: isFormData
        ? {
            ...(fetchOptions.headers || {}),
          }
        : {
            "Content-Type": "application/json",
            ...(fetchOptions.headers || {}),
          },

      ...fetchOptions,
    })

    /**
     * Session expired / invalid.
     *
     * This means:
     * - proxy could not refresh token
     * - backend rejected auth
     *
     * Notify client stores.
     */
    if (response.status === 401) {

      if (!skipAuthRedirect) {
        emitAuthInvalidated()
      }

      throw new Error(
        "Authentication expired"
      )
    }

    if (!response.ok) {
      const raw = await response.text().catch(() => "")
      let parsed: unknown = raw
      try {
        parsed = raw ? JSON.parse(raw) : null
      } catch {
        // not JSON — leave as raw text
      }

      throw new ApiError(
        response.status,
        parsed,
        response.status === 429
          ? "Too many requests right now. Please wait a moment and try again."
          : `API request failed (${response.status}): ${raw}`
      )
    }

    /**
     * FastAPI uses 204 for successful mutations.
     *
     * Calling response.json()
     * on an empty body throws:
     *
     * Unexpected end of JSON input
     */
    if (response.status === 204) {
      return null as T
    }

    return response.json() as Promise<T>
  }

  const work = run()
    .then((value) => {
      if (!isGet) {
        invalidateCache()
      } else if (!force) {
        const ttl = cacheTtlMs ?? DEFAULT_GET_TTL_MS
        if (ttl > 0) {
          responseCache.set(url, { expiresAt: Date.now() + ttl, value })
        }
      }
      return value
    })
    .finally(() => {
      if (isGet) inflight.delete(url)
    })

  if (isGet && !force) {
    inflight.set(url, work)
  }

  return work
}



const ApiService = {

  get<T>(
    path: string,
    options?: RequestOptions
  ) {
    return request<T>(
      path,
      {
        method: "GET",
        ...options,
      }
    )
  },


  post<T>(
    path: string,
    body?: unknown,
    options?: RequestOptions
  ) {
    return request<T>(
      path,
      {
        method: "POST",
        body: body instanceof FormData
          ? body
          : body !== undefined
            ? JSON.stringify(body)
            : undefined,
        ...options,
      }
    )
  },

  put<T>(
    path: string,
    body?: unknown,
    options?: RequestOptions
  ) {
    return request<T>(
      path,
      {
        method: "PUT",
        body: body instanceof FormData
          ? body
          : body !== undefined
            ? JSON.stringify(body)
            : undefined,
        ...options,
      }
    )
  },


  patch<T>(
    path: string,
    body?: unknown,
    options?: RequestOptions
  ) {
    return request<T>(
      path,
      {
        method: "PATCH",
        body: body instanceof FormData
          ? body
          : body !== undefined
            ? JSON.stringify(body)
            : undefined,
        ...options,
      }
    )
  },

  delete<T>(
    path: string,
    options?: RequestOptions
  ) {
    return request<T>(
      path,
      {
        method: "DELETE",
        ...options,
      }
    )
  },

  /** Drop the in-memory GET cache (e.g. after a websocket update). */
  invalidateCache,

}


export default ApiService
