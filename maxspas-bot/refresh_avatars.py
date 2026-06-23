"""Clear ALL bot profile photos from history, upload fresh avatars."""

from __future__ import annotations

import json
import os
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT / "assets" / "brand"))
from generate_assets import bot_avatar, channel_avatar  # noqa: E402

TOKEN = os.getenv("BOT_TOKEN", "")


def api(method: str, data: dict | None = None, files: dict | None = None) -> dict:
    if not TOKEN:
        raise SystemExit("BOT_TOKEN missing")

    if files:
        boundary = "----MaxspasBoundary"
        body = b""
        for key, val in (data or {}).items():
            body += f"--{boundary}\r\nContent-Disposition: form-data; name=\"{key}\"\r\n\r\n{val}\r\n".encode()
        for key, path in files.items():
            content = Path(path).read_bytes()
            body += (
                f"--{boundary}\r\nContent-Disposition: form-data; name=\"{key}\"; "
                f"filename=\"{Path(path).name}\"\r\nContent-Type: image/png\r\n\r\n"
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
        payload = json.dumps(data or {}).encode()
        req = urllib.request.Request(
            f"https://api.telegram.org/bot{TOKEN}/{method}",
            data=payload,
            headers={"Content-Type": "application/json"},
            method="POST",
        )

    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        return json.loads(e.read().decode())


def photo_count() -> int:
    me = api("getMe")["result"]
    photos = api("getUserProfilePhotos", {"user_id": me["id"], "limit": 100})
    return int(photos.get("result", {}).get("total_count", 0))


def clear_bot_photos() -> None:
    for attempt in range(20):
        count = photo_count()
        print(f"photos before remove #{attempt + 1}: {count}")
        if count == 0:
            break

        result = api("removeMyProfilePhoto")
        print(f"removeMyProfilePhoto: {result}")
        if not result.get("ok"):
            if result.get("error_code") == 429:
                wait = int(result.get("parameters", {}).get("retry_after", 12))
                print(f"rate limit, wait {wait}s")
                time.sleep(wait + 1)
                continue
            break
        time.sleep(1.2)


def main() -> None:
    clear_bot_photos()

    bot_png = bot_avatar()
    channel_png = channel_avatar()

    set_bot = api(
        "setMyProfilePhoto",
        {"photo": json.dumps({"type": "static", "photo": "attach://file"})},
        files={"file": str(bot_png)},
    )
    print("setMyProfilePhoto:", set_bot)

    set_channel = api("setChatPhoto", {"chat_id": "@maxspas_studio"}, files={"photo": str(channel_png)})
    print("setChatPhoto:", set_channel)

    print("bot photos after upload:", photo_count())


if __name__ == "__main__":
    main()
