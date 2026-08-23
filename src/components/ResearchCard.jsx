import { Link } from 'react-router-dom'
import './ResearchCard.css'

function CategoryBadge({ category }) {
  const cls = category === 'Production Document' ? 'badge badge--prod' : 'badge badge--paper'
  return <span className={cls}>{category}</span>
}

export default function ResearchCard({ article }) {
  if (!article) return null
  return (
    <article className="research-card">
      <Link to={`/research/${article.slug}`} className="research-card__link">
        <div className="research-card__meta">
          <CategoryBadge category={article.category} />
          <time className="research-card__date">{article.date}</time>
        </div>
        <h3 className="research-card__title">{article.title}</h3>
        <p className="research-card__excerpt">{article.excerpt}</p>
        <span className="research-card__cta">
          Read article <span aria-hidden="true">→</span>
        </span>
      </Link>
    </article>
  )
}