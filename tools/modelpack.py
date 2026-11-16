#!/usr/bin/env python3
"""Pack handover GLBs for the web scene.

python3 tools/modelpack.py <handover-dir> [assets/models]

The handover files embed full-size PNG textures, and every saguaro file carries the same texture set.
This merges the saguaro variants into one GLB (one shared texture set, one node per variant), folds
textures that are a single flat colour into material factors, caps texture size for phones and stores
opaque maps as JPEG. Geometry, skins, clips and alpha cut-offs are copied unchanged.
"""
import hashlib, io, json, math, os, struct, sys
import numpy as np
from PIL import Image

def load(path):
    b = open(path, "rb").read()
    jl = struct.unpack("<I", b[12:16])[0]
    j = json.loads(b[20:20 + jl])
    o = 20 + jl
    bl = struct.unpack("<I", b[o:o + 4])[0]
    return j, b[o + 8:o + 8 + bl]

def view(j, bin_, i):
    v = j["bufferViews"][i]
    s = v.get("byteOffset", 0)
    return bin_[s:s + v["byteLength"]]

def merge(parts):
    """parts: [(path, node_name)] -> one glTF whose scene holds one root node per part"""
    out = {"asset": {"version": "2.0", "generator": "courtyard-seasons modelpack"}, "scene": 0, "scenes": [{"nodes": []}],
           "nodes": [], "meshes": [], "materials": [], "textures": [], "images": [], "samplers": [], "accessors": [], "bufferViews": []}
    blobs, used_ext = [], set()
    for path, name in parts:
        j, b = load(path)
        used_ext |= set(j.get("extensionsUsed", []))
        off = {k: len(out[k]) for k in ("nodes", "meshes", "materials", "textures", "images", "samplers", "accessors", "bufferViews")}
        for i, v in enumerate(j["bufferViews"]):
            blobs.append(view(j, b, i))
            out["bufferViews"].append({k: v[k] for k in v if k not in ("buffer", "byteOffset")})
        for a in j["accessors"]:
            a = dict(a); a["bufferView"] += off["bufferViews"]; out["accessors"].append(a)
        out["samplers"] += j.get("samplers", [])
        for im in j.get("images", []):
            im = dict(im); im["bufferView"] += off["bufferViews"]; out["images"].append(im)
        for t in j.get("textures", []):
            t = dict(t); t["source"] += off["images"]
            if "sampler" in t: t["sampler"] += off["samplers"]
            out["textures"].append(t)
        for m in j.get("materials", []):
            m = json.loads(json.dumps(m))
            for ref in tex_refs(m): ref["index"] += off["textures"]
            out["materials"].append(m)
        for me in j["meshes"]:
            me = json.loads(json.dumps(me))
            for p in me["primitives"]:
                p["attributes"] = {k: v + off["accessors"] for k, v in p["attributes"].items()}
                if "indices" in p: p["indices"] += off["accessors"]
                if "material" in p: p["material"] += off["materials"]
            out["meshes"].append(me)
        roots = j["scenes"][j.get("scene", 0)]["nodes"]
        for n in j["nodes"]:
            n = dict(n)
            if "mesh" in n: n["mesh"] += off["meshes"]
            if "children" in n: n["children"] = [c + off["nodes"] for c in n["children"]]
            out["nodes"].append(n)
        if len(roots) == 1:
            out["nodes"][roots[0] + off["nodes"]]["name"] = name
            out["scenes"][0]["nodes"].append(roots[0] + off["nodes"])
        else:
            out["nodes"].append({"name": name, "children": [r + off["nodes"] for r in roots]})
            out["scenes"][0]["nodes"].append(len(out["nodes"]) - 1)
    if used_ext: out["extensionsUsed"] = sorted(used_ext)
    return out, blobs

def tex_refs(m):
    pbr = m.get("pbrMetallicRoughness", {})
    for k in ("baseColorTexture", "metallicRoughnessTexture"):
        if k in pbr: yield pbr[k]
    for k in ("normalTexture", "occlusionTexture", "emissiveTexture"):
        if k in m: yield m[k]
    for e in m.get("extensions", {}).values():
        for k, v in e.items():
            if isinstance(v, dict) and "index" in v and k.endswith("Texture"): yield v

def roles(j):
    """image index -> set of roles it is used as"""
    r = {}
    for m in j.get("materials", []):
        pbr = m.get("pbrMetallicRoughness", {})
        for role, ref in (("color", pbr.get("baseColorTexture")), ("mr", pbr.get("metallicRoughnessTexture")),
                          ("normal", m.get("normalTexture")), ("ao", m.get("occlusionTexture"))):
            if ref: r.setdefault(j["textures"][ref["index"]]["source"], set()).add(role)
    return r

