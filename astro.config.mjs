import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { readFileSync } from 'node:fs';

const scan = JSON.parse(readFileSync(new URL('./src/data/scan.json', import.meta.url), 'utf8'));
const lastmod = new Date(scan.generatedAt + 'T00:00:00+07:00').toISOString();

export default defineConfig({
  site: 'https://skills.vn',
  trailingSlash: 'never',
  build: { format: 'file' },
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/thanh-toan') && !page.includes('/404'),
      serialize(item) {
        const path = new URL(item.url).pathname;
        item.lastmod = lastmod;
        item.changefreq = path === '/' || path.startsWith('/thu-vien') ? 'weekly' : 'monthly';
        item.priority = path === '/' ? 1.0 : path.startsWith('/thu-vien') || path === '/pro' ? 0.9 : path.startsWith('/skill/') ? 0.7 : 0.6;
        return item;
      },
    }),
  ],
});
