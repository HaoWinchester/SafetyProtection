# CLAUDE.md

此文件为 Claude Code (claude.ai/code) 提供在此代码库中工作的指导。

## 项目概述

这是一个**大模型安全检测工具** - 一个基于7层架构的实时AI安全检测平台,用于检测和防御提示词注入攻击、越狱攻击以及其他大模型安全威胁。

**当前状态**: 功能完整的实现,包含React前端和FastAPI后端,可立即用于开发和测试。

## 快速启动命令

### 开发模式(推荐)
```bash
# 双击运行或执行:
start.bat

# 执行内容:
# 1. 在Docker中启动PostgreSQL和Redis
# 2. 在本地8000端口启动后端服务器 (simple_server.py)
# 3. 在本地3001端口启动前端开发服务器
# 全部启用热重载功能(约10秒启动)
```

### 完整Docker部署(生产环境)
```bash
# 双击运行或执行:
start-docker.bat

# 在Docker中启动完整技术栈(约2-3分钟)
# 无热重载,生产就绪
```

### 停止服务
```bash
stop.bat
# 或关闭由start.bat打开的CMD窗口
```

### 手动启动
```bash
# 后端
cd backend
python simple_server.py

# 前端
cd frontend
npm run dev

# 仅启动数据库(Docker)
docker-compose up -d postgres redis
```

### 测试
```bash
# 后端测试
cd backend
pytest

# 前端测试
cd frontend
npm test
npm run lint
npm run type-check
```

### Docker管理
```bash
# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f backend
docker-compose logs -f frontend

# 停止服务
docker-compose down

# 重新构建并重启
docker-compose up -d --build
```

## 架构概览

### 7层检测架构
```
输入 → 预处理 → 检测 → 评估 → 决策 → 输出 → 存储
         (4种并行检测模式)
         ├─ 静态检测(关键词匹配、模式)
         ├─ 语义分析(嵌入相似度)
         ├─ 行为分析(异常检测)
         └─ 上下文分析(对话历史)
```

### 后端结构
```
backend/
├── simple_server.py       # 简化的开发服务器(start.bat使用)
├── app/
│   ├── main.py            # 完整的FastAPI应用入口
│   ├── api/v1/            # API端点
│   │   ├── endpoints/
│   │   │   ├── detection.py    # 检测端点
│   │   │   ├── statistics.py   # 统计端点
│   │   │   ├── monitor.py      # 监控端点
│   │   │   └── health.py       # 健康检查
│   │   └── api.py              # 路由聚合
│   ├── core/
│   │   ├── config.py           # 应用配置
│   │   ├── deps.py             # 依赖项(数据库、认证)
│   │   └── security.py         # 认证和加密
│   ├── db/
│   │   ├── session.py          # 数据库会话管理
│   │   └── base.py             # 基础模型
│   ├── models/
│   │   └── detection.py        # SQLAlchemy ORM模型
│   ├── schemas/
│   │   ├── common.py           # 通用Pydantic模型
│   │   └── detection.py        # 检测DTO
│   ├── services/               # 业务逻辑(7层检测)
│   │   ├── static_detector.py      # 第1层:静态检测
│   │   ├── semantic_analyzer.py    # 第2层:语义分析
│   │   ├── behavioral_analyzer.py  # 第3层:行为分析
│   │   ├── context_analyzer.py     # 第4层:上下文分析
│   │   ├── risk_assessor.py        # 第5层:风险评估
│   │   └── detection_service.py    # 编排器
│   └── utils/
│       ├── helpers.py           # 辅助函数
│       └── logging.py           # 日志配置
└── requirements.txt
```

### 前端结构
```
frontend/
├── src/
│   ├── main.tsx                # 入口点
│   ├── App.tsx                 # 带路由的根组件
│   ├── components/
│   │   ├── Layout/             # 布局组件
│   │   │   ├── Header.tsx
│   │   │   └── MainLayout.tsx
│   │   ├── Dashboard/          # 仪表板组件
│   │   │   └── StatisticCard.tsx
│   │   └── Common/             # 共享组件
│   │       ├── Loading.tsx
│   │       └── ErrorBoundary.tsx
│   ├── pages/
│   │   ├── Dashboard/          # 主仪表板
│   │   ├── Detection/          # 检测页面
│   │   │   ├── Realtime.tsx    # 实时检测
│   │   │   └── Batch.tsx       # 批量检测
│   │   ├── Analysis/           # 威胁分析
│   │   ├── Monitor/            # 系统监控
│   │   └── Settings/           # 配置
│   ├── services/
│   │   └── api.ts              # Axios API客户端
│   ├── utils/
│   │   └── constants.ts        # 应用常量(端点、配置)
│   └── types/                  # TypeScript类型定义
└── package.json
```

