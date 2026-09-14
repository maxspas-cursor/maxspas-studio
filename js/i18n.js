(function () {
  const STORAGE_KEY = "ms-lang";
  let lang = localStorage.getItem(STORAGE_KEY) === "en" ? "en" : "ru";

  const STATIC = {
    ru: {
      "home.badge": "MAXSPAS Studio",
      "home.hero.title": "Цифровые<br><span class=\"gradient-text\">продукты</span>",
      "home.hero.lead": "Сайты, боты, дизайн под продажи и 3D GRBNK — одна студия.",
      "home.hero.cta1": "Обсудить проект",
      "home.hero.cta2": "Цены",
      "home.ticker.label": "Можем · MAXSPAS Studio",
      "home.directions.title": "Направления",
      "home.directions.sub": "Листайте стрелками — сайты, боты, дизайн и 3D с полной спецификацией",
      "home.directions.link": "Все работы →",
      "home.budget.studio.ctaTitle": "MAXSPAS Studio",
      "home.budget.studio.ctaText": "Сайты и боты — заявка в один клик",
      "home.budget.studio.ctaBtn": "Связаться",
      "home.budget.grbnk.ctaTitle": "3D GRBNK",
      "home.budget.grbnk.ctaText": "Модели, печать, заказ через бота",
      "home.budget.grbnk.ctaBtn3d": "Раздел 3D →",
      "home.budget.grbnk.ctaBtnBot": "Бот · 3D →",
      "works.empty.title": "Кейсы по направлениям",
      "works.empty.desc": "Сайт maxspas.ru, бот @maxspas_studio_bot и заказ 3D в том же боте",
      "works.empty.cta": "Стать первым клиентом",
      "works.badge": "Портфолио",
      "works.title": "Наши <span class=\"gradient-text\">работы</span>",
      "works.sub": "Сайты, боты, 3D, логотипы, презентации, стикеры, афиши и спрайты",
      "works.filter.all": "Все",
      "works.filter.web": "Сайты",
      "works.filter.bot": "Боты",
      "works.filter.3d": "3D",
      "works.filter.logo": "Логотипы",
      "works.filter.market": "Маркет",
      "works.filter.print": "Печать",
      "works.filter.stickers": "TG-стикеры",
      "works.filter.present": "Презентации",
      "works.filter.game": "Спрайты",
      "works.filter.poster": "Афиши",
      "works.note": "Фильтры по направлениям: сайты, боты, 3D и дизайн (лого, маркет, печать, стикеры, презентации, спрайты, афиши). Новые работы добавляем сюда же.",
      "works.filtersAria": "Фильтр портфолио",
      "prices.badge": "Цены",
      "prices.title": "Пакеты <span class=\"gradient-text\">без сюрпризов</span>",
      "prices.sub": "Фиксированные цены на старте. Предоплата 50%. Самозанятость — с чеком.",
      "prices.start.title": "Старт",
      "prices.start.desc": "Лендинг или визитка + заявка в Telegram",
      "prices.start.btn": "Заказать",
      "prices.biz.title": "Бизнес",
      "prices.biz.desc": "Сайт + Telegram-бот",
      "prices.biz.btn": "Заказать",
      "prices.biz.badge": "Популярно",
      "prices.grbnk.desc": "Модели для 3D-печати",
      "prices.grbnk.btn": "Подробнее",
      "prices.design.title": "Дизайн под продажи",
      "prices.design.sub": "Логотипы, маркет, печать, Telegram-стикерпаки, презентации, афиши и ассеты игр — в той же студии.",
      "prices.design.logo": "Лого / аватар",
      "prices.design.logoDesc": "Знак и аватар для соцсетей и площадок",
      "prices.design.market": "Маркетплейс",
      "prices.design.marketDesc": "Карточки WB / Ozon",
      "prices.design.print": "Макеты печати",
      "prices.design.printDesc": "Листовки, визитки, грамоты",
      "prices.design.stickers": "Telegram-стикерпак",
      "prices.design.stickersDesc": "Пак для чата и канала · файл под @Stickers",
      "prices.design.stickersLi1": "8 или 16 стикеров",
      "prices.design.stickersLi2": "Персонажи · реакции",
      "prices.design.stickersLi3": "PNG + инструкция в TG",
      "prices.design.present": "Презентации",
      "prices.design.presentDesc": "Питч, КП, отчёт",
      "prices.design.game": "Спрайты / ассеты",
      "prices.design.gameDesc": "UI и low-poly по ТЗ",
      "prices.design.poster": "Афиши / обложки",
      "prices.design.posterDesc": "Постеры и превью к роликам",
      "prices.design.order": "Заказать",
      "prices.branches.now": "Делаем сейчас",
      "prices.branches.later": "Позже",
      "prices.branches.skip": "Пока не берём",
      "prices.pay.title": "Как оплатить",
      "prices.pay.lead": "Пока принимаем перевод на Т‑Банк по номеру +7 (911) 715-60-06 (СБП).",
      "prices.pay.hint": "Предоплата 50% до старта · остаток после сдачи · чек самозанятого. Мелкая печать — 100% до запуска.",
      "prices.pay.btn": "Реквизиты и заявка",
      "prices.cta.title": "Индивидуальный расчёт?",
      "prices.cta.sub": "Напишите задачу — ответим в течение дня",
      "prices.cta.btn": "Получить расчёт",
      "contacts.badge": "Контакты",
      "contacts.title": "Обсудим <span class=\"gradient-text\">проект</span>",
      "contacts.sub": "Заявка уйдёт в Telegram и на maxspas@bk.ru",
      "contacts.card.bot": "Бот заявок",
      "contacts.card.bot3d": "Бот · 3D GRBNK",
      "contacts.card.channel": "Канал",
      "contacts.card.tg": "Telegram",
      "contacts.card.email": "Email",
      "contacts.card.phone": "Телефон",
      "contacts.note.geo": "Горбунки · сайты и боты — онлайн по всему миру",
      "contacts.note.self": "Самозанятость, чек по запросу",
      "contacts.pay.title": "Оплата",
      "contacts.pay.lead": "Перевод на <strong>Т‑Банк</strong> по номеру телефона:",
      "contacts.pay.copy": "Копировать",
      "contacts.pay.copyAria": "Скопировать номер",
      "contacts.pay.copied": "Скопировано",
      "contacts.pay.li1": "СБП / перевод по номеру · банк получателя Т‑Банк",
      "contacts.pay.li2": "В комментарии — ваше имя или услуга",
      "contacts.pay.li3": "После оплаты напишите в <a href=\"https://t.me/Maxspas\" target=\"_blank\" rel=\"noopener\">@Maxspas</a> — вышлем чек НПД",
      "contacts.pay.li4": "Сайты/боты: предоплата 50%. Мелкая 3D-печать: 100% до печати (от 500 ₽)",
      "contacts.form.title": "Заявка с сайта",
      "contacts.form.hint": "Данные отправляются напрямую",
      "contacts.form.name": "Имя *",
      "contacts.form.contact": "Телефон или email *",
      "contacts.form.company": "Компания",
      "contacts.form.service": "Услуга",
      "contacts.form.serviceCustom": "Опишите услугу *",
      "contacts.form.serviceCustomPh": "Например: меню для кафе",
      "contacts.form.budget": "Бюджет",
      "contacts.form.deadline": "Срок",
      "contacts.form.message": "Сообщение",
      "contacts.form.consent": "Согласен на обработку данных для связи",
      "contacts.form.submit": "Отправить заявку",
      "contacts.form.sending": "Отправляем…",
      "contacts.form.errConsent": "Нужно согласие на обработку данных.",
      "contacts.form.errContact": "Укажите имя и контакт (телефон или email).",
      "contacts.form.errOther": "Опишите услугу в поле ниже.",
      "contacts.form.ok": "Заявка отправлена. Мы свяжемся с вами.",
      "contacts.form.errSend": "Ошибка отправки",
      "contacts.service.web": "Сайт / лендинг",
      "contacts.service.bot": "Telegram-бот",
      "contacts.service.bundle": "Сайт + бот",
      "contacts.service.logo": "Логотип / аватар",
      "contacts.service.market": "Карточки маркетплейса",
      "contacts.service.print": "Макеты печати",
      "contacts.service.stickers": "Telegram-стикерпак",
      "contacts.service.present": "Презентация",
      "contacts.service.game": "Спрайты / ассеты",
      "contacts.service.poster": "Афиша / обложка",
      "contacts.service.3d": "3D GRBNK",
      "contacts.service.other": "Другое",
      "contacts.budget.empty": "—",
      "contacts.budget.lt10": "до 10 000 ₽",
      "contacts.budget.10-30": "10–30 000 ₽",
      "contacts.budget.30-80": "30–80 000 ₽",
      "contacts.budget.80plus": "от 80 000 ₽",
      "contacts.deadline.empty": "—",
      "contacts.deadline.asap": "Срочно",
      "contacts.deadline.1-2w": "1–2 недели",
      "contacts.deadline.month": "Месяц",
      "grbnk.badge": "3D GRBNK",
      "grbnk.badgeDev": "В разработке",
      "grbnk.title": "Модели для <span class=\"gradient-text\">печати</span>",
      "grbnk.sub": "Горбунки · доставка по России · STL, OBJ, игровые ассеты",
      "grbnk.showroom.title": "Витрина",
      "grbnk.showroom.sub": "Крутите модель мышью или пальцем — как в конфигураторе",
      "grbnk.showroom.hint": "↻ ЛКМ — крутить · колесо — зум · двойной клик — сброс",
      "grbnk.showroom.orderBtn": "Заказать эту модель",
      "grbnk.budget.sub": "STL, создание модели, печать — как в боте",
      "grbnk.order.title": "Заказ и файлы",
      "grbnk.order.sub": "STL · OBJ · GLB — загрузка в боте, статус заказа, доставка по РФ",
      "grbnk.order.demoTitle": "Как в боте",
      "grbnk.order.demoSub": "Демо статуса заказа — в боевом боте этапы обновляются из админки"
    },
    en: {
      "home.badge": "MAXSPAS Studio",
      "home.hero.title": "Digital<br><span class=\"gradient-text\">products</span>",
      "home.hero.lead": "Websites, bots, sales design and 3D GRBNK — one studio.",
      "home.hero.cta1": "Discuss project",
      "home.hero.cta2": "Pricing",
      "home.ticker.label": "We build · MAXSPAS Studio",
      "home.directions.title": "Directions",
      "home.directions.sub": "Use the arrows — websites, bots, design and 3D with full specs",
      "home.directions.link": "All work →",
      "home.budget.studio.ctaTitle": "MAXSPAS Studio",
      "home.budget.studio.ctaText": "Websites and bots — one-click request",
      "home.budget.studio.ctaBtn": "Contact us",
      "home.budget.grbnk.ctaTitle": "3D GRBNK",
      "home.budget.grbnk.ctaText": "Models, printing, order via bot",
      "home.budget.grbnk.ctaBtn3d": "3D section →",
      "home.budget.grbnk.ctaBtnBot": "Bot · 3D →",
      "works.empty.title": "Cases by direction",
      "works.empty.desc": "maxspas.ru site, @maxspas_studio_bot bot and 3D orders in the same bot",
      "works.empty.cta": "Be the first client",
      "works.badge": "Portfolio",
      "works.title": "Our <span class=\"gradient-text\">work</span>",
      "works.sub": "Sites, bots, 3D, logos, presentations, stickers, posters and sprites",
      "works.filter.all": "All",
      "works.filter.web": "Sites",
      "works.filter.bot": "Bots",
      "works.filter.3d": "3D",
      "works.filter.logo": "Logos",
      "works.filter.market": "Market",
      "works.filter.print": "Print",
      "works.filter.stickers": "TG stickers",
      "works.filter.present": "Presentations",
      "works.filter.game": "Sprites",
      "works.filter.poster": "Posters",
      "works.note": "Filters by direction: sites, bots, 3D and design (logo, market, print, stickers, presentations, sprites, posters). New work is added here.",
      "works.filtersAria": "Portfolio filter",
      "prices.badge": "Pricing",
      "prices.title": "Packages <span class=\"gradient-text\">no surprises</span>",
      "prices.sub": "Fixed starter prices. 50% prepay. Self-employed with receipt.",
      "prices.start.title": "Start",
      "prices.start.desc": "Landing or business card + Telegram lead",
      "prices.start.btn": "Order",
      "prices.biz.title": "Business",
      "prices.biz.desc": "Website + Telegram bot",
      "prices.biz.btn": "Order",
      "prices.biz.badge": "Popular",
      "prices.grbnk.desc": "Models for 3D printing",
      "prices.grbnk.btn": "Details",
      "prices.design.title": "Sales design",
      "prices.design.sub": "Logos, marketplace, print, Telegram sticker packs, presentations, posters and game assets — same studio.",
      "prices.design.logo": "Logo / avatar",
      "prices.design.logoDesc": "Mark and avatar for socials and platforms",
      "prices.design.market": "Marketplace",
      "prices.design.marketDesc": "WB / Ozon product cards",
      "prices.design.print": "Print layouts",
      "prices.design.printDesc": "Flyers, cards, certificates",
      "prices.design.stickers": "Telegram sticker pack",
      "prices.design.stickersDesc": "Pack for chat & channel · file for @Stickers",
      "prices.design.stickersLi1": "8 or 16 stickers",
      "prices.design.stickersLi2": "Characters · reactions",
      "prices.design.stickersLi3": "PNG + Telegram setup guide",
      "prices.design.present": "Presentations",
      "prices.design.presentDesc": "Pitch, offer, report",
      "prices.design.game": "Sprites / assets",
      "prices.design.gameDesc": "UI and low-poly by brief",
      "prices.design.poster": "Posters / covers",
      "prices.design.posterDesc": "Posters and video thumbnails",
      "prices.design.order": "Order",
      "prices.branches.now": "We do now",
      "prices.branches.later": "Later",
      "prices.branches.skip": "Not taking yet",
      "prices.pay.title": "How to pay",
      "prices.pay.lead": "We accept T-Bank transfer to +7 (911) 715-60-06 (SBP).",
      "prices.pay.hint": "50% prepay before start · balance after delivery · self-employed receipt. Small print jobs — 100% before start.",
      "prices.pay.btn": "Details & request",
      "prices.cta.title": "Custom quote?",
      "prices.cta.sub": "Describe your task — we reply within a day",
      "prices.cta.btn": "Get a quote",
      "contacts.badge": "Contacts",
      "contacts.title": "Let's discuss <span class=\"gradient-text\">your project</span>",
      "contacts.sub": "Request goes to Telegram and maxspas@bk.ru",
      "contacts.card.bot": "Lead bot",
      "contacts.card.bot3d": "Bot · 3D GRBNK",
      "contacts.card.channel": "Channel",
      "contacts.card.tg": "Telegram",
      "contacts.card.email": "Email",
      "contacts.card.phone": "Phone",
      "contacts.note.geo": "Gorbunki · websites and bots — online worldwide",
      "contacts.note.self": "Self-employed, receipt on request",
      "contacts.pay.title": "Payment",
      "contacts.pay.lead": "Transfer to <strong>T-Bank</strong> by phone number:",
      "contacts.pay.copy": "Copy",
      "contacts.pay.copyAria": "Copy phone number",
      "contacts.pay.copied": "Copied",
      "contacts.pay.li1": "SBP / phone transfer · receiving bank T-Bank",
      "contacts.pay.li2": "In the comment — your name or service",
      "contacts.pay.li3": "After payment message <a href=\"https://t.me/Maxspas\" target=\"_blank\" rel=\"noopener\">@Maxspas</a> — we send the tax receipt",
      "contacts.pay.li4": "Sites/bots: 50% prepay. Small 3D print: 100% before print (from 500 ₽)",
      "contacts.form.title": "Request from site",
      "contacts.form.hint": "Data is sent directly",
      "contacts.form.name": "Name *",
      "contacts.form.contact": "Phone or email *",
      "contacts.form.company": "Company",
      "contacts.form.service": "Service",
      "contacts.form.serviceCustom": "Describe the service *",
      "contacts.form.serviceCustomPh": "e.g. cafe menu layout",
      "contacts.form.budget": "Budget",
      "contacts.form.deadline": "Timeline",
      "contacts.form.message": "Message",
      "contacts.form.consent": "I agree to data processing for contact",
      "contacts.form.submit": "Send request",
      "contacts.form.sending": "Sending…",
      "contacts.form.errConsent": "Consent is required.",
      "contacts.form.errContact": "Enter your name and contact (phone or email).",
      "contacts.form.errOther": "Describe the service in the field below.",
      "contacts.form.ok": "Request sent. We’ll get back to you.",
      "contacts.form.errSend": "Send failed",
      "contacts.service.web": "Website / landing",
      "contacts.service.bot": "Telegram bot",
      "contacts.service.bundle": "Site + bot",
      "contacts.service.logo": "Logo / avatar",
      "contacts.service.market": "Marketplace cards",
      "contacts.service.print": "Print layouts",
      "contacts.service.stickers": "Telegram sticker pack",
      "contacts.service.present": "Presentation",
      "contacts.service.game": "Sprites / assets",
      "contacts.service.poster": "Poster / cover",
      "contacts.service.3d": "3D GRBNK",
      "contacts.service.other": "Other",
      "contacts.budget.empty": "—",
      "contacts.budget.lt10": "up to 10,000 ₽",
      "contacts.budget.10-30": "10–30,000 ₽",
      "contacts.budget.30-80": "30–80,000 ₽",
      "contacts.budget.80plus": "from 80,000 ₽",
      "contacts.deadline.empty": "—",
      "contacts.deadline.asap": "Urgent",
      "contacts.deadline.1-2w": "1–2 weeks",
      "contacts.deadline.month": "A month",
      "grbnk.badge": "3D GRBNK",
      "grbnk.badgeDev": "In development",
      "grbnk.title": "Models for <span class=\"gradient-text\">printing</span>",
      "grbnk.sub": "Gorbunki · delivery in Russia · STL, OBJ, game assets",
      "grbnk.showroom.title": "Showroom",
      "grbnk.showroom.sub": "Drag to rotate — like a product configurator",
      "grbnk.showroom.hint": "↻ drag to rotate · wheel to zoom · double-click reset",
      "grbnk.showroom.orderBtn": "Order this model",
      "grbnk.budget.sub": "STL, model creation, printing — same as in the bot",
      "grbnk.order.title": "Orders & files",
      "grbnk.order.sub": "STL · OBJ · GLB — upload in bot, order status, delivery in Russia",
      "grbnk.order.demoTitle": "Like in the bot",
      "grbnk.order.demoSub": "Order status demo — live bot updates stages from admin"
    }
  };

  function t(key) {
    return STATIC[lang]?.[key] ?? STATIC.ru[key] ?? key;
  }

  function getLang() {
    return lang;
  }

  function setLang(next) {
    const v = next === "en" ? "en" : "ru";
    if (v === lang) return;
    lang = v;
    localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang === "en" ? "en" : "ru";
    applyStatic();
    applyTicker();
    document.dispatchEvent(new CustomEvent("mslang:change", { detail: { lang } }));
  }

  function applyStatic() {
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.dataset.i18n;
      const val = t(key);
      if (!val) return;
      if (el.dataset.i18nMode === "html") el.innerHTML = val.replace(/\n/g, "<br>");
      else el.textContent = val;
    });
    document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
      const val = t(el.dataset.i18nAria);
      if (val) el.setAttribute("aria-label", val);
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const val = t(el.dataset.i18nPlaceholder);
      if (val) el.setAttribute("placeholder", val);
    });
    const custom = document.getElementById("lead-service-custom");
    if (custom) {
      const ph = t("contacts.form.serviceCustomPh");
      if (ph) custom.placeholder = ph;
    }
    document.querySelectorAll(".lang button").forEach((btn) => {
      const isEn = btn.textContent.trim() === "EN";
      btn.classList.toggle("is-active", (isEn && lang === "en") || (!isEn && lang === "ru"));
    });
  }

  const TICKER = {
    ru: [
      "Лендинги под рекламу",
      "Сайты-визитки",
      "Многостраничные сайты",
      "Telegram-боты",
      "Заявки с сайта в бот",
      "Сайт + бот под ключ",
      "Формы и CRM-заявки",
      "SEO и мета-теги",
      "Адаптив под телефон",
      "Уведомления в Telegram",
      "Меню и запись в боте",
      "Деплой, домен, SSL",
      "3D-модели STL / OBJ",
      "3D-печать с доставкой",
      "Low-poly и игровые ассеты",
      "Визуализация и рендер",
    ],
    en: [
      "Ad landing pages",
      "Business card sites",
      "Multi-page websites",
      "Telegram bots",
      "Site leads to bot",
      "Site + bot turnkey",
      "Forms & CRM leads",
      "SEO & meta tags",
      "Mobile responsive",
      "Telegram notifications",
      "Bot menus & booking",
      "Deploy, domain, SSL",
      "STL / OBJ 3D models",
      "3D printing & delivery",
      "Low-poly & game assets",
      "Visualization & render",
    ],
  };

  function applyTicker(items) {
    const list = items?.length ? items : TICKER[lang];
    if (!list?.length) return;
    document.querySelectorAll(".spec-ticker__group").forEach((group) => {
      group.innerHTML = list.map((text) => `<li>${text}</li>`).join("");
    });
  }

  document.documentElement.lang = lang === "en" ? "en" : "ru";

  window.MSI18n = { getLang, setLang, t, applyStatic, applyTicker };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      applyStatic();
      applyTicker();
    });
  } else {
    applyStatic();
    applyTicker();
  }
})();
