import { json, bankInfo, qrUrl, maskEmail } from '../../../lib/server.js';

export async function onRequestGet({ params, env }) {
  if (!env.DB) return json({ error: 'Chưa cấu hình.' }, 503);
  const code = String(params.code || '').toUpperCase();
  if (!/^SKV[A-Z0-9]{6}$/.test(code)) return json({ error: 'Mã đơn không hợp lệ.' }, 400);

  const o = await env.DB.prepare("SELECT code, product_name, amount, email, status, paid_amount, created_at, (created_at < datetime('now', '-2 days')) AS expired FROM orders WHERE code = ?").bind(code).first();
  if (!o || (o.status !== 'paid' && o.expired)) return json({ error: 'Không tìm thấy đơn.' }, 404);

  return json({
    code: o.code,
    productName: o.product_name,
    amount: o.amount,
    status: o.status,
    paidAmount: o.paid_amount,
    emailMasked: maskEmail(o.email),
    bank: bankInfo(env),
    qrUrl: qrUrl(env, o.amount, o.code),
  });
}
