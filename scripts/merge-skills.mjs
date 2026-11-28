// Gộp các batch skill mới vào src/data/skills.json của repo skills.vn.
// Dùng: node merge.mjs <đường-dẫn-repo> <batch1.mjs> [batch2.mjs ...]
// Không chạy scripts/build-data.mjs vì script đó ghi đè skills.json từ app-source.json cũ.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const [repo, ...batchFiles] = process.argv.slice(2);
if (!repo || batchFiles.length === 0) { console.error('Usage: node merge.mjs <repo> <batch...>'); process.exit(1); }

export const slugify = (s) => s.replace(/F&B/g, 'FnB').toLowerCase().replace(/đ/g, 'd').normalize('NFD')
  .replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const dataDir = path.join(repo, 'src/data');
const skillsPath = path.join(dataDir, 'skills.json');
const categories = JSON.parse(fs.readFileSync(path.join(dataDir, 'categories.json'), 'utf8'));
const skills = JSON.parse(fs.readFileSync(skillsPath, 'utf8'));
const catByName = Object.fromEntries(categories.map((c) => [c.name, c]));
const usedSlugs = new Set(skills.map((s) => s.slug));
const usedNames = new Set(skills.map((s) => s.name.toLowerCase()));

const incoming = [];
for (const f of batchFiles) {
  const mod = await import(pathToFileURL(path.resolve(f)).href);
  incoming.push(...mod.default);
}

const added = [];
const skipped = [];
const errors = [];
for (const x of incoming) {
  const cat = catByName[x.c];
  if (!cat) { errors.push(`Ngành không tồn tại: ${x.c} (${x.n})`); continue; }
  if (!x.n || !x.d || !x.p || !Array.isArray(x.w) || x.w.length < 2 || !x.e) { errors.push(`Thiếu trường: ${x.n}`); continue; }
  const slug = slugify(x.n);
  if (usedSlugs.has(slug) || usedNames.has(x.n.toLowerCase())) { skipped.push(x.n); continue; }
  usedSlugs.add(slug); usedNames.add(x.n.toLowerCase());
  added.push({
    slug,
    name: x.n,
    emoji: cat.emoji,
    category: cat.name,
    categorySlug: cat.slug,
    subcategory: x.s,
    description: x.d,
    longDescription: `${x.d} ${x.w[0]} ${x.w[1]}`,
    tags: x.t,
    skillMd: `---\nname: ${slug}\ndescription: ${x.d}\n---\n\n# ${x.n}\n\n## Mục tiêu\n${x.d}\n\n## Khi nào dùng\n- ${x.w[0]}\n- ${x.w[1]}\n\n## Hướng dẫn\n${x.p}\n\n## Ví dụ\nInput: ${x.e}`,
    examplePrompt: `Hãy dùng skill ${x.n}. ${x.e}`,
    prompt: x.p,
    whenToUse: x.w,
    inputs: `Mô tả tình huống cụ thể của bạn, ví dụ: ${x.e}`,
    outputs: 'Kết quả theo đúng cấu trúc trong prompt, kèm bước tiếp theo rõ ràng.',
    related: [],
    examples: [
      { title: 'Ví dụ 1 — Tình huống của bạn', prompt: `Dùng skill ${x.n}. ${x.e}` },
      { title: 'Ví dụ 2 — Bản tóm tắt', prompt: `Dùng skill ${x.n} và tóm tắt kết quả thành 5 gạch đầu dòng. ${x.e}` },
    ],
  });
}

// Liên kết nội bộ: nối tối đa 2 skill mới cùng ngành (không kể chính nó).
for (const s of added) {
  s.related = added.filter((o) => o.category === s.category && o.slug !== s.slug).slice(0, 2).map((o) => o.slug);
}

fs.writeFileSync(skillsPath, JSON.stringify([...skills, ...added], null, 2) + '\n');
console.log(JSON.stringify({ incoming: incoming.length, added: added.length, skipped, errors, total: skills.length + added.length }, null, 2));
if (errors.length) process.exit(2);
