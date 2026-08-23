import { memo } from 'react'
import ResearchCard from '../components/ResearchCard.jsx'
import { useResearchIndex } from '../hooks/useResearch.js'
import Logo from '../components/Logo.jsx'
import './ResearchHome.css'

const LogoMemo = memo(() => (
  <div className="hero__logo-wrap">
    <Logo as="div" />
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

function AllResearch({ articles, loading, error }) {
  if (loading) {
    return (
      <section className="all-research" id="all-research">
        <div className="container">
          <div className="section-head">
            <div className="section-head__text">
              <h2 className="section-title">All research</h2>
              <span className="section-subtitle">w-1.1</span>
            </div>
          </div>
          <p className="loading">Loading publications…</p>
        </div>
      </section>
    )
  }
  if (error || !articles) {
    return (
      <section className="all-research" id="all-research">
        <div className="container">
          <div className="section-head">
            <div className="section-head__text">
              <h2 className="section-title">All research</h2>
              <span className="section-subtitle">w-1.1</span>
            </div>
          </div>
          <p className="loading">
            Could not load research ({error}). Run <code>npm run extract</code>{' '}
            to generate the article content, then restart the dev server.
          </p>
        </div>
      </section>
    )
  }
  return (
    <section className="all-research" id="all-research">
      <div className="container">
        <div className="section-head">
          <div className="section-head__text">
            <h2 className="section-title">All research</h2>
            <span className="section-subtitle">w-1.1</span>
          </div>
          <span className="section-count">
            {articles.length} {articles.length === 1 ? 'publication' : 'publications'}
          </span>
        </div>
        <div className="research-list">
          {articles.map((article, i) => (
            <ResearchCard key={article.slug} article={article} index={i + 1} />
          ))}
        </div>
      </div>
    </section>
  )
}

export default function ResearchHome() {
  const { articles, loading, error } = useResearchIndex()

  return (
    <>
      <Hero />
      <AllResearch articles={articles} loading={loading} error={error} />
    </>
  )
}