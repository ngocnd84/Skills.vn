// /llms.txt: bản tóm tắt dạng Markdown cho các công cụ AI (ChatGPT, Claude, Perplexity) đọc nhanh nội dung site.
import { items, categories, scanDate, KIND } from '../lib/library.js';
import products from '../data/products.json';

export function GET() {
  const lines = [
    '# skills.vn',
    '',
    '> Thư viện Claude Skill, agent skill và workflow n8n cho người Việt: mô tả tiếng Việt, lệnh cài sẵn, quét an toàn hằng tuần. Có gói Pro gồm các bộ skill viết riêng cho nghiệp vụ Việt Nam và dịch vụ cài đặt cho doanh nghiệp.',
    '',
    `Kết quả quét an toàn cập nhật ngày ${scanDate}.`,
    '',
    '## Trang chính',
    '- [Thư viện](https://skills.vn/thu-vien): toàn bộ skill và workflow, có nhãn an toàn',
    '- [Claude Skill là gì và cách cài](https://skills.vn/huong-dan)',
    '- [Gói Pro](https://skills.vn/pro): bộ skill trả phí cho nghiệp vụ Việt Nam',
    '- [Dịch vụ cài đặt](https://skills.vn/dich-vu)',
    '',
    '## Nhóm',
    ...categories.map((c) => `- [${c.h1}](https://skills.vn/thu-vien/${c.id}): ${c.intro}`),
    '',
    '## Skill trong thư viện',
    ...items.map((i) => `- [${i.name}](https://skills.vn/skill/${i.slug}) (${KIND[i.kind]}, ${i.lang === 'vi' ? 'tiếng Việt' : 'tiếng Anh'}, nhãn: ${i.safety.status}): ${i.summary}`),
    '',
    '## Gói Pro',
    ...products.packs.map((p) => `- ${p.name}: ${new Intl.NumberFormat('vi-VN').format(p.price)}đ (${p.status === 'dang-ban' ? 'đang bán' : 'sắp ra mắt'}). ${p.summary}`),
    ...products.plans.map((p) => `- ${p.name}: ${new Intl.NumberFormat('vi-VN').format(p.price)}đ cho ${p.period}.`),
    '',
  ];
  return new Response(lines.join('\n'), { headers: { 'content-type': 'text/markdown; charset=utf-8' } });
}
