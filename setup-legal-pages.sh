#!/usr/bin/env bash
set -e

# Run this from the ROOT of your Next.js project
# (the folder that contains your existing app/ and components/ folders).

mkdir -p "app"
mkdir -p "app/privacy"
mkdir -p "app/cookies"
mkdir -p "app/cookies"
mkdir -p "app/terms"
mkdir -p "components"
mkdir -p "components/legal"
mkdir -p "components/legal"
mkdir -p "lib"

cat > "app/page.tsx" << 'FILE_EOF'
'use client'

import Link from 'next/link'
import ConstellationGrid from "@/components/ui/constellation-grid"
import { CookieConsentBanner } from "@/components/cookie-consent-banner"

export default function LandingPage() {
  const glassButtonClass = "w-full group relative px-8 py-3.5 rounded-full font-semibold tracking-wide text-sm bg-white/[0.01] border border-white/[0.08] hover:border-sky-400/40 backdrop-blur-2xl transition-all duration-500 overflow-hidden text-center shadow-[inset_0_1px_2px_rgba(255,255,255,0.06),_0_12px_40px_rgba(0,0,0,0.8)]"
  const glossOverlayTrack = "absolute inset-0 bg-gradient-to-r from-sky-500/20 via-blue-500/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-[1200ms] ease-out pointer-events-none"
  const glassTextProps = "relative z-10 text-zinc-300 group-hover:text-white transition-all duration-300"

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-hidden bg-[#030407] text-white select-none font-sans">

      <div className="relative flex flex-1 flex-col items-center justify-center px-4">
        <div className="absolute inset-0 z-0 w-full h-full">
          <ConstellationGrid />
        </div>

        <div className="absolute inset-0 z-10 bg-gradient-to-b from-[#030407]/20 via-transparent to-[#030407]/70 pointer-events-none" />

        <div className="relative z-20 text-center px-4 max-w-4xl">
          <h1 className="text-6xl sm:text-8xl font-black tracking-tighter mb-6 cursor-default">
            <span className="bg-gradient-to-b from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]">
              UCAT Portal
            </span>
          </h1>

          <p className="text-zinc-400 text-sm sm:text-base font-medium tracking-normal mb-12 max-w-xs mx-auto leading-relaxed drop-shadow-[0_2px_8px_rgba(3,4,7,0.95)]">
            Master your examinations with the ultimate premium adaptive practice workflow interface.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 w-full max-w-xs sm:max-w-md mx-auto">
            <Link href="/login" className={glassButtonClass}>
              <div className={glossOverlayTrack} />
              <span className={glassTextProps}>Log In</span>
            </Link>

            <Link href="/login?mode=signup" className={glassButtonClass}>
              <div className={glossOverlayTrack} />
              <span className={glassTextProps}>Sign Up</span>
            </Link>
          </div>
        </div>
      </div>

      <footer className="relative z-20 border-t border-white/[0.06] px-6 py-6 sm:px-10">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <p className="text-xs text-zinc-600">© {new Date().getFullYear()} UCAT Portal</p>
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <Link href="/privacy" className="text-xs text-zinc-500 hover:text-white transition-colors duration-150">
              Privacy Policy
            </Link>
            <Link href="/cookies" className="text-xs text-zinc-500 hover:text-white transition-colors duration-150">
              Cookie Policy
            </Link>
            <Link href="/terms" className="text-xs text-zinc-500 hover:text-white transition-colors duration-150">
              Terms & Conditions
            </Link>
          </nav>
        </div>
      </footer>

      <CookieConsentBanner />
    </div>
  )
}
FILE_EOF
echo "Created app/page.tsx"

cat > "app/privacy/page.tsx" << 'FILE_EOF'
import { LegalShell } from '@/components/legal/legal-shell'
import { Section, P, List, Callout, Placeholder } from '@/components/legal/legal-content'
import Link from 'next/link'

export const metadata = {
  title: 'Privacy Policy | UCAT Portal',
}

const sections = [
  { id: 'who-we-are', label: 'Who we are' },
  { id: 'what-we-collect', label: 'What we collect' },
  { id: 'how-we-use-it', label: 'How we use it' },
  { id: 'cookies', label: 'Cookies' },
  { id: 'sharing', label: 'Sharing your data' },
  { id: 'storage-security', label: 'Storage & security' },
  { id: 'retention', label: 'How long we keep it' },
  { id: 'your-rights', label: 'Your rights' },
  { id: 'minors', label: 'Under 18s' },
  { id: 'changes', label: 'Changes' },
  { id: 'contact', label: 'Contact us' },
]

