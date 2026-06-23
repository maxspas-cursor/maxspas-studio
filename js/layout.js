(function () {
  const NAV = [
    { id: "home", href: "index.html", label: "Главная" },
    { id: "services", href: "services.html", label: "Услуги" },
    { id: "works", href: "works.html", label: "Работы" },
    { id: "prices", href: "prices.html", label: "Цены" },
    { id: "grbnk", href: "grbnk.html", label: "3D GRBNK" },
    { id: "contacts", href: "contacts.html", label: "Контакты" },
  ];

  const SERVICE_ICONS = { web: "web", bot: "bot", bundle: "bundle", "3d": "grbnk" };

  let site = null;

  async function loadSite() {
    const res = await fetch("config/site.json");
    if (!res.ok) throw new Error("site.json");
    site = await res.json();
    return site;
  }

  function esc(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderHeader(page) {
    const c = site.contacts;
    const el = document.getElementById("site-header");
    if (!el) return;

    const nav = NAV.map(
      (item) =>
        `<a href="${item.href}" class="${item.id === page ? "active" : ""}">${item.label}</a>`
    ).join("");

    el.innerHTML = `
      <header class="header">
        <div class="container header__inner">
          <a href="index.html" class="logo" aria-label="MAXSPAS Studio">
            <img src="assets/logo-mark.svg" alt="" class="logo__mark" width="38" height="38">
            <span class="logo__text">
              <span class="logo__row"><strong>MAXSPAS</strong><span class="logo__suffix">Studio</span></span>
              <span class="logo__tag">3D GRBNK</span>
            </span>
          </a>
          <nav class="nav" id="main-nav">${nav}</nav>
          <a class="header__phone" href="tel:+${c.phoneRaw}">${esc(c.phone)}</a>
          <a href="contacts.html" class="btn btn--primary btn--sm header__cta">Заявка</a>
          <button class="burger" id="burger" type="button" aria-label="Меню"><span></span><span></span><span></span></button>
        </div>
      </header>`;

    const burger = document.getElementById("burger");
    const navEl = document.getElementById("main-nav");
    burger?.addEventListener("click", () => navEl?.classList.toggle("open"));
  }

  function renderFooter() {
    const c = site.contacts;
    const el = document.getElementById("site-footer");
    if (!el) return;

    el.innerHTML = `
      <footer class="footer">
        <div class="container footer__inner">
          <div class="footer__brand">
            <p><strong>${esc(site.brand.name)}</strong> · ${esc(site.brand.subBrand3d)}</p>
            <small>${esc(c.city)} · ${c.selfEmployed ? "Самозанятость, чек по запросу" : ""}</small>
            <div class="footer__social">
              <a href="${c.botUrl}" target="_blank" rel="noopener">Бот заявок</a>
              <a href="${c.telegramChannelUrl}" target="_blank" rel="noopener">Канал</a>
              <a href="${c.telegramUrl}" target="_blank" rel="noopener">@Maxspas</a>
            </div>
          </div>
          <div class="footer__links">
            <a href="services.html">Услуги</a>
            <a href="prices.html">Цены</a>
            <a href="works.html">Работы</a>
            <a href="contacts.html">Контакты</a>
          </div>
        </div>
      </footer>`;
  }

  function grbnkLogoImg(className, size) {
    const logo = site.grbnk3d?.logo || "assets/logo-3dgrbnk.svg";
    return `<img src="${esc(logo)}" alt="" class="${className}" width="${size}" height="${size}" loading="lazy">`;
  }

  function serviceCard(s) {
    const iconName = SERVICE_ICONS[s.id] || "sparkle";
    const icon =
      s.id === "3d"
        ? `<div class="card__icon card__icon--grbnk">${grbnkLogoImg("card__icon-img", 28)}</div>`
        : `<div class="card__icon">${window.MSIcons ? MSIcons.icon(iconName) : ""}</div>`;
    const feats = (s.features || []).map((f) => `<li>${esc(f)}</li>`).join("");
    return `
      <article class="card">
        ${icon}
        <h3>${esc(s.title)}</h3>
        <p>${esc(s.desc)}</p>
        <div class="card__meta"><span>${esc(s.price)}</span><span>${esc(s.days)}</span></div>
        ${feats ? `<ul class="card__list">${feats}</ul>` : ""}
        <a href="contacts.html" class="btn btn--ghost btn--full" style="margin-top:14px">Обсудить</a>
      </article>`;
  }

  function renderServices() {
    const services = site.services || [];
    const home = document.getElementById("services-grid");
    const full = document.getElementById("services-grid-full");
    if (home) home.innerHTML = services.map(serviceCard).join("");
    if (full) full.innerHTML = services.map(serviceCard).join("");
  }

  function renderHome() {
    const tag = document.getElementById("hero-tagline");
    if (tag) tag.textContent = site.brand.tagline;
    const geoWeb = document.getElementById("geo-web");
    const geo3d = document.getElementById("geo-3d");
    if (geoWeb) {
      const globe = window.MSIcons ? MSIcons.icon("globe") : "";
      geoWeb.innerHTML = `<span class="chip__icon-slot">${globe}</span><span class="chip__text">${esc(site.brand.geo.web)}</span>`;
      geoWeb.classList.add("chip--icon");
    }
    if (geo3d) {
      geo3d.innerHTML = `<span class="chip__icon-slot">${grbnkLogoImg("chip__icon chip__icon--grbnk", 22)}</span><span class="chip__text">${esc(site.brand.geo["3d"])}</span>`;
      geo3d.classList.add("chip--icon");
    }
  }

  function portfolioCard(item) {
    const iconName = item.icon || item.emoji || "sparkle";
    let visualIcon;
    if (item.logoAsset) {
      visualIcon = `<img src="${esc(item.logoAsset)}" alt="3DGRBNK" class="portfolio-card__logo portfolio-card__logo--grbnk" width="72" height="72" loading="lazy">`;
    } else if (item.logo || item.id === "maxspas-site") {
      visualIcon = `<img src="assets/logo-mark.svg" alt="" class="portfolio-card__logo" width="72" height="72" loading="lazy">`;
    } else if (window.MSIcons) {
      visualIcon = `<span class="portfolio-card__icon-host">${MSIcons.icon(iconName, { xl: true })}</span>`;
    } else {
      visualIcon = `<span class="portfolio-card__emoji">${esc(item.emoji || "✨")}</span>`;
    }
    const tag = item.tag ? `<span class="portfolio-card__tag">${esc(item.tag)}</span>` : "";
    const link = item.url
      ? `<a href="${esc(item.url)}" class="btn btn--ghost btn--sm" target="_blank" rel="noopener">Смотреть</a>`
      : "";
    const botLink = item.botUrl
      ? `<a href="${esc(item.botUrl)}" class="btn btn--primary btn--sm portfolio-card__bot" target="_blank" rel="noopener">${esc(item.botLabel || "Telegram")}</a>`
      : "";
    return `
      <article class="portfolio-card">
        <div class="portfolio-card__visual" style="background:${esc(item.color || "var(--gradient-soft)")}">
          ${visualIcon}
        </div>
        <div class="portfolio-card__body">
          ${tag}
          <h3>${esc(item.title)}</h3>
          <p>${esc(item.desc)}</p>
          <div class="portfolio-card__meta">${esc(item.price || "")}</div>
          <div class="portfolio-card__actions">${link}${botLink}</div>
        </div>
      </article>`;
  }

  function renderPortfolio() {
    const grid = document.getElementById("portfolio-grid");
    const items = site.portfolio || [];
    if (!grid) return;
    if (!items.length) return;
    grid.innerHTML = items.map(portfolioCard).join("");
    const empty = document.getElementById("portfolio-empty");
    if (empty) empty.style.display = "none";
  }

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(String(value || "").trim());
  }

  function isValidPhone(value) {
    const digits = String(value || "").replace(/\D/g, "");
    if (digits.length < 10 || digits.length > 15) return false;
    if (new Set(digits).size === 1) return false;
    return true;
  }

  function isValidContact(value) {
    const text = String(value || "").trim();
    return text && (isValidEmail(text) || isValidPhone(text));
  }

  function apiErrorMessage(errBody) {
    const detail = errBody?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail) && detail[0]?.msg) return detail[0].msg;
    return "Ошибка отправки";
  }

  function renderGrbnk() {
    const g = site.grbnk3d;
    if (!g) return;

    const visual = document.getElementById("grbnk-visual");
    if (visual) {
      visual.innerHTML = `
        <div class="grbnk-visual__card">
          <img src="${esc(g.logo)}" alt="${esc(g.title || "3DGRBNK")}" class="grbnk-visual__logo" width="260" height="260" loading="lazy">
          <a href="${esc(g.botUrl)}" class="btn btn--primary grbnk-visual__bot" target="_blank" rel="noopener">${esc(g.botLabel || g.botUsername)}</a>
          <span class="grbnk-visual__bot-user">${esc(g.botUsername)}</span>
        </div>`;
    }

    const brandLogo = document.getElementById("grbnk-brand-logo");
    if (brandLogo) {
      brandLogo.src = g.logo;
      brandLogo.alt = g.title || "3DGRBNK";
    }

    const brandBot = document.getElementById("grbnk-brand-bot");
    if (brandBot) {
      brandBot.href = g.botUrl;
      brandBot.textContent = g.botLabel || g.botUsername;
    }
  }

  function bindContactForm() {
    const form = document.getElementById("lead-form");
    if (!form) return;

    const status = document.getElementById("form-status");
    const submitBtn = document.getElementById("lead-submit");
    function resolveLeadApiUrl() {
      const configured = (site.contacts.leadApiUrl || "").trim();
      if (configured) return configured;
      const host = window.location.hostname;
      if (host === "localhost" || host === "127.0.0.1") {
        return "http://127.0.0.1:8787/api/lead";
      }
      return "/api/lead";
    }
    const apiUrl = resolveLeadApiUrl();

    function showStatus(text, ok) {
      if (!status) return;
      status.hidden = false;
      status.textContent = text;
      status.className = "form-status " + (ok ? "form-status--ok" : "form-status--err");
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const payload = {
        name: String(fd.get("name") || "").trim(),
        contact: String(fd.get("contact") || "").trim(),
        service: String(fd.get("service") || "не указана"),
        message: String(fd.get("message") || "").trim(),
        company: String(fd.get("company") || "").trim(),
        budget: String(fd.get("budget") || "").trim(),
        deadline: String(fd.get("deadline") || "").trim(),
        page: window.location.pathname || "",
        referrer: String(document.referrer || "").slice(0, 500),
        website: String(fd.get("website") || "").trim(),
      };

      if (!fd.get("consent")) {
        showStatus("Нужно согласие на обработку данных для связи по заявке.", false);
        return;
      }

      if (!payload.name || !payload.contact) {
        showStatus("Укажите имя и контакт (телефон или email).", false);
        return;
      }

      if (!isValidContact(payload.contact)) {
        showStatus("Контакт должен быть телефоном (+7 …) или email — иначе заявка не отправится.", false);
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Отправляем…";
      }
      if (status) status.hidden = true;

      try {
        const res = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(apiErrorMessage(err));
        }
        form.reset();
        showStatus("✅ Заявка отправлена! Мы свяжемся с вами в ближайшее время.", true);
      } catch (err) {
        const msg = err.message && err.message !== "Failed to fetch"
          ? err.message
          : "Не удалось отправить. Запустите maxspas-bot\\run_all.ps1 или напишите в @maxspas_studio_bot";
        showStatus(msg, false);
        console.error(err);
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = "Отправить заявку";
        }
      }
    });
  }

  function bindAnimations() {
    const bar = document.createElement("div");
    bar.id = "scroll-progress";
    document.body.prepend(bar);

    window.addEventListener(
      "scroll",
      () => {
        const doc = document.documentElement;
        const max = doc.scrollHeight - doc.clientHeight;
        const pct = max > 0 ? (doc.scrollTop / max) * 100 : 0;
        bar.style.width = pct + "%";
      },
      { passive: true }
    );

    ["js/cursor-bg.js", "js/animations.js"].forEach((src) => {
      const s = document.createElement("script");
      s.src = src;
      document.body.appendChild(s);
    });
  }

  async function init() {
    try {
      await loadSite();
    } catch {
      console.error("Не удалось загрузить config/site.json");
      return;
    }

    const page = document.body.dataset.page || "home";
    renderHeader(page);
    renderFooter();
    renderServices();
    renderHome();
    renderPortfolio();
    renderGrbnk();
    bindContactForm();
    bindAnimations();
    if (window.MSIcons) MSIcons.hydrate();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
