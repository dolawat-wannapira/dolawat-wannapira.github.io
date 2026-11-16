// Builds the site into site/: the English resume at the root and the Thai one in site/th/, each
// with its page, PDF, resume.json, favicon and fonts. The page comes from scripts/theme.js; the PDF
// is Chrome printing that same page (its print layout is the classic CV), so both always match.
import { copyFileSync, cpSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import puppeteer from 'puppeteer'
import { render } from './theme.js'

const OUT = 'site'

const versions = [
  {
    file: 'resume.json',
    dir: OUT,
    lang: 'en',
    pdfSuffix: '',
    labels: {
      summary: 'Professional Summary',
      education: 'Education',
      work: 'Professional Experience',
      projects: 'Projects',
      projectsLong: 'Freelance, personal and open source',
      skills: 'Skills',
      languages: 'Languages',
      present: 'Present',
      download: 'Download PDF',
      country: 'Thailand',
      eyebrow: 'Curriculum vitae',
      stack: 'Main stack',
      basedIn: 'Based in',
      since: 'Shipping since',
      nowAt: 'Now at',
      contact: 'Contact',
      email: 'Email',
      language: 'Language',
      skip: 'Skip to experience',
      glance: (year) => `${year} to now at a glance`,
      glanceHint: 'Each bar is a project; choose one to open it',
      backToTimeline: 'Back to the timeline',
      lanes: { employer: 'Employers', work: 'Work projects', freelance: 'Freelance', personal: 'Personal', openSource: 'Open source', now: 'now' },
    },
  },
  // The Thai page is reached through the language switcher but kept out of search results (the
  // theme adds noindex for lang "th").
  {
    file: 'resume.th.json',
    dir: `${OUT}/th`,
    lang: 'th',
    pdfSuffix: '-TH',
    labels: {
      summary: 'สรุปประวัติ',
      education: 'การศึกษา',
      work: 'ประสบการณ์ทำงาน',
      projects: 'โปรเจกต์',
      projectsLong: 'งานฟรีแลนซ์ โปรเจกต์ส่วนตัว และโอเพนซอร์ส',
      skills: 'ทักษะ',
      languages: 'ภาษา',
      present: 'ปัจจุบัน',
      download: 'ดาวน์โหลด PDF',
      country: 'ประเทศไทย',
      eyebrow: 'ประวัติการทำงาน',
      stack: 'เทคโนโลยีหลัก',
      basedIn: 'ที่อยู่',
      since: 'ทำงานมาตั้งแต่',
      nowAt: 'ปัจจุบันทำงานที่',
      contact: 'ติดต่อ',
      email: 'อีเมล',
      language: 'ภาษา',
      skip: 'ข้ามไปที่ประสบการณ์ทำงาน',
      glance: (year) => `ภาพรวมตั้งแต่ ${year} ถึงปัจจุบัน`,
      glanceHint: 'แต่ละแท่งคือหนึ่งโปรเจกต์ กดเพื่อเปิดรายละเอียด',
      backToTimeline: 'กลับไปที่ภาพรวม',
      lanes: { employer: 'บริษัท', work: 'โปรเจกต์ที่บริษัท', freelance: 'ฟรีแลนซ์', personal: 'ส่วนตัว', openSource: 'โอเพนซอร์ส', now: 'ตอนนี้' },
    },
  },
]

// The language switcher on each page; hrefs are relative to that page's folder.
const switcher = {
  en: [{ lang: 'en', label: 'EN' }, { lang: 'th', label: 'ไทย', href: 'th/' }],
  th: [{ lang: 'en', label: 'EN', href: '../' }, { lang: 'th', label: 'ไทย' }],
}

const browser = process.env.SKIP_PDF ? undefined : await puppeteer.launch()
try {
  for (const version of versions) await buildVersion(version)
} finally {
  await browser?.close()
}

async function buildVersion({ file, dir, lang, pdfSuffix, labels }) {
  const resume = JSON.parse(readFileSync(file, 'utf8'))
  const pdfName = `${resume.basics.name.replace(/\s+/g, '-')}-CV${pdfSuffix}.pdf`
  const description = `${resume.basics.name}, ${resume.basics.label}. ${resume.basics.summary.split(/(?<=\.)\s/)[0]}`

  mkdirSync(dir, { recursive: true })
  // "now" ends the ongoing bars on the timeline; CI rebuilds on every push.
  const now = new Date().toISOString().slice(0, 7)
  writeFileSync(`${dir}/index.html`, render(resume, { lang, pdfName, now, languages: switcher[lang], labels: { ...labels, description } }))
  copyFileSync(file, `${dir}/resume.json`)
  for (const icon of ['favicon.svg', 'apple-touch-icon.png']) copyFileSync(`assets/${icon}`, `${dir}/${icon}`)
  cpSync('assets/fonts', `${dir}/fonts`, { recursive: true })

  if (!browser) {
    console.log(`Skipped PDF for ${dir} (SKIP_PDF is set)`)
  } else {
    // Load the built file (not setContent) so the self-hosted fonts resolve; wait for them before
    // printing. The page's @page rule sets A4 and the margins.
    const page = await browser.newPage()
    await page.goto(pathToFileURL(resolve(dir, 'index.html')).href, { waitUntil: 'networkidle0' })
    await page.evaluate(() => document.fonts.ready)
    await page.pdf({ path: `${dir}/${pdfName}`, preferCSSPageSize: true, printBackground: true })
    await page.close()
  }
  console.log(`Built ${dir}/`)
}
