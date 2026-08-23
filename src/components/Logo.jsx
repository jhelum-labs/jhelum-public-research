import { Link } from 'react-router-dom'
import './Logo.css'

/**
 * Brand logo — broad cursive wordmark, OpenAI-style, in black & white.
 *
 * To use your real company logo instead:
 *   1. Save it as `public/logo.png`
 *   2. Set USE_BRAND_LOGO = true  (below)
 */
const USE_BRAND_LOGO = false

function WordmarkLogo() {
  return (
    <span className="logo logo--wordmark" aria-label="Jhelum Labs">
      <svg
        className="logo__glyph"
        viewBox="0 0 64 64"
        width="34"
        height="34"
        role="img"
        aria-hidden="true"
        fill="currentColor"
      >
        {/* Broad brush-stroke J with a lateral serif finial */}
        <path d="M34 12c-6.4 0-11.2 1.7-14.4 5.1-3 3.2-4.6 7.4-4.6 12.6v22h7V30c0-3.9.9-6.8 2.8-8.7 1.9-2 4.7-3 8.3-3h.4V12h.5zM27.5 14.8V18h6.5v3h6v-6.2h2.4c-.4-1.3-1.2-2.4-2.4-3.2-.9-.7-2-1-3.4-1h-3.2v4z" />
        <path d="M22 46h26v7H22z" />
      </svg>
      <span className="logo__word">
        Jhelum <span className="logo__sep">·</span> Labs
      </span>
    </span>
  )
}

export default function Logo({ to = '/', as = 'link' }) {
  const content = USE_BRAND_LOGO ? (
    <span className="logo logo--img">
      <img src="/logo.png" alt="Jhelum Labs" className="logo__img" />
    </span>
  ) : (
    <WordmarkLogo />
  )

  if (as === 'link') {
    return (
      <Link to={to} className="logo-link" aria-label="Jhelum Labs Research home">
        {content}
      </Link>
    )
  }
  return <>{content}</>
}