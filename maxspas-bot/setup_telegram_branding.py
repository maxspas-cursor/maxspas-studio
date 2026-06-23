"""Apply MAXSPAS Studio branding to bot and channel via Telegram Bot API."""

from __future__ import annotations

import json
import os
import sys
import urllib.parse
import urllib.request
from pathlib import Path

from dotenv import load_dotenv

from bot_config import BOT_MENTION, BOT_USERNAME

load_dotenv()

ROOT = Path(__file__).resolve().parent
TOKEN = os.getenv("BOT_TOKEN", "")
CHANNEL = "@maxspas_studio"
ASSETS = ROOT / "assets" / "brand"

BOT_NAME = "MAXSPAS Studio"
BOT_SHORT = "Сайты, боты и 3D GRBNK · заявки под ключ"
BOT_DESCRIPTION = (
    "MAXSPAS Studio — цифровые продукты под ключ.\n\n"
    "🌐 Сайты и лендинги — от 8 000 ₽, 3–5 дней\n"
    "🤖 Telegram-боты — заявки, запись, уведомления\n"
    "📦 Сайт + бот — комплект для бизнеса\n"
    "🧊 3D GRBNK — модели для печати, доставка по РФ\n\n"
    "📍 Горбунки · работаем онлайн по всему миру\n"
    "📢 Канал: @maxspas_studio\n"
    "Напишите /start или отправьте задачу — ответим в Telegram."
)

CHANNEL_DESCRIPTION = (
    "MAXSPAS Studio · 3D GRBNK\n\n"
    "Сайты, Telegram-боты и 3D-модели под ключ.\n"
    "Портфолио, цены, кейсы и новости проекта.\n\n"
    "🌐 Лендинги · 🤖 Боты · 🧊 3D-печать\n"
    "📍 Горбунки · онлайн по всему миру\n"
    f"📩 Заявки: {BOT_MENTION}"
)

CHANNEL_WELCOME = (
    "<b>MAXSPAS Studio</b> · <b>3D GRBNK</b>\n\n"
    "Цифровые продукты под ключ — в стиле современного студийного подхода.\n\n"
    "🌐 <b>Сайты и лендинги</b> — от 8 000 ₽ · 3–5 дней\n"
    "🤖 <b>Telegram-боты</b> — заявки и запись клиентов\n"
    "📦 <b>Сайт + бот</b> — готовый комплект для бизнеса\n"
    "🧊 <b>3D GRBNK</b> — STL/OBJ, печать и файлы по РФ\n\n"
    "📍 Горбунки, Ленинградская область\n"
    "🌍 Сайты и боты — онлайн по всему миру\n"
    "✅ Работаем как самозанятый исполнитель\n\n"
    f"📩 <b>Оставить заявку:</b> {BOT_MENTION}\n"
    "💬 <b>Лично:</b> @Maxspas · ☎️ +7 (911) 715-60-06"
)


def api(method: str, data: dict | None = None, files: dict | None = None) -> dict:
    if not TOKEN:
        raise SystemExit("BOT_TOKEN missing in .env")

    if files:
        import mimetypes

        boundary = "----MaxspasBoundary"
        body = b""
        for key, val in (data or {}).items():
            body += f"--{boundary}\r\n".encode()
            body += f'Content-Disposition: form-data; name="{key}"\r\n\r\n'.encode()
            body += f"{val}\r\n".encode()
        for key, path in files.items():
            content = Path(path).read_bytes()
            mime = mimetypes.guess_type(path)[0] or "application/octet-stream"
            body += f"--{boundary}\r\n".encode()
            body += (
                f'Content-Disposition: form-data; name="{key}"; filename="{Path(path).name}"\r\n'
            ).encode()
            body += f"Content-Type: {mime}\r\n\r\n".encode()
            body += content + b"\r\n"
        body += f"--{boundary}--\r\n".encode()
        req = urllib.request.Request(
            f"https://api.telegram.org/bot{TOKEN}/{method}",
            data=body,
            headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
            method="POST",
        )
    else:
        payload = json.dumps(data or {}).encode()
        req = urllib.request.Request(
            f"https://api.telegram.org/bot{TOKEN}/{method}",
            data=payload,
            headers={"Content-Type": "application/json"},
            method="POST",
        )

    with urllib.request.urlopen(req, timeout=60) as resp:
        result = json.loads(resp.read().decode())
    if not result.get("ok"):
        raise RuntimeError(f"{method} failed: {result.get('description', result)}")
    return result


def ensure_assets() -> tuple[Path, Path]:
    import subprocess

    gen = ASSETS / "generate_assets.py"
    subprocess.run([sys.executable, str(gen)], check=True, cwd=str(ASSETS))
    return ASSETS / "bot_avatar.png", ASSETS / "channel_avatar.png"


def setup_bot() -> None:
    print("-> Bot profile...")
    api("setMyName", {"name": BOT_NAME})
    api("setMyShortDescription", {"short_description": BOT_SHORT})
    api("setMyDescription", {"description": BOT_DESCRIPTION})
    api(
        "setMyCommands",
        {
            "commands": [
                {"command": "start", "description": "Главное меню"},
                {"command": "services", "description": "Услуги и цены"},
                {"command": "channel", "description": "Канал @maxspas_studio"},
                {"command": "help", "description": "Справка"},
            ]
        },
    )

    bot_png, _ = ensure_assets()
    try:
        api(
            "setMyProfilePhoto",
            {"photo": json.dumps({"type": "static", "photo": "attach://file"})},
            files={"file": str(bot_png)},
        )
        print("  OK Bot avatar set")
    except Exception as e:
        try:
            api("setChatPhoto", {"chat_id": f"@{BOT_USERNAME}"}, files={"photo": str(bot_png)})
            print("  OK Bot avatar set (fallback)")
        except Exception as e2:
            print(f"  WARN Bot avatar: {e2}")


def setup_channel() -> None:
    print(f"-> Channel {CHANNEL}...")
    _, channel_png = ensure_assets()

    try:
        api("setChatDescription", {"chat_id": CHANNEL, "description": CHANNEL_DESCRIPTION})
        print("  OK Channel description")
    except Exception as e:
        print(f"  WARN Description: {e}")

    try:
        api("setChatTitle", {"chat_id": CHANNEL, "title": "MAXSPAS Studio · 3D GRBNK"})
        print("  OK Channel title")
    except Exception as e:
        print(f"  WARN Title: {e}")

    try:
        api("setChatPhoto", {"chat_id": CHANNEL}, files={"photo": str(channel_png)})
        print("  OK Channel avatar")
    except Exception as e:
        print(f"  WARN Avatar: {e}")

    try:
        msg = api(
            "sendMessage",
            {
                "chat_id": CHANNEL,
                "text": CHANNEL_WELCOME,
                "parse_mode": "HTML",
                "disable_web_page_preview": True,
            },
        )
        message_id = msg["result"]["message_id"]
        api(
            "pinChatMessage",
            {"chat_id": CHANNEL, "message_id": message_id, "disable_notification": True},
        )
        print("  OK Welcome post pinned")
    except Exception as e:
        print(f"  WARN Post/pin: {e}")


def main() -> None:
    me = api("getMe")
    print(f"Bot: @{me['result']['username']}\n")
    setup_bot()
    setup_channel()
    print("\nDone.")


if __name__ == "__main__":
    main()
