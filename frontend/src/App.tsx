/**
 * 主应用组件
 * Main application component with routing and authentication
 */

import React, { Suspense, lazy, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Spin } from 'antd'
import { ConfigProvider, theme } from 'antd'
import MainLayout from './components/Layout/MainLayout'
import { checkBackendHealthWithCache } from './services/healthService'
import PrivateRoute from './components/Common/PrivateRoute'

// 直接导入关键页面组件（不懒加载，避免切换时闪烁）
import Dashboard from './pages/Dashboard/index'
import Analysis from './pages/Analysis/index'
import Monitor from './pages/Monitor/index'
import Settings from './pages/Settings/index'
import Login from './pages/Login/index'
import UserDashboard from './pages/UserDashboard/index'
import AdminDashboard from './pages/AdminDashboard/index'
// import ApiDocs from './pages/ApiDocs/index'

// 懒加载较大的页面组件
const RealtimeDetection = lazy(() => import('./pages/Detection/Realtime'))
const BatchDetection = lazy(() => import('./pages/Detection/Batch'))
const EvaluationConfig = lazy(() => import('./pages/Evaluation/Config'))
const EvaluationExecute = lazy(() => import('./pages/Evaluation/Execute'))
const EvaluationTestCases = lazy(() => import('./pages/Evaluation/TestCases'))
const EvaluationResults = lazy(() => import('./pages/Evaluation/Results'))

// 加载组件 - 内联加载，不覆盖整个页面
const InlineLoading = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '400px',
    background: '#f0f2f5',
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
  /**
   * 启动时检查后端健康状态
   */
  useEffect(() => {
    const checkHealth = async () => {
      const result = await checkBackendHealthWithCache()
      if (!result.healthy) {
        console.warn('后端服务未启动:', result.error)
        // 只在控制台警告，不显示消息，避免打扰用户
        // Dashboard页面会显示更详细的错误信息
      }
    }

    checkHealth()
  }, [])

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
        <Suspense fallback={<InlineLoading />}>
          <Routes>
            {/* 登录页面 - 不需要布局 */}
            <Route path="/login" element={<Login />} />

            {/* 主应用路由 - 需要认证 */}
            <Route path="/" element={<MainLayout />}>
              {/* 默认重定向到仪表盘 */}
              <Route index element={<Navigate to="/dashboard" replace />} />

              {/* 仪表盘 - 需要认证 */}
              <Route
                path="dashboard"
                element={
                  <PrivateRoute>
                    <Dashboard />
                  </PrivateRoute>
                }
              />

              {/* 检测功能 - 需要认证, 懒加载 */}
              <Route
                path="detection"
                element={
                  <PrivateRoute>
                    <Suspense fallback={<InlineLoading />}>
                      <RealtimeDetection />
                    </Suspense>
                  </PrivateRoute>
                }
              />
              <Route
                path="detection/batch"
                element={
                  <PrivateRoute>
                    <Suspense fallback={<InlineLoading />}>
                      <BatchDetection />
                    </Suspense>
                  </PrivateRoute>
                }
              />

              {/* 分析 - 需要认证 */}
              <Route
                path="analysis"
                element={
                  <PrivateRoute>
                    <Analysis />
                  </PrivateRoute>
                }
              />

              {/* 监控 - 需要认证 */}
              <Route
                path="monitor"
                element={
                  <PrivateRoute>
                    <Monitor />
                  </PrivateRoute>
                }
              />

              {/* 设置 - 需要认证 */}
              <Route
                path="settings"
                element={
                  <PrivateRoute>
                    <Settings />
                  </PrivateRoute>
                }
              />

              {/* 用户仪表板 - 需要认证 */}
              <Route
                path="user-dashboard"
                element={
                  <PrivateRoute>
                    <UserDashboard />
                  </PrivateRoute>
                }
              />

              {/* 管理员仪表板 - 需要管理员权限 */}
              <Route
                path="admin-dashboard"
                element={
                  <PrivateRoute requireAdmin={true}>
                    <AdminDashboard />
                  </PrivateRoute>
                }
              />

              {/* 测评管理 - 需要认证, 懒加载 */}
              <Route
                path="evaluation/config"
                element={
                  <PrivateRoute>
                    <Suspense fallback={<InlineLoading />}>
                      <EvaluationConfig />
                    </Suspense>
                  </PrivateRoute>
                }
              />
              <Route
                path="evaluation/execute"
                element={
                  <PrivateRoute>
                    <Suspense fallback={<InlineLoading />}>
                      <EvaluationExecute />
                    </Suspense>
                  </PrivateRoute>
                }
              />
              <Route
                path="evaluation/test-cases"
                element={
                  <PrivateRoute>
                    <Suspense fallback={<InlineLoading />}>
                      <EvaluationTestCases />
                    </Suspense>
                  </PrivateRoute>
                }
              />
              <Route
                path="evaluation/results"
                element={
                  <PrivateRoute>
                    <Suspense fallback={<InlineLoading />}>
                      <EvaluationResults />
                    </Suspense>
                  </PrivateRoute>
                }
              />

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
