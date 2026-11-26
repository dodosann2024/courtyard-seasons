import http from "node:http";
import fs from "node:fs";
import path from "node:path";
const TYPES = {".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png",
  ".jpg": "image/jpeg", ".webp": "image/webp", ".ktx2": "image/ktx2", ".glb": "model/gltf-binary", ".mp3": "audio/mpeg", ".m4a": "audio/mp4",
  ".ogg": "audio/ogg", ".wasm": "application/wasm", ".svg": "image/svg+xml", ".bin": "application/octet-stream"};
// throttle: bytes per second per response (0 = unlimited)
export const serve = (root, {bps = 0} = {}) => new Promise(r => {
  const s = http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
    if (p.endsWith("/")) p += "index.html";
    const f = path.join(root, p);
    if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
    if (process.env.BLOCK && new RegExp(process.env.BLOCK).test(p)) { res.writeHead(404); res.end(); return; }
    const size = fs.statSync(f).size;
    res.writeHead(200, {"content-type": TYPES[path.extname(f)] || "application/octet-stream", "content-length": size, "cache-control": "no-store"});
    if (!bps) { fs.createReadStream(f).pipe(res); return; }
    const st = fs.createReadStream(f, {highWaterMark: 16384});
    st.on("data", ch => { st.pause(); res.write(ch); setTimeout(() => st.resume(), ch.length / bps * 1000); });
    st.on("end", () => res.end());
  });
  s.listen(0, "127.0.0.1", () => r({origin: `http://127.0.0.1:${s.address().port}`, close: () => s.close()}));
});
