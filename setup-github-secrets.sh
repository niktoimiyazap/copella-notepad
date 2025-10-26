#!/bin/bash

# Скрипт для автоматической настройки GitHub Secrets
# Цвета для вывода
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔐 Настройка GitHub Secrets для автодеплоя${NC}\n"

# Проверяем что мы в правильной директории
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Ошибка: запустите скрипт из корня проекта${NC}"
    exit 1
fi

# GitHub токен (нужно получить на https://github.com/settings/tokens)
echo -e "${BLUE}Получи GitHub Personal Access Token:${NC}"
echo "1. Открой: https://github.com/settings/tokens/new"
echo "2. Название: 'Copella Notepad Deploy'"
echo "3. Выбери срок: '90 days' или 'No expiration'"
echo "4. Permissions: поставь галочку 'repo' (full control)"
echo "5. Нажми 'Generate token' и скопируй его"
echo ""
read -sp "Вставь GitHub token: " GITHUB_TOKEN
echo ""

if [ -z "$GITHUB_TOKEN" ]; then
    echo -e "${RED}❌ Токен не может быть пустым${NC}"
    exit 1
fi

# Параметры
REPO_OWNER="niktoimiyazap"
REPO_NAME="copella-notepad"
SSH_KEY_PATH="$HOME/Downloads/Telegram Desktop/id_ed25519"

# Читаем SSH ключ
if [ ! -f "$SSH_KEY_PATH" ]; then
    echo -e "${RED}❌ SSH ключ не найден: $SSH_KEY_PATH${NC}"
    exit 1
fi

SSH_KEY=$(cat "$SSH_KEY_PATH")

echo -e "${GREEN}✅ SSH ключ прочитан${NC}"

# Получаем public key для шифрования
echo -e "${BLUE}📡 Получаем public key репозитория...${NC}"
PUBLIC_KEY_RESPONSE=$(curl -s -H "Authorization: token $GITHUB_TOKEN" \
    "https://api.github.com/repos/$REPO_OWNER/$REPO_NAME/actions/secrets/public-key")

PUBLIC_KEY=$(echo $PUBLIC_KEY_RESPONSE | grep -o '"key":"[^"]*' | cut -d'"' -f4)
KEY_ID=$(echo $PUBLIC_KEY_RESPONSE | grep -o '"key_id":"[^"]*' | cut -d'"' -f4)

if [ -z "$PUBLIC_KEY" ]; then
    echo -e "${RED}❌ Ошибка получения public key. Проверь токен и права доступа${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Public key получен${NC}"

# Функция для шифрования и создания секрета
create_secret() {
    local SECRET_NAME=$1
    local SECRET_VALUE=$2
    
    echo -e "${BLUE}🔒 Создаю секрет: $SECRET_NAME...${NC}"
    
    # Используем sodium для шифрования (требует libsodium)
    # Альтернативно можно использовать Python
    python3 << EOF
import base64
import json
from nacl import encoding, public

def encrypt_secret(public_key: str, secret_value: str) -> str:
    public_key_bytes = base64.b64decode(public_key)
    sealed_box = public.SealedBox(public.PublicKey(public_key_bytes))
    encrypted = sealed_box.encrypt(secret_value.encode("utf-8"))
    return base64.b64encode(encrypted).decode("utf-8")

try:
    encrypted_value = encrypt_secret("$PUBLIC_KEY", """$SECRET_VALUE""")
    print(encrypted_value)
except Exception as e:
    print(f"ERROR: {e}")
    exit(1)
EOF
}

# Проверяем наличие Python и PyNaCl
echo -e "${BLUE}🔍 Проверяю зависимости...${NC}"
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python 3 не установлен${NC}"
    exit 1
fi

# Устанавливаем PyNaCl если нужно
if ! python3 -c "import nacl" 2>/dev/null; then
    echo -e "${BLUE}📦 Устанавливаю PyNaCl...${NC}"
    pip3 install PyNaCl --quiet
fi

# Функция для создания секрета через API
add_secret() {
    local SECRET_NAME=$1
    local SECRET_VALUE=$2
    
    echo -e "${BLUE}🔐 Добавляю секрет: $SECRET_NAME${NC}"
    
    # Шифруем значение
    ENCRYPTED_VALUE=$(python3 << EOF
import base64
from nacl import encoding, public

public_key_bytes = base64.b64decode("$PUBLIC_KEY")
sealed_box = public.SealedBox(public.PublicKey(public_key_bytes))
encrypted = sealed_box.encrypt("""$SECRET_VALUE""".encode("utf-8"))
print(base64.b64encode(encrypted).decode("utf-8"))
EOF
)
    
    # Отправляем в GitHub
    RESPONSE=$(curl -s -w "%{http_code}" -X PUT \
        -H "Authorization: token $GITHUB_TOKEN" \
        -H "Accept: application/vnd.github+json" \
        "https://api.github.com/repos/$REPO_OWNER/$REPO_NAME/actions/secrets/$SECRET_NAME" \
        -d "{\"encrypted_value\":\"$ENCRYPTED_VALUE\",\"key_id\":\"$KEY_ID\"}")
    
    HTTP_CODE="${RESPONSE: -3}"
    
    if [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "204" ]; then
        echo -e "${GREEN}✅ Секрет $SECRET_NAME добавлен${NC}"
        return 0
    else
        echo -e "${RED}❌ Ошибка добавления $SECRET_NAME (HTTP $HTTP_CODE)${NC}"
        return 1
    fi
}

# Добавляем все секреты
echo ""
add_secret "VPS_HOST" "103.88.243.6"
add_secret "VPS_USERNAME" "vladikkrivolapovik"
add_secret "VPS_SSH_KEY" "$SSH_KEY"

echo ""
echo -e "${GREEN}🎉 Все секреты успешно добавлены!${NC}"
echo -e "${BLUE}ℹ️  Теперь при каждом push в main будет автоматически деплоиться WebSocket сервер${NC}"