CT = {5121: np.uint8, 5123: np.uint16, 5125: np.uint32, 5126: np.float32}
NC = {"SCALAR": 1, "VEC2": 2, "VEC3": 3, "VEC4": 4}

def acc_read(j, blobs, ai):
    a = j["accessors"][ai]
    v = j["bufferViews"][a["bufferView"]]
    dt, nc = np.dtype(CT[a["componentType"]]), NC[a["type"]]
    st = v.get("byteStride", dt.itemsize * nc)
    raw = np.frombuffer(blobs[a["bufferView"]], np.uint8)[a.get("byteOffset", 0):]
    rows = np.lib.stride_tricks.as_strided(raw, (a["count"], dt.itemsize * nc), (st, 1))
    return np.ascontiguousarray(rows).view(dt).reshape(a["count"], nc)

def acc_add(j, blobs, arr, like, target):
    blobs.append(arr.tobytes())
    j["bufferViews"].append({"byteLength": len(blobs[-1]), "target": target})
    a = {k: like[k] for k in ("componentType", "type", "normalized") if k in like}
    a.update(bufferView=len(j["bufferViews"]) - 1, count=len(arr))
    if like.get("min") is not None: a["min"], a["max"] = arr.min(0).tolist(), arr.max(0).tolist()
    j["accessors"].append(a)
    return len(j["accessors"]) - 1

def merge_prims(j, blobs):
    """concatenate the primitives of a static mesh that share a material (one draw call each instead of several)"""
    skinned = {n["mesh"] for n in j["nodes"] if "mesh" in n and "skin" in n}
    for mi, me in enumerate(j["meshes"]):
        if mi in skinned: continue
        groups = {}
        for p in me["primitives"]:
            if p.get("mode", 4) == 4 and "indices" in p and "targets" not in p:
                groups.setdefault((p.get("material"), tuple(sorted(p["attributes"]))), []).append(p)
        for ps in groups.values():
            if len(ps) < 2: continue
            attrs, idx, base = {k: [] for k in ps[0]["attributes"]}, [], 0
            for p in ps:
                for k in attrs: attrs[k].append(acc_read(j, blobs, p["attributes"][k]))
                idx.append(acc_read(j, blobs, p["indices"]).astype(np.uint32).ravel() + base)
                base += j["accessors"][p["attributes"]["POSITION"]]["count"]
            ii = np.concatenate(idx)
            it = np.uint16 if base < 65536 else np.uint32
            np_ = {"attributes": {k: acc_add(j, blobs, np.concatenate(v), j["accessors"][ps[0]["attributes"][k]], 34962) for k, v in attrs.items()},
                   "indices": acc_add(j, blobs, ii.astype(it).reshape(-1, 1), {"componentType": 5123 if it is np.uint16 else 5125, "type": "SCALAR"}, 34963)}
            if ps[0].get("material") is not None: np_["material"] = ps[0]["material"]
            me["primitives"] = [p for p in me["primitives"] if p not in ps] + [np_]

def cutoffs(j):
    """image index -> lowest alphaCutoff of the MASK materials that use it as base colour"""
    c = {}
    for m in j.get("materials", []):
        ref = m.get("pbrMetallicRoughness", {}).get("baseColorTexture")
        if ref and m.get("alphaMode") == "MASK":
            i = j["textures"][ref["index"]]["source"]
            c[i] = min(c.get(i, 1), m.get("alphaCutoff", .5))
    return c

def cov_resize(I, tw, th, cut):
    """downscale an alpha-card texture keeping its share of texels at or above the cut-off (premultiplied box filter,
    then the alpha scale found by bisection), so the cards are not thinned before the runtime builds its mips"""
    t = math.ceil(cut * 255 - 1e-6)
    target = (np.asarray(I.convert("RGBA"))[..., 3] >= t).mean()
    arr = np.asarray(I.convert("RGBA").convert("RGBa").resize((tw, th), Image.BOX).convert("RGBA")).astype(np.float64)
    al = arr[..., 3] / 255
    lo, hi = .25, 8.
    for _ in range(24):
        m = .5 * (lo + hi)
        if (np.round(np.minimum(al * m, 1) * 255) >= t).mean() < target: lo = m
        else: hi = m
    arr[..., 3] = np.round(np.minimum(al * hi, 1) * 255)
    return Image.fromarray(arr.astype(np.uint8), "RGBA")

