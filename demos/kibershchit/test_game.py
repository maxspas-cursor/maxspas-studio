# -*- coding: utf-8 -*-
import json
import random
import threading
import unittest
import urllib.request

from game import Game, GameError, composition
from server import Handler, Server, reset_rooms


def table(roles, items="none", archive=None, seed=1):
    game = Game("TEST", rng=random.Random(seed))
    players = [game.add_player(f"Игрок{i + 1}") for i in range(len(roles))]
    if items == "random":
        game.start(roles=list(roles))
        return game
    if items == "none":
        preset = {person.id: None for person in players}
    else:
        preset = {person.id: item for person, item in zip(players, items)}
    game.start(roles=list(roles), items=preset, archive=archive or [])
    return game


def notes(game, person):
    return " ".join(item["text"] for item in game.notes.get(person.id, []))


def blob(game, person=None, host=False):
    return json.dumps(game.view(person, host), ensure_ascii=False)


class CompositionTests(unittest.TestCase):
    def test_range(self):
        for count in range(5, 16):
            roles = composition(count)
            self.assertEqual(len(roles), count)
            self.assertGreaterEqual(roles.count("insider"), 1)
            self.assertGreaterEqual(roles.count("staff"), 1)
            threats = roles.count("insider") + roles.count("fakemeter")
            self.assertLess(threats, count - threats)


