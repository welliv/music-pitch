import math
import numpy as np
from engine import *

OUT = "/workspace/tidal-music-agent-pitch/public/art"


def draw_bolt(c, p0, p1, seed, color=GREEN, width=3.2, intensity=1.0, rough=0.2, branches=7, max_level=2,
              glows=None):
    rng = np.random.default_rng(seed)
    tree = bolt_tree(p0, p1, rng, rough=rough, depth=8, branches=branches, max_level=max_level)
    L = c.layer()
    for pts, w in tree:
        L.fade_line(pts, width * w, 255 * min(1, w * 1.3), 255 * w * 0.25, width * w * 0.35)
    c.add(L.mask(), color, intensity,
          glows=glows or ((0, 1.0), (2, 0.7), (7, 0.45), (22, 0.28), (70, 0.18), (200, 0.10)),
          core_white=0.8)
    return tree


def hero(name="hero", W=2400, H=1500, seed=11, bx=0.80):
    c = Canvas(W, H, seed)
    horizon = 0.80
    hy = horizon * H
    # deep atmosphere: violet high-left, green breath at the strike
    c.fog(VIOLET, 0.05, cx=0.25, cy=0.25, rx=0.6, ry=0.45, power=1.4, octaves=6)
    c.fog(BLUE, 0.025, cx=0.55, cy=0.15, rx=0.8, ry=0.35, power=2.2)
    c.radial(GREEN, 0.05, bx, horizon, 0.14)
    # the strike
    draw_bolt(c, (bx * W + 40, -40), (bx * W, hy), seed, GREEN, width=3.6, intensity=1.1, rough=0.17,
              branches=6)
    # impact flash
    c.radial(mix(GREEN, WHITE, 0.4), 0.55, bx, horizon, 0.012)
    c.radial(GREEN, 0.12, bx, horizon, 0.04)
    # waveform pulse travelling along the horizon (lightning → sound)
    L = c.layer()
    xs = np.linspace(0, W, 1400)
    for k, (amp, fr, ph, v) in enumerate([(70, 0.021, 0.0, 255), (46, 0.034, 1.3, 170), (26, 0.055, 2.1, 120)]):
        pts = []
        for x in xs:
            d = (x - bx * W) / W
            env = math.exp(-abs(d) * 3.2) * (0.25 + 0.75 * math.exp(-(d * 9) ** 2))
            y = hy + amp * env * math.sin(abs(x - bx * W) * fr + ph) * math.cos(abs(d) * 14)
            pts.append((x, y))
        L.line(pts, 2.0 if k == 0 else 1.3, v)
    # hairline horizon
    L.line([(0, hy), (W, hy)], 1.0, 60)
    # audio-meter bars rising out of the strike point (mirrored)
    rng = np.random.default_rng(seed + 5)
    x = 0.0
    while x < W:
        d = (x - bx * W) / W
        env = math.exp(-abs(d) * 4.0)
        hgt = (8 + 150 * env * (0.35 + 0.65 * rng.random() ** 1.5)) * (0.6 + 0.4 * abs(math.sin(x * 0.013)))
        L.line([(x, hy - hgt), (x, hy + hgt * 0.55)], 1.6, 40 + 150 * env)
        x += 9
    c.add_grad(L.mask(), VIOLET, GREEN, 0.95, axis="x", t0=0.05, t1=bx,
               glows=((0, 1.0), (3, 0.6), (12, 0.35), (40, 0.2), (120, 0.1)))
    # right side tail fades to magenta
    R = c.layer()
    c.reflect(horizon, strength=0.32, sigma=5, falloff=0.25)
    c.dust(260, mix(VIOLET, WHITE, 0.3), region=(0, 0, 1, horizon), intensity=0.35,
           weight=lambda x, y: 0.3 + 0.7 * (1 - y))
    c.dust(80, GREEN, region=(bx - 0.15, horizon - 0.25, bx + 0.15, horizon), intensity=0.5)
    return c


if __name__ == "__main__":
    import sys
    c = hero()
    c.finish(f"/tmp/hero_test.webp", exposure=1.2)


# ---------------------------------------------------------------- rails

