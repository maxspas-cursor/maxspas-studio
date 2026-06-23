"""Telegram avatars — channel (violet) vs bot (indigo-blue), clean logo-mark."""

from __future__ import annotations

import shutil
from dataclasses import dataclass
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent
OUT = ROOT
SITE_ASSETS = ROOT.parents[2] / "assets"

WHITE = (248, 250, 252)


@dataclass(frozen=True)
class Palette:
    outer: tuple[int, int, int]
    card: tuple[int, int, int]
    left: tuple[int, int, int]
    front: tuple[int, int, int]
    top: tuple[int, int, int]
    edge: tuple[int, int, int]
    badge_fill: tuple[int, int, int]
    badge_edge: tuple[int, int, int]


CHANNEL_PALETTE = Palette(
    outer=(7, 5, 13),
    card=(14, 10, 22),
    left=(91, 33, 182),
    front=(124, 58, 237),
    top=(167, 139, 250),
    edge=(196, 181, 253),
    badge_fill=(124, 58, 237),
    badge_edge=(196, 181, 253),
)

# Cooler indigo/cyan shift — visible in chat list next to channel
BOT_PALETTE = Palette(
    outer=(5, 10, 22),
    card=(10, 16, 36),
    left=(49, 46, 129),
    front=(67, 56, 202),
    top=(99, 102, 241),
    edge=(129, 140, 248),
    badge_fill=(34, 211, 238),
    badge_edge=(165, 243, 252),
)


def _draw_bot_badge(
    draw: ImageDraw.ImageDraw,
    ox: float,
    oy: float,
    scale: float,
    palette: Palette,
) -> None:
    r = scale * 2.45
    bx = ox + 32 * scale - scale * 1.45
    by = oy + 32 * scale - scale * 1.25
    draw.ellipse((bx - r, by - r, bx + r, by + r), fill=palette.badge_fill, outline=palette.badge_edge, width=max(2, round(scale * 0.3)))
    dot = r * 0.2
    for i, dy in enumerate((-0.28, 0, 0.28)):
        dx = bx + (i - 1) * r * 0.36
        draw.ellipse((dx - dot, by + dy * r - dot, dx + dot, by + dy * r + dot), fill=WHITE)


def _cube_points(scale: float, ox: float, oy: float) -> dict[str, tuple[float, float]]:
    def p(x: float, y: float) -> tuple[float, float]:
        return ox + x * scale, oy + y * scale

    return {
        "top": p(16, 8),
        "tr": p(23, 13),
        "front": p(16, 18),
        "tl": p(9, 13),
        "bl": p(9, 21),
        "br": p(23, 21),
        "bottom": p(16, 25),
    }


def _draw_logo_mark(
    draw: ImageDraw.ImageDraw,
    canvas: int,
    palette: Palette,
    *,
    fill_ratio: float = 0.92,
    y_offset_ratio: float = -0.035,
    bot_badge: bool = False,
) -> None:
    mark = canvas * fill_ratio
    scale = mark / 32
    ox = (canvas - 32 * scale) / 2
    oy = (canvas - 32 * scale) / 2 + canvas * y_offset_ratio

    draw.rounded_rectangle(
        (ox, oy, ox + 32 * scale, oy + 32 * scale),
        radius=8 * scale,
        fill=palette.card,
    )

    pts = _cube_points(scale, ox, oy)
    draw.polygon([pts["tl"], pts["front"], pts["bottom"], pts["bl"]], fill=palette.left)
    draw.polygon([pts["front"], pts["tr"], pts["br"], pts["bottom"]], fill=palette.front)
    draw.polygon([pts["top"], pts["tr"], pts["front"], pts["tl"]], fill=palette.top)

    lw = max(2, round(scale * 1.5))
    for a, b in (
        (pts["top"], pts["tr"]),
        (pts["tr"], pts["br"]),
        (pts["br"], pts["bottom"]),
        (pts["bottom"], pts["bl"]),
        (pts["bl"], pts["tl"]),
        (pts["tl"], pts["top"]),
        (pts["front"], pts["tl"]),
        (pts["front"], pts["tr"]),
        (pts["front"], pts["bottom"]),
    ):
        draw.line([a, b], fill=palette.edge, width=lw)

    if bot_badge:
        _draw_bot_badge(draw, ox, oy, scale, palette)


def _avatar(
    size: int,
    palette: Palette,
    *,
    y_offset_ratio: float,
    bot_badge: bool = False,
) -> Image.Image:
    img = Image.new("RGB", (size, size), palette.outer)
    draw = ImageDraw.Draw(img)
    _draw_logo_mark(draw, size, palette, y_offset_ratio=y_offset_ratio, bot_badge=bot_badge)
    return img


def bot_avatar(size: int = 640) -> Path:
    path = OUT / "bot_avatar.png"
    _avatar(size, BOT_PALETTE, y_offset_ratio=-0.035, bot_badge=True).save(path, "PNG", optimize=True)
    return path


def channel_avatar(size: int = 640) -> Path:
    path = OUT / "channel_avatar.png"
    _avatar(size, CHANNEL_PALETTE, y_offset_ratio=-0.058).save(path, "PNG", optimize=True)
    return path


def _copy_to_site(bot: Path, channel: Path) -> None:
    SITE_ASSETS.mkdir(parents=True, exist_ok=True)
    for src, name in (
        (bot, "telegram-bot-avatar.png"),
        (channel, "telegram-channel-avatar.png"),
        (bot, "bot_avatar.png"),
        (channel, "channel_avatar.png"),
    ):
        shutil.copy2(src, SITE_ASSETS / name)


if __name__ == "__main__":
    b = bot_avatar()
    c = channel_avatar()
    _copy_to_site(b, c)
    print(f"Generated: {b}")
    print(f"Generated: {c}")
    print(f"Copied to: {SITE_ASSETS}")
