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
