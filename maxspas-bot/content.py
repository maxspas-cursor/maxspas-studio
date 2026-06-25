"""Тексты и клавиатуры бота MAXSPAS Studio."""

from __future__ import annotations

from aiogram.types import (
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    KeyboardButton,
    ReplyKeyboardMarkup,
)

CHANNEL_URL = "https://t.me/maxspas_studio"
PERSONAL_URL = "https://t.me/Maxspas"
SITE_URL = "https://maxspas.ru"
PHONE = "+7 (911) 715-60-06"
EMAIL = "maxspas@bk.ru"

WELCOME = (
    "<b>MAXSPAS Studio</b> · демо-бот студии\n\n"
    "Здесь собраны типовые функции, которые мы делаем в Telegram-ботах под ключ:\n"
    "меню, заявки, калькулятор, FAQ, приём файлов, статусы и уведомления админу.\n\n"
    "Выберите раздел в меню или команду из списка /help"
)

HELP = (
    "<b>Команды бота</b>\n\n"
    "/start — главное меню\n"
    "/menu — меню разделов\n"
    "/services — услуги студии\n"
    "/prices — прайс\n"
    "/calc — калькулятор стоимости\n"
    "/capabilities — что умеем в ботах (каталог)\n"
    "/portfolio — наши работы\n"
    "/order — заявка по шагам\n"
    "/faq — частые вопросы\n"
    "/status — демо статуса заказа\n"
    "/3d — 3D GRBNK\n"
    "/contacts — контакты\n"
    "/channel — канал студии\n"
    "/site — сайт maxspas.ru\n"
    "/help — эта справка"
)

SERVICES = (
    "<b>Услуги MAXSPAS Studio</b>\n\n"
    "<b>1. Сайты и лендинги</b> — от 2 000 ₽ · 3–5 дней\n"
    "Визитка, лендинг, формы заявок, SEO-база, адаптив.\n\n"
    "<b>2. Telegram-боты</b> — от 1 500 ₽ · 3–7 дней\n"
    "Меню, заявки, уведомления, админка, интеграция с сайтом.\n\n"
    "<b>3. Сайт + бот</b> — от 5 000 ₽ · 5–7 дней\n"
    "Комплект: сайт и все лиды в Telegram.\n\n"
    "<b>4. 3D GRBNK</b> — от 300 ₽ · 1–5 дней\n"
    "STL/OBJ, проверка на печать, low-poly, доставка по РФ."
)

PRICES = (
    "<b>Прайс (ориентир)</b>\n\n"
    "Лендинг 1 стр. — <b>2 000 ₽</b>\n"
    "Визитка — <b>2 000 ₽</b>\n"
    "Сайт — <b>2 500 ₽</b>\n"
    "Telegram-бот — <b>от 1 500 ₽</b>\n"
    "Сайт + бот — <b>от 5 000 ₽</b>\n"
    "3D-модель STL — <b>от 300 ₽</b>\n"
    "Правки после сдачи — <b>по договорённости</b>\n\n"
    "Точная цена — после брифа. Калькулятор: /calc"
)

CAPABILITIES_INTRO = (
    "<b>Что мы делаем в Telegram-ботах</b>\n"
    "Ниже — реальные модули, которые собираем под задачу клиента.\n"
    "Этот бот — живая витрина части из них."
)

CAPABILITIES: list[tuple[str, str]] = [
    ("Многоуровневое меню", "Кнопки, inline-разделы, deep links /start=…"),
    ("Приём заявок и лидов", "Текст, контакт, пересылка админу и на почту"),
    ("Пошаговые формы (FSM)", "Выбор услуги → описание → контакт → подтверждение"),
    ("Калькулятор и квизы", "Подбор пакета и ориентира по бюджету"),
    ("FAQ и база знаний", "Ответы по кнопкам без ожидания оператора"),
    ("Каталог услуг / товаров", "Карточки, цены, кнопка «Заказать»"),
    ("Запись и слоты времени", "Выбор даты/времени консультации"),
    ("Статус заказа", "Клиент видит этап: принят → в работе → готов"),
    ("Приём файлов", "STL, PDF, фото — в админку или на почту"),
    ("Уведомления админу", "Мгновенно в Telegram при новой заявке"),
    ("Интеграция с сайтом", "Форма на сайте → API → бот / CRM"),
    ("Рассылки по базе", "Акции и новости подписчикам (с согласием)"),
    ("Мультиязык RU/EN", "Переключение языка в меню"),
    ("Опросы и оценки", "NPS после заказа, сбор обратной связи"),
    ("Геолокация и адрес", "Кнопка «Отправить локацию» для доставки"),
    ("Кнопка «Поделиться контактом»", "Телефон клиента в один тап"),
    ("Платежи", "ЮKassa / Robokassa — по запросу"),
    ("Админ-команды", "Статистика, ответы клиентам, модерация"),
    ("Webhook + VPS 24/7", "Бот не зависит от вашего компьютера"),
    ("Канал + бот связка", "Подписка на канал, контент, заявки в одном месте"),
]

