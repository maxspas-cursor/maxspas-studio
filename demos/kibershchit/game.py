# -*- coding: utf-8 -*-
"""КиберЩит: правила партии для веб-стола.

Заявка задаёт роли, карты и цикл «ночь / день». Ниже добрано то, без чего
партия не заканчивается: мирные сотрудники, состав стола, победа, порядок ночи.
"""

from __future__ import annotations

import random
import re
import secrets
import time
from collections import Counter
from dataclasses import dataclass

NAME_RE = re.compile(r"^(?=.{2,18}$)[\w][\w \-]*$", re.UNICODE)

ROLE_NAMES = {
    "ciso": "Руководитель ИБ",
    "hygiene": "Специалист по кибергигиене",
    "whitehat": "Белый хакер",
    "analyst": "Аналитик данных",
    "insider": "Инсайдер",
    "fakemeter": "Фейкомёт",
    "staff": "Сотрудник",
}

ROLE_ABILITY = {
    "ciso": "Раз в ночь проверяет одного живого. Видит только инсайдера: фейкомёт для этой проверки чист.",
    "hygiene": "Назначает один узел неуязвимым до рассвета. Можно прикрыть себя.",
    "whitehat": "Одно действие за ночь: отменить удар по узлу или заблокировать его карту до конца дня.",
    "analyst": "Либо смотрит верхнюю карту архива, либо утром узнаёт характер атаки — без имени исполнителя.",
    "insider": "Вместе с другими инсайдерами выбирает, кого отключить. Союзники вам видны.",
    "fakemeter": "Прикрывает одного живого инсайдера. Проверка руководителя ИБ покажет его чистым.",
    "staff": "Ночного протокола нет. Днём ищете противоречия и голосуете, кого изолировать.",
}

ROLE_TIP = {
    "ciso": "Чистый отчёт не доказывает, что человек свой: так выглядит и фейкомёт, и прикрытый инсайдер.",
    "hygiene": "Закрывайте того, без кого стол развалится. Прикрытие держится одну ночь.",
    "whitehat": "Отмена спасает от уже случившегося удара. Блок карты гасит и второй фактор, и дневную карту.",
    "analyst": "Архив не забирает карту. Подсказка описывает, чем кончилась ночь, а не кто ударил.",
    "insider": "Пока угроз среди активных меньше, чем остальных, контур держится.",
    "fakemeter": "Маска одна на ночь. Если проверку увели в другую сторону, союзник засветится.",
    "staff": "Срочность и один уверенный отчёт — слабые основания отправить человека в карантин.",
}

ITEM_NAMES = {
    "2fa": "Двухфакторная аутентификация",
    "footprint": "Цифровой след",
    "backup": "Резервная копия",
    "phishing": "Фишинговое письмо",
}

ITEM_TEXT = {
    "2fa": "Сработает сам, один раз, если удар до вас дошёл и карту не заблокировали.",
    "footprint": "Узнайте истинную роль того, кто уже в карантине. Результат виден только вам.",
    "backup": "Верните мирного из карантина. Если в снимке угроза, карта сгорит, а стол об этом не узнает.",
    "phishing": "Лишите живого игрока голоса на этом совете. Журнал назовёт адресата, не отправителя.",
}

DECK = ["2fa", "2fa", "2fa", "footprint", "footprint", "backup", "phishing", "phishing"]

NIGHT_ROLES = frozenset({"ciso", "hygiene", "whitehat", "analyst", "insider", "fakemeter"})
THREAT_ROLES = frozenset({"insider", "fakemeter"})

CATEGORY = {
    "ciso": "защита",
    "hygiene": "защита",
    "whitehat": "техподдержка",
    "analyst": "поиск",
    "staff": "персонал",
    "insider": "угроза",
    "fakemeter": "дезинформация",
}

LESSONS = [
    "Второй фактор подтверждают в приложении или ключе, а не по ссылке из письма.",
    "Срочность, чужой домен и просьба «подтвердить пароль» — признаки фишинга.",
    "Один отчёт можно подменить. Статус человека сверяют вторым независимым источником.",
    "Резервная копия возвращает только мирный узел. Чужой снимок в сеть не пускают.",
]

BOT_NAMES = [
    "Вектор", "Мира", "Сота", "Пульс", "Шифр", "Лана", "Корт", "Ника",
    "Орион", "Тема", "Марк", "Ева", "Глеб", "Яна", "Рис",
]

BANNED_NAMES = {name.casefold() for name in ROLE_NAMES.values()}
BANNED_NAMES.update(name.casefold() for name in ITEM_NAMES.values())


class GameError(Exception):
    pass