def lightning_rails(W=1800, H=1200, seed=21, color=GREEN, accent=CYAN, vp=(0.5, 0.40)):
    """Payment channels as perspective light rails, packets racing to one point."""
    c = Canvas(W, H, seed)
    rng = c.rng
    vx, vy = vp[0] * W, vp[1] * H
    c.radial(color, 0.08, vp[0], vp[1], 0.10)
    L = c.layer()
    P = c.layer()
    n = 26
    for i in range(n):
        t = (i + 0.5) / n
        bx = -0.6 * W + t * 2.2 * W
        by = H * 1.05
        pts = [(bx + (vx - bx) * k / 60, by + (vy - by) * k / 60) for k in range(61)]
        base = 120 if i % 4 else 220
        L.fade_line(pts[::-1], 0.5, 30, base, 0.5 + 1.6 * (i % 4 == 0))
        # packets: bright streaks moving along rail
        for _ in range(rng.integers(0, 3)):
            u = rng.uniform(0.05, 0.92)
            ln = 0.06 * (1 - u) + 0.01
            a = (bx + (vx - bx) * u, by + (vy - by) * u)
            b = (bx + (vx - bx) * (u + ln), by + (vy - by) * (u + ln))
            P.fade_line([a, b], 4.0 * (1 - u) + 0.8, 40, 255, 1.2 * (1 - u) + 0.6)
    # distant horizon hairline
    L.fade_line([(vx, vy), (W + 10, vy)], 0.8, 140, 0)
    L.fade_line([(vx, vy), (-10, vy)], 0.8, 140, 0)
    c.add(L.mask(), mix(color, accent, 0.25), 0.8, glows=((0, 1.0), (2, 0.5), (10, 0.25), (40, 0.12)))
    c.add(P.mask(), color, 1.3, core_white=0.85)
    # a tiny bolt glyph at the vanishing point, the settlement
    draw_bolt(c, (vx + 30, -40), (vx, vy), seed + 3, color, width=1.8, intensity=0.75,
              rough=0.14, branches=3, max_level=1)
    c.radial(mix(color, WHITE, 0.5), 0.6, vp[0], vp[1], 0.006)
    c.dust(120, color, region=(0, 0.3, 1, 1), intensity=0.3)
    return c


# ---------------------------------------------------------------- nostr sigil

def nostr_sigil(W=1800, H=1100, seed=31, cx=0.5, cy=0.5, scale=1.0, text="npub:artist", relays=True,
                c0=VIOLET, c1=MAGENTA):
    c = Canvas(W, H, seed)
    rng = c.rng
    X, Y = cx * W, cy * H
    R = min(W, H) * 0.36 * scale
    c.radial(c0, 0.10, cx, cy, 0.22 * scale)
    L = c.layer()
    sigil(L, X, Y, R * 0.28, R, text, rings=9, segs=36, width=2.4 * scale, v=255, gap=2.4)
    # fine tick ring outside
    for k in range(180):
        a = math.radians(k * 2)
        r0, r1 = R * 1.08, R * (1.12 if k % 5 else 1.17)
        L.line([(X + r0 * math.cos(a), Y + r0 * math.sin(a)), (X + r1 * math.cos(a), Y + r1 * math.sin(a))],
               1.0, 90 if k % 5 else 170)
    L.ring(X, Y, R * 1.25, 0.8, 60)
    c.add_grad(L.mask(), c0, c1, 1.0, axis="y", t0=0.15, t1=0.85, core_white=0.55)
    # key core: a small luminous seed
    K = c.layer()
    K.ring(X, Y, R * 0.13, 2.4 * scale, 255)
    K.dot(X, Y, R * 0.035, 255)
    c.add(K.mask(), mix(c1, WHITE, 0.2), 1.1, core_white=0.8)
    if relays:
        # relays orbiting, signed notes travelling as short arcs
        Rl = c.layer()
        Nt = c.layer()
        for i in range(9):
            a = rng.uniform(0, 2 * math.pi)
            rr = R * rng.uniform(1.45, 2.3)
            x, y = X + rr * math.cos(a), Y + rr * math.sin(a) * 0.82
            if -50 < x < W + 50 and -50 < y < H + 50:
                Rl.ring(x, y, rng.uniform(6, 13) * scale, 1.4, 200)
                Rl.dot(x, y, 2.2 * scale, 255)
                mid = ((x + X) / 2 + rng.normal(0, 60), (y + Y) / 2 + rng.normal(0, 60))
                pts = bezier((X + R * 1.25 * math.cos(a), Y + R * 1.25 * math.sin(a) * 0.82), mid, mid, (x, y), 60)
                Rl.fade_line(pts, 0.8, 120, 20)
                u = rng.uniform(0.3, 0.8)
                seg = pts[int(u * 60) - 6:int(u * 60)]
                if len(seg) > 1:
                    Nt.fade_line(seg, 2.6, 40, 255, 2.6)
        c.add(Rl.mask(), mix(c0, BLUE, 0.3), 0.8)
        c.add(Nt.mask(), c1, 1.2, core_white=0.8)
    c.dust(180, mix(c0, WHITE, 0.4), intensity=0.3)
    return c


