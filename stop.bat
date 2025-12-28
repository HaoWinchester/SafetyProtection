@echo off
REM 大模型安全检测工具 - 停止服务脚本
echo ========================================
echo 大模型安全检测工具 - 停止服务
echo ========================================
echo.

echo [1/2] 停止Docker容器（数据库）...
docker-compose down
echo      Docker容器已停止 ✅
echo.

echo [2/2] 提示：请手动关闭后端和前端的CMD窗口
echo      或者按 Ctrl+C 停止对应服务
echo.

echo ========================================
echo ✅ 停止完成
echo ========================================
echo.
echo 💡 提示：
echo    • Docker数据库服务已停止
echo    • 后端和前端运行在独立的CMD窗口中
echo    • 关闭对应窗口即可完全停止服务
echo.

pause
