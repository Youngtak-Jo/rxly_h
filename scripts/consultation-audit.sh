#!/usr/bin/env bash
set -u

BASE_URL="${BASE_URL:-http://localhost:3000}"
AUTH_COOKIE="${RXLY_COOKIE:-}"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

PASS_COUNT=0
FAIL_COUNT=0
SKIP_COUNT=0

CRUD_RESULTS=()
DB_RESULTS=()
UI_RESULTS=()
OPT_RESULTS=()

append_result() {
  local section="$1"
  local line="$2"
  case "$section" in
    CRUD) CRUD_RESULTS+=("$line") ;;
    DB) DB_RESULTS+=("$line") ;;
    UI) UI_RESULTS+=("$line") ;;
    OPT) OPT_RESULTS+=("$line") ;;
  esac
}

record_pass() {
  local section="$1"
  local name="$2"
  PASS_COUNT=$((PASS_COUNT + 1))
  append_result "$section" "- [PASS] ${name}"
}

record_fail() {
  local section="$1"
  local name="$2"
  local detail="$3"
  FAIL_COUNT=$((FAIL_COUNT + 1))
  append_result "$section" "- [FAIL] ${name} (${detail})"
}

record_skip() {
  local section="$1"
  local name="$2"
  local reason="$3"
  SKIP_COUNT=$((SKIP_COUNT + 1))
  append_result "$section" "- [SKIP] ${name} (${reason})"
}

status_request() {
  local body_file="$1"
  shift
  curl -sS -o "$body_file" -w "%{http_code}" "$@" || echo "000"
}

json_field() {
  local file="$1"
  local key="$2"
  node -e "
    const fs = require('fs')
    try {
      const data = JSON.parse(fs.readFileSync(process.argv[1], 'utf8'))
      const value = data[process.argv[2]]
      if (value === undefined || value === null) process.exit(1)
      process.stdout.write(String(value))
    } catch {
      process.exit(1)
    }
  " "$file" "$key"
}

check_status() {
  local section="$1"
  local name="$2"
  local expected="$3"
  shift 3
  local body_file="$TMP_DIR/body_$(date +%s%N).json"
  local status
  status="$(status_request "$body_file" "$@")"
  if [[ "$status" == "$expected" ]]; then
    record_pass "$section" "$name"
    return 0
  fi
  record_fail "$section" "$name" "expected ${expected}, got ${status}"
  return 1
}

auth_header_args=()
if [[ -n "$AUTH_COOKIE" ]]; then
  auth_header_args=(-H "Cookie: ${AUTH_COOKIE}")
fi

# --- Unauthorized / baseline checks ---
check_status "CRUD" "Unauth POST /api/deepgram/token -> 401" "401" \
  -X POST "${BASE_URL}/api/deepgram/token"
check_status "DB" "Unauth GET /api/db-health -> 401" "401" \
  "${BASE_URL}/api/db-health"
check_status "CRUD" "Unauth GET /api/icd11/search?q=flu -> 401" "401" \
  "${BASE_URL}/api/icd11/search?q=flu"
check_status "UI" "GET /consultation redirects when unauth -> 307" "307" \
  -I "${BASE_URL}/consultation"

if [[ -z "$AUTH_COOKIE" ]]; then
  record_skip "CRUD" "Authenticated CRUD suite" "set RXLY_COOKIE"
  record_skip "DB" "Wrong admin key /api/db-health -> 403" "set RXLY_COOKIE"
  record_skip "OPT" "Deepgram temporary token payload check" "set RXLY_COOKIE"