export default function PrivacyPolicyPage() {
  return (
    <LegalShell
      eyebrow="Legal"
      title="Privacy Policy"
      lastUpdated="5 September 2026"
      intro="This explains what personal information UCAT Portal collects when you use the platform, why we collect it, and how you can access, correct, or delete it."
      sections={sections}
      currentHref="/privacy"
    >
      <Section id="who-we-are" number={1} title="Who we are">
        <P>
          UCAT Portal is operated by <Placeholder>your name</Placeholder>, a sole trader
          (<Placeholder>ABN, if registered</Placeholder>) providing online tutoring and practice
          resources for students preparing for the UCAT. This policy applies to everyone who
          creates an account or otherwise uses the site.
        </P>
        <P>
          As a sole trader with annual turnover under $3 million, UCAT Portal isn\u2019t currently
          required to comply with the Australian Privacy Principles under the Privacy Act 1988
          (Cth) — most small businesses are exempt. We\u2019ve chosen to follow those principles
          voluntarily anyway, because it\u2019s the right way to handle students\u2019 information.
        </P>
      </Section>

      <Section id="what-we-collect" number={2} title="What we collect">
        <P>We collect information in three ways: what you give us, what you generate by using the platform, and what your browser sends automatically.</P>
        <List
          items={[
            <>
              <strong className="text-zinc-300">Account details</strong> — your name and email
              address when you sign up, and your approval status as a student, managed through our
              authentication provider (Supabase).
            </>,
            <>
              <strong className="text-zinc-300">Study data</strong> — mock exam scores you submit,
              lesson attendance and history, homework requirements, and any comments left by your
              tutor.
            </>,
            <>
              <strong className="text-zinc-300">Usage data</strong> — pages visited, session
              length, and general interaction data, collected through analytics tools (see our{' '}
              <Link href="/cookies" className="text-sky-400 hover:text-sky-300 underline underline-offset-2">
                Cookie Policy
              </Link>
              ).
            </>,
            <>
              <strong className="text-zinc-300">Technical data</strong> — IP address, browser
              type, and device information, collected automatically by our hosting provider for
              security and performance.
            </>,
          ]}
        />
      </Section>

      <Section id="how-we-use-it" number={3} title="How we use it">
        <P>We use your information to:</P>
        <List
          items={[
            'Create and secure your account, and confirm you\u2019re an approved student before granting access.',
            'Show you your own progress — scores, trends, and lesson history — on your dashboard.',
            'Let tutors track homework, attendance, and give feedback.',
            'Understand how the platform is used, so we can fix problems and improve it.',
            'Meet legal and record-keeping obligations.',
          ]}
        />
        <P>
          We don\u2019t sell personal information, and we don\u2019t use your study data for
          anything beyond running and improving the platform.
        </P>
      </Section>

      <Section id="cookies" number={4} title="Cookies">
        <P>
          We use essential cookies to keep you signed in, and — only with your consent — analytics
          cookies to understand usage patterns. You can accept, reject, or customize these at any
          time. Full detail is in our{' '}
          <Link href="/cookies" className="text-sky-400 hover:text-sky-300 underline underline-offset-2">
            Cookie Policy
          </Link>
          .
        </P>
      </Section>

      <Section id="sharing" number={5} title="Sharing your data">
        <P>
          We share personal information only with service providers who help us run the platform,
          under contracts that require them to protect it:
        </P>
        <List
          items={[
            <><strong className="text-zinc-300">Supabase</strong> — authentication and database hosting.</>,
            <><strong className="text-zinc-300">Analytics providers</strong> — usage analytics (only if you\u2019ve consented).</>,
          ]}
        />
        <P>
          UCAT Portal is run by a single tutor, so your study data isn\u2019t shared with anyone
          beyond the service providers above — it stays between you and your tutor. We don\u2019t
          share it with third parties for their own marketing purposes, and only disclose it
          beyond this if required by law.
        </P>
      </Section>

      <Section id="storage-security" number={6} title="Storage & security">
        <P>
          Data is stored with Supabase, using row-level security so that students can only ever
          read their own study data (tutors and admins have separate, restricted access). We use
          industry-standard encryption in transit and at rest, but no online system is perfectly
          secure — if we become aware of a data breach affecting you, we\u2019ll notify you and the
          relevant authority as required by law.
        </P>
      </Section>

      <Section id="retention" number={7} title="How long we keep it">
        <P>
          We keep account and study data for as long as your account is active, and for a
          reasonable period after in case you re-enrol or as needed for record-keeping. You can
          request deletion at any time — see below.
        </P>
      </Section>

      <Section id="your-rights" number={8} title="Your rights">
        <P>You can ask us to:</P>
        <List
          items={[
            'Give you a copy of the personal information we hold about you.',
            'Correct information that\u2019s wrong or out of date.',
            'Delete your account and associated data, subject to any legal retention requirements.',
            'Withdraw analytics consent at any time, without affecting essential functionality.',
          ]}
        />
        <P>
          To make a request, email us at <Placeholder>privacy@example.com</Placeholder>. We\u2019ll
          respond within a reasonable time, generally within 30 days.
        </P>
      </Section>

      <Section id="minors" number={9} title="Under 18s">
        <Callout>
          Many students are under 18. Where a student is a minor, we recommend a parent or
          guardian reviews this policy with them. Parents or guardians can contact us using the
          details below to make privacy requests on a minor\u2019s behalf.
        </Callout>
      </Section>

      <Section id="changes" number={10} title="Changes to this policy">
        <P>
          We may update this policy as the platform changes. If we make a material change, we\u2019ll
          let you know by email or via a notice on the dashboard before it takes effect.
        </P>
      </Section>

      <Section id="contact" number={11} title="Contact us">
        <P>
          Questions about this policy or your data can be sent to{' '}
          <Placeholder>privacy@example.com</Placeholder>.
        </P>
      </Section>
    </LegalShell>
  )
}
FILE_EOF
echo "Created app/privacy/page.tsx"

