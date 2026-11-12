#!/usr/bin/env python3
"""Build the static site from src/ into the repo root (served by GitHub Pages).

Outputs: index.html, {jp,cn,kr,eu,sea,desert}/index.html, sw.js and content-hashed files in assets/.
"""
import hashlib, json, os, re, shutil

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "src")
ASSETS = os.path.join(ROOT, "assets")
YARDS = ["def", "jp", "cn", "kr", "eu", "sea", "desert"]
NAMES = {"def": "默认小院", "jp": "日式庭院", "cn": "中式小院", "kr": "韩式小院", "eu": "欧式小院", "sea": "空中海洋", "desert": "沙漠绿洲"}
PREFETCH_AUDIO = ["loop", "pour", "clack", "fu"]
written = set()


def rd(p, mode="r"):
    with open(os.path.join(SRC, p), mode, **({} if "b" in mode else {"encoding": "utf-8"})) as f:
        return f.read()


def emit(rel_dir, stem, ext, data):
    if isinstance(data, str):
        data = data.encode("utf-8")
    h = hashlib.sha256(data).hexdigest()[:10]
    rel = f"assets/{rel_dir + '/' if rel_dir else ''}{stem}.{h}.{ext}"
    path = os.path.join(ROOT, rel)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    if not os.path.exists(path) or open(path, "rb").read() != data:
        with open(path, "wb") as f:
            f.write(data)
    written.add(os.path.normpath(path))
    return rel


def write(rel, text):
    path = os.path.join(ROOT, rel)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write(text)


def main():
    # Audio never changes, so the hashed files in assets/audio are the only copy.
    audio = {}
    adir = os.path.join(ASSETS, "audio")
    # keep Tripo GLBs and the models manifest; precache in service worker
    mdir=os.path.join(ASSETS,"models")
    models_core=[]
    if os.path.isdir(mdir):
        for fn in sorted(os.listdir(mdir)):
            written.add(os.path.normpath(os.path.join(mdir,fn)))
            if fn.endswith(".glb") or fn=="manifest.json":
                models_core.append(f"assets/models/{fn}")
    # self-hosted three + GLTFLoader for desert Tripo GLBs (no CDN)
    vendor_core=[]
    vsrc=os.path.join(SRC,"vendor")
    vdst=os.path.join(ASSETS,"vendor")
    if os.path.isdir(vsrc):
        os.makedirs(vdst,exist_ok=True)
        for fn in os.listdir(vsrc):
            sp,dp=os.path.join(vsrc,fn),os.path.join(vdst,fn)
            if os.path.isfile(sp):
                shutil.copy2(sp,dp)
                written.add(os.path.normpath(dp))
                if fn in ("des-gltf.js","GLTFLoader.js","three.module.min.js","SkeletonUtils.js"):
                    vendor_core.append(f"assets/vendor/{fn}")
    for fn in sorted(os.listdir(adir)):
        k, h, ext = fn.rsplit(".", 2)
        path = os.path.join(adir, fn)
        with open(path, "rb") as f:
            assert hashlib.sha256(f.read()).hexdigest()[:10] == h, fn
        written.add(os.path.normpath(path))
        audio[k] = f"assets/audio/{fn}"

    def audio_refs(js):
        used = set(re.findall(r'"@a:([A-Za-z0-9_$]+)"', js))
        missing = used - set(audio)
        assert not missing, missing
        return re.sub(r'"@a:([A-Za-z0-9_$]+)"', lambda m: json.dumps(audio[m.group(1)][len("assets/"):]), js)

    app_rel = emit("", "app", "js", audio_refs(rd("app.js")))
    ui_rel = emit("", "ui", "js", rd("ui.js"))
    sea_rel = emit("", "sea", "js", audio_refs(rd("sea.js")))
    desert_rel = emit("", "desert", "js", audio_refs(rd("desert.js")))
    thumbs = {y: emit("thumbs", y, "webp", rd(f"thumbs/{y}.webp", "rb")) for y in YARDS}

    css = rd("style.css") + rd("ui.css")
    boot = rd("boot.js").strip()
    panelfit = rd("panelfit.js")
    snd = rd("snd.html")
    tpl = rd("page.html")

    for y in [None] + YARDS[1:]:
        p = "" if y is None else "../"
        cy = {"p": p, "yard": y or "", "app": app_rel, "sea": sea_rel, "desert": desert_rel, "th": thumbs, "au": {k: audio[k] for k in PREFETCH_AUDIO}}
        title = "天空之境 | Sky Haven" if y is None else f"{NAMES[y]} · 天空之境 | Sky Haven"
        html = tpl
        for k, v in {
            "{{BOOT}}": "window.CY=" + json.dumps(cy, ensure_ascii=False, separators=(",", ":")) + ";" + boot,
            "{{CSS}}": css, "{{PANELFIT}}": panelfit, "{{SND}}": snd,
            "{{UI}}": ui_rel, "{{APP}}": app_rel, "{{TITLE}}": title,
            "{{YARD}}": y or "", **{"{{T_%s}}" % k: v for k, v in thumbs.items()},
        }.items():
            html = html.replace(k, v)
        html = html.replace("{{P}}", p)
        assert "{{" not in html, re.findall(r"\{\{\w+\}\}", html)
        write("index.html" if y is None else f"{y}/index.html", html)

    core = [app_rel, ui_rel, desert_rel] + list(thumbs.values()) + models_core + vendor_core
    version = hashlib.sha256("|".join(sorted(core + [sea_rel] + list(audio.values()))).encode()).hexdigest()[:10]
    sw = rd("sw.js").replace("{{VERSION}}", version).replace("{{CORE}}", json.dumps(core))
    write("sw.js", sw)

    for d, _, files in os.walk(ASSETS):
        for fn in files:
            path = os.path.normpath(os.path.join(d, fn))
            if path not in written:
                os.remove(path)
    total = sum(os.path.getsize(p) for p in written)
    print(f"built: app={app_rel} ui={ui_rel} audio={len(audio)} files, assets total {total/1e6:.2f} MB")


if __name__ == "__main__":
    main()