# ---------------------------------------------------------------- agent mesh

def agent_mesh(W=1800, H=1010, seed=41, hub=(0.64, 0.52), n=70, c0=BLUE, c1=GREEN):
    c = Canvas(W, H, seed)
    rng = c.rng
    pts = []
    while len(pts) < n:
        p = (rng.uniform(-0.05, 1.05) * W, rng.uniform(-0.05, 1.05) * H)
        if all(math.dist(p, q) > 90 for q in pts):
            pts.append(p)
    hx, hy = hub[0] * W, hub[1] * H
    pts.append((hx, hy))
    E = c.layer()
    Nd = c.layer()
    Lit = c.layer()
    arr = np.array(pts)
    for i, p in enumerate(pts):
        d = np.hypot(*(arr - p).T)
        for j in np.argsort(d)[1:4]:
            E.line([p, pts[j]], 0.6, 32)
        Nd.ring(p[0], p[1], 3.5, 1.0, 150)
        Nd.dot(p[0], p[1], 1.3, 220)
    # lit routes: greedy walks toward hub
    for s in rng.choice(n, 9, replace=False):
        cur = s
        route = [pts[cur]]
        for _ in range(12):
            d_hub = np.hypot(*(arr - (hx, hy)).T)
            d = np.hypot(*(arr - pts[cur]).T)
            cand = [j for j in np.argsort(d)[1:6] if d_hub[j] < d_hub[cur]]
            if not cand:
                break
            cur = cand[0]
            route.append(pts[cur])
            if cur == len(pts) - 1:
                break
        if len(route) > 1:
            Lit.fade_line(route, 0.8, 50, 255, 2.6)
            Nd.ring(route[0][0], route[0][1], 7, 1.4, 255)
    c.add(E.mask(), c0, 0.55, glows=((0, 1.0), (3, 0.4), (14, 0.2)))
    c.add(Nd.mask(), mix(c0, WHITE, 0.3), 0.8)
    c.add_grad(Lit.mask(), c0, c1, 1.1, axis="x", t0=0.1, t1=hub[0], core_white=0.7)
    H_ = c.layer()
    for k, r in enumerate([16, 30, 52, 84]):
        H_.ring(hx, hy, r, 1.6 if k == 0 else 0.9, 255 - k * 55)
    H_.dot(hx, hy, 6, 255)
    c.add(H_.mask(), c1, 1.2, core_white=0.8)
    c.radial(c1, 0.12, hub[0], hub[1], 0.07)
    c.fog(c0, 0.04, cx=0.3, cy=0.4, rx=0.6, ry=0.5, power=1.4, octaves=6)
    return c


# ---------------------------------------------------------------- silk waveform

def silk_wave(W=1800, H=1200, seed=51, c0=VIOLET, c1=GREEN, lines=90, cy=0.52, amp=0.24, twist=1.3):
    c = Canvas(W, H, seed)
    L = c.layer()
    xs = np.linspace(-20, W + 20, 900)
    for i in range(lines):
        t = i / (lines - 1)
        ph = t * math.pi * twist
        ys = []
        for x in xs:
            u = x / W
            env = math.sin(math.pi * np.clip(u * 1.05 - 0.02, 0, 1)) ** 1.3
            y = cy * H + amp * H * env * (math.sin(u * 7.0 + ph) * 0.7 + 0.3 * math.sin(u * 17 + ph * 2.3)) \
                + (t - 0.5) * 140 * env * math.cos(u * 3 + ph * 0.5)
            ys.append(y)
        v = 60 + 160 * math.sin(math.pi * t) ** 2
        L.line(list(zip(xs, ys)), 0.9, v)
    c.add_grad(L.mask(), c0, c1, 1.0, axis="x", t0=0.15, t1=0.85,
               glows=((0, 1.0), (2, 0.5), (8, 0.3), (30, 0.18), (100, 0.1)))
    c.dust(140, mix(c1, WHITE, 0.3), intensity=0.3, region=(0.1, 0.2, 0.9, 0.9))
    return c


# ---------------------------------------------------------------- catalog

