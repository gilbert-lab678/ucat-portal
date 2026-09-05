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
