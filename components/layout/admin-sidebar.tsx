'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, UserCheck, Users, Layers, BookOpen, GraduationCap, Video, MessageSquare, Bell, ShieldCheck,
} from 'lucide-react'

export function AdminSidebar() {
  const currentPathname = usePathname()

  const navigationItems = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard, exact: true },
    { name: 'Approvals', href: '/admin/approvals', icon: UserCheck },
    { name: 'Students', href: '/admin/students', icon: Users },
    { name: 'Class Codes', href: '/admin/classes', icon: Layers },
    { name: 'Mock Exams', href: '/admin/mocks', icon: GraduationCap },
    { name: 'Materials', href: '/admin/materials', icon: Video },
    { name: 'Tutor Inbox', href: '/admin/tutor', icon: MessageSquare },
    { name: 'Notifications', href: '/admin/notifications', icon: Bell },
  ]

  return (
    <aside className="w-64 bg-white dark:bg-[#0a0d14] border-r border-zinc-200 dark:border-zinc-800/80 flex flex-col justify-between shrink-0 min-h-screen transition-colors duration-200">
      <div>
        <div className="h-16 px-6 flex items-center gap-2 bg-zinc-50/50 dark:bg-[#0d111a]/20 transition-colors">
          <ShieldCheck className="h-4 w-4 text-indigo-500" />
          <h1 className="font-bold text-base tracking-tight text-zinc-900 dark:text-white">Admin</h1>
        </div>

        <nav className="p-4 space-y-1.5 mt-2">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const isActive = item.exact
              ? currentPathname === item.href
              : currentPathname === item.href || currentPathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                    : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-zinc-400'}`} />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-zinc-200 dark:border-zinc-800/50 bg-zinc-50 dark:bg-[#07090f] text-center text-xs text-zinc-400 dark:text-zinc-500 font-mono transition-colors">
        Tutor view
      </div>
    </aside>
  )
}
