# -*- coding: utf-8 -*-
"""Локальный стол «КиберЩит».

Запуск: py -3 server.py
С телефона открывают ссылку, которую сервер напечатает в консоли.
Компьютер и телефоны должны быть в одной сети.
"""

from __future__ import annotations

import json
import secrets
import socket
import sys
import threading
import traceback
import webbrowser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from game import Game, GameError

ROOT = Path(__file__).resolve().parent
STATIC = ROOT / "static"
STATIC_V0 = ROOT / "static-v0"
ROOMS: dict[str, Game] = {}
LOCK = threading.Lock()
PORT = 8765
LAN = "127.0.0.1"
ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"


def reset_rooms() -> None:
    with LOCK:
        ROOMS.clear()


def detect_lan() -> str:
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        sock.connect(("8.8.8.8", 80))
        ip = sock.getsockname()[0]
        sock.close()
        if ip and not ip.startswith("127."):
            return ip
    except OSError:
        pass
    try:
        for info in socket.getaddrinfo(socket.gethostname(), None, socket.AF_INET):
            ip = info[4][0]
            if not str(ip).startswith("127."):
                return ip
    except OSError:
        pass
    return "127.0.0.1"


def safe_eq(left: str, right: str) -> bool:
    try:
        return secrets.compare_digest(left, right)
    except (TypeError, ValueError):
        return False


def new_code() -> str:
    for _ in range(20):
        code = "".join(secrets.choice(ALPHABET) for _ in range(4))
        if code not in ROOMS:
            return code
    raise GameError("Не удалось открыть комнату. Попробуйте ещё раз.")


def lookup(token: str):
    if not token:
        return None
    for game in ROOMS.values():
        if safe_eq(game.host_token, token):
            return game, None, True
        for person in game.players:
            if safe_eq(person.token, token):
                return game, person, False
    return None


class Handler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def log_message(self, fmt: str, *args) -> None:
        return

    def do_GET(self) -> None:
        try:
            path = self.path.split("?", 1)[0]
            if path == "/api/state":
                self.handle_state()
                return
            if path == "/favicon.ico":
                self.send_response(204)
                self.end_headers()
                return
            self.serve_static(path)
        except GameError as exc:
            self.send_json({"error": str(exc)}, 400)
        except Exception:
            traceback.print_exc()
            self.send_json({"error": "Сбой сервера."}, 500)

    def do_POST(self) -> None:
        try:
            data = self.read_json()
            path = self.path.split("?", 1)[0]
            if path == "/api/room":
                self.handle_create()
                return
            if path == "/api/join":
                self.handle_join(data)
                return
            if path == "/api/act":
                self.handle_act(data)
                return
            self.send_json({"error": "Не найдено."}, 404)
        except GameError as exc:
            self.send_json({"error": str(exc)}, 400)
        except Exception:
            traceback.print_exc()
            self.send_json({"error": "Сбой сервера."}, 500)

    def handle_create(self) -> None:
        with LOCK:
            if len(ROOMS) > 100:
                raise GameError("Слишком много открытых столов.")
            code = new_code()
            game = Game(code)
            ROOMS[code] = game
            self.send_json({"hostToken": game.host_token, "state": self.pack(game, None, True)})

    def handle_join(self, data: dict) -> None:
        code = str(data.get("code") or "").strip().upper()
        with LOCK:
            game = ROOMS.get(code)
            if game is None:
                self.send_json({"error": "Стол с таким кодом не найден."}, 404)
                return
            person = game.add_player(str(data.get("name") or ""))
            self.send_json({
                "playerToken": person.token,
                "state": self.pack(game, person, False),
            })

    def handle_state(self) -> None:
        token = self.headers.get("X-Token") or ""
        with LOCK:
            found = lookup(token)
            if found is None:
                self.send_json({"error": "Сессия не найдена."}, 401)
                return
            game, actor, is_host = found
            self.send_json(self.pack(game, actor, is_host))

    def handle_act(self, data: dict) -> None:
        token = self.headers.get("X-Token") or ""
        with LOCK:
            found = lookup(token)
            if found is None:
                self.send_json({"error": "Сессия не найдена."}, 401)
                return
            game, actor, is_host = found
            op = str(data.get("op") or "")
            game.dispatch(actor, is_host, op, data)
            if actor is not None and all(p.id != actor.id for p in game.players):
                self.send_json({"left": True, "state": self.pack(game, None, False)})
                return
            self.send_json(self.pack(game, actor, is_host))

    def pack(self, game: Game, actor, is_host: bool) -> dict:
        state = game.view(actor, is_host)
        state["shareUrl"] = self.share_url(game.code)
        return state

    def share_url(self, code: str) -> str:
        port = self.server.server_address[1]
        host = self.headers.get("Host") or f"127.0.0.1:{port}"
        hostname = host.split(":")[0].strip("[]")
        if hostname in ("127.0.0.1", "localhost", "0.0.0.0"):
            return f"http://{LAN}:{port}/?room={code}"
        return f"http://{host}/?room={code}"

    def read_json(self) -> dict:
        length = int(self.headers.get("Content-Length") or 0)
        if length > 20000:
            raise GameError("Слишком большой запрос.")
        if length <= 0:
            return {}
        raw = self.rfile.read(length)
        try:
            data = json.loads(raw.decode("utf-8"))
        except json.JSONDecodeError as exc:
            raise GameError("Некорректный запрос.") from exc
        if not isinstance(data, dict):
            raise GameError("Некорректный запрос.")
        return data

    def send_json(self, payload: dict, status: int = 200) -> None:
        raw = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def serve_static(self, path: str) -> None:
        if path in ("/", ""):
            target = STATIC / "index.html"
        elif path in ("/v0", "/v0/"):
            target = STATIC_V0 / "index.html"
        elif path.startswith("/v0/"):
            rel = path[len("/v0/"):]
            if not rel or ".." in rel.replace("\\", "/").split("/"):
                self.send_error(404)
                return
            target = STATIC_V0 / rel
        elif path.startswith("/static/"):
            rel = path[len("/static/"):]
            if not rel or ".." in rel.replace("\\", "/").split("/"):
                self.send_error(404)
                return
            target = STATIC / rel
        else:
            self.send_error(404)
            return
        if not target.is_file():
            self.send_error(404)
            return
        data = target.read_bytes()
        kind = {
            ".html": "text/html; charset=utf-8",
            ".css": "text/css; charset=utf-8",
            ".js": "text/javascript; charset=utf-8",
        }.get(target.suffix, "application/octet-stream")
        self.send_response(200)
        self.send_header("Content-Type", kind)
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)


class Server(ThreadingHTTPServer):
    allow_reuse_address = True
    daemon_threads = True


def main() -> None:
    global PORT, LAN
    port = 8765
    for arg in sys.argv[1:]:
        if arg.isdigit():
            port = int(arg)
    PORT = port
    LAN = detect_lan()
    httpd = Server(("0.0.0.0", PORT), Handler)
    print("КиберЩит — стол ведущего", flush=True)
    print(f"На этом компьютере: http://127.0.0.1:{PORT}", flush=True)
    print(f"С телефона в той же сети: http://{LAN}:{PORT}", flush=True)
    print("Если телефон не открывает ссылку, разрешите Python в брандмауэре для частной сети.", flush=True)
    print("Остановка: Ctrl+C", flush=True)
    if "--open" in sys.argv:
        threading.Timer(0.6, lambda: webbrowser.open(f"http://127.0.0.1:{PORT}")).start()
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nСтол закрыт.")
        httpd.shutdown()


if __name__ == "__main__":
    main()
