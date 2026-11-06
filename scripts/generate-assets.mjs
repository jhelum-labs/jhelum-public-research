import sharp from 'sharp'

// The blue mark is the single source of truth for the brand. It is inlined into
// the social card (librsvg has no base directory for a relative <image href>)
// and rasterised into the square icons that browsers, OS launchers and AI
// crawlers pick up.
const mark = 'public/jhelum-labs-mark.svg'

const MARK_VIEWBOX = '0 170 650 630'
const MARK_POLYGONS = [
  '152,310 306,310 335,344 176,344 49,611 82,611 196,372 358,372 394,413 228,413 124,628 0,628',
  '396,185 627,472 553,598 497,606 576,473 388,240 370,266 537,477 458,611 402,620 482,485 326,289',
  '203,513 295,651 570,614 633,720 236,780 146,640 168,592 258,729 589,683 572,655 275,697 183,559',
]
const MARK_J = 'M322 443H362V538C362 575 340 592 308 592C295 592 290 590 290 590L272 560H322Z'

const BRAND_BLUE = '#2a6cf5'
const PAGE_DARK = '#090b10'

const socialSvg = `
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="glow" cx="88%" cy="-10%" r="75%">
      <stop offset="0%" stop-color="${BRAND_BLUE}" stop-opacity=".38"/>
      <stop offset="100%" stop-color="${BRAND_BLUE}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="${PAGE_DARK}"/>
  <rect width="1200" height="630" fill="url(#glow)"/>

  <svg x="96" y="150" width="215" height="208" viewBox="${MARK_VIEWBOX}">
    <g fill="${BRAND_BLUE}">
      ${MARK_POLYGONS.map((points) => `<polygon points="${points}"/>`).join('\n      ')}
    </g>
    <path d="${MARK_J}" fill="#f5f7fb"/>
  </svg>

  <text x="368" y="292" font-family="Arial, Helvetica, sans-serif" font-size="104" font-weight="700" fill="#f5f7fb">Jhelum Labs</text>
  <text x="372" y="360" font-family="Arial, Helvetica, sans-serif" font-size="27" font-weight="500" fill="#9fc1ff" letter-spacing="7">RESEARCH AND DEPLOYMENT</text>
  <text x="372" y="404" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="400" fill="#8b93a7">jhelumlabs.in</text>
</svg>`

await sharp(Buffer.from(socialSvg)).png().toFile('public/social-card.png')

/**
 * Rasterise the mark into a square icon.
 * @param {number} size   final square edge in pixels
 * @param {object} opts
 * @param {{r:number,g:number,b:number}|null} opts.bg  solid backdrop, or null for transparency
 * @param {number} opts.scale  mark edge as a fraction of `size` (maskable safe zone is 0.8)
 */
async function writeIcon(size, { bg = null, scale = 0.7 } = {}) {
  const inner = Math.max(1, Math.round(size * scale))
  const glyph = await sharp(mark, { density: 300 })
    .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer()

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: bg ? { ...bg, alpha: 1 } : { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: glyph, gravity: 'center' }])
    .png()
    .toFile(`public/${size === 32 ? 'favicon-32' : size === 180 ? 'apple-touch-icon' : `icon-${size}`}.png`)
}

const DARK = { r: 9, g: 11, b: 16 }

// Small favicon: transparent, tightly padded so it stays legible in a tab.
await writeIcon(32, { scale: 0.9 })
// Home-screen / launcher icons: opaque backdrop, mark inside the maskable safe zone.
await writeIcon(180, { bg: DARK, scale: 0.66 })
await writeIcon(192, { bg: DARK, scale: 0.68 })
await writeIcon(512, { bg: DARK, scale: 0.68 })
