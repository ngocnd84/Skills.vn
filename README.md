# skills.vn

Thư viện 120 Claude Skill và prompt tiếng Việt cho 24 ngành nghề, 18 mẫu bot, 8 bot team và sách prompting 6 chương. Mỗi skill có trang riêng (tải SKILL.md, chép prompt). Có gói Pro bán bằng chuyển khoản (SePay tự xác nhận) và form đặt dịch vụ cài đặt.

- **Giao diện:** Astro, xuất ra trang tĩnh (nhanh, SEO tốt, không cần server).
- **Phần động:** Cloudflare Worker (`worker/index.js` chuyển `/api/*` tới các hàm trong thư mục `functions/`) (tạo đơn, nhận webhook SePay, nhận form liên hệ).
- **Dữ liệu đơn hàng:** Cloudflare D1 (SQLite), cấu trúc trong `schema.sql`.
- **Báo đơn mới / tiền về:** Telegram bot.

Mỗi lần đẩy code lên nhánh `main`, Cloudflare tự build và cập nhật web trong khoảng 1 phút.

---

## Triển khai lên Cloudflare (làm một lần)

### 1. Đưa tên miền về Cloudflare
1. Cloudflare → **Add a domain** → nhập `skills.vn` → chọn gói Free.
2. Cloudflare đưa 2 nameserver. Vào nơi mua tên miền (nhà đăng ký `.vn`), thay nameserver cũ bằng 2 nameserver này.
3. Chờ Cloudflare báo **Active** (vài phút tới vài giờ).

### 2. Tạo Worker nối với GitHub
1. Cloudflare → **Workers & Pages** → **Create** → **Import a repository** → chọn `ngocnd84/Skills.vn`.
2. Build command: `npm run build`. Deploy command: `npx wrangler deploy`. Root directory: `/`.
3. Mọi cấu hình còn lại (thư mục trang tĩnh, đường dẫn `/api/*`, cơ sở dữ liệu) đã nằm trong `wrangler.jsonc`, không cần bấm thêm.

Web chạy ở `skills-vn.ngocnd84.workers.dev` (bản xem trước, gắn `noindex`).

### 3. Cơ sở dữ liệu D1
Đã tạo sẵn D1 `skillsvn` (id `ecfd9441-65ec-42f5-b791-ca3c7e197924`), đã chạy `schema.sql`, đã gắn với tên `DB` trong `wrangler.jsonc`. Nếu cần tạo lại: `npx wrangler d1 create skillsvn`, sửa `database_id` trong `wrangler.jsonc`, rồi `npx wrangler d1 execute skillsvn --remote --file=schema.sql`.

### 4. Khai báo biến bí mật
Worker `skills-vn` → **Settings** → **Variables and Secrets** → thêm (chọn kiểu **Secret** cho các khoá):

| Biến | Ví dụ | Ghi chú |
| --- | --- | --- |
| `BANK_CODE` | `MBBank` | Mã ngân hàng theo danh sách của SePay (qr.sepay.vn/banks.json) |
| `BANK_NAME` | `MB Bank` | Tên hiển thị cho khách |
| `BANK_ACCOUNT` | `0123456789` | Số tài khoản đã liên kết SePay |
| `BANK_OWNER` | `CONG TY CP BENTIC VIET NAM` | Tên chủ tài khoản |
| `SEPAY_WEBHOOK_SECRET` | *(lấy ở bước 5)* | Dùng khi chọn xác thực HMAC-SHA256 (khuyên dùng) |
| `SEPAY_API_KEY` | *(tuỳ chọn)* | Chỉ dùng nếu webhook SePay chọn kiểu API Key |
| `TELEGRAM_BOT_TOKEN` | `123:ABC...` | Tạo bot qua @BotFather |
| `TELEGRAM_CHAT_ID` | `-100...` | ID nhóm/người nhận báo đơn |

Sau khi thêm biến hoặc binding, vào **Deployments** → **Retry deployment** để bản mới nhận cấu hình.

### 5. Nối SePay
1. Vào my.sepay.vn → **Webhooks** → **Thêm webhook**.
2. URL: `https://skills.vn/api/sepay`, chọn tài khoản ngân hàng nhận tiền, chỉ nhận **tiền vào**.
3. Kiểu xác thực **HMAC-SHA256** → chép Secret Key vào biến `SEPAY_WEBHOOK_SECRET`.
4. **Cấu trúc mã thanh toán**: tiền tố `SKV`, phần sau 6 ký tự chữ và số.
5. Bấm **Gửi thử** rồi chuyển thử 1 đơn thật giá nhỏ để kiểm tra từ đầu tới cuối.

### 6. Gắn tên miền
1. Tên miền skills.vn → **DNS** → **Records**: xoá mọi bản ghi A/AAAA của `skills.vn`, `www` và `*` (bản ghi cũ trỏ vào IP của chính Cloudflare sẽ gây lỗi 1000 "DNS points to prohibited IP").
2. Worker `skills-vn` → **Settings** → **Domains & Routes** → **Add** → **Custom domain**: thêm `skills.vn`, rồi thêm `www.skills.vn`. Cloudflare tự tạo bản ghi DNS và chứng chỉ HTTPS.

### 7. Cấu hình SEO (làm ngay sau khi web chạy trên skills.vn)

