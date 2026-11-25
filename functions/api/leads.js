import { json, clean, notifyTelegram } from '../../lib/server.js';

export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ error: 'Hệ thống chưa được cấu hình.' }, 503);
  let b;
  try { b = await request.json(); } catch { return json({ error: 'Dữ liệu gửi lên không hợp lệ.' }, 400); }

  const lead = {
    type: clean(b.type, 40),
    name: clean(b.name, 80),
    phone: clean(b.phone, 20),
    email: clean(b.email, 120).toLowerCase(),
    company: clean(b.company, 120),
    need: clean(b.need, 1500),
  };
  if (!lead.name || (lead.phone.replace(/\D/g, '').length < 9 && !/^\S+@\S+\.\S+$/.test(lead.email))) {
    return json({ error: 'Cần họ tên và số điện thoại hoặc email.' }, 400);
  }

  await env.DB.prepare('INSERT INTO leads (type, name, phone, email, company, need) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(lead.type, lead.name, lead.phone, lead.email, lead.company, lead.need).run();
  await notifyTelegram(env, `📩 Khách mới (${lead.type || 'không rõ'})\n${lead.name} | ${lead.phone} | ${lead.email}\n${lead.company}\n${lead.need}`);
  return json({ ok: true });
}