def catalog(W=1600, H=1067, seed=61, c0=VIOLET, c1=MAGENTA):
    """Isometric field of encrypted catalog tiles, a few lit with cipher dots."""
    c = Canvas(W, H, seed)
    rng = c.rng
    T = c.layer()
    Lt = c.layer()
    Cp = c.layer()
    s = 58
    N = 26
    ox, oy = W * 0.5, H * 0.52 - N * s * 0.5
    for gx in range(0, N + 1):
        for gy in range(0, N + 1):
            cxp = ox + (gx - gy) * s * 0.87
            cyp = oy + (gx + gy) * s * 0.5
            if not (-100 < cxp < W + 100 and -100 < cyp < H + 100):
                continue
            q = [(cxp, cyp - s * 0.5), (cxp + s * 0.87, cyp), (cxp, cyp + s * 0.5), (cxp - s * 0.87, cyp)]
            q = [((a[0] - cxp) * 0.9 + cxp, (a[1] - cyp) * 0.9 + cyp) for a in q]
            depth = np.clip(cyp / H, 0, 1)
            T.line(q + [q[0]], 0.7, 10 + 70 * depth ** 1.5)
            if rng.random() < 0.05 * (0.3 + depth):
                Lt.line(q + [q[0]], 1.4, 255)
                for _ in range(14):
                    a, b = rng.random(), rng.random()
                    x0 = q[0][0] + (q[1][0] - q[0][0]) * a + (q[3][0] - q[0][0]) * b
                    y0 = q[0][1] + (q[1][1] - q[0][1]) * a + (q[3][1] - q[0][1]) * b
                    Cp.dot(x0, y0, 1.4, 255)
                # vertical beam = published
                if rng.random() < 0.5:
                    Lt.fade_line([(cxp, cyp), (cxp, cyp - rng.uniform(120, 340))], 1.2, 200, 0)
    c.add(T.mask(), mix(c0, BLUE, 0.3), 0.7, glows=((0, 1.0), (3, 0.3), (16, 0.15)))
    c.add_grad(Lt.mask(), c0, c1, 1.0, axis="x", core_white=0.6)
    c.add(Cp.mask(), mix(c1, WHITE, 0.4), 0.9, glows=((0, 1.0), (2, 0.6), (8, 0.3)))
    c.fog(c0, 0.05, cx=0.5, cy=0.2, rx=0.7, ry=0.4, power=1.4, octaves=6)
    return c


# ---------------------------------------------------------------- pay link

def pay_link(W=1600, H=1069, seed=71, c0=GREEN, c1=BLUE):
    c = Canvas(W, H, seed)
    X, Y = W * 0.5, H * 0.5
    L = c.layer()
    ang = -0.42
    w, h = W * 0.34, H * 0.22
    off = w * 0.37
    A = rounded_rect_pts(X - off * math.cos(ang), Y - off * math.sin(ang), w, h, h / 2, ang, 24)
    B = rounded_rect_pts(X + off * math.cos(ang), Y + off * math.sin(ang), w, h, h / 2, ang, 24)
    L.line(A, 6, 255)
    L2 = c.layer()
    L2.line(B, 6, 255)
    c.add(L.mask(), c1, 0.9, core_white=0.5)
    c.add(L2.mask(), c0, 1.0, core_white=0.6)
    # spark at the junction
    draw_bolt(c, (X + 10, Y - 120), (X - 10, Y + 120), seed, mix(c0, WHITE, 0.2), width=2.2, intensity=1.1,
              rough=0.18, branches=3, max_level=1)
    c.radial(mix(c0, WHITE, 0.5), 0.5, 0.5, 0.5, 0.01)
    c.radial(c0, 0.10, 0.5, 0.5, 0.08)
    # "402" written as faint mono dot-matrix, low-key
    D = c.layer()
    glyph = {"4": ["1001", "1001", "1111", "0001", "0001"], "0": ["1111", "1001", "1001", "1001", "1111"],
             "2": ["1111", "0001", "1111", "1000", "1111"]}
    gx0, gy0, p = W * 0.07, H * 0.82, 11
    for k, ch in enumerate("402"):
        for r, row in enumerate(glyph[ch]):
            for q, b in enumerate(row):
                D.dot(gx0 + k * p * 5.5 + q * p, gy0 + r * p, 2.2 if b == "1" else 0.7, 200 if b == "1" else 50)
    c.add(D.mask(), mix(c0, WHITE, 0.3), 0.6, glows=((0, 1.0), (3, 0.5), (10, 0.2)))
    c.dust(90, c0, intensity=0.3)
    return c


# ---------------------------------------------------------------- converge

