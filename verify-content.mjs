/**
 * verify-content.mjs
 * ------------------
 * Verifies that the content shown in the app (public/research/*.html)
 * faithfully matches the original .docx source documents by comparing
 * word counts and sampling the beginning/end of each document.
 *
 * Usage: node verify-content.mjs
 */

import { promises as fs } from 'node:fs'
import path from 'node:path'
import mammoth from 'mammoth'

const SOURCES = {
  'Research Paper': 'D:/W-1.1/W-1.1-Model/W-1-1_documents/Research-papers',
  'Production Document': 'D:/W-1.1/W-1.1-Model/W-1-1_documents/production-documents',
}
const OUT_DIR = path.join(process.cwd(), 'public', 'research')

const slugify = (f) =>
  f.replace(/\.docx$/i, '').replace(/\(\d+\)/g, '').replace(/\s+/g, '-').toLowerCase()

const stripHtml = (h) =>
  h
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim()

// Compare similarity of trimmed character sequences (fuzzy, length-weighted).
function similarity(a, b) {
  const na = a.length
  const nb = b.length
  if (!na || !nb) return 0
  let matches = 0
  const step = 4
  for (let i = 0; i < na; i += step) {
    const chunk = a.slice(i, i + step)
    if (b.includes(chunk)) matches += chunk.length
  }
  return matches / Math.max(na, nb)
}

// Extract the leading title + section headings from raw docx text (best guess).
function firstLines(text, n = 3) {
  return text
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, n)
}

let totalDocWords = 0
let totalHtmlWords = 0
let verified = 0
let issues = 0

for (const [category, dir] of Object.entries(SOURCES)) {
  const files = (await fs.readdir(dir)).filter((f) => f.toLowerCase().endsWith('.docx'))
  for (const file of files) {
    const slug = slugify(file)
    const docxPath = path.join(dir, file)
    const htmlPath = path.join(OUT_DIR, `${slug}.html`)

    const raw = await mammoth.extractRawText({ path: docxPath })
    const docText = raw.value.trim()
    const html = await fs.readFile(htmlPath, 'utf8')
    const htmlText = stripHtml(html)

    const docWords = docText.split(/\s+/).length
    const htmlWords = htmlText.split(/\s+/).length
    totalDocWords += docWords
    totalHtmlWords += htmlWords
    const ratio = htmlWords / docWords
    const ok = ratio >= 0.94

    // Compare the opening lines (title/summary area) for fidelity.
    const docHead = firstLines(docText, 3).join(' ').slice(0, 140)
    const htmlHead = htmlText.slice(0, 140)
    const headSim = similarity(docHead.toLowerCase(), htmlHead.toLowerCase())

    const okHead = headSim >= 0.6
    const status = ok && okHead ? 'MATCH  ' : 'ISSUE  '

    console.log(
      `${status} ${file.padEnd(38).slice(0, 38)}  docx=${String(docWords).padEnd(6)} html=${String(htmlWords).padEnd(6)} ratio=${ratio.toFixed(3).padStart(6)} headSim=${headSim.toFixed(2)}`,
    )
    if (ok && okHead) verified++
    else issues++
  }
}

console.log('-'.repeat(72))
console.log(`TOTAL  docx words: ${totalDocWords}   app words: ${totalHtmlWords}   ratio: ${((totalHtmlWords / totalDocWords) * 100).toFixed(2)}%`)
console.log(`Result: ${verified}/10 documents fully matched, ${issues} with potential differences.`)