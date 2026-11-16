// Renders a JSON Resume into one self-contained page with two layouts:
// - screen: direction A, a big name, a fact strip, a timeline of every project from the first
//   start to now, and expandable index rows;
// - print (Ctrl+P and the downloadable PDF): the classic layout after the owner's old CV, a centred
//   header, uppercase icon headings over a rule, dates in a left column and dash bullets.
// Each layout's CSS sits in its own media block, so they never share rules. Light theme only.
// Latin text is set in Bricolage Grotesque; Thai falls through to Google Sans, whose font file
// covers Thai only.
//
// Extra fields this theme reads beyond the JSON Resume schema: `keywords` on work entries (stack
// tags) and `x-timeline: false` to keep an entry (e.g. a bundle of short projects) off the timeline.

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

const icon = (name) =>
  `<svg class="icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${icons[name].map((d) => `<path d="${d}"/>`).join('')}</svg>`

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

const dashList = (items = []) => (items.length ? `<ul class="dash">${items.map((item) => `<li>${escape(item)}</li>`).join('')}</ul>` : '')

// Consecutive work entries with the same employer become one group, spanning first start to last end.
function groupWork(work = []) {
  const groups = []
  for (const entry of work) {
    const last = groups.at(-1)
    if (last && last.name === entry.name) last.entries.push(entry)
    else groups.push({ name: entry.name, entries: [entry] })
  }
  for (const group of groups) {
    group.start = group.entries.map((e) => e.startDate).sort()[0]
    group.end = group.entries.some((e) => !e.endDate) ? undefined : group.entries.map((e) => e.endDate).sort().at(-1)
    group.title = group.entries[0].description
  }
  return groups
}

const projectLane = (type = '') => (/freelance|ฟรีแลนซ์/i.test(type) ? 'freelance' : /open|โอเพน/i.test(type) ? 'openSource' : 'personal')

export function render(resume, options) {
  const { lang, labels } = options
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(resume.basics.name)} – ${escape(resume.basics.label)}</title>
<meta name="description" content="${escape(labels.description)}">
${lang === 'th' ? '<meta name="robots" content="noindex, nofollow">' : ''}
<link rel="icon" type="image/svg+xml" href="favicon.svg">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
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

function screen(resume, { labels, pdfName, now }) {
  const { basics, work = [], projects = [], skills = [], education = [], languages = [] } = resume
  const groups = groupWork(work)
  const firstYear = work.map((w) => w.startDate).sort()[0].slice(0, 4)
  const current = groups.find((g) => !g.end)
  const facts = [
    [labels.role, basics.label],
    [labels.basedIn, [basics.location?.city, basics.location?.countryCode].filter(Boolean).join(', ')],
    [labels.since, firstYear],
    [labels.nowAt, current?.name],
  ].filter(([, v]) => v)
  const contacts = [
    { text: [basics.location?.city, labels.country].filter(Boolean).join(', ') },
    { text: basics.email, href: `mailto:${basics.email}` },
    ...basics.profiles.map((p) => ({ text: p.network === 'LinkedIn' ? 'LinkedIn' : displayUrl(p.url), href: p.url })),
  ]
  const workItems = work.map((w) => ({ ...w, id: `w-${slug(w.position)}`, title: w.position, org: w.name, text: w.summary }))
  const projectItems = projects.map((p) => ({ ...p, id: `p-${slug(p.name)}`, title: p.name, org: p.type, text: p.description }))

  return `<div class="screen">
<header class="wrap head">
  <div class="top"><p class="eyebrow">${escape(labels.eyebrow)} · ${new Date(`${now}-01`).getFullYear()}</p>
    <div class="acts"><a class="btn solid" href="${escape(pdfName)}" download>${escape(labels.download)}</a><a class="btn" href="resume.json" target="_blank" rel="noopener">JSON Resume</a></div>
  </div>
  <h1 class="name">${basics.name.split(' ').map(escape).join('<br>')}</h1>
  <p class="label">${escape(basics.label)}</p>
  <dl class="facts">${facts.map(([k, v]) => `<div><dt>${escape(k)}</dt><dd>${escape(v)}</dd></div>`).join('')}</dl>
</header>
<main class="wrap">
  <p class="lede">${escape(basics.summary)}</p>
  <ul class="contacts">${contacts.map((c) => `<li>${c.href ? `<a href="${escape(c.href)}"${c.href.startsWith('http') ? ' target="_blank" rel="noopener"' : ''}>${escape(c.text)}</a>` : escape(c.text)}</li>`).join('')}</ul>

  <h2 class="sec"><span>${escape(labels.glance(firstYear))}</span><small>${escape(labels.glanceHint)}</small></h2>
  <div class="tl-scroll">${timeline({ groups, workItems, projectItems, labels, now, firstYear })}</div>

  <h2 class="sec"><span>${escape(labels.work)}</span><small>${groups.map((g) => `${escape(g.name)} ${span(g.start, g.end, labels.present)}`).join(' · ')}</small></h2>
  <div class="ixl">${indexRows(workItems, labels, 1)}</div>

  <h2 class="sec"><span>${escape(labels.projectsLong)}</span></h2>
  <div class="ixl">${indexRows(projectItems, labels)}</div>

  <h2 class="sec"><span>${escape(labels.skills)}</span></h2>
  <div class="skills">${skills.map((s) => `<div><h3>${escape(s.name)}</h3><p>${escape(s.keywords.join(', '))}</p></div>`).join('')}</div>

  <footer class="foot">
    <div><h3>${escape(labels.education)}</h3>${education.map((e) => `<p>${escape(e.studyType)} – ${escape(e.area)}, ${escape(e.institution)}, ${date(e.startDate)}–${date(e.endDate)}</p>`).join('')}</div>
    <div><h3>${escape(labels.languages)}</h3><p>${languages.map((l) => `${escape(l.language)} (${escape(l.fluency)})`).join(' · ')}</p></div>
  </footer>
</main>
</div>`
}

