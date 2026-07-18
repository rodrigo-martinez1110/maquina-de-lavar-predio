import { expect, test } from "@playwright/test";

test("public login pages render", async ({ page }) => {
  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Entrar no apartamento" })).toBeVisible();
  await expect(page.getByLabel("Apartamento")).toBeVisible();
  await expect(page.getByLabel("PIN")).toBeVisible();

  await page.goto("/admin/login", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Admin" })).toBeVisible();
  await expect(page.getByPlaceholder("Email")).toBeVisible();
  await expect(page.getByPlaceholder("Senha")).toBeVisible();

  await page.goto("/admin", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Admin" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Apartamentos" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Metricas" })).toBeVisible();
});
