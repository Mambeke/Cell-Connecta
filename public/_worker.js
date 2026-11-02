// Compatibility backend: preserve this existing Cloudflare deployment.
// It owns the current D1-backed product, authentication and photo APIs.
// Do not delete it until these services have been migrated and tested.
const BACKEND_ORIGIN = 'https://1845bad0.cell-connecta.pages.dev';
const LOCAL_ROUTES = new Set(['/', '/index.html']);
const CSP = "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self' https://wa.me";
function secure(response, legacy = false) {
  const headers = new Headers(response.headers);
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  headers.set('Content-Security-Policy', legacy ? CSP.replace("style-src 'self'", "style-src 'self' 'unsafe-inline'") : CSP);
  if ((headers.get('Content-Type') || '').includes('text/html')) headers.set('Cache-Control', 'no-cache');
  return new Response(response.body, {status:response.status,statusText:response.statusText,headers});
}
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api' || url.pathname.startsWith('/api/')) {
      const upstream = new URL(url.pathname + url.search, BACKEND_ORIGIN);
      const headers = new Headers(request.headers);
      headers.delete('host');
      // Preserve same-origin validation at the retained backend.
      if (headers.get('origin') === url.origin) headers.set('origin', BACKEND_ORIGIN);
      const referer = headers.get('referer');
      if (referer && referer.startsWith(url.origin + '/')) headers.set('referer', BACKEND_ORIGIN + referer.slice(url.origin.length));
      const options = {method:request.method,headers,redirect:'manual'};
      if (request.method !== 'GET' && request.method !== 'HEAD') options.body = request.body;
      try {
        const response = await fetch(upstream, options);
        const out = new Headers(response.headers);
        const location = out.get('Location');
        if (location && location.startsWith(BACKEND_ORIGIN)) out.set('Location', url.origin + location.slice(BACKEND_ORIGIN.length));
        // Backend cookies without Domain remain first-party on the live shop.
        if (!url.pathname.startsWith('/api/photos/')) out.set('Cache-Control', 'no-store');
        out.set('X-Content-Type-Options', 'nosniff');
        return new Response(response.body,{status:response.status,statusText:response.statusText,headers:out});
      } catch {
        return Response.json({error:'Service temporarily unavailable. Please try again.'},{status:502,headers:{'Cache-Control':'no-store'}});
      }
    }
    if (request.method !== 'GET' && request.method !== 'HEAD') return new Response('Method not allowed',{status:405,headers:{Allow:'GET, HEAD'}});
    if (LOCAL_ROUTES.has(url.pathname)) {
      const file = new URL('/',url);
      return secure(await env.ASSETS.fetch(new Request(file, request)));
    }
    const legacy = /^\/(phone\/[^/]+|login|signup|forgot|admin)\/?$/.test(url.pathname);
    if (legacy) return secure(await env.ASSETS.fetch(new Request(new URL('/legacy',url),request)), true);
    if (url.pathname==='/legacy.html') return new Response(null,{status:302,headers:{Location:'/'}});
    const asset = await env.ASSETS.fetch(request);
    return secure(asset);
  }
};
