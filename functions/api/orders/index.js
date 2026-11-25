import { sellable, json, clean, newOrderCode, notifyTelegram, vnd } from '../../../lib/server.js';

export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ error: 'Hệ thống thanh toán chưa được cấu hình.' }, 503);
  if (!env.BANK_ACCOUNT || !env.BANK_CODE) return json({ error: 'Chưa cấu hình tài khoản nhận tiền.' }, 503);

  let body;
  try { body = await request.json(); } catch { return json({ error: 'Dữ liệu gửi lên không hợp lệ.' }, 400); }

  const product = sellable().get(clean(body.productId, 60));
  if (!product) return json({ error: 'Sản phẩm không tồn tại hoặc chưa mở bán.' }, 400);

  const name = clean(body.name, 80);
  const email = clean(body.email, 120).toLowerCase();
  const phone = clean(body.phone, 20);
  if (!name || !/^\S+@\S+\.\S+$/.test(email) || phone.replace(/\D/g, '').length < 9) {
    return json({ error: 'Kiểm tra lại họ tên, email và số điện thoại.' }, 400);
  }

  const recent = await env.DB.prepare("SELECT COUNT(*) AS n FROM orders WHERE email = ? AND status = 'pending' AND created_at > datetime('now', '-1 hour')").bind(email).first();
  if (recent && recent.n >= 5) return json({ error: 'Bạn đã tạo nhiều đơn chưa thanh toán. Hãy dùng đơn cũ hoặc thử lại sau 1 giờ.' }, 429);

  let code;
  for (let i = 0; i < 5; i++) {
    code = newOrderCode();
    try {
      await env.DB.prepare('INSERT INTO orders (code, product_id, product_name, amount, name, email, phone) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .bind(code, product.id, product.name, product.price, name, email, phone).run();
      break;
    } catch (e) {
      if (i === 4) return json({ error: 'Không tạo được đơn. Thử lại sau ít phút.' }, 500);
    }
  }

  await notifyTelegram(env, `🧾 Đơn mới ${code}\n${product.name} — ${vnd(product.price)}\n${name} | ${phone} | ${email}\nĐang chờ chuyển khoản.`);
  return json({ code });
}