def converge(W=1600, H=971, seed=81, node=(0.74, 0.5), streams=34, c0=BLUE, c1=GREEN, sources=None):
    c = Canvas(W, H, seed)
    rng = c.rng
    nx, ny = node[0] * W, node[1] * H
    L = c.layer()
    for i in range(streams):
        if sources:
            sx, sy = sources[i % len(sources)]
            sx, sy = sx * W + rng.normal(0, 8), sy * H + rng.normal(0, 30)
        else:
            sx, sy = -40, rng.uniform(-0.1, 1.1) * H
        p1 = (sx + (nx - sx) * 0.45, sy)
        p2 = (nx - (nx - sx) * 0.35, ny + (sy - ny) * 0.15)
        pts = bezier((sx, sy), p1, p2, (nx, ny), 120)
        L.fade_line(pts, 0.6, 40, 210, 1.4)
    c.add_grad(L.mask(), c0, c1, 0.9, axis="x", t0=0.0, t1=node[0], core_white=0.5)
    # outflow: one clean settled line to the right edge
    O = c.layer()
    O.fade_line([(nx, ny), (W + 20, ny)], 3.0, 255, 120, 1.5)
    c.add(O.mask(), c1, 1.0, core_white=0.8)
    N = c.layer()
    for k, r in enumerate([10, 22, 40]):
        N.ring(nx, ny, r, 1.5, 255 - 70 * k)
    N.dot(nx, ny, 4.5, 255)
    c.add(N.mask(), c1, 1.2, core_white=0.85)
    c.radial(c1, 0.14, node[0], node[1], 0.06)
    c.dust(110, mix(c0, WHITE, 0.3), intensity=0.3)
    return c


# ---------------------------------------------------------------- play

def play_ripple(W=1600, H=1067, seed=91, c0=VIOLET, c1=GREEN, cx=0.5):
    c = Canvas(W, H, seed)
    X, Y = W * cx, H * 0.5
    R = c.layer()
    for k in range(14):
        r = 120 + k * 46 + k * k * 5
        R.ring(X, Y, r, 1.0, 230 * math.exp(-k / 5.0))
    c.add_grad(R.mask(), c1, c0, 0.8, axis="x", t0=0.2, t1=0.9, core_white=0.4)
    T = c.layer()
    s = 120
    tri = [(X - s * 0.42, Y - s * 0.6), (X + s * 0.62, Y), (X - s * 0.42, Y + s * 0.6), (X - s * 0.42, Y - s * 0.6)]
    T.line(tri, 4.0, 255)
    c.add(T.mask(), mix(c1, WHITE, 0.15), 1.2, core_white=0.85)
    c.radial(c1, 0.12, cx, 0.5, 0.06)
    # horizontal waveform passing through the play glyph
    Wv = c.layer()
    xs = np.linspace(0, W, 900)
    pts = [(x, Y + 60 * math.exp(-((x - X) / (W * 0.25)) ** 2) * math.sin(x * 0.045) * math.sin(x * 0.007))
           for x in xs]
    Wv.line(pts, 1.1, 160)
    c.add_grad(Wv.mask(), c0, c1, 0.6, axis="x", t0=0.0, t1=0.5)
    c.dust(90, mix(c0, WHITE, 0.4), intensity=0.3)
    return c


# ---------------------------------------------------------------- wallet card

def wallet_card(W=1600, H=1067, seed=101, c0=GREEN):
    c = Canvas(W, H, seed)
    X, Y = W * 0.52, H * 0.46
    ang = -0.22
    w, h = W * 0.44, W * 0.44 / 1.586
    edge = rounded_rect_pts(X, Y, w, h, 34, ang, 16)
    L = c.layer()
    L.line(edge, 1.6, 255)
    c.add(L.mask(), mix(c0, CYAN, 0.2), 0.9, core_white=0.5)
    # rim light along the top edge only, brighter
    top = edge[0:34]
    Rm = c.layer()
    Rm.fade_line(top, 3.0, 60, 255, 3.0)
    c.add(Rm.mask(), c0, 1.1, core_white=0.85)
    # faint glass face
    Fc = c.layer(1)
    Fc.poly(edge, v=9)
    c.add(Fc.mask(), mix(c0, BLUE, 0.5), 0.5, glows=((0, 1.0), (14, 0.15)))
    # etched bolt on card face (original geometric mark)
    ca, sa = math.cos(ang), math.sin(ang)
    bolt = [(-18, -60), (-44, 6), (-8, 6), (-26, 62), (34, -14), (0, -14), (18, -60), (-18, -60)]
    bx, by = -w * 0.30, -h * 0.05
    pts = [(X + (bx + x) * ca - (by + y) * sa, Y + (bx + x) * sa + (by + y) * ca) for x, y in bolt]
    B = c.layer()
    B.line(pts, 2.0, 255)
    c.add(B.mask(), c0, 1.1, core_white=0.8)
    # chip-like dot row (abstract, not a real card design)
    D = c.layer()
    for k in range(16):
        x, y = w * 0.05 + k * 14, h * 0.28
        D.dot(X + x * ca - y * sa, Y + x * sa + y * ca, 1.6, 150)
    c.add(D.mask(), mix(c0, WHITE, 0.4), 0.6)
    c.reflect(0.86, strength=0.25, sigma=8, falloff=0.3)
    c.radial(c0, 0.03, 0.52, 0.46, 0.2)
    c.dust(80, c0, intensity=0.25)
    return c


