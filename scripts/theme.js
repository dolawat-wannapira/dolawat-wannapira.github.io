// Renders a JSON Resume into one self-contained page with two layouts:
// - screen: direction A, a big name, a fact strip, a timeline of every project from the first
//   start to now, and expandable index rows;
// - print (Ctrl+P and the downloadable PDF): the classic layout after the owner's old CV, a centred
//   header and uppercase icon headings over a rule, condensed to one A4 page: the short intro, and
//   one short paragraph per entry with its dates on the right.
// Each layout's CSS sits in its own media block, so they never share rules. Light theme only.
// Latin text is set in Bricolage Grotesque; Thai falls through to Google Sans, whose font file
// covers Thai only.
//
// Extra fields this theme reads beyond the JSON Resume schema, on work and project entries:
// - `keywords` on work entries: stack tags;
// - `x-timeline: false`: keeps an entry (e.g. a bundle of short projects) off the timeline;
// - `x-short`: the timeline bar's label, a part of the full name so the bar's accessible name (the
//   full name) still contains what it shows;
// - `x-headline`: one line under a closed index row's name, so a skimmer sees the result unopened;
// - `x-print`: the entry's text in print and the PDF, which has to fit one page, in place of the
//   summary and highlights the screen shows;
// - `x-lede` on basics: the short intro, on screen (see lede()) and in print;
// - `x-stack` on basics: the main stack, shown in the fact strip.

const icons = {
  summary: ['M4 5h16v14H4z', 'M8 9h8', 'M8 13h8', 'M8 17h5'],
  briefcase: ['M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', 'M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2', 'M3 13h18'],
  folder: ['M3 6a1 1 0 0 1 1-1h5l2 2h9a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z'],
  code: ['m8 6-6 6 6 6', 'm16 6 6 6-6 6'],
  education: ['m2 9 10-5 10 5-10 5z', 'M6 11v5c3 2.5 9 2.5 12 0v-5', 'M22 9v6'],
  globe: ['M3 12a9 9 0 1 0 18 0 9 9 0 1 0-18 0', 'M3 12h18', 'M12 3c3 3.2 3 14.8 0 18', 'M12 3c-3 3.2-3 14.8 0 18'],
  pin: ['M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z', 'M9.5 10a2.5 2.5 0 1 0 5 0 2.5 2.5 0 1 0-5 0'],
  mail: ['M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', 'm3 7 9 6 9-6'],
  link: ['M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1', 'M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1'],
}

// Filled brand marks (Simple Icons paths) for the profile networks.
const brands = {
  GitHub: 'M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12',
  LinkedIn: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.73 1.637-1.84 3.37-1.84 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z',
}

// A brand mark when the name is a known network, otherwise the stroked icon of that name.
const icon = (name) =>
  brands[name]
    ? `<svg class="icon" aria-hidden="true" viewBox="0 0 24 24" fill="currentColor"><path d="${brands[name]}"/></svg>`
    : `<svg class="icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${(icons[name] ?? icons.link).map((d) => `<path d="${d}"/>`).join('')}</svg>`

const escape = (text = '') =>
  String(text).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

// "2023-09" → "09/2023", "2014" → "2014", like the old CV.
const date = (value) => {
  const match = /^(\d{4})-(\d{2})/.exec(value ?? '')
  return match ? `${match[2]}/${match[1]}` : escape(value)
}
const span = (start, end, present) => `${date(start)} – ${end ? date(end) : present}`
const displayUrl = (url) => url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')
const slug = (text) => text.toLowerCase().replace(/[^a-z0-9฀-๿]+/g, '-').replace(/^-|-$/g, '')

// "A · B · C" as separate spans, so a wrapped line never ends or starts on a "·" (see .seq).
const seq = (list) => `<span class="seq">${list.split(' · ').map((s) => `<span>${escape(s)}</span>`).join(' ')}</span>`
const dashList = (items = []) => (items.length ? `<ul class="dash">${items.map((item) => `<li>${escape(item)}</li>`).join('')}</ul>` : '')

// Newest first, the way a CV reads: ongoing entries lead, then the rest by start date, latest first.
// Ties keep the JSON order.
const byRecency = (a, b) => Number(!!a.endDate) - Number(!!b.endDate) || (b.startDate ?? '').localeCompare(a.startDate ?? '')

// Consecutive work entries with the same employer become one group, spanning first start to last end;
// each group lists its entries newest first.
function groupWork(work = []) {
  const groups = []
  for (const entry of work) {
    const last = groups.at(-1)
    if (last && last.name === entry.name) last.entries.push(entry)
    else groups.push({ name: entry.name, entries: [entry] })
  }
  for (const group of groups) {
    group.entries.sort(byRecency)
    group.start = group.entries.map((e) => e.startDate).sort()[0]
    group.end = group.entries.some((e) => !e.endDate) ? undefined : group.entries.map((e) => e.endDate).sort().at(-1)
    group.title = group.entries[0].description
  }
  return groups
}

const projectLane = (type = '') => (/freelance|ฟรีแลนซ์/i.test(type) ? 'freelance' : /open|โอเพน/i.test(type) ? 'openSource' : 'personal')

// The fact strip under the name, shared by the page and the share card. The role is already the line
// above, so the strip carries what a recruiter filters on instead.
function heroFacts({ basics, work = [] }, labels) {
  const current = groupWork(work).find((g) => !g.end)
  return [
    // The country in the page's language, as print has it, rather than the ISO code.
    [labels.basedIn, [basics.location?.city, basics.location && labels.country].filter(Boolean).join(', ')],
    [labels.since, work.map((w) => w.startDate).sort()[0]?.slice(0, 4)],
    [labels.nowAt, current?.name],
    [labels.stack, basics['x-stack']],
  ].filter(([, v]) => v)
}

const pageTitle = ({ basics }, { lang, labels }) => `${basics.name} – ${basics.label}${lang === 'en' ? '' : ` · ${labels.eyebrow}`}`

