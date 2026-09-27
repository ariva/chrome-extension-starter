// `just icons` — renders dev-assets/icons/icon.svg into both PNG sets, so the dev icons can never
// drift from the shipped ones: same shape, different badge gradient. Chromium (Playwright, already
// a devDependency) does the rasterising; the PNGs are committed, the build never needs a browser.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { chromium } from "@playwright/test";

const ROOT = resolve(import.meta.dirname, "..");
const SIZES = [16, 32, 48, 128];
const SETS = [
  { dir: "public/icons", colors: null }, // shipped: the gradient written in icon.svg
  { dir: "dev-assets/icons/dev", colors: ["#a78bfa", "#6d28d9"] }, // dev copy: violet
];

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1 });
await page.setContent(
  `<style>body{margin:0}svg{display:block}</style>${readFileSync(resolve(ROOT, "dev-assets/icons/icon.svg"), "utf8")}`,
);
const svg = page.locator("svg");
for (const { dir, colors } of SETS) {
  for (const size of SIZES) {
    await svg.evaluate(
      (el, { size, colors }) => {
        el.setAttribute("width", size);
        el.setAttribute("height", size);
        if (colors) {
          el.style.setProperty("--c1", colors[0]);
          el.style.setProperty("--c2", colors[1]);
        }
      },
      { size, colors },
    );
    await svg.screenshot({ path: resolve(ROOT, dir, `icon${size}.png`), omitBackground: true });
  }
  console.log(`${dir}: ${SIZES.map((s) => `icon${s}.png`).join(" ")}`);
}
await browser.close();
