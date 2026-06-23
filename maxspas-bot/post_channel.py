"""Publish first channel post and branding when bot is channel admin."""

from __future__ import annotations

import json
import os
import sys
import urllib.request
from pathlib import Path

from dotenv import load_dotenv

from bot_config import BOT_MENTION, BOT_USERNAME

load_dotenv()

TOKEN = os.getenv("BOT_TOKEN", "")
CHANNEL = "@maxspas_studio"
ROOT = Path(__file__).resolve().parent

FIRST_POST = (
    "<b>MAXSPAS Studio</b> · <b>3D GRBNK</b>\n\n"
    "Цифровые продукты под ключ — сайты, Telegram-боты и 3D-модели.\n\n"
    "🌐 <b>Сайты и лендинги</b> — от 8 000 ₽ · 3–5 дней\n"
    "   Адаптив, форма заявки, SEO-база\n\n"
    "🤖 <b>Telegram-боты</b> — от 5 000 ₽ · 3–7 дней\n"
    "   Запись клиентов, заявки, уведомления\n\n"
    "📦 <b>Сайт + бот</b> — от 18 000 ₽ · 5–7 дней\n"
    "   Готовый комплект для бизнеса\n\n"
    "🧊 <b>3D GRBNK</b> — от 300 ₽\n"
    "   STL/OBJ для 3D-печати · доставка по РФ\n\n"
    "📍 Горбунки · 🌍 работаем онлайн по всему миру\n"
    "✅ Официально · самозанятость\n\n"
    f"📩 <b>Заявка:</b> {BOT_MENTION}\n"
    "💬 <b>Лично:</b> @Maxspas · ☎️ +7 (911) 715-60-06"
)


def api(method: str, data: dict | None = None, files: dict | None = None) -> dict:
    if not TOKEN:
        raise SystemExit("BOT_TOKEN missing")

    if files:
        import mimetypes

        boundary = "----MaxspasBoundary"
        body = b""
        for key, val in (data or {}).items():
            body += f"--{boundary}\r\nContent-Disposition: form-data; name=\"{key}\"\r\n\r\n{val}\r\n".encode()
        for key, path in files.items():
            content = Path(path).read_bytes()
            mime = mimetypes.guess_type(path)[0] or "image/png"
            body += (
                f"--{boundary}\r\nContent-Disposition: form-data; name=\"{key}\"; "
                f"filename=\"{Path(path).name}\"\r\nContent-Type: {mime}\r\n\r\n"
            ).encode()
            body += content + b"\r\n"
        body += f"--{boundary}--\r\n".encode()
        req = urllib.request.Request(
            f"https://api.telegram.org/bot{TOKEN}/{method}",
            data=body,
            headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
            method="POST",
        )
    else:
        req = urllib.request.Request(
            f"https://api.telegram.org/bot{TOKEN}/{method}",
            json.dumps(data or {}).encode(),
            {"Content-Type": "application/json"},
            method="POST",
        )

    with urllib.request.urlopen(req, timeout=60) as resp:
        result = json.loads(resp.read().decode())
    if not result.get("ok"):
        raise RuntimeError(f"{method}: {result.get('description', result)}")
    return result


def main() -> None:
    me = api("getMe")
    bot_user = me["result"]["username"]
    print(f"Bot: @{bot_user}")

    try:
        member = api("getChatMember", {"chat_id": CHANNEL, "user_id": me["result"]["id"]})
        print("Member status:", member["result"]["status"])
    except Exception as e:
        print("NOT ADMIN:", e)
        print(f"Add @{BOT_USERNAME} as channel admin with Post Messages + Edit Info")
        sys.exit(2)

    avatar = ROOT / "assets" / "brand" / "channel_avatar.png"
    if avatar.exists():
        try:
            api("setChatPhoto", {"chat_id": CHANNEL}, files={"photo": str(avatar)})
            print("Avatar OK")
        except Exception as e:
            print("Avatar skip:", e)

    try:
        api("setChatTitle", {"chat_id": CHANNEL, "title": "MAXSPAS Studio · 3D GRBNK"})
        api(
            "setChatDescription",
            {
                "chat_id": CHANNEL,
                "description": "Сайты, Telegram-боты и 3D-модели под ключ. MAXSPAS Studio · 3D GRBNK",
            },
        )
        print("Title/description OK")
    except Exception as e:
        print("Meta skip:", e)

    msg = api(
        "sendMessage",
        {
            "chat_id": CHANNEL,
            "text": FIRST_POST,
            "parse_mode": "HTML",
            "disable_web_page_preview": True,
        },
    )
    mid = msg["result"]["message_id"]
    api("pinChatMessage", {"chat_id": CHANNEL, "message_id": mid, "disable_notification": False})
    print("Posted and pinned message", mid)


if __name__ == "__main__":
    main()
