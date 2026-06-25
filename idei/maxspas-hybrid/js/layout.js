(function () {
  const BASE = "/idei/maxspas-hybrid";

  const THEMES = {
    studio: {
      label: "MAXSPAS Studio",
      sub: "Сайты · боты",
      primary: { text: "Заявка", href: `${BASE}/contacts` },
      switch: { text: "3D GRBNK →", href: `${BASE}/grbnk` },
      logo: "/assets/logo-mark.svg",
    },
    grbnk: {
      label: "3D GRBNK",
      sub: "Модели для печати",
      primary: { text: "Заказ 3D", href: `${BASE}/contacts` },
      switch: { text: "MAXSPAS Studio →", href: BASE },
      logo: "/assets/logo-3dgrbnk.svg",
    },
  };

  let activeTheme = "studio";
  let site = null;

  async function loadSite() {
    const res = await fetch("/config/site.json");
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

  function setTheme(theme, { fromScroll = false } = {}) {
    if (!THEMES[theme]) return;
    const page = document.body.dataset.page || "home";
    if (fromScroll && page === "grbnk") return;

    const prev = activeTheme;
    activeTheme = theme;
    document.body.dataset.theme = theme;

    if (prev !== theme) {
      document.dispatchEvent(
        new CustomEvent("mstheme:change", {
          detail: { from: prev, to: theme, fromScroll },
        })
      );
    }

    const t = THEMES[theme];
    const label = document.getElementById("theme-label");
    const sub = document.getElementById("theme-sub");
    const primary = document.getElementById("theme-cta-primary");
    const switchBtn = document.getElementById("theme-cta-switch");
    const heroLogo = document.getElementById("hero-theme-logo");

    if (label) label.textContent = t.label;
    if (sub) sub.textContent = t.sub;
    if (primary) {
      primary.textContent = t.primary.text;
      primary.href = t.primary.href;
    }
    if (switchBtn) {
      // Home scroll portal: chrome shifts to GRBNK visuals but switch stays the GRBNK entry CTA.
      const sw = fromScroll && page === "home" ? THEMES.studio.switch : t.switch;
      switchBtn.textContent = sw.text;
      switchBtn.href = sw.href;
    }
    if (heroLogo) heroLogo.src = t.logo;
  }

  function renderChrome(page) {
    const c = site.contacts;
    const el = document.getElementById("site-chrome");
    if (!el) return;

    el.innerHTML = `
      <div id="scroll-progress" aria-hidden="true"></div>
      <div class="brand-watermark" aria-hidden="true">MAXSPAS</div>
      <div class="corner corner--tl">
        <a class="brand-mark" href="${BASE}">
          <img src="/assets/logo-mark.svg" alt="" width="32" height="32">
          <span class="brand-mark__stack">
            <span class="brand-mark__name">MAXSPAS</span>
            <span class="brand-mark__sub gradient-text">Studio</span>
          </span>
        </a>
      </div>
      <div class="corner corner--tr">
        <div class="lang" aria-label="Язык">
          <button type="button" class="is-active">RU</button>
          <span style="color:var(--muted)">/</span>
          <button type="button">EN</button>
        </div>
      </div>
      <div class="corner corner--bl">
        <div class="btn-row btn-row--vertical">
          <a class="btn btn--ghost" href="${c.telegramChannelUrl}" target="_blank" rel="noopener">Канал</a>
          <a class="btn btn--ghost" href="${c.telegramUrl}" target="_blank" rel="noopener">Telegram</a>
          <a class="btn btn--ghost" href="mailto:${esc(c.email)}">Почта</a>
        </div>
      </div>
      <div class="corner corner--br">
        <div class="theme-switch" id="theme-switch">
          <span class="theme-switch__label" id="theme-label">MAXSPAS Studio</span>
          <span class="theme-switch__sub" id="theme-sub">Сайты · боты</span>
        </div>
        <div class="btn-row btn-row--vertical">
          <a class="btn btn--fill" id="theme-cta-primary" href="${BASE}/contacts">Заявка</a>
          <a class="btn" id="theme-cta-switch" href="${BASE}/grbnk">3D GRBNK →</a>
        </div>
      </div>`;

    const initialTheme = page === "grbnk" ? "grbnk" : "studio";
    setTheme(initialTheme);

    el.querySelectorAll(".lang button").forEach((btn) => {
      btn.addEventListener("click", () => {
        el.querySelectorAll(".lang button").forEach((b) => b.classList.remove("is-active"));
        btn.classList.add("is-active");
      });
    });

    document.dispatchEvent(new CustomEvent("mschrome:ready"));
  }

  window.MSTheme = { setTheme, getTheme: () => activeTheme };

  function grbnkLogoImg(className, size) {
    const logo = site?.grbnk3d?.logo || "/assets/logo-3dgrbnk.svg";
    return `<img src="${esc(logo)}" alt="" class="${className}" width="${size}" height="${size}" loading="lazy">`;
  }

  function renderHome() {
    const tag = document.getElementById("hero-tagline");
    if (tag) tag.textContent = site.brand.tagline;
  }

  function resolveHref(url) {
    if (!url) return `${BASE}/works`;
    if (/^https?:\/\//i.test(url)) return url;
    const clean = String(url).replace(/^\//, "");
    return clean ? `${BASE}/${clean}` : BASE;
  }

  function assetSrc(path) {
    if (!path) return "";
    return `/${String(path).replace(/^\//, "")}`;
  }

  function directionSpecs(specs) {
    if (!specs?.length) return "";
    const rows = specs
      .map(
        (s) => `
        <div class="direction-spec__row">
          <dt>${esc(s.k)}</dt>
          <dd>${esc(s.v)}</dd>
        </div>`
      )
      .join("");
    return `<dl class="direction-spec">${rows}</dl>`;
  }

  function directionBars(bars, grbnk) {
    if (!bars?.length) return "";
    const fillClass = grbnk ? " direction-spec-bar__fill--grbnk" : "";
    const items = bars
      .map(
        (b) => `
        <div class="direction-spec-bar" style="--spec-w:${esc(b.w)}">
          <span class="direction-spec-bar__label">${esc(b.label)}</span>
          <div class="direction-spec-bar__track"><div class="direction-spec-bar__fill${fillClass}"></div></div>
          <span class="direction-spec-bar__value">${esc(b.value)}</span>
        </div>`
      )
      .join("");
    return `<div class="direction-bars">${items}</div>`;
  }

  function directionTags(tags) {
    if (!tags?.length) return "";
    return `<ul class="direction-tags">${tags.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>`;
  }

  function directionWorkLogo(item) {
    if (item.logoAsset) {
      return `<img src="${assetSrc(item.logoAsset)}" alt="" class="direction-work__logo" width="28" height="28" loading="lazy">`;
    }
    if (item.logo || item.id === "maxspas-site") {
      return `<img src="/assets/logo-mark.svg" alt="" class="direction-work__logo" width="28" height="28" loading="lazy">`;
    }
    return `<span class="direction-work__icon">${window.MSIcons ? MSIcons.icon(item.icon || "sparkle", { sm: true }) : "◆"}</span>`;
  }

  function directionWork(item) {
    if (!item) return "";
    const isExternal = /^https?:\/\//i.test(item.url || "");
    const href = resolveHref(item.url);
    const thumb = directionWorkLogo(item);
    return `
      <a href="${esc(href)}" class="direction-work"${isExternal ? ' target="_blank" rel="noopener"' : ""}>
        <span class="direction-work__thumb">${thumb}</span>
        <span class="direction-work__body">
          <span class="direction-work__tag">${esc(item.tag)}</span>
          <strong>${esc(item.title)}</strong>
          <span class="direction-work__meta">${esc(item.price || "")}</span>
        </span>
        <span class="direction-work__arrow">↗</span>
      </a>`;
  }

  function directionCard(dir, portfolioById) {
    const works = (dir.portfolioIds || []).map((id) => portfolioById[id]).filter(Boolean);
    const worksHtml = works.map(directionWork).join("");
    const grbnk = dir.zone === "grbnk";
    const grbnkClass = grbnk ? " direction-card--grbnk" : "";
    const code = dir.code ? `<span class="direction-card__code">${esc(dir.code)}</span>` : "";
    const linkLabel =
      dir.id === "3d" ? "Спецификация 3D" : dir.id === "bot" ? "Заказать бота" : "Цены и пакеты";
    return `
      <article class="direction-card reveal${grbnkClass}" data-theme-zone="${esc(dir.zone || "studio")}">
        <span class="direction-card__corner direction-card__corner--tl"></span>
        <span class="direction-card__corner direction-card__corner--tr"></span>
        <span class="direction-card__corner direction-card__corner--bl"></span>
        <span class="direction-card__corner direction-card__corner--br"></span>
        <div class="direction-card__head">
          <div class="direction-card__meta-row">
            <p class="direction-card__label">${esc(dir.label)}</p>
            ${code}
          </div>
          <h3 class="direction-card__title">${esc(dir.title)}</h3>
          <p class="direction-card__lead">${esc(dir.lead || dir.desc || "")}</p>
        </div>
        ${directionSpecs(dir.specs)}
        ${directionBars(dir.bars, grbnk)}
        ${directionTags(dir.tags)}
        ${worksHtml ? `<div class="direction-card__case"><span class="direction-card__case-label">Референс</span>${worksHtml}</div>` : ""}
        <a href="${esc(resolveHref(dir.href))}" class="direction-card__link">${esc(linkLabel)} →</a>
      </article>`;
  }

  function renderDirections() {
    const grid = document.getElementById("directions-grid");
    const dirs = site.directions || [];
    if (!grid || !dirs.length) return;
    const portfolioById = Object.fromEntries((site.portfolio || []).map((p) => [p.id, p]));
    grid.innerHTML = dirs.map((d) => directionCard(d, portfolioById)).join("");
    if (window.MSMotion?.refresh) window.MSMotion.refresh();
  }

  function portfolioCard(item) {
    const iconName = item.icon || item.emoji || "sparkle";
    let visualIcon;
    if (item.logoAsset || item.logo || item.id === "maxspas-site") {
      const src = item.logoAsset ? assetSrc(item.logoAsset) : "/assets/logo-mark.svg";
      visualIcon = `<img src="${src}" alt="" class="portfolio-card__logo" width="64" height="64" loading="lazy">`;
    } else if (window.MSIcons) {
      visualIcon = `<span class="portfolio-card__icon-host">${MSIcons.icon(iconName, { xl: true })}</span>`;
    } else {
      visualIcon = `<span class="portfolio-card__emoji">${esc(item.emoji || "✨")}</span>`;
    }
    const tag = item.tag ? `<span class="portfolio-card__tag">${esc(item.tag)}</span>` : "";
    const isExternal = /^https?:\/\//i.test(item.url || "");
    const link = item.url
      ? `<a href="${esc(resolveHref(item.url))}" class="btn btn--ghost btn--sm"${isExternal ? ' target="_blank" rel="noopener"' : ""}>Смотреть</a>`
      : "";
    return `
      <article class="portfolio-card">
        <div class="portfolio-card__visual" style="background:${esc(item.color || "rgba(124,58,237,0.08)")}">
          ${visualIcon}
        </div>
        <div class="portfolio-card__body">
          ${tag}
          <h3>${esc(item.title)}</h3>
          <p>${esc(item.desc)}</p>
          <div class="portfolio-card__meta">${esc(item.price || "")}</div>
          <div class="portfolio-card__actions">${link}</div>
        </div>
      </article>`;
  }

  function renderPortfolio() {
    const grid = document.getElementById("portfolio-grid");
    const items = site.portfolio || [];
    if (!grid || !items.length) return;
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

  function renderGrbnk() {
    const g = site.grbnk3d;
    if (!g) return;

    const visual = document.getElementById("grbnk-visual");
    if (visual) {
      visual.innerHTML = `
        <div class="grbnk-visual__card grbnk-visual__card--cube">
          <div class="cube-scene">
            <div class="cube-scene__grid" aria-hidden="true"></div>
            <div class="cube-scene__stars" aria-hidden="true"></div>
            <div class="cube-ring cube-ring--1"></div>
            <div class="cube-ring cube-ring--2"></div>
            <div class="cube-wrap">
              <div class="cube">
                <div class="cube__face cube__face--front"></div>
                <div class="cube__face cube__face--back"></div>
                <div class="cube__face cube__face--right"></div>
                <div class="cube__face cube__face--left"></div>
                <div class="cube__face cube__face--top"></div>
                <div class="cube__face cube__face--bottom"></div>
              </div>
            </div>
          </div>
          <a href="${esc(g.botUrl)}" class="btn btn--fill" target="_blank" rel="noopener">${esc(g.botLabel || g.botUsername)}</a>
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
    const apiUrl =
      window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
        ? "http://127.0.0.1:8787/api/lead"
        : "/api/lead";

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
        showStatus("Нужно согласие на обработку данных.", false);
        return;
      }
      if (!payload.name || !payload.contact || !isValidContact(payload.contact)) {
        showStatus("Укажите имя и контакт (телефон или email).", false);
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
          throw new Error(err.detail || "Ошибка отправки");
        }
        form.reset();
        showStatus("Заявка отправлена! Свяжемся в ближайшее время.", true);
      } catch (err) {
        showStatus(
          err.message !== "Failed to fetch"
            ? err.message
            : "Не удалось отправить. Запустите бот или напишите в @maxspas_studio_bot",
          false
        );
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = "Отправить заявку";
        }
      }
    });
  }

  async function init() {
    try {
      await loadSite();
    } catch {
      console.error("Не удалось загрузить /config/site.json");
      return;
    }

    const page = document.body.dataset.page || "home";
    renderChrome(page);
    renderDirections();
    renderHome();
    renderPortfolio();
    renderGrbnk();
    bindContactForm();
    if (window.MSIcons) MSIcons.hydrate();
    loadCursorGrid();
  }

  function loadCursorGrid() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const s = document.createElement("script");
    s.src = `${BASE}/js/cursor-grid.js`;
    s.async = true;
    document.body.appendChild(s);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