// What a link preview (Discord, Slack, LINE, LinkedIn, X) and a search engine read: Open Graph and
// Twitter tags pointing at the share card the build renders with card() below, plus schema.org Person
// data. Link previews need absolute URLs, so they are built from basics.url and the page's folder.
function share(resume, { lang, labels, pageUrl, cardName = 'og.png' }) {
  if (!pageUrl) return ''
  const { basics } = resume
  const image = new URL(cardName, pageUrl).href
  const person = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: basics.name,
    jobTitle: basics.label,
    url: pageUrl,
    image,
    email: `mailto:${basics.email}`,
    address: basics.location && { '@type': 'PostalAddress', addressLocality: basics.location.city, addressCountry: basics.location.countryCode },
    sameAs: (basics.profiles ?? []).map((p) => p.url),
  }
  return [
    `<link rel="canonical" href="${escape(pageUrl)}">`,
    ...[
      ['og:type', 'profile'],
      ['og:site_name', basics.name],
      ['og:title', pageTitle(resume, { lang, labels })],
      ['og:description', labels.description],
      ['og:url', pageUrl],
      ['og:locale', lang === 'th' ? 'th_TH' : 'en_US'],
      ['og:image', image],
      ['og:image:type', 'image/png'],
      ['og:image:width', '1200'],
      ['og:image:height', '630'],
      ['og:image:alt', `${basics.name}, ${basics.label}`],
      ['profile:first_name', basics.name.split(' ')[0]],
      ['profile:last_name', basics.name.split(' ').slice(1).join(' ')],
    ].map(([k, v]) => `<meta property="${k}" content="${escape(v)}">`),
    `<meta name="twitter:card" content="summary_large_image">`,
    // JSON in a script element: only "</" could end it early.
    `<script type="application/ld+json">${JSON.stringify(person).replace(/<\//g, '<\\/')}</script>`,
  ].join('\n')
}

