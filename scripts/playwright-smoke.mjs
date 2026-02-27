import fs from "node:fs/promises";
import path from "node:path";
import http from "node:http";
import { chromium } from "@playwright/test";

function contentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const map = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".pdf": "application/pdf",
    ".mp3": "audio/mpeg",
    ".wav": "audio/wav",
    ".mp4": "video/mp4"
  };
  return map[ext] || "application/octet-stream";
}

async function serveDirectory(rootDir) {
  const server = http.createServer(async (req, res) => {
    const target = new URL(req.url || "/", "http://localhost");
    const clean = decodeURIComponent(target.pathname).replace(/\\/g, "/");
    const normalized = clean === "/" ? "/index.html" : clean;
    const absolute = path.resolve(rootDir, `.${normalized}`);
    if (!absolute.startsWith(path.resolve(rootDir))) {
      res.writeHead(403).end("Forbidden");
      return;
    }
    const stats = await fs.stat(absolute).catch(() => null);
    if (!stats?.isFile()) {
      res.writeHead(404).end("Not found");
      return;
    }
    const bytes = await fs.readFile(absolute);
    res.writeHead(200, {
      "Content-Type": contentType(absolute),
      "Cache-Control": "no-store"
    });
    res.end(bytes);
  });

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });

  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 4173;
  return { server, url: `http://127.0.0.1:${port}` };
}

async function main() {
  const previewDir = process.argv[2];
  if (!previewDir) {
    throw new Error("Usage: node scripts/playwright-smoke.mjs <previewDir>");
  }

  const root = path.resolve(previewDir);
  const indexPath = path.join(root, "index.html");
  const indexExists = await fs.stat(indexPath).then((s) => s.isFile()).catch(() => false);
  if (!indexExists) {
    throw new Error(`Preview index not found: ${indexPath}`);
  }

  const { server, url } = await serveDirectory(root);
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => {
    pageErrors.push(String(error?.message || error));
  });

  try {
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".unit-header", { timeout: 10000 });
    await page.waitForSelector("[data-mark-complete]", { timeout: 10000 });
    if (pageErrors.length > 0) {
      throw new Error(`Playwright page errors: ${pageErrors.join(" | ")}`);
    }

    const completeButton = page.locator("[data-mark-complete]");
    await completeButton.click();
    await page.waitForFunction(
      () => document.querySelector("[data-mark-complete]")?.getAttribute("aria-pressed") === "true",
      null,
      { timeout: 10000 }
    );
    await page.waitForSelector(".completion-state", { state: "attached", timeout: 10000 });

    if (await page.locator("[data-workbook-field]").count()) {
      const firstField = page.locator("[data-workbook-field]").first();
      const tag = await firstField.evaluate((el) => el.tagName.toLowerCase());
      if (tag === "input" || tag === "textarea") {
        await firstField.fill("smoke-check");
      } else {
        await firstField.check();
      }
    }

    if (await page.locator("[data-scenario-choice]").count()) {
      await page.locator("[data-scenario-choice]").first().check();
    }

    if (await page.locator("[data-ranking-field]").count()) {
      await page.locator("[data-ranking-field]").first().selectOption("1");
    }

    if (await page.locator("[data-decision-choice]").count()) {
      await page.locator("[data-decision-choice]").first().click();
    }

    if (pageErrors.length > 0) {
      throw new Error(`Playwright page errors: ${pageErrors.join(" | ")}`);
    }
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
}

main().catch((error) => {
  console.error(`playwright-smoke failed: ${error.message}`);
  process.exit(1);
});
