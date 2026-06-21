#!/bin/bash

set -euo pipefail

DB_PORT="${DB_PORT:-${POSTGRES_PORT:-5432}}"
BACKEND_PORT="${BACKEND_PORT:-3001}"
FRONTEND_PORT="${FRONTEND_PORT:-5173}"
API_TARGET="http://localhost:${BACKEND_PORT}"
FRONTEND_ORIGIN="http://localhost:${FRONTEND_PORT}"

echo "=========================================="
echo "  图书馆古籍修复排程系统 - 启动脚本"
echo "=========================================="
echo ""

echo "[1/5] 检查环境..."
if ! command -v docker &> /dev/null; then
    echo "❌ 错误: 未安装 Docker，请先安装 Docker"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未安装 Node.js，请先安装 Node.js 18+"
    exit 1
fi

NODE_VERSION=$(node -v)
echo "✅ Node.js 版本: $NODE_VERSION"
echo "✅ Docker 已就绪"
echo ""

echo "[2/5] 启动 PostgreSQL 数据库..."
POSTGRES_PORT="$DB_PORT" docker-compose up -d postgres
echo "⏳ 等待数据库初始化..."
sleep 10

DB_READY=$(docker exec ancient-book-db pg_isready -U librarian -d ancient_books 2>&1)
if echo "$DB_READY" | grep -q "accepting connections"; then
    echo "✅ 数据库启动成功"
else
    echo "⚠️  数据库可能还在初始化，继续等待..."
    sleep 5
fi
echo ""

echo "[3/5] 安装依赖..."
if [ ! -d "node_modules" ]; then
    echo "📦 安装根目录依赖..."
    npm install
fi

if [ ! -d "backend/node_modules" ]; then
    echo "📦 安装后端依赖..."
    npm --prefix backend install
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "📦 安装前端依赖..."
    npm --prefix frontend install
fi
echo "✅ 依赖安装完成"
echo ""

echo "[4/5] 启动后端服务 (端口 3001)..."
DB_PORT="$DB_PORT" PORT="$BACKEND_PORT" BACKEND_PORT="$BACKEND_PORT" FRONTEND_ORIGIN="$FRONTEND_ORIGIN" npm --prefix backend run start:dev &
BACKEND_PID=$!
sleep 5

echo "[5/5] 启动前端服务 (端口 5173)..."
BACKEND_PORT="$BACKEND_PORT" FRONTEND_PORT="$FRONTEND_PORT" PORT="$FRONTEND_PORT" VITE_API_TARGET="$API_TARGET" npm --prefix frontend run dev -- --host 0.0.0.0 &
FRONTEND_PID=$!
sleep 3

echo ""
echo "=========================================="
echo "  🎉 系统启动完成！"
echo "=========================================="
echo ""
echo "📊 服务状态："
echo "   • 数据库: localhost:${DB_PORT}"
echo "   • 后端 API: http://localhost:${BACKEND_PORT}"
echo "   • API 文档: http://localhost:${BACKEND_PORT}/api"
echo "   • 前端界面: http://localhost:${FRONTEND_PORT}"
echo ""
echo "🔑 测试账号："
echo "   • 管理员: admin / admin123"
echo "   • 馆员: librarian1 / lib123"
echo "   • 修复师: restorer1 / res123"
echo "   • 专家: expert1 / exp123"
echo ""
echo "📋 主链路测试步骤："
echo "   1. 使用馆员账号登录，创建修复申请"
echo "   2. 提交申请后自动创建三道工序"
echo "   3. 使用修复师账号依次开始/完成三道工序（需填写材料批号）"
echo "   4. 珍贵古籍自动进入专家评审环节"
echo "   5. 使用专家账号进行评审"
echo "   6. 上传修复前后照片"
echo "   7. 完成修复流程"
echo ""
echo "⚠️  提示：按 Ctrl+C 停止所有服务"
echo "=========================================="

trap "echo '正在停止服务...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; docker-compose down; exit" INT

wait
