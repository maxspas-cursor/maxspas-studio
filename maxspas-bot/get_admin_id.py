"""Poll Telegram getUpdates; save ADMIN_CHAT_ID to .env when user sends /start."""

from __future__ import annotations

import os
import sys
import time
from pathlib import Path

import requests
from dotenv import load_dotenv

ENV_PATH = Path(__file__).resolve().parent / ".env"
POLL_INTERVAL_SEC = 2
TIMEOUT_SEC = 300


def load_token() -> str:
    load_dotenv(ENV_PATH)
    token = os.getenv("BOT_TOKEN", "").strip()
    if not token or token.startswith("your_"):
        print("BOT_TOKEN не задан в .env")
        sys.exit(1)
    return token


def read_env_lines() -> list[str]:
    if not ENV_PATH.exists():
        print(f"Файл не найден: {ENV_PATH}")
        sys.exit(1)
    return ENV_PATH.read_text(encoding="utf-8").splitlines()


def write_admin_chat_id(chat_id: int) -> None:
    lines = read_env_lines()
    updated = False
    out: list[str] = []
    for line in lines:
        if line.startswith("ADMIN_CHAT_ID="):
            out.append(f"ADMIN_CHAT_ID={chat_id}")
            updated = True
        else:
            out.append(line)
    if not updated:
        out.append(f"ADMIN_CHAT_ID={chat_id}")
    ENV_PATH.write_text("\n".join(out) + "\n", encoding="utf-8")


def is_start_message(message: dict) -> bool:
    text = (message.get("text") or "").strip()
    return text == "/start" or text.startswith("/start ")


def try_save_from_updates(updates: list[dict]) -> bool:
    for update in updates:
        message = update.get("message") or update.get("edited_message")
        if not message or not is_start_message(message):
            continue
        chat_id = message.get("chat", {}).get("id")
        if chat_id is None:
            continue
        username = (message.get("from") or {}).get("username", "")
        write_admin_chat_id(int(chat_id))
        print(f"\nГотово! ADMIN_CHAT_ID={chat_id} записан в .env")
        if username:
            print(f"Пользователь: @{username}")
        print("Запустите бота: python bot.py")
        return True
    return False


def fetch_updates(api: str, offset: int | None, long_poll: bool) -> dict:
    params: dict[str, int] = {"timeout": 10 if long_poll else 0}
    if offset is not None:
        params["offset"] = offset
    resp = requests.get(f"{api}/getUpdates", params=params, timeout=15)
    resp.raise_for_status()
    return resp.json()


def main() -> None:
    token = load_token()
    api = f"https://api.telegram.org/bot{token}"
    offset: int | None = None

    print("Проверяю существующие обновления…")
    try:
        data = fetch_updates(api, offset, long_poll=False)
    except requests.RequestException as exc:
        print(f"Ошибка API: {exc}")
        sys.exit(1)

    if not data.get("ok"):
        desc = data.get("description", "unknown")
        print(f"Telegram API error: {desc}")
        if "Unauthorized" in desc:
            print("Токен недействителен — создайте новый в @BotFather (/token).")
        sys.exit(1)

    updates = data.get("result", [])
    print(f"Найдено обновлений: {len(updates)}")
    if try_save_from_updates(updates):
        return

    if updates:
        offset = updates[-1]["update_id"] + 1

    if len(sys.argv) > 1 and sys.argv[1] == "--check":
        print("В очереди нет /start. Отправьте /start боту и запустите скрипт снова.")
        return

    print("\nОжидаю /start в боте @maxspas_studio_bot …")
    print("Откройте https://t.me/maxspas_studio_bot и отправьте /start")
    print(f"Таймаут: {TIMEOUT_SEC} с. Ctrl+C — отмена.\n")

    deadline = time.time() + TIMEOUT_SEC
    while time.time() < deadline:
        try:
            data = fetch_updates(api, offset, long_poll=True)
        except requests.RequestException as exc:
            print(f"Ошибка API: {exc}")
            time.sleep(POLL_INTERVAL_SEC)
            continue

        if not data.get("ok"):
            print(f"Telegram API error: {data.get('description', 'unknown')}")
            sys.exit(1)

        for update in data.get("result", []):
            offset = update["update_id"] + 1
            message = update.get("message") or update.get("edited_message")
            if not message or not is_start_message(message):
                continue
            chat_id = message.get("chat", {}).get("id")
            if chat_id is None:
                continue
            username = (message.get("from") or {}).get("username", "")
            write_admin_chat_id(int(chat_id))
            print(f"\nГотово! ADMIN_CHAT_ID={chat_id} записан в .env")
            if username:
                print(f"Пользователь: @{username}")
            print("Запустите бота: python bot.py")
            return

        time.sleep(POLL_INTERVAL_SEC)

    print("\nТаймаут. Напишите боту /start и запустите скрипт снова.")
    sys.exit(1)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nОтменено.")
        sys.exit(130)
