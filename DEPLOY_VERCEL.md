# Деплой MAXSPAS Studio на Vercel + домен REG.RU

## Что уже в проекте

- Статический сайт (HTML/CSS/JS)
- `api/lead.js` — заявки с формы → Telegram (на Vercel)
- Локально форма по-прежнему идёт на `http://127.0.0.1:8787` (бот + `lead_api.py`)
- Telegram-бот (`maxspas-bot/`) — **отдельно**, на Vercel не крутится

## 1. GitHub

```bash
cd maxspas-studio
git init
git add .
git commit -m "MAXSPAS Studio site + Vercel API"
```

Создайте репозиторий на github.com (например `maxspas-studio`), затем:

```bash
git remote add origin https://github.com/ВАШ_ЛОГИН/maxspas-studio.git
git push -u origin master
```

## 2. Vercel

1. [vercel.com](https://vercel.com) → Sign Up → **Continue with GitHub**
2. **Add New Project** → Import репозиторий `maxspas-studio`
3. Framework Preset: **Other** (корень — статика)
4. **Environment Variables** (Production + Preview):

| Имя | Значение |
|-----|----------|
| `BOT_TOKEN` | токен от @BotFather |
| `ADMIN_CHAT_ID` | ваш числовой chat id |

5. **Deploy** → получите `https://maxspas-studio.vercel.app`

Проверка: `https://ВАШ-ПРОЕКТ.vercel.app/api/health` → `{"ok":true}`

## 3. Домен REG.RU

1. Vercel → Project → **Settings → Domains** → Add `ваш-домен.ru` и `www.ваш-домен.ru`
2. REG.RU → Домены → ваш домен → **DNS-серверы и зона**
3. Добавьте записи **как показывает Vercel** (обычно):

| Тип | Имя | Значение |
|-----|-----|----------|
| A | `@` | `76.76.21.21` |
| CNAME | `www` | `cname.vercel-dns.com` |

4. Подождите 10–60 минут. SSL включится автоматически.

## 4. Хостинг REG.RU

Пробный хостинг **можно не продлевать** — сайт живёт на Vercel, домен остаётся в REG.RU.

## 5. Telegram-бот 24/7

Варианты:

- Запуск на ПК: `maxspas-bot\run_all.ps1` (только форма работает на Vercel без бота)
- Бесплатно: Oracle Cloud Free VM
- ~200 ₽/мес: минимальный VPS

Бот и форма на Vercel **независимы**: форма шлёт в Telegram напрямую через `api/lead.js`.

## Локальная разработка

```bat
serve.bat
```

Форма → локальный API. На продакшене → `/api/lead` на том же домене.
