import sharp from 'sharp'

const mark = 'public/jhelum-labs-mark.svg'
const socialSvg = `
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#090b10"/>
  <circle cx="1020" cy="-80" r="380" fill="#2a6cf5" opacity=".18"/>
  <image href="jhelum-labs-mark.svg" x="100" y="132" width="250" height="250"/>
  <text x="390" y="272" font-family="Arial, sans-serif" font-size="92" font-weight="700" fill="#f5f7fb">Jhelum \abs</text>
  <text x="395" y="340" font-family="Arial, sans-serif" font-size="34" font-weight="500" fill="#9fc1ff" letter-spacing="4">RESEARCH AND DEPLOYMENT</text>
</svg>`

await sharp(Buffer.from(socialSvg)).png().toFile('public/social-card.png')
await sharp(mark).resize(32, 32).png().toFile('public/favicon-32.png')
await sharp(mark).resize(180, 180).png().toFile('public/apple-touch-icon.png')
