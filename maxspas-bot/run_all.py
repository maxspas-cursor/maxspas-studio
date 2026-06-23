"""Run Telegram bot + lead API together."""

from __future__ import annotations

import asyncio
import ctypes
import logging
import os
import sys
import threading

import uvicorn
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("run_all")

_MUTEX_NAME = "Global\\MAXSPAS_STUDIO_BOT_SINGLE_INSTANCE"


def _acquire_single_instance() -> None:
    if os.name != "nt":
        return
    kernel32 = ctypes.windll.kernel32
    handle = kernel32.CreateMutexW(None, True, _MUTEX_NAME)
    if kernel32.GetLastError() == 183:
        logger.error(
            "Another MAXSPAS bot instance is already running. "
            "Stop duplicate run_all.py / serve.bat processes first."
        )
        sys.exit(1)
    # Keep handle alive for process lifetime.
    globals()["_mutex_handle"] = handle


def _start_api() -> None:
    from lead_api import app

    port = int(os.getenv("LEAD_API_PORT", "8787"))
    logger.info("Lead API on http://127.0.0.1:%s/api/lead", port)
    uvicorn.run(app, host="127.0.0.1", port=port, log_level="warning")


async def _start_bot() -> None:
    from bot import main

    await main()


def main() -> None:
    _acquire_single_instance()
    api_thread = threading.Thread(target=_start_api, daemon=True)
    api_thread.start()
    asyncio.run(_start_bot())


if __name__ == "__main__":
    main()
