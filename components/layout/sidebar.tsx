'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  BookOpen, 
  GraduationCap, 
  CheckSquare, 
  Video, 
  BarChart3, 
  Bot, 
  MessageSquare 
} from 'lucide-react'

export function Sidebar() {
  const currentPathname = usePathname()

  const navigationItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Question Bank', href: '/practice', icon: BookOpen },
    { name: 'Mock Exam', href: '/mock-exam', icon: GraduationCap },
    { name: 'Submit Marks', href: '/submit-marks', icon: CheckSquare },
    { name: 'Video and Materials', href: '/materials', icon: Video },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Ask Ubbie', href: '/ask-ubbie', icon: Bot },
    { name: 'Message Tutor', href: '/message-tutor', icon: MessageSquare },
  ]

  return (
    <aside className="w-64 bg-white dark:bg-[#0a0d14] border-r border-zinc-200 dark:border-zinc-800/80 flex flex-col justify-between shrink-0 min-h-screen transition-colors duration-200">
      <div>
        {/* Simplified Header Height matched with top navigation block alignment bar */}
        <div className="h-16 px-6 flex items-center bg-zinc-50/50 dark:bg-[#0d111a]/20 transition-colors">
          <h1 className="font-bold text-base tracking-tight text-zinc-900 dark:text-white">UCAT Portal</h1>
        </div>

        {/* Links Navigation Grid */}
        <nav className="p-4 space-y-1.5 mt-2">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const isActive = currentPathname === item.href
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
        v1.4.2 // Active Shell
      </div>
    </aside>
  )
}
