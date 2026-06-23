/** Vercel serverless: contact form → Telegram admin */

const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PHONE_MIN = 10;
const PHONE_MAX = 15;

function isValidEmail(value) {
  return EMAIL_RE.test(String(value).trim());
}

function isValidPhone(value) {
  const digits = String(value).replace(/\D/g, "");
  if (digits.length < PHONE_MIN || digits.length > PHONE_MAX) return false;
  if (new Set(digits).size === 1) return false;
  return true;
}

function isValidContact(value) {
  const text = String(value).trim();
  return Boolean(text) && (isValidEmail(text) || isValidPhone(text));
}

function esc(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function setCors(req, res) {
  const origin = req.headers.origin || "";
  const allowed = (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (!origin || allowed.length === 0 || allowed.includes(origin) || allowed.includes("*")) {
    if (origin) res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

async function notifyAdmin(payload) {
  const token = process.env.BOT_TOKEN || "";
  const chatId = (process.env.ADMIN_CHAT_ID || "").trim();
  if (!token || !chatId) {
    const err = new Error("Lead API is not configured");
    err.status = 503;
    throw err;
  }

  const when = new Date().toLocaleString("ru-RU", { timeZone: "Europe/Moscow" });
  const lines = [
    "<b>🌐 Новая заявка с сайта</b>",
    "",
    `<b>Имя:</b> ${esc(payload.name)}`,
    `<b>Контакт:</b> ${esc(payload.contact)}`,
  ];
  if (payload.company?.trim()) lines.push(`<b>Компания:</b> ${esc(payload.company.trim())}`);
  lines.push(`<b>Услуга:</b> ${esc(payload.service || "не указана")}`);
  if (payload.budget?.trim()) lines.push(`<b>Бюджет:</b> ${esc(payload.budget.trim())}`);
  if (payload.deadline?.trim()) lines.push(`<b>Срок:</b> ${esc(payload.deadline.trim())}`);
  lines.push(`<b>Сообщение:</b>\n${esc(payload.message || "—")}`);
  if (payload.page?.trim()) lines.push(`<b>Страница:</b> ${esc(payload.page.trim())}`);
  if (payload.referrer?.trim()) lines.push(`<b>Откуда:</b> ${esc(payload.referrer.trim())}`);
  lines.push(`<b>Время:</b> ${when}`);

  const resp = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: Number(chatId),
      text: lines.join("\n"),
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
  });
  const data = await resp.json();
  if (!data.ok) {
    const err = new Error(data.description || "Telegram error");
    err.status = 502;
    throw err;
  }
}

export default async function handler(req, res) {
  setCors(req, res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ detail: "Method Not Allowed" });
  }

  try {
    const payload = req.body || {};
    if (payload.website) {
      return res.status(200).json({ ok: true });
    }
    if (!payload.name?.trim() || !payload.contact?.trim()) {
      return res.status(400).json({ detail: "Укажите имя и контакт" });
    }
    if (!isValidContact(payload.contact)) {
      return res.status(400).json({ detail: "Укажите телефон (+7 …) или email" });
    }
    await notifyAdmin(payload);
    return res.status(200).json({ ok: true });
  } catch (e) {
    const status = e.status || 500;
    return res.status(status).json({ detail: e.message || "Server error" });
  }
}
