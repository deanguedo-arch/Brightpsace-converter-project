import fs from "node:fs/promises";
import path from "node:path";
import http from "node:http";
import { chromium } from "@playwright/test";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

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
  const context = await browser.newContext();
  const page = await context.newPage();
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

    const coreCount = await page.locator('.content-column > [data-section-role="core"]').count();
    if (coreCount > 1) {
      const stage = page.locator("[data-section-stage]");
      await stage.waitFor({ state: "visible", timeout: 10000 });

      const visibleCoreCount = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.content-column > [data-section-role="core"]'))
          .filter((section) => !section.hidden).length;
      });
      assert(visibleCoreCount === 1, `Expected exactly 1 visible core section, got ${visibleCoreCount}`);

      const initialActiveId = await page.evaluate(() => {
        return document.querySelector('.content-column > [data-section-role="core"].is-active-section')?.id || "";
      });
      assert(Boolean(initialActiveId), "Missing initial active core section.");

      await page.locator("[data-stage-next]").click();
      await page.waitForTimeout(100);
      const activeAfterNext = await page.evaluate(() => {
        return document.querySelector('.content-column > [data-section-role="core"].is-active-section')?.id || "";
      });
      assert(activeAfterNext && activeAfterNext !== initialActiveId, "Next button did not change active section.");

      const hashAfterNext = await page.evaluate(() => window.location.hash);
      assert(hashAfterNext.length > 1, "URL hash did not update after next.");

      await page.locator("[data-stage-prev]").click();
      await page.waitForTimeout(100);
      const activeAfterPrev = await page.evaluate(() => {
        return document.querySelector('.content-column > [data-section-role="core"].is-active-section')?.id || "";
      });
      assert(activeAfterPrev === initialActiveId, "Previous button did not return to initial section.");

      const quickJumpButton = page.locator("[data-stepper-item]").nth(1);
      if (await quickJumpButton.count()) {
        const jumpTarget = await quickJumpButton.getAttribute("data-stepper-target");
        await quickJumpButton.click();
        await page.waitForTimeout(100);
        const activeAfterJump = await page.evaluate(() => {
          return document.querySelector('.content-column > [data-section-role="core"].is-active-section')?.id || "";
        });
        assert(activeAfterJump === jumpTarget, "Stepper quick-jump did not activate its target section.");
        await page.reload({ waitUntil: "domcontentloaded" });
        await page.waitForTimeout(150);
        const activeAfterReload = await page.evaluate(() => {
          return document.querySelector('.content-column > [data-section-role="core"].is-active-section')?.id || "";
        });
        assert(activeAfterReload === jumpTarget, "Active section was not restored after reload.");
      }
    } else if (coreCount === 1) {
      const stageVisible = await page.evaluate(() => {
        const stage = document.querySelector("[data-section-stage]");
        if (!stage) return false;
        return !stage.hidden;
      });
      assert(!stageVisible, "Stage should be hidden for single-core-section units.");
    }

    const completeButton = page.locator("[data-mark-complete]");
    await completeButton.click();
    await page.waitForFunction(
      () => document.querySelector("[data-mark-complete]")?.getAttribute("aria-pressed") === "true",
      null,
      { timeout: 10000 }
    );
    await page.waitForSelector(".completion-state", { state: "attached", timeout: 10000 });

    if (await page.locator('[data-section-role="core"]:not([hidden]) [data-workbook-field]').count()) {
      const firstField = page.locator('[data-section-role="core"]:not([hidden]) [data-workbook-field]').first();
      const tag = await firstField.evaluate((el) => el.tagName.toLowerCase());
      if (tag === "input" || tag === "textarea") {
        await firstField.fill("smoke-check");
      } else {
        await firstField.check();
      }
    }

    if (await page.locator('[data-section-role="core"]:not([hidden]) [data-scenario-choice]').count()) {
      await page.locator('[data-section-role="core"]:not([hidden]) [data-scenario-choice]').first().check();
    }

    if (await page.locator('[data-section-role="core"]:not([hidden]) [data-ranking-field]').count()) {
      await page.locator('[data-section-role="core"]:not([hidden]) [data-ranking-field]').first().selectOption("1");
    }

    if (await page.locator('[data-section-role="core"]:not([hidden]) [data-decision-choice]').count()) {
      await page.locator('[data-section-role="core"]:not([hidden]) [data-decision-choice]').first().click();
    }

    const reduceContext = await browser.newContext({ reducedMotion: "reduce" });
    const reducePage = await reduceContext.newPage();
    await reducePage.goto(url, { waitUntil: "domcontentloaded" });
    const reducedChecks = await reducePage.evaluate(() => {
      const section = document.querySelector(".unit-section");
      const bodyHasClass = document.body.classList.contains("js-reduced-motion");
      const duration = section ? getComputedStyle(section).transitionDuration : "";
      return { bodyHasClass, duration };
    });
    await reduceContext.close();
    assert(reducedChecks.bodyHasClass, "Reduced motion mode class was not applied.");
    assert(
      String(reducedChecks.duration).includes("0.001s") || String(reducedChecks.duration).includes("1ms"),
      `Reduced motion transitions not minimized (duration: ${reducedChecks.duration}).`
    );

    if (pageErrors.length > 0) {
      throw new Error(`Playwright page errors: ${pageErrors.join(" | ")}`);
    }
  } finally {
    await context.close();
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
}

main().catch((error) => {
  console.error(`playwright-smoke failed: ${error.message}`);
  process.exit(1);
});