// The share card: a 1200×630 page the build screenshots into og.png, the header of the screen
// layout (eyebrow, name, role, fact strip) set at a size that still reads as a small chat preview.
export function card(resume, { lang, labels, fontPath = 'fonts' }) {
  const { basics } = resume
  const facts = heroFacts(resume, labels)
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<style>${fontFaces(fontPath)}
html,body{width:1200px;height:630px;overflow:hidden}
body{display:flex;flex-direction:column;padding:56px 72px 60px;background:var(--paper)}
.top{display:flex;align-items:center;justify-content:space-between}
.mark{display:flex;align-items:center;gap:18px;font-size:20px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}
:lang(th) .mark{letter-spacing:.02em}
.mark svg{width:52px;height:52px}
.url{font-size:22px;font-weight:600;color:var(--ink-2)}
h1{margin-top:auto;font-size:118px;font-weight:800;line-height:.88;letter-spacing:-.035em}
.label{margin-top:22px;font-size:38px;font-weight:500;color:var(--accent)}
dl{display:grid;grid-template-columns:repeat(${facts.length},minmax(0,1fr));margin-top:40px;border-top:2px solid var(--ink)}
dl div{padding:18px 20px 0 0;min-width:0}
dl div+div{padding-left:20px;border-left:1px solid var(--line)}
dt{font-size:16px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}
:lang(th) dt{font-size:18px;letter-spacing:.02em}
dd{margin-top:6px;font-size:28px;font-weight:600;line-height:1.25}
.seq{display:flex;flex-wrap:wrap;column-gap:.85em;overflow:hidden}
.seq>span{position:relative}
.seq>span::before{content:"·";position:absolute;right:calc(100% + .3em)}
</style>
</head>
<body>
<div class="top"><p class="mark">${favicon}${escape(labels.eyebrow)}</p><p class="url">${escape(displayUrl(basics.url ?? ''))}</p></div>
<h1>${basics.name.split(' ').map(escape).join('<br>')}</h1>
<p class="label">${escape(basics.label)}</p>
<dl>${facts.map(([k, v]) => `<div><dt>${escape(k)}</dt><dd>${k === labels.stack ? seq(v) : escape(v)}</dd></div>`).join('')}</dl>
</body>
</html>`
}

// The </DW> mark from assets/favicon.svg.
const favicon = `<svg viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" rx="14" fill="#2f54eb"/><g transform="translate(32 32) scale(.8) translate(-35.5 -32)" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="M10 24 4 32l6 8"/><path d="M17 41 22 23"/><path d="M28 24h2a6.5 8 0 0 1 0 16h-2z"/><path d="m43 24 3 16 3-10 3 10 3-16"/><path d="m61 24 6 8-6 8"/></g></svg>`

export function render(resume, options) {
  const { lang, labels } = options
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(pageTitle(resume, options))}</title>
<meta name="description" content="${escape(labels.description)}">
${lang === 'th' ? '<meta name="robots" content="noindex, nofollow">' : ''}
${share(resume, options)}
<link rel="icon" type="image/svg+xml" href="favicon.svg">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
${preloads(lang, options.fontPath ?? 'fonts')}
<style>${fontFaces(options.fontPath ?? 'fonts')}${screenStyles}${printStyles}</style>
</head>
<body>
${screen(resume, options)}
${classic(resume, options)}
<script>${script}</script>
</body>
</html>`
}

// ---------------------------------------------------------------- screen (direction A)

function screen(resume, { lang, labels, pdfName, now, languages: switcher = [] }) {
  const { basics, work = [], projects = [], skills = [], education = [], languages = [] } = resume
  const groups = groupWork(work)
  const firstYear = work.map((w) => w.startDate).sort()[0].slice(0, 4)
  const facts = heroFacts(resume, labels).map(([k, v]) => [k, escape(v)])
  const stack = facts.find(([k]) => k === labels.stack)
  if (stack) stack[1] = seq(basics['x-stack'])
  // The location sits in the fact strip, so the contact list holds only the ways to get in touch.
  const contacts = [
    { icon: 'mail', label: labels.email, text: basics.email, href: `mailto:${basics.email}` },
    ...(basics.profiles ?? []).map((p) => ({ icon: p.network, label: p.network, text: p.username ?? displayUrl(p.url), href: p.url })),
  ]
  const contact = (c) =>
    `<li><a href="${escape(c.href)}"${c.href.startsWith('http') ? ' target="_blank" rel="noopener"' : ''}><span class="ct-icon">${icon(c.icon)}</span><span class="ct-text"><small>${escape(c.label)}</small>${escape(c.text)}</span></a></li>`
  const workItem = (w) => ({ ...w, id: `w-${slug(w.position)}`, title: w.position, org: w.name, text: w.summary })
  const workItems = work.map(workItem).sort(byRecency)
  // Experience reads the way a recruiter matches it to a posting: employer, role and tenure first,
  // then that employer's projects, newest first.
  const employers = groups.map((g) => ({ ...g, id: `e-${slug(g.name)}`, items: g.entries.map(workItem) }))
  const projectItems = projects.map((p) => ({ ...p, id: `p-${slug(p.name)}`, title: p.name, org: p.type, text: p.description })).sort(byRecency)

  // Contact comes before the summary in the source, so a phone reaches it first; on wide screens the
  // intro grid moves it to the right-hand column. Where the timeline would stack (see main.wrap), it
  // moves below the experience and projects, so a phone reaches the work first. The footer repeats
  // the links for whoever reads to the end, and carries the JSON Resume link, which is for engineers
  // and stays out of the header.
  return `<div class="screen">
<a class="skip" href="#experience">${escape(labels.skip)}</a>
<header class="wrap head">
  <div class="top"><p class="eyebrow">${escape(labels.eyebrow)} · ${new Date(`${now}-01`).getFullYear()}</p>
    <div class="acts">${switcher.length > 1 ? `<nav class="lang" aria-label="${escape(labels.language)}">${switcher.map((l) => (l.lang === lang ? `<span aria-current="page">${escape(l.label)}</span>` : `<a href="${escape(l.href)}" hreflang="${l.lang}" lang="${l.lang}">${escape(l.label)}</a>`)).join('')}</nav>` : ''}<a class="btn solid" href="${escape(pdfName)}" download>${escape(labels.download)}</a></div>
  </div>
  <h1 class="name">${basics.name.split(' ').map(escape).join('<br>')}</h1>
  <p class="label">${escape(basics.label)}</p>
  <dl class="facts">${facts.map(([k, v]) => `<div><dt>${escape(k)}</dt><dd>${v}</dd></div>`).join('')}</dl>
</header>
<main class="wrap">
  <div class="intro">
    <aside class="contact"><h2>${escape(labels.contact)}</h2><ul>${contacts.map(contact).join('')}</ul></aside>
    <p class="lede">${lede(basics['x-lede'] ?? basics.summary, projects)}</p>
  </div>

  <section class="glance">
  <h2 class="sec"><span>${escape(labels.glance(firstYear))}</span><small>${escape(labels.glanceHint)}</small></h2>
  <div class="tl-box">${timeline({ employers, workItems, projectItems, labels, now, firstYear })}</div>
  </section>

  <h2 class="sec" id="experience"><span>${escape(labels.work)}</span></h2>
  ${employers.map((g) => `<div class="grp">
  <div class="grp-head" id="${g.id}"><span class="ix-when">${span(g.start, g.end, labels.present)}</span><h3><span class="grp-name">${escape(g.name)}</span> <span class="grp-role">${escape(g.title)}</span></h3></div>
  <div class="ixl">${indexRows(g.items, labels, { level: 4, org: false })}</div>
  </div>`).join('\n  ')}

  <h2 class="sec"><span>${escape(labels.projectsLong)}</span></h2>
  <div class="ixl">${indexRows(projectItems, labels)}</div>

  <section class="sk-sec">
  <h2 class="sec"><span>${escape(labels.skills)}</span></h2>
  <div class="sk">${skills.map((s) => `<div class="sk-row"><h3>${escape(s.name)}</h3><ul class="chips">${s.keywords.map((k) => `<li>${escape(k)}</li>`).join('')}</ul></div>`).join('')}</div>
  </section>

  <footer class="foot">
    <div><h2>${escape(labels.education)}</h2>${education.map((e) => `<p>${escape(e.studyType)} – ${escape(e.area)}, ${escape(e.institution)}, <span class="nw">${date(e.startDate)}–${date(e.endDate)}</span></p>`).join('')}</div>
    <div><h2>${escape(labels.languages)}</h2><p>${languages.map((l) => `${escape(l.language)} (${escape(l.fluency)})`).join(' · ')}</p></div>
    <div><h2>${escape(labels.contact)}</h2><ul class="foot-links">${contacts.map((c) => `<li><a href="${escape(c.href)}"${c.href.startsWith('http') ? ' target="_blank" rel="noopener"' : ''}>${escape(c.href.startsWith('mailto:') ? c.text : c.label)}</a></li>`).join('')}</ul></div>
    <p class="colophon"><a href="resume.json" target="_blank" rel="noopener">JSON Resume&nbsp;↗</a></p>
  </footer>
</main>
</div>`
}

// The screen's intro: `x-lede` (a short version of the summary; print keeps the full one), with the
// first mention of each project that has a live URL turned into a link to it.
function lede(text, projects) {
  let html = escape(text)
  for (const p of projects.filter((p) => p.url)) {
    const name = escape(p.name)
    html = html.replace(name, `<a href="${escape(p.url)}" target="_blank" rel="noopener">${name}&nbsp;↗</a>`)
  }
  return html
}

// Each row gets a visually hidden heading before it, so heading navigation reaches every project:
// browsers drop a heading placed inside <summary> from the accessibility tree. Under an employer
// heading the rows are h4 and leave out the employer, which the heading already names.
function indexRows(items, labels, { level = 3, org = true } = {}) {
  return items
    .map(
      (it) => `<h${level} class="vh">${escape(it.title)}</h${level}><details class="ix" id="${it.id}">
  <summary><span class="ix-when">${span(it.startDate, it.endDate, labels.present)}</span><span class="ix-name"><span class="ix-title">${escape(it.title)}</span>${org ? `<em>${escape(it.org)}</em>` : ''}${it['x-headline'] ? `<span class="ix-head">${escape(it['x-headline'])}</span>` : ''}</span><span class="ix-stack">${escape((it.keywords ?? []).slice(0, 3).join(' · '))}</span><span class="ix-plus" aria-hidden="true"></span></summary>
  <div class="ix-body"><p>${escape(it.text)}</p>${dashList(it.highlights)}${it.url ? `<p class="ix-link"><a href="${escape(it.url)}" target="_blank" rel="noopener">${escape(displayUrl(it.url))}&nbsp;↗</a></p>` : ''}</div>
</details>`,
    )
    .join('')
}

// The strip's narrowest scale: it never shrinks below TL.min rem, of which TL.name is the lane-name
// column. Label placement is worked out against this scale, so it holds at every wider one.
const TL = { min: 46, name: 6.5 }
// A label's width in rem at the bar's .72rem semibold, padding included. Rough and on the wide side
// (Thai vowel and tone marks take no width, so they don't count).
const labelRem = (text) => Math.ceil(0.8 + 0.42 * [...text.replace(/[ัิ-ฺ็-๎]/g, '')].length)

// Bars placed on one month scale from January of the first year to the end of next year. A label
// sits inside its bar while the bar is wide enough (a container query per label width, see
// labelOutside) and beside it otherwise: to the right, or to the left near the strip's end. Each lane
// packs its bars, with room kept for a label that may sit beside, into as few rows as fit; a bar
// takes its row from --r, so the bars stay in date order in the source, which is the tab order and
// the order of the stacked list that narrow screens get instead (see the tl container query).
function timeline({ employers: groups, workItems, projectItems, labels, now, firstYear }) {
  const start = Number(firstYear)
  const end = Number(now.slice(0, 4)) + 1
  const total = (end - start) * 12
  const month = (d) => {
    const [y, m] = (d || now).split('-').map(Number)
    return (y - start) * 12 + ((m || 1) - 1)
  }
  const pct = (n) => ((n / total) * 100).toFixed(3)
  const remPerMonth = (TL.min - TL.name) / total
  const place = (it) => {
    const s = month(it.startDate)
    const e = month(it.endDate) + 1
    const label = it['x-short'] ?? it.title.replace(/ \(.*\)$/, '')
    const lw = labelRem(label)
    const reach = Math.ceil((lw + 0.3) / remPerMonth)
    const side = (e - s) * remPerMonth >= lw ? '' : total - e >= reach ? 'r' : 'l'
    return { s, e, label, lw, side, from: side === 'l' ? s - reach : s, to: side === 'r' ? e + reach : e }
  }
  const pack = (items) => {
    const rows = []
    for (const it of items.map((i) => ({ ...i, at: place(i) })).sort((a, b) => a.at.from - b.at.from)) {
      let row = rows.find((r) => r.end <= it.at.from)
      if (!row) rows.push((row = { end: -Infinity, items: [] }))
      row.items.push(it)
      row.end = it.at.to
    }
    return rows
  }
  // An employer bar points at that employer's heading in Experience.
  const employers = groups.map((g) => ({ title: g.name, startDate: g.start, endDate: g.end, id: g.id, employer: true, at: place({ title: g.name, startDate: g.start, endDate: g.end }) }))
  const lanes = [
    [labels.lanes.employer, [{ items: employers }]],
    [labels.lanes.work, pack(workItems.filter((w) => w['x-timeline'] !== false && w.name === (groups.find((g) => !g.end) ?? groups[0]).name))],
    ...['freelance', 'personal', 'openSource'].map((lane) => [labels.lanes[lane], pack(projectItems.filter((p) => projectLane(p.type) === lane))]),
  ].filter(([, rows]) => rows.length && rows[0].items.length)
  // Earlier employers' own entries would duplicate their employer bar, so only the current
  // employer's projects get the Work lane.
  const years = Array.from({ length: end - start + 1 }, (_, i) => start + i)
  // The visible label is the short name; the link's name is the full name and dates, in a visually
  // hidden span. The title repeats that name exactly, so screen readers don't announce it twice.
  const bar = (it) => {
    const { s, e, label, lw, side } = it.at
    const name = escape(it.title.replace(/ \(.*\)$/, ''))
    const dates = span(it.startDate, it.endDate, labels.present)
    return `<a class="tl-bar lw-${lw}${side ? ` out-${side}` : ''}${it.employer ? ' emp' : ''}" id="tl-${it.id}" href="#${it.id}" style="--s:${pct(s)};--w:${pct(e - s)};--r:${it.row}" title="${name} ${dates}"><span class="tl-label" aria-hidden="true">${escape(label)}</span><span class="vh">${name} </span><span class="vh tl-dates">${dates}</span></a>`
  }
  return `<figure class="tl" aria-label="${escape(labels.glance(firstYear))}" data-back="${escape(labels.backToTimeline)}">
  <div class="tl-axis" aria-hidden="true">${years.filter((y) => y < end).map((y) => `<span style="left:${pct((y - start) * 12)}%">${y}</span>`).join('')}</div>
  ${lanes.map(([name, rows], i) => `<div class="tl-lane" role="group" aria-labelledby="tl-lane-${i}"><div class="tl-name" id="tl-lane-${i}">${escape(name)}</div><div class="tl-rows" style="--rows:${rows.length}">${rows
    .flatMap((row, r) => row.items.map((it) => ({ ...it, row: r })))
    .sort((a, b) => a.at.s - b.at.s)
    .map(bar)
    .join('')}</div></div>`).join('')}
  <div class="tl-now" aria-hidden="true" style="--x:${pct(month(now) + 0.5)}"><span>${escape(labels.lanes.now)}</span></div>
</figure>`
}

// Opens a row when a timeline bar (or any link) points at it, also when the hash is already that
// row's (a click then fires no hashchange). Keyboard focus follows to the row's summary. A row or
// employer reached from a bar gets one "back to the timeline" link (its text from the figure's
// data-back), which returns to that bar and focuses it; a shared link to a row gets none.
const script = `(() => {
  const target = (hash) => { try { return hash && document.getElementById(decodeURIComponent(hash.slice(1))) } catch { return null } }
  const back = document.createElement('a')
  back.className = 'tl-back'
  back.textContent = document.querySelector('.tl')?.dataset.back ?? ''
  let from = null
  const go = (el) => {
    if (!el) return
    if (el.classList.contains('tl-bar')) {
      back.remove()
      el.scrollIntoView({ block: 'center' })
      el.focus({ preventScroll: true })
      return
    }
    const row = el.tagName === 'DETAILS'
    if (!row && !el.classList.contains('grp-head')) return
    if (row) el.open = true
    if (from) {
      back.href = '#' + from.id
      ;(row ? el.querySelector('.ix-body') : el).append(back)
    } else back.remove()
    from = null
    el.scrollIntoView({ block: 'start' })
    if (row) el.querySelector('summary').focus({ preventScroll: true })
  }
  addEventListener('hashchange', () => go(target(location.hash)))
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]')
    if (!a) return
    from = a.classList.contains('tl-bar') ? a : null
    const el = a.hash === location.hash && target(a.hash)
    if (el) { e.preventDefault(); go(el) }
  })
  go(target(location.hash))
})()`

// ---------------------------------------------------------------- print (classic)

function classic(resume, { labels }) {
  const { basics, work, projects = [], skills = [], education = [], languages = [] } = resume
  const contacts = [
    basics.location && { icon: 'pin', text: [basics.location.city, labels.country].filter(Boolean).join(', ') },
    { icon: 'mail', text: basics.email, href: `mailto:${basics.email}` },
    basics.url && { icon: 'globe', text: displayUrl(basics.url), href: basics.url },
    ...(basics.profiles ?? []).map((p) => ({ icon: p.network, text: displayUrl(p.url), href: p.url })),
  ].filter(Boolean)
  const section = (id, iconName, title, body) => `<section id="c-${id}"><h2>${icon(iconName)}<span>${escape(title)}</span></h2>${body}</section>`

  // A heading line: the text on the left, its dates on the right.
  const head = (tag, html, when) => `<${tag} class="head"><span>${html}</span><span class="when">${when}</span></${tag}>`
  const educationBody = education
    .map((e) => head('p', `<strong>${escape(e.studyType)} – ${escape(e.area)},</strong> <em>${escape(e.institution)}</em>`, `${date(e.startDate)} – ${date(e.endDate)}`))
    .join('')
  const text = (e) => `<p>${escape(e['x-print'] ?? e.summary ?? e.description)}</p>`
  // An employer with a single entry takes that entry's text directly, as its heading would repeat
  // the employer's dates.
  const workBody = groupWork(work)
    .map((g) => {
      const employer = head('h3', `<strong>${escape(g.name)},</strong> <em>${escape(g.title)}</em>`, span(g.start, g.end, labels.present))
      return g.entries.length === 1
        ? `<article class="entry">${employer}${text(g.entries[0])}</article>`
        : `<article class="employer">${employer}
    ${g.entries.map((e) => `<div class="entry">${head('h4', escape(e.position), span(e.startDate, e.endDate, labels.present))}${text(e)}</div>`).join('')}
  </article>`
    })
    .join('')
  const projectsBody = [...projects]
    .sort(byRecency)
    .map(
      (p) => `<article class="entry">${head('h3', `<strong>${escape(p.name)},</strong> <em>${escape(p.type)}</em>${p.url ? ` <a class="url" href="${escape(p.url)}">${escape(displayUrl(p.url))}</a>` : ''}`, span(p.startDate, p.endDate, labels.present))}${text(p)}</article>`,
    )
    .join('')

  return `<article class="classic">
