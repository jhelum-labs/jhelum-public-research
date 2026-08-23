/**
 * extract.mjs
 * -----------
 * Converts the W-1.1 research .docx files (on the D: drive) into static,
 * self-contained HTML articles under public/research/ so the React app can
 * render them without any runtime dependency on the .docx sources.
 *
 * For each document it writes:
 *   - public/research/{slug}.html        -> the full article body (semantic HTML)
 *   - public/research/index.json         -> metadata for all articles (cards, routing)
 *
 * Embedded images (if any) are inlined as base64 data-URIs so nothing breaks.
 */

import { promises as fs } from 'node:fs'
import path from 'node:path'
import mammoth from 'mammoth'

// --------------------------------------------------------------------------
// Configuration
// --------------------------------------------------------------------------
const SOURCES = {
  'Research Paper': 'D:/W-1.1/W-1.1-Model/W-1-1_documents/Research-papers',
  'Production Document': 'D:/W-1.1/W-1.1-Model/W-1-1_documents/production-documents',
}

const OUT_DIR = path.join(process.cwd(), 'public', 'research')
const PAD = (l) => String(l).padStart(2, ' ')
const now = () =>
  `[${new Date().toISOString().replace('T', ' ').slice(0, 19)}]`

// Clean a filename into a URL-safe slug.
function slugify(fileName) {
  return fileName
    .replace(/\.docx$/i, '')
    .replace(/\(\d+\)/g, '') // strip trailing (n) disambiguators
    .replace(/\s+/g, '-')
    .toLowerCase()
}

// Clean a filename into a readable title, keeping the W-1.1 prefix intact.
function titleFromFileName(fileName) {
  let base = fileName
    .replace(/\.docx$/i, '')
    .replace(/\(\d+\)/g, '')
    .trim()

  // Protect the W-1.1 model prefix from the word-splitting below.
  const prefixMatch = base.match(/^w-?1\.?1[\s-]+/i)
  if (prefixMatch) {
    const rest = base.slice(prefixMatch[0].length)
    const titled = rest
      .replace(/[-_]+/g, ' ')
      .trim()
      .split(/\s+/)
      .map((w) => (w[0] ? w[0].toUpperCase() + w.slice(1) : w))
      .join(' ')
    return titled ? `W-1.1 ${titled}` : 'W-1.1'
  }

  return base
    .replace(/[-_]+/g, ' ')
    .trim()
    .split(/\s+/)
    .map((w) => (w[0] ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ')
}

// Extract a short human-readable excerpt from the raw text.
function makeExcerpt(rawText, max = 320) {
  const text = rawText.replace(/\s+/g, ' ').trim()
  if (!text) return ''
  if (text.length <= max) return text
  const cut = text.slice(0, max)
  const lastSpace = cut.lastIndexOf(' ')
  return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut) + '…'
}

// Convert an embedded image to a base64 data URI (so it is self-contained).
function convertImage(image) {
  return image.toBuffer().then((buffer) => ({
    src: `data:${image.contentType};base64,${buffer.toString('base64')}`,
    width: `${image.width}px`,
    height: `${image.height}px`,
  }))
}

async function processFile(category, fileName) {
  const fullPath = path.join(SOURCES[category], fileName)
  const slug = slugify(fileName)

  const stats = await fs.stat(fullPath)
  const title = titleFromFileName(fileName)

  const raw = await mammoth.extractRawText({ path: fullPath })
  const excerpt = makeExcerpt(raw.value)

  const htmlResult = await mammoth.convertToHtml(
    { path: fullPath },
    { convertImage: mammoth.images.imgElement(convertImage) },
  )

  const sizeMB = (stats.size / (1024 * 1024)).toFixed(2) + ' MB'
  const date = stats.mtime.toISOString().slice(0, 10)

  return {
    slug,
    title,
    category,
    date,
    sizeMB,
    excerpt,
    contentHtml: htmlResult.value,
    warnings: htmlResult.messages.length,
  }
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true })

  const articles = []
  let skipped = []

  for (const [category, dir] of Object.entries(SOURCES)) {
    let files = []
    try {
      files = await fs.readdir(dir)
    } catch {
      console.warn(`${now()} WARN: could not read ${dir} (does the D: drive exist?)`)
      continue
    }
    files
      .filter((f) => f.toLowerCase().endsWith('.docx'))
      .sort()
      .forEach((fileName) => {
        console.log(`${now()} Processing [${category}] ${fileName}`)
        articles.push(processFile(category, fileName))
      })
  }

  const resolved = await Promise.all(articles)

  for (const a of resolved) {
    await fs.writeFile(
      path.join(OUT_DIR, `${a.slug}.html`),
      a.contentHtml,
      'utf8',
    )
    console.log(`${now()}   -> wrote ${a.slug}.html`)
  }

  // Sort newest-first (grid shows recent work on top) and strip contentHtml
  // (articles fetch it separately). Keep a reference for the source doc.
  const sorted = resolved.sort((a, b) => (a.date < b.date ? 1 : -1))
  const index = sorted.map((a) => {
    const { contentHtml, warnings, ...meta } = a
    return meta
  })

  await fs.writeFile(
    path.join(OUT_DIR, 'index.json'),
    JSON.stringify(index, null, 2),
    'utf8',
  )

  console.log('---------------------------------------------')
  console.log(`${now()} Done. ${index.length} articles written to public/research/`)
  console.log(`${now()} index.json contains ${index.length} entries.`)
  if (skipped.length) {
    console.warn(`${now()} Skipped: ${skipped.join(', ')}`)
  }
}

main().catch((err) => {
  console.error('Fatal error during extraction:', err)
  process.exit(1)
})