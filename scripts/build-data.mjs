// Chuyển dữ liệu gốc (xuất từ App.tsx) thành dữ liệu sạch cho site.
// Bỏ mọi số liệu tự đặt (sao, lượt cài, lượt copy, upvote) và tên tác giả giả.
import fs from 'node:fs';

const raw = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const out = new URL('../src/data/', import.meta.url);

export const slugify = (s) => s.replace(/F&B/g, 'FnB').toLowerCase().replace(/đ/g, 'd').normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Mô tả riêng cho từng ngành: tiêu đề trang, đoạn mở đầu, và ngành cần lưu ý chuyên môn.
const META = {
  'Viết nội dung': ['Skill AI viết nội dung tiếng Việt', 'Caption bán hàng, bài SEO, PR báo chí, email chăm sóc khách: các skill giúp AI viết đúng giọng thương hiệu và đúng người đọc Việt.'],
  'Lập trình': ['Skill AI cho lập trình viên', 'Review code, viết test, tạo bot Telegram/Zalo, tối ưu prompt và viết SKILL.md cho Claude Code: quy trình lập trình có kiểm chứng thay vì code theo cảm hứng.'],
  'Marketing & Bán hàng': ['Skill AI cho marketing và bán hàng', 'Landing page chuyển đổi, email marketing, kế hoạch content 30 ngày, kịch bản telesales và mô hình mua chung cho đội bán hàng Việt.'],
  'Kinh doanh & Khởi nghiệp': ['Skill AI cho chủ doanh nghiệp và startup', 'Viết PRD bàn giao dev, slide gọi vốn, research đối thủ, Business Model Canvas và chiến lược giá: từ ý tưởng đến kế hoạch có số liệu.'],
  'Tài chính - Kế toán': ['Skill AI cho tài chính, kế toán', 'Kê khai thuế, đọc báo cáo tài chính, lập ngân sách, dòng tiền và unit economics cho hộ kinh doanh và doanh nghiệp nhỏ.'],
  'Pháp lý - Luật': ['Skill AI soạn hợp đồng và văn bản pháp lý', 'Hợp đồng thuê nhà, hợp đồng lao động, rà soát điều khoản và thủ tục thành lập công ty theo bối cảnh Việt Nam.'],
  'Y tế - Dược': ['Skill AI về sức khỏe, y tế', 'Hướng dẫn hỏi triệu chứng, dùng thuốc an toàn, chế độ ăn cho người tiểu đường, sơ cứu và theo dõi sức khỏe người cao tuổi.'],
  'Giáo dục - Đào tạo': ['Skill AI cho giáo viên và người học', 'Giáo án STEM, gia sư Toán và Tiếng Anh, tạo đề thi trắc nghiệm, dịch chuyên ngành và tóm tắt tài liệu dài.'],
  'Bất động sản': ['Skill AI cho môi giới bất động sản', 'Đăng tin chốt deal, định giá theo 3 phương pháp, kịch bản dẫn khách, tư vấn mua nhà lần đầu và quản lý nhà cho thuê.'],
  'Du lịch - Khách sạn': ['Skill AI cho du lịch, khách sạn', 'Lịch trình tour 3N2Đ, tư vấn tour theo ngân sách, mô tả phòng khách sạn, kịch bản hướng dẫn viên và trả lời đánh giá.'],
  'F&B - Nhà hàng - Cafe': ['Skill AI cho nhà hàng, quán cafe', 'Tính food cost, lên menu theo mùa, viết mô tả món bán chạy, quản lý kho nguyên liệu và kịch bản phục vụ khách.'],
  'Thời trang - Làm đẹp': ['Skill AI cho thời trang, làm đẹp', 'Phối đồ theo dáng, mô tả sản phẩm thời trang, tư vấn skincare theo loại da, lên bộ sưu tập và review mỹ phẩm trung thực.'],
  'Thương mại điện tử': ['Skill AI bán hàng trên Shopee, TikTok Shop', 'Tối ưu gian hàng Shopee và TikTok Shop, chiến lược flash sale, trả lời đánh giá 1 sao và phân tích đối thủ trên sàn.'],
  'Logistics - Vận tải': ['Skill AI cho logistics, vận tải', 'Tính cước vận chuyển, điều phối xe sân bay, tối ưu tuyến giao hàng, quản lý kho và xử lý đơn hoàn, thất lạc.'],
  'Nhân sự - Tuyển dụng': ['Skill AI cho nhân sự, tuyển dụng', 'Viết JD và câu hỏi phỏng vấn, onboarding 7-30-90 ngày, đánh giá KPI, thang lương và giữ chân nhân tài.'],
  'Nông nghiệp': ['Skill AI cho nông nghiệp', 'Trồng rau thủy canh, lịch chăm cây ăn trái, chẩn đoán bệnh cây, tính giá bán nông sản và kế hoạch mùa vụ.'],
  'Xây dựng - Nội thất': ['Skill AI cho xây dựng, nội thất', 'Dự toán xây nhà theo m2, thiết kế phòng nhỏ, kiểm tra tiến độ thi công, báo giá cải tạo và chọn vật liệu.'],
  'Sản xuất': ['Skill AI cho nhà máy, sản xuất', 'QC sản xuất, lập kế hoạch theo đơn hàng, quản lý tồn kho nguyên liệu, giảm phế phẩm bằng 5 Why và bảo trì máy.'],
  'Ô tô - Xe máy': ['Skill AI về ô tô, xe máy', 'Định giá xe cũ, tư vấn mua xe lần đầu, lịch bảo dưỡng theo km, checklist kiểm tra xe cũ và so sánh xe theo nhu cầu.'],
  'Bảo hiểm - Ngân hàng': ['Skill AI về bảo hiểm, ngân hàng', 'So sánh gói vay mua nhà, chọn thẻ tín dụng, giải thích hợp đồng bảo hiểm và lập kế hoạch tiết kiệm, hưu trí.'],
  'Game - Giải trí': ['Skill AI cho game, giải trí', 'Kịch bản game, cốt truyện nhân vật, thiết kế nhiệm vụ và cân bằng, script review game và tổ chức giải đấu mini.'],
  'Hành chính - Công vụ': ['Skill AI soạn văn bản hành chính', 'Công văn đúng thể thức, báo cáo tháng, tờ trình đề xuất, trả lời văn bản và quản lý hồ sơ lưu trữ.'],
  'Video & Sáng tạo': ['Skill AI viết kịch bản video, TikTok', 'Kịch bản TikTok/Reels, script YouTube, prompt ảnh Midjourney, kịch bản podcast và storyboard quảng cáo.'],
  'Dữ liệu & Phân tích': ['Skill AI phân tích dữ liệu, Excel', 'Phân tích Excel, dashboard báo cáo, làm sạch dữ liệu, phân tích hành vi khách hàng và dự báo doanh số.'],
};
const SENSITIVE = {
  'Y tế - Dược': 'Nội dung chỉ để tham khảo, không thay thế chẩn đoán hay đơn thuốc của bác sĩ. Trường hợp khẩn cấp, gọi 115.',
  'Pháp lý - Luật': 'Văn bản AI soạn chỉ là bản nháp tham khảo. Hãy nhờ luật sư rà soát trước khi ký.',
  'Tài chính - Kế toán': 'Kết quả chỉ để tham khảo, không phải tư vấn đầu tư hay tư vấn thuế chính thức. Đối chiếu với kế toán hoặc cơ quan thuế trước khi nộp.',
  'Bảo hiểm - Ngân hàng': 'Kết quả chỉ để tham khảo. Đọc kỹ điều khoản gốc và hỏi ngân hàng hoặc công ty bảo hiểm trước khi ký.',
};

