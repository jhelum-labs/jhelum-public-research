import { Link } from 'react-router-dom'
import './Logo.css'

/**
 * Brand logo.
 * Set USE_BRAND_LOGO to true and drop your real logo into /public as
 * "logo.png" (or edit LOGO_SRC below) to swap the placeholder wordmark for
 * your company mark.
 */
const USE_BRAND_LOGO = false

function wordmark() {
  return (
    <span className="logo">
      <span className="logo__mark" aria-hidden="true">J</span>
      <span className="logo__word">
        Jhelum <span className="logo__accent">Labs</span>
      </span>
      <span className="logo__tag">Research</span>
    </span>
  )
}

export default function Logo({ to = '/', as = 'link' }) {
  const content = USE_BRAND_LOGO ? (
    <span className="logo logo--img">
      <img src="/logo.png" alt="Jhelum Labs" className="logo__img" />
    </span>
  ) : (
    wordmark()
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