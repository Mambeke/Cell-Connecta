import { api } from "../server/api.js";
import {
  HttpError,
  session,
  requestOrigin,
  productEditingReady,
} from "../server/core.js";
import { products, settings } from "../server/data.js";
import {
  layout,
  home,
  shop,
  productPage,
  cartPage,
  loginPage,
  receiptPage,
  policyPage,
  adminPage,
  esc,
} from "../server/render.js";
const CSP =
  "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self' https://wa.me";
function headers(response, localPreview = false) {
  const h = new Headers(response.headers);
  h.set("X-Content-Type-Options", "nosniff");
  h.set("Referrer-Policy", "strict-origin-when-cross-origin");
  h.set("X-Frame-Options", "DENY");
  h.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=()",
  );
  h.set(
    "Content-Security-Policy",
    localPreview
      ? CSP.replace("frame-ancestors 'none'", "frame-ancestors *")
      : CSP,
  );
  if (localPreview) h.delete("X-Frame-Options");
  h.set("Strict-Transport-Security", "max-age=31536000");
  if ((h.get("Content-Type") || "").includes("text/html"))
    h.set("Cache-Control", "no-store");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: h,
  });
}
const html = (s, status = 200) =>
  new Response(s, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
export default {
  async fetch(request, env) {
    const u = new URL(request.url),
      p = u.pathname;
    const secure = (response) =>
      headers(response, env.CF_PAGES_BRANCH === "local");
    try {
      if (p === "/index.html")
        return Response.redirect(requestOrigin(request) + "/", 301);
      if (p.startsWith("/api/")) return secure(await api(request, env));
      if (!["GET", "HEAD"].includes(request.method))
        return secure(
          new Response("Method not allowed", {
            status: 405,
            headers: { Allow: "GET, HEAD" },
          }),
        );
      if (
        /^\/(cc-assets|fonts|assets)\//.test(p) ||
        ["/favicon.png", "/apple-touch-icon.png", "/og-cover.png"].includes(p)
      )
        return secure(await env.ASSETS.fetch(request));
      if (p === "/robots.txt")
        return new Response(
          "User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /login\nDisallow: /forgot\nDisallow: /api/\nDisallow: /cart\nDisallow: /checkout\nDisallow: /order/\nSitemap: https://cell-connecta.pages.dev/sitemap.xml\n",
          { headers: { "Content-Type": "text/plain" } },
        );
      if (p === "/sitemap.xml") {
        const all = await products(env);
        return new Response(
          `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${["/", "/shop", "/policies/delivery", "/policies/warranty", "/policies/returns", "/policies/privacy", "/policies/terms", ...all.map((x) => "/phone/" + x.id)].map((path) => `<url><loc>https://cell-connecta.pages.dev${esc(path)}</loc></url>`).join("")}</urlset>`,
          {
            headers: {
              "Content-Type": "application/xml",
              "Cache-Control": "public,max-age=300",
            },
          },
        );
      }
      const s = await settings(env),
        base = { business: s.business, path: p };
      let content,
        title,
        payload = {},
        page = "store",
        noindex = false,
        structured = null;
      if (p === "/") {
        content = home(await products(env), s);
        title = "iPhone, Samsung, laptops & accessories";
        page = "home";
      } else if (p === "/shop") {
        content = shop(await products(env), u);
        const names = {
          phones: "Phones",
          laptops: "Laptops",
          accessories: "Accessories",
          others: "Others",
        };
        const chosen = [...new Set(u.searchParams.getAll("category"))].filter(
          (c) => names[c],
        );
        title = chosen.length
          ? chosen.map((c) => names[c]).join(" & ")
          : "All products";
        page = "shop";
        noindex = [...u.searchParams].length > 0;
      } else if (/^\/phone\/[^/]+$/.test(p)) {
        const all = await products(env),
          product = all.find(
            (x) => x.id === decodeURIComponent(p.split("/").pop()),
          );
        if (!product)
          throw new HttpError(
            404,
            "This product is unavailable or has been archived.",
          );
        const rendered = productPage(
          product,
          all.filter(
            (x) => x.id !== product.id && x.category === product.category,
          ),
          s.business,
          u.searchParams.get("variant"),
        );
        content = rendered.content;
        structured = rendered.schema;
        title = product.model + " " + product.colour;
        page = "product";
        payload = { product };
        base.description = (product.description || product.model).slice(0, 155);
      } else if (/^\/product\/[^/]+$/.test(p))
        return Response.redirect(
          requestOrigin(request) + "/phone/" + p.split("/").pop(),
          301,
        );
      else if (p === "/cart" || p === "/checkout") {
        page = p.slice(1);
        content = cartPage(page === "checkout");
        title = page === "cart" ? "Your shopping bag" : "Request your order";
        noindex = true;
      } else if (p === "/login" || p === "/forgot") {
        const owner = await session(request, env);
        if (owner && p === "/login")
          return Response.redirect(requestOrigin(request) + "/admin", 302);
        page = p.slice(1);
        content = loginPage(
          page === "forgot",
          !!(env.RESEND_API_KEY && env.RESEND_FROM_EMAIL),
        );
        title = page === "login" ? "Owner sign in" : "Recover owner access";
        noindex = true;
      } else if (p === "/admin") {
        const owner = await session(request, env);
        if (!owner)
          return Response.redirect(requestOrigin(request) + "/login", 302);
        page = "admin";
        content =
          (productEditingReady(env)
            ? ""
            : '<div class="container"><p class="alert info" role="alert">Product editing is locked: legacy deployment URLs must be protected before new draft, publication, image or archive changes are allowed. Stock and order management remain available.</p></div>') +
          adminPage(owner);
        title = "Owner dashboard";
        payload = { csrfToken: owner.csrf_token };
        noindex = true;
      } else if (/^\/order\/[^/]+$/.test(p)) {
        content = receiptPage();
        title = "Your private order request";
        page = "receipt";
        payload = { orderId: p.split("/").pop() };
        noindex = true;
      } else if (p.startsWith("/policies/")) {
        const policy = policyPage(p.split("/").pop(), s);
        if (!policy) throw new HttpError(404, "Page not found.");
        content = policy.content;
        title = policy.title;
      } else
        throw new HttpError(404, "The page you requested could not be found.");
      const rendered = html(
        layout({ ...base, title, content, page, payload, noindex, structured }),
      );
      return secure(
        request.method === "HEAD"
          ? new Response(null, { headers: rendered.headers })
          : rendered,
      );
    } catch (e) {
      const status = e instanceof HttpError ? e.status : 500,
        message =
          e instanceof HttpError
            ? e.message
            : "Something went wrong. Please try again or contact Cell Connecta.";
      if (!(e instanceof HttpError))
        console.error("Store request failed", {
          path: p,
          message: String(e).slice(0, 300),
        });
      if (p.startsWith("/api/"))
        return secure(
          Response.json(
            { error: message },
            { status, headers: { "Cache-Control": "no-store" } },
          ),
        );
      return secure(
        html(
          layout({
            title: status === 404 ? "Page not found" : "Please try again",
            path: p,
            noindex: true,
            content: `<section class="container empty-state error-page"><p class="section-kicker">CELL CONNECTA · ${status}</p><h1>${status === 404 ? "Let’s find your next phone." : "We couldn’t complete that request."}</h1><p>${esc(message)}</p><a href="/shop" class="button button-primary">Browse the shop →</a><button class="button button-outline" id="retry-page">Try again</button></section>`,
          }),
          status,
        ),
      );
    }
  },
};
