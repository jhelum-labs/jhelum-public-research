import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useResearchIndex, formatDate } from '../hooks/useResearch.js'
import { CoverImage } from '../components/CoverImage.jsx'
import './W11Research.css'

const CATEGORIES = ['All', 'Research Paper', 'Production Document']

function PaperCard({ article }) {
  return (
    <Link to={`/research/${article.slug}`} className="paper-card">
      <div className="paper-card__cover">
        <CoverImage slug={article.slug} width={400} height={140} />
      </div>
      <div className="paper-card__body">
        <div className="paper-card__top">
          <span className={`badge ${article.category === 'Production Document' ? 'badge--prod' : 'badge--paper'}`}>
            {article.category}
          </span>
          {article.readingTime && (
            <span className="paper-card__read">{article.readingTime}</span>
          )}
        </div>
        <h3 className="paper-card__title">{article.title}</h3>
        <p className="paper-card__excerpt">{article.excerpt}</p>
        <div className="paper-card__footer">
          <span className="paper-card__date">{formatDate(article.date)}</span>
          <span className="paper-card__arrow" aria-hidden="true">→</span>
        </div>
      </div>
    </Link>
  )
}

export default function W11Research() {
  const { articles, loading, error } = useResearchIndex()
  const [activeFilter, setActiveFilter] = useState('All')

  const filtered = activeFilter === 'All'
    ? (articles || [])
    : (articles || []).filter((a) => a.category === activeFilter)

  return (
    <section className="w11">
      <div className="container w11__inner">
        <Link to="/" className="w11__back">
          <span aria-hidden="true">←</span> Back to research
        </Link>

        <header className="w11__head">
          <h1 className="w11__title">w-1.1</h1>
          <p className="w11__subtitle">All W-1.1 research</p>
          <span className="w11__count">
            {articles?.length ?? 0}{' '}
            {articles?.length === 1 ? 'publication' : 'publications'}
          </span>
        </header>

        <div className="filter-tabs" role="tablist">
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

        {loading && <p className="loading">Loading publications…</p>}
        {error && (
          <p className="loading">
            Could not load research ({error}). Run <code>npm run extract</code> to generate article content.
          </p>
        )}
        {!loading && !error && (
          <div className="papers-grid">
            {filtered.map((article) => (
              <PaperCard key={article.slug} article={article} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
