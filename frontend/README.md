# LLM Security Detection Tool - Frontend

大模型安全检测工具前端应用，基于 React + TypeScript + Vite 构建。

## 项目特性

- ⚡️ **Vite 5** - 极速的开发体验
- ⚛️ **React 18** - 最新的React特性
- 📘 **TypeScript** - 完整的类型安全
- 🎨 **Ant Design 5** - 企业级UI组件库
- 📊 **ECharts** - 强大的数据可视化
- 🔄 **React Router** - 单页应用路由
- 📦 **Redux Toolkit** - 现代化的状态管理
- 🔌 **WebSocket** - 实时数据通信

## 技术栈

### 核心框架
- React 18.2.0
- TypeScript 5.3.3
- Vite 5.0.8

### UI组件库
- Ant Design 5.12.0
- @ant-design/icons 5.2.6

### 状态管理
- @reduxjs/toolkit 2.0.1
- react-redux 9.0.4

### 路由
- react-router-dom 6.20.0

### 数据请求
- axios 1.6.2
- @tanstack/react-query 5.13.0

### 实时通信
- socket.io-client 4.6.0

### 图表
- echarts 5.4.3
- echarts-for-react 3.0.2

### 工具库
- dayjs 1.11.10

## 项目结构

```
frontend/
├── public/                    # 静态资源
│   ├── index.html
│   └── favicon.ico
├── src/
│   ├── App.tsx               # 主应用组件
│   ├── main.tsx              # 应用入口
│   ├── index.css             # 全局样式
│   ├── components/           # 通用组件
│   │   ├── Layout/           # 布局组件
│   │   ├── Detection/        # 检测组件
│   │   ├── Dashboard/        # 仪表盘组件
│   │   ├── Monitor/          # 监控组件
│   │   └── Common/           # 通用组件
│   ├── pages/                # 页面组件
│   │   ├── Dashboard/        # 仪表盘页面
│   │   ├── Detection/        # 检测页面
│   │   ├── Analysis/         # 分析页面
│   │   ├── Monitor/          # 监控页面
│   │   └── Settings/         # 设置页面
│   ├── hooks/                # 自定义Hooks
│   │   ├── useWebSocket.ts
│   │   ├── useDetection.ts
│   │   └── useStatistics.ts
│   ├── services/             # API服务
│   │   ├── api.ts
│   │   ├── detectionService.ts
│   │   ├── statisticsService.ts
│   │   └── monitorService.ts
│   ├── store/                # Redux状态管理
│   │   ├── index.ts
│   │   ├── detectionSlice.ts
│   │   └── monitorSlice.ts
│   ├── types/                # TypeScript类型
│   │   ├── detection.ts
│   │   ├── common.ts
│   │   └── index.ts
│   ├── utils/                # 工具函数
│   │   ├── helpers.ts
│   │   └── constants.ts
│   └── styles/               # 样式文件
│       ├── variables.css
│       └── global.css
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 开始使用

### 环境要求

- Node.js >= 16.0.0
- npm >= 8.0.0 或 pnpm >= 7.0.0

### 安装依赖

```bash
npm install
```

或使用 pnpm:

```bash
pnpm install
```

### 配置环境变量

复制 `.env.example` 为 `.env.development` 并根据需要修改配置：

```bash
cp .env.example .env.development
```

主要配置项：

```env
# API配置
VITE_API_BASE_URL=http://localhost:8000
VITE_API_TIMEOUT=30000

# WebSocket配置
VITE_WS_URL=ws://localhost:8000/ws
VITE_WS_RECONNECT_INTERVAL=5000
```

### 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

### 构建生产版本

```bash
npm run build
```

构建产物将输出到 `dist/` 目录。

### 预览生产构建

```bash
npm run preview
```

## 功能模块

### 1. 仪表盘 (Dashboard)
- 统计概览卡片
- 检测趋势图表
- 威胁分布分析
- 实时数据更新

### 2. 实时检测 (Realtime Detection)
- 单文本实时检测
- 多级别检测选择
- 详细检测结果展示
- 攻击类型识别

### 3. 批量检测 (Batch Detection)
- 文件上传导入
- 批量文本检测
- 结果统计展示
- 检测结果导出

### 4. 数据分析 (Analysis)
- 趋势对比分析
- 时间分布热力图
- 自定义时间范围
- 数据导出功能

### 5. 系统监控 (Monitor)
- 系统状态监控
- 性能指标展示
- 检测引擎状态
- 实时数据刷新

### 6. 系统设置 (Settings)
- 通用设置
- API配置
- 检测规则配置
- 风险阈值设置

## 开发指南

### 代码规范

项目使用 ESLint 进行代码检查：

```bash
npm run lint
```

### 类型检查

```bash
npm run type-check
```

### 组件开发规范

1. 使用函数组件和 Hooks
2. 使用 TypeScript 定义 props 类型
3. 遵循单一职责原则
4. 组件文件使用 PascalCase 命名
5. 使用绝对路径导入（@/ 别名）

### API调用示例

```typescript
import { detectRealtime } from '@/services/detectionService'

const result = await detectRealtime({
  text: '要检测的文本',
  detection_level: DetectionLevel.STANDARD,
})
```

### 状态管理示例

```typescript
import { useAppDispatch, useAppSelector } from '@/hooks'
import { performDetection } from '@/store/detectionSlice'

const dispatch = useAppDispatch()
const result = useAppSelector(selectCurrentResult)

await dispatch(performDetection({ text: 'test' }))
```

## 部署说明

### Docker部署

```dockerfile
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Nginx配置

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /ws {
        proxy_pass http://backend:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

## 性能优化

### 代码分割

使用 React.lazy 进行路由级别的代码分割：

```typescript
const Dashboard = lazy(() => import('./pages/Dashboard/index'))
```

### 打包优化

Vite配置中已启用：
- 代码分割（vendor chunks）
- 压缩（minification）
- Tree shaking
- 资源压缩（gzip）

### 缓存策略

- React Query自动缓存API响应
- Redux状态持久化
- 静态资源缓存

## 浏览器支持

- Chrome >= 87
- Firefox >= 78
- Safari >= 14
- Edge >= 88

## 常见问题

### Q: 开发环境热更新不生效？

A: 检查 Vite 配置中的 server 设置，确保端口未被占用。

### Q: TypeScript报错找不到模块？

A: 确保已安装 `@types/*` 相关的类型定义包。

### Q: WebSocket连接失败？

A: 检查后端服务是否启动，以及 `.env` 中的 `VITE_WS_URL` 配置是否正确。

## 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 许可证

本项目仅供内部使用。

## 联系方式

如有问题或建议，请联系开发团队。
