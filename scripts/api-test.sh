#!/usr/bin/env bash
# Layer 3: API 엔드포인트 테스트
# 실행: bash scripts/api-test.sh

BASE="http://localhost:3000"
PASS=0
FAIL=0
COOKIE_JAR=/tmp/intendex_test_cookies.txt
ADMIN_JAR=/tmp/intendex_admin_cookies.txt

ok()   { echo "  ✓ $1"; ((PASS++)); }
fail() { echo "  ✗ $1"; echo "    응답: $2"; ((FAIL++)); }

section() { echo; echo "── $1 ──"; }

# NextAuth CSRF 토큰 + 로그인 → 세션 쿠키 저장
do_login() {
  local jar="$1" email="$2" password="$3"
  rm -f "$jar"
  # CSRF 토큰 획득
  local csrf
  csrf=$(curl -s -c "$jar" "$BASE/api/auth/csrf" \
    | grep -o '"csrfToken":"[^"]*"' | cut -d'"' -f4)
  # 로그인 (302 redirect 따라가지 않음 — 쿠키만 저장)
  curl -s -b "$jar" -c "$jar" -o /dev/null \
    -X POST "$BASE/api/auth/callback/credentials" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "email=${email}&password=${password}&csrfToken=${csrf}&callbackUrl=%2F&json=true"
}

# ──────────────────────────────────────────────────────────────────────
# 1. /api/register  POST
# ──────────────────────────────────────────────────────────────────────
section "1. 회원가입"

TEST_EMAIL="test_$(date +%s)@example.com"

# 성공 → 200 (register route가 200 반환)
RES=$(curl -s -w "\n%{http_code}" -X POST "$BASE/api/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"Test1234!\",\"name\":\"테스터\"}")
HTTP=$(echo "$RES" | tail -1)
BODY=$(echo "$RES" | head -1)

if [ "$HTTP" = "200" ] && echo "$BODY" | grep -q "success"; then
  ok "POST /api/register → 200 {success:true}"
else
  fail "POST /api/register → HTTP $HTTP" "$BODY"
fi

# 중복 가입 → 400
RES2=$(curl -s -w "\n%{http_code}" -X POST "$BASE/api/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"Test1234!\",\"name\":\"중복\"}")
HTTP2=$(echo "$RES2" | tail -1)
BODY2=$(echo "$RES2" | head -1)
if [ "$HTTP2" = "400" ] && echo "$BODY2" | grep -q "이미 가입"; then
  ok "POST /api/register 중복 → 400 (이미 가입된 이메일)"
else
  fail "POST /api/register 중복 → HTTP $HTTP2" "$BODY2"
fi

# 유효성 오류 → 400
HTTP3=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"notanemail","password":"123","name":""}')
if [ "$HTTP3" = "400" ]; then
  ok "POST /api/register 유효성 오류 → 400"
else
  fail "POST /api/register 유효성 오류 → 기대 400, 실제 $HTTP3"
fi

# ──────────────────────────────────────────────────────────────────────
# 2. NextAuth 로그인 → 세션 쿠키 획득
# ──────────────────────────────────────────────────────────────────────
section "2. 로그인"

do_login "$COOKIE_JAR" "$TEST_EMAIL" "Test1234!"

SESSION=$(curl -s -b "$COOKIE_JAR" "$BASE/api/auth/session")
if echo "$SESSION" | grep -q "\"email\""; then
  ok "로그인 후 GET /api/auth/session → 세션 확인 (email 포함)"
else
  fail "로그인 세션" "$SESSION"
fi

# ──────────────────────────────────────────────────────────────────────
# 3. 인증 필요 API — 미인증 접근 → 401
# ──────────────────────────────────────────────────────────────────────
section "3. 미인증 접근 거부"

for ENDPOINT in "/api/intents" "/api/matches" "/api/rewards"; do
  HTTP=$(curl -s -o /dev/null -w "%{http_code}" "$BASE$ENDPOINT")
  if [ "$HTTP" = "401" ] || [ "$HTTP" = "403" ]; then
    ok "GET $ENDPOINT (미인증) → $HTTP"
  else
    fail "GET $ENDPOINT (미인증) → 기대 401/403, 실제 $HTTP"
  fi
done

# ──────────────────────────────────────────────────────────────────────
# 4. 인증 후 API 접근
# ──────────────────────────────────────────────────────────────────────
section "4. 인증 후 데이터 접근"

# 잔액 — 가입 보너스 5000P 확인
BALANCE_RES=$(curl -s -b "$COOKIE_JAR" "$BASE/api/rewards")
if echo "$BALANCE_RES" | grep -q '"balance"'; then
  POINTS=$(echo "$BALANCE_RES" | grep -o '"balance":[0-9]*' | cut -d':' -f2)
  if [ "$POINTS" = "5000" ]; then
    ok "GET /api/rewards → balance=5000 (가입 보너스 정상)"
  else
    ok "GET /api/rewards → balance=$POINTS (응답 정상)"
  fi
else
  fail "GET /api/rewards" "$BALANCE_RES"
fi

# 인텐트 목록
INTENTS_RES=$(curl -s -b "$COOKIE_JAR" "$BASE/api/intents")
if echo "$INTENTS_RES" | grep -q '"intents"'; then
  ok "GET /api/intents → intents 배열 반환"
else
  fail "GET /api/intents" "$INTENTS_RES"
fi

# 매칭 목록
MATCHES_RES=$(curl -s -b "$COOKIE_JAR" "$BASE/api/matches")
if echo "$MATCHES_RES" | grep -qE '"matches"|"pending"|\[\]'; then
  ok "GET /api/matches → matches 응답 반환"
else
  fail "GET /api/matches" "$MATCHES_RES"
fi

# ──────────────────────────────────────────────────────────────────────
# 5. 어드민 권한 검증
# ──────────────────────────────────────────────────────────────────────
section "5. 어드민 권한"

# 일반 사용자 → 403
ADMIN_HTTP=$(curl -s -o /dev/null -w "%{http_code}" -b "$COOKIE_JAR" "$BASE/api/admin/users")
if [ "$ADMIN_HTTP" = "403" ]; then
  ok "GET /api/admin/users (일반 사용자) → 403"
else
  fail "GET /api/admin/users (일반 사용자) → 기대 403, 실제 $ADMIN_HTTP"
fi

# 어드민 로그인 후 접근
do_login "$ADMIN_JAR" "admin@intendex.kr" "admin1234"
ADMIN_HTTP2=$(curl -s -o /dev/null -w "%{http_code}" -b "$ADMIN_JAR" "$BASE/api/admin/users")
if [ "$ADMIN_HTTP2" = "200" ]; then
  ok "GET /api/admin/users (어드민) → 200"
else
  fail "GET /api/admin/users (어드민) → 기대 200, 실제 $ADMIN_HTTP2"
fi

# 어드민 캠페인 목록
CAMP_HTTP=$(curl -s -o /dev/null -w "%{http_code}" -b "$ADMIN_JAR" "$BASE/api/admin/campaigns")
if [ "$CAMP_HTTP" = "200" ]; then
  ok "GET /api/admin/campaigns (어드민) → 200"
else
  fail "GET /api/admin/campaigns (어드민) → 기대 200, 실제 $CAMP_HTTP"
fi

# ──────────────────────────────────────────────────────────────────────
# 결과 요약
# ──────────────────────────────────────────────────────────────────────
echo
echo "══════════════════════════════"
echo "  Layer 3 결과: ✓ ${PASS}개 통과 / ✗ ${FAIL}개 실패"
echo "══════════════════════════════"
[ "$FAIL" -eq 0 ] && exit 0 || exit 1
