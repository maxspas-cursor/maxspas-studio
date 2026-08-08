(function () {
  function esc(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function loadViewerModel(model) {
    if (!model) return;
    const apply = () => window.MSGrbnkViewer?.loadModel(model);
    if (window.MSGrbnkViewer) apply();
    else document.addEventListener("grbnk-viewer:ready", apply, { once: true });
  }

  let activeSite = null;

  function renderCatalog(showroom, activeId) {
    const grid = document.getElementById("grbnk-catalog");
    if (!grid || !showroom?.models?.length) return;
    grid.innerHTML = showroom.models
      .map((m) => {
        const active = m.id === activeId ? " is-active" : "";
        return `
        <button type="button" class="grbnk-picklist__item${active}" data-model-id="${esc(m.id)}">
          <span class="grbnk-picklist__tag">${esc(m.tag)}</span>
          <strong>${esc(m.title)}</strong>
          <span class="grbnk-picklist__meta">${esc(m.format)} · ${esc(m.price)}</span>
        </button>`;
      })
      .join("");

    grid.querySelectorAll("[data-model-id]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.modelId;
        const model = showroom.models.find((x) => x.id === id);
        if (!model) return;
        loadViewerModel(model);
        renderCatalog(showroom, id);
        updateViewerMeta(model, activeSite);
      });
    });

    const active = grid.querySelector(".grbnk-picklist__item.is-active");
    active?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  function modelOrderUrl(model, site) {
    const bot = site?.grbnk3d?.botUrl || "https://t.me/maxspas_studio_bot?start=3d";
    const match = bot.match(/t\.me\/([^?]+)/i);
    const user = match?.[1] || "maxspas_studio_bot";
    const start = `3d_${String(model.id).replace(/-/g, "_")}`;
    return `https://t.me/${user}?start=${encodeURIComponent(start)}`;
  }

  function updateViewerMeta(model, site) {
    const title = document.getElementById("grbnk-viewer-title");
    const price = document.getElementById("grbnk-viewer-price");
    const desc = document.getElementById("grbnk-viewer-desc");
    const tag = document.querySelector(".grbnk-viewer-meta__tag");
    const order = document.getElementById("grbnk-viewer-order");
    if (title) title.textContent = model.title;
    if (price) price.textContent = model.price;
    if (desc) desc.textContent = model.desc || "";
    if (tag) tag.textContent = model.tag;
    if (order && model) order.href = modelOrderUrl(model, site);
  }

  function renderCalc(showroom) {
    const bars = document.getElementById("grbnk-calc-bars");
    const grid = document.getElementById("grbnk-calc-grid");
    const opts = showroom?.calcOptions || [];
    if (!bars || !grid || !opts.length) return;

    bars.innerHTML = opts
      .map(
        (o) => `
      <div class="spec-bar spec-bar--grbnk" style="--spec-w:${esc(o.w || "50%")}">
        <span>${esc(o.title)}</span>
        <div class="spec-bar__track"><div class="spec-bar__fill spec-bar__fill--grbnk"></div></div>
        <span class="spec-bar__value">${esc(o.price)}</span>
      </div>`
      )
      .join("");

    grid.innerHTML = opts
      .map(
        (o) => `
      <article class="card card--grbnk">
        <h3>${esc(o.title)}</h3>
        <p class="card__meta"><span>${esc(o.price)}</span><span>${esc(o.days)}</span></p>
      </article>`
      )
      .join("");

    requestAnimationFrame(() => {
      bars.querySelectorAll(".spec-bar").forEach((el) => el.classList.add("is-visible"));
    });
  }

  function init(site) {
    if (document.body.dataset.page !== "grbnk") return;
    activeSite = site;
    const showroom = site?.grbnkShowroom;
    if (!showroom) return;

    const lead = document.getElementById("grbnk-hero-lead");
    if (lead && showroom.lead) {
      const enLead = window.MSAppLocale?.grbnkShowroom?.lead;
      lead.textContent =
        window.MSI18n?.getLang() === "en" && enLead ? enLead : showroom.lead;
    }

    const first = showroom.models[0];
    renderCatalog(showroom, first?.id);
    renderCalc(showroom);
    if (first) {
      updateViewerMeta(first, site);
      loadViewerModel(first);
    }
  }

  document.addEventListener("msapp:ready", (e) => init(e.detail?.site));
  document.addEventListener("msapp:lang", (e) => init(e.detail?.site));
})();
