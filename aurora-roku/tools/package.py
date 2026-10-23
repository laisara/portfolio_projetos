#!/usr/bin/env python3
"""
Gera out/aurora-tv.zip com SOMENTE os arquivos do app Roku:
manifest, source/, components/ e images/ (o manifest fica na raiz do zip,
como nos samples oficiais da Roku). Documentação, testes e ferramentas
ficam de fora.

Este pacote serve para o simulador local e para um futuro sideload
AUTORIZADO. Este script não envia nada a nenhum aparelho.
"""
import os
import zipfile

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
OUT = os.path.join(ROOT, "out", "aurora-tv.zip")
INCLUDE = ["manifest", "source", "components", "images"]


def files():
    for entry in INCLUDE:
        path = os.path.join(ROOT, entry)
        if os.path.isfile(path):
            yield entry
            continue
        for dirpath, _, names in os.walk(path):
            for name in sorted(names):
                yield os.path.relpath(os.path.join(dirpath, name), ROOT)


def main():
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED) as z:
        for rel in sorted(files()):
            info = zipfile.ZipInfo(rel.replace(os.sep, "/"), date_time=(2026, 1, 1, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            with open(os.path.join(ROOT, rel), "rb") as fh:
                z.writestr(info, fh.read())
    print("Pacote: %s (%.0f KB)" % (os.path.relpath(OUT, ROOT), os.path.getsize(OUT) / 1024))


if __name__ == "__main__":
    main()