# ---------------------------------------------------------------- x402 gate

def gate_402(W=1800, H=1010, seed=111, c0=BLUE, c1=GREEN):
    """HTTP 402 as a portal: requests arrive cool blue, leave settled green."""
    c = Canvas(W, H, seed)
    rng = c.rng
    gx, gy = W * 0.5, H * 0.5
    gw, gh = 150, H * 0.62
    G = c.layer()
    G.line(rounded_rect_pts(gx, gy, gw, gh, 40, 0, 16), 3.0, 255)
    c.add(G.mask(), mix(c0, c1, 0.5), 1.0, core_white=0.7)
    In = c.layer()
    Out = c.layer()
    for i in range(22):
        y = gy + rng.normal(0, gh * 0.18)
        In.fade_line([(-20, y + rng.normal(0, 40)), (gx - gw / 2, y)], 0.8, 30, 200, 1.2)
        if rng.random() < 0.8:
            Out.fade_line([(gx + gw / 2, y), (W + 20, y + rng.normal(0, 25))], 1.6, 255, 50, 0.6)
    c.add(In.mask(), c0, 0.8)
    c.add(Out.mask(), c1, 1.0, core_white=0.7)
    c.radial(c1, 0.10, 0.5, 0.5, 0.10)
    c.reflect(0.5 + 0.62 / 2 + 0.02, strength=0.22, sigma=6)
    c.dust(80, c0, intensity=0.3)
    return c


# ---------------------------------------------------------------- relay field

def relay_field(W=2000, H=1200, seed=121, c0=VIOLET, c1=MAGENTA, origin=(0.36, 0.55)):
    c = Canvas(W, H, seed)
    rng = c.rng
    ox, oy = origin[0] * W, origin[1] * H
    R = c.layer()
    Lk = c.layer()
    nodes = []
    while len(nodes) < 46:
        p = (rng.uniform(0.02, 0.98) * W, rng.uniform(0.05, 0.95) * H)
        if all(math.dist(p, q) > 130 for q in nodes):
            nodes.append(p)
    for p in nodes:
        d = math.dist(p, (ox, oy)) / W
        v = 255 * math.exp(-d * 2.2)
        R.ring(p[0], p[1], 9, 1.2, 60 + v * 0.7)
        R.dot(p[0], p[1], 2.0, 90 + v * 0.6)
    for p in nodes:
        dists = sorted(nodes, key=lambda q: math.dist(p, q))[1:3]
        for q in dists:
            Lk.line([p, q], 0.6, 40)
    # propagation ripples of a signed note
    Rp = c.layer()
    for k in range(9):
        r = 60 + k * 120
        Rp.ring(ox, oy, r, 1.2, 230 * math.exp(-k / 3.2))
    c.add(Lk.mask(), mix(c0, BLUE, 0.3), 0.6, glows=((0, 1.0), (4, 0.3)))
    c.add(R.mask(), mix(c0, WHITE, 0.2), 0.9)
    c.add(Rp.mask(), c1, 0.7, core_white=0.4)
    N = c.layer()
    N.dot(ox, oy, 6, 255)
    c.add(N.mask(), mix(c1, WHITE, 0.3), 1.3, core_white=0.9)
    c.radial(c1, 0.12, origin[0], origin[1], 0.06)
    c.fog(c0, 0.05, cx=origin[0], cy=origin[1], rx=0.7, ry=0.6, power=1.4, octaves=6)
    return c


# ---------------------------------------------------------------- storm

def storm(W=1600, H=1067, seed=131, c0=GREEN):
    c = Canvas(W, H, seed)
    c.fog(mix(c0, BLUE, 0.5), 0.05, cx=0.5, cy=0.15, rx=0.9, ry=0.3, power=1.3, octaves=6)
    draw_bolt(c, (W * 0.58, -30), (W * 0.40, H * 0.80), seed, c0, width=3.4, intensity=1.2, rough=0.2,
              branches=10, max_level=2)
    draw_bolt(c, (W * 0.2, -30), (W * 0.05, H * 0.45), seed + 9, c0, width=1.6, intensity=0.5, rough=0.2,
              branches=4, max_level=1)
    L = c.layer()
    L.line([(0, H * 0.80), (W, H * 0.80)], 0.8, 70)
    c.add(L.mask(), c0, 0.7)
    c.radial(mix(c0, WHITE, 0.5), 0.45, 0.40, 0.80, 0.012)
    c.reflect(0.80, strength=0.3, sigma=6, falloff=0.25)
    return c


