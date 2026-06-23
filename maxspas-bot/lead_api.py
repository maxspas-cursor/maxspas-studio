"""HTTP API: website contact form → Telegram notification to admin."""

from __future__ import annotations

import html
import os
import re

from datetime import datetime, timezone

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator

load_dotenv()

BOT_TOKEN = os.getenv("BOT_TOKEN", "")
ADMIN_CHAT_ID = os.getenv("ADMIN_CHAT_ID", "").strip()
PORT = int(os.getenv("LEAD_API_PORT", "8787"))
CORS_ORIGINS = [
    o.strip()
    for o in os.getenv(
        "LEAD_API_CORS_ORIGINS",
        "http://127.0.0.1:5500,http://localhost:5500,http://127.0.0.1:8080,http://localhost:8080",
    ).split(",")
    if o.strip()
]

EMAIL_RE = re.compile(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")
PHONE_DIGITS_MIN = 10
PHONE_DIGITS_MAX = 15

app = FastAPI(title="MAXSPAS Lead API", docs_url=None, redoc_url=None)
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_methods=["POST", "OPTIONS"],
    allow_headers=["*"],
)


def is_valid_email(value: str) -> bool:
    return bool(EMAIL_RE.match(value.strip()))


def is_valid_phone(value: str) -> bool:
    digits = re.sub(r"\D", "", value)
    if len(digits) < PHONE_DIGITS_MIN or len(digits) > PHONE_DIGITS_MAX:
        return False
    if len(set(digits)) == 1:
        return False
    return True


def is_valid_contact(value: str) -> bool:
    text = value.strip()
    return bool(text) and (is_valid_email(text) or is_valid_phone(text))


class LeadIn(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    contact: str = Field(min_length=3, max_length=120)
    service: str = Field(default="не указана", max_length=80)
    message: str = Field(default="", max_length=2000)
    company: str = Field(default="", max_length=120)
    budget: str = Field(default="", max_length=80)
    deadline: str = Field(default="", max_length=80)
    page: str = Field(default="", max_length=200)
    referrer: str = Field(default="", max_length=500)
    website: str = Field(default="")  # honeypot — must stay empty

    @field_validator("contact")
    @classmethod
    def contact_must_be_phone_or_email(cls, value: str) -> str:
        cleaned = value.strip()
        if not is_valid_contact(cleaned):
            raise ValueError("Укажите телефон (+7 …) или email")
        return cleaned


def _esc(text: str) -> str:
    return html.escape(text, quote=False)


async def _notify_admin(payload: LeadIn) -> None:
    if not BOT_TOKEN or not ADMIN_CHAT_ID:
        raise HTTPException(status_code=503, detail="Lead API is not configured")

    when = datetime.now(timezone.utc).astimezone().strftime("%d.%m.%Y %H:%M")
    lines = [
        "<b>🌐 Новая заявка с сайта</b>",
        "",
        f"<b>Имя:</b> {_esc(payload.name)}",
        f"<b>Контакт:</b> {_esc(payload.contact)}",
    ]
    if payload.company.strip():
        lines.append(f"<b>Компания:</b> {_esc(payload.company.strip())}")
    lines.append(f"<b>Услуга:</b> {_esc(payload.service)}")
    if payload.budget.strip():
        lines.append(f"<b>Бюджет:</b> {_esc(payload.budget.strip())}")
    if payload.deadline.strip():
        lines.append(f"<b>Срок:</b> {_esc(payload.deadline.strip())}")
    lines.append(f"<b>Сообщение:</b>\n{_esc(payload.message or '—')}")
    if payload.page.strip():
        lines.append(f"<b>Страница:</b> {_esc(payload.page.strip())}")
    if payload.referrer.strip():
        lines.append(f"<b>Откуда:</b> {_esc(payload.referrer.strip())}")
    lines.append(f"<b>Время:</b> {when}")
    text = "\n".join(lines)

    async with httpx.AsyncClient(timeout=20.0) as client:
        resp = await client.post(
            f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage",
            json={
                "chat_id": int(ADMIN_CHAT_ID),
                "text": text,
                "parse_mode": "HTML",
                "disable_web_page_preview": True,
            },
        )
    data = resp.json()
    if not data.get("ok"):
        raise HTTPException(status_code=502, detail=data.get("description", "Telegram error"))


@app.get("/api/health")
async def health() -> dict[str, bool]:
    return {"ok": True}


@app.post("/api/lead")
async def submit_lead(payload: LeadIn) -> dict[str, bool]:
    if payload.website:
        return {"ok": True}
    if not is_valid_contact(payload.contact):
        raise HTTPException(status_code=400, detail="Укажите телефон (+7 …) или email")
    await _notify_admin(payload)
    return {"ok": True}
