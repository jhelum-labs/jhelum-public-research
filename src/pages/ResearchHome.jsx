import { memo } from 'react'
import { Link } from 'react-router-dom'
import ResearchCard from '../components/ResearchCard.jsx'
import { useResearchIndex } from '../hooks/useResearch.js'
import Logo from '../components/Logo.jsx'
import './ResearchHome.css'

const LogoMemo = memo(() => (
  <div className="featured__logo-wrap">
    <Logo as="div" />
  </div>
))

function FeaturedArticle({ article }) {
  if (!article) return null
  return (
    <section className="featured" id="featured">
      <div className="container featured__inner">
        <div className="featured__text">
          <span className="featured__eyebrow">Featured research</span>
          <h2 className="featured__title">{article.title}</h2>
          <p className="featured__excerpt">{article.excerpt}</p>
          <div className="featured__meta">
            <span className="featured__category">{article.category}</span>
            <span className="featured__dot" aria-hidden="true">·</span>
            <span>{article.date}</span>
          </div>
          <Link to={`/research/${article.slug}`} className="btn btn-primary featured__cta">
            Read the article <span aria-hidden="true">→</span>
          </Link>
        </div>
        <div className="featured__art" aria-hidden="true">
          <LogoMemo />
        </div>
      </div>
    </section>
  )
}

function Hero() {
  return (
    <section className="hero">
      <div className="container hero__inner">
        <p className="hero__kicker">JHELUM LABS · AI RESEARCH</p>
        <h1 className="hero__title">Research</h1>
        <p className="hero__lead">
          Insights, architectures, and experimental results from Jhelum Labs —
          beginning with the <strong>W-1.1</strong> model program.
        </p>
        <div className="hero__actions">
          <a href="#all-research" className="btn btn-primary">Explore all research</a>
          <a href="#about" className="btn">About W-1.1</a>
        </div>
      </div>
    </section>
  )
}

function AboutSection() {
  return (
    <section className="about" id="about">
      <div className="container about__inner">
        <h2 className="about__title">About the W-1.1 model</h2>
        <p className="about__text">
          W-1.1 is a 123M-parameter language model developed by Jhelum Labs to
          study efficient architecture design. Our research spans the model's
          architecture, training methodology, evaluation, and experimental
          project lines — all published here as open research documents.
        </p>
        <div className="about__stats">
          <div className="stat"><strong className="stat__num">123M</strong><span className="stat__label">Parameters</span></div>
          <div className="stat"><strong className="stat__num">10</strong><span className="stat__label">Publications</span></div>
          <div className="stat"><strong className="stat__num">2</strong><span className="stat__label">Categories</span></div>
        </div>
      </div>
    </section>
  )
}

function AllResearch({ articles, loading, error }) {
  if (loading) {
    return (
      <section className="all-research" id="all-research">
        <div className="container">
          <h2 className="section-title">All research</h2>
          <p className="loading">Loading publications…</p>
        </div>
      </section>
    )
  }
  if (error || !articles) {
    return (
      <section className="all-research" id="all-research">
        <div className="container">
          <h2 className="section-title">All research</h2>
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
          <h2 className="section-title">All research</h2>
          <span className="section-count">
            {articles.length} {articles.length === 1 ? 'publication' : 'publications'}
          </span>
        </div>
        <div className="research-grid">
          {articles.map((article) => (
            <ResearchCard key={article.slug} article={article} />
          ))}
        </div>
      </div>
    </section>
  )
}

export default function ResearchHome() {
  const { articles, loading, error } = useResearchIndex()
  const featured =
    articles?.find((a) => a.slug === 'w-1.1-125m-architecture') ||
    articles?.find((a) => a.category === 'Research Paper') ||
    articles?.[0]

  return (
    <>
      <Hero />
      <FeaturedArticle article={featured} />
      <AboutSection />
      <AllResearch articles={articles} loading={loading} error={error} />
    </>
  )
}