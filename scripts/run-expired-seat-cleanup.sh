#!/usr/bin/env bash

set -Eeuo pipefail
umask 077

log() {
  printf '%s\n' "[nusagiliboat-seat-cleanup] $*"
}

fail() {
  printf '%s\n' \
    "[nusagiliboat-seat-cleanup] ERROR: $*" \
    >&2
  exit 1
}

for command_name in curl mktemp python3 sed; do
  command -v "${command_name}" >/dev/null 2>&1 ||
    fail "${command_name} is required."
done

CLEANUP_ENDPOINT_URL="${CLEANUP_ENDPOINT_URL:-}"
CRON_SECRET="${CRON_SECRET:-}"

CLEANUP_ENDPOINT_URL="$(
  printf '%s' "${CLEANUP_ENDPOINT_URL}" |
  sed \
    -e 's/^[[:space:]]*//' \
    -e 's/[[:space:]]*$//'
)"

CRON_SECRET="$(
  printf '%s' "${CRON_SECRET}" |
  sed \
    -e 's/^[[:space:]]*//' \
    -e 's/[[:space:]]*$//'
)"

[[ -n "${CLEANUP_ENDPOINT_URL}" ]] ||
  fail "CLEANUP_ENDPOINT_URL is missing."

[[ "${#CRON_SECRET}" -ge 32 ]] ||
  fail "CRON_SECRET must contain at least 32 characters."

[[ "${#CRON_SECRET}" -le 256 ]] ||
  fail "CRON_SECRET exceeds the supported length."

[[ "${CRON_SECRET}" =~ ^[A-Za-z0-9_-]+$ ]] ||
  fail "CRON_SECRET contains unsupported characters."

case "${CLEANUP_ENDPOINT_URL}" in
  https://*)
    ;;

  http://127.0.0.1:*|http://localhost:*)
    ;;

  *)
    fail "Endpoint must use HTTPS except during localhost testing."
    ;;
esac

case "${CLEANUP_ENDPOINT_URL}" in
  */api/internal/expire-held-bookings)
    ;;

  *)
    fail "Endpoint path is invalid."
    ;;
esac

[[ ! "${CLEANUP_ENDPOINT_URL}" =~ [[:space:]] ]] ||
  fail "Endpoint cannot contain whitespace."

CURL_CONFIG="$(
  mktemp "${TMPDIR:-/tmp}/nusagiliboat-cleanup-curl.XXXXXX"
)"

RESPONSE_FILE="$(
  mktemp "${TMPDIR:-/tmp}/nusagiliboat-cleanup-response.XXXXXX"
)"

cleanup_files() {
  rm -f "${CURL_CONFIG}" "${RESPONSE_FILE}"
}

trap cleanup_files EXIT

chmod 600 "${CURL_CONFIG}" "${RESPONSE_FILE}"

printf '%s\n' \
  "header = \"Authorization: Bearer ${CRON_SECRET}\"" \
  > "${CURL_CONFIG}"

log "Starting expired held-seat cleanup request."

set +e

HTTP_CODE="$(
  curl \
    --config "${CURL_CONFIG}" \
    --request POST \
    --silent \
    --show-error \
    --connect-timeout 10 \
    --max-time 60 \
    --retry 2 \
    --retry-delay 2 \
    --retry-connrefused \
    --retry-all-errors \
    --output "${RESPONSE_FILE}" \
    --write-out '%{http_code}' \
    "${CLEANUP_ENDPOINT_URL}"
)"

CURL_EXIT_CODE="$?"

set -e

[[ "${CURL_EXIT_CODE}" -eq 0 ]] ||
  fail "Request failed with curl exit code ${CURL_EXIT_CODE}."

python3 - "${HTTP_CODE}" "${RESPONSE_FILE}" <<'PY'
import json
from pathlib import Path
import sys

try:
    http_code = int(sys.argv[1])
except ValueError:
    print(
        "[nusagiliboat-seat-cleanup] ERROR: Invalid HTTP status.",
        file=sys.stderr,
    )
    raise SystemExit(1)

response_path = Path(sys.argv[2])

try:
    body = json.loads(
        response_path.read_text(encoding="utf-8")
    )
except Exception:
    print(
        "[nusagiliboat-seat-cleanup] ERROR: Response is not valid JSON.",
        file=sys.stderr,
    )
    raise SystemExit(1)

if http_code != 200:
    message = str(
        body.get(
            "error",
            "Cleanup endpoint returned an error.",
        )
    )

    print(
        f"[nusagiliboat-seat-cleanup] ERROR: HTTP {http_code}: {message}",
        file=sys.stderr,
    )
    raise SystemExit(1)

if body.get("success") is not True:
    print(
        "[nusagiliboat-seat-cleanup] ERROR: Endpoint reported success=false.",
        file=sys.stderr,
    )
    raise SystemExit(1)


def integer_value(name: str) -> int:
    value = body.get(name, 0)

    if isinstance(value, bool):
        return 0

    try:
        return int(value)
    except (TypeError, ValueError):
        return 0


scanned = integer_value("scannedRows")
candidates = integer_value("candidateCount")
processed = integer_value("processedCount")
skipped = integer_value("skippedCount")
failed = integer_value("failedCount")

print(
    "[nusagiliboat-seat-cleanup] Cleanup completed successfully."
)

print(
    "[nusagiliboat-seat-cleanup] "
    f"scanned={scanned} "
    f"candidates={candidates} "
    f"processed={processed} "
    f"skipped={skipped} "
    f"failed={failed}"
)

if failed > 0:
    print(
        "[nusagiliboat-seat-cleanup] "
        "ERROR: One or more bookings failed to process.",
        file=sys.stderr,
    )
    raise SystemExit(1)
PY

log "Expired held-seat cleanup request finished."