## 核心技术栈

**后端**
- FastAPI 0.115.0 (异步Web框架)
- SQLAlchemy 2.0.36 (ORM)
- PostgreSQL 15 (数据库)
- Redis 5.2.1 (缓存)
- sentence-transformers 3.3.1 (ML模型)
- PyTorch 2.5.1
- Uvicorn 0.32.0 (ASGI服务器)

**前端**
- React 18.2.0
- TypeScript 5.3.3
- Vite 5.0.8 (构建工具)
- Ant Design 5.12.0 (UI组件库)
- Redux Toolkit 2.0.1
- React Query 5.13.0
- React Router 6.20.0
- ECharts 5.4.3 (图表)
- Axios 1.6.2 (HTTP客户端)

**基础设施**
- Docker + Docker Compose
- Nginx (反向代理)
- Prometheus + Grafana (监控)

## API端点

### 检测API
- `POST /api/v1/detection/detect` - 实时检测
- `POST /api/v1/detection/batch` - 批量检测
- `GET /api/v1/detection/result/{request_id}` - 获取结果

### 统计API
- `GET /api/v1/statistics/overview` - 概览统计
- `GET /api/v1/statistics/trends` - 趋势数据
- `GET /api/v1/statistics/distribution` - 威胁分布

### 监控API
- `GET /api/v1/monitor/system` - 系统健康
- `GET /api/v1/monitor/performance` - 性能指标
- `GET /api/v1/monitor/engine` - 检测引擎状态

### 系统API
- `GET /` - 根端点(API信息)
- `GET /health` - 健康检查
- `GET /api/config` - 配置信息

**完整API文档**: http://localhost:8000/docs (Swagger UI)

## 数据流架构

### 检测流程
```
用户输入(前端)
    ↓
WebSocket/HTTP POST
    ↓
FastAPI端点
    ↓
检测服务(编排器)
    ↓
并行检测流水线:
  ├─ 静态检测器(关键词)
  ├─ 语义分析器(嵌入)
  ├─ 行为分析器(模式)
  └─ 上下文分析器(历史)
    ↓
风险评估器(分数计算)
    ↓
决策引擎(允许/阻止/警告)
    ↓
结果存储(PostgreSQL)
    ↓
响应返回前端
    ↓
可视化与告警
```

## 重要约定

### 后端约定
1. **异步编程**: 所有端点处理器都是异步的
2. **依赖注入**: 使用FastAPI依赖项进行认证、数据库会话管理
3. **服务层模式**: 业务逻辑位于 `/services` 目录
4. **Pydantic验证**: 所有请求/响应都经过schema验证
5. **错误处理**: 集中式异常处理器
6. **日志记录**: 带上下文的结构化日志
7. **生命周期管理**: 数据库/ML模型的启动/关闭钩子

### 前端约定
1. **TypeScript**: 全程严格类型检查
2. **组件组织**:
   - 页面位于 `/pages`
   - 可复用组件位于 `/components`
   - 布局组件位于 `/components/Layout`
3. **懒加载**: 使用React.lazy()进行代码分割
4. **错误边界**: 使用类组件处理错误
5. **API层**: 带拦截器的集中式Axios客户端
6. **常量管理**: 所有魔法值都在 `constants.ts` 中
7. **响应式设计**: 使用Ant Design网格系统

### API响应格式
```json
{
  "request_id": "uuid",
  "timestamp": "ISO-8601",
  "is_compliant": boolean,
  "risk_score": 0.0-1.0,
  "risk_level": "low|medium|high|critical",
  "threat_category": "string|null",
  "detection_details": {...},
  "recommendation": "pass|warn|block",
  "processing_time_ms": number
}
```

## 配置

### 后端配置 (`backend/app/core/config.py`)
```python
# 关键设置:
DATABASE_URL = "postgresql://user:password@localhost:5432/safety_db"
REDIS_URL = "redis://localhost:6379/0"
API_V1_PREFIX = "/api/v1"
SECRET_KEY = "your-secret-key"
CORS_ORIGINS = ["http://localhost:3001"]
SEMANTIC_MODEL_NAME = "paraphrase-multilingual-mpnet-base-v2"
LOG_LEVEL = "INFO"
```

