"""Tiny additive-light renderer for the pitch's original generative art.

Everything is drawn procedurally (no stock photos, no logos): light is
accumulated in a linear float buffer, bloomed with multi-scale gaussian glow,
filmic tone-mapped, then finished with vignette + grain.
"""
import math
import hashlib
import numpy as np
from PIL import Image, ImageDraw, ImageFont

# Palette — electric-green Lightning, Nostr violet/magenta, site accent blue.
GREEN = (0.20, 1.00, 0.52)
LIME = (0.62, 1.00, 0.35)
VIOLET = (0.58, 0.30, 1.00)
MAGENTA = (0.92, 0.25, 0.90)
BLUE = (0.16, 0.59, 1.00)
CYAN = (0.25, 0.90, 1.00)
WHITE = (1.0, 1.0, 1.0)
AMBER = (1.0, 0.62, 0.22)


def mix(a, b, t):
    return tuple(a[i] * (1 - t) + b[i] * t for i in range(3))


def _fftblur(a, s):
    pad = int(3 * s) + 2
    p = np.pad(a, pad, mode="constant")
    H, W = p.shape
    fy = np.fft.fftfreq(H)[:, None]
    fx = np.fft.rfftfreq(W)[None, :]
    g = np.exp(-2 * (np.pi * s) ** 2 * (fx ** 2 + fy ** 2))
    r = np.fft.irfft2(np.fft.rfft2(p) * g, s=p.shape)
    return r[pad:pad + a.shape[0], pad:pad + a.shape[1]].astype(np.float32)


def _resize(a, w, h, flt=Image.BICUBIC):
    return np.asarray(Image.fromarray(a.astype(np.float32), "F").resize((w, h), flt), dtype=np.float32)


