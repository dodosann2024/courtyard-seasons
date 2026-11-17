#!/usr/bin/env python3
"""Build the desert oasis sound set into assets/audio from CC0 field recordings.

Every source is a Freesound upload released under CC0 1.0 (public domain dedication); see SOURCES
below and docs/desert-audio.md. The script downloads each source's HQ preview once into a cache,
cuts the calls / loop sections, cleans them (rumble high-pass, gentle de-click fades, level matching)
and stores them as assets/audio/<key>.<sha10>.mp3 like the rest of the audio. Loops carry 0.5 s of
periodic padding on both ends (loop at [0.5, 0.5 + LOOP[key]]), the same layout tools/seasynth.py uses.

The snake's rustle is granular resynthesis of a real sand recording: short grains of sand movement
are overlapped at random into a continuous texture, so the game can follow the snake's speed with gain
and playback rate without an audible loop.

Requires numpy, scipy and ffmpeg (libmp3lame). Run once after changing a recipe, then tools/build.py.
"""
import hashlib, json, os, subprocess, sys, tempfile, urllib.request, wave
import numpy as np
from scipy import signal
from scipy.ndimage import binary_dilation, median_filter
from scipy.signal import welch

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ADIR = os.path.join(ROOT, "assets", "audio")
CACHE = os.environ.get("DESERT_AUDIO_CACHE", "/tmp/desert-audio-src")
SR = 44100
PAD = 0.5

# freesound id: (author, title, preview url)
SOURCES = {
    479610: ("craigsmith", "R30-34-Red Tailed Hawk.wav", "https://cdn.freesound.org/previews/479/479610_2524442-hq.mp3"),
    875513: ("loganzsound", "Red Tailed Hawk Cries", "https://cdn.freesound.org/previews/875/875513_16682330-hq.mp3"),
    685761: ("jlseagull", "Camel.mp3", "https://cdn.freesound.org/previews/685/685761_2892555-hq.mp3"),
    437937: ("craigsmith", "G12-05-Camel Grunt.wav", "https://cdn.freesound.org/previews/437/437937_2524442-hq.mp3"),
    645305: ("DarkShroom", "desert_wind.wav", "https://cdn.freesound.org/previews/645/645305_3139426-hq.mp3"),
    697217: ("dhallcomposer", "Looping Gentle Wind Ambience on an Open Desert Plain.wav", "https://cdn.freesound.org/previews/697/697217_7678208-hq.mp3"),
    825860: ("Vrymaa", "Desert sand - Dune atmosphere", "https://cdn.freesound.org/previews/825/825860_13973196-hq.mp3"),
    363092: ("TheWoodlandNomad", "Fire Crackle and Flames 002", "https://cdn.freesound.org/previews/363/363092_6612464-hq.mp3"),
    851733: ("IENBA", "Thick Sand Movements", "https://cdn.freesound.org/previews/851/851733_9616576-hq.mp3"),
    # oasis insects and frogs (only around the water; see docs/desert-audio.md)
    166176: ("felix.blume", "Cricket in the desert (close recording)", "https://cdn.freesound.org/previews/166/166176_1661766-hq.mp3"),
    583074: ("Breviceps", "Cricket chirping", "https://cdn.freesound.org/previews/583/583074_9159316-hq.mp3"),
    513978: ("remmert", "Pool Frogs with birds (Pelophylax Lessonae)", "https://cdn.freesound.org/previews/513/513978_11272383-hq.mp3"),
    447319: ("antoineopeng", "Dragonfly.wav", "https://cdn.freesound.org/previews/447/447319_6400805-hq.mp3"),
    570203: ("RatBird", "Dragonfly Flying By.wav", "https://cdn.freesound.org/previews/570/570203_12508711-hq.mp3"),
    573935: ("TRP", "Grasshopper wing clicks snaps hot BADLANDS AB 190818.flac", "https://cdn.freesound.org/previews/573/573935_97550-hq.mp3"),
    # weather: Sonoran monsoon rain and thunder, rain on tent cloth, mountain and distant thunder, sandstorm
    866246: ("Fhmediahmo", "Lluvia y Truenos Monzon Hermosillo", "https://cdn.freesound.org/previews/866/866246_2797317-hq.mp3"),
    484723: ("Breviceps", "Rain on tent", "https://cdn.freesound.org/previews/484/484723_9159316-hq.mp3"),
    476231: ("felix.blume", "Thunders and sheperd in the mountain Las Narices", "https://cdn.freesound.org/previews/476/476231_1661766-hq.mp3"),
    347562: ("mikala_oidua", "Distant Thunder Clap_Gentle.wav", "https://cdn.freesound.org/previews/347/347562_5481182-hq.mp3"),
    632771: ("gbayles", "Sandstorm Looping", "https://cdn.freesound.org/previews/632/632771_4537135-hq.mp3"),
    438877: ("craigsmith", "G56-22-Sandstorm.wav", "https://cdn.freesound.org/previews/438/438877_2524442-hq.mp3"),
    # rattlesnake (in development behind ?rs=1)
    437958: ("craigsmith", "G12-26-Rattlesnake Rattle.wav", "https://cdn.freesound.org/previews/437/437958_2524442-hq.mp3"),
}

