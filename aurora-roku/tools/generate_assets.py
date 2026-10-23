#!/usr/bin/env python3
"""
Gera TODA a arte do Aurora TV de forma procedural e determinística.

Nenhuma imagem é baixada da internet: pôsteres, fundos, botões 9-patch,
ícone e splash são composições originais (gradientes, formas e
silhuetas) criadas aqui. O texto do ícone e do splash usa a fonte Inter
(licença SIL OFL) apenas para rasterização; a fonte não é incluída no app.

Tamanhos: o Roku Express 3960X tem UI máxima de 720p (ver SOURCES.md), e
o app usa ui_resolutions=fhd (layout em 1920x1080, escalado pelo sistema).
Por isso as imagens de conteúdo são geradas no tamanho que ocupam na
saída HD (2/3 do tamanho de design), economizando memória de textura.

Uso: python3 tools/generate_assets.py   (requer Pillow e NumPy)
"""
import math
import os
import random

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
IMG = os.path.join(ROOT, "images")
FONT_BOLD = "/usr/share/fonts/opentype/inter/Inter-Bold.otf"
FONT_REG = "/usr/share/fonts/opentype/inter/Inter-Regular.otf"

# Mesmas cores de source/shared/Theme.brs (os testes verificam a coerência).
THEMES = {
    "noturna": {"bg": "#080B14", "surface": "#151B2A", "raised": "#1E2638", "accent": "#79A9FF"},
    "boreal": {"bg": "#06110F", "surface": "#12201E", "raised": "#1A2C29", "accent": "#5FD9C0"},
}
SCRIM = "#080B14"

CARD = (288, 162)        # 432x243 no design FHD
BACKDROP = (1280, 720)   # tela inteira na saída HD
CARD_RADIUS = 12         # 18 no design FHD
SS = 3                   # supersampling para bordas suaves

# id -> (motivo, céu topo, céu base, cor de destaque, semente)
ART = {
    "m01": ("city", "#0B2730", "#3E8C93", "#BDF3F0", 11),
    "m02": ("rails", "#2A1A2E", "#E08A4B", "#FFD79A", 12),
    "m03": ("sea", "#1A0B14", "#C8423B", "#FFB08A", 13),
    "m04": ("clock", "#170F08", "#5A3A17", "#E9B65C", 14),
    "m05": ("city", "#07081E", "#3B1F6B", "#FF6FD8", 15),
    "m06": ("garden", "#0D1C1A", "#6E9C8E", "#E6F4EC", 16),
    "m07": ("planet", "#030713", "#0E2A52", "#7FD3FF", 17),
    "m08": ("lighthouse", "#0E1626", "#4A5F86", "#FFD48A", 18),
    "s01": ("aurora", "#040A12", "#10243A", "#66F2B5", 19),
    "s02": ("sea", "#0B2230", "#5FA4B5", "#F4E3B5", 20),
    "s03": ("orbit", "#02040C", "#121C3E", "#FF9F5A", 21),
    "s04": ("house", "#120B22", "#6A4A8C", "#F7C6FF", 22),
    "s05": ("radio", "#2A0F14", "#E0715B", "#FFE1B8", 23),
    "s06": ("sail", "#0A2340", "#3F8FD6", "#F5FAFF", 24),
    "col_scifi": ("abstract", "#050A1E", "#23407A", "#79A9FF", 31),
    "col_drama": ("abstract", "#1C0D16", "#7A3550", "#FFB3A1", 32),
    "col_mystery": ("abstract", "#0A0E12", "#2F4A4F", "#B6F0E2", 33),
    "col_binge": ("abstract", "#160F05", "#7A5420", "#FFD28A", 34),
}


def hex_rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def vertical_gradient(w, h, top, bottom):
    t = np.linspace(0, 1, h)[:, None, None]
    arr = np.array(top)[None, None, :] * (1 - t) + np.array(bottom)[None, None, :] * t
    arr = np.repeat(arr, w, axis=1)
    return Image.fromarray(arr.astype(np.uint8), "RGB")


