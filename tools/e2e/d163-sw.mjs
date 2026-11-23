// d163 service-worker update check (Chromium + WebKit): needs `npm i playwright && npx playwright install webkit`; run `node d163-sw.mjs` and `ENG=chromium node d163-sw.mjs`
import { webkit, chromium } from "playwright";
import { spawn } from "node:child_process";
import fs from "node:fs";
const ROOT = "/agent/repos/courtyard-seasons", PORT = 8000 + Math.floor(Math.random() * 900);
const srv = spawn("python3", ["-m", "http.server", String(PORT), "--bind", "127.0.0.1"], { cwd: ROOT, stdio: "ignore" });
await new Promise(r => setTimeout(r, 800));
const eng = process.env.ENG === "chromium" ? chromium : webkit;
const b = await eng.launch(process.env.ENG === "chromium" ? { executablePath: "/usr/bin/google-chrome-stable" } : {});
const ctx = await b.newContext({ viewport: { width: 800, height: 450 } }), page = await ctx.newPage();
const base = `http://127.0.0.1:${PORT}`, swP = `${ROOT}/sw.js`, pgP = `${ROOT}/kr/index.html`;
const sw0 = fs.readFileSync(swP, "utf8"), pg0 = fs.readFileSync(pgP, "utf8"), V0 = /const V="([^"]+)"/.exec(sw0)[1];
const res = { engine: eng.name(), V0 };
const state = () => page.evaluate(async () => ({ caches: (await caches.keys()).filter(k => k.startsWith("cy-")), ctrl: !!navigator.serviceWorker.controller, marker: /d163-marker-\d/.exec(document.documentElement.outerHTML)?.[0] || null }));
try {
  await page.goto(`${base}/kr/`, { waitUntil: "load" });
  await page.evaluate(async () => { await navigator.serviceWorker.register("/sw.js"); await navigator.serviceWorker.ready; });
  await page.reload({ waitUntil: "load" }); await page.waitForTimeout(1500);
  res.first = await state();
  /* a new release: a new cache version and an edited page */
  fs.writeFileSync(swP, sw0.replace(V0, "d163test-0000000000"));
  fs.writeFileSync(pgP, pg0.replace("</body>", "<!--d163-marker-1--></body>"));
  await page.evaluate(async () => { const r = await navigator.serviceWorker.getRegistration(); await r.update(); });
  await page.waitForTimeout(3000);
  await page.reload({ waitUntil: "load" }); await page.waitForTimeout(1500);
  res.afterRelease = await state();
  fs.writeFileSync(pgP, pg0.replace("</body>", "<!--d163-marker-2--></body>"));
  await page.reload({ waitUntil: "load" }); await page.waitForTimeout(1000);
  res.pageEditedAgain = await state();
  await page.screenshot({ path: `/tmp/d163/sw_${eng.name()}.png` });
} catch (e) { res.err = e.message } finally {
  fs.writeFileSync(swP, sw0); fs.writeFileSync(pgP, pg0);
}
res.pass = !!(res.first?.caches.length === 1 && res.first.caches[0] === "cy-" + V0 && res.afterRelease?.caches.join() === "cy-d163test-0000000000" && res.afterRelease.marker === "d163-marker-1" && res.pageEditedAgain?.marker === "d163-marker-2");
console.log(JSON.stringify(res, null, 1));
fs.writeFileSync(`/tmp/d163/sw_${eng.name()}.json`, JSON.stringify(res, null, 1));
await b.close(); srv.kill();