function indexRows(items, labels, open = 0) {
  return items
    .map(
      (it, i) => `<details class="ix" id="${it.id}"${i < open ? ' open' : ''}>
  <summary><span class="ix-when">${span(it.startDate, it.endDate, labels.present)}</span><span class="ix-name">${escape(it.title)}<em>${escape(it.org)}</em></span><span class="ix-stack">${escape((it.keywords ?? []).slice(0, 3).join(' · '))}</span><span class="ix-plus" aria-hidden="true"></span></summary>
  <div class="ix-body"><p>${escape(it.text)}</p>${dashList(it.highlights)}${it.url ? `<p class="ix-link"><a href="${escape(it.url)}" target="_blank" rel="noopener">${escape(displayUrl(it.url))} ↗</a></p>` : ''}</div>
</details>`,
    )
    .join('')
}

// Bars placed on one month scale from January of the first year to the end of next year. Each lane
// packs its bars into as few rows as fit without overlap.
function timeline({ groups, workItems, projectItems, labels, now, firstYear }) {
  const start = Number(firstYear)
  const end = Number(now.slice(0, 4)) + 1
  const total = (end - start) * 12
  const month = (d) => {
    const [y, m] = (d || now).split('-').map(Number)
    return (y - start) * 12 + ((m || 1) - 1)
  }
  const pct = (n) => ((n / total) * 100).toFixed(3)
  const pack = (items) => {
    const rows = []
    for (const it of [...items].sort((a, b) => month(a.startDate) - month(b.startDate))) {
      const s = month(it.startDate)
      let row = rows.find((r) => r.end <= s)
      if (!row) rows.push((row = { end: 0, items: [] }))
      row.items.push(it)
      row.end = month(it.endDate) + 1
    }
    return rows
  }
  const employers = groups.map((g) => ({ title: g.name, startDate: g.start, endDate: g.end, id: workItems.find((w) => w.name === g.name).id, employer: true }))
  const lanes = [
    [labels.lanes.employer, [{ items: employers }]],
    [labels.lanes.work, pack(workItems.filter((w) => w['x-timeline'] !== false && w.name === (groups.find((g) => !g.end) ?? groups[0]).name))],
    ...['freelance', 'personal', 'openSource'].map((lane) => [labels.lanes[lane], pack(projectItems.filter((p) => projectLane(p.type) === lane))]),
  ].filter(([, rows]) => rows.length && rows[0].items.length)
  // Earlier employers' own entries would duplicate their employer bar, so only the current
  // employer's projects get the Work lane.
  const years = Array.from({ length: end - start + 1 }, (_, i) => start + i)
  const bar = (it) => {
    const s = month(it.startDate)
    const e = month(it.endDate) + 1
    const name = it.title.replace(/ \(.*\)$/, '')
    return `<a class="tl-bar${it.employer ? ' emp' : ''}${it.endDate ? '' : ' live'}" href="#${it.id}" style="left:${pct(s)}%;width:${pct(e - s)}%" title="${escape(name)} · ${span(it.startDate, it.endDate, labels.present)}"><span>${escape(name)}</span></a>`
  }
  return `<figure class="tl">
  <div class="tl-axis" aria-hidden="true">${years.map((y) => `<span style="left:${pct((y - start) * 12)}%">${y === end ? '' : y}</span>`).join('')}</div>
  ${lanes.map(([name, rows]) => `<div class="tl-lane"><div class="tl-name">${escape(name)}</div><div class="tl-rows">${rows.map((row) => `<div class="tl-row">${row.items.map(bar).join('')}</div>`).join('')}</div></div>`).join('')}
  <div class="tl-now" aria-hidden="true" style="--x:${pct(month(now) + 0.5)}"><span>${escape(labels.lanes.now)}</span></div>
</figure>`
}

