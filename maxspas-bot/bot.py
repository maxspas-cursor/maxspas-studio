"""MAXSPAS Studio Telegram bot — showcase + leads."""

from __future__ import annotations

import asyncio
import logging
import os
import sys
from datetime import datetime, timezone

from aiogram import Bot, Dispatcher, F, Router
from aiogram.enums import ParseMode
from aiogram.filters import Command, CommandStart, StateFilter
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.fsm.storage.memory import MemoryStorage
from aiogram.types import BotCommand, CallbackQuery, InlineKeyboardButton, InlineKeyboardMarkup, Message
from dotenv import load_dotenv

import content as C

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

BOT_TOKEN = os.getenv("BOT_TOKEN")
ADMIN_CHAT_ID_RAW = os.getenv("ADMIN_CHAT_ID", "").strip()

router = Router()

_stats = {"starts": 0, "leads": 0, "orders": 0, "files": 0}


class OrderForm(StatesGroup):
    service = State()
    description = State()
    contact = State()


def admin_chat_id() -> int | None:
    if not ADMIN_CHAT_ID_RAW:
        return None
    try:
        return int(ADMIN_CHAT_ID_RAW)
    except ValueError:
        return None


async def notify_admin(bot: Bot, text: str) -> None:
    aid = admin_chat_id()
    if not aid:
        return
    try:
        await bot.send_message(aid, text, parse_mode=ParseMode.HTML)
    except Exception as exc:
        logger.exception("Failed to notify admin: %s", exc)


async def send_menu(message: Message, *, edit: bool = False) -> None:
    text = C.WELCOME
    markup = C.main_inline_kb()
    if edit and message.message_id:
        await message.edit_text(text, parse_mode=ParseMode.HTML, reply_markup=markup)
    else:
        await message.answer(
            text,
            parse_mode=ParseMode.HTML,
            reply_markup=C.main_reply_kb(),
        )
        await message.answer("Быстрые кнопки ↓", reply_markup=markup)


async def setup_commands(bot: Bot) -> None:
    commands = [
        BotCommand(command="start", description="Главное меню"),
        BotCommand(command="menu", description="Разделы"),
        BotCommand(command="services", description="Услуги"),
        BotCommand(command="prices", description="Прайс"),
        BotCommand(command="calc", description="Калькулятор"),
        BotCommand(command="capabilities", description="Возможности ботов"),
        BotCommand(command="portfolio", description="Портфолио"),
        BotCommand(command="order", description="Заявка по шагам"),
        BotCommand(command="faq", description="FAQ"),
        BotCommand(command="status", description="Демо статуса"),
        BotCommand(command="3d", description="3D GRBNK"),
        BotCommand(command="contacts", description="Контакты"),
        BotCommand(command="channel", description="Канал"),
        BotCommand(command="site", description="Сайт"),
        BotCommand(command="help", description="Справка"),
    ]
    await bot.set_my_commands(commands)


@router.message(CommandStart())
async def cmd_start(message: Message, state: FSMContext) -> None:
    await state.clear()
    _stats["starts"] += 1
    deep = ""
    if message.text:
        parts = message.text.split(maxsplit=1)
        if len(parts) > 1:
            deep = parts[1].strip().lower()
    if deep in ("3d", "grbnk", "3dgrbnk"):
        await message.answer(C.TEXT_3D, parse_mode=ParseMode.HTML, reply_markup=C.main_reply_kb())
        return
    if deep in ("web", "site", "сайт"):
        await message.answer(C.SERVICES, parse_mode=ParseMode.HTML, reply_markup=C.main_reply_kb())
        return
    if deep in ("bot", "order", "заявка"):
        await start_order(message, state)
        return
    await send_menu(message)


@router.message(Command("menu"))
@router.message(F.text == "📋 Меню")
async def cmd_menu(message: Message, state: FSMContext) -> None:
    await state.clear()
    await send_menu(message)


@router.message(Command("help"))
async def cmd_help(message: Message) -> None:
    await message.answer(C.HELP, parse_mode=ParseMode.HTML, reply_markup=C.main_reply_kb())


@router.message(Command("services"))
async def cmd_services(message: Message) -> None:
    await message.answer(C.SERVICES, parse_mode=ParseMode.HTML, reply_markup=C.back_menu_kb())


@router.message(Command("prices"))
async def cmd_prices(message: Message) -> None:
    await message.answer(C.PRICES, parse_mode=ParseMode.HTML, reply_markup=C.back_menu_kb())


@router.message(Command("calc"))
@router.message(F.text == "🧮 Калькулятор")
async def cmd_calc(message: Message) -> None:
    await message.answer(
        "<b>Калькулятор</b>\nВыберите тип проекта — покажем ориентир по цене и сроку.",
        parse_mode=ParseMode.HTML,
        reply_markup=C.calc_inline_kb(),
    )


