# Канал @maxspas_studio — 2 минуты в Telegram Web

Аватары уже сгенерированы в стиле сайта (фиолетовый / оранжевый / cyan):

- Бот: `maxspas-bot/assets/brand/bot_avatar.png`
- Канал: `maxspas-bot/assets/brand/channel_avatar.png`
- Текст поста: `maxspas-bot/assets/brand/channel_welcome_post.txt`

## 1. Оформить канал

1. Откройте https://t.me/maxspas_studio
2. Название: **MAXSPAS Studio · 3D GRBNK**
3. Описание: *Сайты, Telegram-боты и 3D-модели под ключ. Портфолио и новости.*
4. Аватар: загрузите `channel_avatar.png`
5. Опубликуйте текст из `channel_welcome_post.txt` и **закрепите**

## 2. Добавить бота админом (чтобы авто-посты работали)

1. Канал → Управление → Администраторы → Добавить
2. Найдите **@maxspas_studio_bot**
3. Права: **Изменение профиля канала** + **Публикация сообщений**
4. После этого запустите:

```powershell
cd C:\Users\MAXSPAS\Projects\maxspas-studio\maxspas-bot
python setup_telegram_branding.py
```

Скрипт сам поставит аватар, описание и закрепит приветственный пост.

## 3. Запустить бота заявок

1. Напишите боту https://t.me/maxspas_studio_bot → **/start**
2. В папке maxspas-bot:

```powershell
python finish_setup.py
python bot.py
```

---

Бот уже оформлен через API: имя **MAXSPAS Studio**, описание услуг, команды /start /services /channel /help, красивое меню с кнопками.
