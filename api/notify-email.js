/** Send lead copy to mailbox (Resend HTTP API). */

function buildLeadPlain(payload) {
  const when = new Date().toLocaleString("ru-RU", { timeZone: "Europe/Moscow" });
  const lines = [
    "Новая заявка с сайта maxspas.ru",
    "",
    `Имя: ${payload.name}`,
    `Контакт: ${payload.contact}`,
  ];
  if (payload.company?.trim()) lines.push(`Компания: ${payload.company.trim()}`);
  lines.push(`Услуга: ${payload.service || "не указана"}`);
  if (payload.budget?.trim()) lines.push(`Бюджет: ${payload.budget.trim()}`);
  if (payload.deadline?.trim()) lines.push(`Срок: ${payload.deadline.trim()}`);
  lines.push(`Сообщение:\n${payload.message || "—"}`);
  if (payload.page?.trim()) lines.push(`Страница: ${payload.page.trim()}`);
  if (payload.referrer?.trim()) lines.push(`Откуда: ${payload.referrer.trim()}`);
  lines.push(`Время: ${when}`);
  return lines.join("\n");
}

export async function notifyEmail(payload) {
  const apiKey = process.env.RESEND_API_KEY || "";
  const to = (process.env.LEAD_EMAIL_TO || "maxspas@bk.ru").trim();
  if (!apiKey || !to) return;

  const from =
    process.env.LEAD_EMAIL_FROM || "MAXSPAS Studio <onboarding@resend.dev>";
  const cc = (process.env.LEAD_EMAIL_CC || "").trim();
  const body = {
    from,
    to: [to],
    subject: `Заявка с maxspas.ru: ${String(payload.name).trim()}`,
    text: buildLeadPlain(payload),
  };
  if (cc) body.cc = [cc];

  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    let detail = "Email send failed";
    try {
      const data = await resp.json();
      detail = data.message || data.error || detail;
    } catch {
      /* ignore */
    }
    const err = new Error(detail);
    err.status = 502;
    throw err;
  }
}
