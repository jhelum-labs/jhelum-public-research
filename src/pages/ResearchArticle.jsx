import { useEffect, useState, useRef } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useResearchIndex, fetchArticleHtml, formatDate } from '../hooks/useResearch.js'
import { CoverImage } from '../components/CoverImage.jsx'
import './ResearchArticle.css'

function ShareButton() {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <button className="share-btn" onClick={copy} title="Copy link">
      {copied ? <><CheckIcon /> Copied</> : <><LinkIcon /> Share</>}
    </button>
  )
}

const LinkIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
)

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

function TableOfContents({ html }) {
  const [headings, setHeadings] = useState([])
  const [active, setActive] = useState(null)

  useEffect(() => {
    if (!html) return
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    const els = doc.querySelectorAll('h2, h3')
    const items = Array.from(els).map((el, i) => ({
      id: `heading-${i}`,
      text: el.textContent.trim(),
      level: el.tagName,
    }))
    setHeadings(items)
  }, [html])

  useEffect(() => {
    if (!headings.length) return
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((e) => e.isIntersecting)
        if (visible) setActive(visible.target.id)
      },
      { rootMargin: '-20% 0px -70% 0px' }
    )
    headings.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [headings])

  if (!headings.length) return null

  return (
    <nav className="toc" aria-label="Table of contents">
      <p className="toc__label">On this page</p>
      <ul className="toc__list">
        {headings.map(({ id, text, level }) => (
          <li key={id} className={`toc__item toc__item--${level.toLowerCase()}`}>
            <a href={`#${id}`} className={`toc__link${active === id ? ' toc__link--active' : ''}`}>
              {text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

function ArticleBody({ article, onHtmlReady }) {
  const [html, setHtml] = useState(null)
  const [state, setState] = useState('loading')
  const [zoomSrc, setZoomSrc] = useState(null)
  const contentRef = useRef(null)

  useEffect(() => {
    let active = true
    setState('loading')
    setHtml(null)
    fetchArticleHtml(article.slug)
      .then((h) => {
        if (!active) return
        const injected = h.replace(/<(h[23])(.*?)>/gi, (_, tag, attrs, offset) => {
          const idx = h.slice(0, offset).split(/<h[23]/i).length - 1
          return `<${tag}${attrs} id="heading-${idx}">`
        })
        setHtml(injected)
        setState('ready')
        onHtmlReady?.(injected)
      })
      .catch(() => {
        if (!active) return
        setState('error')
      })
    return () => { active = false }
  }, [article.slug])

  useEffect(() => {
    if (!zoomSrc) return
    const onKey = (e) => { if (e.key === 'Escape') setZoomSrc(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [zoomSrc])

  const onContentClick = (e) => {
    if (e.target.tagName === 'IMG') setZoomSrc(e.target.currentSrc || e.target.src)
  }

  if (state === 'loading') return <p className="article__status">Loading article…</p>
  if (state === 'error')
    return (
      <p className="article__status">
        The full article text could not be loaded. Run <code>npm run extract</code> and restart the dev server.
      </p>
    )

  return (
    <>
      <div ref={contentRef} className="article__content" onClick={onContentClick} dangerouslySetInnerHTML={{ __html: html }} />
      {zoomSrc && (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label="Enlarged figure" onClick={() => setZoomSrc(null)}>
          <button className="lightbox__close" aria-label="Close zoom" onClick={() => setZoomSrc(null)}>×</button>
          <img src={zoomSrc} alt="" className="lightbox__img" />
        </div>
      )}
    </>
  )
}

function RelatedCard({ article }) {
  return (
    <Link to={`/research/${article.slug}`} className="related-card">
      <div className="related-card__cover">
        <CoverImage slug={article.slug} title={article.title} width={400} height={120} />
      </div>
      <div className="related-card__body">
        <span className={`badge ${article.category === 'Production Document' ? 'badge--prod' : 'badge--paper'}`}>
          {article.category}
        </span>
        <h3 className="related-card__title">{article.title}</h3>
        <p className="related-card__date">{formatDate(article.date)}</p>
      </div>
    </Link>
  )
}

export default function ResearchArticle() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { articles, loading } = useResearchIndex()
  const [html, setHtml] = useState(null)

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
        <ShareButton />
      </div>

      {/* Big colorful cover image */}
      <div className="article__cover">
        <CoverImage slug={article.slug} title={article.title} width={1200} height={360} />
      </div>

      <header className="article__header container">
        <div className="article__meta">
          <span className="article__category">{article.category}</span>
          <span aria-hidden="true">·</span>
          <span>{formatDate(article.date)}</span>
          {article.readingTime && (
            <><span aria-hidden="true">·</span><span>{article.readingTime}</span></>
          )}
        </div>
        <h1 className="article__title">{article.title}</h1>
        {article.authors?.length > 0 && (
          <p className="article__authors">{article.authors.join(', ')}</p>
        )}
        {article.excerpt && <p className="article__lede">{article.excerpt}</p>}
      </header>

      <div className="container article__layout">
        <aside className="article__sidebar">
          <TableOfContents html={html} />
        </aside>
        <div className="article__body">
          <ArticleBody article={article} onHtmlReady={setHtml} />
        </div>
      </div>

      {more.length > 0 && (
        <section className="related">
          <div className="container">
            <h2 className="related__title">More research</h2>
            <div className="related__grid">
              {more.map((a) => <RelatedCard key={a.slug} article={a} />)}
            </div>
          </div>
        </section>
      )}
    </article>
  )
}
