import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

const lastmod = new Date().toISOString();

const priority = (path) => {
  if (path === '/') return 1.0;
  if (path === '/thu-vien') return 0.9;
  if (path === '/pro' || path === '/nganh' || path.startsWith('/nganh/')) return 0.8;
  if (path.startsWith('/skill/')) return 0.7;
  return 0.6;
};

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
        item.changefreq = path === '/' || path === '/thu-vien' || path.startsWith('/nganh') ? 'weekly' : 'monthly';
        item.priority = priority(path);
        return item;
      },
    }),
  ],
});