const EMOJI = {
  'Viết nội dung': '✍️', 'Lập trình': '🧑‍💻', 'Marketing & Bán hàng': '📣', 'Kinh doanh & Khởi nghiệp': '🚀',
  'Tài chính - Kế toán': '🧾', 'Pháp lý - Luật': '⚖️', 'Y tế - Dược': '🩺', 'Giáo dục - Đào tạo': '📚',
  'Bất động sản': '🏠', 'Du lịch - Khách sạn': '🗺️', 'F&B - Nhà hàng - Cafe': '🍜', 'Thời trang - Làm đẹp': '👗',
  'Thương mại điện tử': '🛒', 'Logistics - Vận tải': '🚚', 'Nhân sự - Tuyển dụng': '👥', 'Nông nghiệp': '🌾',
  'Xây dựng - Nội thất': '🏗️', 'Sản xuất': '🏭', 'Ô tô - Xe máy': '🚗', 'Bảo hiểm - Ngân hàng': '🏦',
  'Game - Giải trí': '🎮', 'Hành chính - Công vụ': '📄', 'Video & Sáng tạo': '🎬', 'Dữ liệu & Phân tích': '📊',
};
const categories = raw.categories.map((name) => ({
  name, slug: slugify(name), emoji: EMOJI[name], title: META[name][0], intro: META[name][1], note: SENSITIVE[name] || '',
}));

