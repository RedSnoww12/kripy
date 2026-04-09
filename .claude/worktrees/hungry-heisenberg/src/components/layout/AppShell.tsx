import type { ReactNode } from 'react'
import { BottomNav } from './BottomNav'

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen pb-24 max-w-lg mx-auto">
      <main className="px-4 pt-4">{children}</main>
      <BottomNav />
    </div>
  )
}
