#!/bin/bash

echo "🚀 启动前端性能监控平台"

# 检查MongoDB是否运行
if ! pgrep -f mongod > /dev/null; then
    echo "⚠️  MongoDB未运行，请先启动MongoDB"
    echo "   使用Docker: docker run -d -p 27017:27017 --name mongodb mongo:latest"
    echo "   或启动本地服务: mongod"
    exit 1
fi

# 启动后端服务
echo "📡 启动后端服务..."
cd server
if [ ! -f .env ]; then
    cp .env.example .env
    echo "📝 已创建.env配置文件，请根据需要修改配置"
fi

npm install
npm run start:dev &
BACKEND_PID=$!

# 等待后端启动
sleep 5

# 启动前端服务
echo "🎨 启动前端服务..."
cd ../frontend
npm install
npm run dev &
FRONTEND_PID=$!

echo "✅ 服务启动完成!"
echo "   后端地址: http://localhost:3000"
echo "   前端地址: http://localhost:5173"
echo ""
echo "按 Ctrl+C 停止所有服务"

# 等待用户中断
trap "echo '🛑 正在停止服务...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait