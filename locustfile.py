from __future__ import annotations

import json
import os
import random
import threading
import time
import urllib.request
from dataclasses import dataclass
from typing import Any

from gevent import sleep as gevent_sleep
from locust import HttpUser, SequentialTaskSet, events, task, between
from locust.exception import StopUser


APP_URL = os.environ.get("APP_URL", "http://localhost:3000").rstrip("/")
CONVEX_URL = os.environ.get("CONVEX_URL", "").rstrip("/")
ADMIN_KEY = os.environ.get("ADMIN_KEY", "").strip()
LEVEL5_PUBLIC_URL = os.environ.get("LEVEL5_PUBLIC_URL", "https://example.com")
AUTO_APPROVE_LEVEL5 = os.environ.get("AUTO_APPROVE_LEVEL5", "1") != "0"
LEVEL5_APPROVAL_DELAY_MIN = float(os.environ.get("LEVEL5_APPROVAL_DELAY_MIN", "8"))
LEVEL5_APPROVAL_DELAY_MAX = float(os.environ.get("LEVEL5_APPROVAL_DELAY_MAX", "22"))

if not CONVEX_URL:
    raise RuntimeError("Set CONVEX_URL to your Convex deployment URL.")


ANSWER_CHAIN = {
    1: "0100001101100101011011100111010001110010011000010110110000100000010100000111001001101111011000110110010101110011011100110110100101101110011001110010000001010101011011100110100101110100",
    2: "ECLIPSE",
    3: "ENTRYPOINT",
    4: "NETWORK",
    5: "INSTRUCTION_HIERARCHY",
    6: "MINDLOCK",
    7: "OVERMIND",
    8: "SIGNAL_FOUND",
}

_boot_lock = threading.Lock()
_winner_lock = threading.Lock()
_winner_claimed = False


def _convex_post(endpoint: str, path: str, args: dict[str, Any]) -> Any:
    url = f"{CONVEX_URL}{endpoint}"
    payload = json.dumps({"path": path, "args": args, "format": "json"}).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=payload,
        headers={"Content-Type": "application/json", "Accept": "application/json"},
        method="POST",
    )

    start = time.perf_counter()
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            raw = resp.read()
        elapsed = (time.perf_counter() - start) * 1000
        data = json.loads(raw.decode("utf-8"))
        events.request.fire(
            request_type="POST",
            name=f"convex {path}",
            response_time=elapsed,
            response_length=len(raw),
            exception=None,
        )
        if data.get("status") != "success":
            raise RuntimeError(data.get("errorMessage", f"Convex error at {path}"))
        return data.get("value")
    except Exception as exc:
        elapsed = (time.perf_counter() - start) * 1000
        events.request.fire(
            request_type="POST",
            name=f"convex {path}",
            response_time=elapsed,
            response_length=0,
            exception=exc,
        )
        raise


def convex_query(path: str, args: dict[str, Any]) -> Any:
    return _convex_post("/api/query", path, args)


def convex_mutation(path: str, args: dict[str, Any]) -> Any:
    return _convex_post("/api/mutation", path, args)


def human_delay(level: int | None = None) -> float:
    base = {
        1: (3.5, 7.5),
        2: (4.0, 8.0),
        3: (4.5, 9.0),
        4: (5.0, 10.0),
        5: (12.0, 28.0),
        6: (5.0, 10.0),
        7: (5.0, 11.0),
        8: (5.5, 12.0),
    }
    low, high = base.get(level or 0, (2.0, 5.0))
    return random.uniform(low, high)


def page_wobble(url_client, count: int = 1) -> None:
    for _ in range(count):
        url_client.get(
            "/",
            params={"v": random.randint(1000, 9999)},
            name="site / wobble",
        )
        gevent_sleep(random.uniform(0.15, 0.8))


def _maybe_boot_event() -> None:
    if not ADMIN_KEY:
        return
    with _boot_lock:
        event = convex_query("game:eventState", {})
        if not event.get("started", False):
            convex_mutation(
                "game:setEventStarted",
                {"adminKey": ADMIN_KEY, "started": True},
            )


