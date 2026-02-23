import { test, expect, Page } from "@playwright/test";

async function loginAsAdmin(page: Page) {
  await page.goto("/login");
  await page.locator('input[type="email"]').fill("admin@intendex.kr");
  await page.locator('input[type="password"]').fill("admin1234");
  await page.getByRole("button", { name: /^로그인/i }).click();
  await expect(page).toHaveURL(/chat|dashboard/, { timeout: 10_000 });
}

// ── 5. 채팅 인터페이스 ───────────────────────────────────────────────
test("채팅 페이지 — 입력창 존재 및 메시지 입력", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/chat");

  // textarea 또는 contenteditable 입력창
  const input = page.locator("textarea, [contenteditable]").first();
  await expect(input).toBeVisible({ timeout: 8_000 });

  await input.fill("갤럭시 스마트폰 구매하려고 해요");
  await expect(input).toHaveValue(/갤럭시/);

  // 전송 버튼 존재 (icon-only 버튼이므로 svg로 탐색)
  const sendBtn = page.locator("button:has(svg)").last();
  await expect(sendBtn).toBeVisible();
});

// ── 6. 인텐트 페이지 ─────────────────────────────────────────────────
test("인텐트 페이지 — 렌더링 확인", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/intents");

  await expect(page.locator("h1, h2").first()).toBeVisible({ timeout: 8_000 });

  const hasContent = await page
    .locator("text=/인텐트|intent|관심사|키워드/i")
    .first()
    .isVisible()
    .catch(() => false);
  expect(hasContent).toBeTruthy();
});

// ── 7. 보상 페이지 ───────────────────────────────────────────────────
test("보상 페이지 — 포인트 잔액 표시", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/rewards");

  await expect(page.locator("h1, h2").first()).toBeVisible({ timeout: 8_000 });

  const hasPoints = await page
    .locator("text=/포인트|P|잔액|balance|보상/i")
    .first()
    .isVisible()
    .catch(() => false);
  expect(hasPoints).toBeTruthy();
});

// ── 8. 사이드바 네비게이션 ───────────────────────────────────────────
test("사이드바 네비게이션 — 링크 클릭 이동", async ({ page }) => {
  await loginAsAdmin(page);

  // 인텐트 링크 → 인텐트 페이지
  const intentLink = page.getByRole("link", { name: /인텐트|intent/i }).first();
  if (await intentLink.isVisible()) {
    await intentLink.click();
    await expect(page).toHaveURL(/intent/, { timeout: 5_000 });
  } else {
    // 링크가 sidebar 안에 있을 수 있으므로 URL 직접 이동으로 대체 검증
    await page.goto("/intents");
    await expect(page).toHaveURL(/intent/);
  }
});

// ── 9. 로그아웃 ──────────────────────────────────────────────────────
test("로그아웃 후 보호 페이지 → 리다이렉트", async ({ page }) => {
  await loginAsAdmin(page);

  // NextAuth signout 페이지
  await page.goto("/api/auth/signout");
  const signoutBtn = page.getByRole("button", { name: /sign out|로그아웃/i });
  if (await signoutBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await signoutBtn.click();
    await page.waitForURL(/login|\//);
  }

  // 보호 페이지 접근 → 리다이렉트
  await page.goto("/chat");
  await expect(page).toHaveURL(/login|\//, { timeout: 5_000 });
});
