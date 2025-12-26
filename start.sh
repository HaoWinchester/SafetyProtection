#!/bin/bash

# 大模型安全检测工具 - Linux/Mac启动脚本

set -e

echo "========================================"
echo "大模型安全检测工具 - 启动脚本"
echo "========================================"
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo -e "${RED}[错误] Docker未安装,请先安装Docker${NC}"
    echo "下载地址: https://www.docker.com/products/docker-desktop"
    exit 1
fi

echo -e "${GREEN}[1/6] 检查Docker环境... ✅${NC}"
echo ""

# 检查Docker是否运行
if ! docker ps &> /dev/null; then
    echo -e "${RED}[错误] Docker未运行,请启动Docker${NC}"
    exit 1
fi

echo -e "${GREEN}[2/6] Docker运行正常... ✅${NC}"
echo ""

# 检查docker-compose是否安装
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}[错误] Docker Compose未安装${NC}"
    exit 1
fi

echo -e "${GREEN}[3/6] Docker Compose已安装... ✅${NC}"
echo ""

# 停止旧容器
echo -e "${YELLOW}[4/6] 停止旧容器...${NC}"
docker-compose down
echo -e "     旧容器已停止 ✅"
echo ""

# 构建和启动容器
echo -e "${YELLOW}[5/6] 构建和启动容器...${NC}"
echo "这可能需要几分钟,请耐心等待..."
echo ""
docker-compose up -d --build

if [ $? -ne 0 ]; then
    echo -e "${RED}[错误] 容器启动失败${NC}"
    exit 1
fi

echo -e "     容器启动成功 ✅"
echo ""

# 等待服务启动
echo -e "${YELLOW}[6/6] 等待服务启动...${NC}"
sleep 10

echo -e "     服务启动完成 ✅"
echo ""

# 显示服务状态
echo "========================================"
echo "服务状态:"
echo "========================================"
docker-compose ps
echo ""

echo "========================================"
echo -e "${GREEN}🎉 启动成功!${NC}"
echo "========================================"
echo ""
echo "📊 服务地址:"
echo "   • 前端界面:    http://localhost:3000"
echo "   • 后端API:     http://localhost:8000"
echo "   • API文档:     http://localhost:8000/docs"
echo "   • Prometheus:  http://localhost:9090"
echo "   • Grafana:     http://localhost:3001 (admin/admin2024)"
echo ""
echo "💡 提示:"
echo "   • 使用 'docker-compose logs -f' 查看实时日志"
echo "   • 使用 'docker-compose down' 停止所有服务"
echo "   • 使用 'docker-compose restart' 重启服务"
echo ""