# one-shots: key -> (source, start s, end s, high-pass Hz, fade-in s, fade-out s[, low-pass Hz])
SHOT = {
    # single pops of the campfire's wood, cut from the crackle recording (each comes with a burst of sparks)
    "dPop1": (363092, 20.71, 20.96, 300, .002, .1),
    "dPop2": (363092, 3.66, 3.90, 300, .002, .1),
    "dPop3": (363092, 11.33, 11.57, 300, .002, .1),
    "dEg1": (479610, 2.55, 4.50, 700, .01, .25),
    "dEg2": (479610, 7.50, 9.35, 700, .01, .25),
    "dEg3": (479610, 11.85, 13.75, 700, .01, .25),
    "dEg4": (875513, 0.00, 0.95, 700, .005, .15),
    "dEg5": (875513, 4.70, 5.65, 700, .005, .15),
    "dCm1": (685761, 11.95, 15.95, 60, .06, .35),
    "dCm2": (685761, 17.75, 19.95, 60, .05, .3),
    "dCm3": (437937, 3.75, 7.40, 60, .08, .45),
    "dCm4": (437937, 13.25, 16.70, 60, .08, .45),
    "dCm5": (685761, 3.85, 7.40, 60, .06, .4),
    # oasis: single desert-cricket calls, field-cricket chirp bouts, water-frog croaks (low-passed under the birds
    # in the recording), dragonfly wing passes and grasshopper wing snaps
    "dOk1": (166176, 2.74, 3.82, 1500, .01, .08),
    "dOk2": (166176, 7.45, 8.37, 1500, .01, .08),
    "dOk3": (166176, 10.76, 11.79, 1500, .01, .08),
    "dOk4": (166176, 18.24, 19.37, 1500, .01, .08),
    "dOc1": (583074, 26.10, 34.45, 3000, .02, .2),
    "dOc2": (583074, 53.76, 60.70, 3000, .02, .2),
    "dOc3": (583074, 35.43, 37.15, 3000, .02, .1),
    "dFr1": (513978, 3.83, 4.40, 150, .01, .08, 2800),
    "dFr2": (513978, 5.64, 6.30, 150, .01, .1, 2800),
    "dFr3": (513978, 10.55, 11.05, 150, .01, .08, 2800),
    "dFr4": (513978, 181.61, 182.90, 150, .01, .12, 2800),
    "dFr5": (513978, 184.02, 185.07, 150, .01, .12, 2800),
    "dFr6": (513978, 192.10, 192.75, 150, .01, .1, 2800),
    "dDf1": (447319, 1.80, 2.95, 300, .05, .15, 9000),
    "dDf2": (447319, 20.50, 21.65, 300, .05, .15, 9000),
    "dDf3": (570203, 0.00, 1.95, 300, .05, .2, 9000),
    "dGh1": (573935, 3.65, 4.95, 2000, .03, .15),
    "dGh2": (573935, 9.88, 11.80, 2000, .03, .2),
    # thunder: a close crack with its long roll (monsoon), two more monsoon claps, a mountain roll, a gentle distant clap
    "dTh1": (866246, 47.0, 63.0, 22, .01, 2.5),
    "dTh2": (866246, 640.2, 652.0, 22, .01, 2.5),
    "dTh3": (866246, 730.6, 743.0, 22, .01, 2.5),
    "dTh4": (476231, 10.0, 26.0, 22, .2, 2.5),
    "dTh5": (347562, 0.0, 18.4, 22, .05, 2.5),
    # rattle: a few warning buzzes rising into the full rattle
    "dRtlOn": (437958, 7.5, 12.5, 300, .01, .6),
}
# loops: key -> (source, start s, length s, high-pass Hz, target rms dB, stereo[, steady])
# steady: a rain bed. The recordings drop out for a few milliseconds here and there (dense rain never does) and swell
# under gusts; repeated every loop both are heard as the rain stuttering, so they are filled and levelled (see steady()).
LOOPS = {
    "dWnd": (645305, 1.0, 22.0, 40, -20, True),
    "dCalm": (697217, 0.5, 36.0, 30, -22, True),
    "dSnd": (825860, 0.5, 20.0, 250, -22, True),
    "dFire": (363092, 0.5, 19.0, 90, -20, True),
    "dRn": (866246, 19.0, 22.0, 120, -20, True, True),
    "dRt": (484723, 30.0, 22.0, 150, -20, True, True),
    # second and third rain beds and a second tent bed, other stretches of the same recordings (the last a lighter, sparser
    # rain), mono: lengths 22, 17 and 13 s share no factor, so the three together only line up again after 81 minutes
    "dRn2": (866246, 2.0, 13.0, 120, -20, False, True),
    "dRn3": (866246, 705.0, 17.0, 120, -20, False, True),
    "dRt2": (484723, 58.0, 17.0, 150, -20, False, True),
    "dStm": (632771, 20.0, 30.0, 30, -18, True),
    "dStS": (438877, 3.0, 30.0, 200, -20, True),
    "dRtl": (437958, 14.0, 12.0, 300, -20, False),
}
GRAIN = {"dSnk": (851733, 8.0, -20)}