cat > "app/cookies/page.tsx" << 'FILE_EOF'
import { LegalShell } from '@/components/legal/legal-shell'
import { Section, P, List } from '@/components/legal/legal-content'
import { ManagePreferencesButton } from './manage-preferences-button'
import Link from 'next/link'

export const metadata = {
  title: 'Cookie Policy | UCAT Portal',
}

const sections = [
  { id: 'what-are-cookies', label: 'What are cookies' },
  { id: 'what-we-use', label: 'What we use' },
  { id: 'third-party', label: 'Third-party cookies' },
  { id: 'your-choices', label: 'Your choices' },
  { id: 'changes', label: 'Changes' },
]

export default function CookiePolicyPage() {
  return (
    <LegalShell
      eyebrow="Legal"
      title="Cookie Policy"
      lastUpdated="5 September 2026"
      intro="This explains the small files stored on your device when you use UCAT Portal, what they do, and how to control them."
      sections={sections}
      currentHref="/cookies"
    >
      <Section id="what-are-cookies" number={1} title="What are cookies">
        <P>
          Cookies are small text files a website stores on your device. They let a site remember
          things between visits — like keeping you signed in — or help us understand how the site
          is used.
        </P>
      </Section>

      <Section id="what-we-use" number={2} title="What we use">
        <P>We keep this simple — there are two categories, and only one needs your permission.</P>
        <List
          items={[
            <>
              <strong className="text-zinc-300">Essential (always on)</strong> — set by Supabase
              to keep you signed in and your session secure. The platform doesn\u2019t work without
              these, so they aren\u2019t optional.
            </>,
            <>
              <strong className="text-zinc-300">Analytics (opt-in)</strong> — set by our analytics
              provider to see which pages are used and spot problems. These only load after you
              accept them in the cookie banner.
            </>,
          ]}
        />
      </Section>

      <Section id="third-party" number={3} title="Third-party cookies">
        <P>
          Our analytics tooling (for example Vercel Analytics, Google Analytics, or Plausible,
          depending on what\u2019s active at any given time) may set its own cookies once you\u2019ve
          consented. These providers process data under their own privacy policies — see our{' '}
          <Link href="/privacy" className="text-sky-400 hover:text-sky-300 underline underline-offset-2">
            Privacy Policy
          </Link>{' '}
          for how we choose and manage third parties.
        </P>
      </Section>

      <Section id="your-choices" number={4} title="Your choices">
        <P>
          When you first visit, a banner lets you accept all cookies, reject non-essential ones, or
          customize analytics specifically. You can change your mind at any time here:
        </P>
        <ManagePreferencesButton />
        <P>
          You can also block or delete cookies directly in your browser settings, though this may
          sign you out of the platform.
        </P>
      </Section>

      <Section id="changes" number={5} title="Changes">
        <P>
          If the cookies we use change materially, we\u2019ll update this page and, where required,
          ask for your consent again.
        </P>
      </Section>
    </LegalShell>
  )
}
FILE_EOF
echo "Created app/cookies/page.tsx"

