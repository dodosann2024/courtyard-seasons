"""Build assets/tex/sky_cloudsea_pano.jpg from sky_backdrop_cloudsea.jpg.

The photo is tiled as mirrored panels around the horizon in desert.js, so the
baked sun is painted out and the horizontal low-frequency glow is flattened;
the shader adds a single sun glow in its world direction instead.
"""
import sys
import numpy as np
from PIL import Image, ImageFilter

SRC = "assets/tex/sky_backdrop_cloudsea.jpg"
DST = "assets/tex/sky_cloudsea_pano.jpg"


def blur(a, r):
    im = Image.fromarray(np.clip(a * 255, 0, 255).astype(np.uint8))
    return np.asarray(im.filter(ImageFilter.GaussianBlur(r)), dtype=np.float32) / 255


def main():
    im = Image.open(SRC).convert("RGB")
    a = np.asarray(im, dtype=np.float32) / 255
    h, w, _ = a.shape
    sx, sy = 906, 276

    yy, xx = np.mgrid[0:h, 0:w]
    d = np.hypot(xx - sx, (yy - sy) * 1.15)

    # replace the sun + halo with row colours sampled far from it, keeping fine detail
    far = (np.abs(xx - sx) > 260)
    rowcol = np.zeros_like(a)
    for y in range(h):
        rowcol[y] = np.median(a[y, far[y]], axis=0)
    rowcol = blur(rowcol, 4)
    detail = a - blur(a, 5)
    wgt = np.exp(-(d / 120.0) ** 2)
    core = np.exp(-(d / 46.0) ** 2)
    base = rowcol + detail * (1 - core)[..., None]
    a = a * (1 - wgt[..., None]) + base * wgt[..., None]

    # flatten horizontal low-frequency luminance (sun glow, vignette)
    lum = (a * np.array([0.3, 0.55, 0.15])).sum(2)
    low = blur(np.repeat(lum[..., None], 3, 2), 90)[..., 0] + 1e-3
    row = low.mean(1, keepdims=True)
    ratio = np.clip(row / low, 0.55, 1.6)
    strength = 0.92
    gain = 1 + (ratio - 1) * strength
    out = a * gain[..., None]

    # warm the cloud tops a touch and keep shadow sides lavender
    lum2 = (out * np.array([0.3, 0.55, 0.15])).sum(2)[..., None]
    lit = np.clip((lum2 - 0.45) / 0.35, 0, 1)
    sea = np.clip((yy - 250) / 120, 0, 1)[..., None]
    warm = np.array([1.05, 0.99, 0.88])
    lav = np.array([0.94, 0.92, 1.04])
    out = out * (1 - sea) + sea * out * (warm * lit + lav * (1 - lit))

    Image.fromarray(np.clip(out * 255, 0, 255).astype(np.uint8)).save(DST, quality=90)
    print("wrote", DST, out.shape)


if __name__ == "__main__":
    sys.exit(main())
