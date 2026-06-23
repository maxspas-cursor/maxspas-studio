# Vercel — пошагово для maxspas.ru

Репозиторий уже на GitHub: **https://github.com/maxspas-cursor/maxspas-studio**

Домены:
- **maxspas.ru** — основной (подключаем сейчас)
- **maxspas.online** — на будущее (пока не трогаем)

---

## Шаг 1. Откройте Vercel

https://vercel.com/new

(или Dashboard → **Add New…** → **Project**)

---

## Шаг 2. Найдите репозиторий

Ищите: **`maxspas-cursor/maxspas-studio`**

### Не видите репозиторий?

1. На странице Import нажмите **Adjust GitHub App Permissions** (или Configure GitHub App)
2. Выберите аккаунт **maxspas-cursor**
3. Дайте доступ к репозиторию **maxspas-studio**
4. Обновите страницу — репозиторий появится

---

## Шаг 3. Настройки перед Deploy

| Поле | Значение |
|------|----------|
| Framework Preset | **Other** |
| Root Directory | `./` (по умолчанию) |
| Build Command | оставить **пустым** |
| Output Directory | оставить **пустым** |

Раскройте **Environment Variables** и добавьте **две** переменные (значения из файла `maxspas-bot\.env` на вашем ПК):

| Name | Value |
|------|--------|
| `BOT_TOKEN` | строка после `BOT_TOKEN=` |
| `ADMIN_CHAT_ID` | число после `ADMIN_CHAT_ID=` |

Галочки: **Production**, **Preview**, **Development** — все три.

---

## Шаг 4. Deploy

Нажмите **Deploy**. Подождите 1–2 минуты.

Появится ссылка: `https://maxspas-studio-xxxxx.vercel.app`

Проверка:
- Сайт открывается
- `https://ВАША-ССЫЛКА.vercel.app/api/health` → `{"ok":true}`

---

## Шаг 5. Привязать maxspas.ru

1. Vercel → ваш проект → **Settings** → **Domains**
2. Введите: `maxspas.ru` → **Add**
3. Введите: `www.maxspas.ru` → **Add**
4. Vercel покажет DNS-записи — скопируйте их

### В REG.RU

1. https://www.reg.ru/user/account/ → **Домены** → **maxspas.ru**
2. **DNS-серверы и управление зоной** (или «Управление зоной DNS»)
3. Удалите старые записи на хостинг REG.RU (A на IP хостинга), если есть
4. Добавьте записи **как в Vercel** (пример, уточните в панели Vercel):

| Тип | Имя | Значение |
|-----|-----|----------|
| **A** | `@` | `76.76.21.21` |
| **CNAME** | `www` | `cname.vercel-dns.com` |

5. Сохраните. Подождите 15–60 минут.

Сайт откроется по **https://maxspas.ru**

---

## Шаг 6. Хостинг REG.RU

Пробный хостинг **не продлевайте** — сайт на Vercel, домен остаётся в REG.RU.

---

## Если застряли

Напишите в чат:
1. Видите ли репозиторий `maxspas-studio` в Vercel
2. Ссылку после Deploy (`*.vercel.app`)
3. Скрин или текст ошибки из REG.RU DNS

Я подскажу дальше.
