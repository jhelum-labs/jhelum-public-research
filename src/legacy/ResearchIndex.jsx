import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useResearchIndex, formatDate } from '../hooks/useResearch.js'
import './ResearchIndex.css'

const FILTERS = ['All', 'Research Paper', 'Production Document']

export default function ResearchIndex() {
  const { articles, loading } = useResearchIndex()
  const [filter, setFilter] = useState('All')
  const visible = filter === 'All' ? (articles || []) : (articles || []).filter((article) => article.category === filter)

  return (
    <section className="research-index container">
      <header className="research-index__header">
        <p className="research-index__eyebrow">Jhelum Labs</p>
        <h1>Research</h1>
      </header>
      <div className="research-index__controls" role="tablist" aria-label="Research filters">
        {FILTERS.map((name) => (
          <button key={name} type="button" role="tab" aria-selected={filter === name} className={filter === name ? 'research-index__filter research-index__filter--active' : 'research-index__filter'} onClick={() => setFilter(name)}>{name}</button>
        ))}
      </div>
      <div className="research-index__list">
        {loading && <p className="research-index__status">Loading research…</p>}
        {!loading && visible.map((article) => (
          <Link key={article.slug} to={`/research/${article.slug}`} className="research-index__item">
            <div className="research-index__meta">
              <span>{article.category}</span>
              <time>{formatDate(article.date)}</time>
            </div>
            <div className="research-index__content">
              <h2>{article.title}</h2>
              <p>{article.excerpt}</p>
            </div>
            <span className="research-index__arrow" aria-hidden="true">↗</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
