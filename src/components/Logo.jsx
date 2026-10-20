import { Link } from 'react-router-dom'
import './Logo.css'

export function BrandMark({ className = '' }) {
  return (
    <svg
      className={`brand-mark ${className}`.trim()}
      viewBox="0 170 650 630"
      role="img"
      aria-label="Jhelum Labs"
    >
      <g fill="#2a6cf5">
        <polygon points="152,310 306,310 335,344 176,344 49,611 82,611 196,372 358,372 394,413 228,413 124,628 0,628" />
        <polygon points="396,185 627,472 553,598 497,606 576,473 388,240 370,266 537,477 458,611 402,620 482,485 326,289" />
        <polygon points="203,513 295,651 570,614 633,720 236,780 146,640 168,592 258,729 589,683 572,655 275,697 183,559" />
      </g>
      <path d="M322 443H362V538C362 575 340 592 308 592C295 592 290 590 290 590L272 560H322Z" fill="currentColor" />
    </svg>
  )
}

export default function Logo({ to = '/', as = 'link' }) {
  const content = <BrandMark />

  if (as === 'link') {
    return (
      <Link to={to} className="logo-link" aria-label="Jhelum Labs Research home">
        {content}
      </Link>
    )
  }

  return <div className="logo-link">{content}</div>
}