cat > "app/cookies/manage-preferences-button.tsx" << 'FILE_EOF'
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
FILE_EOF
echo "Created app/cookies/manage-preferences-button.tsx"

cat > "app/terms/page.tsx" << 'FILE_EOF'
import { LegalShell } from '@/components/legal/legal-shell'
import { Section, P, List, Callout, Placeholder } from '@/components/legal/legal-content'

export const metadata = {
  title: 'Terms & Conditions | UCAT Portal',
}

const sections = [
  { id: 'acceptance', label: 'Acceptance' },
  { id: 'the-service', label: 'The service' },
  { id: 'accounts', label: 'Accounts & eligibility' },
  { id: 'acceptable-use', label: 'Acceptable use' },
  { id: 'ip', label: 'Intellectual property' },
  { id: 'no-guarantee', label: 'No guaranteed outcome' },
  { id: 'liability', label: 'Liability' },
  { id: 'termination', label: 'Termination' },
  { id: 'law', label: 'Governing law' },
  { id: 'changes', label: 'Changes to these terms' },
  { id: 'contact', label: 'Contact us' },
]

export default function TermsPage() {
  return (
    <LegalShell
      eyebrow="Legal"
      title="Terms & Conditions"
      lastUpdated="5 September 2026"
      intro="These terms set out the rules for using UCAT Portal. By creating an account or using the platform, you agree to them."
      sections={sections}
      currentHref="/terms"
    >
      <Section id="acceptance" number={1} title="Acceptance">
        <P>
          By accessing or using UCAT Portal, you agree to these Terms and our{' '}
          <a href="/privacy" className="text-sky-400 hover:text-sky-300 underline underline-offset-2">Privacy Policy</a>. If you don\u2019t
          agree, please don\u2019t use the platform. If you\u2019re under 18, a parent or guardian
          should review these terms with you.
        </P>
      </Section>

      <Section id="the-service" number={2} title="The service">
        <P>
          UCAT Portal provides tutoring support, mock exam tracking, lesson scheduling, and
          practice materials for students preparing for the UCAT. Features, content, and
          availability may change over time as we improve the platform.
        </P>
      </Section>

      <Section id="accounts" number={3} title="Accounts & eligibility">
        <List
          items={[
            'You need an account to use most of the platform, and new accounts are subject to manual approval before access is granted.',
            'You\u2019re responsible for keeping your login credentials confidential, and for all activity under your account.',
            'You must give accurate information when registering and keep it up to date.',
          ]}
        />
      </Section>

      <Section id="acceptable-use" number={4} title="Acceptable use">
        <P>You agree not to:</P>
        <List
          items={[
            'Share your account, mock scores, or homework answers with people outside the platform for the purpose of undermining academic integrity.',
            'Attempt to access another student\u2019s data or bypass access controls.',
            'Copy, scrape, or redistribute lesson materials, mock questions, or other content without permission.',
            'Use the platform for anything unlawful, harmful, or disruptive to other users.',
          ]}
        />
      </Section>

      <Section id="ip" number={5} title="Intellectual property">
        <P>
          All lesson materials, mock questions, branding, and platform content are owned by
          <Placeholder> your name</Placeholder>, trading as UCAT Portal, or licensed to us. You may
          use them for your own personal study only — not for resale, redistribution, or sharing
          outside the platform. Nothing in these terms transfers ownership of that content to you.
        </P>
      </Section>

      <Section id="no-guarantee" number={6} title="No guaranteed outcome">
        <Callout>
          UCAT Portal is a study aid. We don\u2019t guarantee any particular UCAT score, exam
          result, or admissions outcome from using the platform, and results depend heavily on
          factors outside our control.
        </Callout>
      </Section>

      <Section id="liability" number={7} title="Liability">
        <P>
          To the maximum extent permitted by law, UCAT Portal is not liable for indirect,
          incidental, or consequential loss arising from your use of the platform, including lost
          study time, missed lessons due to technical issues, or exam outcomes. Nothing in these
          terms excludes any guarantee, right, or remedy you have under the Australian Consumer
          Law that cannot lawfully be excluded.
        </P>
      </Section>

      <Section id="termination" number={8} title="Termination">
        <P>
          We may suspend or close an account that breaches these terms, misuses the platform, or
          poses a risk to other users. You can request closure of your own account at any time by
          contacting us.
        </P>
      </Section>

      <Section id="law" number={9} title="Governing law">
        <P>
          These terms are governed by the laws of <Placeholder>State/Territory, Australia</Placeholder>,
          and any disputes will be handled in the courts of that jurisdiction.
        </P>
      </Section>

      <Section id="changes" number={10} title="Changes to these terms">
        <P>
          We may update these terms from time to time. If we make a material change, we\u2019ll let
          you know before it takes effect. Continuing to use the platform after that means you
          accept the updated terms.
        </P>
      </Section>

      <Section id="contact" number={11} title="Contact us">
        <P>
          Questions about these terms can be sent to <Placeholder>support@example.com</Placeholder>.
        </P>
      </Section>
    </LegalShell>
  )
}
FILE_EOF
echo "Created app/terms/page.tsx"

