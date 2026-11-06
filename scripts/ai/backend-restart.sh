#!/usr/bin/env sh
# Build + khởi động lại backend local :9500 (Windows / Git Bash) — dùng cho worker Orca và Claude.
#   sh scripts/ai/backend-restart.sh [tham số mvn thêm]
# Chỉ dừng đúng tiến trình java chạy aeoc-backend.jar đang nghe :9500; tiến trình khác giữ cổng -> từ chối (exit 3).
# Thứ tự dừng -> build -> chạy vì Windows khoá file jar đang chạy. Build lỗi thì backend nằm im (exit 1): sửa rồi chạy lại.
set -eu

# Gốc repo: lấy từ git; thư mục không phải git repo thì suy từ vị trí script (scripts/ai/ → ../..)
ROOT=$(git -C "$(dirname "$0")" rev-parse --show-toplevel 2>/dev/null || (cd "$(dirname "$0")/../.." && pwd))
BE="$ROOT/backend"
PORT=${BACKEND_PORT:-9500}
HEALTH="http://localhost:$PORT/api/v3/api-docs"
LOG="$BE/target/backend-run.log"
WAIT_S=${BACKEND_WAIT_S:-180}
mkdir -p "$BE/target"

pid_on_port() { netstat -ano | grep -E "[:.]$PORT[[:space:]].*LISTENING" | awk '{print $NF}' | head -1; }

PID=$(pid_on_port || true)
if [ -n "$PID" ]; then
  CMD=$(powershell -NoProfile -Command "(Get-CimInstance Win32_Process -Filter 'ProcessId=$PID').CommandLine" 2>/dev/null || true)
  case "$CMD" in
    *aeoc-backend.jar*) ;;
    *) echo "backend-restart: :$PORT do tiến trình khác giữ (PID $PID: $CMD) — không dừng" >&2; exit 3 ;;
  esac
  echo "dừng backend PID $PID"
  taskkill //PID "$PID" //F >/dev/null
  i=0; while [ -n "$(pid_on_port || true)" ] && [ $i -lt 30 ]; do i=$((i + 1)); sleep 1; done
fi

echo "build: mvn -q -DskipTests package $*"
if ! (cd "$BE" && mvn -q -DskipTests package "$@" >"$BE/target/backend-build.log" 2>&1); then
  echo "backend-restart: build lỗi — backend đang dừng. 40 dòng cuối:" >&2
  tail -40 "$BE/target/backend-build.log" >&2
  exit 1
fi

# Start-Process tách hẳn khỏi shell của agent: tiến trình nền kiểu `&` có thể bị kill khi lệnh của agent kết thúc.
# stdio của powershell trỏ NUL: java kế thừa handle của powershell, nếu giữ pipe stdout của người gọi thì
# `backend-restart.sh | tail` (hoặc agent bắt output) không bao giờ nhận EOF -> treo dù script đã xong.
BE_WIN=$(cd "$BE" && pwd -W)
powershell -NoProfile -Command "Start-Process -FilePath java -ArgumentList '-jar','app/target/aeoc-backend.jar' \
  -WorkingDirectory '$BE_WIN' -RedirectStandardOutput '$BE_WIN/target/backend-run.log' \
  -RedirectStandardError '$BE_WIN/target/backend-run.err.log' -WindowStyle Hidden" </dev/null >/dev/null 2>&1

i=0
until [ "$(curl -s -o /dev/null -w '%{http_code}' "$HEALTH" || true)" = "200" ]; do
  i=$((i + 2))
  if [ $i -ge "$WAIT_S" ]; then
    echo "backend-restart: quá ${WAIT_S}s chưa lên. 40 dòng cuối log:" >&2
    tail -40 "$LOG" >&2; tail -10 "$BE/target/backend-run.err.log" >&2 || true
    exit 1
  fi
  sleep 2
done
echo "backend sẵn sàng ($HEALTH 200, ${i}s)"
grep -E "Migrating schema|Successfully applied|is up to date|Validated [0-9]+ migrations" "$LOG" | tail -5 || true