// Bản gốc viết thường cả tên skill trong câu ("đăng tin bđs"). Giữ nguyên viết tắt và tên riêng.
const KEEP = /^(Facebook|Shopee|TikTok|Zalo|Telegram|Claude|Code|Excel|YouTube|Midjourney|Canvas|Reels|STEM|AI|Shop)$/;
const smartLower = (name) => name.split(' ').map((w, i) => {
  const caps = [...w].filter((ch) => ch !== ch.toLowerCase()).length;
  return caps >= 2 || KEEP.test(w) ? w : w.toLowerCase();
}).join(' ');
const fixCase = (text, name) => text.split(name.toLowerCase()).join(smartLower(name));
const catSlug = Object.fromEntries(categories.map((c) => [c.name, c.slug]));
const nameToSlug = Object.fromEntries(raw.skills.map((s) => [s.name, slugify(s.name)]));

const skills = raw.skills.map((s, i) => ({
  slug: nameToSlug[s.name],
  name: s.name,
  emoji: s.emoji,
  category: s.category,
  categorySlug: catSlug[s.category],
  subcategory: s.subcategory,
  description: s.description,
  longDescription: s.longDescription,
  tags: s.tags,
  skillMd: s.skillMd.replace(/^name: .*$/m, `name: ${nameToSlug[s.name]}`),
  examplePrompt: s.examplePrompt,
  prompt: fixCase(raw.prompts[i].content, s.name),
  whenToUse: s.whenToUse.map((w) => fixCase(w, s.name)),
  inputs: s.inputs,
  outputs: s.outputs,
  related: s.relatedSkills.map((n) => nameToSlug[n]).filter(Boolean),
  examples: s.examples,
}));

const botSlug = (n) => slugify(n.replace(/^Bot /, ''));
const bots = raw.bots.map((b) => ({
  slug: botSlug(b.name), name: b.name, emoji: b.emoji, desc: b.desc, category: b.category,
  categorySlug: catSlug[b.category] || '', cmd: b.cmd, platform: b.platform,
  together: b.together.map(botSlug),
}));
const teams = raw.teams.map((t) => ({
  slug: slugify(t.name), name: t.name, emoji: t.emoji, desc: t.desc, category: t.category,
  categorySlug: catSlug[t.category] || '', members: t.members.map(botSlug),
}));
const books = raw.books.map((b, i) => ({
  slug: slugify(b.title.replace(/^\d+\.\s*/, '')), number: i + 1,
  title: b.title.replace(/^\d+\.\s*/, ''), desc: b.desc, paras: b.paras,
}));
const quiz = raw.kidQuestions;

const write = (name, data) => fs.writeFileSync(new URL(name, out), JSON.stringify(data, null, 2) + '\n');
write('categories.json', categories);
write('skills.json', skills);
write('bots.json', bots);
write('teams.json', teams);
write('books.json', books);
write('quiz.json', quiz);
console.log({ categories: categories.length, skills: skills.length, bots: bots.length, teams: teams.length, books: books.length });
