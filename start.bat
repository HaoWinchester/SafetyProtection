@echo off
REM 大模型安全检测工具 - 快速启动脚本（推荐）
echo ========================================
echo 大模型安全检测工具 - 快速启动
echo ========================================
echo.

REM 检查Docker是否运行
docker ps >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] Docker未运行,请启动Docker Desktop
    pause
    exit /b 1
)

echo [1/3] 启动数据库服务（PostgreSQL + Redis）...
docker-compose up -d postgres redis
timeout /t 3 >nul
echo      数据库服务已启动 ✅
echo.

echo [2/3] 启动后端服务器（端口 8000）...
start "后端服务器-Backend" cmd /k "cd /d %~dp0backend && python simple_server.py"
timeout /t 3 >nul
echo      后端服务器已启动 ✅
echo.

echo [3/3] 启动前端开发服务器（端口 3001）...
start "前端服务器-Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"
timeout /t 5 >nul
echo      前端服务器已启动 ✅
echo.

echo ========================================
echo 🎉 所有服务启动完成！
echo ========================================
echo.
echo 📊 访问地址：
echo   • 前端应用:     http://localhost:3001
echo   • 后端API:      http://localhost:8000
echo   • API文档:      http://localhost:8000/docs
echo   • PostgreSQL:   localhost:5432
echo   • Redis:        localhost:6379
echo.
echo 💡 提示：
echo   • 此脚本只启动数据库容器，前后端应用本地运行
echo   • 启动速度比纯Docker方式快很多（约10秒 vs 2-3分钟）
echo   • 适合开发环境，支持热重载
echo   • 关闭所有窗口即可停止服务
echo.
echo 按任意键关闭此窗口（服务继续运行）...
pause >nul
