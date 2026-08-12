import { ApiError } from "@/lib/api-error"
import { emitAuthInvalidated } from "@/lib/auth/events"


type RequestOptions = RequestInit & {
  skipAuthRedirect?: boolean
}


const API_BASE = "/api"


async function request<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {

  const {
    skipAuthRedirect,
    ...fetchOptions
  } = options


  const isFormData = fetchOptions.body instanceof FormData


  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",

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


  // if (!response.ok) {

  //   const body = await response
  //     .text()
  //     .catch(() => "")


  //   throw new Error(
  //     `API request failed (${response.status}): ${body}`
  //   )
  // }

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
      `API request failed (${response.status}): ${raw}`
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

}


export default ApiService