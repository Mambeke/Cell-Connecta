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
    const dp = $("#detail-discount");
    if (dp) {
      const newDisc = v.wasPrice > v.price ? Math.round((1 - v.price / v.wasPrice) * 100) : 0;
      dp.textContent = newDisc > 0 ? "Save " + newDisc + "%" : "";
      dp.hidden = !(newDisc > 0);
    }
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
  // Gallery: index tracking, thumbnails, prev/next arrows, counter
  let galleryIndex = 0;
  const galleryImgs = $$("[data-gallery]");
  function showGalleryImage(i) {
    const len = galleryImgs.length;
    if (!len) return;
    galleryIndex = (i + len) % len;
    const btn = galleryImgs[galleryIndex];
    $("#main-product-image").src = btn.dataset.gallery;
    $("#zoomed-image").src = btn.dataset.gallery;
    $$("[data-gallery]").forEach(
      (x) => x.setAttribute("aria-pressed", String(x === btn))
    );
    $("#gallery-counter").textContent = (galleryIndex + 1) + "/" + len;
  }
  galleryImgs.forEach(
    (b) => b.addEventListener("click", () => {
      showGalleryImage(parseInt(b.dataset.index || "0", 10));
    })
  );
  $$("[data-gallery-prev]").forEach(
    (b) => b.addEventListener("click", (e) => {
      e.stopPropagation();
      showGalleryImage(galleryIndex - 1);
    })
  );
  $$("[data-gallery-next]").forEach(
    (b) => b.addEventListener("click", (e) => {
      e.stopPropagation();
      showGalleryImage(galleryIndex + 1);
    })
  );
  $("#zoom-image").addEventListener(
    "click",
    () => $("#image-dialog").showModal()
  );
  // Share product
  $("#share-product").addEventListener("click", async () => {
    const url = $("#share-product").dataset.url || location.href;
    const title = p.model;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch (e) { /* user cancelled */ }
    } else if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(url);
        toast("Product link copied to clipboard.");
      } catch (e) {
        toast("Could not copy link. Copy it manually.");
      }
    } else {
      toast("Copy this link: " + url);
    }
  });
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
  async function load() {
    try {
      all = await api("/api/phones");
      await renderCart();
    } catch (e) {
      $("#cart-items").innerHTML = '<div class="empty-state"><h2>We couldn\u2019t load your bag.</h2><p>Please try again.</p><button class="button button-primary" id="retry-cart">Retry</button></div>';
      showError($("#cart-error"), e.message);
      $("#retry-cart")?.addEventListener("click", load);
    }
  }
  load();
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
    } catch (error) {
      showError($("#checkout-error"), error.message);
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
  } catch (error) {
    showError($("#auth-error"), error.message);
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
  } catch (error) {
    showError($("#auth-error"), error.message);
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
  let current = 0, userPaused = reducedMotion.matches, hovering = false, focused = false, timer;
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
      timer = setTimeout(() => show(current + 1, false), 5500);
    }
  }
  function show(index, announce = true) {
    const next = (index + slides.length) % slides.length;
    if (next !== current) {
      const previous = slides[current];
      previous.classList.add("is-exiting");
      setTimeout(() => previous.classList.remove("is-exiting"), 700);
      current = next;
    }
    slides.forEach((slide, i) => {
      slide.classList.toggle("is-active", i === current);
      slide.inert = i !== current;
      slide.setAttribute("aria-hidden", String(i !== current));
    });
    dots.forEach(
      (dot, i) => dot.setAttribute("aria-pressed", String(i === current))
    );
    if (announce)
      root.querySelector("[data-hero-status]").textContent = slides[current].getAttribute("aria-label");
    schedule();
  }
  root.querySelector("[data-hero-prev]").addEventListener("click", () => show(current - 1));
  root.querySelector("[data-hero-next]").addEventListener("click", () => show(current + 1));
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
      show(current + (event.key === "ArrowRight" ? 1 : -1));
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
        show(current + (dx < 0 ? 1 : -1));
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
export {
  $,
  $$,
  api,
  data,
  esc,
  icon,
  money,
  readCart,
  showError,
  toast,
  writeCart
};