// Opens a row when a timeline bar (or any link) points at it.
const script = `(() => {
  const open = () => {
    const el = location.hash && document.getElementById(decodeURIComponent(location.hash.slice(1)))
    if (el && el.tagName === 'DETAILS') { el.open = true; el.scrollIntoView({ block: 'start' }) }
  }
  addEventListener('hashchange', open)
  open()
})()`

// ---------------------------------------------------------------- print (classic)

function classic(resume, { labels }) {
  const { basics, work, projects = [], skills = [], education = [], languages = [] } = resume
  const contacts = [
    basics.location && { icon: 'pin', text: [basics.location.city, labels.country].filter(Boolean).join(', ') },
    { icon: 'mail', text: basics.email, href: `mailto:${basics.email}` },
    { icon: 'globe', text: displayUrl(basics.url), href: basics.url },
    ...basics.profiles.map((p) => ({ icon: 'link', text: displayUrl(p.url), href: p.url })),
  ].filter(Boolean)
  const section = (id, iconName, title, body) => `<section id="c-${id}"><h2>${icon(iconName)}<span>${escape(title)}</span></h2>${body}</section>`

  const educationBody = education
    .map((e) => `<div class="row"><div class="body"><p><strong>${escape(e.studyType)} – ${escape(e.area)},</strong> <em>${escape(e.institution)}</em></p></div><p class="when">${date(e.startDate)} – ${date(e.endDate)}</p></div>`)
    .join('')
  const workBody = groupWork(work)
    .map(
      (g) => `<article class="row employer"><div class="body">
    <h3><strong>${escape(g.name)},</strong> <em>${escape(g.title)}</em></h3>
    ${g.entries.map((e) => `<div class="entry"><h4>${escape(e.position)} <span class="dates">${span(e.startDate, e.endDate, labels.present)}</span></h4>${e.summary ? `<p>${escape(e.summary)}</p>` : ''}${dashList(e.highlights)}</div>`).join('')}
  </div><p class="when">${span(g.start, g.end, labels.present)}</p></article>`,
    )
    .join('')
  const projectsBody = projects
    .map(
      (p) => `<article class="row"><div class="body">
    <h3><strong>${escape(p.name)},</strong> <em>${escape(p.type)}</em>${p.url ? ` <a class="url" href="${escape(p.url)}">${escape(displayUrl(p.url))}</a>` : ''}</h3>
    <p>${escape(p.description)}</p>${dashList(p.highlights)}${p.keywords?.length ? `<p class="stack">${escape(p.keywords.join(' · '))}</p>` : ''}
  </div><p class="when">${span(p.startDate, p.endDate, labels.present)}</p></article>`,
    )
    .join('')

  return `<article class="classic">
<header class="masthead">
  <h1>${escape(basics.name)}</h1>
  <p class="label">${escape(basics.label)}</p>
  <ul class="contacts">${contacts.map((c) => `<li>${icon(c.icon)}${c.href ? `<a href="${escape(c.href)}">${escape(c.text)}</a>` : escape(c.text)}</li>`).join('')}</ul>
</header>
${section('summary', 'summary', labels.summary, `<p class="summary">${escape(basics.summary)}</p>`)}
${section('education', 'education', labels.education, educationBody)}
${section('work', 'briefcase', labels.work, workBody)}
${section('projects', 'folder', labels.projects, projectsBody)}
${section('skills', 'code', labels.skills, `<div class="skills">${skills.map((s) => `<div><h3>${escape(s.name)}</h3><p>${escape(s.keywords.join(', '))}</p></div>`).join('')}</div>`)}
${section('languages', 'globe', labels.languages, `<ul class="dash languages">${languages.map((l) => `<li>${escape(l.language)} (${escape(l.fluency)})</li>`).join('')}</ul>`)}
</article>`
}

