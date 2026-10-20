import { Link } from 'react-router-dom'
import './Logo.css'

const USE_BRAND_LOGO = true

export function LogoMark({ size = 34 }) {
  return (
    <svg
      className="logo__glyph"
      viewBox="0 0 100 100"
      width={size}
      height={size}
      role="img"
      aria-hidden="true"
    >
      {/* J — top flag + stem */}
      <path d="M40 7 H69 V17 L40 13.5 Z" fill="currentColor" />
      <path d="M55 7 H69 V37 H55 Z" fill="currentColor" />
      {/* J — wave hook (three tapering strands) */}
      <path
        d="M62 35 V42 C62 60 45 72 30 72 C21 72 14.5 66 13 58.5"
        stroke="currentColor"
        strokeWidth="6.5"
        fill="none"
      />
      <path
        d="M62 35 V42 C62 56 46 65 34.5 65 C26.5 65 20.5 60.5 19 54.5"
        stroke="currentColor"
        strokeWidth="4.2"
        fill="none"
      />
      <path
        d="M62 35 V42 C62 52 49 58.5 40 58.5 C33.5 58.5 28.5 55 27.5 50.5"
        stroke="currentColor"
        strokeWidth="3"
        fill="none"
      />
      {/* Molecule network */}
      <g stroke="currentColor" strokeWidth="2.4">
        <path d="M66 34 L72 18" />
        <path d="M66 34 L81 29" />
        <path d="M66 34 L78 47" />
        <path d="M66 34 L66 49" />
      </g>
      <circle cx="72" cy="17" r="4.2" fill="currentColor" />
      <circle cx="81.5" cy="28.5" r="5.2" fill="currentColor" />
      <circle cx="78.5" cy="47.5" r="6" fill="currentColor" />
      <circle cx="66" cy="49.5" r="3.8" fill="currentColor" />
      <circle cx="66" cy="34" r="7.2" fill="currentColor" />
    </svg>
  )
}

function WordmarkLogo() {
  return (
    <span className="logo logo--wordmark" aria-label="Jhelum Labs">
      <LogoMark size={34} />
      <span className="logo__word">Jhelum Labs</span>
    </span>
  )
}

export default function Logo({ to = '/', as = 'link' }) {
  if (USE_BRAND_LOGO) {
    return (
      <Link to={to} className="logo-link" aria-label="Jhelum Labs Research home">
        <img
          src={`${import.meta.env.BASE_URL}jhelum-labs-logo.svg`}
          alt="Jhelum Labs — Research and Deployment"
          className="logo__img"
        />
      </Link>
    )
  }
  const content = <WordmarkLogo />

  if (as === 'link') {
    return (
      <Link to={to} className="logo-link" aria-label="Jhelum Labs Research home">
        {content}
      </Link>
    )
  }
  return <>{content}</>
}
