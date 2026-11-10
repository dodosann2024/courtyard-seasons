#!/usr/bin/env python3
"""Synthesise the sky-ocean sound set (no recordings, no samples) into assets/audio.

Every sound is built from noise, oscillators and filters with a fixed seed, encoded to mp3
and stored as assets/audio/<key>.<sha10>.mp3 like the rest of the audio. Loops carry 0.5 s of
periodic padding on both ends so they can be looped at [0.5, 0.5 + LOOP[key]] whatever the
decoder's mp3 priming delay is. Run once after changing a recipe, then tools/build.py.

Requires numpy, scipy and ffmpeg (libmp3lame).
"""
import hashlib, json, os, subprocess, sys, tempfile, wave
import numpy as np
from scipy import signal

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ADIR = os.path.join(ROOT, "assets", "audio")
SR = 44100
PAD = 0.5
rng = np.random.default_rng(20261110)


def N(sec):
    return int(round(sec * SR))


def t_of(n):
    return np.arange(n) / SR


def white(n):
    return rng.standard_normal(n)


def sos(kind, f, order=2):
    if kind == "bp":
        return signal.butter(order, [f[0] / (SR / 2), f[1] / (SR / 2)], "bandpass", output="sos")
    return signal.butter(order, f / (SR / 2), {"lp": "lowpass", "hp": "highpass"}[kind], output="sos")


def lp(x, f, o=2):
    return signal.sosfilt(sos("lp", f, o), x)


def hp(x, f, o=2):
    return signal.sosfilt(sos("hp", f, o), x)


def bp(x, a, b, o=2):
    return signal.sosfilt(sos("bp", (a, b), o), x)


def reson(x, f, q):
    """two-pole resonator with unity peak gain"""
    w = 2 * np.pi * f / SR
    r = np.exp(-w / (2 * q))
    b = [(1 - r * r) / 2, 0, -(1 - r * r) / 2]
    a = [1, -2 * r * np.cos(w), r * r]
    return signal.lfilter(b, a, x)


def env_ad(n, a, d, shape=1.0):
    t = t_of(n)
    e = np.where(t < a, t / max(a, 1e-6), np.exp(-(t - a) / max(d, 1e-6)))
    return e ** shape


