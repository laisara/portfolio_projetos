"""Verificação ESTÁTICA dos .bat. Isto NÃO substitui rodar no Windows (não foi possível aqui)."""
import re
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
BATS = ["install.bat", "start.bat", "stop.bat", "criar-atalho.bat", "backup.bat", "restore.bat"]


@pytest.mark.parametrize("name", BATS)
def test_bat_basics(name):
    raw = (ROOT / name).read_bytes()
    assert raw.isascii(), "caracteres não-ASCII quebram o cmd.exe em codepages diferentes"
    assert b"\r\n" in raw and b"\n" not in raw.replace(b"\r\n", b""), "fim de linha deve ser CRLF"
    text = raw.decode()
    assert text.lower().startswith("@echo off")
    assert 'cd /d "%~dp0"' in text, "deve funcionar com duplo clique e caminhos com espaço"
    assert not re.search(r"^\s*exit\s*$", text, re.M | re.I)


@pytest.mark.parametrize("name", BATS)
def test_bat_parentheses_blocks_are_safe(name):
    """Dentro de ( ... ) um ')' em echo/texto fecha o bloco antes da hora."""
    depth, problems = 0, []
    for n, line in enumerate((ROOT / name).read_text().splitlines(), 1):
        st = line.strip()
        if st.lower().startswith("rem "):
            continue
        if depth and st != ")" and re.match(r"(?i)echo\b", st) and ")" in st:
            problems.append((n, line))
        if st.endswith("(") and not st.startswith("echo"):
            depth += 1
        elif st == ")":
            depth -= 1
    assert depth == 0 and not problems, problems


def test_bat_reference_existing_files_and_venv_layout():
    for name in BATS:
        for m in re.findall(r"scripts\\([\w.]+\.py)", (ROOT / name).read_text()):
            assert (ROOT / "scripts" / m).exists(), (name, m)
    assert r".venv\Scripts\python.exe" in (ROOT / "start.bat").read_text()
    assert "pip install -r requirements.txt" in (ROOT / "install.bat").read_text()
    assert (ROOT / "requirements.txt").exists()


def test_server_is_local_by_default_and_lan_requires_flag_with_warning():
    run = (ROOT / "scripts" / "run.py").read_text()
    assert '"127.0.0.1"' in run and 'if args.lan else "127.0.0.1"' in run
    assert "QUALQUER dispositivo" in run
