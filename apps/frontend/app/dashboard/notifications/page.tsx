"use client"

import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  CheckCheck,
  CheckCircle2,
  Info,
  Loader2,
} from 'lucide-react'

import DashboardLayout from '@/components/dashboard/layout'
import useNotificationStore, {
  type NotificationDetail,
} from '@/stores/notification-store'
import { getNotificationLink } from '@/lib/notification-link'
import { cn } from '@/lib/utils'

type Filter = 'all' | 'unread'

function formatRelative(dateString: string) {
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return ''

  const diffMs = Date.now() - date.getTime()
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`

  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() === new Date().getFullYear() ? undefined : 'numeric',
  })
}

function notificationVisual(type: NotificationDetail['type']) {
  switch (type) {
    case 'success':
      return {
        Icon: CheckCircle2,
        className:
          'bg-[#DFF0E4] text-[#17603F] dark:bg-[#1C3A2C] dark:text-[#B7E3C3]',
      }
    case 'warning':
      return {
        Icon: AlertTriangle,
        className:
          'bg-[#FBF1D0] text-[#8A6516] dark:bg-[#3A3120] dark:text-[#E8BC63]',
      }
    case 'danger':
      return {
        Icon: AlertTriangle,
        className:
          'bg-[#FBE4E4] text-[#9B2C2C] dark:bg-[#3A2020] dark:text-[#F0A9A9]',
      }
    default:
      return {
        Icon: Info,
        className: 'bg-content/[0.05] text-content/55',
      }
  }
}

export default function NotificationsPage() {
  const { notifications, markAsRead, markAllAsRead, isLoading } =
    useNotificationStore()
  const [filter, setFilter] = useState<Filter>('all')

  const unread = useMemo(
    () => notifications.filter((notification) => !notification.is_read),
    [notifications]
  )

  const visible = useMemo(
    () => (filter === 'unread' ? unread : notifications),
    [filter, notifications, unread]
  )

  const handleMarkAsRead = (id: string) => {
    void markAsRead(id).catch(() => {})
  }

  const handleMarkAllAsRead = () => {
    void markAllAsRead().catch(() => {})
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl space-y-5 pb-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-content/40">
              Inbox
            </p>
            <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-content sm:text-4xl">
              Notifications
            </h1>
            <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-content/50">
              {unread.length > 0
                ? `${unread.length} unread update${unread.length === 1 ? '' : 's'} across your cooperatives.`
                : 'Contributions, payouts and membership updates land here.'}
            </p>
          </div>

          {unread.length > 0 && (
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              disabled={isLoading}
              className="inline-flex h-10 min-h-0 min-w-0 items-center gap-2 rounded-full border border-content/15 px-4 text-xs font-semibold text-content transition-colors hover:border-content/30 hover:bg-content/[0.03] disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCheck className="h-3.5 w-3.5" />
              )}
              Mark all as read
            </button>
          )}
        </header>

        <div className="inline-flex rounded-full border border-content/10 bg-content/[0.02] p-1">
          {(
            [
              { key: 'all' as const, label: 'All', count: notifications.length },
              { key: 'unread' as const, label: 'Unread', count: unread.length },
            ] satisfies Array<{ key: Filter; label: string; count: number }>
          ).map((tab) => {
            const active = filter === tab.key
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFilter(tab.key)}
                className={cn(
                  'flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-colors',
                  active
                    ? 'bg-[#0E3B2E] text-white shadow-sm dark:bg-[#7FBF9C] dark:text-[#0B1712]'
                    : 'text-content/55 hover:text-content'
                )}
              >
                {tab.label}
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.5 text-[10px] font-bold',
                    active
                      ? 'bg-white/15 text-white dark:bg-[#0B1712]/10 dark:text-[#0B1712]'
                      : 'bg-content/[0.06] text-content/45'
                  )}
                >
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>

        <section className="overflow-hidden rounded-[24px] bg-surface shadow-[0_1px_2px_rgba(11,23,18,0.04)]">
          {isLoading && notifications.length === 0 ? (
            <div className="space-y-1 p-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-[86px] animate-pulse rounded-2xl bg-content/[0.04]"
                />
              ))}
            </div>
          ) : visible.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-content/[0.05] text-content/40">
                <Bell className="h-6 w-6" strokeWidth={1.8} />
              </div>
              <h2 className="mt-4 font-display text-lg font-bold tracking-tight text-content">
                {filter === 'unread'
                  ? 'No unread notifications'
                  : 'You’re all caught up'}
              </h2>
              <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-content/45">
                {filter === 'unread'
                  ? 'Everything here has been read. Switch to All to look back.'
                  : 'New contributions, payouts and membership updates will show up here.'}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-content/[0.06]">
              {visible.map((notification) => {
                const { Icon, className: iconClassName } = notificationVisual(
                  notification.type
                )
                const link = getNotificationLink(notification)
                return (
                  <li
                    key={notification.id}
                    id={notification.id}
                    className="group scroll-mt-24 transition-colors hover:bg-content/[0.02]"
                  >
                    <div className="flex items-start gap-3 px-5 py-4 sm:px-6">
                      <span
                        className={cn(
                          'mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                          iconClassName
                        )}
                      >
                        <Icon className="h-[18px] w-[18px]" />
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p
                            className={cn(
                              'text-sm',
                              notification.is_read
                                ? 'font-medium text-content/70'
                                : 'font-semibold text-content'
                            )}
                          >
                            {notification.title}
                          </p>
                          {!notification.is_read && (
                            <span className="rounded-full bg-[#DFF0E4] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#17603F] dark:bg-[#1C3A2C] dark:text-[#B7E3C3]">
                              New
                            </span>
                          )}
                          <time
                            dateTime={notification.created_at}
                            title={new Date(notification.created_at).toLocaleString()}
                            className="ml-auto shrink-0 text-[11px] text-content/35"
                          >
                            {formatRelative(notification.created_at)}
                          </time>
                        </div>

                        <p className="mt-1 text-sm leading-relaxed text-content/55">
                          {notification.message}
                        </p>

                        <div className="mt-2.5 flex flex-wrap items-center gap-2">
                          {!notification.is_read && (
                            <button
                              type="button"
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="inline-flex h-7 min-h-0 min-w-0 items-center gap-1.5 rounded-full border border-content/15 px-2.5 text-[11px] font-semibold text-content/60 transition-colors hover:bg-content/[0.04] hover:text-content"
                            >
                              <CheckCheck className="h-3 w-3" />
                              Mark as read
                            </button>
                          )}
                          <Link
                            href={link.href}
                            className="inline-flex h-7 min-h-0 min-w-0 items-center gap-1 rounded-full px-2.5 text-[11px] font-semibold text-[#0E3B2E] transition-colors hover:bg-content/[0.04] dark:text-[#7FBF9C]"
                          >
                            {link.label}
                            <ArrowRight className="h-3 w-3" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>
    </DashboardLayout>
  )
}
