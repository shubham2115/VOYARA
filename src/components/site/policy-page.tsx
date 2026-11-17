export function PolicyPage({ title, updated, sections }: { title: string; updated: string; sections: [string, string][] }) {
  return (
    <div className="container max-w-3xl py-14">
      <p className="eyebrow">Legal</p>
      <h1 className="mt-2 text-4xl">{title}</h1>
      <p className="mt-1 text-sm text-navy-300">Last updated: {updated}</p>
      <p className="mt-4 rounded-xl bg-gold-50 p-3 text-xs text-navy-500">Template text provided for development. Have it reviewed by legal counsel and edit it before launch.</p>
      <div className="mt-8 space-y-6">{sections.map(([h, t]) => <section key={h}><h2 className="text-xl">{h}</h2><p className="mt-2 leading-relaxed text-navy-600">{t}</p></section>)}</div>
    </div>
  );
}
