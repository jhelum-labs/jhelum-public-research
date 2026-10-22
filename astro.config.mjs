import { defineConfig } from 'astro/config'
import sitemap from '@astrojs/sitemap'

// Pages that exist only to bounce a visitor somewhere else must not appear in
// the sitemap — search engines should index the destination, not the stub.
const REDIRECT_STUBS = new Set(['/playground'])

export default defineConfig({
  site: 'https://jhelumlabs.in',
  output: 'static',
  // Vercel serves the site with `cleanUrls` (see vercel.json), so `/about` and
  // `/about/` both answer 200 and neither redirects. Left alone, Astro emits
  // `Astro.url.pathname` with a trailing slash for directory-built pages but
  // the article pages pass an explicit slash-less `canonical`, so the site was
  // publishing two different canonical forms. Pin one form everywhere: this
  // setting drives both the canonical tags and the generated sitemap.
  trailingSlash: 'never',
  integrations: [
    sitemap({
      filter: (page) => !REDIRECT_STUBS.has(new URL(page).pathname),
    }),
  ],
})
