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
const SOURCES = [
  {
    category: 'Research Paper',
    dir: 'D:/W-1.1/W-1.1-Model/W-1-1_documents/Research-papers',
  },
  {
    category: 'Production Document',
    dir: 'D:/W-1.1/W-1.1-Model/W-1-1_documents/production-documents',
  },
  {
    category: 'Research Paper',
    dir: 'D:/W-1.2/W-1.2-documents',
  },
]

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

// --------------------------------------------------------------------------
// Branding
// --------------------------------------------------------------------------
// The source docs were written under the old "WAI" (Wasif AI Research) brand.
// Every place that name appears in content that renders in the app is
// rewritten to the project's brand: Jhelum Labs. The model name W-1.1 itself
// is never touched.
const BRAND_RULES = [
  // Old company / lab names -> Jhelum Labs
  [/Wasif AI Research/gi, 'Jhelum Labs'],
  [/Wasif AI/gi, 'Jhelum Labs'],
  [/Origin Laboratories/gi, 'Jhelum Labs'],
  [/Origin Labs?/gi, 'Jhelum Labs'],

  // Program line: "WAI / W-1.1 ..." -> "Jhelum Labs / W-1.1 ..."
  [/WAI\s*\/\s*W-1\.1/gi, 'Jhelum Labs / W-1.1'],

  // Branded model alias "WAI-125M" -> "Jhelum Labs 125M"
  [/\bWAI-125M\b/gi, 'Jhelum Labs 125M'],

  // File / artifact prefixes: "wai-125m-instruct-v1.safetensors"
  //   -> "jhelum-labs-125m-instruct-v1.safetensors"
  [/\bwai-(?=[a-z0-9])/gi, 'jhelum-labs-'],

  // Any remaining standalone "WAI" token -> Jhelum Labs
  [/\bWAI\b/g, 'Jhelum Labs'],
]

// Apply every branding rule to a text/HTML string, longest/most-specific first.
function rebrand(text) {
  if (!text) return text
  let out = text
  for (const [re, replacement] of BRAND_RULES) {
    out = out.replace(re, replacement)
  }
  return out
}

// Clean a filename into a readable title, dropping the redundant W-1.1 prefix
// (the site is already branded as W-1.1, so titles show just the paper name).
function titleFromFileName(fileName) {
  const base = fileName
    .replace(/\.docx$/i, '')
    .replace(/\(\d+\)/g, '')
    .trim()

  // If a W-1.1 prefix exists, strip it and title-case the remainder.
  const prefixMatch = base.match(/^w-?1\.[12][\s-]+/i)
  const rest = prefixMatch ? base.slice(prefixMatch[0].length).trim() : base

  if (!rest) return 'W-1.1'

  return rest
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
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

// Build a preview excerpt from the *cleaned* article body: metadata tables are
// skipped and tags stripped, so the excerpt (used for cards + the article lede)
// never repeats the cover-banner content.
function makeExcerptFromHtml(contentHtml, max = 320) {
  const withoutTables = contentHtml.replace(/<table[\s\S]*?<\/table>/gi, ' ')
  const text = withoutTables.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  if (!text) return ''
  if (text.length <= max) return text
  const cut = text.slice(0, max)
  const lastSpace = cut.lastIndexOf(' ')
  return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut) + '…'
}

// Convert an embedded image to a base64 data URI (so it is self-contained).
// NOTE: mammoth >= 1.x exposes `readAsBase64String()` on image elements.
// Width/height are intentionally omitted so CSS can scale charts responsively.
function convertImage(image) {
  return image.readAsBase64String().then((b64) => ({
    src: `data:${image.contentType};base64,${b64}`,
  }))
}

// Wrap every embedded image in a <figure class="article-figure"> so charts
// and diagrams get consistent, resizable presentation (plus click-to-enlarge).
function decorateFigures(contentHtml) {
  return contentHtml.replace(
    /<img([^>]*)\/>/g,
    '<figure class="article-figure"><img$1 /></figure>',
  )
}

/**
 * Remove the document's own cover-title block from the top of each article.
 * The docs begin with a bold banner that repeats the paper name (e.g.
 * "<strong>W-1.1 SPARK</strong>", "FINAL TECHNICAL REPORT / W-1.1 / WAI-125M").
 * The article page already shows the title, category and date above the body,
 * so this duplicate banner is stripped — it is always a run of leading <p>
 * blocks that precedes the first heading, table or list.
 */
function stripCoverBanner(contentHtml) {
  let s = contentHtml
  while (true) {
    const m = /^<p(\s[^>]*)?>[\s\S]*?<\/p>/.exec(s)
    if (!m) break

    // Consume this paragraph plus any following whitespace, then look ahead.
    const rest = s.slice(m[0].length)
    const ws = (rest.match(/^\s*/) || [''])[0].length
    const next = rest.slice(ws)

    // Keep stripping only while the next block is another <p> (the cover banner
    // is always a run of leading paragraphs). A heading, table, list, figure or
    // any other element ends the banner.
    if (/^<p(\s[^>]*)?>/i.test(next)) {
      s = next
      continue
    }

    // Banner complete — return the stripped remainder.
    return next
  }
  return s
}

async function processFile(category, fileName) {
  const fullPath = path.join(SOURCES[category], fileName)
  const slug = slugify(fileName)

  const stats = await fs.stat(fullPath)
  const title = titleFromFileName(fileName)

  const raw = await mammoth.extractRawText({ path: fullPath })

  const htmlResult = await mammoth.convertToHtml(
    { path: fullPath },
    { convertImage: mammoth.images.imgElement(convertImage) },
  )

  const contentHtml = rebrand(stripCoverBanner(decorateFigures(htmlResult.value)))
  const excerpt = rebrand(
    makeExcerptFromHtml(contentHtml) || makeExcerpt(rebrand(raw.value)),
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
    contentHtml,
    warnings: htmlResult.messages.length,
  }
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true })

  const articles = []
  let skipped = []

  for (const { category, dir } of SOURCES) {
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

  // The source DOCX files live on a local D: drive and are intentionally not
  // part of the repository. In CI/deployment environments that drive does not
  // exist. Never replace the committed research index with an empty array in
  // that situation; keep the last successfully generated static content.
  if (resolved.length === 0) {
    console.warn(
      `${now()} WARN: no source documents found; preserving existing public/research assets.`,
    )
    return
  }

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
