const LINKS = [
  {
    title: 'Monthly Life',
    description: 'Piano e review mensile',
    icon: '📋',
    url: 'https://www.notion.so/Montly-life-005eaa5e51844d73ac90386d6ca38c3f',
  },
  {
    title: 'Spese 2026',
    description: 'Tracking spese mensili',
    icon: '💰',
    url: 'https://www.notion.so/Spese-2025-687e9d56c64f42c0b9b7acc278ddc565',
  },
  {
    title: 'Obiettivi Q/M/A',
    description: 'Goal trimestrali, mensili, annuali',
    icon: '🎯',
    url: 'https://www.notion.so/Obiettivi-Q-M-A-ef865e5faa4a4265b0e2e0bfb30f410d',
  },
  {
    title: 'Monthly Suggestions',
    description: 'Feedback e suggerimenti del mese',
    icon: '💡',
    url: 'https://www.notion.so/Monthly-suggestions-505455ccbe3c4fc5bc390c9264cff2c3',
  },
]

export function LifeTab() {
  return (
    <div className="pt-3.5">
      <div className="text-xs text-muted-2 uppercase tracking-widest mb-3">Life Management</div>
      <div className="text-[11px] text-muted-3 mb-4">Tap per aprire su Notion</div>

      {LINKS.map((link) => (
        <a
          key={link.title}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block bg-card border border-border rounded-2xl p-4 mb-3 no-underline"
          style={{ textDecoration: 'none' }}
        >
          <div className="flex items-center gap-3">
            <div className="text-2xl w-10 h-10 rounded-xl bg-input-bg border border-muted-6 flex items-center justify-center shrink-0">
              {link.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-semibold text-white">{link.title}</div>
              <div className="text-[11px] text-muted-3">{link.description}</div>
            </div>
            <span className="text-muted-3 text-[13px] shrink-0">→</span>
          </div>
        </a>
      ))}
    </div>
  )
}