def process(j, blobs, cap, jpeg_q=88, keep_names=True):
    """dedupe images, fold flat normal / MR maps into factors, downscale to cap(img_name, w, h), re-encode"""
    rl, cuts = roles(j), cutoffs(j)
    img_px, flat = {}, {}
    for i, im in enumerate(j["images"]):
        I = Image.open(io.BytesIO(blobs[im["bufferView"]]))
        a = np.asarray(I.convert("RGBA"))
        img_px[i] = I
        if (a == a[0, 0]).all(): flat[i] = a[0, 0].astype(float) / 255
    # fold flat maps
    for m in j["materials"]:
        pbr = m.setdefault("pbrMetallicRoughness", {})
        n = m.get("normalTexture")
        if n:
            s = j["textures"][n["index"]]["source"]
            if s in flat and abs(flat[s][0] - .5) < .01 and abs(flat[s][1] - .5) < .01: del m["normalTexture"]
        mr = pbr.get("metallicRoughnessTexture")
        if mr:
            s = j["textures"][mr["index"]]["source"]
            if s in flat:
                pbr["roughnessFactor"] = round(pbr.get("roughnessFactor", 1) * flat[s][1], 4)
                pbr["metallicFactor"] = round(pbr.get("metallicFactor", 1) * flat[s][2], 4)
                del pbr["metallicRoughnessTexture"]
    # encode the images still referenced
    live = {j["textures"][ref["index"]]["source"] for m in j["materials"] for ref in tex_refs(m)}
    enc, by_hash, remap = [], {}, {}
    for i in sorted(live):
        I = img_px[i]
        w, h = I.size
        tw, th = cap(j["images"][i].get("name", ""), w, h, rl.get(i, set()))
        if (tw, th) != (w, h): I = cov_resize(I, tw, th, cuts[i]) if i in cuts else I.resize((tw, th), Image.LANCZOS)
        rgba = I.convert("RGBA")
        alpha = np.asarray(rgba)[..., 3].min() < 255
        buf = io.BytesIO()
        if alpha:
            rgba.save(buf, "PNG", optimize=True); mime = "image/png"
        else:
            q = 92 if "normal" in rl.get(i, ()) else jpeg_q
            rgba.convert("RGB").save(buf, "JPEG", quality=q, optimize=True, subsampling=0 if "normal" in rl.get(i, ()) else 2); mime = "image/jpeg"
        d = buf.getvalue()
        hsh = hashlib.sha1(d).hexdigest()
        if hsh not in by_hash:
            by_hash[hsh] = len(enc)
            enc.append({"data": d, "mimeType": mime, "name": j["images"][i].get("name", f"img{i}")})
        remap[i] = by_hash[hsh]
    # textures -> unique (sampler, image)
    skey, samplers, smap = {}, [], {}
    for si, s in enumerate(j.get("samplers", [])):
        k = json.dumps(s, sort_keys=True)
        if k not in skey: skey[k] = len(samplers); samplers.append(s)
        smap[si] = skey[k]
    if samplers: j["samplers"] = samplers
    tkey, tex, tmap = {}, [], {}
    for ti, t in enumerate(j["textures"]):
        if t["source"] not in remap: continue
        k = (smap.get(t.get("sampler")), remap[t["source"]])
        if k not in tkey: tkey[k] = len(tex); tex.append({"source": k[1], **({"sampler": k[0]} if k[0] is not None else {})})
        tmap[ti] = tkey[k]
    for m in j["materials"]:
        for ref in tex_refs(m): ref["index"] = tmap[ref["index"]]
    # materials -> unique by content (keeps the first name); names stay distinct where the runtime matches on them
    mkey, mats, mmap = {}, [], {}
    for mi, m in enumerate(j["materials"]):
        k = json.dumps({x: m[x] for x in m if x != "name"}, sort_keys=True) + (m.get("name", "") if keep_names else "")
        if k not in mkey: mkey[k] = len(mats); mats.append(m)
        mmap[mi] = mkey[k]
    for me in j["meshes"]:
        for p in me["primitives"]:
            if "material" in p: p["material"] = mmap[p["material"]]
    j["materials"], j["textures"] = mats, tex
    merge_prims(j, blobs)
    # rebuild buffer views: live geometry/skin/animation views first, then the new images
    used = set()
    for me in j["meshes"]:
        for p in me["primitives"]:
            used |= set(p["attributes"].values()) | ({p["indices"]} if "indices" in p else set())
            for t in p.get("targets", []): used |= set(t.values())
    for s in j.get("skins", []):
        if "inverseBindMatrices" in s: used.add(s["inverseBindMatrices"])
    for an in j.get("animations", []):
        for s in an["samplers"]: used |= {s["input"], s["output"]}
    amap = {}
    accs = []
    for ai, a in enumerate(j["accessors"]):
        if ai in used: amap[ai] = len(accs); accs.append(a)
    j["accessors"] = accs
    for me in j["meshes"]:
        for p in me["primitives"]:
            p["attributes"] = {k: amap[v] for k, v in p["attributes"].items()}
            if "indices" in p: p["indices"] = amap[p["indices"]]
            if "targets" in p: p["targets"] = [{k: amap[v] for k, v in t.items()} for t in p["targets"]]
    for s in j.get("skins", []):
        if "inverseBindMatrices" in s: s["inverseBindMatrices"] = amap[s["inverseBindMatrices"]]
    for an in j.get("animations", []):
        for s in an["samplers"]: s["input"], s["output"] = amap[s["input"]], amap[s["output"]]
    img_views = {im["bufferView"] for im in j["images"]}
    live_views = {a["bufferView"] for a in accs if "bufferView" in a} | {v for a in accs for v in
                  ((a["sparse"]["indices"]["bufferView"], a["sparse"]["values"]["bufferView"]) if "sparse" in a else ())}
    keep = [i for i in range(len(blobs)) if i not in img_views and i in live_views]
    vmap, views, data = {}, [], bytearray()
    def put(blob, extra):
        while len(data) % 4: data.append(0)
        views.append({"buffer": 0, "byteOffset": len(data), "byteLength": len(blob), **extra})
        data.extend(blob)
        return len(views) - 1
    for i in keep:
        extra = {k: v for k, v in j["bufferViews"][i].items() if k in ("byteStride", "target")}
        vmap[i] = put(blobs[i], extra)
    for a in j["accessors"]:
        if "bufferView" in a: a["bufferView"] = vmap[a["bufferView"]]
        sp = a.get("sparse")
        if sp:
            sp["indices"]["bufferView"] = vmap[sp["indices"]["bufferView"]]; sp["values"]["bufferView"] = vmap[sp["values"]["bufferView"]]
    j["images"] = [{"name": e["name"], "mimeType": e["mimeType"], "bufferView": put(e["data"], {})} for e in enc]
    j["bufferViews"] = views
    while len(data) % 4: data.append(0)
    j["buffers"] = [{"byteLength": len(data)}]
    return j, bytes(data)

