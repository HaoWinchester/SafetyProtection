/**
 * 主布局组件
 * Main layout component
 */

import React, { useState } from 'react'
import { Layout, Menu } from 'antd'
import {
  DashboardOutlined,
  SafetyOutlined,
  FileSearchOutlined,
  ScanOutlined,
  BarChartOutlined,
  MonitorOutlined,
  SettingOutlined,
  ExperimentOutlined,
  FileTextOutlined,
  PlayCircleOutlined,
  DatabaseOutlined,
} from '@ant-design/icons'
import { useNavigate, useLocation, Outlet } from 'react-router-dom'
import Header from './Header'
import type { MenuProps } from 'antd'

const { Sider, Content } = Layout

/**
 * 菜单项配置
 */
const menuItems: MenuProps['items'] = [
  {
    key: '/dashboard',
    icon: <DashboardOutlined />,
    label: '仪表盘',
  },
  {
    key: 'detection',
    icon: <SafetyOutlined />,
    label: '安全检测',
    children: [
      {
        key: '/detection/realtime',
        icon: <ScanOutlined />,
        label: '实时检测',
      },
      {
        key: '/detection/batch',
        icon: <FileSearchOutlined />,
        label: '批量检测',
      },
    ],
  },
  {
    key: 'evaluation',
    icon: <ExperimentOutlined />,
    label: '安全测评',
    children: [
      {
        key: '/evaluation/config',
        icon: <SettingOutlined />,
        label: '测评配置',
      },
      {
        key: '/evaluation/execute',
        icon: <PlayCircleOutlined />,
        label: '执行测评',
      },
      {
        key: '/evaluation/test-cases',
        icon: <DatabaseOutlined />,
        label: '测试用例',
      },
      {
        key: '/evaluation/results',
        icon: <FileTextOutlined />,
        label: '测评结果',
      },
    ],
  },
  {
    key: '/analysis',
    icon: <BarChartOutlined />,
    label: '数据分析',
  },
  {
    key: '/monitor',
    icon: <MonitorOutlined />,
    label: '系统监控',
  },
  {
    key: '/settings',
    icon: <SettingOutlined />,
    label: '系统设置',
  },
]

/**
 * MainLayout组件
 */
const MainLayout: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)

  /**
   * 菜单点击处理
   */
  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    navigate(key)
  }

  /**
   * 获取当前选中的菜单键
   */
  const getSelectedKeys = () => {
    return [location.pathname]
  }

  /**
   * 获取当前展开的菜单键
   */
  const getOpenKeys = () => {
    const path = location.pathname
    if (path.startsWith('/detection')) {
      return ['detection']
    }
    if (path.startsWith('/evaluation')) {
      return ['evaluation']
    }
    return []
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* 侧边栏 */}
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
        }}
        theme="dark"
      >
        {/* Logo区域 */}
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          {!collapsed && (
            <div style={{ color: 'white', fontSize: 18, fontWeight: 600 }}>
              安全检测
            </div>
          )}
        </div>

        {/* 菜单 */}
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={getSelectedKeys()}
          defaultOpenKeys={getOpenKeys()}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>

      {/* 主体内容 */}
      <Layout style={{ marginLeft: collapsed ? 80 : 200, transition: 'all 0.2s' }}>
        {/* 头部 */}
        <Header collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />

        {/* 内容区 */}
        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            minHeight: 'calc(100vh - 64px - 48px)',
            background: '#f0f2f5',
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default MainLayout