def composition(n: int) -> list[str]:
    if not 5 <= n <= 15:
        raise ValueError(n)
    if n >= 13:
        roles = ["insider", "insider", "insider", "fakemeter"]
    elif n >= 10:
        roles = ["insider", "insider", "fakemeter"]
    elif n >= 8:
        roles = ["insider", "fakemeter"]
    else:
        roles = ["insider"]
    if n <= 5:
        roles += ["ciso", "hygiene"]
    elif n == 6:
        roles += ["ciso", "hygiene", "whitehat"]
    else:
        roles += ["ciso", "hygiene", "whitehat", "analyst"]
    missing = n - len(roles)
    if missing < 1:
        raise ValueError(n)
    return roles + ["staff"] * missing


def setup_text(n: int) -> str:
    counts = Counter(composition(n))
    order = ["insider", "fakemeter", "ciso", "hygiene", "whitehat", "analyst", "staff"]
    parts = []
    for role in order:
        count = counts[role]
        if not count:
            continue
        label = ROLE_NAMES[role]
        parts.append(f"{label} ×{count}" if count > 1 else label)
    return " · ".join(parts)


@dataclass
class Player:
    id: str
    name: str
    token: str
    bot: bool = False
    role: str | None = None
    alive: bool = True
    item: str | None = None


