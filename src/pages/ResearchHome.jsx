import { memo } from 'react'
import { Link } from 'react-router-dom'
import { useResearchIndex } from '../hooks/useResearch.js'
import { LogoMark } from '../components/Logo.jsx'
import './ResearchHome.css'

const LogoMemo = memo(() => (
  <div className="hero__logo-wrap">
    <LogoMark size={72} />
  </div>
))

function Hero() {
  return (
    <section className="hero">
      <div className="container hero__inner">
        <span className="hero__logo">
          <LogoMemo />
        </span>
        <p className="hero__eyebrow">JHELUM LABS · AI RESEARCH</p>
        <h1 className="hero__title">Jhelum-lab</h1>
        <p className="hero__subtitle">research</p>
        <p className="hero__lead">
          Every piece of research performed on the <strong>W-1.1</strong> model
          program — architectures, evaluations, and production project lines —
          published in full below.
        </p>
      </div>
    </section>
  )
}

function AllResearch({ articles }) {
  const count = articles?.length ?? 0

  return (
    <section className="all-research" id="all-research">
      <div className="container">
        <div className="section-head">
          <h2 className="section-title">All research</h2>
          <span className="section-count">
            {count} {count === 1 ? 'publication' : 'publications'}
          </span>
        </div>

        <div className="w11-list">
          <Link to="/w-1.1" className="w11-row">
            <span className="w11-row__name">w-1.1</span>
            <span className="w11-row__meta">
              <span className="w11-row__date">
                {count} {count === 1 ? 'paper' : 'papers'}
              </span>
              <span className="w11-row__arrow" aria-hidden="true">→</span>
            </span>
          </Link>
        </div>
      </div>
    </section>
  )
}

export default function ResearchHome() {
  const { articles } = useResearchIndex()

  return (
    <>
      <Hero />
      <AllResearch articles={articles} />
    </>
  )
}