"""One-shot: capture ADMIN_CHAT_ID from /start and apply channel branding."""

from __future__ import annotations

import json
import os
import re
import sys
import urllib.request
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()
ROOT = Path(__file__).resolve().parent
ENV = ROOT / ".env"
TOKEN = os.getenv("BOT_TOKEN", "")
CHANNEL = "@maxspas_studio"


def api(method: str, data: dict | None = None, files: dict | None = None) -> dict:
    if files:
        import mimetypes

        boundary = "----MaxspasBoundary"
        body = b""
        for key, val in (data or {}).items():
            body += f"--{boundary}\r\nContent-Disposition: form-data; name=\"{key}\"\r\n\r\n{val}\r\n".encode()
        for key, path in files.items():
            content = Path(path).read_bytes()
            mime = mimetypes.guess_type(path)[0] or "image/png"
            body += f"--{boundary}\r\nContent-Disposition: form-data; name=\"{key}\"; filename=\"{Path(path).name}\"\r\nContent-Type: {mime}\r\n\r\n".encode()
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
            data=json.dumps(data or {}).encode(),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
    with urllib.request.urlopen(req, timeout=60) as resp:
        result = json.loads(resp.read().decode())
    if not result.get("ok"):
        raise RuntimeError(result.get("description", result))
    return result


def patch_env(chat_id: int) -> None:
    text = ENV.read_text(encoding="utf-8")
    if re.search(r"^ADMIN_CHAT_ID=.*$", text, re.M):
        text = re.sub(r"^ADMIN_CHAT_ID=.*$", f"ADMIN_CHAT_ID={chat_id}", text, flags=re.M)
    else:
        text += f"\nADMIN_CHAT_ID={chat_id}\n"
    ENV.write_text(text, encoding="utf-8")
    print(f"ADMIN_CHAT_ID={chat_id} saved")


def capture_id() -> int | None:
    updates = api("getUpdates", {"limit": 20, "timeout": 1})
    best = None
    for u in updates.get("result", []):
        msg = u.get("message") or u.get("edited_message")
        if not msg:
            continue
        user = msg.get("from", {})
        if user.get("is_bot"):
            continue
        best = user.get("id")
    return best


def try_channel_branding() -> None:
    png = ROOT / "assets" / "brand" / "channel_avatar.png"
    if not png.exists():
        return
    for fn, payload in [
        ("setChatDescription", {"chat_id": CHANNEL, "description": "MAXSPAS Studio · 3D GRBNK — сайты, боты, 3D-модели"}),
        ("setChatTitle", {"chat_id": CHANNEL, "title": "MAXSPAS Studio · 3D GRBNK"}),
    ]:
        try:
            api(fn, payload)
            print(f"OK {fn}")
        except Exception as e:
            print(f"SKIP {fn}: {e}")
    try:
        api("setChatPhoto", {"chat_id": CHANNEL}, files={"photo": str(png)})
        print("OK setChatPhoto")
    except Exception as e:
        print(f"SKIP setChatPhoto: {e}")


def main() -> None:
    cid = capture_id()
    if cid:
        patch_env(cid)
    else:
        print("No user messages yet — send /start to the bot")
        sys.exit(1)
    try_channel_branding()


if __name__ == "__main__":
    main()
