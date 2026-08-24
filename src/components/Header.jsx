import { NavLink, Link, useLocation } from 'react-router-dom'
import Logo from './Logo.jsx'
import { useTheme } from '../context/ThemeContext.jsx'
import './Header.css'

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const next = theme === 'dark' ? 'light' : 'dark'
  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
    >
      <span className="theme-toggle__icon">{theme === 'dark' ? <SunIcon /> : <MoonIcon />}</span>
      <span className="theme-toggle__label">{theme === 'dark' ? 'Light' : 'Dark'}</span>
    </button>
  )
}

const SunIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
  </svg>
)

const MoonIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
)

export default function Header() {
  const location = useLocation()
  const isPlayground = location.pathname === '/playground'

  return (
    <header className="site-header">
      <div className="container header__inner">
        <Logo />
        <nav className="header__nav" aria-label="Primary">
          <NavLink to="/" className={({ isActive }) => 'nav-link' + (isActive ? ' nav-link--active' : '')} end>
            Research
          </NavLink>
          <a href="mailto:research@jhelumlabs.com" className="nav-link">
            Contact
          </a>
        </nav>
        <div className="header__actions">
          <ThemeToggle />
          {!isPlayground && (
            <Link to="/playground" className="try-btn" aria-label="Try W-1.1 model">
              <span className="try-btn__dot" aria-hidden="true" />
              Try W-1.1
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}