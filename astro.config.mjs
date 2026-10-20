import { defineConfig } from 'astro/config'
import sitemap from '@astrojs/sitemap'

export default defineConfig({
  site: 'https://jhelumlabs.in',
  output: 'static',
  integrations: [sitemap()],
})