@events.test_start.add_listener
def on_test_start(environment, **kwargs):
    try:
        _maybe_boot_event()
    except Exception as exc:
        print(f"[locust] startup admin setup skipped: {exc}")


@dataclass
class JourneyState:
    participant_id: str
    submission_id: str | None = None


class PromptParadoxJourney(SequentialTaskSet):
    state: JourneyState | None = None

    @task
    def run_full_journey(self):
        self.client.get("/", name="site /")
        page_wobble(self.client, random.randint(1, 3))
        gevent_sleep(human_delay(1))

        unique = f"user-{int(time.time() * 1000)}-{random.randint(1000, 9999)}"
        participant = convex_mutation(
            "game:register",
            {
                "name": f"Locust {unique}",
                "college": "Load Test",
                "email": f"{unique}@example.com",
            },
        )
        participant_id = participant["id"]
        self.state = JourneyState(participant_id=participant_id)

        page_wobble(self.client, random.randint(1, 2))
        gevent_sleep(human_delay(1))

        # Ensure the event is open before we submit the full chain.
        if ADMIN_KEY:
            convex_mutation(
                "game:setEventStarted",
                {"adminKey": ADMIN_KEY, "started": True},
            )

        for level in range(1, 5):
            page_wobble(self.client, 1 if random.random() < 0.4 else 0)
            gevent_sleep(human_delay(level))
            convex_mutation(
                "game:submitAnswer",
                {
                    "participantId": participant_id,
                    "level": level,
                    "answer": ANSWER_CHAIN[level],
                },
            )
            gevent_sleep(random.uniform(0.5, 2.0))

        submission = convex_mutation(
            "game:submitLevel5",
            {
                "participantId": participant_id,
                "prompt": LEVEL5_PUBLIC_URL,
            },
        )
        self.state.submission_id = submission["submissionId"]

        gevent_sleep(human_delay(5))

        if not ADMIN_KEY:
            raise RuntimeError(
                "ADMIN_KEY is required to approve level 5 and reach the final screen.",
            )

        if AUTO_APPROVE_LEVEL5:
            delay = random.uniform(LEVEL5_APPROVAL_DELAY_MIN, LEVEL5_APPROVAL_DELAY_MAX)
            gevent_sleep(delay)
            convex_mutation(
                "game:reviewLevel5",
                {
                    "adminKey": ADMIN_KEY,
                    "submissionId": submission["submissionId"],
                    "status": "approved",
                },
            )

        deadline = time.time() + 180
        while time.time() < deadline:
            participant_state = convex_query(
                "game:participant", {"participantId": participant_id}
            )
            if participant_state and participant_state.get("level5Status") == "approved":
                break
            gevent_sleep(random.uniform(1.5, 4.0))
        else:
            raise RuntimeError("Timed out waiting for level 5 approval.")

        for level in range(6, 9):
            page_wobble(self.client, 1 if random.random() < 0.35 else 0)
            gevent_sleep(human_delay(level))
            convex_mutation(
                "game:submitAnswer",
                {
                    "participantId": participant_id,
                    "level": level,
                    "answer": ANSWER_CHAIN[level],
                },
            )
            gevent_sleep(random.uniform(0.5, 2.5))

        # One winner globally. First finisher claims the final reveal.
        global _winner_claimed
        with _winner_lock:
            should_claim = not _winner_claimed
            if should_claim:
                _winner_claimed = True

        if should_claim:
            gevent_sleep(random.uniform(0.75, 3.0))
            convex_mutation(
                "game:setWinnerParticipant",
                {"adminKey": ADMIN_KEY, "participantId": participant_id},
            )

        event = convex_query("game:eventState", {})
        participant_state = convex_query(
            "game:participant", {"participantId": participant_id}
        )

        if participant_state and event.get("winnerParticipantId") == participant_id:
            self.client.get("/", name="site / final")

        gevent_sleep(random.uniform(0.5, 2.0))
        raise StopUser()


class PromptParadoxUser(HttpUser):
    tasks = [PromptParadoxJourney]
    wait_time = between(0.2, 1.0)
    host = APP_URL
