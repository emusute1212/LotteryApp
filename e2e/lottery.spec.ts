import { expect, test } from "@playwright/test";

test("reveals prize results one prize tier at a time", async ({ page }) => {
  await page.goto("/");

  await page.getByLabel("参加者数").fill("20");
  await page.getByLabel("当選人数").nth(0).fill("1");
  await page.getByLabel("当選人数").nth(1).fill("2");

  await page.getByRole("button", { name: "抽選スタート" }).click();
  await expect(page.getByRole("heading", { name: "抽選中・・・" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "2等" })).toBeVisible();

  await page.getByTestId("reveal-surface").click();
  await expect(page.getByTestId("winner-number")).toHaveCount(1);

  await page.getByTestId("reveal-surface").click();
  await expect(page.getByTestId("winner-number")).toHaveCount(2);

  await page.getByTestId("reveal-surface").click();
  await expect(page.getByRole("heading", { name: "1等" })).toBeVisible();
  await page.getByTestId("reveal-surface").click();
  await expect(page.getByTestId("winner-number")).toHaveCount(1);
});
