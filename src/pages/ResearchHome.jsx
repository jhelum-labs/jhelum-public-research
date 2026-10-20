import { Link } from 'react-router-dom'
import { useResearchIndex, formatDate } from '../hooks/useResearch.js'
import { CoverImage } from '../components/CoverImage.jsx'
import { BrandMark, BrandWordmark } from '../components/Logo.jsx'
import ScrollVelocity from '../components/ScrollVelocity.jsx'
import './ResearchHome.css'

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
    </div>
  )
}

function FeaturedCard({ article }) {
  if (!article) return null
  return (
    <Link to={`/research/${article.slug}`} className="featured-card">
      <div className="featured-card__cover">
        <CoverImage slug={article.slug} title={article.title} width={900} height={320} />
      </div>
      <div className="featured-card__body">
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
      </div>
    </Link>
  )
}

export default function ResearchHome() {
  const { articles, loading } = useResearchIndex()

  const featured = articles?.[0] ?? null

  return (
    <>
      <section className="hero">
        <div className="container hero__inner">
          <BrandMark className="hero__mark" />
          <h1 className="hero__title">
            <BrandWordmark />
          </h1>
          <p className="hero__intro">Open experimental AI research, systems, and publications.</p>
        </div>
      </section>

      <ScrollVelocity text="Jhelum Labs · Research and Deployment · " />

      <section className="stats-section">
        <div className="container">
          <StatsBar articles={articles} />
        </div>
      </section>

      {featured && (
        <section className="featured-section">
          <div className="container">
            <div className="home-research__head">
              <div>
                <p className="home-research__eyebrow">Latest work</p>
                <h2 className="home-research__title">Research</h2>
              </div>
              <Link to="/research" className="home-research__more">More research <span aria-hidden="true">↗</span></Link>
            </div>
            <div className="home-research__grid">
              {(articles || []).slice(0, 3).map((article) => <FeaturedCard key={article.slug} article={article} />)}
            </div>
          </div>
        </section>
      )}
    </>
  )
}