PORTFOLIO_ITEMS = [
    {
        "id": "site",
        "title": "maxspas.ru",
        "desc": "Сайт-визитка: 6 страниц, форма заявки, Vercel",
        "url": SITE_URL,
    },
    {
        "id": "bot",
        "title": "Этот бот",
        "desc": "Демо функций студии — меню, заявки, калькулятор",
        "url": "https://t.me/maxspas_studio_bot",
    },
    {
        "id": "3d",
        "title": "3D GRBNK",
        "desc": "Модели STL/OBJ, печать, доставка по РФ",
        "url": f"{SITE_URL}/grbnk",
    },
]

FAQ_ITEMS: list[tuple[str, str]] = [
    (
        "Сроки",
        "Лендинг — 3–5 дней, бот — 3–7 дней, сайт+бот — 5–7 дней. "
        "3D-модель — от 1 дня в зависимости от сложности.",
    ),
    (
        "Оплата",
        "Работаем как самозанятый. Обычно 50% предоплата, 50% после сдачи. "
        "Чек пришлём. Крупные проекты — поэтапно.",
    ),
    (
        "Правки",
        "В стоимость входит согласованный объём правок. "
        "После сдачи — поддержка по договорённости.",
    ),
    (
        "Хостинг бота",
        "Бот крутится на сервере (VPS) или облаке — работает 24/7. "
        "Настраиваем и передаём доступ.",
    ),
    (
        "Сайт + бот",
        "Заявка с сайта приходит в Telegram и на почту. "
        "Один комплект — одна студия, без разрозненных подрядчиков.",
    ),
    (
        "3D печать",
        "Готовим STL, проверяем на печать, можем напечатать и отправить по РФ. "
        "Пришлите фото/эскиз или файл.",
    ),
    (
        "География",
        "Сайты и боты — онлайн по всему миру. "
        "3D GRBNK — Горбунки и доставка по России.",
    ),
    (
        "Конфиденциальность",
        "Данные заявок не передаём третьим лицам. "
        "Используем только для связи по проекту.",
    ),
]

CALC_OPTIONS: dict[str, tuple[str, str]] = {
    "landing": ("Лендинг 1 стр.", "2 000 ₽ · 3–5 дней"),
    "vizitka": ("Визитка", "2 000 ₽ · 3–5 дней"),
    "site": ("Сайт", "2 500 ₽ · 4–6 дней"),
    "bot": ("Telegram-бот", "от 1 500 ₽ · 3–7 дней"),
    "bundle": ("Сайт + бот", "от 5 000 ₽ · 5–7 дней"),
    "3d": ("3D GRBNK", "от 300 ₽ · 1–5 дней"),
}

ORDER_SERVICES = [
    ("web", "Сайт / лендинг"),
    ("bot", "Telegram-бот"),
    ("bundle", "Сайт + бот"),
    ("3d", "3D GRBNK"),
    ("other", "Другое"),
]

STATUS_DEMO = (
    "<b>Демо: статус заказа</b>\n\n"
    "Заказ <code>#MS-2406</code>\n"
    "Услуга: Сайт + бот\n\n"
    "✅ Заявка принята\n"
    "✅ Бриф согласован\n"
    "🔄 Вёрстка и бот — <b>в работе</b>\n"
    "⏳ Тест и публикация\n"
    "⏳ Сдача проекта\n\n"
    "<i>В боевом боте клиент видит актуальный этап из админки.</i>"
)

TEXT_3D = (
    "<b>3D GRBNK</b>\n\n"
    "Модели для FDM/SLA-печати, low-poly, визуализация.\n"
    "Форматы: STL · OBJ · GLB\n\n"
    "Пришлите файл или опишите задачу — оценим срок и цену.\n"
    "Можно приложить фото/чертёж документом в чат."
)

CONTACTS = (
    "<b>Контакты</b>\n\n"
    f"Telegram: {PERSONAL_URL}\n"
    f"Бот: https://t.me/maxspas_studio_bot\n"
    f"Канал: {CHANNEL_URL}\n"
    f"Сайт: {SITE_URL}\n"
    f"Телефон: {PHONE}\n"
    f"Почта: {EMAIL}\n"
    "Горбунки, ЛО · работаем онлайн"
)


