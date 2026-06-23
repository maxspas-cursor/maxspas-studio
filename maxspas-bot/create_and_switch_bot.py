"""Create new bot via BotFather (manual) and migrate project to new token + username."""

from __future__ import annotations

import json
import os
import re
import subprocess
import sys
import urllib.request
import webbrowser
from pathlib import Path

ROOT = Path(__file__).resolve().parent
STUDIO = ROOT.parent
ENV_PATH = ROOT / ".env"
SITE_JSON = STUDIO / "config" / "site.json"
MY_DATA = STUDIO / "config" / "MY_DATA.json"

OLD_USERNAME = "maxspas_studio_bot"
TARGET_USERNAME = "maxspas_studio_bot"

TEXT_EXTENSIONS = {".py", ".js", ".json", ".html", ".md", ".txt", ".ps1"}


def api_get_me(token: str) -> dict:
    req = urllib.request.Request(
        f"https://api.telegram.org/bot{token}/getMe",
        method="GET",
    )
    with urllib.request.urlopen(req, timeout=20) as resp:
        data = json.loads(resp.read().decode())
    if not data.get("ok"):
        raise RuntimeError(data.get("description", "getMe failed"))
    return data["result"]


def update_env(token: str, username: str) -> None:
    lines: list[str] = []
    if ENV_PATH.exists():
        lines = ENV_PATH.read_text(encoding="utf-8").splitlines()

    out: list[str] = []
    seen_token = seen_admin = seen_user = False
    for line in lines:
        if line.startswith("BOT_TOKEN="):
            out.append(f"BOT_TOKEN={token}")
            seen_token = True
        elif line.startswith("ADMIN_CHAT_ID="):
            out.append(line)
            seen_admin = True
        elif line.startswith("BOT_USERNAME="):
            out.append(f"BOT_USERNAME={username}")
            seen_user = True
        else:
            out.append(line)

    if not seen_token:
        out.insert(0, f"BOT_TOKEN={token}")
    if not seen_admin:
        out.append("ADMIN_CHAT_ID=1278926144")
    if not seen_user:
        out.append(f"BOT_USERNAME={username}")

    ENV_PATH.write_text("\n".join(out) + "\n", encoding="utf-8")


def replace_username_in_tree(old: str, new: str) -> int:
    count = 0
    skip_dirs = {".git", "venv", "__pycache__", "node_modules", ".cursor"}
    for path in STUDIO.rglob("*"):
        if not path.is_file():
            continue
        if any(part in skip_dirs for part in path.parts):
            continue
        if path.suffix.lower() not in TEXT_EXTENSIONS:
            continue
        if path.name.endswith(".log"):
            continue
        try:
            text = path.read_text(encoding="utf-8")
        except (UnicodeDecodeError, OSError):
            continue
        if old not in text and f"@{old}" not in text:
            continue
        new_text = text.replace(f"@{old}", f"@{new}").replace(old, new)
        if new_text != text:
            path.write_text(new_text, encoding="utf-8")
            count += 1
    return count


def update_site_json(username: str) -> None:
    data = json.loads(SITE_JSON.read_text(encoding="utf-8"))
    c = data.setdefault("contacts", {})
    c["botUsername"] = f"@{username}"
    c["botDisplayName"] = "MAXSPAS Studio Bot"
    c["botUrl"] = f"https://t.me/{username}"
    SITE_JSON.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def print_botfather_steps() -> None:
    print(
        """
=== Создание нового бота в @BotFather ===

1. Откроется чат BotFather (или откройте https://t.me/BotFather)
2. Отправьте: /newbot
3. Имя бота: MAXSPAS Studio Bot
4. Username: maxspas_studio_bot
   (если занят — BotFather предложит вариант; скопируйте его)
5. BotFather пришлёт токен вида 123456789:AAH...
6. Вставьте токен сюда и нажмите Enter

"""
    )


def read_token_from_argv_or_stdin() -> str:
    if len(sys.argv) > 1:
        return sys.argv[1].strip()
    print_botfather_steps()
    webbrowser.open("https://t.me/BotFather")
    token = input("Вставьте новый BOT_TOKEN: ").strip()
    if not token:
        raise SystemExit("Токен не указан.")
    return token


def main() -> None:
    token = read_token_from_argv_or_stdin()
    if not re.fullmatch(r"\d+:[A-Za-z0-9_-]+", token):
        raise SystemExit("Неверный формат токена.")

    me = api_get_me(token)
    username = me["username"]
    print(f"OK: @{username} ({me.get('first_name', '')})")

    update_env(token, username)
    update_site_json(username)
    replaced = replace_username_in_tree(OLD_USERNAME, username)
    print(f"Обновлено файлов: {replaced}")

    print("\n-> Брендинг бота и канала...")
    subprocess.run([sys.executable, str(ROOT / "setup_telegram_branding.py")], check=True, cwd=str(ROOT))

    print(
        f"""
Готово.

Новый бот: https://t.me/{username}
Токен записан в maxspas-bot/.env

Дальше вручную:
1. Канал @maxspas_studio → Администраторы → добавить @{username}
   (права: публикация постов + редактирование канала)
2. Запустить бота: .\\run_bot.ps1
3. Написать /start в новом боте
4. Старый @maxspas_studio_bot — /deletebot в BotFather (по желанию)
5. Старый токен — Revoke в BotFather (безопасность)
"""
    )


if __name__ == "__main__":
    main()
