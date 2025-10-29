#!/bin/bash

ROOM_ID="cmh7v9zi70001ib04j0ixinv4"
TOKEN=$(cat .dev-token 2>/dev/null || echo "test-token")

echo "🔍 Тестирование производительности загрузки комнаты..."
echo "Room ID: $ROOM_ID"
echo ""

# 1. GET /api/rooms/{id}
echo "1️⃣ GET /api/rooms/$ROOM_ID"
TIME1=$(curl -s -w "%{time_total}" -o /dev/null \
  "http://localhost:5173/api/rooms/$ROOM_ID" \
  -H "Cookie: session_token=$TOKEN" 2>/dev/null)
echo "   ⏱️  Time: ${TIME1}s"
echo ""

# 2. GET /api/rooms/{id}/notes
echo "2️⃣ GET /api/rooms/$ROOM_ID/notes"
TIME2=$(curl -s -w "%{time_total}" -o /dev/null \
  "http://localhost:5173/api/rooms/$ROOM_ID/notes" \
  -H "Cookie: session_token=$TOKEN" 2>/dev/null)
echo "   ⏱️  Time: ${TIME2}s"
echo ""

# 3. GET /api/rooms/{id}/participants  
echo "3️⃣ GET /api/rooms/$ROOM_ID/participants"
TIME3=$(curl -s -w "%{time_total}" -o /dev/null \
  "http://localhost:5173/api/rooms/$ROOM_ID/participants" \
  -H "Cookie: session_token=$TOKEN" 2>/dev/null)
echo "   ⏱️  Time: ${TIME3}s"
echo ""

# 4. GET /api/auth/me
echo "4️⃣ GET /api/auth/me"
TIME4=$(curl -s -w "%{time_total}" -o /dev/null \
  "http://localhost:5173/api/auth/me" \
  -H "Cookie: session_token=$TOKEN" 2>/dev/null)
echo "   ⏱️  Time: ${TIME4}s"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 ИТОГО:"
TOTAL=$(echo "$TIME1 + $TIME2 + $TIME3 + $TIME4" | bc)
echo "   Общее время API запросов: ${TOTAL}s"
echo ""

# Проверяем что тормозит больше всего
SLOW=""
if (( $(echo "$TIME1 > 1.0" | bc -l) )); then SLOW="${SLOW}Room endpoint, "; fi
if (( $(echo "$TIME2 > 1.0" | bc -l) )); then SLOW="${SLOW}Notes endpoint, "; fi
if (( $(echo "$TIME3 > 1.0" | bc -l) )); then SLOW="${SLOW}Participants endpoint, "; fi

if [ -n "$SLOW" ]; then
  echo "⚠️  Медленные эндпоинты: ${SLOW%??}"
else
  echo "✅ Все эндпоинты работают быстро!"
fi