@router.message(Command("capabilities"))
@router.message(F.text == "⚡ Возможности ботов")
async def cmd_capabilities(message: Message) -> None:
    await message.answer(
        f"{C.CAPABILITIES_INTRO}\n\nСтраница 1 · всего {len(C.CAPABILITIES)} модулей",
        parse_mode=ParseMode.HTML,
        reply_markup=C.capabilities_kb(0),
    )


@router.message(Command("portfolio"))
@router.message(F.text == "📁 Портфолио")
async def cmd_portfolio(message: Message) -> None:
    lines = ["<b>Портфолио MAXSPAS Studio</b>\n"]
    for item in C.PORTFOLIO_ITEMS:
        lines.append(f"• <b>{item['title']}</b> — {item['desc']}")
    await message.answer("\n".join(lines), parse_mode=ParseMode.HTML, reply_markup=C.portfolio_kb())


@router.message(Command("faq"))
@router.message(F.text == "❓ FAQ")
async def cmd_faq(message: Message) -> None:
    await message.answer(
        "<b>Частые вопросы</b>\nВыберите тему:",
        parse_mode=ParseMode.HTML,
        reply_markup=C.faq_kb(),
    )


@router.message(Command("status"))
async def cmd_status(message: Message) -> None:
    await message.answer(C.STATUS_DEMO, parse_mode=ParseMode.HTML, reply_markup=C.back_menu_kb())


@router.message(Command("3d"))
@router.message(F.text == "🧊 3D GRBNK")
async def cmd_3d(message: Message) -> None:
    await message.answer(C.TEXT_3D, parse_mode=ParseMode.HTML, reply_markup=C.back_menu_kb())


@router.message(Command("contacts"))
@router.message(F.text == "📞 Контакты")
async def cmd_contacts(message: Message) -> None:
    await message.answer(C.CONTACTS, parse_mode=ParseMode.HTML, reply_markup=C.back_menu_kb())


@router.message(Command("channel"))
async def cmd_channel(message: Message) -> None:
    await message.answer(
        f"<b>Канал студии</b>\n{C.CHANNEL_URL}\n\nПортфолио, новости, 3D GRBNK.",
        parse_mode=ParseMode.HTML,
        reply_markup=C.back_menu_kb(),
    )


@router.message(Command("site"))
async def cmd_site(message: Message) -> None:
    await message.answer(
        f"<b>Сайт студии</b>\n{C.SITE_URL}",
        parse_mode=ParseMode.HTML,
        reply_markup=C.back_menu_kb(),
    )


@router.message(Command("order"))
@router.message(F.text == "📝 Заявка")
async def start_order(message: Message, state: FSMContext) -> None:
    await state.set_state(OrderForm.service)
    await message.answer(
        "<b>Заявка</b> · шаг 1/3\n\nКакая услуга нужна?",
        parse_mode=ParseMode.HTML,
        reply_markup=C.order_service_kb(),
    )


@router.message(Command("admin"))
async def cmd_admin(message: Message) -> None:
    aid = admin_chat_id()
    if not aid or message.from_user is None or message.from_user.id != aid:
        return
    await message.answer(
        "<b>Админ · статистика бота</b>\n\n"
        f"Запусков /start: <b>{_stats['starts']}</b>\n"
        f"Сообщений-заявок: <b>{_stats['leads']}</b>\n"
        f"Форм заявок: <b>{_stats['orders']}</b>\n"
        f"Файлов: <b>{_stats['files']}</b>\n"
        f"Модулей в витрине: <b>{len(C.CAPABILITIES)}</b>",
        parse_mode=ParseMode.HTML,
    )


@router.callback_query(F.data == "nav:menu")
async def cb_menu(callback: CallbackQuery, state: FSMContext) -> None:
    await state.clear()
    await callback.answer()
    if callback.message:
        await send_menu(callback.message, edit=True)


@router.callback_query(F.data.startswith("nav:"))
async def cb_nav(callback: CallbackQuery, state: FSMContext) -> None:
    if not callback.message or not callback.data:
        return
    action = callback.data.split(":", 1)[1]
    if action == "menu":
        return
    await callback.answer()
    mapping = {
        "services": (C.SERVICES, C.back_menu_kb()),
        "prices": (C.PRICES, C.back_menu_kb()),
        "calc": (
            "<b>Калькулятор</b>\nВыберите тип проекта:",
            C.calc_inline_kb(),
        ),
        "cap": (
            f"{C.CAPABILITIES_INTRO}\n\nВсего {len(C.CAPABILITIES)} модулей",
            C.capabilities_kb(0),
        ),
        "portfolio": (
            "<b>Портфолио</b>\nНаши работы:",
            C.portfolio_kb(),
        ),
        "faq": ("<b>FAQ</b>\nВыберите тему:", C.faq_kb()),
        "status": (C.STATUS_DEMO, C.back_menu_kb()),
    }
    if action == "order":
        await state.set_state(OrderForm.service)
        await callback.message.answer(
            "<b>Заявка</b> · шаг 1/3\n\nКакая услуга нужна?",
            parse_mode=ParseMode.HTML,
            reply_markup=C.order_service_kb(),
        )
        return
    item = mapping.get(action)
    if not item:
        return
    text, kb = item
    await callback.message.edit_text(text, parse_mode=ParseMode.HTML, reply_markup=kb)


