#!/usr/bin/env python3
"""Erosion relief on the rack cross-bar, measured on the close-up shots (d167-proof.mjs, camera `bar`, 1280x720).

For every image column on the stretch from just right of the big knot to the right post (x 230..650 px, left of every
version's fork prongs), the bar is the longest vertical run of pixels that are neither sand (saturated orange) nor sky (blue). Over that run:
  std   luminance spread across the bar (light/dark contrast of crests and troughs)
  hp    RMS of luminance minus its own 15 px running mean across the bar (the groove-scale relief; the bar's broad shading drops out)
  dark  share of bar pixels darker than 0.6 x the column's median (deep trough shadow)
  lines number of separate dark troughs crossed per column (local minima 6 % below the 15 px mean)
Pooled over every bar pixel of those runs (sRGB 0..1):
  dark10RGB / dark10Lum  mean colour / luminance of the darkest 10 % (the groove bottoms: their hue and depth)
  ridgeP95               95th percentile luminance (the bleached crests)
Usage: python3 tools/e2e/d167-relief.py OUT/d164_R_bar_close_day.png OUT/main_R_bar_close_day.png ...   (prints JSON)
"""
import json, sys
import numpy as np
from PIL import Image

X0, X1 = 230, 650


def measure(path):
    a = np.asarray(Image.open(path).convert("RGB"), dtype=np.float32) / 255
    lum = a @ np.array([.2126, .7152, .0722], dtype=np.float32)
    sat = (a.max(2) - a.min(2)) / np.maximum(a.max(2), 1e-3)
    sand = (sat > .33) & (a[..., 0] > a[..., 2] + .1)
    sky = a[..., 2] > a[..., 0] + .02
    grey = ~sand & ~sky
    S = {"std": [], "hp": [], "dark": [], "lines": [], "h": []}
    px = []
    for x in range(X0, X1):
        col = grey[:, x]
        best, run, start = (0, 0), 0, 0
        for y, g in enumerate(col):
            if g:
                if run == 0:
                    start = y
                run += 1
                if run > best[1]:
                    best = (start, run)
            else:
                run = 0
        y0, n = best
        if n < 30:
            continue
        v = lum[y0 + 2:y0 + n - 2, x]
        k = np.ones(15) / 15
        m = np.convolve(np.pad(v, 7, mode="edge"), k, mode="valid")
        h = v - m
        med = np.median(v)
        mins = sum(1 for i in range(1, len(v) - 1) if v[i] <= v[i - 1] and v[i] <= v[i + 1] and v[i] < m[i] * .94)
        S["std"].append(float(v.std()))
        S["hp"].append(float(np.sqrt((h * h).mean())))
        S["dark"].append(float((v < .6 * med).mean()))
        S["lines"].append(mins)
        S["h"].append(n)
        px.append(a[y0 + 2:y0 + n - 2, x])
    P = np.concatenate(px)
    L = P @ np.array([.2126, .7152, .0722], dtype=np.float32)
    lo = P[L <= np.percentile(L, 10)]
    return {k: round(float(np.mean(v)), 4) for k, v in S.items()} | {"columns": len(S["std"]),
        "dark10RGB": [round(float(c), 4) for c in lo.mean(0)], "dark10Lum": round(float(L[L <= np.percentile(L, 10)].mean()), 4),
        "ridgeP95": round(float(np.percentile(L, 95)), 4)}


if __name__ == "__main__":
    print(json.dumps({p.rsplit("/", 1)[-1]: measure(p) for p in sys.argv[1:]}, indent=1, ensure_ascii=False))