def glow(img, cx, cy, radius, color, strength=0.55):
    """Brilho radial suave (aditivo), em coordenadas relativas."""
    w, h = img.size
    yy, xx = np.mgrid[0:h, 0:w]
    d = np.sqrt((xx - cx * w) ** 2 + (yy - cy * h) ** 2) / (radius * max(w, h))
    a = np.clip(1 - d, 0, 1) ** 2 * strength
    base = np.asarray(img).astype(np.float32)
    col = np.array(color, dtype=np.float32)[None, None, :]
    out = base + (col - base) * a[:, :, None]
    return Image.fromarray(np.clip(out, 0, 255).astype(np.uint8), "RGB")


def sphere(img, cx, cy, r, dark, light):
    """Esfera com iluminação difusa vinda da direita/topo e borda atmosférica."""
    w, h = img.size
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    nx, ny = (xx - cx) / r, (yy - cy) / r
    d2 = nx ** 2 + ny ** 2
    inside = d2 <= 1
    nz = np.sqrt(np.clip(1 - d2, 0, 1))
    lx, ly, lz = 0.55, -0.45, 0.7
    lam = np.clip(nx * lx + ny * ly + nz * lz, 0, 1) ** 0.9
    bands = 0.06 * np.sin(ny * 18 + nx * 2)
    t = np.clip(lam + bands, 0, 1)[:, :, None]
    col = np.array(dark, np.float32) * (1 - t) + np.array(light, np.float32) * t
    rim = np.clip((d2 - 0.82) / 0.18, 0, 1)[:, :, None] * 0.35
    col = col * (1 - rim) + np.array(light, np.float32) * rim
    base = np.asarray(img).astype(np.float32)
    edge = np.clip((1 - d2) * r / 2.0, 0, 1)[:, :, None]  # antisserrilhado
    out = np.where(inside[:, :, None], base * (1 - edge) + col * edge, base)
    halo = np.clip(1 - (np.sqrt(d2) - 1) / 0.25, 0, 1) * (~inside) * 0.35
    out = out + (np.array(light, np.float32) - out) * halo[:, :, None]
    return Image.fromarray(np.clip(out, 0, 255).astype(np.uint8), "RGB")


def aurora_curtains(img, color_a, color_b, seed):
    """Cortinas de aurora: faixas verticais suaves ao longo de senoides."""
    w, h = img.size
    rng = np.random.default_rng(seed)
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    u, v = xx / w, yy / h
    out = np.asarray(img).astype(np.float32)
    for k in range(3):
        phase = rng.uniform(0, 6)
        center = 0.28 + 0.07 * k + 0.08 * np.sin(u * (5 + k) + phase) + 0.03 * np.sin(u * 17 + phase * 2)
        dist = v - center
        curtain = np.exp(-(np.clip(dist, None, 0) ** 2) / 0.0015) * np.exp(-(np.clip(dist, 0, None)) / 0.16)
        shimmer = 0.6 + 0.4 * np.sin(u * 140 + phase) ** 2
        fade = np.clip((u - 0.18) / 0.35, 0, 1)
        a = np.clip(curtain * shimmer * fade * (0.55 - 0.12 * k), 0, 1)[:, :, None]
        col = np.array(color_a if k != 1 else color_b, np.float32)
        out = out + (col - out) * a
    return Image.fromarray(np.clip(out, 0, 255).astype(np.uint8), "RGB")


def stars(draw, w, h, rnd, count, max_y=1.0, color=(255, 255, 255)):
    for _ in range(count):
        x, y = rnd.random() * w, rnd.random() * h * max_y
        r = rnd.choice([1, 1, 1, 2]) * w / 1280 * SS * 0.6
        a = rnd.randint(90, 230)
        draw.ellipse([x - r, y - r, x + r, y + r], fill=color + (a,))


def ridge(w, h, rnd, base_y, amp, freq):
    pts = [(0, h)]
    phase = rnd.random() * 10
    for i in range(0, 101):
        x = w * i / 100
        y = base_y * h + math.sin(i / 100 * freq * math.pi + phase) * amp * h \
            + math.sin(i / 100 * freq * 2.7 * math.pi + phase * 1.7) * amp * 0.45 * h
        pts.append((x, y))
    pts.append((w, h))
    return pts