# ---------------------------------------------------------------- pillars

def pillars(W=1400, H=1800, seed=141):
    """Identity · micropayments · connected apps — three columns of light."""
    c = Canvas(W, H, seed)
    floor = 0.78
    cols = [(0.28, VIOLET), (0.5, GREEN), (0.72, BLUE)]
    for i, (x, col) in enumerate(cols):
        L = c.layer()
        X = x * W
        top = H * (0.10 + 0.06 * abs(i - 1))
        L.fade_line([(X, floor * H), (X, top)], 7, 255, 0, 2)
        c.add(L.mask(), col, 1.0, glows=((0, 1.0), (4, 0.6), (16, 0.4), (60, 0.25), (180, 0.12)),
              core_white=0.85)
        c.radial(col, 0.18, x, floor, 0.035)
        # particles rising along the column
        Pt = c.layer()
        rng = c.rng
        for _ in range(70):
            yy = rng.uniform(top, floor * H)
            xx = X + rng.normal(0, 10 + 30 * (floor * H - yy) / H)
            Pt.dot(xx, yy, rng.uniform(0.6, 1.8), 220 * rng.random() ** 1.5)
        c.add(Pt.mask(), col, 0.6, glows=((0, 1.0), (3, 0.6), (10, 0.3)))
        c.radial(mix(col, WHITE, 0.4), 0.25, x, top / H, 0.008)
    # thin arcs linking the three at the top (connected)
    A = c.layer()
    A.line(bezier((0.28 * W, H * 0.22), (0.38 * W, H * 0.12), (0.62 * W, H * 0.12), (0.72 * W, H * 0.22)), 0.9, 120)
    A.line([(0.12 * W, floor * H), (0.88 * W, floor * H)], 0.8, 80)
    c.add(A.mask(), mix(VIOLET, BLUE, 0.5), 0.8)
    c.reflect(floor, strength=0.35, sigma=7, falloff=0.25)
    c.dust(260, mix(VIOLET, WHITE, 0.4), region=(0, 0, 1, floor), intensity=0.35)
    return c


# ---------------------------------------------------------------- silos

def silos(W=2000, H=800, seed=151):
    """Three locked platform silos; one opens into an artist pay link."""
    c = Canvas(W, H, seed)
    rng = c.rng
    S = c.layer()
    Dt = c.layer()
    boxes = [(0.14, 0.5), (0.29, 0.5), (0.44, 0.5)]
    for i, (bx, by) in enumerate(boxes):
        X, Y = bx * W, by * H
        w, h = 250, 420
        pts = rounded_rect_pts(X, Y, w, h, 18, 0, 8)
        if i == 2:
            # opened on the right side — the artist link breaks the silo
            S.line(pts[9:] + pts[1:9], 1.4, 150)
        else:
            S.line(pts, 1.4, 150)
        for _ in range(55 if i < 2 else 25):
            Dt.dot(X + rng.uniform(-w / 2.6, w / 2.6), Y + rng.uniform(-h / 2.6, h / 2.6), 1.8, 140)
    c.add(S.mask(), mix(BLUE, VIOLET, 0.4), 0.7, glows=((0, 1.0), (3, 0.4), (14, 0.2)))
    c.add(Dt.mask(), mix(VIOLET, WHITE, 0.3), 0.6, glows=((0, 1.0), (3, 0.4)))
    # escaping stream to a pay link node
    St = c.layer()
    X0, Y0 = boxes[2][0] * W + 125, H * 0.5
    nx, ny = W * 0.82, H * 0.5
    for i in range(18):
        sy = Y0 + rng.normal(0, 50)
        pts = bezier((X0 - 60, sy), (X0 + 160, sy), (nx - 200, ny), (nx, ny), 80)
        St.fade_line(pts, 0.6, 50, 230, 1.4)
    c.add_grad(St.mask(), VIOLET, GREEN, 1.0, axis="x", t0=0.45, t1=0.82, core_white=0.6)
    N = c.layer()
    N.ring(nx, ny, 22, 1.6, 255)
    N.ring(nx, ny, 44, 0.9, 150)
    N.dot(nx, ny, 5, 255)
    c.add(N.mask(), GREEN, 1.2, core_white=0.85)
    c.radial(GREEN, 0.12, 0.82, 0.5, 0.06)
    return c


