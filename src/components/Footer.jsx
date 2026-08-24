import Logo from './Logo.jsx'
import './Footer.css'

export default function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="site-footer">
      <div className="container footer__grid">
        <div className="footer__brand">
          <Logo as="div" />
          <p className="footer__blurb">
            Jhelum Labs is an independent AI research group publishing its work openly.
          </p>
        </div>

        <div className="footer__col">
          <h4 className="footer__heading">Research</h4>
          <ul className="footer__list">
            <li><a href="/">Home</a></li>
            <li><a href="/#all-research">All Research</a></li>

          </ul>
        </div>

        <div className="footer__col">
          <h4 className="footer__heading">Company</h4>
          <ul className="footer__list">
            <li><a href="mailto:research@jhelumlabs.com">Contact</a></li>
            <li><a href="mailto:team@jhelumlabs.com">Careers</a></li>
            <li><a href="http://github.com" rel="noreferrer" target="_blank">GitHub</a></li>
          </ul>
        </div>
      </div>

      <div className="container footer__bottom">
        <span>© {year} Jhelum Labs. All rights reserved.</span>
        <span className="footer__legal">
          <a href="#privacy">Privacy</a> · <a href="#terms">Terms</a>
        </span>
      </div>
    </footer>
  )
}