def blur(a, sigma):
    if sigma <= 0:
        return a
    h, w = a.shape
    f = max(1, int(sigma / 3))
    if f > 1:
        sw, sh = max(4, w // f), max(4, h // f)
        small = _resize(a, sw, sh, Image.BOX)
        b = _fftblur(small, sigma * sw / w)
        return _resize(b, w, h, Image.BICUBIC)
    return _fftblur(a, sigma)


def fbm(w, h, rng, octaves=5, base=3):
    out = np.zeros((h, w), np.float32)
    amp, tot = 1.0, 0.0
    for o in range(octaves):
        n = base * 2 ** o
        gh = max(2, int(n * h / w)) + 1
        g = rng.random((gh, n + 1)).astype(np.float32)
        out += _resize(g, w, h) * amp
        tot += amp
        amp *= 0.5
    out /= tot
    return (out - out.min()) / (out.max() - out.min() + 1e-6)


class Layer:
    """Antialiased monochrome drawing surface (supersampled)."""

    def __init__(self, w, h, ss=2):
        self.w, self.h, self.ss = w, h, ss
        self.im = Image.new("L", (w * ss, h * ss), 0)
        self.d = ImageDraw.Draw(self.im)

    def _p(self, pts):
        s = self.ss
        return [(x * s, y * s) for x, y in pts]

    def line(self, pts, width=1.0, v=255):
        self.d.line(self._p(pts), fill=int(v), width=max(1, int(round(width * self.ss))), joint="curve")

    def fade_line(self, pts, width=1.0, v0=255, v1=0, w1=None):
        if len(pts) < 24:  # subdivide so the fade is smooth
            dense = []
            for a, b in zip(pts[:-1], pts[1:]):
                k = max(2, 48 // max(1, len(pts) - 1))
                dense += [(a[0] + (b[0] - a[0]) * j / k, a[1] + (b[1] - a[1]) * j / k) for j in range(k)]
            dense.append(pts[-1])
            pts = dense
        n = len(pts) - 1
        w1 = width if w1 is None else w1
        for i in range(n):
            t = i / max(1, n - 1)
            self.line([pts[i], pts[i + 1]], width * (1 - t) + w1 * t, v0 * (1 - t) + v1 * t)

    def dot(self, x, y, r, v=255):
        s = self.ss
        self.d.ellipse([(x - r) * s, (y - r) * s, (x + r) * s, (y + r) * s], fill=int(v))

    def ring(self, x, y, r, width=1.0, v=255):
        s = self.ss
        self.d.ellipse([(x - r) * s, (y - r) * s, (x + r) * s, (y + r) * s], outline=int(v),
                       width=max(1, int(round(width * s))))

    def arc(self, x, y, r, a0, a1, width=1.0, v=255):
        s = self.ss
        self.d.arc([(x - r) * s, (y - r) * s, (x + r) * s, (y + r) * s], a0, a1, fill=int(v),
                   width=max(1, int(round(width * s))))

    def poly(self, pts, v=255, outline=None, width=1):
        self.d.polygon(self._p(pts), fill=None if v is None else int(v),
                       outline=None if outline is None else int(outline), width=max(1, int(width * self.ss)))

    def mask(self):
        im = self.im.resize((self.w, self.h), Image.LANCZOS) if self.ss > 1 else self.im
        return np.asarray(im, dtype=np.float32) / 255.0


DEFAULT_GLOW = ((0, 1.0), (2.5, 0.55), (9, 0.32), (28, 0.18), (80, 0.10))


class Canvas:
    def __init__(self, w, h, seed=0):
        self.w, self.h = w, h
        self.acc = np.zeros((h, w, 3), np.float32)
        self.rng = np.random.default_rng(seed)

    def layer(self, ss=2):
        return Layer(self.w, self.h, ss)

    def add(self, mask, color, intensity=1.0, glows=DEFAULT_GLOW, core_white=0.65):
        """Add a light mask. Core is whitened, glow keeps the hue."""
        color = np.array(color, np.float32)
        for s, wt in glows:
            m = mask if s == 0 else blur(mask, s)
            c = color * (1 - core_white) + core_white if s == 0 else color
            self.acc += (m * wt * intensity)[..., None] * c[None, None, :]

    def add_field(self, field, color, intensity=1.0):
        self.acc += (field * intensity)[..., None] * np.array(color, np.float32)[None, None, :]

    def gradient_x(self, c0, c1, x0=0.0, x1=1.0):
        t = np.clip((np.linspace(0, 1, self.w) - x0) / max(1e-6, x1 - x0), 0, 1)
        c0, c1 = np.array(c0, np.float32), np.array(c1, np.float32)
        return c0[None, :] * (1 - t)[:, None] + c1[None, :] * t[:, None]  # W x 3

    def add_grad(self, mask, c0, c1, intensity=1.0, glows=DEFAULT_GLOW, axis="x", t0=0.0, t1=1.0,
                 core_white=0.6):
        n = self.w if axis == "x" else self.h
        t = np.clip((np.linspace(0, 1, n) - t0) / max(1e-6, t1 - t0), 0, 1).astype(np.float32)
        c0, c1 = np.array(c0, np.float32), np.array(c1, np.float32)
        col = c0[None, :] * (1 - t)[:, None] + c1[None, :] * t[:, None]
        col = col[None, :, :] if axis == "x" else col[:, None, :]
        for s, wt in glows:
            m = mask if s == 0 else blur(mask, s)
            c = col * (1 - core_white) + core_white if s == 0 else col
            self.acc += (m * wt * intensity)[..., None] * c

    def fog(self, color, intensity=0.08, cx=0.5, cy=0.5, rx=0.6, ry=0.5, octaves=5, base=3, power=1.6):
        n = fbm(self.w, self.h, self.rng, octaves, base) ** power
        yy, xx = np.mgrid[0:self.h, 0:self.w].astype(np.float32)
        d = ((xx / self.w - cx) / rx) ** 2 + ((yy / self.h - cy) / ry) ** 2
        fall = np.exp(-d * 1.6)
        self.add_field(n * fall, color, intensity)

    def radial(self, color, intensity, cx, cy, r):
        yy, xx = np.mgrid[0:self.h, 0:self.w].astype(np.float32)
        d = ((xx - cx * self.w) ** 2 + (yy - cy * self.h) ** 2) / (r * max(self.w, self.h)) ** 2
        self.add_field(np.exp(-d), color, intensity)

    def dust(self, n, color, size=(0.5, 1.6), vmax=200, region=None, intensity=0.6, weight=None):
        L = self.layer()
        x0, y0, x1, y1 = region or (0, 0, 1, 1)
        for _ in range(n):
            x = self.rng.uniform(x0, x1) * self.w
            y = self.rng.uniform(y0, y1) * self.h
            v = vmax * self.rng.random() ** 2.2
            if weight is not None:
                v *= weight(x / self.w, y / self.h)
            L.dot(x, y, self.rng.uniform(*size), v)
        self.add(L.mask(), color, intensity, glows=((0, 1.0), (3, 0.6), (12, 0.25)))

    def reflect(self, horizon, strength=0.35, sigma=6, falloff=0.35):
        hy = int(horizon * self.h)
        above = self.acc[max(0, 2 * hy - self.h):hy][::-1]
        n = min(above.shape[0], self.h - hy)
        src = above[:n].copy()
        for c in range(3):
            src[..., c] = blur(src[..., c], sigma)
        ramp = np.exp(-np.linspace(0, 1, n) / falloff).astype(np.float32)[:, None, None]
        self.acc[hy:hy + n] += src * ramp * strength

    def finish(self, path, exposure=1.0, vignette=0.55, grain=0.016, gamma=1 / 2.0, size=None,
               quality=86, also_png=None, black=0.012):
        x = 1.0 - np.exp(-np.maximum(self.acc, 0) * exposure)
        x = x * x / (x + black)  # soft toe keeps blacks deep without banding edges
        yy, xx = np.mgrid[0:self.h, 0:self.w].astype(np.float32)
        r = ((xx / self.w - 0.5) * 2) ** 2 + ((yy / self.h - 0.5) * 2) ** 2
        v = 1.0 - vignette * np.clip(r / 2.0, 0, 1) ** 1.1
        x *= v[..., None]
        x = np.clip(x, 0, 1) ** gamma
        g = self.rng.normal(0, grain, (self.h, self.w)).astype(np.float32)
        x = x + g[..., None] * (0.35 + 0.65 * np.sqrt(np.clip(x.mean(-1, keepdims=True), 0, 1)))
        x = np.clip(x, 0, 1)
        img = Image.fromarray((x * 255 + 0.5).astype(np.uint8), "RGB")
        if size:
            img = img.resize(size, Image.LANCZOS)
        img.save(path, "WEBP", quality=quality, method=6)
        if also_png:
            img.save(also_png, "PNG", optimize=True)
        return img


# ---------- geometry generators ----------

def bolt_path(p0, p1, rng, rough=0.22, depth=7):
    pts = [np.array(p0, float), np.array(p1, float)]
    disp = rough * np.linalg.norm(pts[1] - pts[0])
    for _ in range(depth):
        new = []
        for a, b in zip(pts[:-1], pts[1:]):
            d = b - a
            perp = np.array([-d[1], d[0]]) / (np.linalg.norm(d) + 1e-9)
            m = (a + b) / 2 + perp * rng.normal(0, disp)
            new += [a, m]
        new.append(pts[-1])
        pts = new
        disp *= 0.52
    return [tuple(p) for p in pts]


def bolt_tree(p0, p1, rng, rough=0.22, depth=7, branches=6, level=0, max_level=2):
    """Returns list of (points, weight) for main bolt + recursive branches."""
    main = bolt_path(p0, p1, rng, rough, depth)
    out = [(main, 1.0 / (1 + level * 1.8))]
    if level >= max_level:
        return out
    n = len(main)
    L = math.dist(p0, p1)
    for _ in range(branches):
        i = int(rng.uniform(0.08, 0.8) * n)
        a = np.array(main[i])
        d = np.array(main[min(n - 1, i + 6)]) - a
        ang = math.atan2(d[1], d[0]) + rng.choice([-1, 1]) * rng.uniform(0.35, 0.9)
        ln = L * rng.uniform(0.12, 0.35) / (1 + level)
        b = a + ln * np.array([math.cos(ang), math.sin(ang)])
        sub = bolt_tree(tuple(a), tuple(b), rng, rough * 1.1, depth - 2, max(1, branches // 2), level + 1, max_level)
        out += [(p, w * 0.7) for p, w in sub]
    return out


def pubkey_bits(seed_text, n=256):
    h = b""
    i = 0
    while len(h) * 8 < n:
        h += hashlib.sha256(f"{seed_text}:{i}".encode()).digest()
        i += 1
    bits = []
    for byte in h:
        for k in range(8):
            bits.append((byte >> (7 - k)) & 1)
    return bits[:n]


def sigil(L, cx, cy, r0, r1, seed_text, rings=8, segs=32, width=2.2, v=255, gap=2.0, rot=0.0):
    """Radial pubkey sigil: each set bit of a sha256 stream lights one arc segment."""
    bits = pubkey_bits(seed_text, rings * segs)
    for ri in range(rings):
        r = r0 + (r1 - r0) * ri / max(1, rings - 1)
        step = 360 / segs
        off = rot + ri * 7.5
        for si in range(segs):
            if bits[ri * segs + si]:
                a0 = off + si * step + gap / 2
                a1 = off + (si + 1) * step - gap / 2
                L.arc(cx, cy, r, a0, a1, width, v * (0.55 + 0.45 * ((ri + si) % 3 == 0)))


def rounded_rect_pts(cx, cy, w, h, r, ang=0.0, n=10):
    pts = []
    corners = [(w / 2 - r, -h / 2 + r, -90, 0), (w / 2 - r, h / 2 - r, 0, 90),
               (-w / 2 + r, h / 2 - r, 90, 180), (-w / 2 + r, -h / 2 + r, 180, 270)]
    for ox, oy, a0, a1 in corners:
        for k in range(n + 1):
            a = math.radians(a0 + (a1 - a0) * k / n)
            pts.append((ox + r * math.cos(a), oy + r * math.sin(a)))
    pts.append(pts[0])
    ca, sa = math.cos(ang), math.sin(ang)
    return [(cx + x * ca - y * sa, cy + x * sa + y * ca) for x, y in pts]


def bezier(p0, p1, p2, p3, n=80):
    out = []
    for i in range(n + 1):
        t = i / n
        u = 1 - t
        out.append((u ** 3 * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t ** 3 * p3[0],
                    u ** 3 * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t ** 3 * p3[1]))
    return out


def font(path_candidates, size):
    for p in path_candidates:
        try:
            return ImageFont.truetype(p, size)
        except Exception:
            continue
    return ImageFont.load_default()