def fetch(fid):
    os.makedirs(CACHE, exist_ok=True)
    p = os.path.join(CACHE, f"fs{fid}.mp3")
    if not os.path.exists(p):
        req = urllib.request.Request(SOURCES[fid][2], headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req) as r, open(p, "wb") as f:
            f.write(r.read())
    return p


def load(fid, a=0.0, d=None, ch=2):
    args = ["ffmpeg", "-v", "error", "-ss", str(a)] + (["-t", str(d)] if d else []) + ["-i", fetch(fid), "-ac", str(ch), "-ar", str(SR), "-f", "f32le", "-"]
    x = np.frombuffer(subprocess.run(args, capture_output=True, check=True).stdout, np.float32).astype(np.float64)
    return x.reshape(-1, ch).T


def hp(x, f):
    return signal.sosfiltfilt(signal.butter(2, f / (SR / 2), "highpass", output="sos"), x, axis=-1)


def lp(x, f):
    return signal.sosfiltfilt(signal.butter(4, f / (SR / 2), "lowpass", output="sos"), x, axis=-1)


def N(s):
    return int(round(s * SR))


def fade(y, a, b):
    y = y.copy()
    na, nb = N(a), N(b)
    if na:
        y[..., :na] *= np.sin(np.linspace(0, np.pi / 2, na)) ** 2
    if nb:
        y[..., -nb:] *= np.cos(np.linspace(0, np.pi / 2, nb)) ** 2
    return y


