
export const AUTH_EVENTS = {
  INVALIDATED: "auth:invalidated",
} as const


export function emitAuthInvalidated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new Event(AUTH_EVENTS.INVALIDATED)
    )
  }
}