<header class="masthead">
  <h1>${escape(basics.name)}</h1>
  <p class="label">${escape(basics.label)}</p>
  <ul class="contacts">${contacts.map((c) => `<li>${icon(c.icon)}${c.href ? `<a href="${escape(c.href)}">${escape(c.text)}</a>` : escape(c.text)}</li>`).join('')}</ul>
</header>
${section('summary', 'summary', labels.summary, `<p class="summary">${escape(basics['x-lede'] ?? basics.summary)}</p>`)}
${section('work', 'briefcase', labels.work, workBody)}
${section('projects', 'folder', labels.projects, projectsBody)}
${section('skills', 'code', labels.skills, `<p class="skills">${skills.map((s) => `<strong>${escape(s.name)}:</strong> ${escape(s.keywords.join(', '))}`).join('<span class="sep" aria-hidden="true"> · </span>')}</p>`)}
<div class="pair">
${section('education', 'education', labels.education, educationBody)}
${section('languages', 'globe', labels.languages, `<p class="languages">${languages.map((l) => `${escape(l.language)} (${escape(l.fluency)})`).join(' · ')}</p>`)}
</div>
</article>`
}

// ---------------------------------------------------------------- styles

// The name is set in Bricolage at up to 9.5rem, so its file loads first to keep the swap from
// reflowing the header; the Thai page also needs Google Sans for every line of body text.
const preloads = (lang, path) =>
  ['bricolage-grotesque-400-800-latin', ...(lang === 'th' ? ['google-sans-400-700-thai'] : [])]
    .map((file) => `<link rel="preload" href="${path}/${file}.woff2" as="font" type="font/woff2" crossorigin>`)
    .join('\n')

const fontFaces = (path) => `
@font-face{font-family:"Bricolage Grotesque";font-style:normal;font-weight:400 800;font-display:swap;src:url("${path}/bricolage-grotesque-400-800-latin.woff2") format("woff2");unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:"Bricolage Grotesque";font-style:normal;font-weight:400 800;font-display:swap;src:url("${path}/bricolage-grotesque-400-800-latin-ext.woff2") format("woff2");unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C4,U+2113,U+2C60-2C7F,U+A720-A7FF}
@font-face{font-family:"Google Sans";font-style:normal;font-weight:400 700;font-display:swap;src:url("${path}/google-sans-400-700-thai.woff2") format("woff2");unicode-range:U+02D7,U+0303,U+0331,U+0E01-0E5B,U+200C-200D,U+25CC}
:root{
  color-scheme:light;
  --ink:#0e1430;--ink-2:#3a4266;--muted:#5f6789;--line:#d8dcea;--paper:#f6f7fb;--card:#fff;
  --accent:#2f54eb;--accent-soft:#e6ebfd;--on-accent:#fff;
  --font:"Bricolage Grotesque","Google Sans",ui-sans-serif,system-ui,sans-serif;
}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;font-family:var(--font);color:var(--ink);font-variant-ligatures:none}
h1,h2,h3,h4,p,ul,dl,dd,figure{margin:0}
a{color:var(--accent);text-decoration:none}
.icon{width:1em;height:1em;flex:none}
.vh{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
`

// A bar narrower than its label (lw-N: N rem wide) moves the label beside it, in ink, on the side
// the timeline chose (out-l puts it on the left). One container query per label width; the query
// reads the bar's content box, so it leaves out the .8rem of padding that N counts.
const labelOutside = Array.from({ length: 10 }, (_, i) => i + 3)
  .map((n) => `@container (max-width:${(n - 0.8).toFixed(1)}rem){.lw-${n}>.tl-label{position:absolute;top:0;left:100%;max-width:none;padding:0 .35rem;overflow:visible;color:var(--ink)}.lw-${n}.out-l>.tl-label{left:auto;right:100%}}`)
  .join('\n')

const screenStyles = `
@media screen{
.classic{display:none}
body{background:var(--paper);font-size:1rem;line-height:1.5}
body:lang(th){line-height:1.65}
::selection{background:var(--accent);color:var(--on-accent)}
a:hover{text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:.2em}
a:focus-visible,summary:focus-visible{outline:2px solid var(--accent);outline-offset:3px;border-radius:4px}
/* Skips the header, contacts and timeline bars to the first index row's section; shown on focus. */
.skip{position:absolute;top:.75rem;left:max(16px,env(safe-area-inset-left,0px));z-index:10;padding:.5rem 1rem;border-radius:999px;background:var(--ink);color:var(--on-accent);font-size:.9rem;font-weight:600;text-decoration:none!important;transform:translateY(-200%)}
.skip:focus{transform:none}
.sec[id]{scroll-margin-top:1rem}
/* One style for every small uppercase label: eyebrow, fact names, contact and footer headings, lane names. */
.eyebrow,.facts dt,.contact h2,.tl-name,.foot h2{font-size:.75rem;font-weight:600;line-height:1.4;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}
:lang(th) :is(.eyebrow,.facts dt,.contact h2,.tl-name,.foot h2){font-size:.8rem;letter-spacing:.02em}
.wrap{max-width:72rem;margin:0 auto;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))}
/* main is a column whose sections can reorder: where the timeline would stack (its container query,
   on the same width), it moves below the experience and projects, which a phone reaches first. Its
   bars stay first in the tab order there; that trade keeps the desktop order and source order equal. */
