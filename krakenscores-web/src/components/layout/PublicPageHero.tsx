interface PublicPageHeroProps {
  eyebrow: string
  title: string
  subtitle: string
  tournamentName?: string
  logoUrl?: string
}

export default function PublicPageHero({ eyebrow, title, subtitle, tournamentName, logoUrl }: PublicPageHeroProps) {
  return <header className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-cyan-900 text-white">
    <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
    <div className="absolute -bottom-28 left-1/3 h-64 w-64 rounded-full bg-blue-500/15 blur-3xl" />
    <div className="relative mx-auto flex max-w-7xl items-center gap-5 px-4 py-9 sm:px-6 sm:py-12 lg:px-8">
      {logoUrl && <div className="hidden h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10 p-3 shadow-xl backdrop-blur sm:flex"><img src={logoUrl} alt="" className="max-h-full max-w-full object-contain" /></div>}
      <div>
        <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-5xl">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm text-blue-100 sm:text-base">{subtitle}</p>
        {tournamentName && <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold text-white/90 backdrop-blur"><span className="h-2 w-2 rounded-full bg-cyan-300" />{tournamentName}</div>}
      </div>
    </div>
  </header>
}