class MechanicTests(unittest.TestCase):
    def test_kill(self):
        game = table(["insider", "staff", "staff", "staff", "staff"])
        insider, victim, *_ = game.players
        game.act_night(insider.id, "attack", victim.id)
        self.assertEqual(game.phase, "discuss")
        self.assertFalse(victim.alive)
        self.assertEqual(game.last_nature, "kill")

    def test_hygiene_and_2fa_and_whitehat(self):
        game = table(
            ["insider", "hygiene", "staff", "staff", "staff"],
            items=[None, None, "2fa", None, None],
        )
        insider, hygiene, shielded, *_ = game.players
        game.act_night(hygiene.id, "target", shielded.id)
        game.act_night(insider.id, "attack", shielded.id)
        self.assertTrue(shielded.alive)
        self.assertEqual(game.last_nature, "hygiene")
        self.assertEqual(shielded.item, "2fa")

        game = table(
            ["insider", "whitehat", "staff", "staff", "staff"],
            items=[None, None, "2fa", None, None],
        )
        insider, hacker, shielded, *_ = game.players
        game.act_night(hacker.id, "block", shielded.id)
        game.act_night(insider.id, "attack", shielded.id)
        self.assertFalse(shielded.alive)
        self.assertEqual(shielded.item, "2fa")
        self.assertEqual(game.last_nature, "kill")

        game = table(["insider", "whitehat", "staff", "staff", "staff"])
        insider, hacker, target, *_ = game.players
        game.act_night(hacker.id, "save", target.id)
        game.act_night(insider.id, "attack", target.id)
        self.assertTrue(target.alive)
        self.assertEqual(game.last_nature, "whitehat")
        self.assertIn("отменили атаку", notes(game, hacker))

    def test_2fa_once(self):
        game = table(
            ["insider", "staff", "staff", "staff", "staff"],
            items=[None, "2fa", None, None, None],
        )
        insider, shielded, *_ = game.players
        game.act_night(insider.id, "attack", shielded.id)
        self.assertTrue(shielded.alive)
        self.assertIsNone(shielded.item)
        self.assertEqual(game.last_nature, "2fa")
        self._tie_vote(game)
        game.act_night(insider.id, "attack", shielded.id)
        self.assertFalse(shielded.alive)
        self.assertEqual(game.last_nature, "kill")

    def test_fakemeter_masks_only_ally(self):
        game = table(["insider", "fakemeter", "ciso", "staff", "staff"])
        insider, fake, ciso, *_ = game.players
        game.act_night(insider.id, "pass")
        game.act_night(fake.id, "target", insider.id)
        game.act_night(ciso.id, "target", insider.id)
        self.assertIn("не обнаружен", notes(game, ciso))
        self.assertNotIn("Это инсайдер", notes(game, ciso))
        self.assertIn("Подмена сработала", notes(game, fake))

        game = table(["insider", "fakemeter", "ciso", "staff", "staff"])
        insider, fake, ciso, *_ = game.players
        game.act_night(insider.id, "pass")
        game.act_night(fake.id, "skip")
        game.act_night(ciso.id, "target", insider.id)
        self.assertIn("Это инсайдер", notes(game, ciso))

        game = table(["insider", "fakemeter", "ciso", "staff", "staff"])
        insider, fake, ciso, staff, _ = game.players
        game.act_night(insider.id, "pass")
        game.act_night(fake.id, "target", insider.id)
        with self.assertRaises(GameError):
            game.act_night(fake.id, "target", staff.id)

    def test_fakemeter_masks_same_ally_next_night(self):
        game = table(["insider", "fakemeter", "ciso", "staff", "staff"])
        insider, fake, ciso, *_ = game.players
        game.act_night(insider.id, "pass")
        game.act_night(fake.id, "target", insider.id)
        game.act_night(ciso.id, "skip")
        self._tie_vote(game)
        game.act_night(insider.id, "pass")
        game.act_night(fake.id, "target", insider.id)
        self.assertEqual(game.actions[fake.id], {"kind": "target", "target": insider.id})

    def test_analyst_and_archive(self):
        game = table(
            ["insider", "analyst", "staff", "staff", "staff"],
            archive=["backup", "phishing"],
        )
        insider, analyst, *_ = game.players
        game.act_night(analyst.id, "archive")
        game.act_night(insider.id, "pass")
        self.assertIn("Резервная копия", notes(game, analyst))
        self.assertEqual(game.archive, ["phishing", "backup"])

        game = table(["insider", "analyst", "staff", "staff", "staff"])
        insider, analyst, staff, *_ = game.players
        game.act_night(analyst.id, "hint")
        game.act_night(insider.id, "attack", staff.id)
        self.assertIn("персонал", notes(game, analyst))
        self.assertNotIn(staff.name, notes(game, analyst).split("Группа")[-1])

    def test_items_are_private(self):
        game = table(
            ["insider", "insider", "staff", "staff", "staff"],
            items=[None, None, "footprint", "backup", None],
        )
        first, second, reader, restorer, other = game.players
        game.act_night(first.id, "attack", second.id)
        game.act_night(second.id, "attack", second.id)
        self.assertFalse(second.alive)
        game.play_item(reader.id, second.id)
        self.assertIn("Инсайдер", notes(game, reader))
        hidden = blob(game, other)
        self.assertNotIn("Инсайдер", hidden)
        self.assertNotIn("Цифровой след", hidden)
        game.play_item(restorer.id, second.id)
        self.assertFalse(second.alive)
        self.assertIn("вредоносный код", notes(game, restorer))
        self.assertNotIn("вредоносный код", blob(game, other))

        game = table(
            ["insider", "staff", "staff", "staff", "staff"],
            items=[None, None, "backup", None, None],
        )
        insider, victim, restorer, *_ = game.players
        game.act_night(insider.id, "attack", victim.id)
        game.play_item(restorer.id, victim.id)
        self.assertTrue(victim.alive)
        self.assertIn("снова в сети", blob(game, insider))

    def test_phishing_blocks_vote_and_tie_spares(self):
        game = table(
            ["insider", "staff", "staff", "staff", "staff"],
            items=[None, "phishing", None, None, None],
        )
        insider, phisher, muted, a, b = game.players
        game.act_night(insider.id, "pass")
        game.play_item(phisher.id, muted.id)
        game.open_vote()
        with self.assertRaises(GameError):
            game.cast_vote(muted.id, a.id)
        game.cast_vote(insider.id, a.id)
        game.cast_vote(phisher.id, b.id)
        game.cast_vote(a.id, insider.id)
        self.assertEqual(game.phase, "vote")
        game.cast_vote(b.id, phisher.id)
        self.assertEqual(game.phase, "night")
        self.assertTrue(insider.alive)
        self.assertTrue(a.alive)
        self.assertTrue(b.alive)

    def test_town_and_threat_win(self):
        game = table(["insider", "staff", "staff", "staff", "staff"])
        insider, *town = game.players
        game.act_night(insider.id, "pass")
        game.open_vote()
        for person in game.players:
            if person.id == insider.id:
                game.cast_vote(person.id, town[0].id)
            else:
                game.cast_vote(person.id, insider.id)
        self.assertEqual(game.winner, "town")

        game = table(["insider", "staff", "staff", "staff", "staff"])
        insider, victim, *rest = game.players
        game.act_night(insider.id, "attack", victim.id)
        self.assertEqual(game.phase, "discuss")
        self._exile(game, rest[0].id)
        self.assertEqual(game.phase, "night")
        game.act_night(insider.id, "attack", rest[1].id)
        self.assertEqual(game.winner, "threat")

    def test_view_hides_secrets(self):
        game = table(
            ["insider", "fakemeter", "ciso", "staff", "staff"],
            items=["phishing", None, None, None, None],
        )
        insider, fake, ciso, staff, other = game.players
        game.act_night(insider.id, "pass")
        game.act_night(fake.id, "target", insider.id)
        game.act_night(ciso.id, "target", insider.id)
        hidden = blob(game, staff)
        for word in ("Инсайдер", "Фейкомёт", "инсайдер", "фейкомёт", "phishing", "Фишинговое"):
            self.assertNotIn(word, hidden)
        self.assertEqual(game.view(staff, False)["you"]["allies"], [])
        host = blob(game, host=True)
        self.assertNotIn("Инсайдер", host)
        self.assertNotIn("roleName", host)
        self.assertNotIn(insider.token, hidden)
        self.assertNotIn(game.host_token, host)
        self.assertIn("Фейкомёт", blob(game, insider))

    def test_threat_night_chat_hidden_from_staff_and_host(self):
        game = table(["insider", "fakemeter", "ciso", "staff", "staff"])
        insider, fake, ciso, staff, other = game.players
        secret = "Секретный план ALPHA-СЕМЬ"
        game.say_threat(insider.id, secret)
        threat_view = game.view(insider, False)
        self.assertTrue(threat_view["canThreatChat"])
        self.assertTrue(any(item["text"] == secret for item in threat_view["threatChat"]))
        ally_view = game.view(fake, False)
        self.assertTrue(ally_view["canThreatChat"])
        self.assertTrue(any(item["text"] == secret for item in ally_view["threatChat"]))
        staff_blob = blob(game, staff)
        host_blob = blob(game, host=True)
        ciso_blob = blob(game, ciso)
        self.assertNotIn(secret, staff_blob)
        self.assertNotIn(secret, host_blob)
        self.assertNotIn(secret, ciso_blob)
        self.assertFalse(game.view(staff, False)["canThreatChat"])
        self.assertFalse(game.view(None, True)["canThreatChat"])
        self.assertEqual(game.view(staff, False)["threatChat"], [])
        self.assertEqual(game.view(None, True)["threatChat"], [])
        with self.assertRaises(GameError):
            game.say_threat(staff.id, "попытка")
        with self.assertRaises(GameError):
            game.say(insider.name, "днём нельзя", pid=insider.id)
        game.act_night(insider.id, "pass")
        game.act_night(fake.id, "skip")
        game.act_night(ciso.id, "skip")
        self.assertEqual(game.phase, "discuss")
        self.assertFalse(game.view(insider, False)["canThreatChat"])
        self.assertEqual(game.view(insider, False)["threatChat"], [])
        self.assertNotIn(secret, blob(game, insider))
        self.assertNotIn(secret, blob(game, host=True))

    def test_bots_finish(self):
        game = Game("BOTS", rng=random.Random(2))
        for _ in range(8):
            game.add_bot()
        game.start()
        self.assertIn(game.phase, ("discuss", "end", "vote", "night"))
        for _ in range(40):
            if game.phase == "end":
                break
            if game.phase == "night":
                game.resolve_night(force=True)
            elif game.phase == "discuss":
                game.open_vote()
            elif game.phase == "vote":
                game.close_vote()
            else:
                self.fail(game.phase)
        self.assertEqual(game.phase, "end")
        self.assertIn(game.winner, ("town", "threat"))

    def test_bots_auto_night_when_no_humans(self):
        game = Game("AUTO", rng=random.Random(3))
        for _ in range(5):
            game.add_bot()
        game.start()
        self.assertNotEqual(game.phase, "night")
        self.assertIn(game.phase, ("discuss", "end"))

    def _tie_vote(self, game):
        game.open_vote()
        alive = game.living()
        primary, secondary, extra = alive[0], alive[1], alive[2]
        counts = {primary.id: 0, secondary.id: 0, extra.id: 0}
        caps = {primary.id: 2, secondary.id: 2, extra.id: 1}
        plan = []
        for person in alive:
            choice = None
            for candidate in (primary, secondary, extra):
                if candidate.id == person.id:
                    continue
                if counts[candidate.id] < caps[candidate.id]:
                    choice = candidate
                    break
            if choice is None:
                choice = next(other for other in alive if other.id != person.id)
            counts[choice.id] += 1
            plan.append((person, choice))
        for person, choice in plan[:-1]:
            game.cast_vote(person.id, choice.id)
        self.assertEqual(game.phase, "vote")
        game.cast_vote(plan[-1][0].id, plan[-1][1].id)
        self.assertEqual(game.phase, "night")
        self.assertIsNone(game.winner)

    def _exile(self, game, pid):
        game.open_vote()
        alive = game.living()
        target = game.player(pid)
        others = [person for person in alive if person.id != pid]
        plan = [(target, others[0])] + [(person, target) for person in others]
        for person, choice in plan[:-1]:
            game.cast_vote(person.id, choice.id)
        game.cast_vote(plan[-1][0].id, plan[-1][1].id)


