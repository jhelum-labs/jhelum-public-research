import { useEffect, useState } from 'react'

/** Fetch the research index (list of article metadata). */
export function useResearchIndex() {
  const [articles, setArticles] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    fetch(`${import.meta.env.BASE_URL}index.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load research index (${res.status})`)
        return res.json()
      })
      .then((data) => {
        if (!active) return
        setArticles(data || [])
        setLoading(false)
      })
      .catch((e) => {
        if (!active) return
        setError(e.message)
        setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  return { articles, loading, error }
}

/** Fetch the full article HTML body for a given slug. */
export async function fetchArticleHtml(slug) {
  const res = await fetch(`${import.meta.env.BASE_URL}${slug}.html`)
  if (!res.ok) throw new Error(`Article not found (${res.status})`)
  return res.text()
}

/** Split a Date string for friendly display. */
export function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  if (isNaN(d)) return dateStr
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d)
}