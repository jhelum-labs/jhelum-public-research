/**
 * Generates a unique, colorful rainbow-style gradient cover image
 * deterministically from a slug string — no external images needed.
 */

const PALETTES = [
  // violet → blue → cyan
  ['#7c3aed', '#2563eb', '#06b6d4'],
  // rose → orange → yellow
  ['#e11d48', '#ea580c', '#eab308'],
  // green → teal → blue
  ['#16a34a', '#0d9488', '#2563eb'],
  // pink → purple → indigo
  ['#db2777', '#9333ea', '#4f46e5'],
  // orange → pink → purple
  ['#f97316', '#ec4899', '#8b5cf6'],
  // cyan → green → lime
  ['#0891b2', '#16a34a', '#84cc16'],
  // indigo → violet → pink
  ['#4338ca', '#7c3aed', '#db2777'],
  // amber → red → rose
  ['#d97706', '#dc2626', '#e11d48'],
  // teal → cyan → sky
  ['#0f766e', '#0891b2', '#0284c7'],
  // purple → blue → teal
  ['#7e22ce', '#1d4ed8', '#0f766e'],
]

function hashSlug(slug) {
  let h = 0
  for (let i = 0; i < slug.length; i++) {
    h = (Math.imul(31, h) + slug.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

export function CoverImage({ slug, width = 800, height = 240, className = '' }) {
  const h = hashSlug(slug)
  const palette = PALETTES[h % PALETTES.length]
  const angle = 120 + (h % 80)

  // Two overlapping radial blobs + a linear gradient base
  const bx1 = 20 + (h % 30)
  const by1 = 20 + ((h >> 4) % 40)
  const bx2 = 60 + (h % 25)
  const by2 = 40 + ((h >> 8) % 40)

  const id = `cov-${slug}`

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
        {/* Noise texture for depth */}
        <filter id={`${id}-noise`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
          <feBlend in="SourceGraphic" mode="overlay" result="blend" />
          <feComposite in="blend" in2="SourceGraphic" operator="in" />
        </filter>
      </defs>
      <rect width={width} height={height} fill={`url(#${id}-lg)`} />
      <rect width={width} height={height} fill={`url(#${id}-r1)`} />
      <rect width={width} height={height} fill={`url(#${id}-r2)`} />
      <rect width={width} height={height} fill="transparent" filter={`url(#${id}-noise)`} opacity="0.08" />
    </svg>
  )
}