cat > "components/cookie-consent-banner.tsx" << 'FILE_EOF'
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
      className="fixed inset-x-0 bottom-0 z-50 px-4 pb-4 sm:px-6 sm:pb-6"
    >
      <div className="mx-auto max-w-2xl rounded-2xl border border-white/[0.08] bg-[#08090d]/95 backdrop-blur-2xl shadow-[inset_0_1px_2px_rgba(255,255,255,0.06),_0_20px_60px_rgba(0,0,0,0.85)] p-5 sm:p-6">
        <p className="text-sm text-zinc-300 leading-relaxed">
          We use essential cookies to keep you signed in, and — with your permission — analytics
          cookies to see how the portal is used. See our{' '}
          <Link href="/cookies" className="text-sky-400 hover:text-sky-300 underline underline-offset-2">
            Cookie Policy
          </Link>{' '}
          for details.
        </p>

        {expanded && (
          <div className="mt-4 flex items-center justify-between gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
            <div>
              <p className="text-xs font-medium text-zinc-200">Analytics cookies</p>
              <p className="text-xs text-zinc-500 mt-0.5">Helps us see which pages are useful.</p>
            </div>
            <button
              role="switch"
              aria-checked={analyticsChoice}
              onClick={() => setAnalyticsChoice((v) => !v)}
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ${
                analyticsChoice ? 'bg-sky-500' : 'bg-zinc-700'
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform duration-200 ${
                  analyticsChoice ? 'translate-x-[22px]' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        )}

        <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <button
            onClick={acceptAll}
            className="order-1 sm:order-3 flex-1 rounded-full bg-sky-500 hover:bg-sky-400 text-[#030407] font-semibold text-sm px-5 py-2.5 transition-colors duration-200"
          >
            Accept all
          </button>

          {expanded ? (
            <button
              onClick={savePreferences}
              className="order-2 flex-1 rounded-full border border-white/[0.1] hover:border-sky-400/40 text-zinc-300 hover:text-white font-medium text-sm px-5 py-2.5 transition-colors duration-200"
            >
              Save preferences
            </button>
          ) : (
            <button
              onClick={() => setExpanded(true)}
              className="order-2 flex-1 rounded-full border border-white/[0.1] hover:border-sky-400/40 text-zinc-300 hover:text-white font-medium text-sm px-5 py-2.5 transition-colors duration-200"
            >
              Customize
            </button>
          )}

          <button
            onClick={rejectNonEssential}
            className="order-3 sm:order-1 flex-1 rounded-full text-zinc-400 hover:text-zinc-200 font-medium text-sm px-5 py-2.5 transition-colors duration-200"
          >
            Reject non-essential
          </button>
        </div>
      </div>
    </div>
  )
}
FILE_EOF
echo "Created components/cookie-consent-banner.tsx"

