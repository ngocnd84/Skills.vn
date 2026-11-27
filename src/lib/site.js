import skills from '../data/skills.json';
import categories from '../data/categories.json';
import bots from '../data/bots.json';
import teams from '../data/teams.json';
import books from '../data/books.json';

export const SITE = 'https://skills.vn';
export const PUBLISHED = '2026-11-27';

export const PLATFORMS = {
  'claude-app': 'App Claude',
  'claude-code': 'Claude Code',
  codex: 'Codex',
  cursor: 'Cursor',
  n8n: 'n8n',
};

export const skillBySlug = Object.fromEntries(skills.map((s) => [s.slug, s]));
export const categoryBySlug = Object.fromEntries(categories.map((c) => [c.slug, c]));
export const botBySlug = Object.fromEntries(bots.map((b) => [b.slug, b]));
export const skillsIn = (slug) => skills.filter((s) => s.categorySlug === slug);
export const botsIn = (slug) => bots.filter((b) => b.categorySlug === slug);

// Skill nổi bật trên trang chủ: skill đầu tiên của 12 ngành đầu.
export const featured = categories.slice(0, 12).map((c) => skillsIn(c.slug)[0]);

export const counts = {
  skills: skills.length,
  prompts: skills.length,
  categories: categories.length,
  bots: bots.length,
  teams: teams.length,
  chapters: books.length,
};

export { skills, categories, bots, teams, books };

export function vnd(n) {
  return new Intl.NumberFormat('vi-VN').format(n) + 'đ';
}

export function breadcrumb(trail) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: SITE + path })),
  };
}

export function itemListLd(list, name, base = '/skill/') {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    numberOfItems: list.length,
    itemListElement: list.map((it, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SITE}${base}${it.slug}`, name: it.name || it.title })),
  };
}

export function faqLd(pairs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: pairs.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
  };
}

// Chuẩn hoá để tìm kiếm không dấu: "hợp đồng" khớp "hop dong".
export const fold = (s) => s.toLowerCase().replace(/đ/g, 'd').normalize('NFD').replace(/[̀-ͯ]/g, '');

// Chọn tiêu đề dài nhất mà vẫn vừa 65 ký tự sau khi Base thêm " | skills.vn".
export function fitTitle(...candidates) {
  return candidates.find((t) => t.length + 12 <= 65) ?? candidates[candidates.length - 1];
}
