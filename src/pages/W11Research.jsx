import { Link } from 'react-router-dom'
import ResearchCard from '../components/ResearchCard.jsx'
import { useResearchIndex } from '../hooks/useResearch.js'
import './W11Research.css'

export default function W11Research() {
  const { articles, loading, error } = useResearchIndex()

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

        <div className="research-list w11__list">
          {loading && <p className="loading">Loading publications…</p>}
          {error && (
            <p className="loading">
              Could not load research ({error}). Run <code>npm run extract</code>{' '}
              to generate the article content, then restart the dev server.
            </p>
          )}
          {!loading &&
            !error &&
            articles.map((article, i) => (
              <ResearchCard key={article.slug} article={article} index={i + 1} />
            ))}
        </div>
      </div>
    </section>
  )
}