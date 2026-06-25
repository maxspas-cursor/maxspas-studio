# Почта заявок → maxspas@bk.ru

Почту на домене **не используем** — заявки идут в Telegram и на **maxspas@bk.ru**.

## Отправка писем с формы (Resend)

1. https://resend.com/signup → API Key  
2. Vercel → `maxspas-studio` → Environment Variables:

| Переменная | Значение |
|------------|----------|
| `RESEND_API_KEY` | ключ Resend |
| `LEAD_EMAIL_TO` | `maxspas@bk.ru` |
| `LEAD_EMAIL_FROM` | `MAXSPAS Studio <onboarding@resend.dev>` |

3. `npx vercel deploy --prod --scope maxspas-studio`

Без Resend форма всё равно шлёт в **Telegram**.

## DNS: лишняя MX-запись (если добавляли)

REG.RU → maxspas.ru → DNS → удалите записи **MX** на `mx1.hosting.reg.ru` / `mx2.hosting.reg.ru`, если ящик на домене не создавали.  
Оставьте только **A** и **CNAME** для Vercel.