class Game:
    def __init__(self, code: str, rng=None):
        self.code = code
        self.rng = rng or random.Random()
        self.host_token = secrets.token_hex(16)
        self.players: list[Player] = []
        self._seq_player = 0
        self.phase = "lobby"
        self.night = 0
        self.day = 0
        self.winner: str | None = None
        self.seq = 1
        self.log: list[dict] = []
        self.chat: list[dict] = []
        self.threat_chat: list[dict] = []
        self.notes: dict[str, list[dict]] = {}
        self.archive: list[str] = []
        self.actions: dict[str, dict] = {}
        self.threat_mode: str | None = None
        self.threat_target: str | None = None
        self.threat_confirms: set[str] = set()
        self.ballots: dict[str, str] = {}
        self.blocked: set[str] = set()
        self.silenced: set[str] = set()
        self.ciso_checked: list[str] = []
        self.last_nature: str | None = None

    def touch(self) -> None:
        self.seq += 1

    def _stamp(self) -> str:
        return time.strftime("%H:%M")

    def announce(self, text: str, tone: str = "info") -> None:
        self.log.append({"t": self._stamp(), "text": text, "tone": tone})
        if len(self.log) > 200:
            self.log = self.log[-200:]

    def note(self, pid: str, text: str) -> None:
        bucket = self.notes.setdefault(pid, [])
        bucket.append({"t": self._stamp(), "text": text})
        if len(bucket) > 50:
            del bucket[:-50]

    def player(self, pid: str) -> Player:
        for person in self.players:
            if person.id == pid:
                return person
        raise GameError("Игрок не найден.")

    def living(self) -> list[Player]:
        return [p for p in self.players if p.alive]

    def living_role(self, role: str) -> list[Player]:
        return [p for p in self.living() if p.role == role]

    def is_threat(self, person: Player) -> bool:
        return person.role in THREAT_ROLES

    def name_of(self, pid: str) -> str:
        return self.player(pid).name

    def add_player(self, name: str, bot: bool = False) -> Player:
        if self.phase != "lobby":
            raise GameError("Смена уже идёт. Новый игрок войдёт со следующей партии.")
        if len(self.players) >= 15:
            raise GameError("За столом уже 15 человек.")
        clean = " ".join((name or "").split())
        if not NAME_RE.fullmatch(clean):
            raise GameError("Имя: 2–18 букв, без символов.")
        if clean.casefold() in BANNED_NAMES:
            raise GameError("Это имя занято правилами. Возьмите другое.")
        if any(p.name.casefold() == clean.casefold() for p in self.players):
            raise GameError("Такое имя уже есть за столом.")
        self._seq_player += 1
        person = Player(
            id=f"p{self._seq_player}",
            name=clean,
            token=secrets.token_hex(16),
            bot=bot,
        )
        self.players.append(person)
        self.touch()
        return person

    def add_bot(self) -> Player:
        if self.phase != "lobby":
            raise GameError("Ботов добавляют только в лобби.")
        used = {p.name.casefold() for p in self.players}
        for candidate in BOT_NAMES:
            if candidate.casefold() not in used:
                return self.add_player(candidate, bot=True)
        raise GameError("Свободные имена ботов закончились.")

    def fill_bots(self, target: int = 8) -> int:
        if self.phase != "lobby":
            raise GameError("Ботов добавляют только в лобби.")
        added = 0
        while len(self.players) < target and len(self.players) < 15:
            self.add_bot()
            added += 1
        if added == 0:
            raise GameError("За столом уже достаточно игроков.")
        return added

    def kick(self, pid: str) -> None:
        if self.phase != "lobby":
            raise GameError("После старта убирать игрока нельзя.")
        before = len(self.players)
        self.players = [p for p in self.players if p.id != pid]
        if len(self.players) == before:
            raise GameError("Игрок не найден.")
        self.touch()

    def leave(self, pid: str) -> None:
        self.kick(pid)

    def start(self, roles: list[str] | None = None, items: dict | None = None, archive: list[str] | None = None) -> None:
        if self.phase != "lobby":
            raise GameError("Партия уже начата.")
        count = len(self.players)
        if roles is None and not 5 <= count <= 15:
            raise GameError("Нужно от 5 до 15 игроков.")
        if roles is None:
            roles = composition(count)
            self.rng.shuffle(roles)
        if len(roles) != count:
            raise GameError("Число ролей не сходится с числом игроков.")
        for person, role in zip(self.players, roles):
            if role not in ROLE_NAMES:
                raise GameError("Неизвестная роль.")
            person.role = role
            person.alive = True
            person.item = None
        if items is None:
            self._deal_random()
        else:
            for person in self.players:
                person.item = items.get(person.id)
            self.archive = list(archive or [])
        self.winner = None
        self.log.clear()
        self.chat.clear()
        self.threat_chat.clear()
        self.notes = {p.id: [] for p in self.players}
        self.ciso_checked.clear()
        self.night = 0
        self.day = 0
        self.last_nature = None
        self._enter_night(opening=True)

    def _deal_random(self) -> None:
        deck = DECK[:]
        self.rng.shuffle(deck)
        seats = self.players[:]
        self.rng.shuffle(seats)
        deal_n = min(len(deck), max(3, len(self.players) // 2))
        for person in seats[:deal_n]:
            person.item = deck.pop()
        self.archive = deck

    def _enter_night(self, opening: bool = False) -> None:
        self.night += 1
        self.phase = "night"
        self.actions.clear()
        self.threat_mode = None
        self.threat_target = None
        self.threat_confirms.clear()
        self.ballots.clear()
        self.silenced.clear()
        self.blocked.clear()
        if opening:
            self.announce("Смена открыта. Роли на бейджах. Ночь 1: инкубация угроз.")
        else:
            self.announce(f"Ночь {self.night}. Общий канал закрыт.", "dim")
        self.touch()
        self.maybe_advance()

    def to_lobby(self) -> None:
        for person in self.players:
            person.role = None
            person.alive = True
            person.item = None
        self.phase = "lobby"
        self.night = 0
        self.day = 0
        self.winner = None
        self.log.clear()
        self.chat.clear()
        self.threat_chat.clear()
        self.notes.clear()
        self.archive.clear()
        self.actions.clear()
        self.threat_mode = None
        self.threat_target = None
        self.threat_confirms.clear()
        self.ballots.clear()
        self.blocked.clear()
        self.silenced.clear()
        self.ciso_checked.clear()
        self.last_nature = None
        self.touch()

    def say(self, author: str, text: str, *, pid: str | None = None, gm: bool = False) -> None:
        if self.phase == "night":
            raise GameError("Ночью общий канал молчит.")
        if pid is not None:
            person = self.player(pid)
            if not person.alive and self.phase != "end":
                raise GameError("Из карантина канал недоступен.")
        clean = " ".join((text or "").split())
        if not clean or len(clean) > 300:
            raise GameError("Сообщение пустое или длиннее 300 знаков.")
        self.chat.append({"t": self._stamp(), "name": author, "text": clean, "gm": gm})
        if len(self.chat) > 200:
            self.chat = self.chat[-200:]
        self.touch()

    def can_threat_chat(self, person: Player | None) -> bool:
        return (
            person is not None
            and self.phase == "night"
            and person.alive
            and self.is_threat(person)
        )

    def say_threat(self, pid: str, text: str) -> None:
        person = self.player(pid)
        if not self.can_threat_chat(person):
            raise GameError("Канал угрозы открыт только живым угрозам ночью.")
        clean = " ".join((text or "").split())
        if not clean or len(clean) > 300:
            raise GameError("Сообщение пустое или длиннее 300 знаков.")
        self.threat_chat.append({
            "t": self._stamp(),
            "name": person.name,
            "text": clean,
            "pid": person.id,
        })
        if len(self.threat_chat) > 200:
            self.threat_chat = self.threat_chat[-200:]
        self.touch()

    def act_night(self, pid: str, kind: str, target: str | None = None) -> None:
        if self.phase != "night":
            raise GameError("Сейчас не ночь.")
        person = self.player(pid)
        if not person.alive:
            raise GameError("Вы в карантине и не действуете.")
        if person.role not in NIGHT_ROLES:
            raise GameError("У вашей роли нет ночного протокола.")
        if person.role == "insider":
            self._insider_order(person, kind, target)
        elif person.role == "analyst":
            if kind not in ("archive", "hint", "skip"):
                raise GameError("Неизвестный протокол аналитика.")
            self.actions[pid] = {"kind": kind}
        elif person.role == "whitehat":
            if kind == "skip":
                self.actions[pid] = {"kind": "skip"}
            elif kind in ("save", "block"):
                self._need_alive(target, pid, allow_self=True)
                self.actions[pid] = {"kind": kind, "target": target}
            else:
                raise GameError("Белый хакер отменяет удар, блокирует карту или пропускает ход.")
        elif person.role == "fakemeter":
            if kind == "skip":
                self.actions[pid] = {"kind": "skip"}
            else:
                ally = self._need_alive(target, pid, allow_self=False)
                if ally.role != "insider":
                    raise GameError("Прикрыть можно только живого инсайдера.")
                self.actions[pid] = {"kind": "target", "target": target}
        else:
            if kind == "skip":
                self.actions[pid] = {"kind": "skip"}
            else:
                self._need_alive(target, pid, allow_self=(person.role == "hygiene"))
                self.actions[pid] = {"kind": "target", "target": target}
        self.touch()
        self.maybe_advance()

    def _insider_order(self, person: Player, kind: str, target: str | None) -> None:
        if kind == "pass":
            if self.threat_mode != "pass":
                self.threat_mode = "pass"
                self.threat_target = None
                self.threat_confirms.clear()
            self.threat_confirms.add(person.id)
            return
        if kind != "attack":
            raise GameError("Инсайдеры атакуют цель или пропускают ночь.")
        if target == person.id:
            if self.threat_mode == "attack" and self.threat_target == person.id:
                self.threat_confirms.add(person.id)
                return
            raise GameError("Себя выбрать нельзя.")
        self._need_alive(target, person.id, allow_self=False)
        if self.threat_mode != "attack" or self.threat_target != target:
            self.threat_mode = "attack"
            self.threat_target = target
            self.threat_confirms = {person.id}
        else:
            self.threat_confirms.add(person.id)

    def _need_alive(self, pid: str | None, actor: str, allow_self: bool) -> Player:
        if not pid:
            raise GameError("Сначала выберите игрока.")
        person = self.player(pid)
        if not person.alive:
            raise GameError("Этот узел уже в карантине.")
        if not allow_self and pid == actor:
            raise GameError("Себя выбрать нельзя.")
        return person

    def night_ready(self) -> bool:
        humans = [p for p in self.living() if not p.bot and p.role in NIGHT_ROLES]
        for person in humans:
            if person.role == "insider":
                if person.id not in self.threat_confirms:
                    return False
            elif person.id not in self.actions:
                return False
        return True

    def maybe_advance(self) -> None:
        if self.phase == "night" and self.night_ready():
            self.resolve_night(force=False)
        elif self.phase == "vote" and self.vote_ready():
            self.close_vote()

    def force(self) -> None:
        if self.phase == "night":
            self.resolve_night(force=True)
        elif self.phase == "discuss":
            self.open_vote()
        elif self.phase == "vote":
            self.close_vote()
        else:
            raise GameError("Сейчас нечего закрывать.")

    def fill_bot_night(self, force: bool) -> None:
        insiders = self.living_role("insider")
        humans = [p for p in insiders if not p.bot]
        bots = [p for p in insiders if p.bot]
        if self.threat_mode in ("attack", "pass"):
            for bot in bots:
                self.threat_confirms.add(bot.id)
        elif bots and (not humans or force):
            victim = self.random_victim()
            if victim:
                self.threat_mode = "attack"
                self.threat_target = victim
                self.threat_confirms = {bot.id for bot in bots}
        for person in self.living():
            if person.bot and person.role in NIGHT_ROLES and person.role != "insider":
                if person.id not in self.actions:
                    self.actions[person.id] = self._bot_solo(person)

    def _bot_solo(self, person: Player) -> dict:
        others = [p for p in self.living() if p.id != person.id]
        if not others:
            return {"kind": "skip"}
        if person.role == "fakemeter":
            allies = self.living_role("insider")
            if not allies:
                return {"kind": "skip"}
            return {"kind": "target", "target": self.rng.choice(allies).id}
        if person.role == "ciso":
            pool = [p for p in others if p.id not in self.ciso_checked] or others
            return {"kind": "target", "target": self.rng.choice(pool).id}
        if person.role == "hygiene":
            town = [p for p in self.living() if not self.is_threat(p)]
            return {"kind": "target", "target": self.rng.choice(town or others).id}
        if person.role == "whitehat":
            town = [p for p in self.living() if not self.is_threat(p)]
            return {"kind": "save", "target": self.rng.choice(town or others).id}
        if person.role == "analyst":
            return {"kind": "hint" if self.night % 2 else "archive"}
        return {"kind": "skip"}

    def random_victim(self) -> str | None:
        town = [p for p in self.living() if not self.is_threat(p)]
        pool = town or [p for p in self.living() if p.role != "insider"]
        if not pool:
            return None
        return self.rng.choice(pool).id

    def _action_of(self, role: str) -> dict | None:
        # Действие уже сдано в начале ночи и срабатывает, даже если узел
        # отключили этой же ночью.
        for person in self.players:
            if person.role != role:
                continue
            action = self.actions.get(person.id)
            if not action:
                continue
            payload = dict(action)
            payload["actor"] = person.id
            return payload
        return None

    def resolve_night(self, force: bool = False) -> None:
        if self.phase != "night":
            raise GameError("Сейчас не ночь.")
        if not force and not self.night_ready():
            raise GameError("Ещё не все сдали протоколы.")
        self.fill_bot_night(force)
        self.blocked.clear()

        whitehat = self._action_of("whitehat")
        if whitehat and whitehat["kind"] == "block" and whitehat.get("target"):
            blocked_id = whitehat["target"]
            self.blocked.add(blocked_id)
            self.note(whitehat["actor"], f"Карта игрока {self.name_of(blocked_id)} заблокирована до конца дня.")
            self.note(blocked_id, "До конца дня ваши карты не действуют: вмешательство техподдержки.")

        hygiene = self._action_of("hygiene")
        protect = hygiene["target"] if hygiene and hygiene["kind"] == "target" else None
        if protect:
            self.note(hygiene["actor"], f"Неуязвимость на эту ночь: {self.name_of(protect)}.")

        attack = self._chosen_attack(force)
        nature = "none"
        if attack:
            if protect == attack:
                nature = "hygiene"
            elif self._consume_2fa(attack):
                nature = "2fa"
            elif whitehat and whitehat["kind"] == "save" and whitehat.get("target") == attack:
                nature = "whitehat"
            else:
                nature = "kill"
                victim = self.player(attack)
                victim.alive = False
                self.announce(f"Ночь {self.night}. {victim.name} отключён и отправлен в карантин.", "alert")
                self.note(attack, "Ваш узел отключён. Журнал виден, писать и голосовать нельзя.")
        if nature != "kill":
            self.announce(f"Ночь {self.night}. Критических отключений нет.", "ok")
        self.last_nature = nature
        self._feedback_whitehat(whitehat, attack, nature)
        self._feedback_insiders(attack, nature)
        self._feedback_fakemeter()
        self._resolve_ciso()
        self._resolve_analyst(nature, attack)

        winner = self.winner_now()
        if winner:
            self.finish(winner)
            return
        self.phase = "discuss"
        self.day = self.night
        self.announce(f"День {self.day}. Разбор: карты, потом совет.", "info")
        self.touch()

    def _consume_2fa(self, pid: str) -> bool:
        person = self.player(pid)
        if person.item != "2fa" or pid in self.blocked:
            return False
        person.item = None
        self.note(pid, "Второй фактор сгорел и отклонил атаку. Карта потрачена.")
        return True

    def _chosen_attack(self, force: bool) -> str | None:
        if not self.living_role("insider"):
            return None
        if self.threat_mode == "pass":
            return None
        if self.threat_mode == "attack" and self.threat_target:
            target = self.player(self.threat_target)
            if target.alive:
                return target.id
        if force:
            return self.random_victim()
        return None

    def _feedback_whitehat(self, whitehat: dict | None, attack: str | None, nature: str) -> None:
        if not whitehat or whitehat["kind"] != "save":
            return
        target = whitehat.get("target")
        if not target:
            return
        label = self.name_of(target)
        if attack != target:
            self.note(whitehat["actor"], f"По узлу {label} атаки не было.")
        elif nature == "whitehat":
            self.note(whitehat["actor"], f"Вы отменили атаку на {label}.")
        else:
            self.note(whitehat["actor"], f"{label} устоял без вашей отмены.")

    def _feedback_insiders(self, attack: str | None, nature: str) -> None:
        if not attack:
            return
        label = self.name_of(attack)
        text = f"Атака прошла: {label} в карантине." if nature == "kill" else f"Атака по {label} не отключила узел."
        for person in self.players:
            if person.role == "insider" and person.alive:
                self.note(person.id, text)

    def _feedback_fakemeter(self) -> None:
        action = self._action_of("fakemeter")
        if not action or action["kind"] != "target":
            return
        ciso = self._action_of("ciso")
        hit = bool(ciso and ciso["kind"] == "target" and ciso.get("target") == action["target"])
        if hit:
            self.note(action["actor"], f"Подмена сработала: проверка {self.name_of(action['target'])} дала чистый отчёт.")
        else:
            self.note(action["actor"], "Подмена этой ночью не попала под проверку.")

    def _resolve_ciso(self) -> None:
        action = self._action_of("ciso")
        if not action or action["kind"] != "target" or not action.get("target"):
            return
        target = self.player(action["target"])
        masked = False
        fake = self._action_of("fakemeter")
        if fake and fake["kind"] == "target" and fake.get("target") == target.id:
            masked = True
        found = target.role == "insider" and not masked
        if target.id not in self.ciso_checked:
            self.ciso_checked.append(target.id)
        if found:
            self.note(action["actor"], f"Проверка {target.name}: обнаружен вредоносный код. Это инсайдер.")
        else:
            self.note(action["actor"], f"Проверка {target.name}: вредоносный код не обнаружен.")

    def _resolve_analyst(self, nature: str, attack: str | None) -> None:
        action = self._action_of("analyst")
        if not action:
            return
        if action["kind"] == "archive":
            if not self.archive:
                self.note(action["actor"], "Архив пуст.")
                return
            card = self.archive.pop(0)
            self.archive.append(card)
            self.note(action["actor"], f"Верхняя карта архива: {ITEM_NAMES[card]}. Колода на месте.")
            return
        if action["kind"] != "hint":
            return
        hints = {
            "none": "Атаки не было.",
            "hygiene": "Атака была. Цель оказалась неуязвима: сработал протокол кибергигиены.",
            "2fa": "Атака была. Её отклонил одноразовый второй фактор.",
            "whitehat": "Атака дошла и была отменена белым хакером.",
        }
        if nature == "kill" and attack:
            group = CATEGORY[self.player(attack).role or "staff"]
            text = f"Атака прошла, узел отключён. Группа цели: {group}."
        else:
            text = hints.get(nature, "Характер атаки не определён.")
        self.note(action["actor"], "Характер атаки: " + text)

    def play_item(self, pid: str, target: str | None) -> None:
        if self.phase != "discuss":
            raise GameError("Карты играют на разборе, до голосования.")
        person = self.player(pid)
        if not person.alive:
            raise GameError("Из карантина карты не играют.")
        if pid in self.blocked:
            raise GameError("Техподдержка заблокировала ваши карты до конца дня.")
        item = person.item
        if not item:
            raise GameError("У вас нет карты.")
        if item == "2fa":
            raise GameError("Второй фактор срабатывает сам, когда по вам бьют.")
        if item == "footprint":
            subject = self.player(target or "")
            if subject.alive:
                raise GameError("Цифровой след снимают с того, кто уже в карантине.")
            person.item = None
            self.note(pid, f"Цифровой след. {subject.name}: {ROLE_NAMES[subject.role]}.")
        elif item == "backup":
            subject = self.player(target or "")
            if subject.alive:
                raise GameError("Этот игрок и так в сети.")
            person.item = None
            if self.is_threat(subject):
                self.note(pid, f"Копия {subject.name} повреждена: в снимке вредоносный код. Карта сожжена.")
            else:
                subject.alive = True
                self.announce(f"{subject.name} снова в сети: резервная копия.", "ok")
                self.note(pid, f"Резервная копия вернула {subject.name}.")
                self.note(subject.id, "Вас восстановили из резервной копии. Вы снова в обсуждении.")
        elif item == "phishing":
            subject = self._need_alive(target, pid, allow_self=False)
            person.item = None
            self.silenced.add(subject.id)
            self.announce(f"Фишинговое письмо: {subject.name} без голоса на этом совете.", "alert")
            self.note(pid, f"Письмо ушло на {subject.name}.")
            self.note(subject.id, "Вам переслали фишинг. На этом голосовании голоса нет.")
        else:
            raise GameError("Эта карта так не играется.")
        self.touch()

    def open_vote(self) -> None:
        if self.phase != "discuss":
            raise GameError("Голосование открывают с разбора.")
        self.phase = "vote"
        self.ballots.clear()
        self.announce("Совет открыт. Один голос — на живого коллегу.", "info")
        self._fill_bot_votes()
        self.touch()
        if self.vote_ready():
            self.close_vote()

    def cast_vote(self, pid: str, target: str) -> None:
        if self.phase != "vote":
            raise GameError("Голосование закрыто.")
        person = self.player(pid)
        if not person.alive:
            raise GameError("Из карантина не голосуют.")
        if pid in self.silenced:
            raise GameError("Фишинговое письмо лишило вас голоса.")
        self._need_alive(target, pid, allow_self=False)
        self.ballots[pid] = target
        self.touch()
        self.maybe_advance()

    def vote_ready(self) -> bool:
        humans = [p for p in self.living() if not p.bot and p.id not in self.silenced]
        if humans:
            return all(p.id in self.ballots for p in humans)
        bots = [p for p in self.living() if p.bot and p.id not in self.silenced]
        return bool(bots) and all(p.id in self.ballots for p in bots)

    def _fill_bot_votes(self) -> None:
        for person in self.living():
            if not person.bot or person.id in self.silenced or person.id in self.ballots:
                continue
            choice = self._bot_vote_target(person)
            if choice:
                self.ballots[person.id] = choice

    def _bot_vote_target(self, person: Player) -> str | None:
        options = []
        for other in self.living():
            if other.id == person.id:
                continue
            if self.is_threat(person) and self.is_threat(other):
                continue
            options.append(other)
        if not options:
            options = [p for p in self.living() if p.id != person.id]
        if not options:
            return None
        return self.rng.choice(options).id

    def close_vote(self) -> None:
        if self.phase != "vote":
            raise GameError("Голосование ещё не открыто.")
        self._fill_bot_votes()
        counts: Counter[str] = Counter(self.ballots.values())
        if not counts:
            self.announce("Голосов нет. Карантин никого не забрал.", "dim")
        else:
            best = max(counts.values())
            leaders = [pid for pid, votes in counts.items() if votes == best]
            detail = ", ".join(
                f"{self.name_of(pid)} — {votes}" for pid, votes in counts.most_common()
            )
            if len(leaders) != 1:
                self.announce(f"Ничья ({detail}). Карантина нет.", "dim")
            else:
                exile = self.player(leaders[0])
                exile.alive = False
                voters = [self.name_of(voter) for voter, pid in self.ballots.items() if pid == exile.id]
                who = ", ".join(voters)
                self.announce(
                    f"Карантин: {exile.name} ({best}: {who}).",
                    "alert",
                )
                self.note(exile.id, "Стол отправил вас в карантин.")
        winner = self.winner_now()
        if winner:
            self.finish(winner)
            return
        self._enter_night()

    def winner_now(self) -> str | None:
        alive = self.living()
        threats = [p for p in alive if self.is_threat(p)]
        town = [p for p in alive if not self.is_threat(p)]
        if not threats:
            return "town"
        if len(threats) >= len(town):
            return "threat"
        return None

    def finish(self, winner: str) -> None:
        self.winner = winner
        self.phase = "end"
        if winner == "town":
            self.announce("Угрозы изолированы. Контур удержан.", "ok")
        else:
            self.announce("Ключевых сотрудников не хватает. Контур потерян.", "alert")
        self.touch()

    def dispatch(self, actor: Player | None, is_host: bool, op: str, data: dict) -> None:
        if op == "start":
            self._host(is_host)
            self.start()
        elif op == "bot":
            self._host(is_host)
            self.add_bot()
        elif op == "fill":
            self._host(is_host)
            try:
                target = int(data.get("target") or 8)
            except (TypeError, ValueError):
                target = 8
            self.fill_bots(target)
        elif op == "kick":
            self._host(is_host)
            self.kick(str(data.get("id") or ""))
        elif op == "leave":
            if actor is None:
                raise GameError("Сначала сядьте за стол.")
            self.leave(actor.id)
        elif op == "abort":
            self._host(is_host)
            self.to_lobby()
        elif op == "force":
            self._host(is_host)
            self.force()
        elif op == "night":
            if actor is None:
                raise GameError("Это действие игрока.")
            self.act_night(actor.id, str(data.get("kind") or ""), data.get("target"))
        elif op == "item":
            if actor is None:
                raise GameError("Это действие игрока.")
            self.play_item(actor.id, data.get("target"))
        elif op == "vote":
            if actor is None:
                raise GameError("Это действие игрока.")
            self.cast_vote(actor.id, str(data.get("target") or ""))
        elif op == "chat":
            if is_host and actor is None:
                self.say("Ведущий", str(data.get("text") or ""), gm=True)
            elif actor is not None:
                self.say(actor.name, str(data.get("text") or ""), pid=actor.id)
            else:
                raise GameError("Некому писать в канал.")
        elif op == "threat_chat":
            if actor is None:
                raise GameError("Это действие игрока.")
            self.say_threat(actor.id, str(data.get("text") or ""))
        else:
            raise GameError("Неизвестная команда.")

    def _host(self, is_host: bool) -> None:
        if not is_host:
            raise GameError("Это действие ведущего.")

    def view(self, actor: Player | None, host: bool) -> dict:
        you = None
        if actor is not None and actor.role:
            you = self._you(actor)
        elif actor is not None:
            you = {
                "id": actor.id,
                "name": actor.name,
                "alive": True,
                "role": None,
                "locked": False,
            }
        players = []
        for person in self.players:
            row = {"id": person.id, "name": person.name, "alive": person.alive}
            if self.phase == "lobby":
                row["bot"] = person.bot
            if self.phase in ("discuss", "vote", "end"):
                row["silenced"] = person.id in self.silenced
            players.append(row)
        ballots = []
        if self.phase == "vote":
            for voter, target in self.ballots.items():
                ballots.append({
                    "voterId": voter,
                    "voter": self.name_of(voter),
                    "targetId": target,
                    "target": self.name_of(target),
                })
        reveal = []
        if self.phase == "end":
            for person in self.players:
                reveal.append({
                    "id": person.id,
                    "name": person.name,
                    "alive": person.alive,
                    "role": person.role,
                    "roleName": ROLE_NAMES.get(person.role or "", "—"),
                    "team": "threat" if person.role in THREAT_ROLES else "town",
                    "item": ITEM_NAMES.get(person.item or "", ""),
                })
        state = {
            "code": self.code,
            "phase": self.phase,
            "night": self.night,
            "day": self.day,
            "seq": self.seq,
            "winner": self.winner,
            "log": self.log[-40:],
            "chat": self.chat[-60:],
            "players": players,
            "ballots": ballots,
            "you": you,
            "host": host,
            "count": len(self.players),
            "min": 5,
            "max": 15,
            "reveal": reveal,
            "lessons": LESSONS if self.phase == "end" else [],
            "threatChat": [],
            "canThreatChat": False,
        }
        if self.can_threat_chat(actor):
            state["threatChat"] = [
                {"t": item["t"], "name": item["name"], "text": item["text"]}
                for item in self.threat_chat[-60:]
            ]
            state["canThreatChat"] = True
        if self.phase == "lobby":
            state["setup"] = setup_text(len(self.players)) if 5 <= len(self.players) <= 15 else ""
            state["need"] = max(0, 5 - len(self.players))
        return state

    def _you(self, person: Player) -> dict:
        allies = []
        if self.is_threat(person):
            for other in self.players:
                if other.id != person.id and other.role in THREAT_ROLES:
                    allies.append({
                        "id": other.id,
                        "name": other.name,
                        "roleName": ROLE_NAMES[other.role or "staff"],
                        "alive": other.alive,
                    })
        locked = False
        if person.role == "insider":
            locked = person.id in self.threat_confirms and self.threat_mode in ("attack", "pass")
        elif person.role in NIGHT_ROLES:
            locked = person.id in self.actions
        item = None
        if person.item:
            item = {
                "id": person.item,
                "name": ITEM_NAMES[person.item],
                "text": ITEM_TEXT[person.item],
            }
        echo = ""
        if self.phase == "night" and person.role == "insider":
            total = len(self.living_role("insider"))
            done = len([i for i in self.living_role("insider") if i.id in self.threat_confirms])
            if self.threat_mode == "pass":
                echo = f"Группа пропускает атаку. Подтвердили {done}/{total}."
            elif self.threat_mode == "attack" and self.threat_target:
                echo = f"Цель группы: {self.name_of(self.threat_target)}. Подтвердили {done}/{total}."
            else:
                echo = "Группа ещё не выбрала цель."
        elif self.phase == "night" and person.id in self.actions:
            echo = self._echo_action(person)
        return {
            "id": person.id,
            "name": person.name,
            "alive": person.alive,
            "role": person.role,
            "roleName": ROLE_NAMES[person.role or "staff"],
            "ability": ROLE_ABILITY[person.role or "staff"],
            "tip": ROLE_TIP[person.role or "staff"],
            "team": "threat" if self.is_threat(person) else "town",
            "allies": allies,
            "item": item,
            "notes": self.notes.get(person.id, [])[-12:],
            "checked": list(self.ciso_checked) if person.role == "ciso" else [],
            "echo": echo,
            "locked": locked and self.phase == "night",
            "silenced": person.id in self.silenced,
            "blocked": person.id in self.blocked,
            "ballot": self.ballots.get(person.id),
            "act": self._act_spec(person),
            "canVote": self.phase == "vote" and person.alive and person.id not in self.silenced,
            "teamTarget": self.threat_target if person.role == "insider" else None,
        }

    def _echo_action(self, person: Player) -> str:
        action = self.actions.get(person.id) or {}
        kind = action.get("kind")
        target = action.get("target")
        label = self.name_of(target) if target else ""
        if person.role == "ciso" and kind == "target":
            return f"Проверяете: {label}."
        if person.role == "hygiene" and kind == "target":
            return f"Прикрыт узел: {label}."
        if person.role == "whitehat" and kind == "save":
            return f"Готовы отменить удар по: {label}."
        if person.role == "whitehat" and kind == "block":
            return f"Блокируете карту: {label}."
        if person.role == "fakemeter" and kind == "target":
            return f"Подмена на: {label}."
        if person.role == "analyst" and kind == "archive":
            return "Смотрите архив. Отчёт придёт на рассвете."
        if person.role == "analyst" and kind == "hint":
            return "Ждёте характер атаки. Отчёт придёт на рассвете."
        if kind == "skip":
            return "Протокол: пропуск."
        return "Протокол принят."

    def _act_spec(self, person: Player) -> dict | None:
        if self.phase != "night" or not person.alive:
            return None
        if person.role == "staff":
            return {"type": "wait"}
        if person.role == "insider":
            return {"type": "attack", "targets": [p.id for p in self.living() if p.id != person.id]}
        if person.role == "fakemeter":
            return {"type": "mask", "targets": [p.id for p in self.living_role("insider")]}
        if person.role == "ciso":
            return {"type": "inspect", "targets": [p.id for p in self.living() if p.id != person.id]}
        if person.role == "hygiene":
            return {"type": "protect", "targets": [p.id for p in self.living()]}
        if person.role == "whitehat":
            return {"type": "whitehat", "targets": [p.id for p in self.living()]}
        if person.role == "analyst":
            return {"type": "analyst", "archive": len(self.archive)}
        return {"type": "wait"}