main.wrap{display:flex;flex-direction:column;container:page/inline-size}
@container page (width < ${TL.min}rem){
.glance{order:1}
.sk-sec,.foot{order:2}
}

.btn{display:inline-flex;align-items:center;padding:.5rem 1rem;border:1.5px solid var(--accent);border-radius:999px;font-size:.9rem;font-weight:600;text-decoration:none!important;transition:background .2s,color .2s,border-color .2s}
.btn.solid{background:var(--accent);color:var(--on-accent)}
.acts{display:flex;flex-wrap:wrap;align-items:center;gap:.5rem}
.lang{display:inline-flex;padding:3px;border:1.5px solid var(--line);border-radius:999px;margin-right:.25rem;font-size:.85rem;font-weight:600}
.lang>*{padding:.3rem .8rem;border-radius:999px;line-height:1.2}
.lang a{color:var(--muted);text-decoration:none!important;transition:color .2s,background .2s}
.lang [aria-current]{background:var(--ink);color:var(--on-accent)}

.head{padding-top:2.5rem}
.top{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:1rem}
.name{font-weight:800;font-size:clamp(min(3.2rem,16vw),11vw,9.5rem);line-height:.88;letter-spacing:-.035em;margin-top:1.5rem}
.label{margin-top:.9rem;font-size:clamp(1.2rem,2vw,1.6rem);font-weight:500;color:var(--accent)}
.facts{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));margin-top:1.75rem;border-top:1.5px solid var(--ink);border-bottom:1px solid var(--line)}
.facts div{padding:.8rem 1rem .9rem 0;min-width:0}
.facts div+div{padding-left:1rem;border-left:1px solid var(--line)}
.facts dd{font-size:1.2rem;font-weight:600;margin-top:.15rem;overflow-wrap:anywhere}
/* A "·"-separated run: each separator hangs left of its item, and the one that lands at the start of
   a wrapped line falls outside the box and is clipped, so no line starts or ends on a "·". */
