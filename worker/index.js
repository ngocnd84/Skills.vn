// Cổng vào Cloudflare Worker: /api/* chạy code, mọi đường dẫn khác trả trang tĩnh trong dist/.
import * as orders from '../functions/api/orders/index.js';
import * as orderByCode from '../functions/api/orders/[code].js';
import * as sepay from '../functions/api/sepay.js';
import * as leads from '../functions/api/leads.js';

const routes = [
  { pattern: /^\/api\/orders\/?$/, mod: orders },
  { pattern: /^\/api\/orders\/([^/]+)\/?$/, mod: orderByCode, param: 'code' },
  { pattern: /^\/api\/sepay\/?$/, mod: sepay },
  { pattern: /^\/api\/leads\/?$/, mod: leads },
];

const METHOD = { GET: 'onRequestGet', POST: 'onRequestPost' };

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(request);

    for (const r of routes) {
      const m = url.pathname.match(r.pattern);
      if (!m) continue;
      const handler = r.mod[METHOD[request.method]] || r.mod.onRequest;
      if (!handler) return new Response('Method Not Allowed', { status: 405 });
      const params = r.param ? { [r.param]: decodeURIComponent(m[1]) } : {};
      try {
        return await handler({ request, env, params, waitUntil: (p) => ctx.waitUntil(p) });
      } catch (err) {
        console.error(err);
        return Response.json({ error: 'Lỗi máy chủ, vui lòng thử lại.' }, { status: 500 });
      }
    }
    return Response.json({ error: 'Không tìm thấy.' }, { status: 404 });
  },
};
