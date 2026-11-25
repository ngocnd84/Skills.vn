// Webhook SePay gọi mỗi khi tài khoản nhận tiền. Cấu hình URL: https://skills.vn/api/sepay
import { json, verifySepay, notifyTelegram, vnd, ORDER_PREFIX } from '../../lib/server.js';

export async function onRequestPost({ request, env }) {
  const raw = await request.text();
  if (!(await verifySepay(request, env, raw))) return json({ success: false, error: 'unauthorized' }, 401);
  if (!env.DB) return json({ success: false, error: 'db' }, 500);

  let tx;
  try { tx = JSON.parse(raw); } catch { return json({ success: false, error: 'bad json' }, 400); }
  if (tx.transferType !== 'in') return json({ success: true, ignored: 'out' });

  const sepayId = Number(tx.id);
  const amount = Math.round(Number(tx.transferAmount) || 0);
  const text = `${tx.code || ''} ${tx.content || ''} ${tx.description || ''}`.toUpperCase().replace(/[^A-Z0-9 ]/g, ' ');
  const match = text.match(new RegExp(`${ORDER_PREFIX}\\s?([A-Z0-9]{6})`));
  const code = match ? ORDER_PREFIX + match[1] : null;

  // Ghi giao dịch trước; SePay gửi lại cùng id thì bỏ qua (idempotent).
  const ins = await env.DB.prepare('INSERT OR IGNORE INTO payments (sepay_id, order_code, amount, content, gateway, raw) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(sepayId, code, amount, String(tx.content || '').slice(0, 500), String(tx.gateway || ''), raw.slice(0, 4000)).run();
  if (!ins.meta?.changes) return json({ success: true, duplicate: true });

  if (!code) {
    await notifyTelegram(env, `💸 Nhận ${vnd(amount)} nhưng không có mã đơn SKV.\nNội dung: ${tx.content || ''}`);
    return json({ success: true, matched: false });
  }

  const order = await env.DB.prepare('SELECT code, product_name, amount, paid_amount, name, phone, email, status FROM orders WHERE code = ?').bind(code).first();
  if (!order) {
    await notifyTelegram(env, `💸 Nhận ${vnd(amount)} với mã ${code} nhưng không thấy đơn này.`);
    return json({ success: true, matched: false });
  }
  if (order.status === 'paid') return json({ success: true, already: true });

  // Cộng dồn nếu khách chuyển nhiều lần cho cùng một đơn.
  const total = (order.paid_amount || 0) + amount;
  if (total < order.amount) {
    await env.DB.prepare("UPDATE orders SET status = 'underpaid', paid_amount = ?, sepay_id = ? WHERE code = ?").bind(total, sepayId, code).run();
    await notifyTelegram(env, `⚠️ Đơn ${code} chuyển thiếu: đã nhận ${vnd(total)} / cần ${vnd(order.amount)}.\n${order.name} | ${order.phone}`);
    return json({ success: true, underpaid: true });
  }

  await env.DB.prepare("UPDATE orders SET status = 'paid', paid_amount = ?, sepay_id = ?, paid_at = datetime('now') WHERE code = ?").bind(total, sepayId, code).run();
  await notifyTelegram(env, `✅ ĐÃ THANH TOÁN ${code}\n${order.product_name} — ${vnd(total)}\n${order.name} | ${order.phone} | ${order.email}\n→ Gửi skill cho khách.`);
  return json({ success: true });
}