**Trên Cloudflare (tên miền skills.vn):**
1. **Rules → Redirect Rules** → chọn mẫu *Redirect from WWW to root* → lưu. Để Google chỉ thấy một địa chỉ `https://skills.vn`.
2. **SSL/TLS → Edge Certificates**: bật *Always Use HTTPS*.
3. **Caching → Configuration**: bật *Crawler Hints*. Cloudflare tự báo Bing/Yandex (IndexNow) mỗi khi trang thay đổi.
4. **Speed → Optimization**: bật *Early Hints* và *HTTP/3*. KHÔNG bật *Rocket Loader* (làm hỏng nút chép lệnh và ô tìm kiếm).
5. **Security → Bots**: tắt *Block AI bots*, để ChatGPT, Claude, Perplexity đọc được web và trích dẫn skills.vn khi người dùng hỏi về Claude Skill. *Bot Fight Mode* để bật cũng được (không chặn Googlebot).

**Google Search Console** (search.google.com/search-console):
1. Thêm thuộc tính kiểu **Domain**, nhập `skills.vn`. Chọn xác minh bằng Cloudflare (tự thêm bản ghi DNS TXT) hoặc chép bản ghi TXT vào Cloudflare DNS.
2. **Sitemaps** → gửi `sitemap-index.xml`.
3. **URL Inspection** → kiểm tra `https://skills.vn/` → *Request indexing*. Làm tương tự cho `/thu-vien`, `/huong-dan`, `/pro`.

**Bing Webmaster Tools** (bing.com/webmasters): chọn *Import from Google Search Console* là xong (ChatGPT tìm kiếm dựa nhiều vào chỉ mục của Bing).

**Đã làm sẵn trong code:**
- Mỗi trang có tiêu đề, mô tả, canonical riêng; tiêu đề chọn theo từ khoá có lượt tìm thật tại Việt Nam (11/2026): "claude skill" ~3.600/tháng, "agent skills" ~2.900, "n8n workflow" ~1.000, "claude code skill" ~880, "skill claude" ~720 và đang tăng.
- 9 trang nhóm tĩnh (`/thu-vien/tieng-viet`, `/thu-vien/tu-dong-hoa`…) để lên top các cụm "skill tiếng Việt", "workflow n8n mẫu".
- Dữ liệu cấu trúc JSON-LD: Organization, BreadcrumbList, ItemList, SoftwareSourceCode, Product + Offer (giá VND), FAQPage, Service.
- Sitemap có lastmod theo ngày build, robots.txt, ảnh chia sẻ Facebook/Zalo 1200×630 (`public/og.png`).
- `/llms.txt` tóm tắt toàn bộ site cho công cụ AI đọc.
- Bản xem trước `*.workers.dev` gắn `noindex` để không trùng nội dung với skills.vn.
- Font tự host (không gọi Google Fonts), trang tĩnh, CSS gọn: tốc độ tải tốt cho Core Web Vitals.

**Để lên top lâu dài:** mỗi tuần thêm 3–5 skill tiếng Việt vào thư viện và 1 bài hướng dẫn (ví dụ "Cách cài Claude Skill trên điện thoại", "10 workflow n8n cho shop online"). Nội dung mới đều đặn quan trọng hơn mọi thiết lập kỹ thuật.

---

## Việc hằng ngày

**Thêm hoặc sửa skill trong thư viện:** sửa trực tiếp `src/data/skills.json` (mỗi skill một khối: `slug`, `name`, `category`, `categorySlug`, `description`, `skillMd`, `prompt`...). Ngành ở `src/data/categories.json`, bot ở `bots.json`, team ở `teams.json`, sách ở `books.json`. Đẩy lên GitHub là Cloudflare tự build lại.

**Đổi giá, thêm bộ Pro:** sửa `src/data/products.json`. Đổi `status` từ `sap-ra` sang `dang-ban` là bộ đó mở bán.

**Thông tin công ty ở chân trang:** điền `taxCode`, `address`, `email`, `hotline`, `zalo` trong `src/data/site.json`.

**Khi có đơn đã thanh toán:** Telegram báo "ĐÃ THANH TOÁN" kèm tên, SĐT, email → gửi file skill cho khách. Xem toàn bộ đơn trong D1 Console:
```sql
SELECT code, product_name, amount, status, name, phone, email, created_at FROM orders ORDER BY created_at DESC LIMIT 50;
```

## Chạy trên máy

```bash
npm install
npm run dev                      # chỉ giao diện, http://localhost:4321
# Thử cả phần thanh toán:
cp .dev.vars.example .dev.vars   # điền giá trị
npm run preview   # = npm run build && wrangler dev, chạy cả trang tĩnh và /api
```

## Cấu trúc

```
src/data/        skills.json, categories.json, bots.json, teams.json, books.json, quiz.json (nội dung), products.json (giá), site.json
src/pages/       trang chủ, thư viện, chi tiết skill, Pro, dịch vụ, thanh toán, hướng dẫn, điều khoản
functions/api/   orders (tạo/xem đơn), sepay (webhook), leads (form liên hệ)
lib/server.js    mã dùng chung cho functions
scripts/         build-data.mjs + app-source.json: tạo lại src/data từ bản thiết kế gốc (App.tsx). Chỉ chạy khi muốn ghi đè toàn bộ dữ liệu.
schema.sql       bảng D1
```
