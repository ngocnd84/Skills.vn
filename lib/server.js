// Mã dùng chung cho Cloudflare Pages Functions (thư mục /functions).
import products from '../src/data/products.json';

export const ORDER_PREFIX = 'SKV';

export function sellable() {
  const map = new Map();
  for (const p of products.plans) if (p.buy) map.set(p.id, { id: p.id, name: p.name, price: p.price });
  for (const p of products.packs) if (p.status === 'dang-ban') map.set(p.id, { id: p.id, name: `Bộ ${p.name}`, price: p.price });
  return map;
}

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

export function clean(v, max = 200) {
  return String(v ?? '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max);
}

export function newOrderCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return ORDER_PREFIX + [...bytes].map((b) => alphabet[b % alphabet.length]).join('');
}

export function maskEmail(email) {
  const [u, d] = String(email).split('@');
  if (!d) return '';
  return `${u.slice(0, 2)}${'*'.repeat(Math.max(1, u.length - 2))}@${d}`;
}

export function bankInfo(env) {
  return {
    name: env.BANK_NAME || env.BANK_CODE || '',
    code: env.BANK_CODE || '',
    account: env.BANK_ACCOUNT || '',
    owner: env.BANK_OWNER || '',
  };
}

export function qrUrl(env, amount, code) {
  const p = new URLSearchParams({ acc: env.BANK_ACCOUNT || '', bank: env.BANK_CODE || '', amount: String(amount), des: code });
  return `https://qr.sepay.vn/img?${p}`;
}

export async function notifyTelegram(env, text) {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) return;
  try {
    await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text, disable_web_page_preview: true }),
    });
  } catch {
    // Không để lỗi Telegram làm hỏng luồng thanh toán.
  }
}

export function vnd(n) {
  return new Intl.NumberFormat('vi-VN').format(n) + 'đ';
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

// Xác thực webhook SePay. Hỗ trợ 2 kiểu cấu hình trên my.sepay.vn:
//  - HMAC-SHA256: header X-SePay-Signature = "sha256=" + hex(HMAC(secret, timestamp + "." + body)), header X-SePay-Timestamp
//  - API Key: header Authorization = "Apikey <khoá>"
export async function verifySepay(request, env, rawBody) {
  if (env.SEPAY_WEBHOOK_SECRET) {
    const sig = request.headers.get('x-sepay-signature') || '';
    const ts = request.headers.get('x-sepay-timestamp') || '';
    const age = Math.abs(Date.now() / 1000 - Number(ts));
    if (!ts || !Number.isFinite(age) || age > 600) return false;
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(env.SEPAY_WEBHOOK_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${ts}.${rawBody}`));
    const hex = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, '0')).join('');
    return timingSafeEqual(sig, `sha256=${hex}`);
  }
  if (env.SEPAY_API_KEY) {
    const auth = request.headers.get('authorization') || '';
    return timingSafeEqual(auth, `Apikey ${env.SEPAY_API_KEY}`);
  }
  return false;
}
