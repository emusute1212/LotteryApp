import { expect, test } from "@playwright/test";

test("reveals prize results one prize tier at a time", async ({ page }) => {
  await page.goto("/");

  await page.getByLabel("参加者数").fill("20");
  await page.getByLabel("等級名").nth(0).fill("1等");
  await page.getByLabel("当選人数").nth(0).fill("1");
  await page.getByLabel("等級名").nth(1).fill("2等");
  await page.getByLabel("当選人数").nth(1).fill("2");

  await page.getByRole("button", { name: "設定を確認する" }).click();
  await expect(page.getByRole("heading", { name: "設定内容の確認" })).toBeVisible();

  await page.getByRole("button", { name: "抽選を開始" }).click();
  await expect(page.getByRole("heading", { name: "1等" })).toBeVisible();

  await expect(page.getByTestId("winner-number")).toHaveCount(1, { timeout: 4000 });
  await expect(page.getByRole("button", { name: "次の等へ" })).toBeEnabled();

  await page.getByRole("button", { name: "次の等へ" }).click();
  await expect(page.getByRole("heading", { name: "2等" })).toBeVisible();
  await expect(page.getByTestId("winner-number")).toHaveCount(2, { timeout: 6000 });
  await expect(page.getByRole("button", { name: "結果一覧へ" })).toBeEnabled();
});