// ---------------------------------------------------------------- styles

const fontFaces = (path) => `
@font-face{font-family:"Bricolage Grotesque";font-style:normal;font-weight:400 800;font-display:swap;src:url("${path}/bricolage-grotesque-400-800-latin.woff2") format("woff2");unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:"Bricolage Grotesque";font-style:normal;font-weight:400 800;font-display:swap;src:url("${path}/bricolage-grotesque-400-800-latin-ext.woff2") format("woff2");unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C4,U+2113,U+2C60-2C7F,U+A720-A7FF}
@font-face{font-family:"Google Sans";font-style:normal;font-weight:400 700;font-display:swap;src:url("${path}/google-sans-400-700-thai.woff2") format("woff2");unicode-range:U+02D7,U+0303,U+0331,U+0E01-0E5B,U+200C-200D,U+25CC}
:root{
  color-scheme:light;
  --ink:#0e1430;--ink-2:#3a4266;--muted:#5f6789;--line:#d8dcea;--paper:#f6f7fb;--card:#fff;
  --accent:#2f54eb;--accent-soft:#e6ebfd;
  --font:"Bricolage Grotesque","Google Sans",ui-sans-serif,system-ui,sans-serif;
}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;font-family:var(--font);color:var(--ink);font-variant-ligatures:none}
h1,h2,h3,h4,p,ul,dl,dd,figure{margin:0}
a{color:var(--accent);text-decoration:none}
.icon{width:1em;height:1em;flex:none}
`

