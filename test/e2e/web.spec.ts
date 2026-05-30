import { expect, test } from "@playwright/test";

test.describe("CodeMind Graph official website", () => {
  test("redirects the root route to the English landing page", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveURL(/\/en$/);
    await expect(page.getByRole("heading", { level: 1, name: "CodeMind Graph" })).toBeVisible();
    await expect(page.getByRole("link", { name: "繁體中文" })).toHaveAttribute("href", "/zh-TW");
  });

  test("switches between English and Traditional Chinese", async ({ page }) => {
    await page.goto("/en");

    await page.getByRole("link", { name: "繁體中文" }).click();
    await expect(page).toHaveURL(/\/zh-TW$/);
    await expect(page.getByText("AI 原生圖譜平台")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1, name: "CodeMind Graph" })).toBeVisible();

    await page.getByRole("link", { name: "English" }).click();
    await expect(page).toHaveURL(/\/en$/);
    await expect(page.getByText("AI-native graph platform", { exact: true })).toBeVisible();
  });

  test("keeps navigation anchors usable", async ({ page }) => {
    await page.goto("/en");

    await page.locator(".top-nav").getByRole("link", { exact: true, name: "Engineering" }).click();
    await expect(page.locator("#engineering-title")).toBeInViewport();

    await page.getByRole("link", { name: "Features" }).click();
    await expect(page.locator("#features-title")).toBeInViewport();

    await page.locator(".top-nav").getByRole("link", { exact: true, name: "Workflow" }).click();
    await expect(page.locator("#workflow-title")).toBeInViewport();
  });

  test("publishes locale SEO metadata", async ({ page }) => {
    await page.goto("/en");

    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      "https://codemind-graph.vercel.app/en"
    );
    await expect(page.locator('link[rel="alternate"][hreflang="zh-TW"]')).toHaveAttribute(
      "href",
      "https://codemind-graph.vercel.app/zh-TW"
    );
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      "content",
      "CodeMind Graph | AI-native Graph Platform"
    );
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute("content", "summary_large_image");
  });

  test("publishes bilingual engineering practices pages", async ({ page }) => {
    await page.goto("/en/engineering");
    await expect(page.getByRole("heading", { level: 1, name: "Engineering Practices" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Local-first processing" })).toBeVisible();
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      "https://codemind-graph.vercel.app/en/engineering"
    );

    await page.getByRole("link", { name: "繁體中文" }).click();
    await expect(page).toHaveURL(/\/zh-TW\/engineering$/);
    await expect(page.getByRole("heading", { level: 1, name: "工程實踐" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Local-first Processing" })).toBeVisible();
  });

  test("publishes Vincent Liu digital business card pages", async ({ page }) => {
    await page.goto("/en/vincent-liu");

    await expect(page.getByRole("heading", { level: 1, name: "Vincent Liu" })).toBeVisible();
    await expect(page.getByRole("img", { name: "Portrait of Vincent Liu" })).toHaveAttribute(
      "src",
      "/vincent-liu/portrait.jpg"
    );
    await expect(page.locator(".profile-copy .profile-role")).toHaveText("AI Workflow Architect");
    await expect(page.getByRole("link", { name: "Email Vincent" })).toHaveAttribute(
      "href",
      "mailto:a0933881062@gmail.com"
    );
    await expect(page.getByRole("link", { name: "CodeMind Graph" }).last()).toHaveAttribute(
      "href",
      "https://codemind-graph.vercel.app"
    );
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      "https://codemind-graph.vercel.app/en/vincent-liu"
    );

    await page.getByRole("link", { name: "繁體中文" }).click();
    await expect(page).toHaveURL(/\/zh-TW\/vincent-liu$/);
    await expect(page.locator(".profile-copy .profile-role")).toHaveText("AI 工作流架構師");
    await expect(page.getByRole("heading", { name: "代表專案" })).toBeVisible();
  });
});

test.describe("CodeMind Graph SEO endpoints", () => {
  test("serves sitemap entries for both locales", async ({ request }) => {
    const response = await request.get("/sitemap.xml");
    const body = await response.text();

    expect(response.ok()).toBe(true);
    expect(body).toContain("https://codemind-graph.vercel.app/en");
    expect(body).toContain("https://codemind-graph.vercel.app/zh-TW");
    expect(body).toContain("https://codemind-graph.vercel.app/en/engineering");
    expect(body).toContain("https://codemind-graph.vercel.app/zh-TW/engineering");
    expect(body).toContain("https://codemind-graph.vercel.app/en/vincent-liu");
    expect(body).toContain("https://codemind-graph.vercel.app/zh-TW/vincent-liu");
    expect(body).toContain('hreflang="en"');
    expect(body).toContain('hreflang="zh-TW"');
  });

  test("serves robots rules for public landing pages", async ({ request }) => {
    const response = await request.get("/robots.txt");
    const body = await response.text();

    expect(response.ok()).toBe(true);
    expect(body).toContain("Allow: /en");
    expect(body).toContain("Allow: /zh-TW");
    expect(body).toContain("Allow: /en/engineering");
    expect(body).toContain("Allow: /zh-TW/engineering");
    expect(body).toContain("Allow: /en/vincent-liu");
    expect(body).toContain("Allow: /zh-TW/vincent-liu");
    expect(body).toContain("Disallow: /.codemind/");
    expect(body).toContain("Disallow: /docs/");
    expect(body).toContain("Sitemap: https://codemind-graph.vercel.app/sitemap.xml");
  });
});

test.describe("CodeMind Graph visual baselines", () => {
  test("captures the desktop English landing page", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "Desktop baseline runs only in the desktop project.");

    await page.goto("/en");
    await expect(page).toHaveScreenshot("home-en-desktop.png", {
      animations: "disabled",
      fullPage: true,
      maxDiffPixelRatio: 0.02,
    });
  });

  test("captures the mobile Traditional Chinese landing page", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-mobile", "Mobile baseline runs only in the mobile project.");

    await page.goto("/zh-TW");
    await expect(page).toHaveScreenshot("home-zh-tw-mobile.png", {
      animations: "disabled",
      fullPage: true,
      maxDiffPixelRatio: 0.02,
    });
  });
});
