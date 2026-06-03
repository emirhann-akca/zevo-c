/**
 * Renders caption text as transparent PNG using Playwright (already a dep).
 * Avoids the need for ffmpeg drawtext (which Homebrew's stripped-down build lacks).
 *
 * Style is intentionally Apple/Strava-tier: large bold uppercase sans-serif, no gray box,
 * pure white with deep shadow for legibility on any footage, emerald accent on emphasis tokens
 * marked with **double asterisks**.
 */
import { chromium, type Browser } from "playwright";
import { writeFile } from "node:fs/promises";

let _browser: Browser | null = null;
async function getBrowser(): Promise<Browser> {
  if (_browser) return _browser;
  _browser = await chromium.launch({ headless: true });
  return _browser;
}

export async function closeRenderer(): Promise<void> {
  if (_browser) {
    await _browser.close();
    _browser = null;
  }
}

/**
 * Renders a sequence of caption PNGs for word-by-word reveal.
 * Returns array of { path, words } where each PNG progressively reveals one more word.
 * The renderer (6-render.ts) composites them with timed overlays for kinetic motion.
 */
export async function renderKineticCaptions(
  fullText: string,
  outDir: string,
  prefix: string,
  style: CaptionStyle
): Promise<{ path: string; revealedThrough: number }[]> {
  const browser = await getBrowser();
  const width = style.width;
  const height = style.height ?? 480;
  const fontSize = style.fontSize ?? 96;
  const accent = style.accentColor ?? "#10DC78";
  const upper = style.uppercase ?? true;

  // Split into words, preserving emphasis markers
  const tokens = fullText.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return [];

  const results: { path: string; revealedThrough: number }[] = [];
  for (let i = 1; i <= tokens.length; i++) {
    // Already-spoken words (white) | currently-spoken word (emerald) | upcoming words (transparent)
    const alreadySpoken = tokens.slice(0, i - 1).join(" ");
    const currentWord = tokens[i - 1];
    const upcoming = tokens.slice(i).join(" ");
    const html = `<!doctype html><html><head><meta charset="utf-8"><style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@800;900&display=swap');
      html, body { margin: 0; padding: 0; background: transparent; }
      .wrap {
        width: ${width}px;
        min-height: ${height}px;
        display: flex; align-items: center; justify-content: center;
        padding: 24px 56px; box-sizing: border-box;
      }
      .cap {
        font-family: 'Inter', -apple-system, sans-serif;
        font-size: ${fontSize}px;
        font-weight: 900;
        text-align: center;
        line-height: 1.05;
        letter-spacing: -2px;
        text-shadow: 0 4px 12px rgba(0,0,0,0.6), 0 2px 4px rgba(0,0,0,0.85);
        max-width: 100%; word-wrap: break-word;
      }
      /* Instagram-style karaoke caption: full sentence visible in white, current word lights up emerald. */
      .past { color: white; }
      .now { color: ${accent}; text-shadow: 0 0 24px ${accent}AA, 0 4px 12px rgba(0,0,0,0.6); }
      .future { color: white; }
    </style></head><body>
      <div class="wrap"><div class="cap" id="cap">${alreadySpoken ? `<span class="past">${formatInline(alreadySpoken, accent, upper)}</span> ` : ""}<span class="now">${formatInline(currentWord, accent, upper)}</span>${upcoming ? ` <span class="future">${formatInline(upcoming, accent, upper)}</span>` : ""}</div></div>
      <script>
        const cap = document.querySelector('.cap');
        let fs = ${fontSize};
        while (cap.scrollHeight > ${height} - 48 && fs > 36) { fs -= 4; cap.style.fontSize = fs + 'px'; }
      </script>
    </body></html>`;
    const page = await browser.newPage({ viewport: { width, height } });
    await page.setContent(html, { waitUntil: "networkidle" });
    const el = await page.$(".wrap");
    if (!el) throw new Error("caption wrap missing");
    const buf = await el.screenshot({ omitBackground: true, type: "png" });
    const outPath = `${outDir}/${prefix}-${i}.png`;
    await writeFile(outPath, buf);
    await page.close();
    results.push({ path: outPath, revealedThrough: i });
  }
  return results;
}

export interface CaptionStyle {
  width: number;
  height?: number;
  accentColor?: string;
  fontSize?: number;
  uppercase?: boolean;
}

/**
 * Inline markdown: `**word**` becomes accent-colored.
 */
function formatInline(text: string, accent: string, uppercase: boolean): string {
  const escaped = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const cased = uppercase ? escaped.toUpperCase() : escaped;
  return cased.replace(/\*\*([^*]+)\*\*/g, (_m, inner) => `<span class="accent">${inner}</span>`);
}

export async function renderCaptionPng(text: string, outPath: string, style: CaptionStyle): Promise<void> {
  const browser = await getBrowser();
  const width = style.width;
  const height = style.height ?? 480;
  const fontSize = style.fontSize ?? 96;
  const accent = style.accentColor ?? "#10DC78";
  const upper = style.uppercase ?? true;

  const page = await browser.newPage({ viewport: { width, height } });
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@800;900&display=swap');
    html, body { margin: 0; padding: 0; background: transparent; }
    .wrap {
      width: ${width}px;
      min-height: ${height}px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px 56px;
      box-sizing: border-box;
    }
    .cap {
      font-family: 'Inter', -apple-system, 'SF Pro Display', sans-serif;
      font-size: ${fontSize}px;
      font-weight: 900;
      color: #FFFFFF;
      text-align: center;
      line-height: 1.05;
      letter-spacing: -2px;
      text-shadow:
        0 4px 12px rgba(0,0,0,0.55),
        0 2px 4px rgba(0,0,0,0.85);
      max-width: 100%;
      word-wrap: break-word;
    }
    .accent { color: ${accent}; }
  </style></head><body>
    <div class="wrap" id="wrap"><div class="cap">${formatInline(text, accent, upper)}</div></div>
    <script>
      // Auto-fit: shrink font until it fits within height
      const cap = document.querySelector('.cap');
      const wrap = document.querySelector('.wrap');
      let fs = ${fontSize};
      while (cap.scrollHeight > ${height} - 48 && fs > 32) {
        fs -= 4;
        cap.style.fontSize = fs + 'px';
      }
    </script>
  </body></html>`;
  await page.setContent(html, { waitUntil: "networkidle" });
  const el = await page.$("#wrap");
  if (!el) throw new Error("caption element missing");
  const buf = await el.screenshot({ omitBackground: true, type: "png" });
  await writeFile(outPath, buf);
  await page.close();
}
