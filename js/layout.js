(function () {
  const BASE = "";

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
      switch: { text: "MAXSPAS Studio →", href: "/" },
      logo: "/assets/logo-3dgrbnk.svg",
    },
  };

  let activeTheme = "studio";
  let site = null;
  let localeEn = null;

  const CHROME_RU = { channel: "Канал", telegram: "Telegram", mail: "Почта" };
  const STUDIO_BUDGET_KEYS = ["landing", "site", "bot", "siteBot"];
  const GRBNK_BUDGET_KEYS = ["stl", "model", "print"];

  function isEn() {
    return window.MSI18n?.getLang() === "en";
  }

  function ui(key, ru) {
    if (isEn() && localeEn?.ui?.[key]) return localeEn.ui[key];
    return ru;
  }

  async function loadSite() {
    const [siteRes, enRes] = await Promise.all([
      fetch("/config/site.json"),
      fetch("/config/locale-en.json"),
    ]);
    if (!siteRes.ok) throw new Error("site.json");
    site = await siteRes.json();
    if (enRes.ok) localeEn = await enRes.json();
    return site;
  }

  function esc(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function themeStrings(theme) {
    const base = THEMES[theme];
    const en = isEn() && localeEn?.themes?.[theme];
    if (!en) return base;
    return {
      ...base,
      sub: en.sub || base.sub,
      primary: { ...base.primary, text: en.primary || base.primary.text },
      switch: { ...base.switch, text: en.switch || base.switch.text },
    };
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

    const t = themeStrings(theme);
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
    const mobilePrimary = document.getElementById("mobile-cta-primary");
    const mobileSwitch = document.getElementById("mobile-cta-switch");
    if (mobilePrimary) {
      mobilePrimary.textContent = t.primary.text;
      mobilePrimary.href = t.primary.href;
    }
    if (mobileSwitch) {
      const sw = fromScroll && page === "home" ? THEMES.studio.switch : t.switch;
      mobileSwitch.textContent = page === "grbnk" || theme === "grbnk" ? (isEn() ? "Studio →" : "Studio →") : "3D →";
      mobileSwitch.href = sw.href;
    }
    if (heroLogo) heroLogo.src = t.logo;
  }

  function renderChrome(page) {
    const c = site.contacts;
    const el = document.getElementById("site-chrome");
    if (!el) return;

    const watermarkText =
      page === "grbnk"
        ? site?.grbnkShowroom?.watermark || localeEn?.chrome?.watermarkBrand3d || "MAXSPAS 3D"
        : "MAXSPAS";
    const watermarkClass = page === "grbnk" ? "brand-watermark brand-watermark--grbnk" : "brand-watermark";
    const langLabel = isEn() ? "Language" : "Язык";

    el.innerHTML = `
      <div id="scroll-progress" aria-hidden="true"></div>
      <div class="${watermarkClass}" aria-hidden="true">${esc(watermarkText)}</div>
      <div class="corner corner--tl">
        <a class="brand-mark" href="/">
          <img src="/assets/logo-mark.svg" alt="" width="32" height="32">
          <span class="brand-mark__stack">
            <span class="brand-mark__name">MAXSPAS</span>
            <span class="brand-mark__sub gradient-text">Studio</span>
          </span>
        </a>
      </div>
      <div class="corner corner--tr">
        <div class="lang" aria-label="${esc(langLabel)}">
          <button type="button"${isEn() ? "" : ' class="is-active"'}>RU</button>
          <span style="color:var(--muted)">/</span>
          <button type="button"${isEn() ? ' class="is-active"' : ""}>EN</button>
        </div>
      </div>
      <div class="corner corner--bl">
        <div class="btn-row btn-row--vertical">
          <a class="btn btn--ghost" href="${c.telegramChannelUrl}" target="_blank" rel="noopener">${esc(isEn() && localeEn?.chrome?.channel ? localeEn.chrome.channel : CHROME_RU.channel)}</a>
          <a class="btn btn--ghost" href="${c.telegramUrl}" target="_blank" rel="noopener">${esc(isEn() && localeEn?.chrome?.telegram ? localeEn.chrome.telegram : CHROME_RU.telegram)}</a>
          <a class="btn btn--ghost" href="mailto:${esc(c.email)}">${esc(isEn() && localeEn?.chrome?.mail ? localeEn.chrome.mail : CHROME_RU.mail)}</a>
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
      </div>
      <nav class="mobile-dock" aria-label="${isEn() ? "Quick actions" : "Быстрые действия"}">
        <a class="mobile-dock__link" href="${c.telegramUrl}" target="_blank" rel="noopener">${esc(isEn() && localeEn?.chrome?.telegram ? localeEn.chrome.telegram : CHROME_RU.telegram)}</a>
        <a class="mobile-dock__link" href="mailto:${esc(c.email)}">${esc(isEn() && localeEn?.chrome?.mail ? localeEn.chrome.mail : CHROME_RU.mail)}</a>
        <a class="mobile-dock__cta btn btn--fill" id="mobile-cta-primary" href="${BASE}/contacts">Заявка</a>
        <a class="mobile-dock__link" id="mobile-cta-switch" href="${BASE}/grbnk">3D →</a>
      </nav>`;

    const initialTheme = page === "grbnk" ? "grbnk" : "studio";
    setTheme(initialTheme);

    el.querySelectorAll(".lang button").forEach((btn) => {
      btn.addEventListener("click", () => {
        const next = btn.textContent.trim() === "EN" ? "en" : "ru";
        if (window.MSI18n) window.MSI18n.setLang(next);
      });
    });

    if (window.MSI18n) window.MSI18n.applyStatic();

    window.MSAppLocale = localeEn;

    document.dispatchEvent(new CustomEvent("mschrome:ready"));
  }

  window.MSTheme = { setTheme, getTheme: () => activeTheme };

  function grbnkLogoImg(className, size) {
    const logo = site?.grbnk3d?.logo || "/assets/logo-3dgrbnk.svg";
    return `<img src="${esc(logo)}" alt="" class="${className}" width="${size}" height="${size}" loading="lazy">`;
  }

  function localizeDirection(dir) {
    const en = isEn() && localeEn?.directions?.[dir.id];
    if (!en) return dir;
    return {
      ...dir,
      label: en.label ?? dir.label,
      title: en.title ?? dir.title,
      lead: en.lead ?? dir.lead ?? dir.desc,
      specs: en.specs ?? dir.specs,
      bars: en.bars ?? dir.bars,
      tags: en.tags ?? dir.tags,
    };
  }

  function localizePortfolioItem(item) {
    const en = isEn() && localeEn?.portfolio?.[item.id];
    if (!en) return item;
    return {
      ...item,
      title: en.title ?? item.title,
      desc: en.desc ?? item.desc,
      tag: en.tag ?? item.tag,
      price: en.price ?? item.price,
    };
  }

  function budgetLabel(keys, index, fallback) {
    const key = keys[index];
    if (isEn() && key && localeEn?.homeBudget?.items?.[key]) return localeEn.homeBudget.items[key];
    return fallback;
  }

  function renderHome() {
    const budget = site.homeBudget;
    if (!budget) return;

    function renderBudgetBars(containerId, items, grbnk, keys) {
      const box = document.getElementById(containerId);
      if (!box || !items?.length) return;
      const fillClass = grbnk ? " spec-bar__fill--grbnk" : "";
      box.innerHTML = items
        .map(
          (item, i) => `
        <div class="spec-bar" style="--spec-w:${esc(item.w || "50%")}">
          <span>${esc(budgetLabel(keys, i, item.label))}</span>
          <div class="spec-bar__track"><div class="spec-bar__fill${fillClass}"></div></div>
          <span class="spec-bar__value">${esc(item.value)}</span>
        </div>`
        )
        .join("");
    }

    if (budget.studio) {
      const t = document.getElementById("home-budget-studio-title");
      if (t && budget.studio.title) t.textContent = budget.studio.title;
      renderBudgetBars("home-budget-studio", budget.studio.items, false, STUDIO_BUDGET_KEYS);
    }
    if (budget.grbnk) {
      const t = document.getElementById("home-budget-grbnk-title");
      const s = document.getElementById("home-budget-grbnk-sub");
      if (t && budget.grbnk.title) t.textContent = budget.grbnk.title;
      const sub =
        isEn() && localeEn?.homeBudget?.grbnk?.subtitle
          ? localeEn.homeBudget.grbnk.subtitle
          : budget.grbnk.subtitle;
      if (s && sub) s.textContent = sub;
      renderBudgetBars("home-budget-grbnk", budget.grbnk.items, true, GRBNK_BUDGET_KEYS);
    }
  }

  function resolveHref(url) {
    if (!url) return `${BASE}/works`;
    if (/^https?:\/\//i.test(url)) return url;
    const clean = String(url).replace(/^\//, "");
    return clean ? `/${clean}` : "/";
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
    // Reference thumbs on the home carousel: small tinted squares — not page screenshots.
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
    const tint = item.color ? ` style="background:${esc(item.color)}"` : "";
    return `
      <a href="${esc(href)}" class="direction-work"${isExternal ? ' target="_blank" rel="noopener"' : ""}>
        <span class="direction-work__thumb"${tint}>${thumb}</span>
        <span class="direction-work__body">
          <span class="direction-work__tag">${esc(item.tag)}</span>
          <strong>${esc(item.title)}</strong>
          <span class="direction-work__meta">${esc(item.price || "")}</span>
        </span>
        <span class="direction-work__arrow">↗</span>
      </a>`;
  }

  function directionCard(dir, portfolioById) {
    const works = (dir.portfolioIds || [])
      .map((id) => portfolioById[id] && localizePortfolioItem(portfolioById[id]))
      .filter(Boolean)
      .slice(0, 2);
    const worksHtml = works.map(directionWork).join("");
    const grbnk = dir.zone === "grbnk";
    const grbnkClass = grbnk ? " direction-card--grbnk" : "";
    const code = dir.code ? `<span class="direction-card__code">${esc(dir.code)}</span>` : "";
    const ctaMap = {
      directionLinkWeb: "Цены и пакеты",
      directionLinkBot: "Заказать бота",
      directionLinkBundle: "Пакеты и цены",
      directionLinkDesign: "Заказать дизайн",
      directionLink3d: "Спецификация 3D",
    };
    const ctaKey = dir.cta || (dir.id === "3d" ? "directionLink3d" : dir.id === "bot" ? "directionLinkBot" : "directionLinkWeb");
    const linkLabel = ui(ctaKey, ctaMap[ctaKey] || "Подробнее");
    return `
      <article class="direction-card reveal${grbnkClass}" data-theme-zone="${esc(dir.zone || "studio")}" data-direction-id="${esc(dir.id)}">
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
        ${worksHtml ? `<div class="direction-card__case"><span class="direction-card__case-label">${esc(ui("reference", "Референс"))}</span>${worksHtml}</div>` : ""}
        <a href="${esc(resolveHref(dir.href))}" class="direction-card__link">${esc(linkLabel)} →</a>
      </article>`;
  }

  function bindDirectionsCarousel(total) {
    const root = document.getElementById("directions-carousel");
    const viewport = root?.querySelector(".directions-carousel__viewport");
    const track = document.getElementById("directions-grid");
    const nav = document.getElementById("directions-nav");
    const prev = document.getElementById("directions-prev");
    const next = document.getElementById("directions-next");
    const currentEl = document.getElementById("directions-current");
    const totalEl = document.getElementById("directions-total");
    if (!root || !viewport || !track || total < 1) return;

    const GAP = 16;
    let page = 0;
    let resizeTimer = 0;

    function perView() {
      if (window.matchMedia("(max-width: 720px)").matches) return 1;
      if (window.matchMedia("(max-width: 980px)").matches) return 2;
      return 3;
    }

    const prevLabel = ui("directionsPrev", "Предыдущее направление");
    const nextLabel = ui("directionsNext", "Следующее направление");
    if (prev) prev.setAttribute("aria-label", prevLabel);
    if (next) next.setAttribute("aria-label", nextLabel);

    function layout() {
      const pv = perView();
      const pages = Math.max(1, Math.ceil(total / pv));
      if (page >= pages) page = pages - 1;
      const maxIndex = Math.max(0, total - pv);
      const index = Math.min(page * pv, maxIndex);
      const w = viewport.clientWidth;
      const cardW = Math.max(0, (w - (pv - 1) * GAP) / pv);
      const cards = track.querySelectorAll(".direction-card");
      cards.forEach((card, i) => {
        card.style.flex = `0 0 ${cardW}px`;
        card.style.width = `${cardW}px`;
        card.style.minWidth = `${cardW}px`;
        card.style.maxWidth = `${cardW}px`;
        const visible = i >= index && i < index + pv;
        card.setAttribute("aria-hidden", visible ? "false" : "true");
        card.classList.toggle("is-active-slide", visible);
      });
      track.style.gap = `${GAP}px`;
      track.style.transform = `translateX(-${index * (cardW + GAP)}px)`;

      if (nav) nav.hidden = pages <= 1;
      if (currentEl) currentEl.textContent = String(page + 1);
      if (totalEl) totalEl.textContent = String(pages);
      if (prev) prev.disabled = page <= 0;
      if (next) next.disabled = page >= pages - 1;
      if (window.MSMotion?.refresh) window.MSMotion.refresh();
    }

    function go(delta) {
      const pv = perView();
      const pages = Math.max(1, Math.ceil(total / pv));
      page = Math.max(0, Math.min(pages - 1, page + delta));
      layout();
    }

    if (prev) prev.onclick = () => go(-1);
    if (next) next.onclick = () => go(1);

    root.onkeydown = (e) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        go(-1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        go(1);
      }
    };
    root.tabIndex = 0;

    let touchX = null;
    track.ontouchstart = (e) => {
      touchX = e.changedTouches[0]?.clientX ?? null;
    };
    track.ontouchend = (e) => {
      if (touchX == null) return;
      const dx = (e.changedTouches[0]?.clientX ?? touchX) - touchX;
      touchX = null;
      if (Math.abs(dx) < 40) return;
      go(dx < 0 ? 1 : -1);
    };

    window.addEventListener("resize", () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(layout, 120);
    });

    layout();
  }

  function renderDirections() {
    const grid = document.getElementById("directions-grid");
    const dirs = site.directions || [];
    if (!grid || !dirs.length) return;
    const portfolioById = Object.fromEntries((site.portfolio || []).map((p) => [p.id, p]));
    grid.innerHTML = dirs.map((d) => directionCard(localizeDirection(d), portfolioById)).join("");
    bindDirectionsCarousel(dirs.length);
    if (window.MSMotion?.refresh) window.MSMotion.refresh();
  }

  function portfolioCard(item) {
    const loc = localizePortfolioItem(item);
    const iconName = loc.icon || loc.emoji || "sparkle";
    const coverSrc = loc.cover ? assetSrc(loc.cover) : "";
    let visualIcon;
    let visualClass = "portfolio-card__visual";
    if (coverSrc) {
      visualClass += " portfolio-card__visual--cover";
      const fitClass = loc.coverFit === "cover" ? " portfolio-card__cover--fill" : "";
      visualIcon = `<img src="${coverSrc}" alt="" class="portfolio-card__cover${fitClass}" width="480" height="320" loading="lazy">`;
    } else if (loc.logoAsset || loc.logo || loc.id === "maxspas-site") {
      const src = loc.logoAsset ? assetSrc(loc.logoAsset) : "/assets/logo-mark.svg";
      visualIcon = `<img src="${src}" alt="" class="portfolio-card__logo" width="64" height="64" loading="lazy">`;
    } else if (window.MSIcons) {
      visualIcon = `<span class="portfolio-card__icon-host">${MSIcons.icon(iconName, { xl: true })}</span>`;
    } else {
      visualIcon = `<span class="portfolio-card__emoji">${esc(loc.emoji || "✨")}</span>`;
    }
    const tag = loc.tag ? `<span class="portfolio-card__tag">${esc(loc.tag)}</span>` : "";
    const soon =
      loc.status === "photo-soon"
        ? `<span class="portfolio-card__soon">${esc(isEn() ? "Photos soon" : "Фото скоро")}</span>`
        : "";
    const isExternal = /^https?:\/\//i.test(loc.url || "");
    const href = loc.url ? resolveHref(loc.url) : "";
    const extAttrs = isExternal ? ' target="_blank" rel="noopener"' : "";
    const link = href
      ? `<a href="${esc(href)}" class="btn btn--ghost btn--sm"${extAttrs}>${esc(ui("view", "Смотреть"))}</a>`
      : "";
    const visualStyle = coverSrc ? "" : ` style="background:${esc(loc.color || "rgba(124,58,237,0.08)")}"`;
    const visualInner = `
          ${visualIcon}
          ${soon}`;
    const visualBlock = href
      ? `<a href="${esc(href)}" class="${visualClass} portfolio-card__visual-link"${visualStyle}${extAttrs}>${visualInner}</a>`
      : `<div class="${visualClass}"${visualStyle}>${visualInner}</div>`;
    return `
      <article class="portfolio-card" data-direction="${esc(loc.direction || "all")}">
        ${visualBlock}
        <div class="portfolio-card__body">
          ${tag}
          <h3>${esc(loc.title)}</h3>
          <p>${esc(loc.desc)}</p>
          <div class="portfolio-card__meta">${esc(loc.price || "")}</div>
          <div class="portfolio-card__actions">${link}</div>
        </div>
      </article>`;
  }

  function renderPortfolio() {
    const grid = document.getElementById("portfolio-grid");
    const empty = document.getElementById("portfolio-empty");
    const note = document.getElementById("portfolio-note");
    const items = [...(site.portfolio || [])].sort((a, b) => {
      const as = a.status === "photo-soon" ? 1 : 0;
      const bs = b.status === "photo-soon" ? 1 : 0;
      return as - bs;
    });
    if (!grid) return;
    if (!items.length) {
      if (empty) empty.hidden = false;
      if (note) note.hidden = true;
      return;
    }
    grid.innerHTML = items.map(portfolioCard).join("");
    if (empty) empty.hidden = true;
    if (note) note.hidden = false;

    const filters = document.getElementById("portfolio-filters");
    if (!filters) return;

    const applyFilter = (filter) => {
      const f = filter || "all";
      filters.querySelectorAll(".portfolio-filter").forEach((b) => {
        b.classList.toggle("is-active", (b.dataset.filter || "all") === f);
      });
      let visible = 0;
      grid.querySelectorAll(".portfolio-card").forEach((card) => {
        const dir = card.dataset.direction || "all";
        const show = f === "all" || dir === f;
        card.hidden = !show;
        if (show) visible += 1;
      });
      if (empty) {
        empty.hidden = visible > 0;
        if (!visible) {
          const title = empty.querySelector("h3");
          const desc = empty.querySelector("p");
          if (title) title.textContent = isEn() ? "Nothing in this filter" : "В этой категории пока пусто";
          if (desc) {
            desc.textContent = isEn()
              ? "Try another filter or open All."
              : "Выберите другой фильтр или «Все».";
          }
        }
      }
      if (note) note.hidden = visible === 0;
      try {
        const url = new URL(location.href);
        if (f === "all") url.searchParams.delete("filter");
        else url.searchParams.set("filter", f);
        history.replaceState(null, "", url.pathname + url.search + url.hash);
      } catch (_) {}
    };

    if (filters.dataset.bound !== "1") {
      filters.dataset.bound = "1";
      filters.addEventListener("click", (e) => {
        const btn = e.target.closest(".portfolio-filter");
        if (!btn) return;
        applyFilter(btn.dataset.filter || "all");
      });
    }

    let initial = "all";
    try {
      initial = new URLSearchParams(location.search).get("filter") || "all";
    } catch (_) {}
    if (![...filters.querySelectorAll(".portfolio-filter")].some((b) => b.dataset.filter === initial)) {
      initial = "all";
    }
    applyFilter(initial);
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
    if (visual && !document.getElementById("grbnk-viewer")) {
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
      const enLabel = localeEn?.portfolio?.["grbnk-bot"]?.botLabel;
      brandBot.textContent = isEn() && enLabel ? enLabel : g.botLabel || g.botUsername;
    }
  }

  function refreshLocalized() {
    const page = document.body.dataset.page || "home";
    const wm = document.querySelector(".brand-watermark");
    if (wm && page === "grbnk") {
      wm.textContent =
        site?.grbnkShowroom?.watermark || localeEn?.chrome?.watermarkBrand3d || "MAXSPAS 3D";
    }
    const ch = localeEn?.chrome;
    const bl = document.querySelector(".corner--bl");
    if (bl && ch) {
      const links = bl.querySelectorAll(".btn");
      if (links[0]) links[0].textContent = isEn() ? ch.channel : CHROME_RU.channel;
      if (links[1]) links[1].textContent = isEn() ? ch.telegram : CHROME_RU.telegram;
      if (links[2]) links[2].textContent = isEn() ? ch.mail : CHROME_RU.mail;
    }
    setTheme(activeTheme);
    renderDirections();
    renderHome();
    renderPortfolio();
    renderGrbnk();
    renderDesignBranches();
    if (window.MSI18n) {
      window.MSI18n.applyStatic();
      window.MSI18n.applyTicker();
    }
    if (window.MSMotion?.refresh) window.MSMotion.refresh();
    document.dispatchEvent(new CustomEvent("msapp:lang", { detail: { site, page } }));
  }

  function bindContactForm() {
    const form = document.getElementById("lead-form");
    if (!form) return;

    const status = document.getElementById("form-status");
    const submitBtn = document.getElementById("lead-submit");
    const serviceSelect = document.getElementById("lead-service");
    const customWrap = document.getElementById("service-custom-wrap");
    const customInput = document.getElementById("lead-service-custom");
    const apiUrl =
      window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
        ? "http://127.0.0.1:8787/api/lead"
        : "/api/lead";

    function msg(key, fallback) {
      return window.MSI18n?.t(key) || fallback;
    }

    function syncServiceCustom() {
      const isOther = serviceSelect?.value === "other";
      if (customWrap) customWrap.hidden = !isOther;
      if (customInput) {
        customInput.required = !!isOther;
        if (!isOther) customInput.value = "";
      }
    }
    serviceSelect?.addEventListener("change", syncServiceCustom);
    syncServiceCustom();

    function showStatus(text, ok) {
      if (!status) return;
      status.hidden = false;
      status.textContent = text;
      status.className = "form-status " + (ok ? "form-status--ok" : "form-status--err");
    }

    const submitLabel = () => msg("contacts.form.submit", "Отправить заявку");

    function selectedServiceLabel() {
      const opt = serviceSelect?.selectedOptions?.[0];
      return (opt?.textContent || serviceSelect?.value || "").trim();
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const serviceValue = String(fd.get("service") || "").trim();
      const custom = String(fd.get("service_custom") || "").trim();
      let service = selectedServiceLabel() || serviceValue || (isEn() ? "not specified" : "не указана");
      if (serviceValue === "other") {
        if (!custom) {
          showStatus(msg("contacts.form.errOther", "Опишите услугу в поле ниже."), false);
          customInput?.focus();
          return;
        }
        service = `${msg("contacts.service.other", "Другое")}: ${custom}`;
      }

      const payload = {
        name: String(fd.get("name") || "").trim(),
        contact: String(fd.get("contact") || "").trim(),
        service,
        message: String(fd.get("message") || "").trim(),
        company: String(fd.get("company") || "").trim(),
        budget: String(fd.get("budget") || "").trim(),
        deadline: String(fd.get("deadline") || "").trim(),
        page: window.location.pathname || "",
        referrer: String(document.referrer || "").slice(0, 500),
        website: String(fd.get("website") || "").trim(),
      };

      if (!fd.get("consent")) {
        showStatus(msg("contacts.form.errConsent", "Нужно согласие на обработку данных."), false);
        return;
      }
      if (!payload.name || !payload.contact || !isValidContact(payload.contact)) {
        showStatus(msg("contacts.form.errContact", "Укажите имя и контакт (телефон или email)."), false);
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = msg("contacts.form.sending", "Отправляем…");
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
          throw new Error(err.detail || msg("contacts.form.errSend", "Ошибка отправки"));
        }
        form.reset();
        syncServiceCustom();
        showStatus(msg("contacts.form.ok", "Заявка отправлена! Свяжемся в ближайшее время."), true);
      } catch (err) {
        showStatus(
          err.message !== "Failed to fetch"
            ? err.message
            : isEn()
              ? "Could not send. Start the bot or message @maxspas_studio_bot"
              : "Не удалось отправить. Запустите бот или напишите в @maxspas_studio_bot",
          false
        );
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = submitLabel();
        }
      }
    });
  }

  function renderDesignBranches() {
    const branches = site?.designBranches;
    if (!branches) return;
    const en = isEn() && localeEn?.designBranches;
    const map = [
      ["branches-now", en?.now || branches.now],
      ["branches-later", en?.later || branches.later],
      ["branches-skip", en?.skip || branches.skip],
    ];
    map.forEach(([id, items]) => {
      const el = document.getElementById(id);
      if (!el || !items?.length) return;
      el.innerHTML = items.map((t) => `<li>${esc(t)}</li>`).join("");
    });
  }

  function bindPayCopy() {
    document.querySelectorAll("[data-copy]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const value = btn.getAttribute("data-copy") || "";
        try {
          await navigator.clipboard.writeText(value);
          const prev = btn.textContent;
          btn.textContent = window.MSI18n?.t("contacts.pay.copied") || "Скопировано";
          setTimeout(() => {
            btn.textContent = prev;
          }, 1600);
        } catch {
          btn.textContent = value;
        }
      });
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
    bindPayCopy();
    renderDesignBranches();
    if (window.MSIcons) MSIcons.hydrate();
    if (window.MSMotion?.refresh) window.MSMotion.refresh();
    loadCursorGrid();
    window.MSAppLocale = localeEn;
    if (window.MSI18n) {
      window.MSI18n.applyStatic();
      window.MSI18n.applyTicker();
    }
    document.dispatchEvent(new CustomEvent("msapp:ready", { detail: { site, page } }));
    document.addEventListener("mslang:change", refreshLocalized);
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
