import publications from '../../public/research/index.json'

export const publicationTypes = ['All', 'Research Paper', 'Production Document']

export const allPublications = [...publications]
  .map((publication) => ({
    ...publication,
    status: publication.slug === 'w-1.2-architecture' ? 'Draft' : 'Published',
    type: publication.category,
    abstract: publication.excerpt,
    pdf: null,
    articlePath: `/research/${publication.slug}`,
  }))
  .sort((a, b) => new Date(b.date) - new Date(a.date))

export function formatDate(date) {
  return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(`${date}T00:00:00`))
}

export function getPublication(slug) {
  return allPublications.find((publication) => publication.slug === slug)
}

export function publicationStats() {
  return {
    total: allPublications.length,
    papers: allPublications.filter((publication) => publication.type === 'Research Paper').length,
    documents: allPublications.filter((publication) => publication.type === 'Production Document').length,
  }
}

export function bibtex(publication) {
  const key = publication.slug.replace(/[^a-z0-9]+/gi, '')
  return `@article{jhelumlabs${key},\n  title = {${publication.title}},\n  author = {${publication.authors.join(' and ')}},\n  year = {${publication.date.slice(0, 4)}},\n  month = {${publication.date.slice(5, 7)}},\n  publisher = {Jhelum Labs},\n  url = {https://jhelumlabs.in/research/${publication.slug}}\n}`
}
