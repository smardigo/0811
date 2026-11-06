"""Desktop launcher for Assunção & Paladini POS.

Boots an embedded MongoDB, starts FastAPI in-process via uvicorn, and opens a
Chromium window via pywebview — all with no external dependencies on the host.
"""
from __future__ import annotations

import atexit
import os
import secrets
import socket
import subprocess
import sys
import threading
import time
import urllib.request
from pathlib import Path

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
if getattr(sys, "frozen", False):
    ROOT = Path(sys.executable).parent
else:
    ROOT = Path(__file__).resolve().parent.parent

APPDATA = Path(os.environ.get("APPDATA", str(ROOT))) / "AssuncaoPaladini"
APPDATA.mkdir(parents=True, exist_ok=True)
DATA_DIR = APPDATA / "mongo-data"
DATA_DIR.mkdir(exist_ok=True)
LOGS_DIR = APPDATA / "logs"
LOGS_DIR.mkdir(exist_ok=True)
SECRET_FILE = APPDATA / "secret.key"

MONGOD = ROOT / "mongodb" / "bin" / "mongod.exe"
FRONTEND = ROOT / "frontend"

MONGO_PORT = 27070
BACKEND_PORT = 8991

_procs: list[subprocess.Popen] = []


def _free_secret() -> str:
    if SECRET_FILE.exists():
        return SECRET_FILE.read_text(encoding="utf-8").strip()
    s = secrets.token_hex(32)
    SECRET_FILE.write_text(s, encoding="utf-8")
    return s


def _wait_port(host: str, port: int, timeout: float = 15.0) -> bool:
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            with socket.create_connection((host, port), timeout=0.5):
                return True
        except OSError:
            time.sleep(0.2)
    return False


def start_mongo() -> None:
    if not MONGOD.exists():
        raise RuntimeError(f"mongod.exe não encontrado em {MONGOD}")
    flags = 0x08000000 if sys.platform == "win32" else 0  # CREATE_NO_WINDOW
    p = subprocess.Popen(
        [
            str(MONGOD),
            "--dbpath", str(DATA_DIR),
            "--port", str(MONGO_PORT),
            "--bind_ip", "127.0.0.1",
            "--quiet",
            "--logpath", str(LOGS_DIR / "mongod.log"),
        ],
        cwd=str(ROOT),
        creationflags=flags,
    )
    _procs.append(p)
    if not _wait_port("127.0.0.1", MONGO_PORT, timeout=30):
        raise RuntimeError("Falha ao iniciar o MongoDB embarcado")


def start_backend() -> None:
    os.environ["MONGO_URL"] = f"mongodb://127.0.0.1:{MONGO_PORT}"
    os.environ["DB_NAME"] = "padaria"
    os.environ["JWT_SECRET"] = _free_secret()
    os.environ.setdefault("APP_TZ", "America/Sao_Paulo")
    os.environ["CORS_ORIGINS"] = f"http://127.0.0.1:{BACKEND_PORT}"
    os.environ["SERVE_FRONTEND"] = "1"
    os.environ["FRONTEND_DIR"] = str(FRONTEND)

    # Import after env is set, because server.py reads env at import time
    sys.path.insert(0, str(ROOT))
    from backend.server import app  # type: ignore

    import uvicorn

    config = uvicorn.Config(app, host="127.0.0.1", port=BACKEND_PORT, log_level="warning")
    server = uvicorn.Server(config)
    threading.Thread(target=server.run, daemon=True).start()

    deadline = time.time() + 30
    while time.time() < deadline:
        try:
            urllib.request.urlopen(f"http://127.0.0.1:{BACKEND_PORT}/api/", timeout=0.5)
            return
        except Exception:
            time.sleep(0.3)
    raise RuntimeError("Backend não respondeu a tempo")


def cleanup() -> None:
    for p in _procs:
        try:
            p.terminate()
            p.wait(timeout=5)
        except Exception:
            try:
                p.kill()
            except Exception:
                pass


def main() -> None:
    atexit.register(cleanup)
    start_mongo()
    start_backend()
    import webview

    window = webview.create_window(
        "Assunção & Paladini — PDV",
        f"http://127.0.0.1:{BACKEND_PORT}/",
        width=1280, height=820, min_size=(900, 600),
    )
    webview.start(gui="edgechromium" if sys.platform == "win32" else None)


if __name__ == "__main__":
    main()
