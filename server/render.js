import { conditionName, first, stock, filterProducts } from "./data.js";
export const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export const money = (n) =>
  "R" +
  Number(n)
    .toLocaleString("en-US", {
      minimumFractionDigits: Number.isInteger(Number(n)) ? 0 : 2,
      maximumFractionDigits: 2,
    })
    .replace(/[\u00a0\u202f\s]/g, ",");
const data = (x) =>
  JSON.stringify(x)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
export const svg = (id) =>
  `<svg class="icon" aria-hidden="true"><use href="#${id}"/></svg>`;
const sprite = `<svg class="icon-library" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><symbol id="filter" viewBox="0 0 24 24"><path d="M3 6h5m4 0h9M3 12h11m4 0h3M3 18h2m4 0h12"/><circle cx="10" cy="6" r="2"/><circle cx="16" cy="12" r="2"/><circle cx="7" cy="18" r="2"/></symbol><symbol id="device-phone" viewBox="0 0 24 24"><rect x="6" y="2" width="12" height="20" rx="3"/><path d="M10 5h4m-3 14h2"/></symbol><symbol id="device-laptop" viewBox="0 0 24 24"><rect x="4" y="3" width="16" height="13" rx="2"/><path d="m4 16-2 5h20l-2-5M9 18h6"/></symbol><symbol id="device-others" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></symbol><symbol id="device-accessories" viewBox="0 0 24 24"><path d="M4 14v-3a8 8 0 0 1 16 0v3"/><rect x="2" y="11" width="5" height="10" rx="2"/><rect x="17" y="11" width="5" height="10" rx="2"/></symbol><symbol id="pin" viewBox="0 0 24 24"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></symbol><symbol id="truck" viewBox="0 0 24 24"><path d="M2 5h12v12H2zM14 9h4l4 5v3h-8"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="18" r="2"/></symbol><symbol id="shield" viewBox="0 0 24 24"><path d="m12 2 9 4v6c0 5-5 8-9 10-4-2-9-5-9-10V6Z"/><path d="m7.5 11.5 3 3 6-6"/></symbol><symbol id="award" viewBox="0 0 24 24"><circle cx="12" cy="8" r="6"/><path d="m8 13-3 9 7-3 7 3-3-9"/></symbol><symbol id="refresh" viewBox="0 0 24 24"><path d="M21 3v6h-6M3 21v-6h6M20 9a8 8 0 0 0-14-5M4 15a8 8 0 0 0 14 5"/></symbol><symbol id="search" viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="7.5"/><path d="m16 16 6 6"/></symbol><symbol id="user" viewBox="0 0 24 24"><circle cx="12" cy="7" r="4"/><path d="M3 23v-3a9 9 0 0 1 18 0v3"/></symbol><symbol id="bag" viewBox="0 0 24 24"><path d="M4 7h16l-1 15H5Z"/><path d="M8 8V5a4 4 0 0 1 8 0v3"/></symbol><symbol id="heart" viewBox="0 0 24 24"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/></symbol><symbol id="arrow" viewBox="0 0 24 24"><path d="M4 12h16m-6-6 6 6-6 6"/></symbol><symbol id="close" viewBox="0 0 24 24"><path d="m5 5 14 14M5 19 19 5"/></symbol><symbol id="whatsapp" viewBox="0 0 32 32"><path d="M16 3A13 13 0 0 0 4.7 22.5L3 29l6.7-1.7A13 13 0 1 0 16 3Z"/><path d="M11 9c-2-1-3 2-2 5 2 5 6 8 10 8 3 0 4-3 2-4l-3-1-2 2c-3-1-5-3-6-6l2-1Z"/></symbol><symbol id="phone" viewBox="0 0 24 24"><path d="M5 4h4l2 5-3 2a12 12 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z"/></symbol><symbol id="share" viewBox="0 0 24 24"><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="m8 11 8-4M8 13l8 4"/></symbol><symbol id="trade-in" viewBox="0 0 24 24"><path d="M7 8h13l-3-3M17 16H4l3 3"/></symbol><symbol id="zap" viewBox="0 0 24 24"><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></symbol></svg>`;
export function layout({
  title,
  description = "Quality phones, transparent pricing and dependable service from Cell Connecta.",
  path = "/",
  content,
  page = "store",
  payload = {},
  business = {},
  noindex = false,
  structured = null,
}) {
  const wa = business.whatsapp || "27685302223";
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>${esc(title)} | Cell Connecta</title><meta name="description" content="${esc(description)}"><meta name="theme-color" content="#0b2246"><meta name="robots" content="${noindex ? "noindex,follow" : "index,follow"}"><link rel="canonical" href="https://cell-connecta.pages.dev${esc(path)}"><meta property="og:title" content="${esc(title)} | Cell Connecta"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="https://cell-connecta.pages.dev${esc(path)}"><meta property="og:image" content="https://cell-connecta.pages.dev/og-cover.png"><meta property="og:type" content="${page === "product" ? "product" : "website"}"><link rel="icon" href="/favicon.png"><link rel="apple-touch-icon" href="/apple-touch-icon.png"><link rel="preload" href="/fonts/plus-jakarta-sans.woff2" as="font" type="font/woff2" crossorigin><link rel="stylesheet" href="/fonts/fonts.css"><link rel="stylesheet" href="/cc-assets/home.css"><link rel="stylesheet" href="/cc-assets/store.css"><script type="module" src="/cc-assets/store.js"></script>${page === "admin" ? '<script type="module" src="/cc-assets/admin.js"></script>' : ""}${structured ? `<script type="application/ld+json">${data(structured)}</script>` : ""}</head><body data-page="${page}"><a class="skip-link" href="#main">Skip to content</a>${sprite}<div class="topbar"><div class="container topbar-inner"><div class="topbar-benefits"><span>${svg("pin")}${esc(business.location || "Cape Town, South Africa")}</span><i></i><span>${svg("truck")}Free Cape Town delivery</span><i></i><span>${svg("shield")}Warranty on eligible phones</span></div><div class="topbar-links"><a href="/policies/delivery">Delivery information</a><i></i><a href="https://wa.me/${wa}">Help &amp; support</a></div></div></div><header class="site-header"><div class="container header-inner"><a class="brand" href="/" aria-label="Cell Connecta home"><img src="/cc-assets/cell-connecta-logo.webp" width="298" height="60" alt="Cell Connecta — Phones. Trust. Connectivity."></a><nav class="desktop-nav" aria-label="Main navigation"><a class="nav-link ${path === "/" ? "active" : ""}" href="/">Home</a><a class="nav-link ${path === "/shop" ? "active" : ""}" href="/shop">Shop</a><a class="nav-link" href="/shop?category=phones&amp;brand=Apple">iPhone</a><a class="nav-link" href="/shop?category=phones&amp;brand=Samsung">Samsung</a><a class="nav-link" href="/shop?category=laptops">Laptops</a><a class="nav-link" href="/shop?category=accessories">Accessories</a><a class="nav-link" href="/shop?deals=1">Deals <span class="hot-label">Offers</span></a></nav><div class="header-actions"><a class="icon-button header-whatsapp" href="https://wa.me/${wa}" aria-label="Chat on WhatsApp">${svg("whatsapp")}</a><a class="icon-button cart-link" href="/cart" aria-label="Shopping bag">${svg("bag")}<span class="count-bubble cart-count">0</span></a><button class="icon-button menu-toggle" id="global-menu-toggle" aria-expanded="false" aria-controls="global-menu" aria-label="Open menu"><span></span><span></span><span></span></button></div></div><nav class="mobile-menu" id="global-menu" aria-label="Mobile navigation" hidden><a href="/">Home</a><a href="/shop">Shop →</a><a href="/shop?category=phones&amp;brand=Apple">iPhone →</a><a href="/shop?category=phones&amp;brand=Samsung">Samsung →</a><a href="/shop?category=laptops">Laptops →</a><a href="/shop?category=accessories">Accessories →</a><a href="/shop?deals=1">Deals →</a><a href="/cart">Shopping bag →</a><a href="https://wa.me/${wa}">Help &amp; support</a></nav></header><main id="main">${content}</main><footer class="site-footer"><div class="container premium-footer"><div><a href="/" class="footer-brand">Cell Connecta<span>PHONES. TRUST. CONNECTIVITY.</span></a><p>${esc(business.location || "Cape Town, South Africa")}</p><a href="tel:${esc(business.phone || "+27685302223")}">${esc(business.phone || "+27 68 530 2223")}</a></div><div><h2>Explore</h2><a href="/shop">Shop</a><a href="/shop?category=phones&amp;brand=Apple">iPhone</a><a href="/shop?category=phones&amp;brand=Samsung">Samsung</a><a href="/shop?category=laptops">Laptops</a><a href="/shop?category=accessories">Accessories</a><a href="/shop?deals=1">Current deals</a></div><div><h2>Customer care</h2><a href="/policies/delivery">Delivery</a><a href="/policies/warranty">Warranty</a><a href="/policies/returns">Returns &amp; refunds</a><a href="https://wa.me/${wa}">WhatsApp support</a></div><div><h2>Information</h2><a href="/policies/privacy">Privacy policy</a><a href="/policies/terms">Terms &amp; conditions</a><a href="/admin" class="owner-admin-link">Owner admin</a>${business.email ? `<a href="mailto:${esc(business.email)}">Email us</a>` : ""}</div><small>© ${new Date().getFullYear()} Cell Connecta. Prices in ZAR.</small></div></footer><div id="store-toast" class="toast" role="status" hidden></div><script type="application/json" id="page-data">${data({ ...payload, whatsapp: wa })}</script></body></html>`;
}
export function card(p) {
  const v = p.variants.find((v) => v.id === p.displayVariantId) || first(p);
  if (!v) return "";
  const href =
    "/phone/" +
    encodeURIComponent(p.id) +
    (p.displayVariantId ? "?variant=" + encodeURIComponent(v.id) : "");
  const available = v.inStock > 0,
    sale = v.wasPrice > v.price;
  return `<article class="product-card">${sale ? '<span class="sale-badge">On Sale</span>' : ""}<a class="product-photo" href="${esc(href)}" aria-label="View ${esc(p.model)}"><img class="main-photo" src="${esc(p.photoUrls[0] || "/favicon.png")}" alt="${esc(p.model + " " + p.colour)} — listing image" width="360" height="260" loading="lazy" decoding="async"></a><div class="product-info"><p class="condition-label">${esc(conditionName(p.condition))}</p><h3><a href="${esc(href)}">${esc(p.model)}</a></h3><p class="product-spec"><span>${esc(v.storage)}</span>${p.colour ? `<i></i><span>${esc(p.colour)}</span>` : ""}</p><div class="price-line"><strong class="price">${money(v.price)}</strong>${sale ? `<span class="was-price">${money(v.wasPrice)}</span>` : ""}</div><div class="product-bottom"><span class="stock-status ${available ? "" : "out-of-stock"}">${available ? "In stock" : "Out of stock"}</span><a class="buy-button" href="${esc(href)}">View ${p.category === "phones" ? "phone" : "product"} ${svg("arrow")}</a></div></div></article>`;
}
export const storeCategories = [
  {
    key: "iphone",
    label: "iPhone",
    link: "/shop?category=phones&brand=Apple",
    image: "hero-iphone-open.webp",
    heroImage: "hero-iphone-collection.webp",
    title: "Your next iPhone.",
    accent: "A smarter purchase.",
    body: "Explore our iPhone collection. Clear conditions, real listings and transparent prices.",
    button: "Shop iPhones",
  },
  {
    key: "samsung",
    label: "Samsung",
    link: "/shop?category=phones&brand=Samsung",
    image: "hero-samsung-open.webp",
    heroImage: "hero-samsung-collection.webp",
    title: "Discover your next",
    accent: "Samsung Galaxy.",
    body: "Explore the Galaxy range. Ask us about current availability or sourcing your next phone.",
    button: "Explore Samsung",
  },
  {
    key: "laptops",
    label: "Laptops",
    link: "/shop?category=laptops",
    image: "hero-laptop-open.webp",
    heroImage: "hero-laptop-collection.webp",
    title: "Find your next",
    accent: "Laptop.",
    body: "Work, study or create. Tell us the model you need and we’ll help you check availability.",
    button: "Shop Laptops",
    secondaryButton: "View Deals",
    secondaryLink: "/shop?category=laptops&deals=1",
  },
  {
    key: "accessories",
    label: "Accessories",
    link: "/shop?category=accessories",
    image: "hero-accessories-open.webp",
    heroImage: "hero-accessories-collection.webp",
    title: "Upgrade Your",
    accent: "Tech Experience",
    body: "Find accessories for your phone, laptop and everyday tech. Ask us about availability and compatibility.",
    button: "Shop Accessories",
    secondaryButton: "View All",
    secondaryLink: "/shop",
  },
];
export function home(all, s) {
  const featured = all.filter((p) => p.featured && stock(p) > 0).slice(0, 4);
  const heroMarkup = `<section class="premium-hero" aria-label="Featured categories"><div class="container hero-carousel" data-hero-carousel role="region" aria-roledescription="carousel" aria-label="Featured product categories"><div class="hero-slides">${storeCategories.map((c, i) => `<div class="hero-slide ${i === 0 ? "is-active" : ""}" data-hero-slide data-hero-key="${c.key}" role="group" aria-roledescription="slide" aria-label="${c.label}, ${i + 1} of 4" aria-hidden="${i !== 0}" ${i ? "inert" : ""}><div class="hero-category-copy"><p class="eyebrow">THE CELL CONNECTA COLLECTION · ${c.label.toUpperCase()}</p><${i === 0 ? "h1" : "h2"} class="hero-category-title">${c.title}<br><span>${c.accent}</span></${i === 0 ? "h1" : "h2"}><p class="hero-description">${c.body}</p><div class="hero-buttons"><a class="button button-primary" href="${esc(c.link)}">${c.button} ${svg("arrow")}</a><a class="button button-outline" href="${esc(c.secondaryLink || "/shop")}">${esc(c.secondaryButton || "Shop All Products")} ${svg("arrow")}</a></div><p class="hero-footnote">${svg("shield")} Cell Connecta <span aria-hidden="true">|</span> Real listings <span aria-hidden="true">|</span> Local support.</p></div><a class="hero-category-image" href="${esc(c.link)}" aria-label="Explore ${c.label}"><img src="/cc-assets/${c.heroImage || c.image}" alt="${c.key === "iphone" ? "iPhone collection on a stone platform" : c.key === "samsung" ? "Samsung Galaxy collection on neon-lit stone platforms" : c.key === "laptops" ? "Laptop collection on an illuminated showroom platform" : c.key === "accessories" ? "Tech accessories collection on neon-lit display platforms" : c.label}" width="960" height="720" ${i === 0 ? 'fetchpriority="high"' : ""} decoding="async"></a></div>`).join("")}</div><div class="hero-bottom"><div class="hero-controls" hidden><button type="button" class="hero-step" data-hero-prev aria-label="Previous category">‹</button><div class="hero-dots" role="group" aria-label="Choose a featured category">${storeCategories.map((c, i) => `<button type="button" data-hero-go="${i}" aria-label="Show ${c.label} slide" aria-pressed="${i === 0}"><span></span><span class="sr-only">${c.label}</span></button>`).join("")}</div><button type="button" class="hero-step" data-hero-next aria-label="Next category">›</button><button type="button" class="hero-pause" data-hero-pause aria-label="Pause slideshow" aria-pressed="false">Pause</button></div></div><p class="sr-only" data-hero-status aria-live="polite" aria-atomic="true"></p></div></section><section class="container category-section" aria-labelledby="shop-by-category-title"><div class="section-heading"><div><p class="section-kicker">FIND YOUR NEXT UPGRADE</p><h2 id="shop-by-category-title">Shop by category</h2><p class="category-intro">Your next favourite starts here. Explore a collection made for your everyday.</p></div><a class="category-view-all text-link" href="/shop">View all products ${svg("arrow")}</a></div><div class="collection-shortcuts" aria-label="Shop categories">${storeCategories.map((c, i) => `<a href="${esc(c.link)}" class="category" data-category-key="${c.key}" aria-label="Shop ${c.label}"><span class="category-visual"><img src="/cc-assets/${c.heroImage || c.image}" width="640" height="400" alt="" loading="lazy" decoding="async"></span><div class="category-details"><div class="category-copy"><span class="category-edition" aria-hidden="true">0${i + 1} / THE COLLECTION</span><h3>${c.label}</h3><span class="category-caption">${{ iphone: "Find your next iPhone", samsung: "Explore the Galaxy range", laptops: "Work. Study. Create.", accessories: "Complete your everyday" }[c.key]}</span></div><span class="category-arrow" aria-hidden="true">${svg("arrow")}</span></div></a>`).join("")}</div></section>`;
  return `${heroMarkup}<section class="container featured home-section"><div class="section-heading"><div><p class="section-kicker">CHOSEN FOR YOU</p><h2>Featured phones</h2></div><a class="text-link" href="/shop">View all phones ${svg("arrow")}</a></div>${featured.length ? `<div class="product-grid">${featured.map(card).join("")}</div>` : '<div class="empty-state"><h3>Explore our current collection</h3><a class="button button-primary" href="/shop">Shop all phones</a></div>'}</section>${s.promotion?.enabled ? `<section class="source-banner container"><div><p class="eyebrow">${esc(s.promotion.eyebrow)}</p><h2>${esc(s.promotion.title)}</h2><p>${esc(s.promotion.body)}</p></div><a class="button button-primary" href="${esc(s.promotion.href)}">${esc(s.promotion.label)} ${svg("arrow")}</a></section>` : ""}<section class="service-strip container home-section"><div>${svg("shield")}<span><b>Clear product conditions</b><small>New, refurbished or pre-owned—shown on each listing.</small></span></div><div>${svg("truck")}<span><b>Free Cape Town delivery</b><small>Other locations quoted before confirmation.</small></span></div><div>${svg("award")}<span><b>Warranty you can check</b><small>See each product’s applicable coverage.</small></span></div><div>${svg("whatsapp")}<span><b>People, not guesswork</b><small>Speak to us before placing your order.</small></span></div></section>`;
}
const option = (value, label, selected) =>
  `<option value="${esc(value)}"${value === selected ? " selected" : ""}>${esc(label)}</option>`;
function select(name, label, values, q) {
  return `<label>${label}<select name="${name}">${option("", "All " + label.toLowerCase(), q.get(name))}${values.map((v) => option(v, name === "condition" ? conditionName(v) : v, q.get(name))).join("")}</select></label>`;
}
export function shop(all, u) {
  const q = u.searchParams;
  const categories = [
    ["phones", "Phones"],
    ["laptops", "Laptops"],
    ["accessories", "Accessories"],
    ["others", "Others"],
  ];
  const chosen = categories.filter(([key]) =>
    q.getAll("category").includes(key),
  );
  const heading = chosen.length
    ? chosen.map(([, label]) => label).join(" & ")
    : "Shop";
  const result = filterProducts(all, q);
  const distinct = (rows, key) =>
    [...new Set(rows.map((p) => p[key]).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true }),
    );
  const categoryRows = all.filter(
    (p) => !chosen.length || chosen.some(([key]) => key === p.category),
  );
  const brands = [
    ...new Set([
      ...(chosen.length === 0 || chosen.some(([key]) => key === "phones")
        ? ["Apple", "Samsung"]
        : []),
      ...distinct(categoryRows, "brand"),
      ...(q.get("brand") ? [q.get("brand")] : []),
    ]),
  ].sort();
  const modelRows = categoryRows.filter(
    (p) => !q.get("brand") || p.brand === q.get("brand"),
  );
  const models = [
    ...new Set([
      ...distinct(modelRows, "model"),
      ...(q.get("model") ? [q.get("model")] : []),
    ]),
  ];
  const storageRows = modelRows.filter(
    (p) => !q.get("model") || p.model === q.get("model"),
  );
  const storages = [
    ...new Set([
      ...storageRows.flatMap((p) => p.variants.map((v) => v.storage)),
      ...(q.get("storage") ? [q.get("storage")] : []),
    ]),
  ].sort((a, b) => {
    const capacity = (s) =>
      Number.parseFloat(s) *
      (String(s).toUpperCase().includes("TB") ? 1024 : 1);
    return (
      capacity(a) - capacity(b) ||
      a.localeCompare(b, undefined, { numeric: true })
    );
  });
  const dropPages = (params) => {
    for (const k of [...params.keys()])
      if (k === "page" || k.startsWith("page_")) params.delete(k);
    return params;
  };
  const remove = (key, value) => {
    const params = dropPages(new URLSearchParams(q));
    const keep = params.getAll(key).filter((v) => v !== value);
    params.delete(key);
    for (const v of keep) params.append(key, v);
    if (["category", "brand"].includes(key)) {
      params.delete("model");
      params.delete("storage");
    }
    if (key === "model") params.delete("storage");
    return "/shop" + (params.size ? "?" + params : "");
  };
  const chips = [];
  for (const [key, label] of categories)
    if (q.getAll("category").includes(key))
      chips.push(["category", key, label]);
  for (const [key, label] of [
    ["brand", "Brand"],
    ["model", "Model"],
    ["storage", "Storage"],
    ["colour", "Colour"],
    ["condition", "Condition"],
    ["min", "Min price"],
    ["max", "Max price"],
    ["q", "Search"],
  ])
    if (q.get(key))
      chips.push([
        key,
        q.get(key),
        label +
          ": " +
          (key === "condition" ? conditionName(q.get(key)) : q.get(key)),
      ]);
  for (const [key, label] of [
    ["available", "In stock only"],
    ["deals", "Genuine deals"],
  ])
    if (q.get(key) === "1") chips.push([key, "1", label]);
  const field = (name, label, values, description = "") =>
    `<label class="shop-select-field" for="shop-${name}"><span>${label}</span><select id="shop-${name}" name="${name}" data-shop-filter>${option("", name === "storage" ? "Any storage" : "All " + label.toLowerCase() + "s", q.get(name))}${values.map((v) => option(v, name === "condition" ? conditionName(v) : name === "brand" && v === "Apple" ? "Apple / iPhone" : v, q.get(name))).join("")}</select>${description ? `<small>${description}</small>` : ""}</label>`;
  const empty = (label) =>
    `<div class="empty-state"><h3>No products match this selection.</h3><p>There are no matching listings available right now. Try different filters or ask us about the device or accessory you need.</p><a class="button button-primary" href="https://wa.me/27685302223?text=${encodeURIComponent("Hi Cell Connecta, please help me source " + (q.get("model") || q.get("q") || q.get("brand") || label || "a product") + ".")}">Ask on WhatsApp</a><a class="text-link" href="/shop">Clear filters →</a></div>`;
  const pagination = (r, key) =>
    r.pages > 1
      ? `<nav class="pagination" aria-label="${esc(key ? categories.find(([k]) => k === key)[1] + " pages" : "Catalogue pages")}">${Array.from(
          { length: r.pages },
          (_, i) => {
            const params = new URLSearchParams(q);
            params.set(chosen.length > 1 ? "page_" + key : "page", i + 1);
            return `<a href="/shop?${esc(params)}" ${r.page === i + 1 ? 'aria-current="page"' : ""}>${i + 1}</a>`;
          },
        ).join("")}</nav>`
      : "";
  const grouped = chosen.length > 1;
  const sections = grouped
    ? chosen.map(([key, label]) => {
        const params = new URLSearchParams(q);
        params.set("category", key);
        params.set("page", q.get("page_" + key) || "1");
        return { key, label, result: filterProducts(all, params) };
      })
    : [{ key: chosen[0]?.[0] || "all", label: heading, result }];
  const sourcing = `<section class="phone-sourcing" aria-labelledby="phone-sourcing-title"><div class="sourcing-icon">${svg("whatsapp")}</div><div class="sourcing-copy"><p class="section-kicker">LET US FIND YOUR NEXT PHONE</p><h2 id="phone-sourcing-title">Can’t find the phone you’re looking for?</h2><p>Tell us your preferred model, storage and budget. WhatsApp us and we’ll help source the right phone for you.</p></div><a class="button sourcing-button" href="https://wa.me/27685302223?text=${encodeURIComponent("Hi Cell Connecta, I can’t find the phone I’m looking for. Please help me source it. Model: " + (q.get("model") || "") + ". Storage: " + (q.get("storage") || "") + ". Budget: ")}">${svg("whatsapp")} Find my phone ${svg("arrow")}</a></section>`;
  const results = sections
    .map(
      ({ key, label, result: r }) =>
        `<section class="catalogue-group ${grouped ? "is-grouped" : ""}" data-category-group="${key}" aria-label="${esc(label)} products">${grouped ? `<div class="catalogue-group-title"><h2>${esc(label)}</h2><span>${r.count} ${r.count === 1 ? "product" : "products"}</span></div>` : ""}${r.items.length ? `<div class="product-grid">${r.items.map(card).join("")}</div>` : empty(label)}${pagination(r, grouped ? key : null)}${key === "phones" || key === "all" ? sourcing : ""}</section>`,
    )
    .join("");
  const facets = all.map((p) => ({
    category: p.category,
    brand: p.brand,
    model: p.model,
    storages: p.variants.map((v) => v.storage),
  }));
  return `<section class="container catalogue-section premium-catalogue compact-catalogue" aria-label="${esc(heading)}"><h1 class="sr-only">${esc(heading)}</h1><form action="/shop" method="get" class="catalogue-form shop-layout" id="shop-filters"><aside class="shop-sidebar" aria-label="Product filters"><details class="filter-details" open><summary>${svg("filter")}<span class="shop-filter-summary-copy"><strong>Filter products</strong><small>${chips.length ? chips.length + " active filters" : "Find your fit"}</small></span></summary><div class="filter-panel"><div class="sidebar-heading"><div><p class="section-kicker">${svg("filter")} MAKE IT YOURS</p><h2>Find your fit</h2><p class="sidebar-subtitle">Your next device, your way.</p></div><a href="/shop" class="text-link">Reset</a></div><fieldset class="shop-category-filter"><legend>Categories <small>Select one or more</small></legend>${categories.map(([key, label]) => `<label class="shop-category-choice"><input type="checkbox" name="category" value="${key}" data-shop-filter ${q.getAll("category").includes(key) ? "checked" : ""}><span class="shop-category-icon">${svg({ phones: "device-phone", laptops: "device-laptop", accessories: "device-accessories", others: "device-others" }[key])}</span><span>${label}</span><small>${all.filter((p) => p.category === key).length}</small></label>`).join("")}</fieldset><div class="shop-filter-group"><h3>Choose your device</h3>${field("brand", "Brand", brands)}${field("model", "Model", models, models.length ? "Models follow your category and brand." : "Models appear when matching listings are added.")}${field("storage", "Storage", storages, "Storage options follow your chosen model.")}</div><div class="shop-filter-group"><h3>Refine your choice</h3>${field("condition", "Condition", distinct(all, "condition"))}${field("colour", "Colour", distinct(all, "colour"))}<div class="shop-price-range"><label for="shop-min">Min price (R)<input id="shop-min" type="number" min="0" step="1" name="min" value="${esc(q.get("min") || "")}" placeholder="0"></label><label for="shop-max">Max price (R)<input id="shop-max" type="number" min="0" step="1" name="max" value="${esc(q.get("max") || "")}" placeholder="Any"></label></div><label class="checkbox-label"><input type="checkbox" name="available" value="1" data-shop-filter ${q.get("available") === "1" ? "checked" : ""}> In stock only</label><label class="checkbox-label"><input type="checkbox" name="deals" value="1" data-shop-filter ${q.get("deals") === "1" ? "checked" : ""}> Genuine deals</label></div><div class="filter-actions"><button type="submit" class="button button-primary small">Apply filters ${svg("arrow")}</button><small class="shop-filter-hint">Desktop selections update automatically. On mobile, choose your filters and tap Apply.</small></div></div></details></aside><div class="shop-results" id="catalogue-results"><div class="catalogue-search"><label for="shop-q" class="sr-only">Search products</label>${svg("search")}<input id="shop-q" name="q" type="search" value="${esc(q.get("q") || "")}" placeholder="Search model, brand, colour or storage"><button class="button button-primary small" type="submit">Search</button></div>${chips.length ? `<nav class="shop-active-filters" aria-label="Selected filters">${chips.map(([k, v, label]) => `<a href="${esc(remove(k, v))}" aria-label="Remove ${esc(label)}">${esc(label)} ${svg("close")}</a>`).join("")}<a class="shop-clear-filters" href="/shop">Clear all</a></nav>` : ""}<div class="catalogue-bar"><p><b>${result.count}</b> ${result.count === 1 ? "product" : "products"} found${grouped ? ` <span>across ${chosen.length} categories</span>` : ""}</p><label for="catalogue-sort">Sort by <select name="sort" id="catalogue-sort">${[
    ["featured", "Featured"],
    ["newest", "Newest arrivals"],
    ["price-low", "Price: low to high"],
    ["price-high", "Price: high to low"],
  ]
    .map(([v, l]) => option(v, l, q.get("sort") || "featured"))
    .join(
      "",
    )}</select></label></div>${results}</div></form><script type="application/json" id="shop-facets">${data(facets)}</script></section>`;
}
export function productPage(p, related, b, selectedVariantId = null) {
  const v = p.variants.find((v) => v.id === selectedVariantId) || first(p);
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.model,
    description: p.description,
    image: p.photoUrls.map((x) => "https://cell-connecta.pages.dev" + x),
    brand: { "@type": "Brand", name: p.brand },
    sku: p.sku,
    offers: p.variants.map((v) => ({
      "@type": "Offer",
      price: v.price,
      priceCurrency: "ZAR",
      availability:
        "https://schema.org/" + (v.inStock > 0 ? "InStock" : "OutOfStock"),
      itemCondition:
        "https://schema.org/" +
        ({
          new: "NewCondition",
          pre_owned: "UsedCondition",
          certified_refurbished: "RefurbishedCondition",
        }[p.condition] || "UsedCondition"),
      url: "https://cell-connecta.pages.dev/phone/" + p.id,
      sku: v.id,
    })),
  };
  const wa = b.whatsapp || "27685302223";
  const phone = b.phone || "+27685302223";
  const productUrl = "https://cell-connecta.pages.dev/phone/" + p.id;
  const conditionLabel = conditionName(p.condition);
  const conditionClass = p.condition;
  const discount = v.wasPrice > v.price ? Math.round((1 - v.price / v.wasPrice) * 100) : 0;

  const specRows = [
    ["Make", p.brand],
    ["Model", p.model],
    ["Condition", conditionLabel],
    ["Colour", p.colour],
    ...(p.grade ? [["Cosmetic Grade", p.grade]] : []),
    ...(p.battery != null ? [["Battery Health", p.battery + "%"]] : []),
    ["Warranty", p.warrantyMonths == null ? "Please enquire" : p.warrantyMonths + " months"],
    ["Returns", "3-day returns policy"],
    ["Delivery", "Free Cape Town delivery"],
    ...p.specifications.map((s) => [s.label, s.value]),
  ].filter((x) => x[1]);

  const waOrderText = encodeURIComponent(
    "Hi Cell Connecta, I'd like to order the " + p.model + " " + (p.colour || "") + ". " +
    "Please share available options, prices and delivery details."
  );
  const waTradeInText = encodeURIComponent(
    "Hi Cell Connecta, I'd like to trade in my old phone for the " + p.model + ". " +
    "Could you give me a trade-in quote?"
  );

  const content = `
<section class="container product-section">
  <p class="breadcrumbs"><a href="/">Home</a> / <a href="/shop">Shop</a> / ${esc(p.model)}</p>
  <div class="product-layout">
    <div class="gallery">
      <div class="gallery-main-wrap">
        <button class="gallery-nav gallery-prev" data-gallery-prev aria-label="Previous image">\u2039</button>
        <button class="gallery-main" id="zoom-image" aria-label="Enlarge product image">
          <img id="main-product-image" src="${esc(p.photoUrls[0] || "/favicon.png")}" alt="${esc(p.model + " " + p.colour)}" width="700" height="700" fetchpriority="high">
          <span class="gallery-counter" id="gallery-counter">1/${p.photoUrls.length}</span>
          <span class="gallery-zoom-hint">View larger ${svg("search")}</span>
        </button>
        <button class="gallery-nav gallery-next" data-gallery-next aria-label="Next image">\u203a</button>
      </div>
      <div class="gallery-thumbnails">
        ${p.photoUrls.map((src, i) => `<button data-gallery="${esc(src)}" data-index="${i}" aria-label="View photo ${i + 1}" aria-pressed="${i === 0}"><img src="${esc(src)}" alt="${esc(p.model)} photo ${i + 1}" width="80" height="80" loading="lazy"></button>`).join("")}
      </div>
    </div>
    <div class="product-purchase">
      <div class="condition-badges">
        <span class="condition-badge condition-${esc(conditionClass)}">${esc(conditionLabel)}</span>
        ${p.grade ? `<span class="grade-badge">${esc(p.grade)}</span>` : ""}
      </div>
      <h1>${esc(p.model)}</h1>
      <div class="product-variants-info">
        <label class="field-label" for="variant-select">Choose storage / variant</label>
        <select id="variant-select" class="variant-select">${p.variants.map((x) => option(x.id, x.storage + " \u2014 " + money(x.price) + (x.inStock ? "" : " \u00b7 Out of stock"), v.id)).join("")}</select>
        <p class="product-subtitle">${esc(p.colour)}${p.grade ? " \u00b7 " + esc(p.grade) + " cosmetic condition" : ""}</p>
      </div>
      ${p.battery != null ? `<p class="battery-health">${svg("zap")} Battery health: <strong>${p.battery}%</strong></p>` : ""}
      <div class="detail-price-line">
        <strong id="detail-price">${money(v.price)}</strong>
        <del id="detail-was" ${v.wasPrice > v.price ? "" : "hidden"}>${v.wasPrice > v.price ? money(v.wasPrice) : ""}</del>
        <span id="detail-discount" class="discount-badge" ${discount > 0 ? "" : "hidden"}>${discount > 0 ? `Save ${discount}%` : ""}</span>
      </div>
      <p id="detail-stock" class="availability ${v.inStock ? "" : "unavailable"}">${v.inStock > 0 ? v.inStock + " in stock" : "Out of stock"}</p>
      <div class="product-quantity">
        <label for="product-quantity">Quantity</label>
        <input id="product-quantity" type="number" min="1" max="${Math.max(1, v.inStock)}" value="1" inputmode="numeric">
      </div>
      <div class="action-buttons">
        <a class="button button-primary action-whatsapp" href="https://wa.me/${wa}?text=${waOrderText}">${svg("whatsapp")} Order on WhatsApp</a>
        <a class="button button-outline action-call" href="tel:${esc(phone)}">${svg("phone")} Call Now</a>
        <a class="button button-outline action-tradein" href="https://wa.me/${wa}?text=${waTradeInText}">${svg("trade-in")} Trade In</a>
      </div>
      <p class="inline-error" id="product-error" role="alert" hidden></p>
      <div class="purchase-buttons">
        <button class="button button-primary" id="add-to-cart" ${v.inStock ? "" : "disabled"}>${svg("bag")} Add to bag</button>
        <button class="button button-outline" id="buy-now" ${v.inStock ? "" : "disabled"}>Request this ${p.category === "phones" ? "phone" : "product"} ${svg("arrow")}</button>
      </div>
      <button class="share-product" id="share-product" data-url="${esc(productUrl)}">${svg("share")} Share this product</button>
      <p class="checkout-note">No online payment collected. Your bag becomes an order request; we confirm availability and payment arrangements with you.</p>
      <p class="sku">Product ID / SKU: ${esc(p.sku)}</p>
    </div>
  </div>
  <section class="full-specs-panel">
    <h2>FULL SPECIFICATION</h2>
    <dl class="specs-grid">
      ${specRows.map(([k, val]) => `<div><dt>${esc(k)}</dt><dd>${esc(val)}</dd></div>`).join("")}
    </dl>
  </section>
  <section class="customer-benefits">
    <div class="benefit-card">
      <div class="benefit-icon">${svg("award")}</div>
      <h3>No VAT</h3>
      <p>Prices shown include VAT \u2014 no hidden extras.</p>
    </div>
    <div class="benefit-card">
      <div class="benefit-icon">${svg("truck")}</div>
      <h3>Free Delivery</h3>
      <p>Free delivery across Cape Town.</p>
    </div>
    <div class="benefit-card">
      <div class="benefit-icon">${svg("shield")}</div>
      <h3>Warranty</h3>
      <p>Warranty on eligible products.</p>
    </div>
    <div class="benefit-card">
      <div class="benefit-icon">${svg("refresh")}</div>
      <h3>3-Day Returns</h3>
      <p>Hassle-free 3-day returns policy.</p>
    </div>
  </section>
  <section class="about-product">
    <h2>About this ${p.category === "phones" ? "phone" : "product"}</h2>
    <p>${esc(p.description || "Contact Cell Connecta for more details about this listing.")}</p>
  </section>
</section>
${related.length ? `<section class="container home-section"><div class="section-heading"><h2>You may also like</h2><a class="text-link" href="/shop">View all products \u2192</a></div><div class="product-grid">${related.slice(0, 4).map(card).join("")}</div></section>` : ""}
<dialog class="image-dialog" id="image-dialog"><button class="icon-button dialog-close" data-close-dialog aria-label="Close image">${svg("close")}</button><img id="zoomed-image" src="${esc(p.photoUrls[0] || "/favicon.png")}" alt="${esc(p.model)} enlarged"></dialog>
  `;
  return { content, schema };
}
export function cartPage(checkout = false) {
  return `<section class="container page-intro"><p class="breadcrumbs"><a href="/">Home</a> / <a href="/shop">Shop</a> / ${checkout ? "Order request" : "Shopping bag"}</p><p class="section-kicker">${checkout ? "ONE STEP CLOSER" : "YOUR NEXT PHONE STARTS HERE"}</p><h1>${checkout ? "Request your order." : "Your shopping bag."}</h1><p>${checkout ? "We’ll confirm availability, delivery and payment with you. No online payment is collected." : "Review your choices. Prices and stock are checked against our inventory."}</p></section><section class="container cart-layout"><div><div id="cart-error" class="alert error" role="alert" hidden></div><div id="cart-items" class="cart-items"><p class="loading-state">Checking prices and availability…</p></div>${checkout ? `<form id="checkout-form" class="panel checkout-form" hidden><h2>Your contact &amp; delivery details</h2><div class="form-grid"><label>Full name<input name="name" autocomplete="name" required maxlength="120"></label><label>Phone / WhatsApp<input name="phone" type="tel" autocomplete="tel" required maxlength="30"></label><label>Email (optional)<input name="email" type="email" autocomplete="email" maxlength="200"></label><label>Delivery option<select name="deliveryMethod"><option value="cape_town">Cape Town — free delivery</option><option value="quote">Other location — request a quote</option></select></label><label>City<input name="city" autocomplete="address-level2" value="Cape Town" required maxlength="100"></label><label class="full-width">Delivery address<textarea name="address" autocomplete="street-address" required maxlength="700" rows="3"></textarea></label><label class="full-width">Order notes (optional)<textarea name="notes" maxlength="1000" rows="2"></textarea></label></div><label class="checkbox-label checkout-ack"><input type="checkbox" name="acknowledged" required> <span>I agree to the <a href="/policies/terms">terms</a> and <a href="/policies/privacy">privacy policy</a>. This is an unpaid order request, not a stock reservation. Cell Connecta will confirm stock and any delivery quote before arranging payment.</span></label><p class="inline-error" id="checkout-error" role="alert" hidden></p><button type="submit" class="button button-primary" id="place-order">Submit order request ${svg("arrow")}</button></form>` : ""}</div><aside id="cart-summary" class="panel cart-summary" hidden><h2>Order summary</h2><div class="summary-line"><span>Products</span><b id="cart-subtotal"></b></div><div class="summary-line"><span>Delivery</span><span id="delivery-summary">Cape Town: free.<br>Elsewhere: quote required.</span></div><div class="summary-total"><span>Product total</span><strong id="cart-total"></strong></div><p>Prices in ZAR. No online payment collected. Stock is allocated only when the owner confirms your request.</p>${checkout ? '<a class="text-link" href="/cart">← Edit your bag</a>' : '<a class="button button-primary" id="proceed-checkout" href="/checkout">Request order →</a>'}<a class="text-link" href="/shop">Continue shopping →</a></aside></section>`;
}
export function loginPage(forgot = false, recoveryEnabled = false) {
  if (forgot && !recoveryEnabled)
    return `<section class="container auth-section"><div class="auth-intro"><p class="section-kicker">OWNER ACCESS</p><h1>Password recovery.</h1><p>Your existing owner account and password are preserved.</p></div><div class="panel"><h2>Email recovery setup is pending</h2><p class="muted">A verified recovery-email sender must be configured before this service can send codes. No reset email has been sent.</p><p class="muted">Use your current password, or ask your deployment administrator for a secure account reset. There is no public owner registration.</p><a class="button button-primary" href="/login">Back to sign in →</a></div></section>`;
  return `<section class="container auth-section"><div class="auth-intro"><p class="section-kicker">CELL CONNECTA · OWNER ACCESS</p><h1>${forgot ? "Recover your access." : "Welcome back."}</h1><p>${forgot ? "Use the existing verified-email recovery process." : "Sign in to manage your products, inventory and order requests."}</p>${svg("shield")}<small>Owner-only access. Every inventory change is checked on the server.</small></div><form id="${forgot ? "recovery-form" : "login-form"}" class="panel auth-form"><h2>${forgot ? "Reset your password" : "Owner sign in"}</h2><label>Email<input type="email" name="email" autocomplete="username" required maxlength="200"></label>${forgot ? `<label>Verification code<input name="code" autocomplete="one-time-code" maxlength="20" placeholder="Leave blank to request a code"></label><label>New password<input type="password" name="password" autocomplete="new-password" minlength="12" maxlength="512" placeholder="Required when submitting your code"></label><p class="muted">First request a code using just your email. Then enter the code and a new password.</p>` : `<label>Password<input type="password" name="password" autocomplete="current-password" required maxlength="512"></label>`}<p class="inline-error" id="auth-error" role="alert" hidden></p><p class="alert success" id="auth-success" hidden></p><button type="submit" class="button button-primary">${forgot ? "Continue" : "Sign in securely"} ${svg("arrow")}</button><a class="text-link" href="${forgot ? "/login" : "/forgot"}">${forgot ? "Back to sign in" : "Forgot your password?"}</a><a class="text-link muted" href="/shop">Back to the shop →</a></form></section>`;
}
export function receiptPage() {
  return `<section class="container receipt-section"><p class="section-kicker">CELL CONNECTA · YOUR ORDER REQUEST</p><div id="receipt-content" class="panel"><p>Loading your private order details…</p></div></section>`;
}
export function policyPage(key, s) {
  const b = s.business,
    policies = {
      delivery: { title: "Delivery information", text: b.delivery },
      warranty: { title: "Warranty information", text: b.warranty },
      returns: { title: "Returns & refunds", text: b.returns },
      privacy: {
        title: "Privacy policy",
        text: `Cell Connecta uses the contact and delivery details you submit to respond to enquiries, manage order requests and fulfil confirmed purchases. Product orders and owner accounts are stored in our Cloudflare-hosted systems. We do not collect card details on this website.\n\nYour bag is stored in your browser. The owner dashboard uses a secure session cookie for authentication. We do not add advertising trackers in this storefront. WhatsApp is an external service with its own privacy terms.\n\nOnly authorised store administrators can access order details. Contact us to request access, correction or deletion of your information, subject to legal record-keeping requirements. Please do not send payment credentials or sensitive identity documents through the enquiry form.`,
      },
      terms: {
        title: "Terms & conditions",
        text: `All prices are in South African rand (ZAR). Listings describe the condition and variants of each product. A previous price is shown only where recorded for that variant.\n\nSubmitting an order request does not take payment, reserve inventory or create a confirmed sale. Cell Connecta will review stock, delivery arrangements and payment instructions with you. Inventory is allocated when the owner confirms an order. Delivery outside Cape Town requires an agreed quote.\n\nPlease check your selected model, condition, storage, colour and contact details. Warranty coverage is stated on the individual listing. Our returns policy and your statutory consumer rights apply. Contact us if any listing information appears incorrect.\n\nOnline card payments are not enabled. Verify payment arrangements directly with Cell Connecta through the published contact number before paying.`,
      },
    };
  const item = policies[key];
  if (!item) return null;
  return {
    title: item.title,
    content: `<section class="container policy-section"><p class="breadcrumbs"><a href="/">Home</a> / Customer care</p><p class="section-kicker">CLEAR INFORMATION. CONFIDENT SHOPPING.</p><h1>${item.title}</h1><div class="panel policy-copy">${item.text
      .split(/\n\n/)
      .map((p) => `<p>${esc(p)}</p>`)
      .join(
        "",
      )}<p>Questions? <a href="https://wa.me/${b.whatsapp}">Contact Cell Connecta on WhatsApp</a> or call <a href="tel:${esc(b.phone)}">${esc(b.phone)}</a>.</p></div></section>`,
  };
}
export function adminPage(owner) {
  return `<section class="container admin-section"><div class="admin-heading"><div><p class="section-kicker">OWNER WORKSPACE</p><h1>Your store, in control.</h1><p class="muted">Inventory, orders and content—connected to your real database.</p></div><button id="admin-logout" class="button button-outline small">Sign out</button></div><p class="sr-only">Signed in as ${esc(owner.email)}</p><div id="admin-error" class="alert error" role="alert" hidden></div><div id="admin-success" class="alert success" role="status" hidden></div><div class="admin-stats" id="admin-stats"><div class="panel">Loading live store data…</div></div><nav class="admin-tabs" aria-label="Dashboard sections"><button data-admin-tab="inventory" class="selected">Inventory</button><button data-admin-tab="orders">Orders</button><button data-admin-tab="history">Stock history</button><button data-admin-tab="content">Store content</button></nav><section id="admin-inventory" class="admin-tab"><div class="admin-toolbar"><div class="admin-search"><label class="sr-only" for="admin-search">Search inventory</label><input id="admin-search" placeholder="Search model, SKU or brand…"><select id="admin-status" aria-label="Publication status"><option value="">All statuses</option><option value="published">Published</option><option value="draft">Draft</option><option value="archived">Archived</option></select><select id="admin-brand" aria-label="Brand"><option value="">All brands</option></select><select id="admin-category" aria-label="Category"><option value="">All categories</option><option value="phones">Phones</option><option value="laptops">Laptops</option><option value="accessories">Accessories</option></select><select id="admin-stock" aria-label="Stock"><option value="">Any stock</option><option value="low">Low stock (1–3)</option><option value="out">Out of stock</option></select></div><div><a class="text-link" href="/api/admin/export">Export CSV</a><button id="add-product" class="button button-primary small">+ Add product</button></div></div><div class="table-wrap"><table class="inventory-table"><thead><tr><th>Product</th><th>SKU / category</th><th>Price</th><th>Stock</th><th>Status</th><th>Updated</th><th>Actions</th></tr></thead><tbody id="inventory-rows"></tbody></table></div><p id="inventory-count" class="muted"></p></section><section id="admin-orders" class="admin-tab" hidden><div class="section-heading"><h2>Order requests</h2><button class="text-link" data-refresh-admin>Refresh</button></div><p class="alert info">Orders arrive unpaid and unreserved. Confirming an order atomically allocates stock. Arrange payment directly with the customer; no online payment provider is enabled.</p><div id="order-list"></div></section><section id="admin-history" class="admin-tab" hidden><h2>Inventory movements</h2><div id="history-list"></div></section><section id="admin-content" class="admin-tab" hidden><h2>Homepage promotion &amp; policies</h2><form id="content-form" class="panel form-grid"></form></section></section><dialog id="product-editor" class="editor-dialog"><div class="dialog-heading"><h2 id="editor-title">Add product</h2><button type="button" class="icon-button" data-close-dialog aria-label="Close editor">${svg("close")}</button></div><form id="product-form"><div class="form-grid"><label>Brand<input name="brand" required maxlength="60" list="brand-options"><datalist id="brand-options"><option>Apple</option><option>Samsung</option><option>Other</option></datalist></label><label>Model / product name<input name="model" required maxlength="120"></label><label>Internal SKU<input name="sku" required maxlength="80"></label><label>Category<select name="category"><option value="phones">Phones</option><option value="laptops">Laptops</option><option value="accessories">Accessories</option></select></label><label>Colour<input name="colour" maxlength="60"></label><label>Condition<select name="condition"><option value="certified_refurbished">Certified refurbished</option><option value="pre_owned">Pre-owned</option><option value="new">New</option><option value="accessory">Accessory</option></select></label><label>Publication<select name="status"><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></label><label>Warranty months (optional)<input type="number" min="0" max="120" name="warrantyMonths"></label><label>Cosmetic grade (optional)<input name="grade" maxlength="60"></label><label>Verified battery health % (optional)<input name="battery" type="number" min="0" max="100"></label><label class="full-width">Description<textarea name="description" rows="4" maxlength="6000"></textarea></label><label class="checkbox-label full-width"><input name="featured" type="checkbox"> Feature this product on the homepage</label></div><h3>Storage / variants &amp; stock</h3><p class="muted">Prices are in ZAR. Previous price is optional and must be a genuine higher price.</p><div id="editor-variants"></div><button type="button" id="add-variant" class="text-link">+ Add variant</button><h3>Product images</h3><p class="muted">Up to 10 JPEG, PNG or WebP images. Images are resized before upload (maximum 1.5 MB each).</p><div id="editor-images" class="editor-images"></div><label class="upload-label">Upload images<input id="image-upload" type="file" accept="image/jpeg,image/png,image/webp" multiple></label><p id="upload-status" role="status"></p><label class="block-label">Specifications (one “Label: value” per line)<textarea name="specifications" rows="4" placeholder="Only enter verified specifications"></textarea></label><p id="editor-error" class="inline-error" role="alert" hidden></p><div class="dialog-actions"><button type="button" class="button button-outline small" data-close-dialog>Cancel</button><button type="submit" id="save-product" class="button button-primary small">Save product</button></div></form></dialog><dialog id="stock-dialog" class="compact-dialog"><div class="dialog-heading"><h2>Adjust stock</h2><button class="icon-button" data-close-dialog aria-label="Close">${svg("close")}</button></div><form id="stock-form"><p id="stock-product"></p><label>Variant<select name="variantId"></select></label><label>Action<select name="action"><option value="add">Add units</option><option value="remove">Remove units</option><option value="set">Set exact quantity</option></select></label><label>Quantity<input name="quantity" type="number" min="0" max="100000" required></label><label>Reason<input name="reason" maxlength="250" required placeholder="E.g. new delivery, stock count"></label><p id="stock-error" class="inline-error" role="alert" hidden></p><button class="button button-primary small">Save stock adjustment</button></form></dialog><dialog id="admin-order-dialog" class="compact-dialog"><div class="dialog-heading"><h2>Order details</h2><button class="icon-button" data-close-dialog aria-label="Close">${svg("close")}</button></div><div id="admin-order-content"></div></dialog>`;
}
