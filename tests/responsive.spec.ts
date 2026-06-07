import { expect, test } from "@playwright/test";

const sampleParticipant = {
  name: "Sebin Mathew",
  college: "College of Engineering Chengannur",
  email: "sebin@example.com",
};

async function advanceThroughStory(page) {
  const storyButton = page.getByRole("button", { name: /^(SKIP|NEXT|START)$/ });

  for (let index = 0; index < 6; index += 1) {
    await expect(storyButton).toBeVisible();
    await storyButton.click();
    await page.waitForTimeout(250);
  }

  await expect(page.getByRole("button", { name: "START" })).toBeVisible({
    timeout: 10_000,
  });
  await page.getByRole("button", { name: "START" }).click();
  await page.waitForTimeout(500);
}

test.describe("responsive UI", () => {
  test("auth flow stays within viewport", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "START CHALLENGE" })).toBeVisible();

    await page.getByLabel("Name").fill(sampleParticipant.name);
    await page.getByLabel("College").fill(sampleParticipant.college);
    await page.getByLabel("Email").fill(sampleParticipant.email);
    await page.getByRole("button", { name: "START CHALLENGE" }).click();

    await advanceThroughStory(page);

    await expect(page.getByRole("button", { name: "CHALLENGES" })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.locator("header")).toBeVisible();
    await expect(page.getByRole("button", { name: "CHALLENGES" })).toBeVisible();
    await expect(page.getByRole("button", { name: "LEADERBOARD" })).toBeVisible();
    await expect(page.getByRole("button", { name: "STORY" })).toBeVisible();

    const overflow = await page.evaluate(() => {
      const doc = document.documentElement;
      return {
        scrollWidth: doc.scrollWidth,
        clientWidth: doc.clientWidth,
      };
    });

    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1);
  });

  test("header controls stay visible on mobile sized layouts", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "START CHALLENGE" })).toBeVisible();

    await page.getByLabel("Name").fill(sampleParticipant.name);
    await page.getByLabel("College").fill(sampleParticipant.college);
    await page.getByLabel("Email").fill(sampleParticipant.email);
    await page.getByRole("button", { name: "START CHALLENGE" }).click();

    await advanceThroughStory(page);

    const buttons = [
      page.getByRole("button", { name: "CHALLENGES" }),
      page.getByRole("button", { name: "LEADERBOARD" }),
      page.getByRole("button", { name: "STORY" }),
      page.getByRole("button", { name: "<" }),
      page.getByRole("button", { name: ">" }),
    ];

    for (const button of buttons) {
      await expect(button).toBeVisible();
    }

    const visible = await Promise.all(
      buttons.map(async (button) => {
        const box = await button.boundingBox();
        return Boolean(
          box &&
            box.x >= 0 &&
            box.y >= 0 &&
            box.x + box.width <= (await page.viewportSize())!.width + 1,
        );
      }),
    );

    expect(visible.every(Boolean)).toBeTruthy();
  });
});
