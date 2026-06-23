"""Shared bot identity from .env (username without @)."""

from __future__ import annotations

import os

from dotenv import load_dotenv

load_dotenv()

BOT_USERNAME = os.getenv("BOT_USERNAME", "maxspas_studio_bot").lstrip("@")
BOT_MENTION = f"@{BOT_USERNAME}"
BOT_URL = f"https://t.me/{BOT_USERNAME}"
