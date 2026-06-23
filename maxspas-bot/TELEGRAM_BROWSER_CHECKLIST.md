# Чеклист настройки Telegram в браузере

Бот: **@maxspas_studio_bot** · Канал: **@maxspas_studio**

Откройте [web.telegram.org](https://web.telegram.org) или Telegram Desktop и пройдите шаги по порядку.

---

## 1. @BotFather — профиль бота

> **Уже через Bot API:** описание, короткое «about» и команды `/start`, `/help` выставлены скриптом. Остаётся вручную: аватар (Edit Botpic) при желании.

1. Откройте [@BotFather](https://t.me/BotFather)
2. `/mybots` → выберите **MAXSPAS Studio** (или ваш бот)
3. **Edit Bot**:
   - **Edit Name** — `MAXSPAS Studio` (если ещё не так)
   - **Edit Description** — кратко: сайты, Telegram-боты, 3D GRBNK, заявки с сайта
   - **Edit About** — одна строка: «Заявки с maxspas-studio · канал @maxspas_studio»
   - **Edit Botpic** — загрузите логотип (можно `assets/logo.svg` с сайта, экспорт в PNG)
4. **Edit Commands** — вставьте:
   ```
   start - Начать и узнать об услугах
   help - Справка по боту
   ```

---

## 2. Первый контакт с ботом (обязательно)

1. Откройте [@maxspas_studio_bot](https://t.me/maxspas_studio_bot)
2. Нажмите **Start** или отправьте `/start`
3. На компьютере в папке `maxspas-bot` выполните:
   ```powershell
   python get_admin_id.py
   ```
   Скрипт запишет ваш `ADMIN_CHAT_ID` в `.env`
4. Запустите бота: `python bot.py` или `.\run_bot.ps1`

**Если скрипт не сработал:** откройте [@userinfobot](https://t.me/userinfobot), отправьте любое сообщение — скопируйте **Id** и вручную в `.env`:
```
ADMIN_CHAT_ID=123456789
```

---

## 3. Канал @maxspas_studio (рекомендуется)

1. Откройте [@maxspas_studio](https://t.me/maxspas_studio)
2. **Управление каналом** → **Администраторы** → **Добавить администратора**
3. Найдите `@maxspas_studio_bot` и добавьте (права: публикация постов — по желанию)
4. Оформите канал: описание, аватар, закреплённый пост со ссылкой на бота

---

## 4. Проверка интеграции с сайтом

1. Запустите сайт: `serve.bat` в корне maxspas-studio
2. Откройте **Контакты** → заполните форму → **Отправить в Telegram**
3. Должен открыться чат с ботом и готовым текстом заявки
4. Сообщение должно прийти вам (админу), если бот запущен и `ADMIN_CHAT_ID` задан

---

## 5. Если токен не работает

В @BotFather: `/mybots` → ваш бот → **API Token** → **Revoke current token** → скопируйте новый токен в `maxspas-bot/.env` как `BOT_TOKEN=...`

Не коммитьте `.env` в git.

---

## Быстрые ссылки

| Что | Ссылка |
|-----|--------|
| Бот (заявки) | https://t.me/maxspas_studio_bot |
| Канал | https://t.me/maxspas_studio |
| Личный TG | https://t.me/Maxspas |
| BotFather | https://t.me/BotFather |
| User ID | https://t.me/userinfobot |
