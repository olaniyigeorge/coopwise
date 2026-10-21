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

type NavbarProps = {
  /**
   * Render a block that reserves the fixed header's height. Pass `false` when
   * the section underneath already paints its own background all the way to
   * the top of the page (the homepage hero does) so the header can float over
   * it without leaving a bare strip.
   */
  reserveSpace?: boolean
}

export default function Navbar({ reserveSpace = true }: NavbarProps) {
  const pathname = usePathname()
  const { isAuthenticated, user, logout } = useAuthStore()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
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
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,box-shadow] duration-300",
          scrolled
            ? "border-b border-brand-ink/10 bg-brand-paper/90 shadow-[0_14px_34px_-30px_rgba(11,23,18,0.65)] backdrop-blur-md"
            : "border-b border-brand-ink/[0.06] bg-brand-paper/70 backdrop-blur-sm"
        )}
      >
        <nav className="relative z-10 mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:h-20 sm:px-6 lg:px-8">
          <Link href="/" className="flex shrink-0 items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-brand-ink/10 bg-white/70 sm:h-9 sm:w-9">
              <Image
                src="/images/coopwise-logo.svg"
                alt=""
                width={22}
                height={22}
                className="h-5 w-5 sm:h-[22px] sm:w-[22px]"
              />
            </span>
            <span className="font-display text-[17px] font-bold tracking-tight text-brand-ink sm:text-lg">
              CoopWise
            </span>
          </Link>

          {/* Links sit in the true centre of the bar, independent of how wide
              the logo or the account controls grow. */}
          <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 md:flex">
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
                  className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#0E3B2E] px-4 text-[13px] font-semibold text-white transition-colors hover:bg-[#0B1712]"
                >
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  Dashboard
                </Link>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      aria-label="Account menu"
                      className="flex items-center gap-1 rounded-full p-0.5 transition-colors hover:bg-brand-ink/[0.05]"
                    >
                      <UserAvatar
                        name={user?.full_name ?? "Member"}
                        src={user?.profile_picture_url}
                        size="sm"
                      />
                      <ChevronDown className="mr-0.5 h-3.5 w-3.5 text-brand-ink/40" />
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
                  <Button className="h-9 rounded-full bg-[#0E3B2E] px-4 text-[13px] font-semibold text-white hover:bg-[#0B1712]">
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
      </header>

      {/* Mobile sheet lives outside the header so the header's backdrop blur
          doesn't turn into a containing block for the fixed overlay. */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Close menu"
              className="fixed inset-0 z-40 cursor-default bg-brand-ink/20 backdrop-blur-[2px] md:hidden"
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
              className="fixed inset-x-4 top-[4.5rem] z-50 overflow-hidden rounded-2xl border border-brand-ink/10 bg-brand-paper p-3 shadow-[0_30px_60px_-30px_rgba(11,23,18,0.45)] sm:inset-x-6 sm:top-[5.5rem] md:hidden"
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

      {/* Reserve the fixed header's height so page content starts below it. */}
      {reserveSpace && <div aria-hidden className="h-16 sm:h-20" />}
    </>
  )
}
