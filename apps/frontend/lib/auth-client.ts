import useAuthStore from '@/stores/auth-store'

const channel = typeof window !== 'undefined' ? new BroadcastChannel('auth') : null

channel?.addEventListener('message', (event) => {
  if (event.data?.type === 'auth:changed') {
    useAuthStore.getState().checkAuth()
  }
})

export function broadcastAuthChanged() {
  channel?.postMessage({ type: 'auth:changed' })
}

/** Wrapper for calls to your own /api/* routes. Cookies ride along automatically
 *  for same-origin requests — nothing to attach client-side. */
export async function apiFetch(input: RequestInfo, init?: RequestInit): Promise<Response> {
  const res = await fetch(input, init)
  if (res.status === 401) {
    useAuthStore.getState().clearAuthLocal()
    broadcastAuthChanged() // so other tabs drop their stale "authenticated" state too
  }
  return res
}