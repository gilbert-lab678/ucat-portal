// lib/cookie-consent.ts
//
// Small helper around localStorage so the consent banner and the
// "Manage cookie preferences" control on /cookies always agree on
// what the visitor has chosen.

export type CookieConsent = {
  essential: true
  analytics: boolean
  timestamp: string
}

const STORAGE_KEY = 'ucat-cookie-consent'
export const COOKIE_CONSENT_EVENT = 'ucat-cookie-consent-changed'

export function getCookieConsent(): CookieConsent | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as CookieConsent
  } catch {
    return null
  }
}

export function setCookieConsent(analytics: boolean) {
  if (typeof window === 'undefined') return
  const consent: CookieConsent = {
    essential: true,
    analytics,
    timestamp: new Date().toISOString(),
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(consent))
  window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_EVENT, { detail: consent }))
}

// Wipes the stored choice so the banner reappears — used by the
// "Manage cookie preferences" button on the Cookie Policy page.
export function clearCookieConsent() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(STORAGE_KEY)
  window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_EVENT, { detail: null }))
}
