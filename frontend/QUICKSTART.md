# 快速开始指南

## 第一步：安装依赖

```bash
cd frontend
npm install
```

## 第二步：配置环境变量

环境变量已经配置好，你可以根据需要修改 `.env.development` 文件：

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_API_TIMEOUT=30000
VITE_WS_URL=ws://localhost:8000/ws
```

## 第三步：启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

## 主要功能页面

### 1. 仪表盘 (`/dashboard`)
- 查看整体统计信息
- 检测趋势分析
- 威胁分布图表

### 2. 实时检测 (`/detection/realtime`)
- 输入文本进行实时检测
- 选择检测级别
- 查看详细分析结果

### 3. 批量检测 (`/detection/batch`)
- 上传文本文件
- 批量检测多个文本
- 导出检测结果

### 4. 数据分析 (`/analysis`)
- 趋势对比分析
- 时间分布热力图
- 自定义查询

### 5. 系统监控 (`/monitor`)
- 实时系统状态
- 性能指标监控
- 引擎状态查看

### 6. 系统设置 (`/settings`)
- 通用设置
- API配置
- 检测规则配置

## 常用命令

```bash
# 开发
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview

# 类型检查
npm run type-check

# 代码检查
npm run lint
```

## 项目结构速览

```
frontend/
├── src/
│   ├── pages/          # 页面组件
│   ├── components/     # 可复用组件
│   ├── hooks/          # 自定义Hooks
│   ├── services/       # API服务
│   ├── store/          # Redux状态管理
│   ├── types/          # TypeScript类型
│   ├── utils/          # 工具函数
│   └── styles/         # 样式文件
└── public/             # 静态资源
```

## 开发提示

1. **组件开发**：所有组件都有完整的TypeScript类型定义
2. **样式**：使用Ant Design组件库，样式自动处理
3. **状态管理**：使用Redux Toolkit进行全局状态管理
4. **API调用**：使用封装好的services层
5. **路由**：使用React Router v6

## 下一步

1. 启动后端API服务（端口8000）
2. 根据API文档调整services中的接口
3. 开始开发新功能或修改现有功能

## 故障排除

### 问题：依赖安装失败
**解决**：尝试清除缓存后重新安装
```bash
rm -rf node_modules package-lock.json
npm install
```

### 问题：端口被占用
**解决**：修改 `vite.config.ts` 中的端口号
```typescript
server: {
  port: 3001, // 修改为其他端口
}
```

### 问题：API连接失败
**解决**：检查后端服务是否启动，确认 `.env` 中的配置正确

## 技术支持

如有问题，请查看：
- README.md - 完整项目文档
- PROJECT_SUMMARY.md - 详细项目说明
- 代码注释 - 每个文件都有详细的注释

祝你开发顺利！🚀
