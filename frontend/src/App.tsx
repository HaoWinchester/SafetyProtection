/**
 * 主应用组件
 * Main application component with routing
 */

import React, { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Spin } from 'antd'
import { ConfigProvider, theme } from 'antd'
import MainLayout from './components/Layout/MainLayout'

// 懒加载页面组件
const Dashboard = lazy(() => import('./pages/Dashboard/index'))
const RealtimeDetection = lazy(() => import('./pages/Detection/Realtime'))
const BatchDetection = lazy(() => import('./pages/Detection/Batch'))
const Analysis = lazy(() => import('./pages/Analysis/index'))
const Monitor = lazy(() => import('./pages/Monitor/index'))
const Settings = lazy(() => import('./pages/Settings/index'))

// 加载组件
const Loading = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh'
  }}>
    <Spin size="large" tip="加载中..." />
  </div>
)

// 错误边界组件
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          background: '#f0f2f5'
        }}>
          <h1>出错了</h1>
          <p>页面加载失败，请刷新重试</p>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * App组件
 */
const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ConfigProvider
        theme={{
          algorithm: theme.defaultAlgorithm,
          token: {
            colorPrimary: '#1890ff',
            borderRadius: 8,
          },
        }}
      >
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<MainLayout />}>
              {/* 默认重定向到仪表盘 */}
              <Route index element={<Navigate to="/dashboard" replace />} />

              {/* 仪表盘 */}
              <Route path="dashboard" element={<Dashboard />} />

              {/* 检测功能 */}
              <Route path="detection">
                <Route path="realtime" element={<RealtimeDetection />} />
                <Route path="batch" element={<BatchDetection />} />
              </Route>

              {/* 分析 */}
              <Route path="analysis" element={<Analysis />} />

              {/* 监控 */}
              <Route path="monitor" element={<Monitor />} />

              {/* 设置 */}
              <Route path="settings" element={<Settings />} />

              {/* 404页面 */}
              <Route
                path="*"
                element={
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100vh'
                  }}>
                    <h1>404</h1>
                    <p>页面不存在</p>
                  </div>
                }
              />
            </Route>
          </Routes>
        </Suspense>
      </ConfigProvider>
    </ErrorBoundary>
  )
}

export default App