def write(path, j, data):
    js = json.dumps(j, separators=(",", ":")).encode()
    js += b" " * (-len(js) % 4)
    total = 12 + 8 + len(js) + 8 + len(data)
    with open(path, "wb") as f:
        f.write(struct.pack("<III", 0x46546C67, 2, total))
        f.write(struct.pack("<II", len(js), 0x4E4F534A)); f.write(js)
        f.write(struct.pack("<II", len(data), 0x004E4942)); f.write(data)

def single(path):
    j, b = load(path)
    return j, [view(j, b, i) for i in range(len(j["bufferViews"]))]

def cap_long(n):
    def f(name, w, h, role):
        s = min(1, n / max(w, h))
        return max(1, round(w * s)), max(1, round(h * s))
    return f

def main():
    src = sys.argv[1]
    dst = sys.argv[2] if len(sys.argv) > 2 else "assets/models"
    P = lambda f: os.path.join(src, f)
    jobs = [
        # one shared texture set; nodes: <height>[_lod1]. The island's 7 m plant is the flowering one, which uses the 7 m LOD1 at a distance
        ("saguaro_v3.glb", lambda: merge([(P("saguaro_v3_3m.glb"), "s3"), (P("saguaro_v3_3m_lod1.glb"), "s3_lod1"),
                                         (P("saguaro_v3_7m_lod1.glb"), "s7_lod1"),
                                         (P("saguaro_v3_12m.glb"), "s12"), (P("saguaro_v3_12m_lod1.glb"), "s12_lod1"),
                                         (P("saguaro_v3_flowering.glb"), "s7f")]), cap_long(1024)),
        ("barrel_cactus_v3.glb", lambda: single(P("barrel_cactus_v3.glb")), cap_long(1024)),
        ("cholla_v2.glb", lambda: single(P("cholla_v2.glb")), cap_long(1024)),
    ]
    for out, get, cap in jobs:
        j, blobs = get()
        j, data = process(j, blobs, cap, keep_names=False)
        write(os.path.join(dst, out), j, data)
        print(f"{out}: {os.path.getsize(os.path.join(dst, out)) / 1e6:.2f} MB, {len(j['images'])} images, "
              f"{len(j['materials'])} materials, {len(j['meshes'])} meshes")

if __name__ == "__main__":
    main()