class ServerTests(unittest.TestCase):
    def test_room_hides_roles_from_host(self):
        reset_rooms()
        httpd = Server(("127.0.0.1", 0), Handler)
        thread = threading.Thread(target=httpd.serve_forever, daemon=True)
        thread.start()
        port = httpd.server_address[1]
        base = f"http://127.0.0.1:{port}"
        try:
            created = request(base + "/api/room", {})
            host = created["hostToken"]
            code = created["state"]["code"]
            self.assertIn("shareUrl", created["state"])
            tokens = []
            for index in range(5):
                joined = request(base + "/api/join", {"code": code, "name": f"Игрок{index + 1}"})
                tokens.append(joined["playerToken"])
            started = request(base + "/api/act", {"op": "start"}, token=host)
            self.assertEqual(started["phase"], "night")
            raw = json.dumps(started, ensure_ascii=False)
            self.assertNotIn("Инсайдер", raw)
            self.assertNotIn("roleName", raw)
            mine = request(base + "/api/state", token=tokens[0])
            self.assertTrue(mine["you"]["roleName"])
            missing = request(base + "/api/join", {"code": "ZZZZ", "name": "Никто"}, expect=404)
            self.assertIn("error", missing)
        finally:
            httpd.shutdown()
            httpd.server_close()


def request(url, payload=None, token=None, expect=200):
    data = None
    headers = {}
    method = "GET"
    if payload is not None:
        data = json.dumps(payload).encode("utf-8")
        headers["Content-Type"] = "application/json"
        method = "POST"
    if token:
        headers["X-Token"] = token
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as response:
            body = json.loads(response.read().decode("utf-8"))
            status = response.status
    except urllib.error.HTTPError as exc:
        body = json.loads(exc.read().decode("utf-8"))
        status = exc.code
        exc.close()
    if status != expect:
        raise AssertionError(f"{status} != {expect}: {body}")
    return body


if __name__ == "__main__":
    unittest.main()
