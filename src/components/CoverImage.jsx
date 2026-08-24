/**
 * Rich, unique per-paper cover images inspired by OpenAI research covers.
 * Each slug gets its own hand-crafted palette + geometric composition.
 */

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

/** Each slug maps to a unique visual design */
const DESIGNS = {
  'w-1.1-project-instruct': {
    bg: ['#1a0533', '#2d1b69', '#0f3460'],
    blobs: [
      { cx: '15%', cy: '30%', r: '45%', color: '#7c3aed', op: 0.7 },
      { cx: '80%', cy: '60%', r: '50%', color: '#06b6d4', op: 0.5 },
      { cx: '50%', cy: '90%', r: '40%', color: '#a855f7', op: 0.4 },
    ],
    shapes: (w, h) => (
      <>
        <circle cx={w * 0.85} cy={h * 0.15} r={h * 0.22} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
        <circle cx={w * 0.85} cy={h * 0.15} r={h * 0.14} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
        <line x1={0} y1={h * 0.5} x2={w} y2={h * 0.5} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
        <line x1={0} y1={h * 0.25} x2={w} y2={h * 0.25} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
        <line x1={0} y1={h * 0.75} x2={w} y2={h * 0.75} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
        {[...Array(8)].map((_, i) => (
          <line key={i} x1={w * i / 7} y1={0} x2={w * i / 7} y2={h} stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
        ))}
      </>
    ),
  },
  'w-1.1-final': {
    bg: ['#0a0a0a', '#1a1a2e', '#16213e'],
    blobs: [
      { cx: '70%', cy: '20%', r: '55%', color: '#f97316', op: 0.55 },
      { cx: '20%', cy: '70%', r: '50%', color: '#ec4899', op: 0.45 },
      { cx: '50%', cy: '50%', r: '35%', color: '#eab308', op: 0.3 },
    ],
    shapes: (w, h) => (
      <>
        <polygon points={`${w*0.05},${h*0.1} ${w*0.2},${h*0.05} ${w*0.18},${h*0.3} ${w*0.03},${h*0.28}`} fill="rgba(255,255,255,0.04)" />
        <polygon points={`${w*0.75},${h*0.65} ${w*0.95},${h*0.6} ${w*0.97},${h*0.9} ${w*0.72},${h*0.92}`} fill="rgba(255,255,255,0.04)" />
        <circle cx={w*0.5} cy={h*0.5} r={h*0.35} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="4 6" />
        <circle cx={w*0.5} cy={h*0.5} r={h*0.2} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="4 6" />
      </>
    ),
  },
  'w-1.1-final-architecture': {
    bg: ['#0d1117', '#0f2027', '#203a43'],
    blobs: [
      { cx: '30%', cy: '40%', r: '50%', color: '#06b6d4', op: 0.6 },
      { cx: '75%', cy: '30%', r: '45%', color: '#3b82f6', op: 0.5 },
      { cx: '60%', cy: '80%', r: '40%', color: '#8b5cf6', op: 0.35 },
    ],
    shapes: (w, h) => (
      <>
        {/* Neural network nodes */}
        {[[0.15,0.3],[0.15,0.5],[0.15,0.7],[0.4,0.2],[0.4,0.4],[0.4,0.6],[0.4,0.8],[0.65,0.35],[0.65,0.65],[0.85,0.5]].map(([x,y],i) => (
          <circle key={i} cx={w*x} cy={h*y} r={4} fill="rgba(255,255,255,0.18)" />
        ))}
        {/* Connections */}
        {[[0.15,0.3,0.4,0.2],[0.15,0.3,0.4,0.4],[0.15,0.5,0.4,0.4],[0.15,0.5,0.4,0.6],[0.15,0.7,0.4,0.6],[0.15,0.7,0.4,0.8],[0.4,0.2,0.65,0.35],[0.4,0.4,0.65,0.35],[0.4,0.6,0.65,0.65],[0.4,0.8,0.65,0.65],[0.65,0.35,0.85,0.5],[0.65,0.65,0.85,0.5]].map(([x1,y1,x2,y2],i) => (
          <line key={i} x1={w*x1} y1={h*y1} x2={w*x2} y2={h*y2} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
        ))}
      </>
    ),
  },
  'w-1.1-project-spectrum': {
    bg: ['#0f0c29', '#302b63', '#24243e'],
    blobs: [
      { cx: '20%', cy: '50%', r: '60%', color: '#a855f7', op: 0.6 },
      { cx: '80%', cy: '40%', r: '50%', color: '#06b6d4', op: 0.5 },
      { cx: '50%', cy: '80%', r: '45%', color: '#6366f1', op: 0.4 },
    ],
    shapes: (w, h) => (
      <>
        {/* Spectrum wave lines */}
        {[0.2, 0.35, 0.5, 0.65, 0.8].map((y, i) => (
          <path key={i}
            d={`M 0 ${h*y} Q ${w*0.25} ${h*(y-0.08+i*0.02)} ${w*0.5} ${h*y} Q ${w*0.75} ${h*(y+0.08-i*0.02)} ${w} ${h*y}`}
            fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1.5"
          />
        ))}
        <circle cx={w*0.88} cy={h*0.18} r={h*0.12} fill="rgba(255,255,255,0.06)" />
      </>
    ),
  },
  'w-1.1-project-insight': {
    bg: ['#0a0a0a', '#1a0a2e', '#0d1b2a'],
    blobs: [
      { cx: '60%', cy: '30%', r: '55%', color: '#f59e0b', op: 0.55 },
      { cx: '20%', cy: '60%', r: '50%', color: '#ef4444', op: 0.45 },
      { cx: '80%', cy: '75%', r: '40%', color: '#f97316', op: 0.35 },
    ],
    shapes: (w, h) => (
      <>
        {/* Insight eye / lens shape */}
        <ellipse cx={w*0.5} cy={h*0.5} rx={w*0.3} ry={h*0.25} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1.5" />
        <circle cx={w*0.5} cy={h*0.5} r={h*0.1} fill="rgba(255,255,255,0.06)" />
        <circle cx={w*0.5} cy={h*0.5} r={h*0.04} fill="rgba(255,255,255,0.12)" />
        {[...Array(6)].map((_, i) => {
          const angle = (i * 60) * Math.PI / 180
          return <line key={i} x1={w*0.5} y1={h*0.5} x2={w*0.5 + Math.cos(angle)*w*0.35} y2={h*0.5 + Math.sin(angle)*h*0.35} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
        })}
      </>
    ),
  },
  'w-1.1-projects': {
    bg: ['#0f2027', '#203a43', '#2c5364'],
    blobs: [
      { cx: '40%', cy: '40%', r: '55%', color: '#10b981', op: 0.55 },
      { cx: '75%', cy: '65%', r: '45%', color: '#06b6d4', op: 0.45 },
      { cx: '15%', cy: '75%', r: '40%', color: '#3b82f6', op: 0.35 },
    ],
    shapes: (w, h) => (
      <>
        {/* Phase progression dots */}
        {[0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.8,0.9].map((x, i) => (
          <g key={i}>
            <circle cx={w*x} cy={h*0.5} r={5} fill="rgba(255,255,255,0.15)" />
            {i < 8 && <line x1={w*x+5} y1={h*0.5} x2={w*(x+0.1)-5} y2={h*0.5} stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" />}
          </g>
        ))}
        <rect x={w*0.05} y={h*0.2} width={w*0.9} height={h*0.6} rx="8" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
      </>
    ),
  },
  'w-1.1-spark': {
    bg: ['#1a0a00', '#2d1500', '#1a1a00'],
    blobs: [
      { cx: '50%', cy: '30%', r: '55%', color: '#f59e0b', op: 0.7 },
      { cx: '20%', cy: '70%', r: '45%', color: '#ef4444', op: 0.5 },
      { cx: '80%', cy: '70%', r: '40%', color: '#f97316', op: 0.45 },
    ],
    shapes: (w, h) => (
      <>
        {/* Lightning / spark bolt */}
        <path d={`M ${w*0.55} ${h*0.1} L ${w*0.42} ${h*0.48} L ${w*0.52} ${h*0.48} L ${w*0.38} ${h*0.9} L ${w*0.62} ${h*0.45} L ${w*0.5} ${h*0.45} Z`}
          fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
        {[...Array(12)].map((_, i) => {
          const angle = (i * 30) * Math.PI / 180
          const r1 = h * 0.3, r2 = h * 0.38
          return <line key={i} x1={w*0.5 + Math.cos(angle)*r1} y1={h*0.5 + Math.sin(angle)*r1} x2={w*0.5 + Math.cos(angle)*r2} y2={h*0.5 + Math.sin(angle)*r2} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
        })}
      </>
    ),
  },
  'w-1.1-project-tazi': {
    bg: ['#0a1628', '#0d2137', '#0a2e1a'],
    blobs: [
      { cx: '30%', cy: '35%', r: '50%', color: '#16a34a', op: 0.6 },
      { cx: '70%', cy: '55%', r: '50%', color: '#0891b2', op: 0.5 },
      { cx: '50%', cy: '85%', r: '40%', color: '#2563eb', op: 0.35 },
    ],
    shapes: (w, h) => (
      <>
        {/* Loss curve */}
        <path d={`M ${w*0.05} ${h*0.2} C ${w*0.2} ${h*0.8} ${w*0.4} ${h*0.85} ${w*0.6} ${h*0.65} S ${w*0.8} ${h*0.55} ${w*0.95} ${h*0.58}`}
          fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />
        <path d={`M ${w*0.05} ${h*0.25} C ${w*0.2} ${h*0.82} ${w*0.4} ${h*0.87} ${w*0.6} ${h*0.68} S ${w*0.8} ${h*0.58} ${w*0.95} ${h*0.61}`}
          fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
        {/* Axes */}
        <line x1={w*0.05} y1={h*0.1} x2={w*0.05} y2={h*0.9} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
        <line x1={w*0.05} y1={h*0.9} x2={w*0.95} y2={h*0.9} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
      </>
    ),
  },
  'w-1.1-testing': {
    bg: ['#0f0f23', '#1a1a3e', '#0d0d1a'],
    blobs: [
      { cx: '50%', cy: '50%', r: '60%', color: '#6366f1', op: 0.55 },
      { cx: '80%', cy: '20%', r: '40%', color: '#8b5cf6', op: 0.45 },
      { cx: '15%', cy: '80%', r: '40%', color: '#a855f7', op: 0.35 },
    ],
    shapes: (w, h) => (
      <>
        {/* Pipeline boxes */}
        {[0.08, 0.28, 0.48, 0.68, 0.82].map((x, i) => (
          <g key={i}>
            <rect x={w*x} y={h*0.35} width={w*0.14} height={h*0.3} rx="4" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
            {i < 4 && <line x1={w*(x+0.14)} y1={h*0.5} x2={w*(x+0.2)} y2={h*0.5} stroke="rgba(255,255,255,0.1)" strokeWidth="1" markerEnd="url(#arrow)" />}
          </g>
        ))}
        <circle cx={w*0.5} cy={h*0.18} r={h*0.1} fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
      </>
    ),
  },
  'w-1.1-125m-architecture': {
    bg: ['#0a0a1a', '#0d1b3e', '#0a2040'],
    blobs: [
      { cx: '25%', cy: '45%', r: '55%', color: '#2563eb', op: 0.6 },
      { cx: '75%', cy: '45%', r: '50%', color: '#7c3aed', op: 0.5 },
      { cx: '50%', cy: '85%', r: '45%', color: '#06b6d4', op: 0.4 },
    ],
    shapes: (w, h) => (
      <>
        {/* Transformer block stack */}
        {[0.15, 0.3, 0.45, 0.6, 0.75].map((y, i) => (
          <rect key={i} x={w*0.25} y={h*y} width={w*0.5} height={h*0.1} rx="3"
            fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
        ))}
        {/* Attention arcs */}
        {[0.3,0.4,0.5,0.6,0.7].map((x, i) => (
          <path key={i} d={`M ${w*x} ${h*0.12} Q ${w*(x+0.1)} ${h*0.05} ${w*(x+0.15)} ${h*0.12}`}
            fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
        ))}
        <rect x={w*0.2} y={h*0.08} width={w*0.6} height={h*0.84} rx="6"
          fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="4 4" />
      </>
    ),
  },
  'w-1.2-architecture': {
    bg: ['#0a0f1e', '#0d1f3c', '#0a1628'],
    blobs: [
      { cx: '20%', cy: '35%', r: '55%', color: '#6366f1', op: 0.65 },
      { cx: '75%', cy: '50%', r: '50%', color: '#0ea5e9', op: 0.55 },
      { cx: '50%', cy: '85%', r: '45%', color: '#8b5cf6', op: 0.4 },
    ],
    shapes: (w, h) => (
      <>
        {[...Array(16)].map((_, i) => (
          <circle key={`q${i}`} cx={w * (0.1 + i * 0.053)} cy={h * 0.28} r={5}
            fill="rgba(255,255,255,0.22)" />
        ))}
        {[...Array(8)].map((_, i) => (
          <circle key={`kv${i}`} cx={w * (0.178 + i * 0.089)} cy={h * 0.62} r={7}
            fill="rgba(255,255,255,0.3)" />
        ))}
        {[...Array(8)].map((_, i) => (
          <g key={`conn${i}`}>
            <line x1={w*(0.1+i*0.106)} y1={h*0.29} x2={w*(0.178+i*0.089)} y2={h*0.61}
              stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
            <line x1={w*(0.153+i*0.106)} y1={h*0.29} x2={w*(0.178+i*0.089)} y2={h*0.61}
              stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
          </g>
        ))}
        <line x1={w*0.05} y1={h*0.45} x2={w*0.95} y2={h*0.45}
          stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="4 6" />
      </>
    ),
  },
}

const FALLBACK = {
  bg: ['#0f0c29', '#302b63', '#24243e'],
  blobs: [
    { cx: '30%', cy: '40%', r: '50%', color: '#7c3aed', op: 0.6 },
    { cx: '70%', cy: '60%', r: '45%', color: '#06b6d4', op: 0.5 },
  ],
  shapes: () => null,
}

export function CoverImage({ slug, title = '', width = 800, height = 240, className = '' }) {
  const design = DESIGNS[slug] || FALLBACK
  const id = `cov-${slug}`

  const isThumb = height <= 100
  const isSmall = height <= 150
  const fontSize = isThumb ? 12 : isSmall ? 15 : height >= 300 ? 34 : 20
  const maxChars = isThumb ? 16 : isSmall ? 20 : height >= 300 ? 26 : 22
  const lineHeight = fontSize * 1.35
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
        <linearGradient id={`${id}-bg`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={design.bg[0]} />
          <stop offset="50%" stopColor={design.bg[1]} />
          <stop offset="100%" stopColor={design.bg[2]} />
        </linearGradient>
        {design.blobs.map((b, i) => (
          <radialGradient key={i} id={`${id}-b${i}`} cx={b.cx} cy={b.cy} r={b.r}>
            <stop offset="0%" stopColor={b.color} stopOpacity={b.op} />
            <stop offset="100%" stopColor={b.color} stopOpacity="0" />
          </radialGradient>
        ))}
        <linearGradient id={`${id}-ov`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#000" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.5" />
        </linearGradient>
      </defs>

      {/* Base gradient */}
      <rect width={width} height={height} fill={`url(#${id}-bg)`} />

      {/* Colour blobs */}
      {design.blobs.map((_, i) => (
        <rect key={i} width={width} height={height} fill={`url(#${id}-b${i})`} />
      ))}

      {/* Unique geometric shapes */}
      {!isThumb && design.shapes(width, height)}

      {/* Dark overlay for text legibility */}
      <rect width={width} height={height} fill={`url(#${id}-ov)`} />

      {/* Title */}
      {lines.map((line, i) => (
        <text
          key={i}
          x={width / 2}
          y={textY + i * lineHeight}
          textAnchor="middle"
          fill="white"
          fillOpacity="0.95"
          fontFamily="'Playfair Display', Georgia, serif"
          fontWeight="700"
          fontSize={fontSize}
          letterSpacing="-0.5"
        >
          {line}
        </text>
      ))}
    </svg>
  )
}
