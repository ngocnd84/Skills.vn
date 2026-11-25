# skills.vn

Thư viện skill AI và workflow n8n cho người Việt: mô tả tiếng Việt, lệnh cài sẵn, quét an toàn hằng tuần. Có gói Pro bán bằng chuyển khoản (SePay tự xác nhận) và form đặt dịch vụ cài đặt.

- **Giao diện:** Astro, xuất ra trang tĩnh (nhanh, SEO tốt, không cần server).
- **Phần động:** Cloudflare Pages Functions trong thư mục `functions/` (tạo đơn, nhận webhook SePay, nhận form liên hệ).
- **Dữ liệu đơn hàng:** Cloudflare D1 (SQLite), cấu trúc trong `schema.sql`.
- **Báo đơn mới / tiền về:** Telegram bot.

Mỗi lần đẩy code lên nhánh `main`, Cloudflare tự build và cập nhật web trong khoảng 1 phút.

---

## Triển khai lên Cloudflare (làm một lần)

### 1. Đưa tên miền về Cloudflare
1. Cloudflare → **Add a domain** → nhập `skills.vn` → chọn gói Free.
2. Cloudflare đưa 2 nameserver. Vào nơi mua tên miền (nhà đăng ký `.vn`), thay nameserver cũ bằng 2 nameserver này.
3. Chờ Cloudflare báo **Active** (vài phút tới vài giờ).

### 2. Tạo project Pages nối với GitHub
1. Cloudflare → **Workers & Pages** → **Create** → tab **Pages** → **Connect to Git**.
2. Chọn repo `ngocnd84/skills.vn`, nhánh `main`.
3. Cấu hình build:
   - Framework preset: **Astro**
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Biến môi trường: `NODE_VERSION` = `22`
4. Bấm **Save and Deploy**. Xong bước này web đã chạy ở địa chỉ `*.pages.dev` (phần thư viện dùng được ngay; phần thanh toán cần bước 3–5).

### 3. Tạo cơ sở dữ liệu D1
1. Cloudflare → **Storage & Databases** → **D1** → **Create** → tên `skillsvn`.
2. Mở database vừa tạo → tab **Console** → dán toàn bộ nội dung file `schema.sql` → **Execute**.
3. Quay lại project Pages → **Settings** → **Bindings** → **Add** → **D1 database**: Variable name `DB`, chọn `skillsvn`.

### 4. Khai báo biến bí mật
Project Pages → **Settings** → **Variables and Secrets** → thêm (chọn kiểu **Secret** cho các khoá):

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
Project Pages → **Custom domains** → thêm `skills.vn` và `www.skills.vn`. Cloudflare tự tạo bản ghi DNS và chứng chỉ HTTPS.

---

## Việc hằng ngày

**Thêm hoặc sửa skill trong thư viện:** sửa `src/data/library.json` (mỗi mục một khối). Trường `skillMd` là đường dẫn file SKILL.md trong repo để máy quét đọc.

**Đổi giá, thêm bộ Pro:** sửa `src/data/products.json`. Đổi `status` từ `sap-ra` sang `dang-ban` là bộ đó mở bán.

**Thông tin công ty ở chân trang:** điền `taxCode`, `address`, `email`, `hotline`, `zalo` trong `src/data/site.json`.

**Quét an toàn:** GitHub Action chạy 8:17 sáng thứ Hai, tự cập nhật `src/data/scan.json` và Cloudflare tự build lại. Chạy tay: `npm run scan`.

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
npm run build && npx wrangler pages dev dist --d1 DB=skillsvn
```

## Cấu trúc

```
src/data/        library.json (thư viện), products.json (giá), scan.json (kết quả quét), site.json
src/pages/       trang chủ, thư viện, chi tiết skill, Pro, dịch vụ, thanh toán, hướng dẫn, điều khoản
functions/api/   orders (tạo/xem đơn), sepay (webhook), leads (form liên hệ)
lib/server.js    mã dùng chung cho functions
scripts/         scan-skills.mjs (quét an toàn)
schema.sql       bảng D1
```