def main_reply_kb() -> ReplyKeyboardMarkup:
    return ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(text="📋 Меню"), KeyboardButton(text="🧮 Калькулятор")],
            [KeyboardButton(text="⚡ Возможности ботов"), KeyboardButton(text="📁 Портфолио")],
            [KeyboardButton(text="📝 Заявка"), KeyboardButton(text="❓ FAQ")],
            [KeyboardButton(text="🧊 3D GRBNK"), KeyboardButton(text="📞 Контакты")],
        ],
        resize_keyboard=True,
    )


def main_inline_kb() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(text="Услуги", callback_data="nav:services"),
                InlineKeyboardButton(text="Прайс", callback_data="nav:prices"),
            ],
            [
                InlineKeyboardButton(text="Калькулятор", callback_data="nav:calc"),
                InlineKeyboardButton(text="Возможности", callback_data="nav:cap"),
            ],
            [
                InlineKeyboardButton(text="Портфолио", callback_data="nav:portfolio"),
                InlineKeyboardButton(text="Заявка", callback_data="nav:order"),
            ],
            [
                InlineKeyboardButton(text="FAQ", callback_data="nav:faq"),
                InlineKeyboardButton(text="Статус заказа", callback_data="nav:status"),
            ],
            [
                InlineKeyboardButton(text="Канал", url=CHANNEL_URL),
                InlineKeyboardButton(text="Сайт", url=SITE_URL),
            ],
        ]
    )


def calc_inline_kb() -> InlineKeyboardMarkup:
    rows = [
        [InlineKeyboardButton(text=title, callback_data=f"calc:{key}")]
        for key, (title, _) in CALC_OPTIONS.items()
    ]
    rows.append([InlineKeyboardButton(text="← Меню", callback_data="nav:menu")])
    return InlineKeyboardMarkup(inline_keyboard=rows)


def capabilities_kb(page: int = 0, per_page: int = 5) -> InlineKeyboardMarkup:
    total = len(CAPABILITIES)
    start = page * per_page
    chunk = CAPABILITIES[start : start + per_page]
    rows = [
        [InlineKeyboardButton(text=f"· {name}", callback_data=f"capinfo:{start + i}")]
        for i, (name, _) in enumerate(chunk)
    ]
    nav = []
    if start > 0:
        nav.append(InlineKeyboardButton(text="←", callback_data=f"cappage:{page - 1}"))
    if start + per_page < total:
        nav.append(InlineKeyboardButton(text="→", callback_data=f"cappage:{page + 1}"))
    if nav:
        rows.append(nav)
    rows.append([InlineKeyboardButton(text="Оставить заявку", callback_data="nav:order")])
    rows.append([InlineKeyboardButton(text="← Меню", callback_data="nav:menu")])
    return InlineKeyboardMarkup(inline_keyboard=rows)


def faq_kb() -> InlineKeyboardMarkup:
    rows = [
        [InlineKeyboardButton(text=q, callback_data=f"faq:{i}")]
        for i, (q, _) in enumerate(FAQ_ITEMS)
    ]
    rows.append([InlineKeyboardButton(text="← Меню", callback_data="nav:menu")])
    return InlineKeyboardMarkup(inline_keyboard=rows)


def portfolio_kb() -> InlineKeyboardMarkup:
    rows = [
        [InlineKeyboardButton(text=item["title"], url=item["url"])]
        for item in PORTFOLIO_ITEMS
    ]
    rows.append([InlineKeyboardButton(text="← Меню", callback_data="nav:menu")])
    return InlineKeyboardMarkup(inline_keyboard=rows)


def order_service_kb() -> InlineKeyboardMarkup:
    rows = [
        [InlineKeyboardButton(text=label, callback_data=f"order_svc:{key}")]
        for key, label in ORDER_SERVICES
    ]
    rows.append([InlineKeyboardButton(text="Отмена", callback_data="order_cancel")])
    return InlineKeyboardMarkup(inline_keyboard=rows)


def order_contact_kb() -> ReplyKeyboardMarkup:
    return ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(text="📱 Отправить телефон", request_contact=True)],
            [KeyboardButton(text="❌ Отменить заявку")],
        ],
        resize_keyboard=True,
        one_time_keyboard=True,
    )


def back_menu_kb() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[[InlineKeyboardButton(text="← Главное меню", callback_data="nav:menu")]]
    )
