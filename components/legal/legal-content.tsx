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
