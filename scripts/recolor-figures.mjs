import sharp from 'sharp'
import fs from 'node:fs'

// The three diagram PNGs are flat vector-style artwork exported from the papers:
// ~99% of their pixels sit on a handful of exact colours, the rest are
// anti-aliasing blends between those colours. So rather than inverting (which
// wrecks the box colours) we remap the source palette onto the site's own dark
// tokens, and blend the anti-aliased pixels by inverse-distance weighting over
// the nearest palette entries.
//
//   source (light artwork)                ->  dark theme token
const MAP = [
  // page / box grounds
  [[255, 255, 255], [0x34, 0x35, 0x41]], // white plate      -> --bg        #343541
  [[238, 241, 240], [0x44, 0x45, 0x4f]], // box fill         -> --surface-2 #44454f
  [[236, 239, 239], [0x3a, 0x3b, 0x41]], // chart plot area  -> --surface   #3a3b41
  [[236, 243, 242], [0x44, 0x45, 0x4f]],
  [[224, 227, 226], [0x44, 0x45, 0x4f]],
  [[240, 240, 240], [0x52, 0x53, 0x5f]], // -> --surface-3 #52535f
  // tinted box fills, darkened but hue-preserved
  [[211, 235, 229], [0x1e, 0x46, 0x40]], // mint     -> dark teal
  [[227, 222, 243], [0x3b, 0x33, 0x58]], // lavender -> dark violet
  [[246, 225, 222], [0x4d, 0x2e, 0x28]], // salmon   -> dark rust
  // text
  [[74, 79, 78], [0xc8, 0xc9, 0xd4]],    // -> --text-soft #c8c9d4
  [[51, 51, 51], [0xec, 0xec, 0xf1]],    // -> --text      #ececf1
  [[17, 17, 17], [0xec, 0xec, 0xf1]],
  [[0, 0, 0], [0xec, 0xec, 0xf1]],
  [[63, 63, 63], [0xc8, 0xc9, 0xd4]],
  // accents, lifted so they read against the dark ground
  [[34, 118, 106], [0x5f, 0xd3, 0xbd]],  // teal   -> #5fd3bd
  [[62, 156, 140], [0x5f, 0xd3, 0xbd]],
  [[95, 79, 174], [0xa9, 0x9c, 0xe8]],   // purple -> #a99ce8
  [[126, 111, 194], [0xa9, 0x9c, 0xe8]],
  [[161, 58, 43], [0xe0, 0x8a, 0x76]],   // red    -> #e08a76
  // mid greys: rules, faint strokes, secondary labels
  [[102, 102, 102], [0x8e, 0x8f, 0x9c]], // -> --muted #8e8f9c
  [[76, 76, 76], [0x8e, 0x8f, 0x9c]],
  [[85, 85, 85], [0x8e, 0x8f, 0x9c]],
  [[86, 91, 90], [0x8e, 0x8f, 0x9c]],
  [[127, 127, 127], [0x6a, 0x6b, 0x76]],
  [[150, 150, 150], [0x6a, 0x6b, 0x76]],
  [[180, 180, 180], [0x5a, 0x5b, 0x66]],
  [[191, 191, 191], [0x6a, 0x6b, 0x76]],
  [[199, 204, 204], [0x52, 0x53, 0x5f]], // gridlines
  [[208, 212, 212], [0x52, 0x53, 0x5f]],
  [[212, 212, 212], [0x52, 0x53, 0x5f]],
  [[212, 216, 216], [0x52, 0x53, 0x5f]],
]

const src = MAP.map(m => m[0])
const dst = MAP.map(m => m[1])

// cache: packed source RGB -> packed target RGB. The artwork only has a few
// thousand distinct colours, so this collapses the work to a few thousand solves.
const cache = new Map()
function remap(r, g, b) {
  const key = (r << 16) | (g << 8) | b
  const hit = cache.get(key)
  if (hit !== undefined) return hit

  let d0 = Infinity, d1 = Infinity, d2 = Infinity, i0 = -1, i1 = -1, i2 = -1
  for (let i = 0; i < src.length; i++) {
    const s = src[i]
    const dr = r - s[0], dg = g - s[1], db = b - s[2]
    const d = dr * dr + dg * dg + db * db
    if (d < d0) { d2 = d1; i2 = i1; d1 = d0; i1 = i0; d0 = d; i0 = i }
    else if (d < d1) { d2 = d1; i2 = i1; d1 = d; i1 = i }
    else if (d < d2) { d2 = d; i2 = i }
  }

  let out
  if (d0 === 0) {
    // exact palette hit: take the target verbatim, no blending
    out = dst[i0]
  } else {
    // inverse-distance weighting over the three nearest entries, so a pixel
    // halfway between white and dark text lands halfway between their targets
    let w0 = 1 / d0, w1 = 1 / d1, w2 = 1 / d2
    const t = w0 + w1 + w2
    w0 /= t; w1 /= t; w2 /= t
    out = [0, 1, 2].map(c =>
      Math.max(0, Math.min(255, Math.round(dst[i0][c] * w0 + dst[i1][c] * w1 + dst[i2][c] * w2))))
  }
  const packed = (out[0] << 16) | (out[1] << 8) | out[2]
  cache.set(key, packed)
  return packed
}

// Usage: node scripts/recolor-figures.mjs public/research-figures/<name>.png ...
// Writes <name>-dark.png beside each input.
const files = process.argv.slice(2)
for (const f of files) {
  const { data, info } = await sharp(f).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width: W, height: H, channels: C } = info
  const out = Buffer.alloc(W * H * 4)
  for (let i = 0; i < W * H; i++) {
    const o = i * C, q = i * 4
    const p = remap(data[o], data[o + 1], data[o + 2])
    out[q] = (p >> 16) & 255
    out[q + 1] = (p >> 8) & 255
    out[q + 2] = p & 255
    out[q + 3] = data[o + 3]
  }
  const target = f.replace(/\.png$/, '-dark.png')
  await sharp(out, { raw: { width: W, height: H, channels: 4 } }).png({ compressionLevel: 9 }).toFile(target)
  console.log(`${target.split('/').pop().padEnd(34)} ${W}x${H}  ${(fs.statSync(target).size / 1024).toFixed(0)}K  (${cache.size} colours solved)`)
}