def rms_db(y):
    return 20 * np.log10(np.sqrt(np.mean(y ** 2)) + 1e-12)


def norm_rms(y, db, ceil=-1.0):
    y = y * 10 ** ((db - rms_db(y)) / 20)
    c = 10 ** (ceil / 20)
    m = np.max(np.abs(y))
    return y if m <= c else np.tanh(y / c) * c


def norm_peak(y, db):
    return y / (np.max(np.abs(y)) + 1e-12) * 10 ** (db / 20)


def env_db(m, h):
    n = len(m) // h
    return 20 * np.log10(np.sqrt(np.mean(m[:n * h].reshape(n, h) ** 2, 1)) + 1e-9)


def matched_noise(y, a0, b0, ok, rng, ctx=0.2):
    """noise with the spectrum and level of the clean bed either side of [a0, b0), one independent stream per channel"""
    L = b0 - a0
    for c in (ctx, .5, 1.0):
        idx = np.r_[max(0, a0 - N(c)):a0, b0:min(y.shape[1], b0 + N(c))]
        idx = idx[ok[idx]]
        if len(idx) >= N(.08):
            break
    seg = y[:, idx]
    f, P = welch(seg, fs=SR, nperseg=512, axis=-1)
    M = 1 << int(np.ceil(np.log2(L + 1024)))
    fr = np.fft.rfftfreq(M, 1 / SR)
    S = np.fft.rfft(rng.standard_normal((y.shape[0], M)), axis=1)
    z = np.fft.irfft(S * np.sqrt(np.stack([np.interp(fr, f, P[ch]) for ch in range(y.shape[0])])), n=M, axis=1)[:, :L]
    return z * np.sqrt(np.mean(seg ** 2, 1) / (np.mean(z ** 2, 1) + 1e-20))[:, None]


def steady(y, gap_db=9.0, swell_db=2.5, seed=5):
    """fill micro-dropouts and level swells in a rain bed.
    A 5 ms block more than gap_db under the running (400 ms median) level, widened by 10 ms each side, is replaced by noise
    matched to the spectrum and level of the clean bed around it, with 4 ms equal-power crossfades: nothing is copied from
    elsewhere in the bed, so a fill can never be heard again as an echo or a flam. Then the 250 ms level is ridden down
    wherever it stands more than swell_db over the bed's median, with a gain smoothed over 0.6 s so single drops keep their
    attack."""
    y = y.copy()
    h, xf, rng = N(.005), N(.004), np.random.default_rng(seed)
    e = env_db(y.mean(0), h)
    bad = binary_dilation(e < median_filter(e, size=81, mode="nearest") - gap_db, iterations=2)
    ok = np.ones(y.shape[1], bool)
    ok[:len(bad) * h] = ~np.repeat(bad, h)
    d = np.diff(np.concatenate([[0], bad.astype(np.int8), [0]]))
    filled, spans = 0, []
    for a, b in zip(np.where(d == 1)[0] * h, np.where(d == -1)[0] * h):
        a0, b0 = max(0, a - xf), min(y.shape[1], b + xf)
        t = np.ones(b0 - a0)
        r = np.arange(xf) / xf
        t[:xf], t[-xf:] = np.sin(r * np.pi / 2), np.cos(r * np.pi / 2)
        y[:, a0:b0] = y[:, a0:b0] * np.sqrt(1 - t ** 2) + matched_noise(y, a0, b0, ok, rng) * t
        filled += b - a
        spans.append((a0, b0))
    rep, m = 0.0, signal.sosfilt(signal.butter(4, 1000, "high", fs=SR, output="sos"), y.mean(0))
    for a0, b0 in spans:
        s = m[a0:b0]
        w = m[max(0, a0 - N(.6)):min(y.shape[1], b0 + N(.6))]
        if len(s) < 8 or len(w) <= len(s):
            continue
        cc = np.correlate(w, s, "valid") / (np.sqrt(np.convolve(w ** 2, np.ones(len(s)), "valid")) * np.linalg.norm(s) + 1e-12)
        self_at = a0 - max(0, a0 - N(.6))
        cc[max(0, self_at - xf):self_at + xf + 1] = 0
        rep = max(rep, float(np.abs(cc).max()))
    print(f"  steady: repeat-likeness of the fills (best normalised correlation within 0.6 s) {rep:.2f}", file=sys.stderr)
    e = env_db(y.mean(0), N(.05))
    lv = np.convolve(10 ** (e / 10), np.ones(5) / 5, mode="same")
    lv = 10 * np.log10(lv + 1e-12)
    g = np.minimum(0.0, np.median(lv) + swell_db - lv)
    k = np.hanning(13)
    g = np.convolve(np.pad(g, 6, mode="edge"), k / k.sum(), mode="valid")
    gs = np.interp(np.arange(y.shape[1]), (np.arange(len(g)) + .5) * N(.05), g)
    print(f"  steady: filled {filled / SR * 1000:.0f} ms of dropouts, rode swells down by up to {-g.min():.1f} dB", file=sys.stderr)
    return y * 10 ** (gs / 20)