def compose(motif, top, bottom, accent, seed, w, h):
    """Desenha a composição em w x h (já multiplicado por SS)."""
    rnd = random.Random(seed)
    top, bottom, acc = hex_rgb(top), hex_rgb(bottom), hex_rgb(accent)
    img = vertical_gradient(w, h, top, bottom)
    dark = lerp(top, (0, 0, 0), 0.55)
    if motif in ("planet", "aurora", "orbit", "abstract"):
        img = glow(img, 0.72, 0.35, 0.55, lerp(bottom, acc, 0.35), 0.45)
    else:
        img = glow(img, 0.7, 0.62, 0.5, lerp(bottom, acc, 0.5), 0.5)
    layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)

    if motif in ("planet", "aurora", "orbit", "lighthouse", "house", "abstract"):
        stars(d, w, h, rnd, 160, 0.7)

    if motif == "planet":
        # Estrelas ficam atrás do planeta: aplica a camada já desenhada.
        img = Image.alpha_composite(img.convert("RGBA"), layer).convert("RGB")
        layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        d = ImageDraw.Draw(layer)
        cx, cy, r = 0.75 * w, 0.48 * h, 0.27 * h
        ring = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        rd = ImageDraw.Draw(ring)
        # Anel com raio 1,8: na imagem de destaque não invade a área da sinopse.
        box = [cx - r * 1.8, cy - r * 0.38, cx + r * 1.8, cy + r * 0.38]
        rd.ellipse(box, outline=acc + (150,), width=int(0.009 * h))
        rd.ellipse([cx - r * 1.5, cy - r * 0.3, cx + r * 1.5, cy + r * 0.3], outline=acc + (80,), width=int(0.004 * h))
        img = Image.alpha_composite(img.convert("RGBA"), ring).convert("RGB")  # anel atrás
        img = sphere(img, cx, cy, r, lerp(top, (0, 0, 0), 0.2), lerp(acc, (255, 255, 255), 0.15))
        front = ring.crop((0, int(cy), w, h))  # metade de baixo do anel passa na frente
        img = img.convert("RGBA")
        img.alpha_composite(front, (0, int(cy)))
        img = img.convert("RGB")
    elif motif == "city":
        x = 0
        while x < w:
            bw = rnd.uniform(0.04, 0.09) * w
            bh = rnd.uniform(0.25, 0.62) * h
            d.rectangle([x, h - bh, x + bw, h], fill=dark + (255,))
            for wy in np.arange(h - bh + 0.03 * h, h, 0.045 * h):
                for wx in np.arange(x + 0.01 * w, x + bw - 0.01 * w, 0.018 * w):
                    if rnd.random() < 0.28:
                        d.rectangle([wx, wy, wx + 0.007 * w, wy + 0.012 * h], fill=acc + (rnd.randint(120, 230),))
            x += bw + rnd.uniform(0.002, 0.012) * w
    elif motif in ("sea", "sail", "lighthouse", "house"):
        horizon = 0.62 * h
        if motif == "sea":
            d.ellipse([0.62 * w, horizon - 0.2 * h, 0.82 * w, horizon + 0.2 * h], fill=acc + (235,))
        d.rectangle([0, horizon, w, h], fill=lerp(bottom, dark, 0.65) + (255,))
        for i in range(40):
            y = horizon + (i / 40) ** 1.6 * (h - horizon)
            x0 = rnd.uniform(0.5, 0.75) * w
            ln = rnd.uniform(0.03, 0.14) * w
            d.line([x0, y, x0 + ln, y], fill=acc + (rnd.randint(40, 140),), width=max(1, int(0.004 * h)))
        if motif == "sail":
            for sx, s in ((0.62, 1.0), (0.78, 0.7)):
                b = horizon + 0.02 * h
                d.polygon([(sx * w, b - 0.42 * h * s), (sx * w, b), ((sx + 0.12 * s) * w, b)], fill=acc + (245,))
                d.polygon([(sx * w - 0.004 * w, b - 0.36 * h * s), (sx * w - 0.004 * w, b), ((sx - 0.07 * s) * w, b)], fill=acc + (200,))
                d.polygon([((sx - 0.08 * s) * w, b), ((sx + 0.14 * s) * w, b), ((sx + 0.11 * s) * w, b + 0.04 * h), ((sx - 0.05 * s) * w, b + 0.04 * h)], fill=dark + (255,))
        if motif == "lighthouse":
            bx = 0.7 * w
            d.polygon([(bx, horizon - 0.18 * h), (bx + 0.6 * w, horizon - 0.42 * h), (bx + 0.6 * w, horizon - 0.02 * h)], fill=acc + (60,))
            d.polygon([(bx - 0.025 * w, horizon), (bx + 0.025 * w, horizon), (bx + 0.012 * w, horizon - 0.32 * h), (bx - 0.012 * w, horizon - 0.32 * h)], fill=dark + (255,))
            d.rectangle([bx - 0.016 * w, horizon - 0.38 * h, bx + 0.016 * w, horizon - 0.32 * h], fill=acc + (255,))
            d.polygon([(bx - 0.08 * w, h), (bx - 0.05 * w, horizon), (bx + 0.07 * w, horizon), (bx + 0.11 * w, h)], fill=dark + (255,))
        if motif == "house":
            hx, hw, hh = 0.6 * w, 0.18 * w, 0.2 * h
            d.rectangle([hx, horizon - hh, hx + hw, horizon], fill=dark + (255,))
            d.polygon([(hx - 0.01 * w, horizon - hh), (hx + hw / 2, horizon - hh - 0.12 * h), (hx + hw + 0.01 * w, horizon - hh)], fill=dark + (255,))
            for wx in (hx + 0.03 * w, hx + 0.11 * w):
                d.rectangle([wx, horizon - hh + 0.06 * h, wx + 0.035 * w, horizon - hh + 0.12 * h], fill=acc + (255,))
                d.rectangle([wx, horizon + 0.04 * h, wx + 0.035 * w, horizon + 0.1 * h], fill=acc + (90,))
    elif motif == "rails":
        horizon = 0.58 * h
        d.ellipse([0.6 * w, horizon - 0.12 * h, 0.76 * w, horizon + 0.12 * h], fill=acc + (230,))
        d.rectangle([0, horizon, w, h], fill=dark + (255,))
        vx = 0.68 * w
        for off in (-0.05, 0.05):
            d.line([(vx, horizon), (vx + off * 9 * w, h)], fill=acc + (200,), width=int(0.006 * h))
        for i in range(1, 14):
            t = (i / 14) ** 1.8
            y = horizon + t * (h - horizon)
            half = 0.05 * 9 * w * t
            d.line([(vx - half, y), (vx + half, y)], fill=acc + (80,), width=max(1, int(0.004 * h * (0.3 + t))))
    elif motif == "clock":
        cx, cy = 0.7 * w, 0.5 * h
        for i, r in enumerate((0.42, 0.33, 0.25, 0.14)):
            rr = r * h
            d.ellipse([cx - rr, cy - rr, cx + rr, cy + rr], outline=acc + (240 - i * 35,), width=int(0.011 * h))
        for k in range(12):
            a = k / 12 * math.tau
            r1, r2 = 0.36 * h, 0.4 * h
            d.line([(cx + math.cos(a) * r1, cy + math.sin(a) * r1), (cx + math.cos(a) * r2, cy + math.sin(a) * r2)], fill=acc + (250,), width=int(0.012 * h))
        d.ellipse([cx - 0.02 * h, cy - 0.02 * h, cx + 0.02 * h, cy + 0.02 * h], fill=acc + (255,))
        d.line([(cx, cy), (cx + 0.2 * h, cy - 0.12 * h)], fill=acc + (255,), width=int(0.016 * h))
        d.line([(cx, cy), (cx - 0.05 * h, cy - 0.28 * h)], fill=acc + (255,), width=int(0.008 * h))
    elif motif == "garden":
        horizon = 0.78 * h
        for i, ax in enumerate((0.5, 0.64, 0.78, 0.92)):
            aw, ah = 0.12 * w, 0.42 * h
            d.arc([ax * w - aw / 2, horizon - ah, ax * w + aw / 2, horizon + ah * 0.6], 180, 360, fill=acc + (235,), width=int(0.011 * h))
            d.line([(ax * w - aw / 2, horizon - ah * 0.2), (ax * w - aw / 2, horizon)], fill=acc + (235,), width=int(0.011 * h))
            d.line([(ax * w + aw / 2, horizon - ah * 0.2), (ax * w + aw / 2, horizon)], fill=acc + (235,), width=int(0.011 * h))
        d.rectangle([0, horizon, w, h], fill=dark + (255,))
        for _ in range(120):
            x, y = rnd.random() * w, rnd.random() * h * 0.8
            r = rnd.uniform(1, 3) * w / 1280 * SS * 0.6
            d.ellipse([x - r, y - r, x + r, y + r], fill=(255, 255, 255, rnd.randint(60, 160)))
    elif motif == "aurora":
        img = aurora_curtains(img, acc, (150, 120, 255), seed)
        d.polygon(ridge(w, h, rnd, 0.84, 0.025, 3), fill=lerp(dark, (200, 215, 230), 0.12) + (255,))
    elif motif == "orbit":
        d.ellipse([-0.5 * w, 0.7 * h, 1.5 * w, 2.4 * h], fill=lerp(bottom, acc, 0.25) + (255,))
        d.ellipse([-0.5 * w, 0.7 * h, 1.5 * w, 2.4 * h], outline=acc + (230,), width=int(0.01 * h))
        sx, sy = 0.68 * w, 0.38 * h
        d.rectangle([sx - 0.13 * w, sy - 0.01 * h, sx + 0.13 * w, sy + 0.01 * h], fill=(210, 220, 235, 255))
        for px in (-0.13, 0.09):
            d.rectangle([sx + px * w, sy - 0.07 * h, sx + (px + 0.04) * w, sy + 0.07 * h], fill=lerp(acc, (40, 60, 120), 0.6) + (255,))
        d.ellipse([sx - 0.03 * w, sy - 0.05 * h, sx + 0.03 * w, sy + 0.05 * h], fill=(235, 240, 250, 255))
    elif motif == "radio":
        bx, by = 0.68 * w, 0.82 * h
        for i in range(1, 6):
            r = i * 0.09 * h
            d.arc([bx - r, by - 0.5 * h - r, bx + r, by - 0.5 * h + r], 200, 340, fill=acc + (230 - i * 35,), width=int(0.008 * h))
        d.polygon([(bx - 0.06 * w, by), (bx + 0.06 * w, by), (bx, by - 0.5 * h)], outline=dark + (255,), fill=None, width=int(0.008 * h))
        d.rectangle([0, by, w, h], fill=dark + (255,))
    elif motif == "abstract":
        for i in range(5):
            cx, cy = rnd.uniform(0.4, 0.95) * w, rnd.uniform(0.1, 0.9) * h
            r = rnd.uniform(0.18, 0.45) * h
            d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=lerp(acc, bottom, rnd.random() * 0.6) + (rnd.randint(40, 90),))

    img = Image.alpha_composite(img.convert("RGBA"), layer.filter(ImageFilter.GaussianBlur(0.6 * SS)))
    return img.convert("RGB")


