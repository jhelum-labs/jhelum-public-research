import { memo, useState } from 'react'
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

const FolderIcon = () => (
  <svg className="folder__icon-svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
  </svg>
)

const ChevronIcon = () => (
  <svg className="folder__chevron-svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M6 9l6 6 6-6" />
  </svg>
)

function AllResearch({ articles, loading, error }) {
  const [open, setOpen] = useState(true)

  return (
    <section className="all-research" id="all-research">
      <div className="container">
        <div className="section-head">
          <h2 className="section-title">All research</h2>
          <span className="section-count">
            {articles?.length ?? 0}{' '}
            {articles?.length === 1 ? 'publication' : 'publications'}
          </span>
        </div>

        <div className={`folder${open ? ' folder--open' : ''}`}>
          <button
            type="button"
            className="folder__toggle"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
          >
            <span className="folder__icon">
              <FolderIcon />
            </span>
            <span className="folder__name">w-1.1</span>
            <span className="folder__hint">
              {loading ? '…' : open ? 'Hide papers' : 'View papers'}
            </span>
            <span className="folder__chevron-wrap">
              <ChevronIcon />
            </span>
          </button>

          {open && (
            <div className="folder__content">
              {loading && <p className="loading">Loading publications…</p>}
              {error && (
                <p className="loading">
                  Could not load research ({error}). Run <code>npm run extract</code>{' '}
                  to generate the article content, then restart the dev server.
                </p>
              )}
              {!loading && !error && (
                <div className="research-list">
                  {articles.map((article, i) => (
                    <ResearchCard key={article.slug} article={article} index={i + 1} />
                  ))}
                </div>
              )}
            </div>
          )}
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