def shaped(n, fn, nper=2048):
    """noise with a time-varying magnitude spectrum fn(freqs[:,None], times[None,:])"""
    x = white(n + nper)
    f, tt, Z = signal.stft(x, SR, nperseg=nper, noverlap=nper * 3 // 4)
    Z *= fn(f[:, None], tt[None, :])
    _, y = signal.istft(Z, SR, nperseg=nper, noverlap=nper * 3 // 4)
    return y[:n]


def smooth_ctrl(tt, rate, lo, hi):
    """smooth random control signal at roughly `rate` Hz (cosine-interpolated)"""
    tt = np.ravel(tt)
    k = max(4, int(tt[-1] * rate) + 4)
    pts = rng.uniform(lo, hi, k)
    xs = np.linspace(0, tt[-1] + 1e-6, k)
    i = np.clip(np.searchsorted(xs, tt) - 1, 0, k - 2)
    u = (tt - xs[i]) / (xs[i + 1] - xs[i])
    u = (1 - np.cos(np.pi * u)) / 2
    return pts[i] * (1 - u) + pts[i + 1] * u


def reverb(x, sec, damp=3000.0, wet=0.3, pre=0.01, stereo=False):
    n = N(sec)
    out = []
    for c in range(2 if stereo else 1):
        ir = white(n) * np.exp(-t_of(n) / (sec / 6.9))
        ir = lp(ir, damp)
        ir = np.concatenate([np.zeros(N(pre)), ir])
        ir /= np.sqrt(np.sum(ir ** 2)) + 1e-9
        y = signal.fftconvolve(x, ir)[: len(x) + len(ir) - 1]
        dry = np.concatenate([x, np.zeros(len(y) - len(x))])
        out.append(dry * (1 - wet) + y * wet * 1.2)
    return np.stack(out) if stereo else out[0]


def make_loop(fn, T, X=1.5):
    """fn(n) -> (2, n) or (n,). Returns periodic-padded loop content of length T + 2*PAD."""
    n, nx = N(T), N(X)
    y = fn(n + nx)
    y = np.atleast_2d(y)
    a = y[:, :n].copy()
    fi = np.sin(np.linspace(0, np.pi / 2, nx)) ** 2
    a[:, :nx] = y[:, :nx] * np.sqrt(fi) + y[:, n:n + nx] * np.sqrt(1 - fi)
    p = N(PAD)
    return np.concatenate([a[:, -p:], a, a[:, :p]], axis=1)


def norm_peak(y, db=-1.0):
    return y / (np.max(np.abs(y)) + 1e-9) * 10 ** (db / 20)


def norm_rms(y, db=-20.0, ceil=-1.0):
    r = np.sqrt(np.mean(y ** 2)) + 1e-9
    y = y / r * 10 ** (db / 20)
    m = np.max(np.abs(y))
    c = 10 ** (ceil / 20)
    return y if m <= c else np.tanh(y / c) * c


def fade(y, a=0.004, b=0.05):
    y = np.atleast_2d(y).copy()
    n = y.shape[1]
    na, nb = N(a), N(b)
    if na:
        y[:, :na] *= np.linspace(0, 1, na)
    if nb:
        y[:, n - nb:] *= np.linspace(1, 0, nb)
    return y


# ---------------------------------------------------------------- loops

def bed(n):
    """open-ocean bed: overlapping swell washes, low rumble, soft hiss"""
    T = n / SR
    ch = []
    ev = []
    t0 = -2.0
    while t0 < T:
        ev.append((t0, rng.uniform(1.6, 3.2), rng.uniform(2.8, 5.0), rng.uniform(.55, 1.0), rng.uniform(-.8, .8)))
        t0 += rng.uniform(1.8, 3.6)
    for c in range(2):
        side = -1 if c == 0 else 1

        def fn(f, tt):
            a = np.zeros_like(tt)
            for (s, r, d, g, pan) in ev:
                u = tt - s
                e = np.where(u < 0, 0, np.where(u < r, np.sin(np.pi / 2 * u / r) ** 2, np.exp(-(u - r) / d * 1.6)))
                a = a + e * g * (1 + .35 * side * pan)
            fc = 220 + 1500 * np.clip(a, 0, 1.4) ** 1.3
            wash = a / np.sqrt(1 + (f / fc) ** 4) * (f > 40)
            rum = .8 / np.sqrt(1 + (f / 140) ** 6) * (.75 + .25 * np.sin(2 * np.pi * tt / 9.7 + c))
            hiss = .05 * (f > 2500) / np.sqrt(1 + (f / 9000) ** 2)
            return wash * .9 + rum + hiss
        ch.append(shaped(n, fn))
    return np.stack(ch)


def wind(n):
    """wind howl: wandering resonant peaks over pink-ish noise, gusty"""
    tt0 = t_of(n)
    ch = []
    for c in range(2):
        def fn(f, tt):
            g = .55 + .45 * smooth_ctrl(tt, .35, 0, 1)
            f1 = 330 + 260 * smooth_ctrl(tt, .25, 0, 1)
            f2 = 760 + 380 * smooth_ctrl(tt, .3, 0, 1)
            f3 = 1650 + 500 * smooth_ctrl(tt, .4, 0, 1)
            pk = lambda fc, bw: np.exp(-((f - fc) / bw) ** 2)
            base = 1 / np.sqrt(1 + (f / 500) ** 2) * (f > 60)
            return g * (base * .55 + 1.3 * g * pk(f1, 38) + .7 * g * pk(f2, 70) + .22 * g * g * pk(f3, 110))
        ch.append(shaped(n, fn, 4096))
    return np.stack(ch)


def surf(n):
    """distant surf / falls roar: dense low noise with slow breathing"""
    ch = []
    for c in range(2):
        def fn(f, tt):
            m = .7 + .3 * smooth_ctrl(tt, .2, 0, 1)
            return m / np.sqrt(1 + (f / 380) ** 4) * (f > 30) + .12 * m / np.sqrt(1 + (f / 3000) ** 2) * (f > 400)
        ch.append(shaped(n, fn))
    return np.stack(ch)


def lap(n):
    """lapping against the hull: wave-rhythmic slaps, slosh and small gulps"""
    out = np.zeros((2, n))
    t = 0.0
    T = n / SR
    while t < T:
        cyc = rng.uniform(2.2, 3.4)
        k = rng.integers(2, 5)
        for j in range(k):
            tt = t + j * rng.uniform(.18, .45) + rng.uniform(0, .05)
            g = (1 - j / k) * rng.uniform(.55, 1.0)
            L = N(rng.uniform(.25, .5))
            i0 = N(tt)
            if i0 + L >= n:
                continue
            s = bp(white(L), rng.uniform(250, 420), rng.uniform(1300, 2600)) * env_ad(L, rng.uniform(.01, .03), rng.uniform(.06, .14))
            th = np.cumsum(2 * np.pi * np.linspace(rng.uniform(240, 380), rng.uniform(420, 700), L) / SR)
            s = s + .35 * np.sin(th) * env_ad(L, .004, rng.uniform(.025, .06))
            pan = rng.uniform(-.6, .6)
            out[0, i0:i0 + L] += s * g * (1 - pan) / 2 * 1.4
            out[1, i0:i0 + L] += s * g * (1 + pan) / 2 * 1.4
        t += cyc
    slosh = np.stack([lp(white(n), 380) * (.5 + .5 * smooth_ctrl(t_of(n), .4, .2, 1)) for _ in range(2)]) * .35
    return out + slosh


def luff(n):
    """sail luffing: canvas fluttering at a wandering rate, with heavier slaps"""
    tt = t_of(n)
    out = []
    for c in range(2):
        rate = 7 + 5 * smooth_ctrl(tt, .6, 0, 1)
        ph = np.cumsum(2 * np.pi * rate / SR) + c * 1.3
        jit = smooth_ctrl(tt, 5, .5, 1)
        am = (np.maximum(0, np.sin(ph)) ** 6) * jit
        body = bp(white(n), 120, 900) * am * 1.2
        crisp = bp(white(n), 900, 6000) * am ** 1.5 * .7
        whoosh = bp(white(n), 150, 2500) * (.18 + .1 * smooth_ctrl(tt, .5, 0, 1))
        y = body + crisp + whoosh
        out.append(y)
    return np.stack(out)


def rain_sea(n):
    """rain on open water: bright hiss plus a dense field of tiny bubble plinks"""
    out = []
    for c in range(2):
        def fn(f, tt):
            m = .85 + .15 * smooth_ctrl(tt, .4, 0, 1)
            return m * (np.exp(-((np.log(f + 1) - np.log(4500)) / .8) ** 2) + .25 / np.sqrt(1 + (f / 600) ** 2) * (f > 80))
        y = shaped(n, fn)
        y /= np.sqrt(np.mean(y ** 2))
        pl = np.zeros(n)
        cnt = int(n / SR * 260)
        L = N(.02)
        for _ in range(cnt):
            i0 = rng.integers(0, n - L)
            f0 = rng.uniform(1200, 4200)
            th = np.cumsum(2 * np.pi * f0 * np.linspace(1, 1.35, L) / SR)
            pl[i0:i0 + L] += np.sin(th) * np.exp(-t_of(L) / rng.uniform(.003, .008)) * rng.uniform(.2, 1) ** 2
        out.append(y + pl * 1.6)
    return np.stack(out)


def rain_deck(n):
    """rain on deck planks and canvas: woody ticks, soft canvas thuds, gutter trickle"""
    out = []
    for c in range(2):
        y = np.zeros(n)
        cnt = int(n / SR * 140)
        for _ in range(cnt):
            L = N(.05)
            i0 = rng.integers(0, n - L)
            imp = np.zeros(L)
            imp[0] = 1
            imp[1] = -.6
            fr = rng.choice([780, 1150, 1700, 2400]) * rng.uniform(.9, 1.1)
            s = reson(imp, fr, rng.uniform(4, 9)) + .4 * reson(imp, fr * 2.3, 6)
            y[i0:i0 + L] += s * rng.uniform(.15, 1) ** 2 * 3
        cnt = int(n / SR * 45)
        for _ in range(cnt):
            L = N(.09)
            i0 = rng.integers(0, n - L)
            y[i0:i0 + L] += lp(white(L), 420) * env_ad(L, .002, .02) * rng.uniform(.3, 1) * 1.2
        trickle = bp(white(n), 900, 3800) * (.25 + .1 * smooth_ctrl(t_of(n), 2, 0, 1)) * .4
        out.append(y + trickle)
    return np.stack(out)


def snow(n):
    """snow: a muffled hush"""
    out = []
    for c in range(2):
        def fn(f, tt):
            m = .7 + .3 * smooth_ctrl(tt, .15, 0, 1)
            return m / np.sqrt(1 + (f / 420) ** 4) * (f > 40) + .03 * m * np.exp(-((f - 5200) / 2500) ** 2)
        out.append(shaped(n, fn))
    return np.stack(out)


# ---------------------------------------------------------------- one-shots

def creak(dur, p0, p1, res, q=14, jit=.25, gain=1.0):
    """stick-slip friction: an accelerating/decelerating impulse train exciting wood modes"""
    n = N(dur)
    tt = t_of(n)
    per = np.interp(tt, [0, dur * .35, dur], [p0, p1, p0 * 1.15]) / 1000
    x = np.zeros(n)
    t = 0.0
    while t < dur - .01:
        i = N(t)
        x[i] += rng.uniform(.4, 1)
        t += per[min(i, n - 1)] * (1 + rng.uniform(-jit, jit))
    y = sum(reson(x, f * rng.uniform(.97, 1.03), q) * w for f, w in res)
    e = np.sin(np.pi * np.clip(tt / dur, 0, 1)) ** .6
    return y * e * gain


def clink(seed_f):
    n = N(1.0)
    y = np.zeros(n)
    for hit, (dt, g) in enumerate([(0, 1), (rng.uniform(.06, .11), .45)]):
        i0 = N(dt)
        L = n - i0
        tt = t_of(L)
        for r, d, a in [(1, .32, 1), (1.47, .25, .6), (2.09, .16, .5), (2.83, .1, .35), (3.9, .07, .25)]:
            f = seed_f * r * rng.uniform(.995, 1.005)
            y[i0:] += g * a * np.sin(2 * np.pi * f * tt + rng.uniform(0, 6)) * np.exp(-tt / d)
        y[i0:i0 + N(.002)] += g * white(N(.002)) * .6
    return y


def bell():
    n = N(7.0)
    y = np.zeros(n)
    f0 = 512
    for k, dt in enumerate([0, .62]):
        i0 = N(dt)
        L = n - i0
        tt = t_of(L)
        g = 1 if k == 0 else .82
        for r, d, a in [(.5, 4.2, .5), (1, 3.2, 1), (1.19, 2.3, .55), (1.5, 1.9, .35), (2, 1.6, .55), (2.52, 1.0, .3), (2.66, .9, .25), (3.01, .7, .2), (4.07, .45, .15), (5.2, .25, .1)]:
            f = f0 * r
            beat = 1 + .04 * np.sin(2 * np.pi * rng.uniform(.6, 2.2) * tt)
            y[i0:] += g * a * np.sin(2 * np.pi * f * tt + rng.uniform(0, 6)) * np.exp(-tt / d) * beat
        y[i0:i0 + N(.004)] += g * hp(white(N(.004)), 2000) * .8
    return reverb(y, 2.2, 5000, .25)


def harmonic(f0, amps, n, jitter=.004):
    ph = np.cumsum(2 * np.pi * f0 * (1 + jitter * white(n).cumsum() / np.sqrt(np.arange(1, n + 1))) / SR)
    y = np.zeros(n)
    for k, a in enumerate(amps, 1):
        y += a(f0 * k) * np.sin(k * ph) if callable(a) else a * np.sin(k * ph)
    return y


def gull_syl(dur, contour, rough=.25, bright=1.0):
    n = N(dur)
    tt = np.linspace(0, 1, n)
    f0 = np.interp(tt, np.linspace(0, 1, len(contour)), contour)
    form = lambda f: (np.exp(-((f - 2700) / 1100) ** 2) + .55 * np.exp(-((f - 1300) / 500) ** 2) + .25 * np.exp(-((f - 4300) / 900) ** 2)) * (f < 9000)
    ph = np.cumsum(2 * np.pi * f0 / SR)
    y = np.zeros(n)
    for k in range(1, 8):
        y += form(f0 * k) * np.sin(k * ph) * (bright if k > 2 else 1)
    y *= 1 + rough * np.sin(ph * .5)  # subharmonic grit
    y += bp(white(n), 1800, 4200) * .08
    e = np.minimum(1, tt / .08) * np.minimum(1, (1 - tt) / .25) ** 1.2
    return y * e


def gull(kind):
    parts = []
    if kind == 0:  # single "kyow"
        parts = [(0, gull_syl(.42, [1050, 1700, 1850, 1500, 1150], .3))]
    elif kind == 1:  # laughing series
        t = 0
        for i in range(6):
            d = rng.uniform(.13, .18)
            parts.append((t, gull_syl(d, [1300, 1650, 1450], .35) * (1 - i * .09)))
            t += d + rng.uniform(.06, .1)
    else:  # long call
        parts = [(0, gull_syl(.75, [1100, 1900, 2050, 1900, 1400], .2, 1.2)), (.9, gull_syl(.28, [1250, 1700, 1300], .3)), (1.3, gull_syl(.26, [1250, 1650, 1250], .3) * .8)]
    L = max(N(t0) + len(s) for t0, s in parts) + N(.1)
    y = np.zeros(L)
    for t0, s in parts:
        y[N(t0):N(t0) + len(s)] += s
    return reverb(y, 1.2, 6000, .18)


def dolphin_clicks():
    n = N(1.6)
    y = np.zeros(n)
    t = .02
    iv = .045
    while t < 1.45:
        i = N(t)
        L = N(.0012)
        f = rng.uniform(5500, 8500)
        y[i:i + L] += np.sin(2 * np.pi * f * t_of(L)) * np.exp(-t_of(L) / .00025) * rng.uniform(.6, 1)
        t += iv * rng.uniform(.85, 1.15)
        iv = max(.006, iv * (.93 if t < 1.0 else 1.08))
    y = hp(y, 2500)
    return reverb(y, .5, 7000, .25)


def dolphin_whistle(kind):
    dur = [.9, 1.25][kind]
    n = N(dur)
    tt = np.linspace(0, 1, n)
    c = [[5200, 9800, 7200, 11200, 8000], [6400, 4800, 8800, 6000, 9600, 12000]][kind]
    f0 = np.interp(tt, np.linspace(0, 1, len(c)), c) * (1 + .015 * np.sin(2 * np.pi * 14 * tt * dur))
    ph = np.cumsum(2 * np.pi * f0 / SR)
    y = np.sin(ph) + .12 * np.sin(2 * ph)
    e = np.minimum(1, tt / .06) * np.minimum(1, (1 - tt) / .12)
    return reverb(y * e, .6, 9000, .3)


def splash(dur, lo, hi, att, dec, drops=0, thump=0.0, tf=110):
    n = N(dur)
    y = bp(white(n), lo, hi) * env_ad(n, att, dec)
    if thump:
        L = N(.25)
        y[:L] += thump * np.sin(2 * np.pi * tf * t_of(L) * np.linspace(1, .6, L)) * np.exp(-t_of(L) / .06)
    for _ in range(drops):
        i0 = rng.integers(N(.05), n - N(.03))
        L = N(.03)
        f = rng.uniform(900, 3500)
        th = np.cumsum(2 * np.pi * f * np.linspace(1, 1.5, L) / SR)
        y[i0:i0 + L] += np.sin(th) * np.exp(-t_of(L) / .006) * rng.uniform(.1, .45) * np.exp(-i0 / n * 2)
    return y


def dolphin_exit():
    y = splash(.6, 700, 7000, .015, .12, drops=10)
    return reverb(y, .4, 6000, .15)


def dolphin_entry():
    y = splash(1.0, 350, 4500, .006, .16, drops=22, thump=.9, tf=140)
    n = len(y)
    for _ in range(5):
        i0 = rng.integers(N(.03), N(.25))
        L = N(.05)
        th = np.cumsum(2 * np.pi * np.linspace(rng.uniform(400, 700), rng.uniform(900, 1600), L) / SR)
        y[i0:i0 + L] += np.sin(th) * np.exp(-t_of(L) / .015) * .35
    return reverb(y, .5, 6000, .15)


def whale_blow():
    n = N(3.6)
    tt = t_of(n)
    ex = np.where(tt < .07, tt / .07, np.where(tt < .75, 1 - .25 * (tt - .07) / .68, .75 * np.exp(-(tt - .75) / .35)))
    def fn(f, t2):
        e = np.interp(t2, tt, ex)
        return e * (1 / np.sqrt(1 + (f / 1600) ** 2) * (f > 70) + .9 * np.exp(-((f - 380) / 160) ** 2) + .4 * np.exp(-((f - 950) / 300) ** 2))
    y = shaped(n, fn)
    y = y * np.interp(tt, [0, .03, 1], [0, 1, 1])
    hiss = hp(white(n), 3500) * np.exp(-np.maximum(0, tt - .2) / .5) * (tt > .05) * .25
    i0 = N(2.0)
    L = N(1.1)
    inh = bp(white(L), 300, 2200) * np.sin(np.pi * np.linspace(0, 1, L)) ** 1.5 * .32
    y[i0:i0 + L] += inh
    return reverb(y + hiss, 1.6, 2500, .25)


def whale_slap():
    n = N(3.8)
    y = np.zeros(n)
    L = N(.6)
    tt = t_of(L)
    y[:L] += 1.4 * np.sin(2 * np.pi * 62 * tt * np.linspace(1, .7, L)) * np.exp(-tt / .14)
    y[:N(.008)] += white(N(.008)) * 1.2
    y += splash(3.8, 250, 6000, .004, .32, drops=60) * 1.1
    tail = bp(white(n), 1500, 7000) * np.exp(-np.maximum(0, t_of(n) - .5) / .6) * (t_of(n) > .35) * .2
    return reverb(y + tail, 2.0, 3000, .3)


def whale_song(kind):
    dur = 15.0
    n = N(dur)
    y = np.zeros(n)
    units = [[(0.3, 2.4, [120, 165, 150, 110]), (3.4, 1.4, [210, 480, 520]), (5.6, 2.8, [95, 88, 140, 100]), (9.2, .9, [300, 260]), (10.4, .9, [310, 250]), (11.8, 2.4, [180, 230, 170, 120])],
             [(0.2, 3.0, [85, 130, 125, 90]), (3.8, 1.1, [380, 640, 700, 520]), (5.4, 2.2, [160, 140, 220]), (8.3, 3.2, [110, 170, 190, 140, 105]), (12.2, 1.6, [260, 420, 300])]][kind]
    for (t0, d, c) in units:
        L = N(d)
        u = np.linspace(0, 1, L)
        f0 = np.interp(u, np.linspace(0, 1, len(c)), c) * (1 + .012 * np.sin(2 * np.pi * 5.5 * u * d))
        form = lambda f: np.exp(-((f - 420) / 300) ** 2) + .6 * np.exp(-((f - 1100) / 400) ** 2) + .25
        ph = np.cumsum(2 * np.pi * f0 / SR)
        s = sum(form(f0 * k) / k ** .6 * np.sin(k * ph) for k in range(1, 9))
        if c[0] < 100:
            s *= 1 + .5 * np.sin(2 * np.pi * 28 * u * d)
        e = np.sin(np.pi * u) ** .8
        i0 = N(t0)
        y[i0:i0 + L] += s * e
    y = lp(y, 1600)
    y = reverb(y, 4.5, 1200, .55)
    return y


def hail_water(k):
    n = N(.35)
    y = np.zeros(n)
    L = N(.04)
    f = [2600, 3300][k] * rng.uniform(.95, 1.05)
    th = np.cumsum(2 * np.pi * f * np.linspace(1, 1.6, L) / SR)
    y[N(.004):N(.004) + L] += np.sin(th) * np.exp(-t_of(L) / .008) * .9
    y += splash(.35, 1200, 9000, .001, .03) * .7
    y[:N(.002)] += white(N(.002)) * .5
    return y


def hail_wood(k):
    n = N(.6)
    y = np.zeros(n)
    hits = [(0, 1)] + ([(.13, .45), (.21, .18)] if k == 0 else [(.1, .38), (.17, .2), (.215, .08)])
    for t0, g in hits:
        i0 = N(t0)
        L = N(.08)
        imp = np.zeros(L)
        imp[0] = 1
        imp[1] = -.8
        s = reson(imp, 2100 * rng.uniform(.95, 1.05), 9) + .7 * reson(imp, 3500, 12) + .5 * reson(imp, 720, 5)
        y[i0:i0 + L] += s * g
    return y


def thunder(k):
    dur = [13.0, 15.0][k]
    n = N(dur)
    tt = t_of(n)
    env = np.zeros(n)
    t = rng.uniform(.0, .3)
    big = 1.0
    while t < dur * .8:
        i0 = N(t)
        L = n - i0
        a = rng.uniform(.03, .2)
        d = rng.uniform(.6, 2.4)
        env[i0:] += big * rng.uniform(.4, 1) * env_ad(L, a, d)
        t += rng.uniform(.25, 1.6)
        big *= rng.uniform(.75, .98)
    env *= np.minimum(1, tt / .12) * np.exp(-tt / (dur * .45))
    def fn(f, t2):
        e = np.interp(t2, tt, env)
        fc = 120 + 380 * np.exp(-t2 / 2.5)
        return e / np.sqrt(1 + (f / fc) ** 3) * (f > 18)
    y = shaped(n, fn, 4096)
    y += np.concatenate([np.zeros(N(.9)), y[:-N(.9)]]) * .35
    return reverb(y, 3.0, 600, .35)


def flap(k):
    n = N(.9)
    y = np.zeros(n)
    hits = [(0, 1), (.075, .55), (.14, .35), (.2, .18)] if k == 0 else [(0, .8), (.06, 1), (.13, .5), (.19, .3), (.26, .15)]
    for t0, g in hits:
        i0 = N(t0)
        L = N(.12)
        s = bp(white(L), 120, 2400) * env_ad(L, .002, .025) + hp(white(L), 2400) * env_ad(L, .001, .008) * .5
        s[:N(.06)] += np.sin(2 * np.pi * 95 * t_of(N(.06))) * np.exp(-t_of(N(.06)) / .02) * .6
        y[i0:i0 + L] += s * g
    return y


# ---------------------------------------------------------------- catalogue

LOOP = {"zBed": 20.0, "zWnd": 16.0, "zSrf": 14.0, "zLap": 13.0, "zLuf": 10.0, "zRnS": 12.0, "zRnD": 12.0, "zSnw": 14.0}
LOOPFN = {"zBed": (bed, -18), "zWnd": (wind, -20), "zSrf": (surf, -20), "zLap": (lap, -21), "zLuf": (luff, -21), "zRnS": (rain_sea, -20), "zRnD": (rain_deck, -21), "zSnw": (snow, -22)}

SHOT = {
    "zCr1": lambda: creak(.75, 9, 6, [(560, 1), (1250, .6), (2300, .3)], 16),
    "zCr2": lambda: creak(1.6, 34, 20, [(140, 1), (310, .8), (640, .4)], 10, .35),
    "zCr3": lambda: creak(1.0, 14, 8, [(420, 1), (980, .7), (1700, .35)], 14, .3),
    "zClk1": lambda: clink(2350),
    "zClk2": lambda: clink(2900),
    "zBel": bell,
    "zGl1": lambda: gull(0),
    "zGl2": lambda: gull(1),
    "zGl3": lambda: gull(2),
    "zDcl": dolphin_clicks,
    "zDw1": lambda: dolphin_whistle(0),
    "zDw2": lambda: dolphin_whistle(1),
    "zDex": dolphin_exit,
    "zDen": dolphin_entry,
    "zWbl": whale_blow,
    "zWsl": whale_slap,
    "zWs1": lambda: whale_song(0),
    "zWs2": lambda: whale_song(1),
    "zHw1": lambda: hail_water(0),
    "zHw2": lambda: hail_water(1),
    "zHd1": lambda: hail_wood(0),
    "zHd2": lambda: hail_wood(1),
    "zTh1": lambda: thunder(0),
    "zTh2": lambda: thunder(1),
    "zFl1": lambda: flap(0),
    "zFl2": lambda: flap(1),
}


def write_wav(path, y):
    y = np.atleast_2d(y)
    pcm = (np.clip(y, -1, 1) * 32767).astype("<i2").T.copy()
    with wave.open(path, "wb") as w:
        w.setnchannels(y.shape[0])
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


def encode(key, y, br):
    with tempfile.TemporaryDirectory() as d:
        wp, mp = os.path.join(d, "a.wav"), os.path.join(d, "a.mp3")
        write_wav(wp, y)
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", wp, "-codec:a", "libmp3lame", "-b:a", br, "-map_metadata", "-1", "-id3v2_version", "0", "-write_xing", "1", mp], check=True)
        data = open(mp, "rb").read()
    h = hashlib.sha256(data).hexdigest()[:10]
    for fn in os.listdir(ADIR):
        if fn.split(".")[0] == key:
            os.remove(os.path.join(ADIR, fn))
    with open(os.path.join(ADIR, f"{key}.{h}.mp3"), "wb") as f:
        f.write(data)
    return f"{key}.{h}.mp3", len(data)


def seed(key):
    global rng
    rng = np.random.default_rng(int(hashlib.sha256(key.encode()).hexdigest()[:8], 16))


def main():
    only = set(sys.argv[1:])
    rep = []
    for k, T in LOOP.items():
        if only and k not in only:
            continue
        fn, db = LOOPFN[k]
        seed(k)
        y = make_loop(fn, T)
        y = norm_rms(y, db)
        rep.append((k,) + encode(k, y, "112k"))
    for k, fn in SHOT.items():
        if only and k not in only:
            continue
        seed(k)
        y = fade(norm_peak(fn(), -1.5))
        rep.append((k,) + encode(k, y[0], "80k"))
    for k, f, s in rep:
        print(f"{f:28s} {s/1024:7.1f} KB")
    print(json.dumps(LOOP))


if __name__ == "__main__":
    main()
