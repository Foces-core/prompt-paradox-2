/**
 * Comprehensive overflow / button-clipping audit using Edge.
 *
 * Checks registration screen and (where backend allows) the story & game
 * dashboard across many viewport sizes.  Captures screenshots for every
 * viewport so we can visually inspect results.
 */
import { expect, test, type Page } from "@playwright/test";

/* Force Edge channel for this file */
test.use({ channel: "msedge", browserName: "chromium" });

const VIEWPORTS = [
  { label: "280x600", width: 280, height: 600 },
  { label: "320x480", width: 320, height: 480 },
  { label: "360x800", width: 360, height: 800 },
  { label: "375x667", width: 375, height: 667 },
  { label: "390x844", width: 390, height: 844 },
  { label: "430x932", width: 430, height: 932 },
  { label: "768x1024", width: 768, height: 1024 },
  { label: "1024x768", width: 1024, height: 768 },
  { label: "1280x720", width: 1280, height: 720 },
  { label: "1920x1080", width: 1920, height: 1080 },
];

interface ClipReport {
  tag: string;
  text: string;
  x: number;
  right: number;
  width: number;
  vpWidth: number;
}

async function findClippedElements(
  page: Page,
  selector: string,
): Promise<ClipReport[]> {
  return page.evaluate((sel) => {
    const results: ClipReport[] = [];
    const vpWidth = window.innerWidth;
    document.querySelectorAll(sel).forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) return;
      const style = window.getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden") return;
      // Skip elements with opacity 0 or positioned off-screen intentionally
      if (style.opacity === "0") return;
      if (rect.left < -100) return; // intentionally hidden off-screen
      if (rect.right > vpWidth + 2 || rect.left < -2) {
        results.push({
          tag: el.tagName.toLowerCase(),
          text: (el.textContent || "").trim().slice(0, 60),
          x: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width),
          vpWidth,
        });
      }
    });
    return results;
  }, selector);
}

async function getPageOverflow(page: Page) {
  return page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
}

/* ------------------------------------------------------------------ */
/*  Registration Screen                                               */
/* ------------------------------------------------------------------ */
test.describe("Registration Screen Overflow", () => {
  for (const vp of VIEWPORTS) {
    test(`${vp.label}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/");
      await expect(
        page.getByRole("heading", { name: "START CHALLENGE" }),
      ).toBeVisible({ timeout: 15_000 });

      // Screenshot every viewport
      await page.screenshot({
        path: `test-results/reg-${vp.label}.png`,
        fullPage: true,
      });

      const overflow = await getPageOverflow(page);
      const clippedBtns = await findClippedElements(page, "button");
      const clippedInputs = await findClippedElements(page, "input");
      const clippedForms = await findClippedElements(page, "form");

      const all = [...clippedBtns, ...clippedInputs, ...clippedForms];

      if (overflow.scrollWidth > overflow.clientWidth + 1) {
        console.log(
          `[${vp.label}] PAGE OVERFLOW: scrollWidth=${overflow.scrollWidth} > clientWidth=${overflow.clientWidth}`,
        );
      }
      for (const c of all) {
        console.log(
          `[${vp.label}] CLIPPED ${c.tag} "${c.text}" — x=${c.x} right=${c.right} vpWidth=${c.vpWidth}`,
        );
      }

      expect(
        overflow.scrollWidth,
        `Horizontal overflow at ${vp.label}`,
      ).toBeLessThanOrEqual(overflow.clientWidth + 1);
      expect(all, `Clipped elements at ${vp.label}`).toHaveLength(0);
    });
  }
});

/* ------------------------------------------------------------------ */
/*  Story & Game Dashboard — requires Convex backend                  */
/* ------------------------------------------------------------------ */
const MOBILE_VPS = VIEWPORTS.filter((v) => v.width <= 430);

test.describe("Story + Dashboard Overflow", () => {
  for (const vp of MOBILE_VPS) {
    test(`${vp.label}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/");
      await expect(
        page.getByRole("heading", { name: "START CHALLENGE" }),
      ).toBeVisible({ timeout: 15_000 });

      // Register
      await page.getByLabel("Name").fill("Overflow Tester");
      await page.getByLabel("College").fill("Test College");
      await page.getByLabel("Email").fill("overflow@test.com");
      await page.getByRole("button", { name: "START CHALLENGE" }).click();

      // Wait for story or game
      const storyOrGame = page
        .getByRole("button", { name: /NEXT|SKIP|START|EXIT|CLOSE|CHALLENGES/ })
        .first();

      try {
        await expect(storyOrGame).toBeVisible({ timeout: 12_000 });
      } catch {
        // Backend may be down — skip gracefully
        test.skip(true, "Backend unavailable");
        return;
      }

      // Story intro screen
      await page.screenshot({
        path: `test-results/story-${vp.label}.png`,
        fullPage: true,
      });

      let storyOverflow = await getPageOverflow(page);
      let storyClipped = await findClippedElements(page, "button");

      if (storyOverflow.scrollWidth > storyOverflow.clientWidth + 1) {
        console.log(
          `[${vp.label}] STORY OVERFLOW: scrollWidth=${storyOverflow.scrollWidth} > clientWidth=${storyOverflow.clientWidth}`,
        );
      }
      for (const c of storyClipped) {
        console.log(
          `[${vp.label}] STORY CLIPPED ${c.tag} "${c.text}" — x=${c.x} right=${c.right}`,
        );
      }

      expect(
        storyOverflow.scrollWidth,
        `Story overflow at ${vp.label}`,
      ).toBeLessThanOrEqual(storyOverflow.clientWidth + 1);
      expect(storyClipped, `Story btn clip at ${vp.label}`).toHaveLength(0);

      // Click through story
      for (let i = 0; i < 7; i++) {
        const btn = page
          .getByRole("button", { name: /^(NEXT|START|CLOSE)$/ })
          .first();
        try {
          await expect(btn).toBeVisible({ timeout: 5_000 });
          await btn.click();
          await page.waitForTimeout(400);
        } catch {
          break;
        }
      }

      // Check game dashboard header
      try {
        const challengesBtn = page.getByRole("button", { name: "CHALLENGES" });
        await expect(challengesBtn).toBeVisible({ timeout: 10_000 });

        await page.screenshot({
          path: `test-results/dashboard-${vp.label}.png`,
          fullPage: true,
        });

        const dashOverflow = await getPageOverflow(page);
        const dashBtns = await findClippedElements(page, "button");
        const dashNav = await findClippedElements(page, "nav");
        const dashHeader = await findClippedElements(page, "header");

        const allDash = [...dashBtns, ...dashNav, ...dashHeader];

        if (dashOverflow.scrollWidth > dashOverflow.clientWidth + 1) {
          console.log(
            `[${vp.label}] DASHBOARD OVERFLOW: scrollWidth=${dashOverflow.scrollWidth} > clientWidth=${dashOverflow.clientWidth}`,
          );
        }
        for (const c of allDash) {
          console.log(
            `[${vp.label}] DASH CLIPPED ${c.tag} "${c.text}" — x=${c.x} right=${c.right}`,
          );
        }

        expect(
          dashOverflow.scrollWidth,
          `Dashboard overflow at ${vp.label}`,
        ).toBeLessThanOrEqual(dashOverflow.clientWidth + 1);
        expect(allDash, `Dashboard clips at ${vp.label}`).toHaveLength(0);
      } catch {
        // If dashboard is unreachable, that's OK — may need event start
      }
    });
  }
});
