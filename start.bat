@echo off
REM 大模型安全检测工具 - Windows启动脚本
echo ========================================
echo 大模型安全检测工具 - 启动脚本
echo ========================================
echo.

REM 检查Docker是否安装
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] Docker未安装,请先安装Docker Desktop
    echo 下载地址: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

echo [1/6] 检查Docker环境... ✅
echo.

REM 检查Docker是否运行
docker ps >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] Docker未运行,请启动Docker Desktop
    pause
    exit /b 1
)

echo [2/6] Docker运行正常... ✅
echo.

REM 检查docker-compose是否安装
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] Docker Compose未安装
    pause
    exit /b 1
)

echo [3/6] Docker Compose已安装... ✅
echo.

REM 停止旧容器
echo [4/6] 停止旧容器...
docker-compose down
echo      旧容器已停止 ✅
echo.

REM 构建和启动容器
echo [5/6] 构建和启动容器...
echo 这可能需要几分钟,请耐心等待...
echo.
docker-compose up -d --build

if %errorlevel% neq 0 (
    echo [错误] 容器启动失败
    pause
    exit /b 1
)

echo      容器启动成功 ✅
echo.

REM 等待服务启动
echo [6/6] 等待服务启动...
timeout /t 10 /nobreak >nul

echo      服务启动完成 ✅
echo.

REM 显示服务状态
echo ========================================
echo 服务状态:
echo ========================================
docker-compose ps
echo.

echo ========================================
echo 🎉 启动成功!
echo ========================================
echo.
echo 📊 服务地址:
echo    • 前端界面:    http://localhost:3000
echo    • 后端API:     http://localhost:8000
echo    • API文档:     http://localhost:8000/docs
echo    • Prometheus:  http://localhost:9090
echo    • Grafana:     http://localhost:3001 (admin/admin2024)
echo.
echo 💡 提示:
echo    • 使用 "docker-compose logs -f" 查看实时日志
echo    • 使用 "docker-compose down" 停止所有服务
echo    • 使用 "docker-compose restart" 重启服务
echo.

pause
