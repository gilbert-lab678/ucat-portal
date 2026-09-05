'use client'

import { useState } from 'react'
import { clearCookieConsent } from '@/lib/cookie-consent'

export function ManagePreferencesButton() {
  const [cleared, setCleared] = useState(false)

  return (
    <button
      onClick={() => {
        clearCookieConsent()
        setCleared(true)
      }}
      className="inline-flex items-center gap-2 rounded-full border border-white/[0.1] hover:border-sky-400/40 text-zinc-300 hover:text-white font-medium text-sm px-5 py-2.5 transition-colors duration-200"
    >
      {cleared ? 'Preferences reset — check the banner below' : 'Manage cookie preferences'}
    </button>
  )
}