def add_grain(img, amount=6, seed=0):
    rng = np.random.default_rng(seed)
    arr = np.asarray(img).astype(np.int16)
    noise = rng.integers(-amount, amount + 1, size=arr.shape[:2])[:, :, None]
    return Image.fromarray(np.clip(arr + noise, 0, 255).astype(np.uint8), "RGB")


def bake_scrim(img, color=SCRIM):
    """Escurece esquerda e base para garantir contraste do texto (sem
    camada extra em tempo de execução: uma textura a menos no aparelho)."""
    w, h = img.size
    c = np.array(hex_rgb(color), dtype=np.float32)
    x = np.linspace(0, 1, w)[None, :]
    y = np.linspace(0, 1, h)[:, None]
    left = np.clip(1 - x / 0.62, 0, 1) ** 1.4 * 0.94
    bottom = np.clip((y - 0.45) / 0.55, 0, 1) ** 1.6 * 0.92
    a = np.maximum(left, bottom)[:, :, None]
    arr = np.asarray(img).astype(np.float32)
    out = arr * (1 - a) + c[None, None, :] * a
    return Image.fromarray(out.astype(np.uint8), "RGB")


def rounded(img, radius):
    w, h = img.size
    mask = Image.new("L", (w * SS, h * SS), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, w * SS - 1, h * SS - 1], radius * SS, fill=255)
    mask = mask.resize((w, h), Image.LANCZOS)
    out = img.convert("RGBA")
    out.putalpha(mask)
    return out


