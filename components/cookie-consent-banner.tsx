'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  COOKIE_CONSENT_EVENT,
  getCookieConsent,
  setCookieConsent,
} from '@/lib/cookie-consent'

// Mount this once, in app/layout.tsx, so it appears on every page:
//
//   import { CookieConsentBanner } from '@/components/cookie-consent-banner'
//   ...
//   <body>
//     {children}
//     <CookieConsentBanner />
//   </body>
//
// It blocks nothing by itself — pair it with a check in your analytics
// init code, e.g. only calling `inject()` / firing GA's script tag
// after `getCookieConsent()?.analytics === true`.

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [analyticsChoice, setAnalyticsChoice] = useState(true)

  useEffect(() => {
    const check = () => setVisible(getCookieConsent() === null)
    check()

    window.addEventListener(COOKIE_CONSENT_EVENT, check)
    window.addEventListener('storage', check)
    return () => {
      window.removeEventListener(COOKIE_CONSENT_EVENT, check)
      window.removeEventListener('storage', check)
    }
  }, [])

  if (!visible) return null

  const acceptAll = () => {
    setCookieConsent(true)
    setVisible(false)
  }

  const rejectNonEssential = () => {
    setCookieConsent(false)
    setVisible(false)
  }

  const savePreferences = () => {
    setCookieConsent(analyticsChoice)
    setVisible(false)
  }

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie preferences"
      className="fixed z-50 bottom-4 left-4 right-4 sm:left-auto sm:right-5 sm:bottom-5 sm:w-[360px]"
    >
      <div className="rounded-2xl border border-white/[0.1] bg-[#0a0b10]/80 backdrop-blur-2xl shadow-[inset_0_1px_2px_rgba(255,255,255,0.08),_0_16px_50px_rgba(0,0,0,0.85)] p-4">
        <p className="text-[13px] leading-relaxed text-zinc-300">
          We use essential cookies to stay signed in, and — with permission — analytics cookies to
          see how the portal is used.{' '}
          <Link href="/cookies" className="text-sky-400 hover:text-sky-300 underline underline-offset-2">
            Cookie Policy
          </Link>
        </p>

        {expanded && (
          <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5">
            <div>
              <p className="text-xs font-medium text-zinc-200">Analytics cookies</p>
              <p className="text-[11px] text-zinc-500 mt-0.5">Helps us see which pages are useful.</p>
            </div>
            <button
              role="switch"
              aria-checked={analyticsChoice}
              onClick={() => setAnalyticsChoice((v) => !v)}
              className={`relative inline-flex h-6 w-10 shrink-0 items-center rounded-full transition-colors duration-200 ${
                analyticsChoice ? 'bg-sky-500' : 'bg-zinc-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                  analyticsChoice ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        )}

        <div className="mt-3 flex flex-col gap-2">
          <button
            onClick={acceptAll}
            className="w-full rounded-full bg-sky-500 hover:bg-sky-400 text-[#030407] font-semibold text-[13px] px-4 py-2 transition-colors duration-200"
          >
            Accept all
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={rejectNonEssential}
              className="flex-1 rounded-full text-zinc-400 hover:text-zinc-200 font-medium text-[13px] px-4 py-2 transition-colors duration-200"
            >
              Reject
            </button>

            {expanded ? (
              <button
                onClick={savePreferences}
                className="flex-1 rounded-full border border-white/[0.1] hover:border-sky-400/40 text-zinc-300 hover:text-white font-medium text-[13px] px-4 py-2 transition-colors duration-200"
              >
                Save
              </button>
            ) : (
              <button
                onClick={() => setExpanded(true)}
                className="flex-1 rounded-full border border-white/[0.1] hover:border-sky-400/40 text-zinc-300 hover:text-white font-medium text-[13px] px-4 py-2 transition-colors duration-200"
              >
                Customise
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