@router.callback_query(F.data.startswith("calc:"))
async def cb_calc(callback: CallbackQuery) -> None:
    if not callback.message or not callback.data:
        return
    key = callback.data.split(":", 1)[1]
    opt = C.CALC_OPTIONS.get(key)
    if not opt:
        await callback.answer("Не найдено")
        return
    title, price = opt
    await callback.answer()
    await callback.message.edit_text(
        f"<b>{title}</b>\n\nОриентир: <b>{price}</b>\n\n"
        "Точная смета — после брифа. Оформить заявку?",
        parse_mode=ParseMode.HTML,
        reply_markup=InlineKeyboardMarkup(
            inline_keyboard=[
                [InlineKeyboardButton(text="Оставить заявку", callback_data="nav:order")],
                [InlineKeyboardButton(text="← Калькулятор", callback_data="nav:calc")],
            ]
        ),
    )


@router.callback_query(F.data.startswith("cappage:"))
async def cb_cap_page(callback: CallbackQuery) -> None:
    if not callback.message or not callback.data:
        return
    page = int(callback.data.split(":", 1)[1])
    await callback.answer()
    await callback.message.edit_text(
        f"{C.CAPABILITIES_INTRO}\n\nСтраница {page + 1} · всего {len(C.CAPABILITIES)} модулей",
        parse_mode=ParseMode.HTML,
        reply_markup=C.capabilities_kb(page),
    )


@router.callback_query(F.data.startswith("capinfo:"))
async def cb_cap_info(callback: CallbackQuery) -> None:
    if not callback.data:
        return
    idx = int(callback.data.split(":", 1)[1])
    if idx < 0 or idx >= len(C.CAPABILITIES):
        await callback.answer()
        return
    name, desc = C.CAPABILITIES[idx]
    await callback.answer(f"{name}: {desc[:120]}", show_alert=True)


@router.callback_query(F.data.startswith("faq:"))
async def cb_faq(callback: CallbackQuery) -> None:
    if not callback.message or not callback.data:
        return
    idx = int(callback.data.split(":", 1)[1])
    q, a = C.FAQ_ITEMS[idx]
    await callback.answer()
    await callback.message.edit_text(
        f"<b>{q}</b>\n\n{a}",
        parse_mode=ParseMode.HTML,
        reply_markup=C.faq_kb(),
    )


@router.callback_query(F.data.startswith("order_svc:"))
async def cb_order_service(callback: CallbackQuery, state: FSMContext) -> None:
    if not callback.message or not callback.data:
        return
    svc = callback.data.split(":", 1)[1]
    labels = dict(C.ORDER_SERVICES)
    await state.update_data(service=svc, service_label=labels.get(svc, svc))
    await state.set_state(OrderForm.description)
    await callback.answer()
    await callback.message.edit_text(
        f"<b>Заявка</b> · шаг 2/3\n\nУслуга: <b>{labels.get(svc, svc)}</b>\n\n"
        "Опишите задачу одним сообщением:",
        parse_mode=ParseMode.HTML,
    )
    await callback.message.answer(
        "Можно отменить: /cancel",
        reply_markup=C.order_contact_kb(),
    )


@router.callback_query(F.data == "order_cancel")
async def cb_order_cancel(callback: CallbackQuery, state: FSMContext) -> None:
    await state.clear()
    await callback.answer("Отменено")
    if callback.message:
        await callback.message.edit_text("Заявка отменена.", reply_markup=C.back_menu_kb())


@router.message(Command("cancel"), StateFilter("*"))
@router.message(F.text == "❌ Отменить заявку", StateFilter("*"))
async def cancel_order(message: Message, state: FSMContext) -> None:
    await state.clear()
    await message.answer("Заявка отменена.", reply_markup=C.main_reply_kb())


@router.message(OrderForm.description, F.text)
async def order_description(message: Message, state: FSMContext) -> None:
    if message.text and message.text.startswith("/"):
        return
    await state.update_data(description=message.text)
    await state.set_state(OrderForm.contact)
    await message.answer(
        "<b>Заявка</b> · шаг 3/3\n\n"
        "Оставьте телефон текстом или нажмите кнопку ниже.",
        parse_mode=ParseMode.HTML,
        reply_markup=C.order_contact_kb(),
    )