def render(spec, size):
    motif, top, bottom, accent, seed = spec
    w, h = size
    big = compose(motif, top, bottom, accent, seed, w * SS, h * SS)
    return add_grain(big.resize((w, h), Image.LANCZOS), 5, seed)


def nine_patch(path, interior, draw_fn, stretch):
    """Cria um .9.png: borda de 1px com marcações pretas na esquerda/topo
    (áreas esticáveis) e na direita/base (área de conteúdo)."""
    w, h = interior
    big = Image.new("RGBA", (w * SS, h * SS), (0, 0, 0, 0))
    draw_fn(ImageDraw.Draw(big), w * SS, h * SS)
    small = big.resize((w, h), Image.LANCZOS)
    out = Image.new("RGBA", (w + 2, h + 2), (0, 0, 0, 0))
    out.paste(small, (1, 1))
    px = out.load()
    (sx0, sx1), (sy0, sy1) = stretch
    for x in range(sx0, sx1):
        px[x + 1, 0] = (0, 0, 0, 255)
        px[x + 1, h + 1] = (0, 0, 0, 255)
    for y in range(sy0, sy1):
        px[0, y + 1] = (0, 0, 0, 255)
        px[w + 1, y + 1] = (0, 0, 0, 255)
    out.save(path, optimize=True)


