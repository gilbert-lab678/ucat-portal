'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { Sun, Moon, ChevronDown, Key, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase'

interface NavbarProps {
  fullName: string
  title?: string
}

export function Navbar({ fullName, title = 'Dashboard Overview' }: NavbarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { resolvedTheme, setTheme } = useTheme()
  const router = useRouter()

  // next-themes doesn't know the real theme until after the client mounts
  // (it depends on localStorage, which the server can't see). Rendering
  // theme-dependent UI before that point risks a server/client mismatch,
  // so we hold off until `mounted` is true.
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const isDark = resolvedTheme === 'dark'

  return (
    <header className="h-16 bg-white dark:bg-[#0a0d14] border-b border-zinc-200 dark:border-zinc-800/80 px-8 flex items-center justify-between sticky top-0 z-40 transition-colors duration-200">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-white tracking-tight">
        {title}
      </h2>
      
      <div className="flex items-center gap-4">
        {/* Theme Switching Trigger */}
        <button 
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0d111a] hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-all cursor-pointer"
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {!mounted ? (
            <div className="h-4 w-4" />
          ) : isDark ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </button>

        {/* Profile Card Popover */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0d111a] hover:bg-zinc-100 dark:hover:bg-zinc-800 text-sm font-medium text-zinc-700 dark:text-zinc-200 transition-all cursor-pointer"
          >
            <div className="h-6 w-6 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-[11px] font-bold text-white shadow-sm">
              {fullName ? fullName.charAt(0).toUpperCase() : 'U'}
            </div>
            <span className="text-zinc-700 dark:text-zinc-200">{fullName || 'Student Account'}</span>
            <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
          </button>

          {dropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
              <div className="absolute right-0 mt-2 w-48 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0d111a] shadow-2xl p-1.5 z-50 animate-in fade-in duration-100">
                <button
                  onClick={() => { setDropdownOpen(false); router.push('/settings?tab=security'); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 text-left font-medium cursor-pointer"
                >
                  <Key className="h-3.5 w-3.5 text-zinc-400" />
                  Change Password
                </button>
                <hr className="border-zinc-200 dark:border-zinc-800 my-1" />
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs rounded-lg text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-left font-medium cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Log Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
