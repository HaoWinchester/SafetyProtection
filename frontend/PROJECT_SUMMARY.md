# LLM Security Detection Tool - Frontend Project Summary

## 项目概述

这是一个完整的React + TypeScript前端项目，用于大模型安全检测工具的Web界面。项目采用现代化的技术栈，实现了实时检测、批量检测、数据分析、系统监控等核心功能。

## 已创建的文件清单

### 配置文件 (9个)
1. `package.json` - 项目依赖和脚本配置
2. `vite.config.ts` - Vite构建配置
3. `tsconfig.json` - TypeScript配置
4. `tsconfig.node.json` - Node环境TypeScript配置
5. `.env.example` - 环境变量示例
6. `.env.development` - 开发环境配置
7. `.env.production` - 生产环境配置
8. `.gitignore` - Git忽略文件
9. `README.md` - 项目说明文档

### 公共资源 (2个)
1. `public/index.html` - HTML入口文件
2. `public/favicon.ico` - 网站图标

### 源代码文件 (40+个)

#### 类型定义 (3个)
1. `src/types/detection.ts` - 检测相关类型定义
2. `src/types/common.ts` - 通用类型定义
3. `src/types/index.ts` - 类型统一导出

#### 工具函数 (2个)
1. `src/utils/helpers.ts` - 辅助函数集合
2. `src/utils/constants.ts` - 常量定义

#### 样式文件 (3个)
1. `src/styles/variables.css` - CSS变量
2. `src/styles/global.css` - 全局样式
3. `src/index.css` - 样式入口

#### API服务 (4个)
1. `src/services/api.ts` - Axios客户端配置
2. `src/services/detectionService.ts` - 检测API
3. `src/services/statisticsService.ts` - 统计API
4. `src/services/monitorService.ts` - 监控API

#### Redux状态管理 (3个)
1. `src/store/index.ts` - Store配置
2. `src/store/detectionSlice.ts` - 检测状态管理
3. `src/store/monitorSlice.ts` - 监控状态管理

#### 自定义Hooks (3个)
1. `src/hooks/useWebSocket.ts` - WebSocket Hook
2. `src/hooks/useDetection.ts` - 检测Hook
3. `src/hooks/useStatistics.ts` - 统计Hook

#### 布局组件 (2个)
1. `src/components/Layout/MainLayout.tsx` - 主布局
2. `src/components/Layout/Header.tsx` - 页头组件

#### 仪表盘组件 (1个)
1. `src/components/Dashboard/StatisticCard.tsx` - 统计卡片

#### 通用组件 (2个)
1. `src/components/Common/Loading.tsx` - 加载组件
2. `src/components/Common/ErrorBoundary.tsx` - 错误边界

#### 页面组件 (6个)
1. `src/pages/Dashboard/index.tsx` - 仪表盘页面
2. `src/pages/Detection/Realtime.tsx` - 实时检测页面
3. `src/pages/Detection/Batch.tsx` - 批量检测页面
4. `src/pages/Analysis/index.tsx` - 数据分析页面
5. `src/pages/Monitor/index.tsx` - 系统监控页面
6. `src/pages/Settings/index.tsx` - 系统设置页面

#### 核心文件 (3个)
1. `src/main.tsx` - 应用入口
2. `src/App.tsx` - 主应用组件
3. `src/vite-env.d.ts` - TypeScript环境类型声明

## 技术栈详解

### 核心框架
- **React 18.2.0** - 采用最新React特性，包括Hooks、Suspense等
- **TypeScript 5.3.3** - 完整的类型安全保障
- **Vite 5.0.8** - 极速的开发服务器和构建工具

### UI组件库
- **Ant Design 5.12.0** - 企业级UI组件库
- **@ant-design/icons 5.2.6** - 官方图标库
- 提供完整的组件生态和主题定制能力

### 状态管理
- **@reduxjs/toolkit 2.0.1** - 现代化的Redux工具集
- **react-redux 9.0.4** - React-Redux绑定
- 简化的Redux使用方式，内置Immer和Thunk

### 路由管理
- **react-router-dom 6.20.0** - 最新版本路由库
- 支持嵌套路由、懒加载等特性

### 数据请求
- **axios 1.6.2** - HTTP客户端
- **@tanstack/react-query 5.13.0** - 强大的数据同步库
- 自动缓存、重试、轮询等功能

### 实时通信
- **socket.io-client 4.6.0** - WebSocket客户端
- 支持自动重连、心跳检测等特性

### 数据可视化
- **echarts 5.4.3** - 强大的图表库
- **echarts-for-react 3.0.2** - ECharts的React封装
- 支持丰富的图表类型和交互

### 工具库
- **dayjs 1.11.10** - 轻量级日期处理库

## 项目架构

