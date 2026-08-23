import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import ResearchCard from '../components/ResearchCard.jsx'
import { useResearchIndex, fetchArticleHtml, formatDate } from '../hooks/useResearch.js'
import './ResearchArticle.css'

function ArticleBody({ article }) {
  const [html, setHtml] = useState(null)
  const [state, setState] = useState('loading') // loading | ready | error

  useEffect(() => {
    let active = true
    setState('loading')
    setHtml(null)
    fetchArticleHtml(article.slug)
      .then((h) => {
        if (!active) return
        setHtml(h)
        setState('ready')
      })
      .catch(() => {
        if (!active) return
        setState('error')
      })
    return () => {
      active = false
    }
  }, [article.slug])

  if (state === 'loading') return <p className="article__status">Loading article…</p>
  if (state === 'error')
    return (
      <p className="article__status">
        The full article text could not be loaded. Run <code>npm run extract</code> and restart the dev server.
      </p>
    )

  return (
    <div
      className="article__content"
      // The HTML is generated locally by our extraction script (mammoth),
      // so it is trusted content we render as-is.
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

export default function ResearchArticle() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { articles, loading } = useResearchIndex()

  if (loading) return <div className="container article__page"><p className="article__status">Loading…</p></div>

  const article = articles?.find((a) => a.slug === slug)

  if (!article) {
    return (
      <div className="container article__page">
        <p className="article__status">Article not found.</p>
        <button className="btn" onClick={() => navigate('/')}>← Back to research</button>
      </div>
    )
  }

  const more = (articles || []).filter((a) => a.slug !== slug).slice(0, 3)

  return (
    <article className="article__page">
      <div className="container article__nav">
        <Link to="/" className="article__back">← All research</Link>
      </div>

      <header className="article__header container">
        <div className="article__meta">
          <span className="article__category">{article.category}</span>
          <span aria-hidden="true">·</span>
          <span>{formatDate(article.date)}</span>
          <span aria-hidden="true">·</span>
          <span>{article.sizeMB}</span>
        </div>
        <h1 className="article__title">{article.title}</h1>
        {article.excerpt && <p className="article__lede">{article.excerpt}</p>}
      </header>

      <div className="container article__body">
        <ArticleBody article={article} />
      </div>

      {more.length > 0 && (
        <section className="related">
          <div className="container">
            <h2 className="related__title">More research</h2>
            <div className="research-grid related__grid">
              {more.map((a) => (
                <ResearchCard key={a.slug} article={a} />
              ))}
            </div>
          </div>
        </section>
      )}
    </article>
  )
}