import { memo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useResearchIndex, formatDate } from '../hooks/useResearch.js'
import { LogoMark } from '../components/Logo.jsx'
import './ResearchHome.css'

const CATEGORIES = ['All', 'Research Paper', 'Production Document']

const LogoMemo = memo(() => (
  <div className="hero__logo-wrap">
    <LogoMark size={64} />
  </div>
))

function StatsBar({ articles }) {
  const total = articles?.length ?? 0
  const papers = articles?.filter((a) => a.category === 'Research Paper').length ?? 0
  const docs = articles?.filter((a) => a.category === 'Production Document').length ?? 0
  return (
    <div className="stats-bar">
      <div className="stats-bar__item">
        <span className="stats-bar__num">{total}</span>
        <span className="stats-bar__label">Publications</span>
      </div>
      <div className="stats-bar__divider" />
      <div className="stats-bar__item">
        <span className="stats-bar__num">{papers}</span>
        <span className="stats-bar__label">Research Papers</span>
      </div>
      <div className="stats-bar__divider" />
      <div className="stats-bar__item">
        <span className="stats-bar__num">{docs}</span>
        <span className="stats-bar__label">Production Docs</span>
      </div>
      <div className="stats-bar__divider" />
      <div className="stats-bar__item">
        <span className="stats-bar__num">W-1.1</span>
        <span className="stats-bar__label">Model Program</span>
      </div>
    </div>
  )
}

function FeaturedCard({ article }) {
  if (!article) return null
  return (
    <Link to={`/research/${article.slug}`} className="featured-card">
      <div className="featured-card__eyebrow">
        <span className="badge badge--latest">Latest</span>
        <span className="featured-card__category">{article.category}</span>
      </div>
      <h2 className="featured-card__title">{article.title}</h2>
      <p className="featured-card__excerpt">{article.excerpt}</p>
      <div className="featured-card__footer">
        <span className="featured-card__date">{formatDate(article.date)}</span>
        {article.readingTime && <span className="featured-card__read">{article.readingTime}</span>}
        <span className="featured-card__cta">Read paper →</span>
      </div>
    </Link>
  )
}

function ResearchRow({ article, index }) {
  return (
    <Link to={`/research/${article.slug}`} className="research-row">
      <span className="research-row__index">{String(index).padStart(2, '0')}</span>
      <span className="research-row__body">
        <span className={`badge ${article.category === 'Production Document' ? 'badge--prod' : 'badge--paper'}`}>
          {article.category}
        </span>
        <h3 className="research-row__title">{article.title}</h3>
        <p className="research-row__excerpt">{article.excerpt}</p>
      </span>
      <span className="research-row__meta">
        <span className="research-row__date">{formatDate(article.date)}</span>
        {article.readingTime && <span className="research-row__read">{article.readingTime}</span>}
        <span className="research-row__arrow" aria-hidden="true">→</span>
      </span>
    </Link>
  )
}

export default function ResearchHome() {
  const { articles, loading } = useResearchIndex()
  const [activeFilter, setActiveFilter] = useState('All')

  const filtered = activeFilter === 'All'
    ? (articles || [])
    : (articles || []).filter((a) => a.category === activeFilter)

  const featured = articles?.[0] ?? null

  return (
    <>
      <section className="hero">
        <div className="container hero__inner">
          <LogoMemo />
          <p className="hero__eyebrow">JHELUM LABS · AI RESEARCH</p>
          <h1 className="hero__title">Jhelum-lab</h1>
          <p className="hero__subtitle">research</p>

        </div>
      </section>

      <section className="stats-section">
        <div className="container">
          <StatsBar articles={articles} />
        </div>
      </section>

      {featured && (
        <section className="featured-section">
          <div className="container">
            <h2 className="section-label">Latest research</h2>
            <FeaturedCard article={featured} />
          </div>
        </section>
      )}

      <section className="all-research" id="all-research">
        <div className="container">
          <div className="section-head">
            <h2 className="section-title">All research</h2>
            <span className="section-count">
              {filtered.length} {filtered.length === 1 ? 'publication' : 'publications'}
            </span>
          </div>

          <div className="filter-tabs" role="tablist" aria-label="Filter by category">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                role="tab"
                aria-selected={activeFilter === cat}
                className={`filter-tab${activeFilter === cat ? ' filter-tab--active' : ''}`}
                onClick={() => setActiveFilter(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="research-list">
            {loading && <p className="loading">Loading publications…</p>}
            {!loading && filtered.map((article, i) => (
              <ResearchRow key={article.slug} article={article} index={i + 1} />
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
