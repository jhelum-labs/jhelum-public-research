# Jhelum Labs Research

Static research website for [jhelumlabs.in](https://jhelumlabs.in), built with Astro. The production build emits HTML for the home page, research index, publication pages, about, contact, privacy, terms, and 404 routes.

## Development

```bash
npm install
npm run dev
npm run build
npm run preview
```

## Add a publication

1. Add one entry to [`public/research/index.json`](public/research/index.json). Required fields are `slug`, `title`, `category`, `date`, `authors`, and `excerpt`.
2. Add the corresponding article body as `public/research/<slug>.html`.
3. If there is a real PDF, DOI, arXiv, or Zenodo link, add its URL as a data field before exposing it in the UI. Do not add placeholder links.
4. Run `npm run build`. Astro will create `/research/<slug>/index.html` and refresh the sitemap.

Publication status is derived conservatively: `w-1.2-architecture` is marked Draft; the W-1.1 publication record is marked Published. Update the data logic when a document's status changes.

## Configuration

Edit [`src/lib/site.js`](src/lib/site.js) to change the contact email, GitHub URL, demo button label/URL, licence, site name, or tagline. The header, footer, metadata, and W-1.1 CTA share these values.

## Content TODOs

- Add actual team names and biographies to the About page.
- Replace the Privacy and Terms placeholders with reviewed legal copy.
- Add verified PDF/DOI/arXiv/Zenodo URLs to publication data where available.