@router.message(OrderForm.contact, F.contact)
async def order_contact_shared(message: Message, state: FSMContext) -> None:
    phone = message.contact.phone_number if message.contact else ""
    await finish_order(message, state, phone)


@router.message(OrderForm.contact, F.text)
async def order_contact_text(message: Message, state: FSMContext) -> None:
    if not message.text or message.text.startswith("/"):
        return
    await finish_order(message, state, message.text)


async def finish_order(message: Message, state: FSMContext, contact: str) -> None:
    data = await state.get_data()
    await state.clear()
    _stats["orders"] += 1

    user = message.from_user
    name = (user.full_name if user else "—") or "—"
    username = f"@{user.username}" if user and user.username else "без username"
    uid = user.id if user else "—"
    svc = data.get("service_label", "—")
    desc = data.get("description", "—")

    ts = datetime.now(timezone.utc).strftime("%d.%m.%Y %H:%M UTC")
    await notify_admin(
        message.bot,
        "<b>Заявка (форма)</b>\n\n"
        f"<b>Услуга:</b> {svc}\n"
        f"<b>Описание:</b>\n{desc}\n\n"
        f"<b>Контакт:</b> {contact}\n"
        f"<b>От:</b> {name} ({username})\n"
        f"<b>ID:</b> <code>{uid}</code>\n"
        f"<b>Время:</b> {ts}",
    )

    await message.answer(
        "✅ <b>Заявка принята!</b>\n\n"
        f"Услуга: {svc}\n"
        "Ответим в Telegram в ближайшее время.",
        parse_mode=ParseMode.HTML,
        reply_markup=C.main_reply_kb(),
    )


@router.message(F.document | F.photo)
async def handle_file(message: Message) -> None:
    _stats["files"] += 1
    user = message.from_user
    name = (user.full_name if user else "—") or "—"
    username = f"@{user.username}" if user and user.username else "без username"
    uid = user.id if user else "—"
    caption = message.caption or "без подписи"

    if message.document:
        fname = message.document.file_name or "file"
        kind = "документ"
    else:
        fname = "photo"
        kind = "фото"

    await notify_admin(
        message.bot,
        f"<b>Файл ({kind})</b>\n\n"
        f"<b>От:</b> {name} ({username})\n"
        f"<b>ID:</b> <code>{uid}</code>\n"
        f"<b>Файл:</b> {fname}\n"
        f"<b>Подпись:</b> {caption}",
    )
    aid = admin_chat_id()
    if aid:
        try:
            await message.forward(aid)
        except Exception as exc:
            logger.exception("Failed to forward file: %s", exc)

    await message.answer(
        "✅ Файл получен!\n\n"
        "Если это модель для 3D — оценим и ответим. "
        "Или опишите задачу текстом.",
        reply_markup=C.main_reply_kb(),
    )


@router.message(F.text & ~F.text.startswith("/"))
async def handle_lead(message: Message, state: FSMContext) -> None:
    current = await state.get_state()
    if current:
        return

    skip = {
        "📋 Меню",
        "🧮 Калькулятор",
        "⚡ Возможности ботов",
        "📁 Портфолио",
        "📝 Заявка",
        "❓ FAQ",
        "🧊 3D GRBNK",
        "📞 Контакты",
    }
    if message.text in skip:
        return

    _stats["leads"] += 1
    user = message.from_user
    name = (user.full_name if user else "—") or "—"
    username = f"@{user.username}" if user and user.username else "без username"
    uid = user.id if user else "—"
    text = message.text or ""

    await notify_admin(
        message.bot,
        "<b>Новая заявка</b>\n\n"
        f"<b>От:</b> {name} ({username})\n"
        f"<b>ID:</b> <code>{uid}</code>\n\n"
        f"<b>Сообщение:</b>\n{text}",
    )

    await message.answer(
        "✅ <b>Заявка отправлена!</b>\n\n"
        "Мы получили сообщение и ответим в Telegram.\n"
        "Пока ждёте — загляните в /capabilities или /calc",
        parse_mode=ParseMode.HTML,
        reply_markup=C.main_reply_kb(),
    )


async def main() -> None:
    if not BOT_TOKEN:
        logger.error("BOT_TOKEN is missing. Copy .env.example to .env and set the token.")
        sys.exit(1)

    bot = Bot(token=BOT_TOKEN)
    dp = Dispatcher(storage=MemoryStorage())
    dp.include_router(router)

    me = await bot.get_me()
    await setup_commands(bot)
    logger.info("MAXSPAS Studio bot started as @%s (id=%s)", me.username, me.id)
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())
