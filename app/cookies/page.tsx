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
