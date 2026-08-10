"""Force responsive images in all demos — prevent mobile stretch from HTML height attrs."""
from pathlib import Path
import re

root = Path(__file__).resolve().parents[1] / "demos"
RULE = "img{max-width:100%;height:auto;display:block}"

for idx in root.rglob("index.html"):
    text = idx.read_text(encoding="utf-8")
    orig = text

    # Inline <style> blocks: ensure height:auto on img width:100% rules
    def fix_style(m):
        css = m.group(1)
        css2 = re.sub(
            r"(img\s*\{[^}]*width\s*:\s*100%\s*;?)(?![^}]*height\s*:)",
            lambda mm: mm.group(1) if "height:" in mm.group(0) else mm.group(1).rstrip(";") + ";height:auto;",
            css,
        )
        # also catch .foo img{width:100%;display:block}
        css2 = re.sub(
            r"((?:\.[\w-]+\s+)?img\s*\{[^}]*?width\s*:\s*100%\s*;)(?![^}]*height\s*:)",
            r"\1height:auto;",
            css2,
        )
        if RULE not in css2.replace(" ", "") and "height:auto" not in css2:
            css2 = RULE + "\n    " + css2
        return f"<style>{css2}</style>" if False else f"<style>\n{css2}\n  </style>" if css2.startswith("\n") else f"<style>{css2}</style>"

    # Simpler: inject safeguard before </style> or after <style>
    if "<style>" in text and "/* ms-img-fix */" not in text:
        text = text.replace(
            "<style>",
            "<style>\n    /* ms-img-fix */ img{max-width:100%;height:auto}\n    ",
            1,
        )

    if text != orig:
        idx.write_text(text, encoding="utf-8")
        print("html", idx.relative_to(root.parent))

for css in root.rglob("style.css"):
    text = css.read_text(encoding="utf-8")
    if "/* ms-img-fix */" in text:
        print("skip", css.relative_to(root.parent))
        continue
    inject = "/* ms-img-fix */\nimg { max-width: 100%; height: auto; }\n\n"
    css.write_text(inject + text, encoding="utf-8")
    print("css", css.relative_to(root.parent))
