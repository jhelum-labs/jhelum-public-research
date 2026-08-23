import { Link } from 'react-router-dom'
import './ResearchCard.css'

function CategoryBadge({ category }) {
  const cls = category === 'Production Document' ? 'badge badge--prod' : 'badge badge--paper'
  return <span className={cls}>{category}</span>
}

export default function ResearchCard({ article, index = 1 }) {
  if (!article) return null
  return (
    <Link to={`/research/${article.slug}`} className="research-row">
      <span className="research-row__index">{String(index).padStart(2, '0')}</span>
      <span className="research-row__body">
        <CategoryBadge category={article.category} />
        <h3 className="research-row__title">{article.title}</h3>
      </span>
      <span className="research-row__meta">
        <span className="research-row__date">{article.date}</span>
        <span className="research-row__arrow" aria-hidden="true">→</span>
      </span>
    </Link>
  )
}