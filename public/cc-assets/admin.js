// public/cc-assets/store.js
var $ = (s, root = document) => root.querySelector(s);
var $$ = (s, root = document) => [...root.querySelectorAll(s)];
var data = JSON.parse($("#page-data")?.textContent || "{}");
var esc = (s) => String(s ?? "").replace(
  /[&<>"']/g,
  (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]
);
var money = (n) => "R" + Number(n).toLocaleString("en-US", {
  minimumFractionDigits: Number.isInteger(Number(n)) ? 0 : 2,
  maximumFractionDigits: 2
}).replace(/[\s\u00a0\u202f]/g, ",");
var icon = (id) => `<svg class="icon" aria-hidden="true"><use href="#${id}"/></svg>`;
async function api(path, options = {}) {
  const h = new Headers(options.headers || {});
  if (options.body && typeof options.body !== "string" && !(options.body instanceof Blob)) {
    h.set("Content-Type", "application/json");
    options.body = JSON.stringify(options.body);
  }
  if (data.csrfToken) h.set("X-CSRF-Token", data.csrfToken);
  const r = await fetch(path, {
    ...options,
    headers: h,
    credentials: "same-origin"
  });
  let value;
  try {
    value = await r.json();
  } catch {
    throw Error(
      "The server returned an unexpected response. Please try again."
    );
  }
  if (!r.ok) {
    const e = Error(value.error || "Request failed. Please try again.");
    e.status = r.status;
    throw e;
  }
  return value;
}
function showError(el, message) {
  if (!el) return;
  el.textContent = message;
  el.hidden = !message;
}
function toast(message) {
  const el = $("#store-toast");
  el.textContent = message;
  el.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.hidden = true, 3200);
}
function readCart() {
  try {
    const value = JSON.parse(localStorage.getItem("cc:bag") || "[]");
    return Array.isArray(value) ? value.filter(
      (v) => v && typeof v.variantId === "string" && Number.isSafeInteger(v.quantity) && v.quantity > 0 && v.quantity <= 100
    ).slice(0, 30) : [];
  } catch {
    return [];
  }
}
function writeCart(items) {
  try {
    localStorage.setItem("cc:bag", JSON.stringify(items));
  } catch {
    throw Error(
      "Your browser could not save the bag. Allow site storage and try again."
    );
  }
  updateCount();
}
function updateCount() {
  $$(".cart-count").forEach(
    (el) => el.textContent = readCart().reduce((s, x) => s + x.quantity, 0)
  );
}
updateCount();
window.addEventListener("storage", updateCount);
$("#global-menu-toggle")?.addEventListener("click", () => {
  const el = $("#global-menu"), open = el.hidden;
  el.hidden = !open;
  $("#global-menu-toggle").setAttribute("aria-expanded", String(open));
  $("#global-menu-toggle").setAttribute(
    "aria-label",
    open ? "Close menu" : "Open menu"
  );
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    $("#global-menu").hidden = true;
    $("#global-menu-toggle").setAttribute("aria-expanded", "false");
    $("#global-menu-toggle").setAttribute("aria-label", "Open menu");
  }
});
document.addEventListener("click", (e) => {
  const close = e.target.closest("[data-close-dialog]");
  if (close) close.closest("dialog")?.close();
});
$("#retry-page")?.addEventListener("click", () => location.reload());
$("#catalogue-sort")?.addEventListener(
  "change",
  (e) => e.target.form.requestSubmit()
);
if (document.body.dataset.page === "product") {
  let updateVariant = function() {
    const v = variant();
    $("#detail-price").textContent = money(v.price);
    $("#detail-was").textContent = v.wasPrice > v.price ? money(v.wasPrice) : "";
    $("#detail-was").hidden = !(v.wasPrice > v.price);
    $("#detail-stock").textContent = v.inStock > 0 ? v.inStock + " in stock" : "Out of stock";
    $("#detail-stock").classList.toggle("unavailable", v.inStock < 1);
    $("#product-quantity").max = Math.max(1, v.inStock);
    $("#product-quantity").value = Math.min(
      Math.max(1, Number($("#product-quantity").value) || 1),
      Math.max(1, v.inStock)
    );
    $("#add-to-cart").disabled = v.inStock < 1;
    $("#buy-now").disabled = v.inStock < 1;
  };
  const p = data.product, variant = () => p.variants.find((v) => v.id === $("#variant-select").value);
  $("#variant-select").addEventListener("change", () => {
    updateVariant();
    showError($("#product-error"), "");
  });
  async function add(buyNow) {
    const v = variant(), quantity = Number($("#product-quantity").value);
    showError($("#product-error"), "");
    if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > v.inStock) {
      showError(
        $("#product-error"),
        "Choose a whole quantity between 1 and " + v.inStock + "."
      );
      return;
    }
    const next = readCart(), existing = next.find((i) => i.variantId === v.id);
    if (existing) existing.quantity += quantity;
    else next.push({ variantId: v.id, quantity });
    $("#add-to-cart").disabled = true;
    $("#buy-now").disabled = true;
    try {
      await api("/api/cart/validate", {
        method: "POST",
        body: { items: next }
      });
      writeCart(next);
      if (buyNow) location.assign("/checkout");
      else toast(p.model + " added to your bag.");
    } catch (e) {
      showError($("#product-error"), e.message);
    } finally {
      updateVariant();
    }
  }
  $("#add-to-cart").addEventListener("click", () => add(false));
  $("#buy-now").addEventListener("click", () => add(true));
  $$("[data-gallery]").forEach(
    (b) => b.addEventListener("click", () => {
      $("#main-product-image").src = b.dataset.gallery;
      $("#zoomed-image").src = b.dataset.gallery;
      $$("[data-gallery]").forEach(
        (x) => x.setAttribute("aria-pressed", String(x === b))
      );
    })
  );
  $("#zoom-image").addEventListener(
    "click",
    () => $("#image-dialog").showModal()
  );
}
if (["cart", "checkout"].includes(document.body.dataset.page)) {
  let all = [], quote = null;
  const getVariant = (id) => {
    for (const p of all) {
      const v = p.variants.find((v2) => v2.id === id);
      if (v) return { ...v, product: p };
    }
    return null;
  };
  async function renderCart() {
    const items = readCart();
    quote = null;
    showError($("#cart-error"), "");
    $("#cart-summary").hidden = true;
    if ($("#checkout-form")) $("#checkout-form").hidden = true;
    if (!items.length) {
      $("#cart-items").innerHTML = '<div class="empty-state"><h2>Your bag is waiting.</h2><p>Find a phone you\u2019ll love in our current collection.</p><a class="button button-primary" href="/shop">Explore all phones \u2192</a></div>';
      return;
    }
    $("#cart-items").innerHTML = items.map((i) => {
      const v = getVariant(i.variantId);
      return `<article class="cart-item">${v ? `<img src="${esc(v.product.photoUrls[0] || "/favicon.png")}" width="95" height="105" alt="${esc(v.product.model)}">` : "<div></div>"}<div><h2>${v ? `<a href="/phone/${esc(v.product.id)}">${esc(v.product.model)}</a>` : "Product no longer available"}</h2><p>${v ? esc(v.storage + " \xB7 " + v.product.colour) : "Remove this item to continue."}</p>${v ? `<p>${v.inStock} currently in stock</p>` : ""}<div class="cart-item-controls"><label class="sr-only" for="qty-${esc(i.variantId)}">Quantity</label><input id="qty-${esc(i.variantId)}" type="number" min="1" max="${v?.inStock || 1}" value="${i.quantity}" data-cart-quantity="${esc(i.variantId)}" aria-label="Quantity for ${esc(v?.product.model || "item")}"><button data-remove-cart="${esc(i.variantId)}">Remove</button></div></div><div class="cart-item-side">${v ? `<strong>${money(v.price * i.quantity)}</strong><small>${money(v.price)} each</small>` : ""}</div></article>`;
    }).join("");
    try {
      quote = await api("/api/cart/validate", {
        method: "POST",
        body: { items }
      });
      for (const item of quote.items) {
        const input = document.querySelector(
          `[data-cart-quantity="${CSS.escape(item.variantId)}"]`
        );
        const row = input?.closest(".cart-item");
        if (row) {
          $(".cart-item-side strong", row).textContent = money(
            item.unitPriceCents * item.quantity / 100
          );
          $(".cart-item-side small", row).textContent = money(item.unitPriceCents / 100) + " each";
          const details = row.querySelectorAll("p");
          if (details[1])
            details[1].textContent = item.stock + " currently in stock";
          input.max = item.stock;
        }
      }
      $("#cart-summary").hidden = false;
      $("#cart-subtotal").textContent = money(quote.subtotalCents / 100);
      $("#cart-total").textContent = money(quote.subtotalCents / 100);
      if ($("#checkout-form")) $("#checkout-form").hidden = false;
    } catch (e) {
      showError($("#cart-error"), e.message);
    }
  }
  document.addEventListener("click", (e) => {
    const button = e.target.closest("[data-remove-cart]");
    if (button) {
      writeCart(
        readCart().filter((i) => i.variantId !== button.dataset.removeCart)
      );
      renderCart();
    }
  });
  document.addEventListener("change", async (e) => {
    if (!e.target.matches("[data-cart-quantity]")) return;
    const quantity = Number(e.target.value), v = getVariant(e.target.dataset.cartQuantity);
    if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > (v?.inStock || 0)) {
      showError(
        $("#cart-error"),
        "That quantity is unavailable. Enter a whole quantity within the available stock."
      );
      e.target.value = readCart().find((i) => i.variantId === e.target.dataset.cartQuantity)?.quantity || 1;
      return;
    }
    const items = readCart();
    const row = items.find(
      (i) => i.variantId === e.target.dataset.cartQuantity
    );
    if (row) row.quantity = quantity;
    writeCart(items);
    await renderCart();
  });
  async function load2() {
    try {
      all = await api("/api/phones");
      await renderCart();
    } catch (e) {
      $("#cart-items").innerHTML = '<div class="empty-state"><h2>We couldn\u2019t load your bag.</h2><p>Please try again.</p><button class="button button-primary" id="retry-cart">Retry</button></div>';
      showError($("#cart-error"), e.message);
      $("#retry-cart")?.addEventListener("click", load2);
    }
  }
  load2();
  $("#checkout-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const button = $("#place-order");
    button.disabled = true;
    showError($("#checkout-error"), "");
    try {
      if (!quote)
        throw Error("Please refresh your bag to check prices and stock.");
      const form = new FormData(e.target), items = readCart();
      let saved;
      try {
        saved = JSON.parse(sessionStorage.getItem("cc:checkout") || "null");
      } catch {
      }
      const fingerprint = JSON.stringify(items);
      if (!saved || saved.fingerprint !== fingerprint) {
        saved = {
          fingerprint,
          key: crypto.randomUUID(),
          receipt: [...crypto.getRandomValues(new Uint8Array(32))].map((x) => x.toString(16).padStart(2, "0")).join("")
        };
        sessionStorage.setItem("cc:checkout", JSON.stringify(saved));
      }
      const input = {
        ...Object.fromEntries(form),
        items,
        expectedSubtotalCents: quote.subtotalCents,
        acknowledged: form.has("acknowledged")
      };
      const result = await api("/api/orders", {
        method: "POST",
        headers: {
          "Idempotency-Key": saved.key,
          "X-Order-Token": saved.receipt
        },
        body: input
      });
      writeCart([]);
      sessionStorage.removeItem("cc:checkout");
      sessionStorage.setItem("cc:receipt:" + result.id, saved.receipt);
      location.assign("/order/" + result.id + "#" + saved.receipt);
    } catch (error2) {
      showError($("#checkout-error"), error2.message);
    } finally {
      button.disabled = false;
    }
  });
}
if (document.body.dataset.page === "receipt") {
  const id = data.orderId;
  let receipt = location.hash.slice(1);
  if (!receipt)
    try {
      receipt = sessionStorage.getItem("cc:receipt:" + id) || "";
    } catch {
    }
  async function loadReceipt() {
    try {
      if (!receipt)
        throw Error(
          "This order needs its private confirmation link. Please contact the store if you no longer have it."
        );
      const o = await api("/api/orders/" + encodeURIComponent(id), {
        headers: { "X-Order-Token": receipt }
      });
      const lines = o.items.map(
        (i) => `${i.model} ${i.storage} ${i.colour} \xD7 ${i.quantity}`
      );
      $("#receipt-content").innerHTML = `<p class="section-kicker">REQUEST ${esc(o.id.slice(0, 8).toUpperCase())}</p><h1>${o.status === "requested" ? "Thanks. Your request is received." : "Your order status"}</h1><div class="receipt-meta"><span class="status-pill ${esc(o.status)}">${esc(o.status)}</span><span class="status-pill">No online payment collected</span></div><p class="muted">${o.status === "requested" ? "Your items are not yet reserved. Cell Connecta will confirm availability, delivery and payment arrangements." : "Contact Cell Connecta for delivery and payment updates."}</p><ul class="receipt-items">${o.items.map((i) => `<li><span><b>${esc(i.model)}</b><br>${esc(i.storage + " \xB7 " + i.colour)} \xB7 Qty ${i.quantity}</span><b>${money(i.unit_price_cents * i.quantity / 100)}</b></li>`).join("")}</ul><div class="summary-total"><span>Product total</span><strong>${money(o.subtotal_cents / 100)}</strong></div><p class="muted">Delivery: ${o.delivery_method === "cape_town" ? "free Cape Town delivery" : "quote to be confirmed"}.<br>Keep this private link to check your request status. Do not share it publicly.</p><a class="button button-primary" href="https://wa.me/${data.whatsapp}?text=${encodeURIComponent("Hi Cell Connecta, my order request is " + o.id.slice(0, 8).toUpperCase() + ": " + lines.join("; ") + ". Please confirm availability and payment arrangements.")}">${icon("whatsapp")} Continue on WhatsApp</a><a class="text-link" href="/shop">Continue shopping \u2192</a>`;
    } catch (e) {
      $("#receipt-content").innerHTML = "<h1>We couldn\u2019t open this request.</h1><p>" + esc(e.message) + '</p><button class="button button-outline" id="retry-receipt">Try again</button>';
      $("#retry-receipt").addEventListener("click", loadReceipt);
    }
  }
  loadReceipt();
}
$("#login-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const b = $("button[type=submit]", e.target);
  b.disabled = true;
  showError($("#auth-error"), "");
  try {
    await api("/api/auth/login", {
      method: "POST",
      body: Object.fromEntries(new FormData(e.target))
    });
    location.assign("/admin");
  } catch (error2) {
    showError($("#auth-error"), error2.message);
  } finally {
    b.disabled = false;
  }
});
$("#recovery-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const b = $("button[type=submit]", e.target);
  b.disabled = true;
  showError($("#auth-error"), "");
  showError($("#auth-success"), "");
  const input = Object.fromEntries(new FormData(e.target));
  if (!input.code) {
    delete input.code;
    delete input.password;
  }
  try {
    await api("/api/auth/forgot", { method: "POST", body: input });
    showError(
      $("#auth-success"),
      input.code ? "Password updated. You can sign in now." : "If your account is eligible, check your email for the verification code."
    );
  } catch (error2) {
    showError($("#auth-error"), error2.message);
  } finally {
    b.disabled = false;
  }
});
function initCategorySlideshow() {
  const root = document.querySelector("[data-hero-carousel]");
  if (!root) return;
  root.querySelector(".hero-controls").hidden = false;
  const slides = [...root.querySelectorAll("[data-hero-slide]")];
  const dots = [...root.querySelectorAll("[data-hero-go]")];
  const pauseButton = root.querySelector("[data-hero-pause]");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let current2 = 0, userPaused = reducedMotion.matches, hovering = false, focused = false, timer;
  const syncPause = () => {
    pauseButton.textContent = userPaused ? "Play" : "Pause";
    pauseButton.setAttribute(
      "aria-label",
      userPaused ? "Play slideshow" : "Pause slideshow"
    );
    pauseButton.setAttribute("aria-pressed", String(userPaused));
  };
  function schedule() {
    clearTimeout(timer);
    if (!userPaused && !hovering && !focused && !document.hidden) {
      timer = setTimeout(() => show(current2 + 1, false), 5500);
    }
  }
  function show(index, announce = true) {
    const next = (index + slides.length) % slides.length;
    if (next !== current2) {
      const previous = slides[current2];
      previous.classList.add("is-exiting");
      setTimeout(() => previous.classList.remove("is-exiting"), 700);
      current2 = next;
    }
    slides.forEach((slide, i) => {
      slide.classList.toggle("is-active", i === current2);
      slide.inert = i !== current2;
      slide.setAttribute("aria-hidden", String(i !== current2));
    });
    dots.forEach(
      (dot, i) => dot.setAttribute("aria-pressed", String(i === current2))
    );
    if (announce)
      root.querySelector("[data-hero-status]").textContent = slides[current2].getAttribute("aria-label");
    schedule();
  }
  root.querySelector("[data-hero-prev]").addEventListener("click", () => show(current2 - 1));
  root.querySelector("[data-hero-next]").addEventListener("click", () => show(current2 + 1));
  dots.forEach((dot, i) => dot.addEventListener("click", () => show(i)));
  pauseButton.addEventListener("click", () => {
    userPaused = !userPaused;
    syncPause();
    schedule();
  });
  root.addEventListener("pointerenter", (event) => {
    if (event.pointerType !== "touch") {
      hovering = true;
      schedule();
    }
  });
  root.addEventListener("pointerleave", () => {
    hovering = false;
    schedule();
  });
  root.addEventListener("focusin", () => {
    focused = true;
    schedule();
  });
  root.addEventListener("focusout", () => {
    queueMicrotask(() => {
      focused = root.contains(document.activeElement);
      schedule();
    });
  });
  document.addEventListener("visibilitychange", schedule);
  reducedMotion.addEventListener("change", () => {
    userPaused = reducedMotion.matches;
    syncPause();
    schedule();
  });
  root.querySelector(".hero-controls").addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      show(current2 + (event.key === "ArrowRight" ? 1 : -1));
    }
  });
  let touchStart = null;
  const surface = root.querySelector(".hero-slides");
  surface.addEventListener(
    "touchstart",
    (event) => {
      touchStart = { x: event.touches[0].clientX, y: event.touches[0].clientY };
    },
    { passive: true }
  );
  surface.addEventListener(
    "touchend",
    (event) => {
      if (!touchStart) return;
      const dx = event.changedTouches[0].clientX - touchStart.x, dy = event.changedTouches[0].clientY - touchStart.y;
      if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.5)
        show(current2 + (dx < 0 ? 1 : -1));
      touchStart = null;
    },
    { passive: true }
  );
  syncPause();
  schedule();
}
initCategorySlideshow();
function initShopSidebar() {
  const form = document.querySelector("#shop-filters");
  if (!form) return;
  const details = form.querySelector(".filter-details");
  const desktop = matchMedia("(min-width: 1000px)");
  details.open = desktop.matches;
  desktop.addEventListener("change", () => {
    details.open = desktop.matches;
  });
  const facets = JSON.parse(document.querySelector("#shop-facets").textContent);
  const brand = form.querySelector('[name="brand"]');
  const model = form.querySelector('[name="model"]');
  const storage = form.querySelector('[name="storage"]');
  const unique = (values) => [...new Set(values.filter(Boolean))].sort(
    (a, b) => a.localeCompare(b, void 0, { numeric: true })
  );
  function options(select, values, label, previous) {
    select.replaceChildren(
      new Option(label, ""),
      ...values.map(
        (v) => new Option(
          select === brand && v === "Apple" ? "Apple / iPhone" : v,
          v
        )
      )
    );
    select.value = values.includes(previous) ? previous : "";
  }
  function refresh(changed) {
    const categories = [
      ...form.querySelectorAll('[name="category"]:checked')
    ].map((i) => i.value);
    let rows = facets.filter(
      (p) => !categories.length || categories.includes(p.category)
    );
    if (changed === "category") {
      options(
        brand,
        unique([
          ...rows.map((p) => p.brand),
          ...!categories.length || categories.includes("phones") ? ["Apple", "Samsung"] : []
        ]),
        "All brands",
        brand.value
      );
    }
    if (changed === "category" || changed === "brand") model.value = "";
    if (["category", "brand", "model"].includes(changed)) storage.value = "";
    rows = rows.filter((p) => !brand.value || p.brand === brand.value);
    const previousModel = model.value;
    options(
      model,
      unique(rows.map((p) => p.model)),
      "All models",
      previousModel
    );
    rows = rows.filter((p) => !model.value || p.model === model.value);
    const values = unique(rows.flatMap((p) => p.storages)).sort((a, b) => {
      const n = (s) => parseFloat(s) * (s.toUpperCase().includes("TB") ? 1024 : 1);
      return n(a) - n(b) || a.localeCompare(b, void 0, { numeric: true });
    });
    options(storage, values, "Any storage", storage.value);
  }
  form.addEventListener("change", (event) => {
    if (!event.target.matches("[data-shop-filter]")) return;
    if (["category", "brand", "model"].includes(event.target.name))
      refresh(event.target.name);
    if (desktop.matches) form.requestSubmit();
  });
  if ("ResizeObserver" in window) {
    const header = document.querySelector(".site-header");
    new ResizeObserver(
      () => document.documentElement.style.setProperty(
        "--shop-header-offset",
        `${Math.ceil(header.getBoundingClientRect().height) + 16}px`
      )
    ).observe(header);
  }
}
initShopSidebar();

