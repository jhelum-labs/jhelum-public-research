import { promises as fs } from 'node:fs'
import path from 'node:path'
import mammoth from 'mammoth'

const SOURCE = 'D:/W-1.2/W-1.2-documents/w-1.2 architecture.docx'
const OUTPUT = path.join(process.cwd(), 'public', 'research', 'w-1.2-architecture.html')

function convertImage(image) {
  return image.readAsBase64String().then((data) => ({
    src: `data:${image.contentType};base64,${data}`,
  }))
}

function decorateImages(html) {
  return html.replace(
    /<img([^>]*)\/>/g,
    '<figure class="article-figure"><img$1 /></figure>',
  )
}

function stripCover(html) {
  const firstHeading = html.search(/<h[1-3][^>]*>/i)
  if (firstHeading < 0) return html
  return html.slice(firstHeading)
}

function addHeadingIds(html) {
  let index = 0
  return html.replace(/<(h[1-3])([^>]*)>/gi, (_, tag, attrs) => {
    const id = `heading-${index++}`
    return `<${tag}${attrs} id="${id}">`
  })
}

const result = await mammoth.convertToHtml(
  { path: SOURCE },
  { convertImage: mammoth.images.imgElement(convertImage) },
)

const html = addHeadingIds(stripCover(decorateImages(result.value)))
await fs.writeFile(OUTPUT, html, 'utf8')

const imageCount = (html.match(/<img\b/g) || []).length
console.log(`Wrote ${OUTPUT}`)
console.log(`Embedded images: ${imageCount}`)
if (result.messages.length) console.warn(result.messages)