else
  # --- Authenticated checks ---
  check_status "DB" "Wrong admin key /api/db-health -> 403" "403" \
    "${auth_header_args[@]}" -H "x-db-health-key: invalid" "${BASE_URL}/api/db-health"

  # Create session
  create_body="$TMP_DIR/create_session.json"
  create_status="$(status_request "$create_body" "${auth_header_args[@]}" \
    -H "Content-Type: application/json" \
    -X POST "${BASE_URL}/api/sessions" \
    -d '{"title":"Audit Session"}')"
  if [[ "$create_status" != "201" ]]; then
    record_fail "CRUD" "POST /api/sessions create" "expected 201, got ${create_status}"
    SESSION_ID=""
  else
    SESSION_ID="$(json_field "$create_body" "id" 2>/dev/null || true)"
    if [[ -z "$SESSION_ID" ]]; then
      record_fail "CRUD" "POST /api/sessions create" "missing session id"
    else
      record_pass "CRUD" "POST /api/sessions create"
    fi
  fi

  # Token payload shape and type
  token_body="$TMP_DIR/deepgram_token.json"
  token_status="$(status_request "$token_body" "${auth_header_args[@]}" \
    -X POST "${BASE_URL}/api/deepgram/token")"
  if [[ "$token_status" == "200" ]]; then
    token_type="$(json_field "$token_body" "tokenType" 2>/dev/null || true)"
    token_value="$(json_field "$token_body" "token" 2>/dev/null || true)"
    if [[ "$token_type" == "bearer" && -n "$token_value" ]]; then
      record_pass "OPT" "Deepgram temporary token payload (tokenType=bearer)"
    else
      record_fail "OPT" "Deepgram temporary token payload (tokenType=bearer)" "invalid payload"
    fi
  else
    record_fail "OPT" "Deepgram temporary token payload (tokenType=bearer)" "status ${token_status}"
  fi

  if [[ -n "$SESSION_ID" ]]; then
    check_status "CRUD" "GET /api/sessions list" "200" \
      "${auth_header_args[@]}" "${BASE_URL}/api/sessions"
    check_status "CRUD" "GET /api/sessions/:id" "200" \
      "${auth_header_args[@]}" "${BASE_URL}/api/sessions/${SESSION_ID}"
    check_status "CRUD" "PATCH /api/sessions/:id" "200" \
      "${auth_header_args[@]}" -H "Content-Type: application/json" \
      -X PATCH "${BASE_URL}/api/sessions/${SESSION_ID}" \
      -d '{"title":"Audit Session Updated"}'

    check_status "CRUD" "POST /api/sessions/:id/transcript" "201" \
      "${auth_header_args[@]}" -H "Content-Type: application/json" \
      -X POST "${BASE_URL}/api/sessions/${SESSION_ID}/transcript" \
      -d '{"speaker":"DOCTOR","text":"hello","startTime":0.1,"endTime":0.2,"confidence":0.9}'
    check_status "CRUD" "GET /api/sessions/:id/transcript" "200" \
      "${auth_header_args[@]}" "${BASE_URL}/api/sessions/${SESSION_ID}/transcript"

    check_status "CRUD" "POST /api/sessions/:id/notes" "201" \
      "${auth_header_args[@]}" -H "Content-Type: application/json" \
      -X POST "${BASE_URL}/api/sessions/${SESSION_ID}/notes" \
      -d '{"content":"note","imageUrls":[],"storagePaths":[]}'
    check_status "OPT" "GET /api/sessions/:id/notes?includeSignedUrls=false" "200" \
      "${auth_header_args[@]}" "${BASE_URL}/api/sessions/${SESSION_ID}/notes?includeSignedUrls=false"

    check_status "CRUD" "PUT /api/sessions/:id/insights" "200" \
      "${auth_header_args[@]}" -H "Content-Type: application/json" \
      -X PUT "${BASE_URL}/api/sessions/${SESSION_ID}/insights" \
      -d '{"summary":"s","keyFindings":[],"redFlags":[],"checklistItems":[]}'
    check_status "CRUD" "PUT /api/sessions/:id/diagnoses" "200" \
      "${auth_header_args[@]}" -H "Content-Type: application/json" \
      -X PUT "${BASE_URL}/api/sessions/${SESSION_ID}/diagnoses" \
      -d '{"diagnoses":[]}'
    check_status "CRUD" "PUT /api/sessions/:id/record" "200" \
      "${auth_header_args[@]}" -H "Content-Type: application/json" \
      -X PUT "${BASE_URL}/api/sessions/${SESSION_ID}/record" \
      -d '{"patientName":"P","chiefComplaint":"C"}'
    check_status "CRUD" "PUT /api/sessions/:id/patient-handout" "200" \
      "${auth_header_args[@]}" -H "Content-Type: application/json" \
      -X PUT "${BASE_URL}/api/sessions/${SESSION_ID}/patient-handout" \
      -d '{"language":"en","conditions":[],"entries":[]}'
    check_status "CRUD" "POST /api/sessions/:id/research" "200" \
      "${auth_header_args[@]}" -H "Content-Type: application/json" \
      -X POST "${BASE_URL}/api/sessions/${SESSION_ID}/research" \
      -d '{"messages":[{"role":"user","content":"q","citations":[]},{"role":"assistant","content":"a","citations":[]}]}'
    check_status "CRUD" "DELETE /api/sessions/:id/research" "200" \
      "${auth_header_args[@]}" -X DELETE "${BASE_URL}/api/sessions/${SESSION_ID}/research"
    check_status "CRUD" "DELETE /api/sessions/:id" "200" \
      "${auth_header_args[@]}" -X DELETE "${BASE_URL}/api/sessions/${SESSION_ID}"
  fi
fi

echo "## Consultation Audit Report"
echo
echo "- Base URL: ${BASE_URL}"
echo "- Timestamp (UTC): $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo "- Summary: PASS=${PASS_COUNT}, FAIL=${FAIL_COUNT}, SKIP=${SKIP_COUNT}"
echo
echo "### CRUD 로직"
if [[ ${#CRUD_RESULTS[@]} -eq 0 ]]; then
  echo "- (no checks)"
else
  printf "%s\n" "${CRUD_RESULTS[@]}"
fi
echo
echo "### DB 연결"
if [[ ${#DB_RESULTS[@]} -eq 0 ]]; then
  echo "- (no checks)"
else
  printf "%s\n" "${DB_RESULTS[@]}"
fi
echo
echo "### UI 흐름"
if [[ ${#UI_RESULTS[@]} -eq 0 ]]; then
  echo "- (no checks)"
else
  printf "%s\n" "${UI_RESULTS[@]}"
fi
echo
echo "### 최적화"
if [[ ${#OPT_RESULTS[@]} -eq 0 ]]; then
  echo "- (no checks)"
else
  printf "%s\n" "${OPT_RESULTS[@]}"
fi

if [[ "$FAIL_COUNT" -gt 0 ]]; then
  exit 1
fi