# ---------------------------------------------------------------- composites

def zap(W=1400, H=1050, seed=161):
    """A Nostr zap: lightning, in Nostr violet/magenta."""
    c = Canvas(W, H, seed)
    c.fog(VIOLET, 0.05, cx=0.5, cy=0.2, rx=0.8, ry=0.35, power=1.3, octaves=6)
    draw_bolt(c, (W * 0.55, -30), (W * 0.47, H * 0.78), seed, MAGENTA, width=3.0, intensity=1.1, rough=0.2,
              branches=8, max_level=2)
    L = c.layer()
    L.line([(0, H * 0.78), (W, H * 0.78)], 0.8, 70)
    c.add(L.mask(), VIOLET, 0.6)
    c.radial(mix(MAGENTA, WHITE, 0.5), 0.45, 0.47, 0.78, 0.012)
    c.reflect(0.78, strength=0.3, sigma=6, falloff=0.25)
    return c


def sandbox(W=2400, H=700, seed=171):
    """Three app panels (a music store, another app, a buyer agent) paying one link."""
    c = Canvas(W, H, seed)
    rng = c.rng
    panels = [(0.10, 0.26), (0.16, 0.52), (0.10, 0.78)]
    cols = [BLUE, VIOLET, CYAN]
    srcs = []
    for (px, py), col in zip(panels, cols):
        X, Y = px * W, py * H
        P = c.layer()
        P.line(rounded_rect_pts(X, Y, 220, 120, 16, 0, 8), 1.4, 220)
        for k in range(3):
            P.line([(X - 80, Y - 30 + k * 22), (X - 80 + rng.uniform(60, 150), Y - 30 + k * 22)], 2.0, 90)
        c.add(P.mask(), col, 0.8, core_white=0.5)
        srcs.append(((X + 110) / W, Y / H))
    nx, ny = 0.70 * W, 0.5 * H
    St = c.layer()
    for i, (sx, sy) in enumerate(srcs):
        for j in range(9):
            y0 = sy * H + rng.normal(0, 12)
            pts = bezier((sx * W, y0), (sx * W + 500, y0), (nx - 500, ny + rng.normal(0, 6)), (nx, ny), 120)
            St.fade_line(pts, 0.6, 50, 220, 1.3)
    c.add_grad(St.mask(), BLUE, GREEN, 0.9, axis="x", t0=0.2, t1=0.7, core_white=0.5)
    N = c.layer()
    for k, r in enumerate([12, 26, 46]):
        N.ring(nx, ny, r, 1.5, 255 - 70 * k)
    N.dot(nx, ny, 5, 255)
    c.add(N.mask(), GREEN, 1.2, core_white=0.85)
    O = c.layer()
    O.fade_line([(nx, ny), (W + 10, ny)], 2.6, 255, 60, 1.2)
    c.add(O.mask(), GREEN, 0.9, core_white=0.8)
    c.radial(GREEN, 0.12, 0.70, 0.5, 0.05)
    c.dust(120, mix(BLUE, WHITE, 0.3), intensity=0.3)
    return c


def gate_bolt(W=1800, H=1010, seed=181):
    """Lightning contributed to x402: a bolt standing inside the 402 gate."""
    c = Canvas(W, H, seed)
    rng = c.rng
    gx, gy = W * 0.5, H * 0.5
    gw, gh = 190, H * 0.66
    G = c.layer()
    G.line(rounded_rect_pts(gx, gy, gw, gh, 48, 0, 16), 1.6, 200)
    c.add(G.mask(), mix(BLUE, GREEN, 0.4), 0.8, core_white=0.5)
    draw_bolt(c, (gx + 12, gy - gh / 2 + 30), (gx - 8, gy + gh / 2 - 30), seed, GREEN, width=3.0,
              intensity=1.1, rough=0.12, branches=4, max_level=1)
    In = c.layer()
    Out = c.layer()
    for i in range(26):
        y = gy + rng.normal(0, gh * 0.2)
        In.fade_line([(-20, y + rng.normal(0, 60)), (gx - gw / 2 - 10, y)], 0.7, 20, 170, 1.0)
        Out.fade_line([(gx + gw / 2 + 10, y), (W + 20, y + rng.normal(0, 30))], 1.2, 220, 30, 0.5)
    c.add(In.mask(), BLUE, 0.7)
    c.add(Out.mask(), GREEN, 0.9, core_white=0.6)
    c.reflect(0.5 + 0.66 / 2 + 0.01, strength=0.25, sigma=6)
    c.dust(90, mix(BLUE, WHITE, 0.3), intensity=0.3)
    return c
