"use client"

import { useCallback, useEffect, useState } from "react"
import { Download, RefreshCw, WifiOff, X } from "lucide-react"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

const DISMISS_KEY = "coopwise:install-dismissed"

/**
 * Registers the service worker and owns the app-level PWA chrome:
 * offline notice, update prompt and the install invitation.
 */
export function PwaProvider() {
  const [online, setOnline] = useState(true)
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [installDismissed, setInstallDismissed] = useState(true)
  const [updateReady, setUpdateReady] = useState(false)
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)

  useEffect(() => {
    setOnline(navigator.onLine)
    try {
      setInstallDismissed(window.localStorage.getItem(DISMISS_KEY) === "1")
    } catch {
      setInstallDismissed(false)
    }

    const goOnline = () => setOnline(true)
    const goOffline = () => setOnline(false)
    window.addEventListener("online", goOnline)
    window.addEventListener("offline", goOffline)
    return () => {
      window.removeEventListener("online", goOnline)
      window.removeEventListener("offline", goOffline)
    }
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    if (!("serviceWorker" in navigator)) return
    // Dev uses Turbopack's HMR; caching there makes edits look stale.
    if (process.env.NODE_ENV !== "production") return

    let disposed = false

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((reg) => {
        if (disposed) return
        setRegistration(reg)

        if (reg.waiting) setUpdateReady(true)

        reg.addEventListener("updatefound", () => {
          const installing = reg.installing
          if (!installing) return
          installing.addEventListener("statechange", () => {
            if (installing.state === "installed" && navigator.serviceWorker.controller) {
              setUpdateReady(true)
            }
          })
        })
      })
      .catch(() => {
        // Registration failures are non-fatal; the app works as a website.
      })

    return () => {
      disposed = true
    }
  }, [])

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault()
      setInstallEvent(event as BeforeInstallPromptEvent)
    }
    const onInstalled = () => {
      setInstallEvent(null)
      setInstallDismissed(true)
    }

    window.addEventListener("beforeinstallprompt", onPrompt)
    window.addEventListener("appinstalled", onInstalled)
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt)
      window.removeEventListener("appinstalled", onInstalled)
    }
  }, [])

  const dismissInstall = useCallback(() => {
    setInstallDismissed(true)
    try {
      window.localStorage.setItem(DISMISS_KEY, "1")
    } catch {
      /* storage may be unavailable in private mode */
    }
  }, [])

  const install = useCallback(async () => {
    if (!installEvent) return
    await installEvent.prompt()
    const choice = await installEvent.userChoice
    if (choice.outcome === "accepted") {
      setInstallEvent(null)
      setInstallDismissed(true)
    } else {
      dismissInstall()
    }
  }, [installEvent, dismissInstall])

  const applyUpdate = useCallback(() => {
    const waiting = registration?.waiting
    if (!waiting) {
      window.location.reload()
      return
    }
    navigator.serviceWorker.addEventListener(
      "controllerchange",
      () => window.location.reload(),
      { once: true }
    )
    waiting.postMessage({ type: "SKIP_WAITING" })
  }, [registration])

  const showInstall = Boolean(installEvent) && !installDismissed

  return (
    <>
      {!online && (
        <div
          role="status"
          className="fixed inset-x-3 top-3 z-[100] mx-auto flex max-w-md items-center justify-center gap-2 rounded-full border border-brand-gold/30 bg-brand-ink px-4 py-2.5 text-xs font-medium text-brand-paper shadow-lg"
        >
          <WifiOff className="h-3.5 w-3.5 text-brand-gold" />
          You&apos;re offline — showing saved pages
        </div>
      )}

      <div className="pointer-events-none fixed inset-x-3 bottom-4 z-[90] mx-auto flex max-w-md flex-col items-stretch gap-2">
        {updateReady && (
          <div className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-content/10 bg-surface px-4 py-3 shadow-lg">
            <RefreshCw className="h-4 w-4 shrink-0 text-[#0E3B2E] dark:text-[#7FBF9C]" />
            <p className="min-w-0 flex-1 text-xs font-medium text-content">
              A new version of CoopWise is ready.
            </p>
            <button
              type="button"
              onClick={applyUpdate}
              className="inline-flex h-8 min-h-0 min-w-0 shrink-0 items-center rounded-full bg-[#0E3B2E] px-3 text-[11px] font-semibold text-white dark:bg-[#7FBF9C] dark:text-[#0B1712]"
            >
              Refresh
            </button>
          </div>
        )}

        {showInstall && (
          <div className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-content/10 bg-surface px-4 py-3 shadow-lg">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0E3B2E] text-[#E8BC63]">
              <Download className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-content">Install CoopWise</p>
              <p className="text-[11px] text-content/50">
                Faster access, works offline.
              </p>
            </div>
            <button
              type="button"
              onClick={install}
              className="inline-flex h-8 min-h-0 min-w-0 shrink-0 items-center rounded-full bg-[#0E3B2E] px-3 text-[11px] font-semibold text-white dark:bg-[#7FBF9C] dark:text-[#0B1712]"
            >
              Install
            </button>
            <button
              type="button"
              onClick={dismissInstall}
              aria-label="Dismiss install prompt"
              className="flex h-7 w-7 min-h-0 min-w-0 shrink-0 items-center justify-center rounded-full text-content/40 transition-colors hover:bg-content/[0.06] hover:text-content"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </>
  )
}