.seq{display:flex;flex-wrap:wrap;column-gap:.85em;overflow:hidden}
.seq>span{position:relative}
.seq>span::before{content:"·";position:absolute;right:calc(100% + .3em)}

.intro{display:grid;grid-template-columns:minmax(0,46rem) minmax(16rem,1fr);gap:2rem 4rem;margin-top:2.25rem;align-items:start}
.intro .lede{grid-column:1;grid-row:1}
.intro .contact{grid-column:2;grid-row:1}
.lede{max-width:36em;font-size:clamp(1.1rem,1.6vw,1.35rem);line-height:1.5;text-wrap:pretty}
/* Underlined, since the accent alone is too close to the ink to mark a link inside text. */
.lede a{font-weight:600;text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:.2em}
.contact h2{padding-bottom:.6rem;border-bottom:1.5px solid var(--ink)}
.contact ul{list-style:none;padding:0}
.contact li{border-bottom:1px solid var(--line)}
.contact li>*{display:flex;align-items:center;gap:.85rem;padding:.75rem .25rem;color:var(--ink);text-decoration:none!important;transition:background .2s}
.ct-icon{display:grid;place-items:center;width:2.4rem;height:2.4rem;border-radius:10px;background:var(--accent-soft);color:var(--accent);flex:none;transition:background .2s,color .2s}
.ct-icon .icon{width:1.15rem;height:1.15rem}
.ct-text{display:grid;min-width:0;font-weight:600;overflow-wrap:anywhere}
.ct-text small{font-size:.75rem;font-weight:400;color:var(--muted)}
.sec{display:flex;flex-wrap:wrap;align-items:baseline;justify-content:space-between;gap:.25rem 1rem;margin:3.5rem 0 1rem;font-size:clamp(1.5rem,3vw,2.1rem);font-weight:750;line-height:1.15;letter-spacing:-.015em;text-wrap:balance}
:lang(th) .sec{line-height:1.4}
.sec small{font-size:.85rem;font-weight:400;line-height:1.45;color:var(--muted);letter-spacing:0}

/* The timeline's container: the strip below TL.min rem would not fit, so it stacks instead (see the
   tl container query) and never needs to scroll. */
.tl-box{container:tl/inline-size;--name:${TL.name}rem;padding-bottom:.5rem}
.tl{--bar-h:1.55rem;position:relative;min-width:${TL.min}rem;padding-top:1.6rem;border-top:1.5px solid var(--ink)}
.tl-axis{position:absolute;top:.35rem;bottom:0;left:var(--name);right:0;pointer-events:none}
.tl-axis span{position:absolute;top:0;bottom:0;transform:translateX(-50%);font-size:.75rem;color:var(--muted);font-variant-numeric:tabular-nums}
.tl-axis span::after{content:"";position:absolute;left:50%;top:1.25rem;bottom:0;border-left:1px solid var(--line)}
.tl-lane{position:relative;display:grid;grid-template-columns:var(--name) minmax(0,1fr);align-items:start;border-bottom:1px solid var(--line);padding:.45rem 0}
.tl-name{padding-top:.25rem}
.tl-rows{position:relative;height:calc(var(--rows) * (var(--bar-h) + .3rem) - .3rem)}
.tl-bar{position:absolute;top:calc(var(--r) * (var(--bar-h) + .3rem));left:calc(var(--s) * 1%);width:calc(var(--w) * 1%);height:var(--bar-h);min-width:6px;border-radius:4px;background:var(--accent);color:var(--on-accent);font-size:.72rem;font-weight:600;line-height:var(--bar-h);padding:0 .4rem;white-space:nowrap;text-decoration:none!important;container-type:inline-size;transition:background .2s,transform .2s}
/* A bar narrower than 24px still takes a 24px-wide tap; the label clips itself, so the bar can't
   use overflow:hidden (that would clip this hit area too). */
