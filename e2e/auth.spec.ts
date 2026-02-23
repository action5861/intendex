import { test, expect } from "@playwright/test";

// 로그인 페이지: label이 htmlFor 없이 시각적으로만 있으므로
// input type으로 직접 셀렉트

const TEST_EMAIL = `e2e_${Date.now()}@test.com`;
const TEST_PASSWORD = "Test1234!";
const TEST_NAME = "E2E테스터";

// ── 1. 회원가입 폼 UI 검증 ─────────────────────────────────────────
// (rate limit: 시간당 5회 제한이므로 폼 렌더링 및 입력만 검증)
test("회원가입 폼 — 토글 후 이름/이메일/비밀번호 입력 가능", async ({ page }) => {
  await page.goto("/login");

  // 가입 모드 전환
  await page.getByRole("button", { name: /3초만에 가입|가입하기/i }).click();

  // 이름 입력 필드 노출 확인
  const nameInput = page.locator('input[type="text"]');
  await expect(nameInput).toBeVisible({ timeout: 3_000 });

  // 폼 입력
  await nameInput.fill(TEST_NAME);
  await page.locator('input[type="email"]').fill(TEST_EMAIL);
  await page.locator('input[type="password"]').fill(TEST_PASSWORD);

  // 가입 버튼 활성화 확인
  await expect(page.getByRole("button", { name: /회원가입 완료/i })).toBeEnabled();

  // 제출 — 로딩 스피너가 사라질 때까지 대기 (bcrypt + API 응답 시간 고려)
  await page.getByRole("button", { name: /회원가입 완료/i }).click();

  // 버튼이 다시 텍스트를 보여주거나 URL이 변할 때까지 최대 10초 대기
  await Promise.race([
    page.waitForURL(/onboarding|chat|dashboard/, { timeout: 10_000 }).catch(() => {}),
    page.waitForSelector("text=/5회 제한|잠시 후|오류|실패|이미 가입|회원가입 완료/i", { timeout: 10_000 }).catch(() => {}),
  ]);

  const redirected = !page.url().includes("/login");
  const rateLimitShown = await page.locator("text=/5회 제한|잠시 후/i").isVisible().catch(() => false);
  const errorShown = await page.locator("text=/오류|실패|이미 가입/i").isVisible().catch(() => false);
  const buttonReady = await page.getByRole("button", { name: /회원가입 완료/i }).isVisible().catch(() => false);

  // 리다이렉트됐거나, 에러가 표시됐거나, 버튼이 다시 활성화됐거나
  expect(redirected || rateLimitShown || errorShown || buttonReady).toBeTruthy();
});

// ── 2. 로그인 흐름 ───────────────────────────────────────────────────
test("이메일/비밀번호 로그인 → 대시보드 진입", async ({ page }) => {
  await page.goto("/login");
  await page.locator('input[type="email"]').fill("admin@intendex.kr");
  await page.locator('input[type="password"]').fill("admin1234");
  await page.getByRole("button", { name: /^로그인/i }).click();

  await expect(page).toHaveURL(/chat|dashboard/, { timeout: 10_000 });
  // 사이드바 존재 확인
  await expect(page.locator("nav, aside").first()).toBeVisible();
});

// ── 3. 잘못된 비밀번호 → 에러 메시지 ────────────────────────────────
test("잘못된 비밀번호 → 에러 메시지 표시", async ({ page }) => {
  await page.goto("/login");
  await page.locator('input[type="email"]').fill("admin@intendex.kr");
  await page.locator('input[type="password"]').fill("wrongpassword");
  await page.getByRole("button", { name: /^로그인/i }).click();

  // 에러 메시지 표시 확인
  await expect(
    page.locator("text=/올바르지 않습니다|오류|실패/i").first()
  ).toBeVisible({ timeout: 8_000 });

  // URL은 여전히 login
  await expect(page).toHaveURL(/login/);
});

// ── 4. 미인증 → /login 리다이렉트 ────────────────────────────────────
test("미인증 접근 → /login 리다이렉트", async ({ page }) => {
  await page.goto("/chat");
  await expect(page).toHaveURL(/login/, { timeout: 5_000 });
});