def ui_assets():
    for tid, t in THEMES.items():
        folder = os.path.join(IMG, "ui", tid)
        os.makedirs(folder, exist_ok=True)
        acc, surf, raised = hex_rgb(t["accent"]), hex_rgb(t["surface"]), hex_rgb(t["raised"])
        # Pílula de 48px de altura na saída HD (72 no design FHD).
        nine_patch(os.path.join(folder, "pill_accent.9.png"), (64, 48),
                   lambda d, w, h: d.rounded_rectangle([0, 0, w - 1, h - 1], h // 2, fill=acc + (255,)),
                   ((24, 40), (23, 25)))
        nine_patch(os.path.join(folder, "pill_surface.9.png"), (64, 48),
                   lambda d, w, h: d.rounded_rectangle([0, 0, w - 1, h - 1], h // 2, fill=raised + (235,)),
                   ((24, 40), (23, 25)))
        # Pílula menor (40px na saída HD, 60 no design) para as abas.
        nine_patch(os.path.join(folder, "pill_accent_sm.9.png"), (56, 40),
                   lambda d, w, h: d.rounded_rectangle([0, 0, w - 1, h - 1], h // 2, fill=acc + (255,)),
                   ((20, 36), (19, 21)))
        nine_patch(os.path.join(folder, "pill_surface_sm.9.png"), (56, 40),
                   lambda d, w, h: d.rounded_rectangle([0, 0, w - 1, h - 1], h // 2, fill=raised + (235,)),
                   ((20, 36), (19, 21)))
        # Anel de foco dos cartões: contorno de 3px, raio 16 (saída HD).
        nine_patch(os.path.join(folder, "card_focus.9.png"), (48, 48),
                   lambda d, w, h: d.rounded_rectangle([SS, SS, w - 1 - SS, h - 1 - SS], 15 * SS, outline=acc + (255,), width=3 * SS),
                   ((20, 28), (20, 28)))
        nine_patch(os.path.join(folder, "panel.9.png"), (48, 48),
                   lambda d, w, h: d.rounded_rectangle([0, 0, w - 1, h - 1], 12 * SS, fill=surf + (232,)),
                   ((16, 32), (16, 32)))
        # Fundo das telas internas: gradiente discreto com um brilho.
        bg = vertical_gradient(BACKDROP[0], BACKDROP[1], hex_rgb(t["bg"]), lerp(hex_rgb(t["bg"]), surf, 0.8))
        bg = glow(bg, 0.82, 0.0, 0.7, lerp(surf, acc, 0.22), 0.5)
        add_grain(bg, 3, 7).save(os.path.join(IMG, "backgrounds", "bg_%s.jpg" % tid), quality=88, optimize=True)


def brand_assets():
    folder = os.path.join(IMG, "brand")
    os.makedirs(folder, exist_ok=True)
    t = THEMES["noturna"]
    acc = hex_rgb(t["accent"])

    def mark(size):
        s = size * SS
        im = Image.new("RGBA", (s, s), (0, 0, 0, 0))
        d = ImageDraw.Draw(im)
        for i, col in enumerate((acc, lerp(acc, (150, 120, 255), 0.6), lerp(acc, (110, 240, 210), 0.6))):
            inset = i * 0.12 * s
            d.arc([inset, inset + 0.18 * s, s - inset, s * 1.18 - inset], 200, 340, fill=col + (255,), width=int(0.09 * s))
        return im.resize((size, size), Image.LANCZOS)

    mark(48).save(os.path.join(folder, "brand_mark.png"), optimize=True)

    def poster(w, h, with_tagline):
        s = 2
        img = vertical_gradient(w * s, h * s, hex_rgb("#0B1122"), hex_rgb(t["bg"]))
        img = glow(img, 0.5, 0.15, 0.7, lerp(hex_rgb(t["surface"]), acc, 0.35), 0.6).convert("RGBA")
        d = ImageDraw.Draw(img)
        name = "Aurora TV"
        f = ImageFont.truetype(FONT_BOLD, int(h * s * (0.13 if with_tagline else 0.16)))
        tw = d.textlength(name, font=f)
        m = mark(int(h * s * 0.2))
        total = m.width + h * s * 0.03 + tw
        x0 = (w * s - total) / 2
        cy = h * s * (0.47 if with_tagline else 0.5)
        img.alpha_composite(m, (int(x0), int(cy - m.height * 0.62)))
        d.text((x0 + m.width + h * s * 0.03, cy), name, font=f, fill=hex_rgb("#F5F7FC"), anchor="lm")
        if with_tagline:
            f2 = ImageFont.truetype(FONT_REG, int(h * s * 0.035))
            d.text((w * s / 2, cy + h * s * 0.12), "Sua central de entretenimento", font=f2, fill=hex_rgb("#A6AEC0"), anchor="mm")
        return add_grain(img.convert("RGB").resize((w, h), Image.LANCZOS), 3, 5)

    poster(540, 405, False).save(os.path.join(folder, "icon_focus_fhd.png"), optimize=True)
    poster(290, 218, False).save(os.path.join(folder, "icon_focus_hd.png"), optimize=True)
    poster(1920, 1080, True).save(os.path.join(folder, "splash_fhd.jpg"), quality=88, optimize=True)
    poster(1280, 720, True).save(os.path.join(folder, "splash_hd.jpg"), quality=88, optimize=True)


def content_assets():
    os.makedirs(os.path.join(IMG, "posters"), exist_ok=True)
    os.makedirs(os.path.join(IMG, "backgrounds"), exist_ok=True)
    for cid, spec in ART.items():
        rounded(render(spec, CARD), CARD_RADIUS).save(os.path.join(IMG, "posters", cid + ".png"), optimize=True)
        if not cid.startswith("col_"):
            bake_scrim(render(spec, BACKDROP)).save(os.path.join(IMG, "backgrounds", cid + ".jpg"), quality=84, optimize=True)


if __name__ == "__main__":
    content_assets()
    ui_assets()
    brand_assets()
    total = 0
    for dirpath, _, files in os.walk(IMG):
        for f in files:
            total += os.path.getsize(os.path.join(dirpath, f))
    print("Arte gerada em images/ (%.1f KB no total)" % (total / 1024))