.tl-bar::before{content:"";position:absolute;top:0;bottom:0;left:50%;width:max(100%,24px);transform:translateX(-50%)}
.tl-bar:hover,.tl-bar:focus-visible{background:var(--ink);transform:translateY(-1px)}
.tl-bar.emp{background:var(--accent-soft);color:var(--accent)}
.tl-bar.emp:hover,.tl-bar.emp:focus-visible{background:var(--ink);color:var(--on-accent)}
.tl-label{display:block;overflow:hidden;text-overflow:ellipsis}
${labelOutside}
.tl-now{position:absolute;top:1.4rem;bottom:0;left:calc(var(--name) + (100% - var(--name)) * var(--x) / 100);border-left:1.5px dashed var(--ink);pointer-events:none}
/* The label shares the year labels' line (.tl-axis sits .35rem below the rule, .tl-now 1.4rem), so
   Thai tone marks above it clear the rule. */
.tl-now span{position:absolute;top:-1.05rem;right:-.2rem;font-size:.75rem;font-weight:700;background:var(--paper);padding:0 .2rem;white-space:nowrap}
/* Narrower than the strip's minimum, the timeline stacks: lane names become
   headings and each bar a full-width row (short name, dates, and its span drawn as a line on one
   scale from the first year to now), so the whole range shows at once and every row is a 44px tap. */
@container tl (width < ${TL.min}rem){
.tl{--name:1rem;min-width:0}
.tl-axis span:is(:nth-child(even),:last-child){color:transparent}
.tl-now span{right:0}
.tl-lane{grid-template-columns:minmax(0,1fr);padding:.7rem 0 .15rem}
.tl-name{padding:0}
.tl-rows{height:auto;display:grid}
.tl-bar,.tl-bar.emp{position:relative;top:auto;left:auto;width:auto;height:auto;min-height:2.75rem;display:flex;flex-wrap:wrap;align-items:baseline;column-gap:.6rem;padding:.4rem 0 1rem;border-radius:0;background:none;color:var(--ink);font-size:.88rem;line-height:1.35;white-space:normal}
.tl-bar::before{content:none}
.tl-bar::after{content:"";position:absolute;bottom:.4rem;left:calc(var(--name) + (100% - var(--name)) * var(--s) / 100);width:max(.75rem,calc((100% - var(--name)) * var(--w) / 100));height:.375rem;border-radius:999px;background:var(--accent);transition:background .2s}
.tl-bar.emp::after{background:color-mix(in srgb,var(--accent) 30%,var(--paper))}
.tl-bar:is(:hover,:focus-visible),.tl-bar.emp:is(:hover,:focus-visible){background:none;color:var(--ink);transform:none}
.tl-bar:is(:hover,:focus-visible)::after{background:var(--ink)}
.tl-label{overflow:visible}
/* Text knocks the year lines out behind it, so the lines read as scale, not strike-through. */
.tl-label,.tl-dates{background:var(--paper)}
.tl-dates{position:static;width:auto;height:auto;overflow:visible;clip-path:none;font-size:.78rem;font-weight:400;color:var(--muted)}
}

.ixl{border-top:1.5px solid var(--ink)}
/* An employer heading sits on the rows' grid: tenure in the date column, name and role in the title
   column. Its rows follow tight under a hairline; the next employer is set well apart. */
.grp+.grp{margin-top:2.75rem}
.grp-head{display:grid;grid-template-columns:9.5rem minmax(0,1fr);align-items:baseline;gap:1rem;padding:1.1rem .25rem .85rem;border-top:1.5px solid var(--ink);scroll-margin-top:1rem}
.grp-head .ix-when{color:var(--ink-2);font-weight:600}
.grp-head h3{display:flex;flex-wrap:wrap;align-items:baseline;gap:.1rem .75rem;font-size:1.6rem;font-weight:750;line-height:1.2;letter-spacing:-.01em}
:lang(th) .grp-head h3{line-height:1.4}
.grp-role{font-size:1.05rem;font-weight:500;letter-spacing:0;color:var(--ink-2)}
.grp .ixl{border-top:1px solid var(--line)}
.ix{border-bottom:1px solid var(--line);scroll-margin-top:1rem;transition:background .2s}
/* The row or employer a timeline bar (or a shared link) jumps to flashes once, so the eye lands on
   it; a mouse click doesn't show the focus ring that the script moves there. */
.ix:target,.grp-head:target{animation:ix-arrive 1.8s cubic-bezier(.16,1,.3,1)}
@keyframes ix-arrive{from{background:var(--accent-soft)}to{background:transparent}}
.ix summary{list-style:none;cursor:pointer;display:grid;grid-template-columns:9.5rem minmax(0,1fr) minmax(0,14rem) 1.5rem;align-items:baseline;gap:1rem;padding:1rem .25rem}
.ix summary::-webkit-details-marker{display:none}
.ix-when{font-size:.85rem;color:var(--muted);font-variant-numeric:tabular-nums;white-space:nowrap}
.ix-name{font-size:1.25rem;font-weight:650;line-height:1.3;min-width:0;overflow-wrap:anywhere}
.ix-title{display:block}
.ix-name em{display:block;font-style:normal;font-weight:400;font-size:.85rem;color:var(--muted);margin-top:.1rem}
/* The open row's body says it in full, so the headline steps aside. */
.ix-head{display:block;margin-top:.4rem;font-size:.92rem;font-weight:400;line-height:1.45;color:var(--ink-2)}
.ix[open] .ix-head{display:none}
.ix-stack{font-size:.85rem;color:var(--ink-2);text-align:right;min-width:0}
.ix-plus{position:relative;width:1rem;height:1rem;align-self:center}
.ix-plus::before,.ix-plus::after{content:"";position:absolute;left:0;right:0;top:50%;height:2px;background:var(--ink);transition:transform .25s}
.ix-plus::after{transform:rotate(90deg)}
.ix[open] .ix-plus::after{transform:rotate(0)}
.ix-body{padding:0 .25rem 1.4rem 10.75rem;display:grid;gap:.7rem}
/* Reading measure: about 70 characters a line (55ch, as Bricolage sets more letters than zeros to a ch), whatever the row's width. */
.ix-body>p,.ix-body .dash{max-width:55ch}
.ix-link a{font-weight:600;overflow-wrap:anywhere}
/* Added by the script to a row reached from a timeline bar (see script). */
.tl-back{justify-self:start;font-size:.85rem;font-weight:600}
.grp-head .tl-back{grid-column:-2/-1}
.dash{padding-left:1.1rem;list-style-type:"– ";display:grid;gap:.3rem;color:var(--ink-2)}
.ix-body p,.dash li,.ix-head,.foot p{text-wrap:pretty}
.nw{white-space:nowrap}

