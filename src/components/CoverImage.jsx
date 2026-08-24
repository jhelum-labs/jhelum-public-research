/**
 * Generates a unique, colorful rainbow-style gradient cover image
 * with the paper title rendered in white — like OpenAI research covers.
 */

const PALETTES = [
  ['#7c3aed', '#2563eb', '#06b6d4'],
  ['#e11d48', '#ea580c', '#eab308'],
  ['#16a34a', '#0d9488', '#2563eb'],
  ['#db2777', '#9333ea', '#4f46e5'],
  ['#f97316', '#ec4899', '#8b5cf6'],
  ['#0891b2', '#16a34a', '#84cc16'],
  ['#4338ca', '#7c3aed', '#db2777'],
  ['#d97706', '#dc2626', '#e11d48'],
  ['#0f766e', '#0891b2', '#0284c7'],
  ['#7e22ce', '#1d4ed8', '#0f766e'],
]

function hashSlug(slug) {
  let h = 0
  for (let i = 0; i < slug.length; i++) {
    h = (Math.imul(31, h) + slug.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

/** Break a title into lines that fit within maxChars */
function wrapText(title, maxChars) {
  const words = title.split(' ')
  const lines = []
  let current = ''
  for (const word of words) {
    if ((current + ' ' + word).trim().length > maxChars) {
      if (current) lines.push(current)
      current = word
    } else {
      current = (current + ' ' + word).trim()
    }
  }
  if (current) lines.push(current)
  return lines
}

export function CoverImage({ slug, title = '', width = 800, height = 240, className = '' }) {
  const h = hashSlug(slug)
  const palette = PALETTES[h % PALETTES.length]
  const angle = 120 + (h % 80)
  const bx1 = 20 + (h % 30)
  const by1 = 20 + ((h >> 4) % 40)
  const bx2 = 60 + (h % 25)
  const by2 = 40 + ((h >> 8) % 40)
  const id = `cov-${slug}`

  // Scale font size and line wrap based on cover height
  const isThumb = height <= 100
  const isSmall = height <= 150
  const fontSize = isThumb ? 13 : isSmall ? 16 : height >= 300 ? 36 : 22
  const maxChars = isThumb ? 18 : isSmall ? 22 : height >= 300 ? 28 : 24
  const lineHeight = fontSize * 1.3
  const lines = title ? wrapText(title, maxChars) : []
  const totalTextHeight = lines.length * lineHeight
  const textY = (height - totalTextHeight) / 2 + fontSize * 0.85

  return (
    <svg
      className={`cover-img ${className}`}
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id={`${id}-lg`} x1="0%" y1="0%" x2="100%" y2="100%"
          gradientTransform={`rotate(${angle}, 0.5, 0.5)`}>
          <stop offset="0%" stopColor={palette[0]} />
          <stop offset="50%" stopColor={palette[1]} />
          <stop offset="100%" stopColor={palette[2]} />
        </linearGradient>
        <radialGradient id={`${id}-r1`} cx={`${bx1}%`} cy={`${by1}%`} r="55%">
          <stop offset="0%" stopColor={palette[2]} stopOpacity="0.55" />
          <stop offset="100%" stopColor={palette[2]} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}-r2`} cx={`${bx2}%`} cy={`${by2}%`} r="60%">
          <stop offset="0%" stopColor={palette[0]} stopOpacity="0.45" />
          <stop offset="100%" stopColor={palette[0]} stopOpacity="0" />
        </radialGradient>
        {/* Dark overlay so white text is always readable */}
        <linearGradient id={`${id}-overlay`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#000" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.42" />
        </linearGradient>
      </defs>

      {/* Gradient layers */}
      <rect width={width} height={height} fill={`url(#${id}-lg)`} />
      <rect width={width} height={height} fill={`url(#${id}-r1)`} />
      <rect width={width} height={height} fill={`url(#${id}-r2)`} />
      {/* Subtle dark overlay for text contrast */}
      <rect width={width} height={height} fill={`url(#${id}-overlay)`} />

      {/* Title text — centered, white */}
      {lines.map((line, i) => (
        <text
          key={i}
          x={width / 2}
          y={textY + i * lineHeight}
          textAnchor="middle"
          fill="white"
          fillOpacity="0.95"
          fontFamily="'Playfair Display', Georgia, serif"
          fontWeight={isThumb ? '600' : '700'}
          fontSize={fontSize}
          letterSpacing={isThumb ? '0' : '-0.3'}
        >
          {line}
        </text>
      ))}
    </svg>
  )
}
