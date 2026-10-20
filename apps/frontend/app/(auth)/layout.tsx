import React from 'react'

// Auth screens render their own full-bleed shell (see AuthShell), so the
// route-group layout stays out of the way.
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