// public/cc-assets/admin.js
var state = { products: [], orders: [], settings: {} };
var current = null;
var stockProduct = null;
var uploading = false;
var totalStock = (p) => p.variants.reduce((n, v) => n + v.inStock, 0);
var stamp = (t) => new Date(t).toLocaleDateString("en-ZA", {
  day: "numeric",
  month: "short",
  year: "numeric"
});
var condition = (c) => ({
  certified_refurbished: "Refurbished",
  pre_owned: "Pre-owned",
  new: "New",
  accessory: "Accessory"
})[c] || c;
function error(message) {
  showError($("#admin-error"), message);
  if (message)
    $("#admin-error").scrollIntoView({ behavior: "smooth", block: "center" });
}
function success(message) {
  showError($("#admin-success"), message);
  setTimeout(() => showError($("#admin-success"), ""), 6e3);
}
async function load() {
  try {
    state = await api("/api/admin/overview");
    renderStats();
    const selected = $("#admin-brand").value;
    $("#admin-brand").innerHTML = '<option value="">All brands</option>' + [...new Set(state.products.map((p) => p.brand))].sort().map((b) => `<option value="${esc(b)}">${esc(b)}</option>`).join("");
    $("#admin-brand").value = selected;
    renderInventory();
    renderOrders();
    renderContent();
    error("");
  } catch (e) {
    if (e.status === 401) {
      location.assign("/login");
      return;
    }
    error(e.message);
  }
}
function renderStats() {
  const published = state.products.filter((p) => p.status === "published"), low = published.filter((p) => totalStock(p) > 0 && totalStock(p) <= 3), units = published.reduce((s, p) => s + totalStock(p), 0), out = published.filter((p) => !totalStock(p));
  $("#admin-stats").innerHTML = [
    [
      "Active products",
      published.length,
      state.products.length + " including drafts & archives"
    ],
    ["Stock units", units, "Across published products"],
    ["Out of stock", out.length, "Published listings with zero stock"],
    ["Low-stock products", low.length, "1\u20133 units available"]
  ].map(
    ([label, value, note]) => `<div class="panel"><p>${label}</p><strong>${value}</strong><small>${note}</small></div>`
  ).join("");
}
function renderInventory() {
  const q = $("#admin-search").value.trim().toLowerCase(), status = $("#admin-status").value, brand = $("#admin-brand").value, stock = $("#admin-stock").value, category = $("#admin-category")?.value;
  const products = state.products.filter(
    (p) => (!q || [p.model, p.brand, p.colour, p.sku].join(" ").toLowerCase().includes(q)) && (!status || p.status === status) && (!brand || p.brand === brand) && (!category || p.category === category) && (!stock || (stock === "out" ? !totalStock(p) : totalStock(p) > 0 && totalStock(p) <= 3))
  );
  $("#inventory-rows").innerHTML = products.length ? products.map(
    (p) => `<tr><td><div class="table-product"><img src="${esc(p.photoUrls[0] || "/favicon.png")}" alt="" width="48" height="57" loading="lazy"><div><strong>${esc(p.model)}</strong><small>${esc(p.colour)} \xB7 ${condition(p.condition)}${p.featured ? " \xB7 Featured" : ""}</small></div></div></td><td><small>${esc(p.sku)}</small><small>${esc(p.category)}</small></td><td>${money(Math.min(...p.variants.map((v) => v.price)))}</td><td><b>${totalStock(p)}</b> units${totalStock(p) > 0 && totalStock(p) <= 3 ? '<small class="low-stock-note">Low stock</small>' : ""}</td><td><span class="status-pill ${esc(p.status)}">${esc(p.status)}</span></td><td>${stamp(p.updatedAt)}</td><td><div class="table-actions"><button data-edit="${p.id}">Edit</button><button data-stock="${p.id}">Stock</button>${p.status !== "archived" ? `<button class="danger" data-archive="${p.id}">Archive</button>` : ""}</div></td></tr>`
  ).join("") : '<tr><td colspan="7">No matching products. Try clearing the filters.</td></tr>';
  $("#inventory-count").textContent = products.length + " of " + state.products.length + " products";
  $$("#add-product,[data-edit],[data-archive]").forEach(
    (button) => button.disabled = !state.productEditingReady
  );
}
function renderOrders() {
  $("#order-list").innerHTML = state.orders.length ? state.orders.map(
    (o) => `<article class="order-row"><div><strong>${esc(o.customer_name)}</strong><small>${esc(o.id.slice(0, 8).toUpperCase())} \xB7 ${stamp(o.created_at)}</small><span class="status-pill ${esc(o.status)}">${esc(o.status)}</span></div><div><strong>${money(o.subtotal_cents / 100)}</strong><button data-order="${o.id}">View order \u2192</button></div></article>`
  ).join("") : '<div class="empty-state"><h3>No order requests yet.</h3><p>Requests submitted through the store will appear here.</p></div>';
}
function renderContent() {
  const promo = state.settings.promotion || {}, b = state.settings.business || {}, field = (name, label, value, type = "input") => `<label class="${type === "textarea" ? "full-width" : ""}">${label}${type === "textarea" ? `<textarea name="${name}" rows="4">${esc(value)}</textarea>` : `<input name="${name}" value="${esc(value)}">`}</label>`;
  $("#content-form").innerHTML = `<label class="checkbox-label full-width"><input type="checkbox" name="enabled" ${promo.enabled ? "checked" : ""}> Show the homepage promotion</label>${field("eyebrow", "Small heading", promo.eyebrow)}${field("title", "Promotion title", promo.title)}${field("body", "Promotion copy", promo.body, "textarea")}${field("label", "Button label", promo.label)}${field("href", "Button URL (internal or WhatsApp)", promo.href)}<h3 class="full-width">Business contact &amp; customer policies</h3>${field("phone", "Contact phone", b.phone)}${field("whatsapp", "WhatsApp number (international digits)", b.whatsapp)}${field("location", "Location", b.location)}${field("email", "Public contact email (optional)", b.email)}${field("delivery", "Delivery policy", b.delivery, "textarea")}${field("warranty", "Warranty policy", b.warranty, "textarea")}${field("returns", "Returns policy", b.returns, "textarea")}<p class="muted full-width">Only advertise benefits you can fulfil. Legal policies should be reviewed for your business and applicable South African law.</p><p id="content-error" class="inline-error full-width" role="alert" hidden></p><button type="submit" class="button button-primary small">Save store content</button>`;
}
function collectVariants() {
  return $$(".variant-row").map((row) => ({
    id: row.dataset.id || void 0,
    storage: $("[data-field=storage]", row).value,
    price: Number($("[data-field=price]", row).value),
    wasPrice: $("[data-field=wasPrice]", row).value === "" ? null : Number($("[data-field=wasPrice]", row).value),
    inStock: Number($("[data-field=inStock]", row).value)
  }));
}
function variantsEditor(list) {
  $("#editor-variants").innerHTML = list.map(
    (v) => `<div class="variant-row" data-id="${esc(v.id || "")}"><label>Storage / label<input data-field="storage" value="${esc(v.storage)}" required maxlength="80"></label><label>Price (R)<input data-field="price" type="number" min="0.01" max="1000000" step="0.01" value="${v.price || ""}" required></label><label>Was price (R)<input data-field="wasPrice" type="number" min="0.01" max="1000000" step="0.01" value="${v.wasPrice ?? ""}"></label><label>Stock<input data-field="inStock" type="number" min="0" max="100000" value="${v.inStock ?? 0}" required></label><button type="button" class="variant-remove" data-remove-variant aria-label="Remove variant">\xD7</button></div>`
  ).join("");
}
function imagesEditor() {
  $("#editor-images").innerHTML = current.photos.map(
    (key, i) => `<div class="editor-image"><img src="/api/photos/${encodeURIComponent(key)}" alt="Product image ${i + 1}"><button type="button" data-remove-image="${i}" aria-label="Remove image ${i + 1}">\xD7</button></div>`
  ).join("");
}
function openEditor(product) {
  current = product ? structuredClone(product) : {
    id: null,
    brand: "Apple",
    model: "",
    sku: "CC-" + crypto.randomUUID().slice(0, 12).toUpperCase(),
    category: "phones",
    condition: "certified_refurbished",
    status: "draft",
    featured: false,
    colour: "",
    description: "",
    grade: "",
    battery: null,
    warrantyMonths: 6,
    specifications: [],
    photos: [],
    variants: [{ storage: "128GB", price: "", wasPrice: null, inStock: 0 }]
  };
  $("#editor-title").textContent = product ? "Edit " + product.model : "Add product";
  const form = $("#product-form");
  form.reset();
  for (const key of [
    "brand",
    "model",
    "sku",
    "category",
    "condition",
    "status",
    "colour",
    "description",
    "grade",
    "battery",
    "warrantyMonths"
  ])
    form.elements[key].value = current[key] ?? "";
  form.elements.featured.checked = current.featured;
  form.elements.specifications.value = current.specifications.map((s) => s.label + ": " + s.value).join("\n");
  variantsEditor(current.variants);
  imagesEditor();
  showError($("#editor-error"), "");
  $("#upload-status").textContent = "";
  $("#product-editor").showModal();
}
$("#add-product").addEventListener("click", () => openEditor(null));
$("#add-variant").addEventListener("click", () => {
  const list = collectVariants();
  if (list.length >= 20) {
    showError($("#editor-error"), "A product can have at most 20 variants.");
    return;
  }
  list.push({ storage: "", price: "", wasPrice: null, inStock: 0 });
  variantsEditor(list);
});
document.addEventListener("click", async (e) => {
  const edit = e.target.closest("[data-edit]");
  if (edit) openEditor(state.products.find((p) => p.id === edit.dataset.edit));
  const removeVariant = e.target.closest("[data-remove-variant]");
  if (removeVariant) {
    if ($$(".variant-row").length <= 1) {
      showError($("#editor-error"), "Keep at least one variant.");
      return;
    }
    const row = removeVariant.closest(".variant-row"), old = current.variants.find((v) => v.id === row.dataset.id);
    if (old?.inStock > 0) {
      showError(
        $("#editor-error"),
        "Set this variant\u2019s stock to zero and save before removing it."
      );
      return;
    }
    row.remove();
  }
  const removeImage = e.target.closest("[data-remove-image]");
  if (removeImage) {
    current.photos.splice(Number(removeImage.dataset.removeImage), 1);
    imagesEditor();
  }
  const stock = e.target.closest("[data-stock]");
  if (stock) {
    stockProduct = state.products.find((p) => p.id === stock.dataset.stock);
    $("#stock-product").textContent = stockProduct.model + " \xB7 " + stockProduct.colour;
    $("#stock-form").reset();
    $("#stock-form").elements.variantId.innerHTML = stockProduct.variants.map(
      (v) => `<option value="${v.id}">${esc(v.storage)} \u2014 ${v.inStock} in stock</option>`
    ).join("");
    showError($("#stock-error"), "");
    $("#stock-dialog").showModal();
  }
  const archive = e.target.closest("[data-archive]");
  if (archive) {
    const p = state.products.find((p2) => p2.id === archive.dataset.archive);
    if (!confirm(
      "Archive " + p.model + "? It will disappear from the public shop. Orders and inventory history will be retained."
    ))
      return;
    archive.disabled = true;
    try {
      await api("/api/admin/products/" + p.id + "/archive", {
        method: "POST",
        body: { version: p.version }
      });
      await load();
      success("Product archived. It is no longer visible in the public shop.");
    } catch (err) {
      error(err.message);
    } finally {
      archive.disabled = false;
    }
  }
  const order = e.target.closest("[data-order]");
  if (order) openOrder(order.dataset.order);
  const action = e.target.closest("[data-order-status]");
  if (action) {
    if (!confirm(
      action.dataset.orderStatus === "confirmed" ? "Confirm this request and allocate its stock?" : action.dataset.orderStatus === "cancelled" ? "Cancel this order? Previously allocated stock will be returned once." : "Mark this order as fulfilled?"
    ))
      return;
    action.disabled = true;
    try {
      await api("/api/admin/orders/" + action.dataset.orderId, {
        method: "POST",
        body: { status: action.dataset.orderStatus }
      });
      await openOrder(action.dataset.orderId);
      await load();
      success("Order updated. Inventory has been reconciled.");
    } catch (err) {
      toast(err.message);
    } finally {
      action.disabled = false;
    }
  }
});
$("#product-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (uploading) {
    showError(
      $("#editor-error"),
      "Please wait for the image upload to finish."
    );
    return;
  }
  const b = $("#save-product");
  b.disabled = true;
  showError($("#editor-error"), "");
  try {
    const values = Object.fromEntries(new FormData(e.target));
    const specifications = values.specifications.split("\n").map((x) => x.trim()).filter(Boolean).map((line) => {
      const i = line.indexOf(":");
      if (i < 1 || !line.slice(i + 1).trim())
        throw Error("Each specification must use \u201CLabel: value\u201D.");
      return {
        label: line.slice(0, i).trim(),
        value: line.slice(i + 1).trim()
      };
    });
    const input = {
      ...values,
      id: current.id || void 0,
      version: current.version,
      photos: current.photos,
      variants: collectVariants(),
      featured: e.target.elements.featured.checked,
      warrantyMonths: values.warrantyMonths === "" ? null : Number(values.warrantyMonths),
      battery: values.battery === "" ? null : Number(values.battery),
      specifications
    };
    await api("/api/admin/products", { method: "POST", body: input });
    await load();
    $("#product-editor").close();
    success(
      "Product saved to the database. Published listings are updated in the shop."
    );
  } catch (err) {
    showError($("#editor-error"), err.message);
    $("#editor-error").scrollIntoView({ block: "nearest" });
  } finally {
    b.disabled = false;
  }
});
async function compressImage(file) {
  if (file.size > 12e6) throw Error("Choose an image smaller than 12 MB.");
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
    throw Error("Choose a JPEG, PNG or WebP image.");
  const image = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
  image.close();
  const blob = await new Promise(
    (resolve) => canvas.toBlob(resolve, "image/webp", 0.85)
  );
  if (!blob || blob.size > 15e5)
    throw Error("Image is still too large. Choose a smaller image.");
  return blob;
}
$("#image-upload").addEventListener("change", async (e) => {
  const files = [...e.target.files];
  if (current.photos.length + files.length > 10) {
    showError($("#editor-error"), "A product can have at most 10 photos.");
    return;
  }
  uploading = true;
  $("#save-product").disabled = true;
  showError($("#editor-error"), "");
  try {
    for (let i = 0; i < files.length; i++) {
      $("#upload-status").textContent = "Uploading image " + (i + 1) + " of " + files.length + "\u2026";
      const blob = await compressImage(files[i]);
      const uploaded = await api("/api/admin/photos", {
        method: "POST",
        headers: { "Content-Type": blob.type },
        body: blob
      });
      current.photos.push(uploaded.key);
      imagesEditor();
    }
    $("#upload-status").textContent = "Images uploaded successfully.";
  } catch (err) {
    showError($("#editor-error"), err.message);
    $("#upload-status").textContent = "Upload not completed.";
  } finally {
    uploading = false;
    $("#save-product").disabled = false;
    e.target.value = "";
  }
});
$("#stock-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const b = $("button[type=submit]", e.target) || $("button.button", e.target);
  b.disabled = true;
  showError($("#stock-error"), "");
  try {
    const input = Object.fromEntries(new FormData(e.target));
    input.quantity = Number(input.quantity);
    input.version = stockProduct.version;
    await api("/api/admin/stock", { method: "POST", body: input });
    await load();
    $("#stock-dialog").close();
    success("Stock adjusted and inventory history recorded.");
  } catch (err) {
    showError($("#stock-error"), err.message);
  } finally {
    b.disabled = false;
  }
});
async function openOrder(orderId) {
  try {
    const o = await api("/api/admin/orders/" + orderId);
    $("#admin-order-content").innerHTML = `<div class="order-dialog-info"><span class="status-pill ${esc(o.status)}">${esc(o.status)}</span><p><b>${esc(o.customer_name)}</b><br>${esc(o.customer_phone)}${o.customer_email ? "<br>" + esc(o.customer_email) : ""}</p><p>${esc(o.address)}<br>${esc(o.city)}</p><p>Delivery: ${o.delivery_method === "cape_town" ? "Free Cape Town delivery" : "Quote required"}<br>Payment: no online payment collected</p><ul class="receipt-items">${o.items.map((i) => `<li><span>${esc(i.model + " " + i.storage + " " + i.colour)} \xD7 ${i.quantity}</span><b>${money(i.unit_price_cents * i.quantity / 100)}</b></li>`).join("")}</ul><p><b>Product total: ${money(o.subtotal_cents / 100)}</b></p>${o.notes ? "<p>Customer notes: " + esc(o.notes) + "</p>" : ""}<a class="text-link" href="https://wa.me/${o.customer_phone.replace(/\D/g, "")}">Contact customer on WhatsApp \u2192</a><div>${o.status === "requested" ? `<button class="button button-primary small" data-order-id="${o.id}" data-order-status="confirmed">Confirm &amp; allocate stock</button>` : ""}${o.status === "confirmed" ? `<button class="button button-primary small" data-order-id="${o.id}" data-order-status="fulfilled">Mark fulfilled</button>` : ""}${["requested", "confirmed"].includes(o.status) ? `<button class="button button-outline small" data-order-id="${o.id}" data-order-status="cancelled">Cancel order</button>` : ""}</div></div>`;
    if (!$("#admin-order-dialog").open) $("#admin-order-dialog").showModal();
  } catch (e) {
    error(e.message);
  }
}
async function loadHistory() {
  try {
    const list = await api("/api/admin/history");
    $("#history-list").innerHTML = list.length ? list.map(
      (x) => `<div class="history-row"><div><strong>${esc(x.model || x.product_id)} \xB7 ${esc(x.storage || "variant")}</strong><small>${esc(x.reason)} \xB7 ${stamp(x.created_at)}</small></div><div><strong>${x.quantity_change > 0 ? "+" : ""}${x.quantity_change} units</strong><small>${x.quantity_after} after adjustment</small></div></div>`
    ).join("") : '<p class="muted">No inventory movements have been recorded yet. New adjustments will appear here.</p>';
  } catch (e) {
    error(e.message);
  }
}
$$("[data-admin-tab]").forEach(
  (button) => button.addEventListener("click", () => {
    $$("[data-admin-tab]").forEach(
      (b) => b.classList.toggle("selected", b === button)
    );
    $$(".admin-tab").forEach(
      (el) => el.hidden = el.id !== "admin-" + button.dataset.adminTab
    );
    if (button.dataset.adminTab === "history") loadHistory();
  })
);
$(".admin-search").addEventListener("input", renderInventory);
$("[data-refresh-admin]")?.addEventListener("click", load);
$("#content-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const b = $("button[type=submit]", e.target);
  b.disabled = true;
  const f = new FormData(e.target), values = Object.fromEntries(f);
  try {
    await api("/api/admin/settings", {
      method: "POST",
      body: {
        promotion: {
          enabled: f.has("enabled"),
          ...Object.fromEntries(
            ["eyebrow", "title", "body", "label", "href"].map((k) => [
              k,
              values[k]
            ])
          )
        },
        business: Object.fromEntries(
          [
            "phone",
            "whatsapp",
            "location",
            "email",
            "delivery",
            "warranty",
            "returns"
          ].map((k) => [k, values[k]])
        )
      }
    });
    await load();
    success("Store content saved. The public site now uses these settings.");
  } catch (err) {
    showError($("#content-error"), err.message);
  } finally {
    b.disabled = false;
  }
});
$("#admin-logout").addEventListener("click", async () => {
  try {
    await api("/api/auth/logout", { method: "POST" });
    location.assign("/login");
  } catch (e) {
    error(e.message);
  }
});
load();
