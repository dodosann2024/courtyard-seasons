#!/usr/bin/env python3
"""Shrink the embedded textures of a binary glTF (Tripo v4 animals) without touching geometry or clips.

usage: glbtex.py IN.glb OUT.glb [default_px] [image_name=px ...]
Every embedded image is resized to at most `default_px` (default 1024) unless named explicitly, and re-encoded
as JPEG (normal maps at higher quality). The binary chunk is rebuilt with 4-byte aligned buffer views."""
import io, json, struct, sys
from PIL import Image


def load(path):
    b = open(path, "rb").read()
    jl = struct.unpack("<I", b[12:16])[0]
    j = json.loads(b[20:20 + jl])
    bo = 20 + jl
    bl = struct.unpack("<I", b[bo:bo + 4])[0]
    return j, b[bo + 8:bo + 8 + bl]


def main():
    src, dst = sys.argv[1], sys.argv[2]
    rest = sys.argv[3:]
    dflt = int(rest[0]) if rest and "=" not in rest[0] else 1024
    per = dict(a.split("=") for a in rest if "=" in a)
    j, bin_ = load(src)
    views = {im["bufferView"]: im for im in j.get("images", [])}
    out, newv = bytearray(), []
    for i, v in enumerate(j["bufferViews"]):
        data = bin_[v.get("byteOffset", 0):v.get("byteOffset", 0) + v["byteLength"]]
        if i in views:
            im = views[i]
            name = im.get("name", "")
            px = int(per.get(name, dflt))
            I = Image.open(io.BytesIO(data))
            I = I.convert("RGB")
            if max(I.size) > px:
                I = I.resize((px, px * I.size[1] // I.size[0]), Image.LANCZOS)
            q = 90 if "normal" in name else 84
            buf = io.BytesIO()
            I.save(buf, "JPEG", quality=q, optimize=True, progressive=False)
            data = buf.getvalue()
            im["mimeType"] = "image/jpeg"
            print(f"  {name}: {I.size[0]}px {len(data)} B")
        while len(out) % 4:
            out.append(0)
        nv = dict(v)
        nv["byteOffset"] = len(out)
        nv["byteLength"] = len(data)
        newv.append(nv)
        out += data
    while len(out) % 4:
        out.append(0)
    j["bufferViews"] = newv
    j["buffers"] = [{"byteLength": len(out)}]
    js = json.dumps(j, separators=(",", ":")).encode()
    js += b" " * ((4 - len(js) % 4) % 4)
    total = 12 + 8 + len(js) + 8 + len(out)
    with open(dst, "wb") as f:
        f.write(struct.pack("<III", 0x46546C67, 2, total))
        f.write(struct.pack("<II", len(js), 0x4E4F534A) + js)
        f.write(struct.pack("<II", len(out), 0x004E4942) + bytes(out))
    print(dst, total)


if __name__ == "__main__":
    main()