cat > "components/legal/legal-shell.tsx" << 'FILE_EOF'
import Link from 'next/link'
import ConstellationGrid from '@/components/ui/constellation-grid'

type LegalSection = {
  id: string
  label: string
}

const LEGAL_PAGES = [
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/cookies', label: 'Cookie Policy' },
  { href: '/terms', label: 'Terms & Conditions' },
]

export function LegalShell({
  eyebrow,
  title,
  lastUpdated,
  intro,
  sections,
  currentHref,
  children,
}: {
  eyebrow: string
  title: string
  lastUpdated: string
  intro: string
  sections: LegalSection[]
  currentHref: string
  children: React.ReactNode
}) {
  return (
    <div className="relative min-h-screen w-full bg-[#030407] text-zinc-100 font-sans">
      <div className="absolute inset-0 z-0 h-[480px] w-full overflow-hidden">
        <ConstellationGrid />
        <div className="absolute inset-0 bg-gradient-to-b from-[#030407]/40 via-[#030407]/85 to-[#030407]" />
      </div>

      <div className="relative z-10">
        <header className="px-6 pt-8 sm:px-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors duration-200"
          >
            <span aria-hidden>←</span> UCAT Portal
          </Link>
        </header>

        <main className="px-6 sm:px-10 pb-24 pt-14 sm:pt-20">
          <div className="mx-auto max-w-5xl">
            <p className="text-sm font-medium text-sky-400">{eyebrow}</p>
            <h1 className="mt-3 text-4xl sm:text-5xl font-black tracking-tight text-white">
              {title}
            </h1>
            <p className="mt-3 text-sm text-zinc-500">Last updated {lastUpdated}</p>
            <p className="mt-6 max-w-[62ch] text-base text-zinc-400 leading-relaxed">{intro}</p>

            <div className="mt-14 grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-10 lg:gap-16">
              <nav className="hidden lg:block">
                <div className="sticky top-10 space-y-1">
                  {sections.map((s) => (
                    <a
                      key={s.id}
                      href={`#${s.id}`}
                      className="block rounded-lg px-3 py-1.5 text-sm text-zinc-500 hover:text-white hover:bg-white/[0.04] transition-colors duration-150"
                    >
                      {s.label}
                    </a>
                  ))}
                </div>
              </nav>

              <div className="min-w-0 max-w-[68ch] space-y-12">{children}</div>
            </div>
          </div>
        </main>

        <footer className="border-t border-white/[0.06] px-6 sm:px-10 py-8">
          <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <p className="text-xs text-zinc-600">© {new Date().getFullYear()} UCAT Portal</p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              {LEGAL_PAGES.map((p) => (
                <Link
                  key={p.href}
                  href={p.href}
                  className={`text-xs transition-colors duration-150 ${
                    p.href === currentHref
                      ? 'text-white'
                      : 'text-zinc-500 hover:text-white'
                  }`}
                >
                  {p.label}
                </Link>
              ))}
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
FILE_EOF
echo "Created components/legal/legal-shell.tsx"

cat > "components/legal/legal-content.tsx" << 'FILE_EOF'
export function Section({
  id,
  number,
  title,
  children,
}: {
  id: string
  number: number
  title: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-10">
      <h2 className="flex items-baseline gap-3 text-xl font-bold text-white">
        <span className="text-sm font-mono text-sky-400/70">{String(number).padStart(2, '0')}</span>
        {title}
      </h2>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  )
}

export function P({ children }: { children: React.ReactNode }) {
  return <p className="text-[15px] leading-relaxed text-zinc-400">{children}</p>
}

export function List({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3 text-[15px] leading-relaxed text-zinc-400">
          <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-zinc-600" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

export function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-5 py-4">
      <p className="text-[15px] leading-relaxed text-zinc-300">{children}</p>
    </div>
  )
}

export function Placeholder({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded bg-amber-400/10 px-1.5 py-0.5 font-mono text-[13px] text-amber-300">
      {children}
    </span>
  )
}
FILE_EOF
echo "Created components/legal/legal-content.tsx"

cat > "lib/cookie-consent.ts" << 'FILE_EOF'
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
FILE_EOF
echo "Created lib/cookie-consent.ts"

echo ""
echo "Done. Now add <CookieConsentBanner /> to your app/layout.tsx"
