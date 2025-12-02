#!/bin/bash

# 🧪 Script de Prueba de APIs
# Prueba todas las APIs principales del sistema

set -e

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuración
BASE_URL="${BASE_URL:-http://localhost:4321}"
PASSED=0
FAILED=0

echo "🚀 Iniciando pruebas de APIs..."
echo "📍 Base URL: $BASE_URL"
echo ""

# Función para hacer requests
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local expected_status=${4:-200}
    local description=$5

    echo -n "Testing: $description... "

    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint" || echo -e "\n000")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$BASE_URL$endpoint" || echo -e "\n000")
    fi

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    if [ "$http_code" = "$expected_status" ]; then
        echo -e "${GREEN}✓ PASSED${NC} (Status: $http_code)"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAILED${NC} (Expected: $expected_status, Got: $http_code)"
        echo "  Response: $body"
        ((FAILED++))
        return 1
    fi
}

# 1. Health Check - Página principal
test_endpoint "GET" "/" "" "301" "Home redirect"

# 2. API: Obtener slots disponibles
test_endpoint "GET" "/api/appointments/available?start=$(date +%Y-%m-%d)" "" "200" "Get available slots"

# 3. API: Verificar slot específico (necesita un slotId real)
# test_endpoint "GET" "/api/appointments/check-slot?slotId=test-id" "" "404" "Check slot (expected 404)"

# 4. API: Obtener propiedades
test_endpoint "GET" "/api/properties" "" "200" "Get properties"

# 5. API: EasyBroker properties
test_endpoint "GET" "/api/easybroker/properties?limit=5" "" "200" "Get EasyBroker properties"

# 6. API: Crear cita (necesita datos válidos)
# Primero obtenemos un slot disponible
SLOTS_RESPONSE=$(curl -s "$BASE_URL/api/appointments/available?start=$(date +%Y-%m-%d)")
FIRST_SLOT=$(echo "$SLOTS_RESPONSE" | grep -o '"date":"[^"]*"' | head -1 | cut -d'"' -f4 || echo "")
FIRST_TIME=$(echo "$SLOTS_RESPONSE" | grep -o '"time":"[^"]*"' | head -1 | cut -d'"' -f4 || echo "")

if [ -n "$FIRST_SLOT" ] && [ -n "$FIRST_TIME" ]; then
    APPOINTMENT_DATA=$(cat <<EOF
{
    "date": "$FIRST_SLOT",
    "time": "$FIRST_TIME",
    "name": "Test User",
    "email": "test@example.com",
    "phone": "5551234567",
    "operationType": "rentar",
    "budgetRentar": "5000-10000"
}
EOF
)
    test_endpoint "POST" "/api/appointments" "$APPOINTMENT_DATA" "200|201" "Create appointment"
else
    echo -e "${YELLOW}⚠ SKIPPED${NC}: Create appointment (no slots available)"
fi

# 7. API: CRM - Lista de citas (puede requerir auth)
test_endpoint "GET" "/api/crm/appointments-list" "" "200|401" "Get CRM appointments list"

# 8. API: Auth - Check session
test_endpoint "GET" "/api/auth/check-session" "" "200|401" "Check auth session"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Resumen de Pruebas:"
echo -e "  ${GREEN}✓ Passed: $PASSED${NC}"
echo -e "  ${RED}✗ Failed: $FAILED${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ Todas las pruebas pasaron!${NC}"
    exit 0
else
    echo -e "${RED}❌ Algunas pruebas fallaron${NC}"
    exit 1
fi