.sk{border-top:1.5px solid var(--ink)}
.sk-row{display:grid;grid-template-columns:14rem minmax(0,1fr);gap:.6rem 1rem;align-items:baseline;padding:1rem .25rem;border-bottom:1px solid var(--line)}
.sk-row h3{font-size:1.05rem;font-weight:650}
.chips{list-style:none;padding:0;display:flex;flex-wrap:wrap;gap:.45rem}
.chips li{padding:.3rem .75rem;border:1px solid var(--line);border-radius:999px;background:var(--card);font-size:.92rem;font-weight:500;line-height:1.3;max-width:100%;overflow-wrap:anywhere}
.foot h2{margin-bottom:.3rem}
.foot{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(16rem,100%),1fr));gap:1.25rem 2rem;margin-top:3rem;padding:1.5rem 0 3rem;border-top:1px solid var(--line)}
.foot-links{list-style:none;padding:0}
.foot-links a{display:inline-block;padding:.15rem 0;font-weight:600;overflow-wrap:anywhere}
.colophon{grid-column:1/-1;font-size:.85rem}
}

@media screen and (max-width:52rem){
.intro{grid-template-columns:minmax(0,1fr)}
.intro .lede,.intro .contact{grid-column:auto;grid-row:auto}
.sk-row{grid-template-columns:minmax(0,1fr)}
.facts{grid-template-columns:repeat(2,minmax(0,1fr))}
.facts div:nth-child(3){padding-left:0;border-left:0}
.facts div:nth-child(n+3){border-top:1px solid var(--line)}
.grp-head{grid-template-columns:minmax(0,1fr);gap:.2rem}
.grp-head h3{font-size:1.4rem}
.ix summary{grid-template-columns:minmax(0,1fr) 1.5rem;gap:.15rem .75rem}
.ix-when{grid-column:1;grid-row:1}
.ix-name{grid-column:1;grid-row:2}
.ix-stack{grid-column:1;grid-row:3;text-align:left}
.ix-plus{grid-column:2;grid-row:1/span 3}
.ix-body{padding-left:.25rem}
}

/* Narrow for the text size (320px at a 20px+ default font): one fact per row, so a single long
   word like the employer name never overflows its half. */
@media screen and (max-width:19rem){
.facts{grid-template-columns:minmax(0,1fr)}
.facts div+div{padding-left:0;border-left:0;border-top:1px solid var(--line)}
}

/* Touch: the small controls grow to a 44px target; timeline bars get taller rows. */
@media screen and (pointer:coarse){
.tl{--bar-h:2rem}
.lang>*{padding:.875rem 1rem}
.btn{min-height:2.75rem}
.foot-links a,.colophon a{display:inline-block;padding:.75rem 0}
}

/* Surface tints only where a pointer can hover: on touch a tap would leave them stuck on. */
@media screen and (hover:hover){
.btn:hover{background:var(--ink);border-color:var(--ink);color:var(--on-accent)}
.lang a:hover{color:var(--ink);background:var(--card)}
.contact a:hover{background:var(--card)}
.contact a:hover .ct-icon{background:var(--accent);color:var(--on-accent)}
.ix:hover{background:var(--card)}
}

@media screen and (prefers-reduced-motion:reduce){
*,*::before,*::after{transition:none!important;animation:none!important}
.ix:target,.grp-head:target{background:var(--card)}
}
`

// One A4 page, with little to spare: the Thai PDF (taller lines) is the one that overflows first, so
// check its page count after any change to the print text (`x-print`, `x-lede`, skills).
const printStyles = `
@page{size:A4;margin:7mm 10mm}
@media print{
.screen{display:none}
html{font-size:8.75pt}
body{background:var(--card);line-height:1.3}
body:lang(th){line-height:1.36}
.classic .masthead{text-align:center}
.classic .masthead h1{font-size:20pt;font-weight:800;line-height:1.1;letter-spacing:-.01em}
.classic .label{font-size:12pt;font-style:italic;color:var(--accent)}
.classic .contacts{list-style:none;padding:0;margin-top:.4rem;display:flex;flex-wrap:wrap;justify-content:center;gap:.25rem 1rem;font-size:.9rem}
.classic .contacts li{display:inline-flex;align-items:center;gap:.4rem}
.classic section{margin-top:.6rem}
.classic section>h2{display:flex;align-items:center;gap:.5rem;padding-bottom:.2rem;border-bottom:2px solid var(--ink);font-size:.95rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase}
.classic:lang(th) section>h2{letter-spacing:.02em}
.classic section>h2 .icon{width:1.05em;height:1.05em}
.classic .summary,.classic .languages{margin-top:.4rem}
/* Every entry's heading line: name on the left, dates on the right. */
.classic .head{display:flex;align-items:baseline;justify-content:space-between;gap:1rem;font-size:1rem;font-weight:400}
.classic .head strong,.classic h4.head{font-weight:700}
.classic .when{flex:none;font-weight:400;font-size:.92rem;color:var(--ink-2);font-variant-numeric:tabular-nums}
.classic .url{margin-left:.35rem;font-size:.9rem}
.classic .employer,.classic .entry,#c-education .head{margin-top:.3rem}
.classic .employer .entry{margin-top:.25rem;padding-left:.9rem;border-left:2px solid var(--line)}
.classic .entry p{margin-top:.05rem;color:var(--ink-2)}
/* Skill groups run on as one paragraph, a group name in bold before its keywords. */
.classic .skills{margin-top:.3rem}
.classic .skills strong{font-weight:700}
.classic .sep{padding:0 .2rem;color:var(--muted)}
/* Education and languages share the last row, side by side. */
.classic .pair{display:grid;grid-template-columns:auto auto;column-gap:2rem}
.classic section>h2,.classic .head{break-after:avoid}
.classic .entry{break-inside:avoid}
}
`
