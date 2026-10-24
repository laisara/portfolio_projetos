#!/usr/bin/env python3
"""
Gera dist/aurora-roku-source-<versão>.zip com o código-fonte, os recursos
necessários e a documentação, para revisão técnica.

Diferença para tools/package.py:
  - package.py   -> out/aurora-tv.zip: SÓ o app (manifest, source, components,
                    images). É o pacote que seria enviado ao aparelho.
  - package_source.py -> dist/...-source.zip: o app + documentação + testes +
                    ferramentas + capturas. NÃO é para instalar.

Não inclui node_modules, saídas de teste, nem arquivos fora do projeto.
Este script não envia nada a nenhum aparelho.
"""
import os
import re
import zipfile

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
EXCLUDE_DIRS = {"node_modules", "out", "dist", "downloads", "output", "public", "__pycache__", ".git"}
EXCLUDE_FILES = {".DS_Store"}


def version():
    text = open(os.path.join(ROOT, "manifest"), encoding="utf-8").read()
    parts = [re.search(r"^%s=(\d+)" % k, text, re.M).group(1) for k in ("major_version", "minor_version", "build_version")]
    return "%s.%s.%s" % (parts[0], parts[1], parts[2].lstrip("0") or "0")


def files():
    for dirpath, dirnames, names in os.walk(ROOT):
        dirnames[:] = sorted(d for d in dirnames if d not in EXCLUDE_DIRS)
        for name in sorted(names):
            if name not in EXCLUDE_FILES:
                yield os.path.join(dirpath, name)


def main():
    v = version()
    out = os.path.join(ROOT, "dist", "aurora-roku-source-%s.zip" % v)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    count = 0
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
        for path in files():
            rel = os.path.relpath(path, ROOT).replace(os.sep, "/")
            info = zipfile.ZipInfo("aurora-roku/" + rel, date_time=(2026, 1, 1, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            with open(path, "rb") as fh:
                z.writestr(info, fh.read())
            count += 1
    print("Pacote de código-fonte: %s (%d arquivos, %.1f MB)" % (os.path.relpath(out, ROOT), count, os.path.getsize(out) / 1048576))


if __name__ == "__main__":
    main()
