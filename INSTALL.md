# 大模型安全检测工具 - 安装部署指南

## 📋 目录

- [系统要求](#系统要求)
- [快速开始](#快速开始)
- [详细安装步骤](#详细安装步骤)
- [数据库配置](#数据库配置)
- [环境变量配置](#环境变量配置)
- [Docker部署](#docker部署)
- [手动部署](#手动部署)
- [验证安装](#验证安装)
- [常见问题](#常见问题)

---

## 系统要求

### 硬件要求
- **CPU**: 4核心及以上
- **内存**: 8GB及以上 (推荐16GB)
- **磁盘**: 50GB可用空间
- **网络**: 稳定的网络连接

### 软件要求

**使用Docker部署 (推荐)**
- Docker 20.10+
- Docker Compose 2.0+

**手动部署**
- Python 3.9+
- Node.js 16+
- PostgreSQL 14+
- Redis 6+
- Git

---

## 快速开始

### 方式1: Docker一键启动 (推荐)

**Windows用户:**
```bash
# 1. 双击运行启动脚本
start.bat

# 或在命令行中运行
.\start.bat
```

**Linux/Mac用户:**
```bash
# 1. 添加执行权限
chmod +x start.sh

# 2. 运行启动脚本
./start.sh
```

### 方式2: Docker手动启动

```bash
# 1. 启动所有服务
docker-compose up -d

# 2. 查看服务状态
docker-compose ps

# 3. 查看日志
docker-compose logs -f

# 4. 停止服务
docker-compose down
```

---

## 详细安装步骤

### 1. 克隆项目

```bash
git clone <repository-url>
cd 安全检测项目
```

### 2. 准备配置文件

#### 复制环境变量文件

**后端:**
```bash
cd backend
cp .env.example .env
# 编辑 .env 文件,配置数据库和Redis连接信息
```

**前端:**
```bash
cd frontend
cp .env.example .env.development
cp .env.example .env.production
# 编辑环境变量文件
```

### 3. 配置数据库

#### 使用Docker (PostgreSQL已包含)

数据库会自动创建,无需手动配置。

#### 使用本地PostgreSQL

```sql
-- 创建数据库
CREATE DATABASE safety_detection_db;

-- 创建用户
CREATE USER safety_user WITH PASSWORD 'safety_pass_2024';

-- 授权
GRANT ALL PRIVILEGES ON DATABASE safety_detection_db TO safety_user;

-- 连接到数据库
\c safety_detection_db

-- 创建扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
```

---

## 环境变量配置

### 后端环境变量 (backend/.env)

```bash
# ================================
# 基础配置
# ================================
PROJECT_NAME="大模型安全检测工具"
VERSION=1.0.0
DEBUG=false

# ================================
# 数据库配置
# ================================
# 使用Docker时保持以下配置
DATABASE_URL=postgresql://safety_user:safety_pass_2024@localhost:5432/safety_detection_db

# 使用本地PostgreSQL时修改为
# DATABASE_URL=postgresql://your_user:your_password@localhost:5432/safety_detection_db

# ================================
# Redis配置
# ================================
# 使用Docker时保持以下配置
REDIS_URL=redis://:redis_pass_2024@localhost:6379/0

# 使用本地Redis时修改为
# REDIS_URL=redis://:your_password@localhost:6379/0

# ================================
# API配置
# ================================
API_V1_PREFIX=/api/v1
BACKEND_CORS_ORIGINS=http://localhost:3000,http://localhost:8000

# ================================
# 安全配置
# ================================
# 生产环境请修改为强密钥
SECRET_KEY=your-secret-key-change-in-production-2024
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# ================================
# 检测配置
# ================================
# 语义分析模型
SEMANTIC_MODEL_NAME=all-MiniLM-L6-v2

# 功能开关
ENABLE_DEEP_DETECTION=true
ENABLE_BEHAVIORAL_ANALYSIS=true
ENABLE_CONTEXT_ANALYSIS=true

# 性能配置
MAX_BATCH_SIZE=100
DETECTION_TIMEOUT=30
CONCURRENT_DETECTIONS=10

# ================================
# 日志配置
# ================================
LOG_LEVEL=INFO
LOG_FORMAT=json

# ================================
# 监控配置
# ================================
ENABLE_METRICS=true
PROMETHEUS_PORT=9090
```

### 前端环境变量 (frontend/.env.development)

```bash
# API地址
VITE_API_BASE_URL=http://localhost:8000/api/v1

# WebSocket地址
VITE_WS_URL=ws://localhost:8000/ws

# 超时配置
VITE_REQUEST_TIMEOUT=30000

# 功能开关
VITE_ENABLE_WEBSOCKET=true
VITE_ENABLE_MONITORING=true
```

---

## Docker部署

### 1. 构建镜像

```bash
# 构建所有镜像
docker-compose build

# 或单独构建
docker-compose build backend
docker-compose build frontend
```

### 2. 启动服务

```bash
# 后台启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看实时日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f backend
docker-compose logs -f frontend
```

### 3. 停止和清理

```bash
# 停止所有服务
docker-compose down

# 停止并删除卷
docker-compose down -v

# 停止并删除镜像
docker-compose down --rmi all
```

### 4. 服务管理

```bash
# 重启服务
docker-compose restart

# 重启特定服务
docker-compose restart backend

# 查看资源使用
docker stats

# 进入容器
docker exec -it safety_detection_backend bash
docker exec -it safety_detection_postgres psql -U safety_user -d safety_detection_db
```

---

## 手动部署

### 后端部署

#### 1. 创建虚拟环境

```bash
cd backend

# 创建虚拟环境
python -m venv venv

# 激活虚拟环境
# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

#### 2. 安装依赖

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

#### 3. 初始化数据库

```bash
# 运行数据库迁移
alembic upgrade head

# 或使用初始化脚本
python -m app.db.init_db
```

#### 4. 启动后端服务

```bash
# 开发环境
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 生产环境
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000
```

### 前端部署

#### 1. 安装依赖

```bash
cd frontend

npm install
# 或
pnpm install
```

#### 2. 开发环境运行

```bash
npm run dev
```

#### 3. 生产环境构建

```bash
# 构建
npm run build

# 预览构建结果
npm run preview
```

#### 4. 使用Nginx部署

```bash
# 1. 构建前端
npm run build

# 2. 配置Nginx
sudo cp -r dist/* /var/www/html/

# 3. 重启Nginx
sudo systemctl restart nginx
```

---

## 验证安装

### 1. 检查后端API

```bash
# 健康检查
curl http://localhost:8000/health

# 预期输出
{
  "status": "healthy",
  "timestamp": "2025-12-26T10:00:00Z"
}
```

### 2. 检查前端界面

访问: http://localhost:3000

应该能看到登录页面或主界面。

### 3. 检查API文档

访问: http://localhost:8000/docs

应该能看到Swagger UI文档界面。

### 4. 检查数据库连接

```bash
# 使用Docker
docker exec -it safety_detection_postgres psql -U safety_user -d safety_detection_db -c "SELECT COUNT(*) FROM detection_records;"

# 使用本地PostgreSQL
psql -U safety_user -d safety_detection_db -c "SELECT COUNT(*) FROM detection_records;"
```

### 5. 检查Redis连接

```bash
# 使用Docker
docker exec -it safety_detection_redis redis-cli -a redis_pass_2024 PING

# 使用本地Redis
redis-cli -a redis_pass_2024 PING

# 预期输出
PONG
```

---

## 常见问题

### Q1: Docker容器启动失败

**A:** 检查端口是否被占用
```bash
# Windows
netstat -ano | findstr "3000"
netstat -ano | findstr "8000"

# Linux/Mac
lsof -i :3000
lsof -i :8000

# 解决方法: 修改docker-compose.yml中的端口映射
```

### Q2: 数据库连接失败

**A:** 检查数据库是否启动
```bash
# Docker环境
docker-compose ps postgres
docker-compose logs postgres

# 检查数据库连接字符串
# backend/.env 中的 DATABASE_URL
```

### Q3: Redis连接失败

**A:** 检查Redis服务
```bash
# Docker环境
docker-compose ps redis
docker-compose logs redis

# 测试连接
redis-cli -h localhost -p 6379 -a redis_pass_2024 PING
```

### Q4: 前端无法连接后端API

**A:** 检查环境变量配置
```bash
# 确认前端配置
cat frontend/.env.development

# 确认后端运行
curl http://localhost:8000/health

# 检查CORS配置
# backend/app/core/config.py 中的 BACKEND_CORS_ORIGINS
```

### Q5: 模型下载失败

**A:** 配置镜像源或手动下载
```bash
# 设置HuggingFace镜像
export HF_ENDPOINT=https://hf-mirror.com

# 或修改代码中的模型路径
# backend/app/services/semantic_analyzer.py
```

### Q6: 权限错误

**A:** 修改文件权限
```bash
# Linux/Mac
chmod +x start.sh
chmod -R 755 backend/

# Windows
# 以管理员身份运行命令提示符
```

### Q7: 内存不足

**A:** 限制Docker资源使用
```bash
# Docker Desktop设置
# Settings -> Resources -> Memory: 增加到8GB+

# 或限制容器内存
# docker-compose.yml 添加
services:
  backend:
    mem_limit: 2g
```

---

## 生产环境部署建议

### 1. 安全配置

- 修改所有默认密码
- 使用强密码和密钥
- 配置HTTPS/SSL证书
- 启用防火墙
- 限制数据库访问

### 2. 性能优化

- 启用Redis缓存
- 配置CDN加速前端
- 使用Nginx负载均衡
- 启用Gzip压缩
- 配置数据库连接池

### 3. 监控和日志

- 配置Prometheus监控
- 设置Grafana告警
- 日志集中管理(ELK)
- 定期备份数据库

### 4. 高可用部署

- 多实例部署
- 数据库主从复制
- Redis哨兵模式
- 健康检查和自动重启

---

## 技术支持

遇到问题? 查看以下资源:

- [项目文档](./README.md)
- [功能设计文档](./大模型安全检测工具功能设计文档.md)
- [前端交互文档](./大模型安全检测工具前端交互设计文档.md)
- 提交Issue: [GitHub Issues]
- 发送邮件: support@example.com

---

**最后更新**: 2025-12-26
**版本**: v1.0.0
