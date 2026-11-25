import library from '../data/library.json';
import categories from '../data/categories.json';
import platforms from '../data/platforms.json';
import scan from '../data/scan.json';

export const SAFETY = {
  xanh: { label: 'Sạch', note: 'Quét sơ bộ không thấy dấu hiệu nguy hiểm' },
  vang: { label: 'Cần lưu ý', note: 'Có bước cần bạn biết trước khi chạy' },
  do: { label: 'Rủi ro', note: 'Có dấu hiệu nguy hiểm, không nên cài' },
  'chua-quet': { label: 'Chưa quét', note: 'Chưa có kết quả quét' },
};

export const KIND = { skill: 'Skill', 'bo-skill': 'Bộ skill', n8n: 'Workflow n8n' };

export const scanDate = scan.generatedAt;

function defaultInstall(item) {
  if (item.install?.length) return item.install;
  const name = item.path ? item.path.split('/').pop() : null;
  const list = [];
  list.push({ label: 'Mọi agent', cmd: name ? `npx skills add ${item.repo} --skill ${name}` : `npx skills add ${item.repo}` });
  if (item.platforms.includes('claude-app') && item.path) {
    list.push({ label: 'App Claude', text: `Tải thư mục ${item.path} về, nén thành file .zip, rồi trong Claude chọn Customize → Skills → + → Upload a skill.` });
  }
  return list;
}

export const items = library.map((item) => ({
  ...item,
  url: `https://github.com/${item.repo}${item.path ? `/tree/main/${item.path}` : ''}`,
  installs: defaultInstall(item),
  categoryName: categories.find((c) => c.id === item.category)?.name ?? item.category,
  platformNames: item.platforms.map((p) => platforms[p] ?? p),
  safety: scan.results[item.slug] ?? { status: 'chua-quet', findings: [] },
}));

export { categories, platforms };

export const counts = {
  total: items.length,
  vi: items.filter((i) => i.lang === 'vi').length,
  n8n: items.filter((i) => i.kind === 'n8n').length,
};

export function vnd(n) {
  return new Intl.NumberFormat('vi-VN').format(n) + 'đ';
}

const SITE = 'https://skills.vn';
export function breadcrumb(trail) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: SITE + path })),
  };
}
export function itemListLd(list, name) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    numberOfItems: list.length,
    itemListElement: list.map((it, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SITE}/skill/${it.slug}`, name: it.name })),
  };
}
export function inCategory(id) {
  return items.filter((i) => (id === 'tieng-viet' ? i.lang === 'vi' : i.category === id));
}
