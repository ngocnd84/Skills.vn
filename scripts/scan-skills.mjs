// Quét sơ bộ các file SKILL.md / README trong thư viện để gắn nhãn an toàn.
// Chạy: node scripts/scan-skills.mjs   (GitHub Action chạy tự động mỗi tuần)
// Đây là quét theo mẫu (heuristic) trên văn bản hướng dẫn, KHÔNG thay cho việc đọc mã.
import { readFile, writeFile } from 'node:fs/promises';

const library = JSON.parse(await readFile(new URL('../src/data/library.json', import.meta.url), 'utf8'));

// Mức "do": dấu hiệu thường gặp trong skill độc hại (theo các báo cáo Snyk, Unit 42 năm 2026).
const RED = [
  [/curl[^\n|]*\|\s*(ba|z)?sh/i, 'Tải script từ mạng rồi chạy thẳng (curl | sh)'],
  [/wget[^\n|]*\|\s*(ba|z)?sh/i, 'Tải script từ mạng rồi chạy thẳng (wget | sh)'],
  [/base64\s+(-d|--decode)/i, 'Giải mã base64 để chạy lệnh ẩn'],
  [/\/dev\/tcp\/|nc\s+-e\s|ncat\s+-e/i, 'Dấu hiệu mở kết nối ngược (reverse shell)'],
  [/~\/\.ssh|id_rsa|\.aws\/credentials|\.env\b.*(gửi|send|upload|post)/i, 'Đụng tới khoá bí mật hoặc thông tin đăng nhập'],
  [/ignore (all )?(previous|prior) instructions|bỏ qua (mọi|các) hướng dẫn trước/i, 'Câu lệnh chèn để vượt hướng dẫn (prompt injection)'],
  [/do not (tell|inform) the user|đừng (báo|nói) (cho )?người dùng/i, 'Yêu cầu giấu hành động với người dùng'],
  [/webhook\.site|pastebin\.com|ngrok\.io|requestbin/i, 'Gửi dữ liệu tới dịch vụ trung gian đáng ngờ'],
];
// Mức "vang": không xấu, nhưng cần người dùng biết trước khi chạy.
const AMBER = [
  [/\bsudo\b/, 'Có lệnh cần quyền quản trị (sudo)'],
  [/rm\s+-rf\s+[~/]/, 'Có lệnh xoá thư mục hàng loạt (rm -rf)'],
  [/npm\s+(i|install)\s+-g|pip\s+install|brew\s+install/i, 'Cài thêm phần mềm lên máy'],
  [/api[_ -]?key|access[_ -]?token/i, 'Cần khoá API hoặc token của dịch vụ ngoài'],
];

async function fetchText(repo, file) {
  for (const branch of ['main', 'master']) {
    const res = await fetch(`https://raw.githubusercontent.com/${repo}/${branch}/${file}`);
    if (res.ok) return await res.text();
  }
  return null;
}

const results = {};
for (const item of library) {
  const files = item.skillMd?.length ? item.skillMd : ['README.md'];
  const findings = [];
  let fetched = 0;
  for (const f of files) {
    const text = await fetchText(item.repo, f);
    if (text == null) continue;
    fetched++;
    for (const [re, msg] of RED) if (re.test(text)) findings.push({ level: 'do', msg, file: f });
    for (const [re, msg] of AMBER) if (re.test(text)) findings.push({ level: 'vang', msg, file: f });
  }
  const unique = [...new Map(findings.map((x) => [x.level + x.msg, x])).values()];
  const status = fetched === 0 ? 'chua-quet' : unique.some((x) => x.level === 'do') ? 'do' : unique.length ? 'vang' : 'xanh';
  results[item.slug] = { status, findings: unique, files: fetched };
  console.log(`${status.padEnd(9)} ${item.slug}${unique.length ? ' — ' + unique.map((x) => x.msg).join('; ') : ''}`);
}

const out = { generatedAt: new Date().toISOString().slice(0, 10), results };
await writeFile(new URL('../src/data/scan.json', import.meta.url), JSON.stringify(out, null, 2) + '\n');
console.log(`\nĐã ghi src/data/scan.json (${Object.keys(results).length} mục).`);