const screenStyles = `
@media screen{
.classic{display:none}
body{background:var(--paper);font-size:16px;line-height:1.5}
body:lang(th){line-height:1.65}
a:hover{text-decoration:underline}
a:focus-visible,summary:focus-visible{outline:2px solid var(--accent);outline-offset:3px;border-radius:4px}
.wrap{max-width:72rem;margin:0 auto;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))}

.btn{display:inline-flex;align-items:center;padding:.5rem 1rem;border:1.5px solid var(--accent);border-radius:999px;font-size:.9rem;font-weight:600;text-decoration:none!important;transition:background .2s,color .2s,border-color .2s}
.btn.solid{background:var(--accent);color:#fff}
.btn:hover{background:var(--ink);border-color:var(--ink);color:#fff}
.acts{display:flex;flex-wrap:wrap;gap:.5rem}

.head{padding-top:2.5rem}
.top{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:1rem}
.eyebrow{font-size:.8rem;letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}
.name{font-weight:800;font-size:clamp(3.2rem,11vw,9.5rem);line-height:.88;letter-spacing:-.035em;margin-top:1.5rem}
.label{margin-top:.9rem;font-size:clamp(1.2rem,2vw,1.6rem);font-weight:500;color:var(--accent)}
.facts{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));margin-top:1.75rem;border-top:1.5px solid var(--ink);border-bottom:1px solid var(--line)}
.facts div{padding:.8rem 1rem .9rem 0;min-width:0}
.facts div+div{padding-left:1rem;border-left:1px solid var(--line)}
.facts dt{font-size:.72rem;letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}
.facts dd{font-size:1.2rem;font-weight:600;margin-top:.15rem}
:lang(th) .facts dt,:lang(th) .eyebrow{letter-spacing:.02em}

.lede{font-size:clamp(1.1rem,1.6vw,1.35rem);line-height:1.5;max-width:46rem;margin-top:2.25rem;text-wrap:pretty}
.contacts{list-style:none;padding:0;display:flex;flex-wrap:wrap;gap:.4rem 1.5rem;margin-top:1.25rem;font-size:.95rem}
.contacts li:first-child{color:var(--muted)}
.sec{display:flex;flex-wrap:wrap;align-items:baseline;justify-content:space-between;gap:.25rem 1rem;margin:3.5rem 0 1rem;font-size:clamp(1.5rem,3vw,2.1rem);font-weight:750;letter-spacing:-.015em;text-wrap:balance}
.sec small{font-size:.85rem;font-weight:400;color:var(--muted);letter-spacing:0}

.tl-scroll{overflow-x:auto;padding-bottom:.5rem}
.tl{--name:6.5rem;position:relative;min-width:46rem;padding-top:1.6rem;border-top:1.5px solid var(--ink)}
.tl-axis{position:absolute;top:.35rem;bottom:0;left:var(--name);right:0;pointer-events:none}
.tl-axis span{position:absolute;top:0;bottom:0;transform:translateX(-50%);font-size:.75rem;color:var(--muted);font-variant-numeric:tabular-nums}
.tl-axis span::after{content:"";position:absolute;left:50%;top:1.25rem;bottom:0;border-left:1px solid var(--line)}
.tl-lane{position:relative;display:grid;grid-template-columns:var(--name) minmax(0,1fr);align-items:start;border-bottom:1px solid var(--line);padding:.45rem 0}
.tl-name{font-size:.72rem;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);padding-top:.25rem}
:lang(th) .tl-name{letter-spacing:0}
.tl-rows{display:grid;gap:.3rem}
.tl-row{position:relative;height:1.55rem}
.tl-bar{position:absolute;top:0;bottom:0;min-width:6px;border-radius:4px;background:var(--accent);color:#fff;font-size:.72rem;font-weight:600;line-height:1.55rem;padding:0 .4rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-decoration:none!important;transition:background .2s,transform .2s}
.tl-bar:hover,.tl-bar:focus-visible{background:var(--ink);transform:translateY(-1px)}
.tl-bar.emp{background:var(--accent-soft);color:var(--accent)}
.tl-bar.emp:hover,.tl-bar.emp:focus-visible{background:var(--ink);color:#fff}
.tl-bar.live{background-image:linear-gradient(90deg,transparent calc(100% - 10px),rgb(255 255 255 / .35) 0)}
.tl-now{position:absolute;top:1.4rem;bottom:0;left:calc(var(--name) + (100% - var(--name)) * var(--x) / 100);border-left:1.5px dashed var(--ink);pointer-events:none}
.tl-now span{position:absolute;top:-1.35rem;left:-.9rem;font-size:.7rem;font-weight:700;background:var(--paper);padding:0 .2rem;white-space:nowrap}

.ixl{border-top:1.5px solid var(--ink)}
.ix{border-bottom:1px solid var(--line);scroll-margin-top:1rem}
.ix summary{list-style:none;cursor:pointer;display:grid;grid-template-columns:9.5rem minmax(0,1fr) minmax(0,14rem) 1.5rem;align-items:baseline;gap:1rem;padding:1rem .25rem;transition:background .2s}
.ix summary::-webkit-details-marker{display:none}
.ix summary:hover{background:var(--card)}
.ix-when{font-size:.85rem;color:var(--muted);font-variant-numeric:tabular-nums;white-space:nowrap}
.ix-name{font-size:1.25rem;font-weight:650;line-height:1.25;min-width:0}
.ix-name em{display:block;font-style:normal;font-weight:400;font-size:.85rem;color:var(--muted);margin-top:.1rem}
.ix-stack{font-size:.85rem;color:var(--ink-2);text-align:right;min-width:0}
.ix-plus{position:relative;width:1rem;height:1rem;align-self:center}
.ix-plus::before,.ix-plus::after{content:"";position:absolute;left:0;right:0;top:50%;height:2px;background:var(--ink);transition:transform .25s}
.ix-plus::after{transform:rotate(90deg)}
.ix[open] .ix-plus::after{transform:rotate(0)}
.ix-body{padding:0 .25rem 1.4rem 10.75rem;max-width:57rem;display:grid;gap:.7rem}
.ix-link a{font-weight:600}
.dash{padding-left:1.1rem;list-style-type:"– ";display:grid;gap:.3rem;color:var(--ink-2)}

.skills{display:grid;grid-template-columns:repeat(auto-fit,minmax(14rem,1fr));gap:1.25rem 2rem;margin-top:1rem}
.skills h3,.foot h3{font-size:.75rem;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);font-weight:600;margin-bottom:.3rem}
:lang(th) .skills h3,:lang(th) .foot h3{letter-spacing:0;font-size:.85rem}
.foot{display:grid;grid-template-columns:repeat(auto-fit,minmax(16rem,1fr));gap:1.25rem 2rem;margin-top:3rem;padding:1.5rem 0 3rem;border-top:1px solid var(--line)}
}

@media screen and (max-width:52rem){
.facts{grid-template-columns:repeat(2,minmax(0,1fr))}
.facts div:nth-child(3){padding-left:0;border-left:0}
.facts div:nth-child(n+3){border-top:1px solid var(--line)}
.ix summary{grid-template-columns:minmax(0,1fr) 1.5rem;gap:.15rem .75rem}
.ix-when{grid-column:1;grid-row:1}
.ix-name{grid-column:1;grid-row:2}
.ix-stack{grid-column:1;grid-row:3;text-align:left}
.ix-plus{grid-column:2;grid-row:1/span 3}
.ix-body{padding-left:.25rem}
}

@media screen and (prefers-reduced-motion:reduce){
*,*::before,*::after{transition:none!important;animation:none!important}
}
`