### 前端配置 (`frontend/.env`)
```bash
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_WS_URL=ws://localhost:8000/ws
VITE_API_TIMEOUT=30000
```

## 开发工作流

1. **本地开发**: 使用 `start.bat` 实现最快的迭代速度和热重载
2. **代码变更**: 前后端都启用了热重载
3. **测试**: 提交前运行测试
4. **代码风格**:
   - 后端: Black, flake8, mypy
   - 前端: ESLint, TypeScript严格模式

## 理解系统的关键文件

**后端必读**:
1. `backend/simple_server.py` - 简化的开发服务器(开发主要使用)
2. `backend/app/main.py` - 完整的FastAPI应用
3. `backend/app/services/detection_service.py` - 检测编排器
4. `backend/app/core/config.py` - 配置

**前端必读**:
1. `frontend/src/App.tsx` - 路由和结构
2. `frontend/src/services/api.ts` - API客户端
3. `frontend/src/utils/constants.ts` - 所有配置
4. `frontend/src/pages/Dashboard/index.tsx` - 主仪表板

**运维必读**:
1. `docker-compose.yml` - 完整技术栈定义
2. `docker-compose-simple.yml` - 简化技术栈
3. `start.bat` - 开发工作流
4. `backend/Dockerfile` - 后端容器化
5. `frontend/Dockerfile` - 前端容器化

## 需要保留的现有文档

所有现有文档都应保留,因为它们提供了全面的系统设计:

1. **README.md** - 项目概述和快速入门指南
2. **启动说明.md** - 详细的启动说明(中文)
3. **大模型安全检测工具功能设计文档.md** - 完整的功能设计和7层架构细节
4. **大模型安全检测工具前端交互设计文档.md** - 前端UX/UI设计规范

## 部署策略

1. **开发环境**: `start.bat` (本地进程 + Docker数据库)
2. **测试环境**: `docker-compose-simple.yml` (简化技术栈)
3. **生产环境**: `docker-compose.yml` (完整技术栈 + 监控)

## 访问地址(启动服务后)

| 服务 | 地址 | 描述 |
|------|------|------|
| 前端应用 | http://localhost:3001 | 主应用界面 |
| 后端API | http://localhost:8000 | API端点 |
| API文档 | http://localhost:8000/docs | Swagger UI |
| PostgreSQL | localhost:5432 | 数据库 |
| Redis | localhost:6379 | 缓存 |
| Grafana | http://localhost:3001 | 监控(仅完整Docker) |
| Prometheus | http://localhost:9090 | 指标(仅完整Docker) |

## 安全检测能力

### 支持的攻击类型
1. **直接提示词注入**: 角色扮演、指令覆盖、系统提示劫持
2. **间接提示词注入**: 外部数据污染、文档注入
3. **越狱攻击**: 经典越狱、编码绕过、逻辑悖论
4. **数据泄露**: 训练数据提取、敏感信息探测
5. **模型操纵**: 输出控制、认知偏差利用
6. **社会工程**: 钓鱼、身份欺骗、信任建立

### 风险评估矩阵
| 风险级别 | 分数范围 | 处理策略 | 响应时间 |
|---------|---------|---------|---------|
| 低风险   | 0-0.3   | 通过+记录 | <10ms   |
| 中风险   | 0.3-0.5 | 通过+警告 | <50ms   |
| 高风险   | 0.5-0.8 | 阻止+审查 | <100ms  |
| 严重风险 | 0.8-1.0 | 立即阻止  | <50ms   |

## 目标性能指标

- **吞吐量**: 10,000+ 请求/秒
- **延迟**: P95 < 50ms, P99 < 100ms
- **准确率**: 整体检测准确率 > 92%
- **资源使用**: CPU < 50%, 内存 < 2GB
- **可用性**: 99.9% 正常运行时间,自动故障转移

## 注意事项

- 项目使用简化服务器(`simple_server.py`)进行开发,以实现更快的迭代
- 完整的FastAPI应用和所有服务位于 `backend/app/main.py`
- 前端使用Vite实现快速开发和热模块替换
- 开发模式和生产环境配置分别维护
- 开发模式下仅将Docker用于数据库
- 生产环境可使用完整Docker部署
- 所有响应都使用中文返回给用户