def periodic(y, T, X=1.5):
    """equal-power crossfade of the tail over the head, then 0.5 s periodic padding each side"""
    n, nx = N(T), N(X)
    a = y[:, :n].copy()
    fi = np.sin(np.linspace(0, np.pi / 2, nx)) ** 2
    a[:, :nx] = y[:, :nx] * np.sqrt(fi) + y[:, n:n + nx] * np.sqrt(1 - fi)
    p = N(PAD)
    return np.concatenate([a[:, -p:], a, a[:, :p]], axis=1)


def grains(fid, T, db, seed=7):
    """dense sand rustle: random 60–220 ms grains of the recording's louder passages, overlap-added"""
    src = load(fid, 0, None, 1)[0]
    src = hp(src, 500)
    h = N(.02)
    e = np.array([np.sqrt(np.mean(src[i:i + h] ** 2)) for i in range(0, len(src) - h, h)])
    good = np.where(e > np.percentile(e, 70))[0] * h
    rng = np.random.default_rng(seed)
    n = N(T + 2.0)
    out = np.zeros(n)
    t = 0
    while t < n - N(.25):
        L = N(rng.uniform(.06, .22))
        s = int(rng.choice(good))
        if s + L >= len(src):
            t += N(.01)
            continue
        g = src[s:s + L] * np.hanning(L) * rng.uniform(.5, 1.0)
        out[t:t + L] += g
        t += N(rng.uniform(.012, .05))
    out = hp(out, 400)
    y = periodic(out[None, :], T, X=1.0)
    return norm_rms(y, db)


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


def main():
    only = set(sys.argv[1:])
    rep, loop_len = [], {}
    for k, (fid, a, T, hpf, db, st, *sd) in LOOPS.items():
        loop_len[k] = T
        if only and k not in only:
            continue
        y = hp(load(fid, a, T + 2.0, 2 if st else 1), hpf)
        y = periodic(steady(y) if sd and sd[0] else y, T)
        rep.append((k,) + encode(k, norm_rms(y, db), "128k"))
    for k, (fid, T, db) in GRAIN.items():
        loop_len[k] = T
        if only and k not in only:
            continue
        rep.append((k,) + encode(k, grains(fid, T, db), "112k"))
    for k, (fid, a, b, hpf, fi, fo, *lpf) in SHOT.items():
        if only and k not in only:
            continue
        y = hp(load(fid, a, b - a, 1), hpf)
        y = fade(lp(y, lpf[0]) if lpf else y, fi, fo)
        rep.append((k,) + encode(k, norm_peak(y, -1.5)[0], "96k"))
    for k, f, s in rep:
        print(f"{f:28s} {s/1024:7.1f} KB")
    print(json.dumps(loop_len))


if __name__ == "__main__":
    main()
