"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import {
  ArrowRight,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  User,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { UserAvatar } from "@/components/ui/user-avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "@/components/ui/use-toast"
import useAuthStore from "@/stores/auth-store"
import { cn } from "@/lib/utils"

const NAV_LINKS = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/about-us", label: "About" },
  { href: "/support", label: "Support" },
]

export default function Navbar() {
  const pathname = usePathname()
  const { isAuthenticated, user, logout } = useAuthStore()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  // Close the mobile sheet after navigating.
  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  const firstName = (user?.full_name ?? "").split(" ")[0]

  const handleLogout = () => {
    logout()
    toast({
      title: "Signed out",
      description: "Your ledger is safe. Come back soon.",
    })
    window.location.replace("/signin")
  }

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 px-3 py-3 sm:px-4 sm:py-4">
        <nav
          className={cn(
            "mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 rounded-2xl border px-3 transition-all duration-300 sm:h-16 sm:px-5",
            scrolled
              ? "border-brand-ink/10 bg-brand-paper/95 shadow-[0_18px_40px_-28px_rgba(11,23,18,0.55)] backdrop-blur-md"
              : "border-brand-ink/[0.06] bg-brand-paper/70 backdrop-blur-sm"
          )}
        >
          <Link href="/" className="flex shrink-0 items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-brand-ink/10 bg-white/70">
              <Image
                src="/images/coopwise-logo.svg"
                alt=""
                width={22}
                height={22}
                className="h-[22px] w-[22px]"
              />
            </span>
            <span className="font-display text-lg font-bold tracking-tight text-brand-ink">
              CoopWise
            </span>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((link) => {
              const active = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "relative rounded-full px-3.5 py-2 text-[13px] font-medium transition-colors",
                    active
                      ? "text-brand-ink"
                      : "text-brand-ink/55 hover:text-brand-ink"
                  )}
                >
                  {link.label}
                  {active && (
                    <span className="absolute inset-x-3.5 -bottom-0.5 h-px bg-brand-gold" />
                  )}
                </Link>
              )
            })}
          </div>

          <div className="hidden items-center gap-2 md:flex">
            {isAuthenticated ? (
              <>
                <Link
                  href="/dashboard"
                  className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[#0E3B2E] px-4 text-[13px] font-semibold text-white transition-colors hover:bg-[#0B1712]"
                >
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  Dashboard
                </Link>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      aria-label="Account menu"
                      className="flex items-center gap-1.5 rounded-full p-0.5 transition-colors hover:bg-brand-ink/[0.05]"
                    >
                      <UserAvatar
                        name={user?.full_name ?? "Member"}
                        src={user?.profile_picture_url}
                        size="sm"
                      />
                      <ChevronDown className="mr-1 h-3.5 w-3.5 text-brand-ink/40" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="mt-2 w-52">
                    <DropdownMenuLabel className="truncate">
                      {firstName || "My account"}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/account" className="cursor-pointer py-2.5">
                        <User className="mr-2 h-4 w-4" />
                        Account
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="cursor-pointer py-2.5 text-red-600 focus:text-red-600"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Link
                  href="/signin"
                  className="rounded-full px-3.5 py-2 text-[13px] font-medium text-brand-ink/60 transition-colors hover:text-brand-ink"
                >
                  Sign in
                </Link>
                <Link href="/signup">
                  <Button className="h-10 rounded-full bg-[#0E3B2E] px-5 text-[13px] font-semibold text-white hover:bg-[#0B1712]">
                    Get started
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            className="flex h-10 w-10 items-center justify-center rounded-full text-brand-ink transition-colors hover:bg-brand-ink/[0.05] md:hidden"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </nav>

        <AnimatePresence>
          {menuOpen && (
            <>
              <motion.button
                type="button"
                aria-label="Close menu"
                className="fixed inset-0 z-40 cursor-default bg-brand-ink/25 backdrop-blur-[2px] md:hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMenuOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="relative z-50 mx-auto mt-2 w-full max-w-6xl overflow-hidden rounded-2xl border border-brand-ink/10 bg-brand-paper p-3 shadow-[0_30px_60px_-30px_rgba(11,23,18,0.45)] md:hidden"
              >
                <div className="flex flex-col">
                  {NAV_LINKS.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center justify-between rounded-xl px-3 py-3 text-sm font-medium text-brand-ink/75 transition-colors hover:bg-brand-ink/[0.04] hover:text-brand-ink"
                    >
                      {link.label}
                      <ArrowRight className="h-3.5 w-3.5 text-brand-ink/25" />
                    </Link>
                  ))}
                </div>

                <div className="mt-2 border-t border-brand-ink/10 pt-3">
                  {isAuthenticated ? (
                    <div className="space-y-2">
                      <Link href="/dashboard" onClick={() => setMenuOpen(false)}>
                        <Button className="h-11 w-full rounded-xl bg-[#0E3B2E] text-sm font-semibold text-white">
                          <LayoutDashboard className="h-4 w-4" />
                          Go to dashboard
                        </Button>
                      </Link>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-500/[0.06]"
                      >
                        <LogOut className="h-4 w-4" />
                        Log out
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        href="/signin"
                        onClick={() => setMenuOpen(false)}
                        className="flex h-11 items-center justify-center rounded-xl border border-brand-ink/15 text-sm font-semibold text-brand-ink/70"
                      >
                        Sign in
                      </Link>
                      <Link href="/signup" onClick={() => setMenuOpen(false)}>
                        <Button className="h-11 w-full rounded-xl bg-[#0E3B2E] text-sm font-semibold text-white">
                          Get started
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </header>

      {/* Reserve the fixed header's height. */}
      <div className="h-[68px] sm:h-[80px]" />
    </>
  )
}
