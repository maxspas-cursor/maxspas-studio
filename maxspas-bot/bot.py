"""MAXSPAS Studio Telegram bot — leads, menu, branded messages."""

from __future__ import annotations

import asyncio
import logging
import os
import sys

from aiogram import Bot, Dispatcher, F, Router
from aiogram.enums import ParseMode
from aiogram.filters import Command, CommandStart
from aiogram.types import KeyboardButton, Message, ReplyKeyboardMarkup, ReplyKeyboardRemove
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

BOT_TOKEN = os.getenv("BOT_TOKEN")
ADMIN_CHAT_ID_RAW = os.getenv("ADMIN_CHAT_ID", "").strip()

CHANNEL_URL = "https://t.me/maxspas_studio"
PERSONAL_URL = "https://t.me/Maxspas"
PHONE = "+7 (911) 715-60-06"

router = Router()

WELCOME_TEXT = (
    "<b>MAXSPAS Studio</b>\n\n"
    "Сайты, Telegram-боты и 3D GRBNK под ключ.\n"
    "Горбунки · работаем онлайн по всему миру.\n\n"
    "<b>Услуги:</b>\n"
    "• Сайты и лендинги — от 8 000 ₽\n"
    "• Telegram-боты — от 5 000 ₽\n"
    "• Сайт + бот — от 18 000 ₽\n"
    "• 3D-модели GRBNK — от 300 ₽\n\n"
    "Напишите, что вам нужно — ответим в ближайшее время."
)

HELP_TEXT = (
    "<b>Команды</b>\n"
    "/start — главное меню\n"
    "/services — услуги и цены\n"
    "/channel — наш канал\n"
    "/help — эта справка\n\n"
    "Или просто напишите сообщение — это заявка."
)

SERVICES_TEXT = (
    "<b>Услуги MAXSPAS Studio</b>\n\n"
    "<b>1. Сайты и лендинги</b> — от 8 000 ₽\n"
    "Визитка, лендинг, форма заявки на сайте → уведомление в Telegram. 3–5 дней.\n\n"
    "<b>2. Telegram-боты</b> — от 5 000 ₽\n"
    "Запись, заявки, уведомления. 3–7 дней.\n\n"
    "<b>3. Сайт + бот</b> — от 18 000 ₽\n"
    "Комплект под ключ. 5–7 дней.\n\n"
    "<b>4. 3D GRBNK</b> — от 300 ₽\n"
    "STL для печати, ассеты, паки моделей.\n\n"
    f"Канал: {CHANNEL_URL}\n"
    f"Лично: {PERSONAL_URL}"
)


def admin_chat_id() -> int | None:
    if not ADMIN_CHAT_ID_RAW:
        return None
    try:
        return int(ADMIN_CHAT_ID_RAW)
    except ValueError:
        return None


def reply_kb() -> ReplyKeyboardMarkup:
    return ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(text="Услуги и цены"), KeyboardButton(text="Наш канал")],
            [KeyboardButton(text="Написать @Maxspas"), KeyboardButton(text="Позвонить")],
            [KeyboardButton(text="3D GRBNK")],
        ],
        resize_keyboard=True,
    )


@router.message(CommandStart())
async def cmd_start(message: Message) -> None:
    deep = ""
    if message.text:
        parts = message.text.split(maxsplit=1)
        if len(parts) > 1:
            deep = parts[1].strip().lower()
    if deep in ("3d", "grbnk", "3dgrbnk"):
        await btn_3d(message)
        return
    await message.answer(
        WELCOME_TEXT,
        parse_mode=ParseMode.HTML,
        reply_markup=reply_kb(),
    )


@router.message(Command("help"))
async def cmd_help(message: Message) -> None:
    await message.answer(HELP_TEXT, parse_mode=ParseMode.HTML, reply_markup=reply_kb())


@router.message(Command("services"))
async def cmd_services(message: Message) -> None:
    await message.answer(SERVICES_TEXT, parse_mode=ParseMode.HTML, reply_markup=reply_kb())


@router.message(Command("channel"))
async def cmd_channel(message: Message) -> None:
    await message.answer(
        f"<b>Наш канал</b>\n{CHANNEL_URL}\n\nПортфолио, новости, 3D GRBNK.",
        parse_mode=ParseMode.HTML,
        reply_markup=reply_kb(),
    )


@router.message(F.text == "Услуги и цены")
async def btn_services(message: Message) -> None:
    await cmd_services(message)


@router.message(F.text == "Наш канал")
async def btn_channel(message: Message) -> None:
    await cmd_channel(message)


@router.message(F.text == "Написать @Maxspas")
async def btn_personal(message: Message) -> None:
    await message.answer(
        f"Личный Telegram: {PERSONAL_URL}",
        reply_markup=reply_kb(),
    )


@router.message(F.text == "Позвонить")
async def btn_phone(message: Message) -> None:
    await message.answer(f"Телефон: {PHONE}", reply_markup=reply_kb())


@router.message(F.text == "3D GRBNK")
async def btn_3d(message: Message) -> None:
    await message.answer(
        "<b>3D GRBNK</b>\nМодели для 3D-печати и визуализации.\n"
        "Напишите, что нужно — подберём формат и цену.",
        parse_mode=ParseMode.HTML,
        reply_markup=reply_kb(),
    )


@router.message(F.text & ~F.text.startswith("/"))
async def handle_lead(message: Message) -> None:
    aid = admin_chat_id()
    user = message.from_user
    name = (user.full_name if user else "—") or "—"
    username = f"@{user.username}" if user and user.username else "без username"
    uid = user.id if user else "—"
    text = message.text or ""

    if aid:
        try:
            await message.bot.send_message(
                aid,
                "<b>Новая заявка</b>\n\n"
                f"<b>От:</b> {name} ({username})\n"
                f"<b>ID:</b> <code>{uid}</code>\n\n"
                f"<b>Сообщение:</b>\n{text}",
                parse_mode=ParseMode.HTML,
            )
        except Exception as exc:
            logger.exception("Failed to notify admin: %s", exc)

    await message.answer(
        "✅ <b>Заявка отправлена!</b>\n\n"
        "Мы получили ваше сообщение и ответим в Telegram.\n"
        "Обычно — в течение нескольких часов.",
        parse_mode=ParseMode.HTML,
        reply_markup=reply_kb(),
    )


async def main() -> None:
    if not BOT_TOKEN:
        logger.error("BOT_TOKEN is missing. Copy .env.example to .env and set the token.")
        sys.exit(1)

    bot = Bot(token=BOT_TOKEN)
    dp = Dispatcher()
    dp.include_router(router)

    me = await bot.get_me()
    logger.info("MAXSPAS Studio bot started as @%s (id=%s)", me.username, me.id)
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())
