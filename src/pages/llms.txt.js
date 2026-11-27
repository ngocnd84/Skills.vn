// /llms.txt: bản tóm tắt dạng Markdown cho các công cụ AI (ChatGPT, Claude, Perplexity) đọc nhanh nội dung site.
import { skills, categories, bots, teams, books, skillsIn, counts } from '../lib/site.js';
import products from '../data/products.json';

const U = 'https://skills.vn';
export function GET() {
  const lines = [
    '# skills.vn',
    '',
    `> Thư viện Claude Skill và prompt tiếng Việt: ${counts.skills} skill, ${counts.prompts} prompt mẫu cho ${counts.categories} ngành nghề, ${counts.bots} mẫu bot, ${counts.teams} bot team và sách prompting 6 chương. Mỗi skill có file SKILL.md tải miễn phí (dùng cho Claude, Claude Code) và prompt mẫu (dùng cho ChatGPT, Gemini). Có gói Pro gồm bộ skill chuyên sâu cho nghiệp vụ Việt Nam và dịch vụ cài đặt cho doanh nghiệp.`,
    '',
    '## Trang chính',
    `- [Thư viện skill](${U}/thu-vien): tìm và lọc toàn bộ skill, prompt`,
    `- [Skill theo ngành](${U}/nganh)`,
    `- [Bots & Teams](${U}/bots): mẫu bot ghép từ nhiều skill`,
    `- [Sách prompting](${U}/sach)`,
    `- [Claude Skill là gì và cách cài](${U}/huong-dan)`,
    `- [Gói Pro](${U}/pro): bộ skill trả phí cho nghiệp vụ Việt Nam`,
    `- [Dịch vụ cài đặt](${U}/dich-vu)`,
    '',
    ...categories.flatMap((c) => [
      `## ${c.title}`,
      `${c.intro} (${U}/nganh/${c.slug})`,
      ...skillsIn(c.slug).map((s) => `- [${s.name}](${U}/skill/${s.slug}): ${s.description}`),
      '',
    ]),
    '## Mẫu bot',
    ...bots.map((b) => `- ${b.name}: ${b.desc}`),
    '',
    '## Bot teams',
    ...teams.map((t) => `- ${t.name}: ${t.desc}`),
    '',
    '## Sách prompting',
    ...books.map((b) => `- [Chương ${b.number}: ${b.title}](${U}/sach/${b.slug}): ${b.desc}`),
    '',
    '## Gói Pro',
    ...products.packs.map((p) => `- ${p.name}: ${new Intl.NumberFormat('vi-VN').format(p.price)}đ (${p.status === 'dang-ban' ? 'đang bán' : 'sắp ra mắt'}). ${p.summary}`),
    ...products.plans.map((p) => `- ${p.name}: ${new Intl.NumberFormat('vi-VN').format(p.price)}đ cho ${p.period}.`),
    '',
  ];
  return new Response(lines.join('\n'), { headers: { 'content-type': 'text/markdown; charset=utf-8' } });
}