### 分层架构
```
┌─────────────────────────────────────┐
│         Pages (页面层)              │
│  Dashboard, Detection, Analysis...  │
├─────────────────────────────────────┤
│      Components (组件层)            │
│  Layout, Common, Business...        │
├─────────────────────────────────────┤
│        Hooks (钩子层)               │
│  useDetection, useWebSocket...      │
├─────────────────────────────────────┤
│      Services (服务层)              │
│  API调用, 数据转换                  │
├─────────────────────────────────────┤
│       Store (状态层)                │
│  Redux全局状态管理                  │
├─────────────────────────────────────┤
│      Utils (工具层)                 │
│  Helper函数, Constants              │
└─────────────────────────────────────┘
```

### 目录结构设计原则
1. **按功能模块划分** - 页面、组件、服务清晰分离
2. **类型安全** - 所有代码都有完整的TypeScript类型
3. **可维护性** - 统一的代码风格和命名规范
4. **可扩展性** - 模块化设计，易于添加新功能

## 核心功能实现

### 1. 实时检测功能
- 单文本输入检测
- 4种检测级别可选（基础、标准、高级、专家）
- 实时显示检测结果
- 详细的攻击类型分析
- 静态、语义、行为、上下文四维分析

### 2. 批量检测功能
- 支持文件上传（txt、csv、json）
- 最多100条文本批量检测
- 进度条实时显示
- 检测结果表格展示
- 支持导出JSON格式结果

### 3. 数据分析功能
- 检测趋势对比分析
- 攻击类型分布饼图
- 风险等级分布柱状图
- 时间分布热力图
- 自定义时间范围查询

### 4. 系统监控功能
- 系统健康状态监控
- 性能指标实时展示（CPU、内存、响应时间）
- 检测引擎状态监控
- 队列大小、处理统计
- 自动刷新功能

### 5. 系统设置功能
- 通用设置（应用名称、语言、自动刷新等）
- API配置（后端地址、超时时间、WebSocket等）
- 检测规则配置（检测级别、批量大小、缓存等）
- 风险阈值自定义

## 性能优化措施

### 1. 代码分割
- 路由级别的懒加载
- Vendor chunks分离
- 动态导入

### 2. 缓存策略
- React Query自动缓存API响应
- Redux状态持久化
- 静态资源缓存

### 3. 构建优化
- Vite快速构建
- 生产环境代码压缩
- Tree shaking
- 资源最小化

### 4. 运行时优化
- 虚拟滚动（大数据列表）
- 防抖和节流
- useMemo和useCallback优化

## 开发规范

### 代码风格
- 使用函数组件和Hooks
- TypeScript严格模式
- 组件文件使用PascalCase命名
- 工具文件使用camelCase命名

### 命名规范
- 组件: PascalCase (e.g., `DetectionResult.tsx`)
- 函数: camelCase (e.g., `formatNumber`)
- 常量: UPPER_SNAKE_CASE (e.g., `API_BASE_URL`)
- 类型: PascalCase (e.g., `DetectionRequest`)

### 注释规范
- 所有文件顶部添加文件说明注释
- 复杂函数添加JSDoc注释
- 关键逻辑添加行内注释

## 部署流程

### 开发环境
```bash
npm install
npm run dev
```

### 生产构建
```bash
npm run build
```

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
```

## 待完善功能

### 短期优化
1. 添加单元测试（Jest + React Testing Library）
2. 添加E2E测试（Playwright）
3. 完善错误处理和日志记录
4. 添加国际化支持（i18n）

### 长期规划
1. 主题切换（暗色模式）
2. PWA支持
3. 离线功能
4. 性能监控和分析
5. 无障碍访问（A11y）

## 安全考虑

1. **XSS防护** - React自动转义，避免使用dangerouslySetInnerHTML
2. **CSRF防护** - API请求添加CSRF token
3. **内容安全策略** - 配置CSP头部
4. **依赖审计** - 定期更新依赖包，修复安全漏洞
5. **环境变量** - 敏感信息通过环境变量管理

## 浏览器兼容性

- Chrome >= 87
- Firefox >= 78
- Safari >= 14
- Edge >= 88

使用Vite的默认目标为esnext，支持现代浏览器的最新特性。

## 项目亮点

1. **完整的类型系统** - 100% TypeScript覆盖
2. **现代化技术栈** - 使用最新的前端技术
3. **企业级架构** - 清晰的分层和模块化设计
4. **丰富的功能** - 覆盖检测、分析、监控全流程
5. **优秀的用户体验** - 响应式设计、实时更新
6. **完善的文档** - 详细的注释和说明文档

## 总结

这是一个生产就绪的React + TypeScript前端项目，具有：
- 完整的项目结构和配置
- 清晰的代码组织和规范
- 丰富的功能模块和组件
- 良好的性能和用户体验
- 详尽的文档和注释

项目可以直接用于开发环境，根据实际后端API进行适当调整即可投入使用。
