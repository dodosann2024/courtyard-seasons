#!/usr/bin/env python3
"""Collects the probe runs into review-stack/shots/mobile-fix: report.json and before/after phone screenshots."""
import json, os, subprocess, glob, statistics as st

OUT = "/agent/repos/courtyard-seasons/review-stack/shots/mobile-fix"
P = "/tmp/pw/out"
os.makedirs(OUT, exist_ok=True)
YARDS = ["def", "jp", "cn", "kr", "eu", "sea", "desert"]


def runs(path):
    rs = []
    for f in glob.glob(path):
        for l in open(f):
            if l.startswith("{"):
                r = json.loads(l)
                if "fail" not in r:
                    rs.append(r)
    return rs


def slim(r):
    g = r.get("gpu") or {}
    return {k: v for k, v in {
        "run": r["run"], "device": r.get("device"), "url": r.get("url"), "nonBlackRatio": r["nonBlack"], "meanLuma": r["meanLum"],
        "loadMs": r["loadMs"], "desertDone": r.get("desDone"), "contextLost": r["contextLost"], "webglContexts": r["contexts"],
        "fallbackCard": r.get("fallback"), "consoleErrors": r["errors"], "jsHeapMB": r["heapMB"],
        "gpuEstimateMB": {"total": g.get("totalMB"), "textures": g.get("texMB"), "geometry": g.get("geoMB"), "renderTargets": g.get("rtMB"),
                          "canvas": g.get("canvas")},
        "guard": g.get("guard"), "shot": r["shot"]}.items() if v is not None}


def summary(rs):
    if not rs:
        return None
    nb = [r["nonBlack"] for r in rs]
    heap = [r["heapMB"] for r in rs if r["heapMB"] is not None]
    gpu = [r["gpu"]["totalMB"] for r in rs if r.get("gpu")]
    return {"runs": len(rs), "blackRuns": sum(1 for r in rs if r["nonBlack"] < .9), "nonBlackMin": min(nb),
            "loadMsMedian": int(st.median(r["loadMs"] for r in rs)), "consoleErrors": sum(len(r["errors"]) for r in rs),
            "contextLost": sum(r["contextLost"] or 0 for r in rs), "jsHeapMBMedian": st.median(heap) if heap else None,
            "gpuEstimateMB": gpu[0] if gpu else None}


rep = {"what": "Cold loads of each yard on a phone viewport, before (main b0acc6a) and after (this branch).",
       "method": {
           "webkit": "Playwright 1.49.1 WebKit, iPhone 13 (390x844, DPR 3) unless noted; root URL with localStorage cyStyle=<yard> (the owner's path).",
           "chromium": "Playwright Chromium (SwiftShader), Pixel 7 (412x839, DPR 2.625), CPU throttled 4x via CDP.",
           "nonBlackRatio": "share of screenshot pixels with Rec.709 luma > 16 between 20% and 85% of the height (the scene area). "
                            "A black scene with the yard panel open (first-visit default) measures 0.679.",
           "loadMs": "navigation to: loading screen gone and, for the desert, window.__desProg().done (every model placed and drawn).",
           "gpuEstimateMB": "textures (compressed mip bytes, or w*h*4 with mips) + geometry buffers in the scene + render targets "
                            "(MSAA drawing buffer, composer ping-pong half-float x2, bloom chain). Shadow maps are not included; the "
                            "desert's on a phone go from 2048^2 to 1536^2 (about 32 MB to 18 MB with depth).",
           "jsHeapMB": "CDP Runtime.getHeapUsage after load (Chromium only; WebKit exposes no heap size). ArrayBuffer stores are "
                       "outside it, see memory.prefetch."},
       "yards": {}}

for y in YARDS:
    rep["yards"][y] = {}
    for eng in ["webkit", "chromium"]:
        b = runs(f"{P}/before-{eng}-{'desert' if y == 'desert' else 'yards'}.log")
        a = runs(f"{P}/after-{eng}-{'desert' if y == 'desert' else 'yards'}.log")
        b = [r for r in b if r["yard"] == y]
        a = [r for r in a if r["yard"] == y]
        rep["yards"][y][eng] = {"before": {"summary": summary(b), "runs": [slim(r) for r in b]},
                                "after": {"summary": summary(a), "runs": [slim(r) for r in a]}}

rep["desertExtra"] = {
    "iPhone 15 Pro (393x852, DPR 3), root": {"before": [slim(r) for r in runs(f"{P}/before-ip15.log")],
                                             "after": [slim(r) for r in runs(f"{P}/after-ip15.log")]},
    "iPhone 13, /desert/": {"after": [slim(r) for r in runs(f"{P}/after-path.log")]}}
for k, f in [("prefetch", "mem.json"), ("soak", "soak-after.json"), ("failurePaths", "fail/fail.json")]:
    try:
        rep.setdefault("memory" if k == "prefetch" else k, {})
        v = json.load(open(f"{P}/{f}"))
        if k == "prefetch":
            rep["memory"]["prefetch"] = v
        else:
            rep[k] = v
    except FileNotFoundError:
        pass
for k in ["perfCI", "ci"]:
    pass
json.dump(rep, open(f"{OUT}/report.json", "w"), indent=1, ensure_ascii=False)


def pair(b, a, out, w=390):
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", b, "-i", a, "-filter_complex",
                    f"[0]scale={w}:-2[l];[1]scale={w}:-2[r];[l]pad=iw+8:ih:0:0:white[lp];[lp][r]hstack", "-q:v", "4", out], check=True)


for y in YARDS:
    for eng in ["webkit", "chromium"]:
        lab = "desert" if y == "desert" else "yards"
        b, a = f"{P}/before/before-{lab}-{eng}-{y}-0.png", f"{P}/after/after-{lab}-{eng}-{y}-0.png"
        if os.path.exists(b) and os.path.exists(a):
            pair(b, a, f"{OUT}/{y}_{'iphone13_webkit' if eng == 'webkit' else 'pixel7_chromium'}_before_after.jpg")
b, a = f"{P}/before/before-ip15-webkit-desert-0.png", f"{P}/after/after-ip15-webkit-desert-0.png"
if os.path.exists(a):
    pair(b, a, f"{OUT}/desert_iphone15pro_webkit_before_after.jpg")
for f in glob.glob(f"{P}/fail/*.png"):
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", f, "-vf", "scale=390:-2", "-q:v", "4",
                    f"{OUT}/fallback_{os.path.basename(f)[:-4]}.jpg"], check=True)
print("ok", sorted(os.listdir(OUT)))
