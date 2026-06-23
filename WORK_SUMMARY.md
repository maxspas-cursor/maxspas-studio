# MAXSPAS Studio — итоговая выжимка

**Дата:** 23.06.2026 · **Проекты:** `maxspas-studio` (сайт + бот) · `grbnk-sales-hub` (CRM)

---

## Что сделано

### Сайт MAXSPAS Studio (`C:\Users\MAXSPAS\Projects\maxspas-studio`)

| Страница | Файл | Назначение |
|----------|------|------------|
| Главная | `index.html` | Hero, услуги, CTA |
| Услуги | `services.html` | Карточки из `config/site.json` |
| Работы | `works.html` | Портфолио — 3 демо-кейса |
| Цены | `prices.html` | Прайс-лист |
| 3D GRBNK | `grbnk.html` | Направление 3D-печати |
| Контакты | `contacts.html` | Бот, канал, телефон, форма |

- **Конфиг:** `config/site.json` — бренд, контакты, услуги, аккаунты
- **Вёрстка:** `css/style.css`, `js/layout.js` (шапка, футер, форма → deep link в бота)
- **Логотипы:** `assets/logo.svg`, `assets/logo-wordmark.svg`
- **Запуск:** двойной клик `serve.bat` → http://localhost:5500 (проверено: все 6 страниц отдают 200)

**Контакты на сайте:**
- Бот заявок: [@maxspas_studio_bot](https://t.me/maxspas_studio_bot)
- Канал: [@maxspas_studio](https://t.me/maxspas_studio)
- Личный TG: [@Maxspas](https://t.me/Maxspas)
- Телефон: +7 (911) 715-60-06 · Горбунки

Форма на «Контактах» открывает чат с ботом и подставляет текст заявки (`?text=...`).

### Telegram-бот (`maxspas-studio/maxspas-bot/`)

| Файл | Назначение |
|------|------------|
| `bot.py` | aiogram 3: /start, /help, пересылка сообщений админу |
| `get_admin_id.py` | Ожидает /start и пишет `ADMIN_CHAT_ID` в `.env` |
| `run_bot.ps1` | Запуск с проверкой `.env` |
| `.env` | `BOT_TOKEN` (валиден) · `ADMIN_CHAT_ID` — **ещё не задан** |
| `TELEGRAM_BROWSER_CHECKLIST.md` | Ручные шаги в Telegram (канал, BotFather, аватар) |
| `SETUP_NOW.txt` | 3 быстрых шага для вас |

**Через Bot API (автоматически):**
- `getMe` → бот **@maxspas_studio_bot** (имя: MAXSPAS Studio)
- `setMyDescription` / `setMyShortDescription` — описание профиля
- `setMyCommands` — start, help
- `site.json` и `layout.js` синхронизированы с ботом

**Бот не запущен** — нет `ADMIN_CHAT_ID` (нужен ваш /start в боте).

### CRM GRBNK Sales Hub (`C:\Users\MAXSPAS\Projects\grbnk-sales-hub`)

| Что | Путь |
|-----|------|
| Схема БД | `data/schema.sql` |
| Сиды | `data/seed.sql` (исправлен, БД пересоздана) |
| Статус аккаунтов | `data/ACCOUNTS_STATUS.md` |
| CLI | `manage.py` |
| База | `data/sales.db` |

В сидах: канал @maxspas_studio и бот @maxspas_studio_bot — **active**; Авито/VK — active без URL; Kwork/Cults3D — planned.

```powershell
cd C:\Users\MAXSPAS\Projects\grbnk-sales-hub
python manage.py init      # пересоздать БД
python manage.py dashboard # сводка
python manage.py accounts  # аккаунты
```

### Брендинг

- Название: **MAXSPAS Studio** + суббренд **3D GRBNK**
- Гео: сайты/боты — весь мир; 3D — Горбунки и доставка по РФ
- Самозанятость: да (указано на сайте)

---

## Как открыть и запустить

```powershell
# Сайт
cd C:\Users\MAXSPAS\Projects\maxspas-studio
.\serve.bat
# → http://localhost:5500

# Бот (после ADMIN_CHAT_ID)
cd maxspas-bot
pip install -r requirements.txt
python get_admin_id.py    # сначала /start в боте
python bot.py             # или .\run_bot.ps1

# CRM
cd C:\Users\MAXSPAS\Projects\grbnk-sales-hub
python manage.py dashboard
```

---

## Готово vs ожидает

| Готово | Ожидает |
|--------|---------|
| 6 страниц сайта, serve.bat | Домен и email |
| Конфиг контактов (бот, канал, телефон) | Ссылки Авито и VK в CRM/сайт |
| Бот: токен, описание, команды API | `ADMIN_CHAT_ID` + запуск `bot.py` |
| Форма → deep link в бота | Добавить бота админом канала (вручную) |
| CRM: сиды, канал, бот в accounts | Кейсы в `portfolio` / works.html |
| Логотипы SVG | 3D-модели, Cults3D/Sketchfab |
| Чеклисты Telegram | Демо-кейсы для рекламы |

---

## Безопасность

1. **Не коммитьте** `maxspas-bot/.env` (уже в `.gitignore`).
2. Токен бота мог попасть в логи/чат — **перевыпустите** в [@BotFather](https://t.me/BotFather): API Token → Revoke → новый токен в `.env`.
3. Не публикуйте токен в скриншотах и репозитории.

---

## 5 шагов при возвращении

1. **Telegram:** откройте [@maxspas_studio_bot](https://t.me/maxspas_studio_bot) → `/start` → в `maxspas-bot` выполните `python get_admin_id.py` → `python bot.py`.
2. **Канал:** в [@maxspas_studio](https://t.me/maxspas_studio) добавьте бота администратором (см. `maxspas-bot/TELEGRAM_BROWSER_CHECKLIST.md`).
3. **Проверка:** `serve.bat` → Контакты → форма → заявка в боте → уведомление вам (если бот запущен).
4. **Ссылки:** пришлите URL Авито и VK — обновим `config/site.json` и CRM.
5. **Токен:** отзовите старый токен в BotFather, вставьте новый в `.env`.

---

## Полезные ссылки

| Ресурс | URL |
|--------|-----|
| Бот (заявки) | https://t.me/maxspas_studio_bot |
| Канал | https://t.me/maxspas_studio |
| Личный TG | https://t.me/Maxspas |
| BotFather | https://t.me/BotFather |
| User ID (запасной способ) | https://t.me/userinfobot |

---

*Файл создан автоматически. Детали аккаунтов: `grbnk-sales-hub/data/ACCOUNTS_STATUS.md`*
