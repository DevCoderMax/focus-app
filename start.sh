#!/usr/bin/env bash
set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

cleanup() {
    echo ""
    echo -e "${YELLOW}Parando servidores...${NC}"
    kill $API_PID $FRONT_PID 2>/dev/null
    wait $API_PID $FRONT_PID 2>/dev/null
    echo -e "${GREEN}Servidores encerrados.${NC}"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Verificar se o venv existe
VENV_PATH="backend/.venv"
if [ ! -d "$VENV_PATH" ]; then
    echo -e "${RED}Virtualenv não encontrado em $VENV_PATH${NC}"
    echo "Execute: cd backend && python -m venv .venv && .venv/bin/pip install -r requirements.txt"
    exit 1
fi

# Verificar se node_modules existe
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Instalando dependências do frontend...${NC}"
    npm install
fi

echo -e "${GREEN}Iniciando API (porta 8000)...${NC}"
$VENV_PATH/bin/python -m uvicorn app.main:app --app-dir backend --reload --port 8000 &
API_PID=$!

echo -e "${GREEN}Iniciando Frontend (porta 5173)...${NC}"
npx vite --host &
FRONT_PID=$!

echo ""
echo -e "${GREEN}==============================${NC}"
echo -e "${GREEN}  FOCUS rodando!${NC}"
echo -e "${GREEN}  Frontend: http://localhost:5173${NC}"
echo -e "${GREEN}  API:      http://localhost:8000${NC}"
echo -e "${GREEN}==============================${NC}"
echo -e "${YELLOW}  Ctrl+C para parar${NC}"
echo ""

wait
