# -*- mode: python ; coding: utf-8 -*-
# PyInstaller spec for Assunção & Paladini POS desktop launcher.
#
# Build with:  pyinstaller desktop/server.spec --noconfirm
# Runs on Windows; produces dist/AssuncaoPaladini/AssuncaoPaladini.exe
from PyInstaller.utils.hooks import collect_all, copy_metadata

datas = []
binaries = []
hiddenimports = [
    "uvicorn.logging",
    "uvicorn.loops.auto",
    "uvicorn.loops.asyncio",
    "uvicorn.protocols.http.auto",
    "uvicorn.protocols.http.h11_impl",
    "uvicorn.protocols.websockets.auto",
    "uvicorn.lifespan.on",
    "pymongo",
    "bcrypt",
    "pydantic",
    "pydantic.deprecated.decorator",
    "email_validator",
]

for pkg in ("motor", "pymongo", "pydantic", "pydantic_core", "fastapi", "starlette", "uvicorn", "webview"):
    d, b, h = collect_all(pkg)
    datas += d
    binaries += b
    hiddenimports += h

datas += copy_metadata("fastapi") + copy_metadata("motor") + copy_metadata("pymongo")

# Include backend sources so `from backend.server import app` works
datas += [("../backend/server.py", "backend")]

block_cipher = None

a = Analysis(
    ["launcher.py"],
    pathex=[],
    binaries=binaries,
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=["tkinter"],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)
pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name="AssuncaoPaladini",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=False,
    console=False,
    icon="../installer/app.ico" if __import__("os").path.exists("../installer/app.ico") else None,
)

coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=False,
    upx_exclude=[],
    name="AssuncaoPaladini",
)
