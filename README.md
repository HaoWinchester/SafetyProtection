# 大模型安全检测工具

一个基于7层架构的实时AI安全检测平台,用于检测和防御prompt注入攻击、jailbreak攻击等大模型安全威胁。

## 项目架构

```
大模型安全检测工具/
├── backend/              # FastAPI后端服务
│   ├── app/
│   │   ├── api/         # API路由
│   │   ├── core/        # 核心配置
│   │   ├── models/      # 数据库模型
│   │   ├── schemas/     # Pydantic模型
│   │   ├── services/    # 业务逻辑
│   │   └── utils/       # 工具函数
│   ├── tests/           # 测试代码
│   └── requirements.txt
├── frontend/            # React前端应用
│   ├── src/
│   │   ├── components/  # React组件
│   │   ├── pages/       # 页面组件
│   │   ├── services/    # API服务
│   │   └── hooks/       # 自定义Hooks
│   └── package.json
├── docker/              # Docker配置
│   ├── docker-compose.yml
│   └── Dockerfile
└── Infrastructure/      # 基础设施文档
    ├── 工具架构图.png
    └── 工具时序图.png
```

## 核心功能

### 1. 7层检测架构
- **输入层**: 数据接收与预处理
- **预处理层**: 文本清洗和标准化
- **检测层**: 多模态检测(静态、语义、行为、上下文)
- **评估层**: 风险评分和威胁分类
- **决策层**: 合规判断和处理策略
- **输出层**: 生成检测报告
- **存储层**: 数据持久化

### 2. 主要特性
- ✅ 实时检测 (WebSocket)
- ✅ 批量检测
- ✅ 威胁分析
- ✅ 实时监控
- ✅ 规则管理
- ✅ 数据可视化

### 3. 技术栈

**后端**
- FastAPI (Web框架)
- SQLAlchemy (ORM)
- PostgreSQL (数据库)
- Redis (缓存)
- WebSocket (实时通信)
- Prometheus + Grafana (监控)

**前端**
- React 18
- TypeScript
- Ant Design 5
- Redux Toolkit
- React Query
- ECharts (数据可视化)
- Socket.io-client

**部署**
- Docker & Docker Compose
- Nginx (反向代理)

## 快速开始

### 前置要求

- Python 3.9+
- Node.js 16+
- PostgreSQL 14+
- Redis 6+
- Docker & Docker Compose (可选)

### 安装步骤

#### 1. 克隆项目

```bash
git clone <repository-url>
cd 安全检测项目
```

#### 2. 使用Docker启动 (推荐)

```bash
# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

#### 3. 手动安装

**后端安装**
```bash
cd backend

# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 安装依赖
pip install -r requirements.txt

# 初始化数据库
python -m app.db.init_db

# 启动后端服务
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**前端安装**
```bash
cd frontend

# 安装依赖
npm install
# 或
pnpm install

# 启动开发服务器
npm run dev
```

### 数据库初始化

```bash
# 方式1: 使用脚本初始化
cd backend
python -m app.db.init_db

# 方式2: 使用Alembic迁移
cd backend
alembic upgrade head
```

### 访问应用

- 前端界面: http://localhost:3000
- 后端API: http://localhost:8000
- API文档: http://localhost:8000/docs
- Grafana监控: http://localhost:3001 (admin/admin)
- Prometheus: http://localhost:9090

## 配置说明

### 后端配置

编辑 `backend/app/core/config.py`:

```python
# 数据库配置
DATABASE_URL = "postgresql://user:password@localhost:5432/safety_db"

# Redis配置
REDIS_URL = "redis://localhost:6379/0"

# JWT密钥
SECRET_KEY = "your-secret-key"

# API配置
API_V1_PREFIX = "/api/v1"
```

### 前端配置

编辑 `frontend/.env`:

```bash
# API地址
REACT_APP_API_BASE_URL=http://localhost:8000/api/v1

# WebSocket地址
REACT_APP_WS_URL=ws://localhost:8000/ws
```

## API文档

启动后端服务后,访问 http://localhost:8000/docs 查看完整的API文档。

### 主要API端点

- `POST /api/v1/detection/dect` - 实时检测
- `POST /api/v1/detection/batch` - 批量检测
- `GET /api/v1/statistics` - 获取统计数据
- `GET /api/v1/detection/result/{request_id}` - 获取检测结果

## 开发指南

### 运行测试

```bash
# 后端测试
cd backend
pytest

# 前端测试
cd frontend
npm test
```

### 代码规范

```bash
# 后端格式化
cd backend
black app/
isort app/

# 前端格式化
cd frontend
npm run lint
npm run format
```

## 部署

### Docker部署

```bash
# 构建镜像
docker-compose build

# 启动服务
docker-compose up -d

# 查看状态
docker-compose ps
```

### 生产环境配置

1. 修改配置文件中的敏感信息
2. 设置强密码和密钥
3. 配置HTTPS
4. 启用备份策略
5. 配置监控告警

## 监控

系统集成了Prometheus和Grafana用于监控:

- 系统性能指标
- API请求统计
- 检测准确率
- 响应时间
- 错误率

访问Grafana查看监控面板: http://localhost:3001

## 故障排除

### 常见问题

**1. 数据库连接失败**
- 检查PostgreSQL是否运行
- 验证数据库连接字符串
- 确认数据库已创建

**2. Redis连接失败**
- 检查Redis是否运行
- 验证Redis连接字符串

**3. WebSocket连接失败**
- 检查防火墙设置
- 验证WebSocket URL配置

## 文档

- [功能设计文档](./大模型安全检测工具功能设计文档.md)
- [前端交互设计文档](./大模型安全检测工具前端交互设计文档.md)
- [API文档](http://localhost:8000/docs)

## 许可证

本项目采用 MIT 许可证。

## 联系方式

如有问题或建议,请提交Issue或Pull Request。

---

**生成日期**: 2025-12-26
**版本**: v1.0.0
