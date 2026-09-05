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

        <footer className="border-t border-white/[0.06] px-6 sm:px-10 py-12">
          <nav className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-x-12 gap-y-4">
            {LEGAL_PAGES.map((p) => (
              <Link
                key={p.href}
                href={p.href}
                className={`text-sm font-semibold underline-offset-8 decoration-2 decoration-blue-600 hover:underline transition-colors duration-200 ${
                  p.href === currentHref ? 'text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                {p.label}
              </Link>
            ))}
          </nav>
        </footer>
      </div>

      <p className="fixed z-40 bottom-5 right-5 text-xs text-zinc-600 select-none">
        © {new Date().getFullYear()} UCAT Portal
      </p>
    </div>
  )
}