const printStyles = `
@page{size:A4;margin:10mm 11mm}
@media print{
.screen{display:none}
html{font-size:9.5pt}
body{background:#fff;line-height:1.3}
body:lang(th){line-height:1.5}
.classic .masthead{text-align:center}
.classic .masthead h1{font-size:22pt;font-weight:800;line-height:1.1;letter-spacing:-.01em}
.classic .label{font-size:13pt;font-style:italic;color:var(--accent)}
.classic .contacts{list-style:none;padding:0;margin-top:.5rem;display:flex;flex-wrap:wrap;justify-content:center;gap:.35rem 1.25rem;font-size:.92rem}
.classic .contacts li{display:inline-flex;align-items:center;gap:.4rem}
.classic section{margin-top:1rem}
.classic section>h2{display:flex;align-items:center;gap:.5rem;padding-bottom:.2rem;border-bottom:2px solid var(--ink);font-size:.95rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase}
.classic:lang(th) section>h2{letter-spacing:.02em}
.classic section>h2 .icon{width:1.05em;height:1.05em}
.classic .summary{margin-top:.6rem}
.classic .row{display:grid;grid-template-columns:8.5rem minmax(0,1fr);column-gap:1.25rem;margin-top:.45rem}
.classic .row .body{grid-column:2;grid-row:1}
.classic .row .when{grid-column:1;grid-row:1;white-space:nowrap}
.classic .row h3{font-size:1rem;font-weight:400}
.classic .row h3 strong{font-weight:700}
.classic .row .url{margin-left:.35rem;font-size:.9rem}
.classic .row p{margin-top:.15rem}
.classic .employer+.employer{margin-top:.7rem}
.classic .entry{margin-top:.4rem}
.classic .entry h4{font-size:1rem;font-weight:700}
.classic .dates{margin-left:.4rem;font-weight:400;font-size:.88rem;color:var(--muted)}
.classic .dash{padding-left:1.1rem;margin-top:.2rem;list-style-type:"-  "}
.classic .dash li+li{margin-top:.1rem}
.classic .stack{color:var(--muted);font-size:.9rem}
.classic .skills{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.6rem 1.5rem;margin-top:.6rem}
.classic .skills h3{font-size:1rem;font-weight:700}
.classic .languages{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));column-gap:1.5rem;margin-top:.6rem}
.classic section>h2,.classic .row h3,.classic .entry h4{break-after:avoid}
.classic li,.classic .skills>div,#c-education .row,#c-languages{break-inside:avoid}
}
`
