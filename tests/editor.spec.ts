import { test, expect } from "@playwright/test";
test("sample, editing, persistence and JSON round trip", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.getByLabel("作品タイトル")).toHaveValue(
    "ふしぎな森の小さなおうち",
  );
  await expect(page.locator(".page-card")).toHaveCount(5);
  await page.getByRole("button", { name: "プレビュー", exact: true }).click();
  const actor = page.locator(".reader .interactive");
  await expect(actor).toHaveCount(1);
  const img = actor.locator("img");
  const before = await img.getAttribute("src");
  await actor.click();
  await expect(img).not.toHaveAttribute("src", before!);
  await page.getByRole("button", { name: "次のページ" }).click();
  await page.locator(".reader .interactive").click();
  await page.getByRole("button", { name: "編集に戻る" }).click();
  await page.getByLabel("作品タイトル").fill("テストの絵本");
  await page.getByRole("button", { name: "文字", exact: true }).click();
  await page.getByLabel("テキスト", { exact: true }).fill("こんにちは、森！");
  await page
    .getByRole("button", { name: "ぴょんと跳ねる", exact: false })
    .click();
  await expect(page.locator(".canvas .book-text").last()).toHaveText(
    "こんにちは、森！",
  );
  await expect(page.locator(".save")).toContainText("保存しました");
  await page.reload();
  await expect(page.getByLabel("作品タイトル")).toHaveValue("テストの絵本");
  await page.locator(".page-choice").nth(1).click();
  await expect(page.locator(".canvas .book-text").last()).toHaveText(
    "こんにちは、森！",
  );
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "書き出し", exact: true }).click();
  const download = await downloadPromise;
  const path = await download.path();
  await page.getByRole("button", { name: "作品一覧", exact: true }).click();
  await page
    .locator('input[type=file][accept="application/json,.json"]')
    .setInputFiles(path!);
  await expect(page.locator(".library-modal")).toHaveCount(0);
  await expect(page.getByLabel("作品タイトル")).toHaveValue("テストの絵本");
  await page.getByRole("button", { name: "ページを追加", exact: true }).click();
  await expect(page.locator(".page-card")).toHaveCount(6);
  await page.getByTitle("ページを複製", { exact: true }).click();
  await expect(page.locator(".page-card")).toHaveCount(7);
  await page.getByTitle("ページを削除", { exact: true }).click();
  await expect(page.locator(".page-card")).toHaveCount(6);
  await page.getByTitle("元に戻す", { exact: true }).click();
  await expect(page.locator(".page-card")).toHaveCount(7);
  expect(errors).toEqual([]);
});
test("mobile preview and image upload", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByLabel("作品タイトル")).toBeVisible();
  await page
    .locator('input[type=file][accept="image/png,image/jpeg,image/webp"]')
    .first()
    .setInputFiles({
      name: "pixel.png",
      mimeType: "image/png",
      buffer: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aHfoAAAAASUVORK5CYII=",
        "base64",
      ),
    });
  await expect(page.locator(".element.selected")).toHaveCount(1);
  await page.getByRole("button", { name: "プレビュー", exact: true }).click();
  await expect(page.locator(".reader .canvas")).toBeVisible();
  await page.getByRole("button", { name: "次のページ" }).click();
  await expect(page.locator(".reader-controls")).toContainText("2 / 5");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
test("drag, property editing and every motion", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "素材", exact: true }).click();
  await page.getByTitle("素材 rabbit を追加", { exact: true }).click();
  const element = page.locator(".canvas .element.selected");
  const start = await element.boundingBox();
  await page.mouse.move(
    start!.x + start!.width / 2,
    start!.y + start!.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    start!.x + start!.width / 2 + 35,
    start!.y + start!.height / 2 + 20,
    { steps: 5 },
  );
  await page.mouse.up();
  const moved = await element.boundingBox();
  expect(moved!.x).toBeGreaterThan(start!.x + 25);
  await page.getByTitle("元に戻す", { exact: true }).click();
  await page.locator(".canvas .element").last().click();
  await page.getByLabel("幅", { exact: true }).fill("25");
  await expect(page.locator(".canvas .element.selected")).toHaveAttribute(
    "style",
    /width: 25%/,
  );
  for (const label of [
    "左右に移動",
    "上下に移動",
    "くるっと回転",
    "大きく・小さく",
    "ゆらゆら揺れる",
    "ぴょんと跳ねる",
  ]) {
    await page.getByRole("button", { name: label, exact: false }).click();
    await page.getByRole("button", { name: "プレビュー", exact: true }).click();
    const actor = page.locator(".reader .interactive").last();
    await actor.click();
    expect(
      await actor
        .locator(".element-inner")
        .evaluate((el) => el.getAnimations().length),
    ).toBeGreaterThan(0);
    await page.getByRole("button", { name: "編集に戻る", exact: true }).click();
  }
  await page
    .getByRole("button", { name: "消える・現れる", exact: false })
    .click();
  await page.getByRole("button", { name: "プレビュー", exact: true }).click();
  await page.locator(".reader .interactive").last().click();
  await expect(
    page.locator(".reader .interactive .element-inner").last(),
  ).toHaveCSS("opacity", "0.08");
  await page.locator(".reader .interactive").last().click();
  await expect(
    page.locator(".reader .interactive .element-inner").last(),
  ).toHaveCSS("opacity", "1");
});
