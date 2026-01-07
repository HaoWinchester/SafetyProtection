/**
 * 主布局组件
 * Main layout component
 */

import React, { useState, useMemo } from 'react'
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
  UserOutlined,
  TeamOutlined,
  BookOutlined,
  ApiOutlined,
  ThunderboltOutlined,
  WalletOutlined,
  CustomerServiceOutlined,
  QuestionCircleOutlined,
  CommentOutlined,
  ShoppingCartOutlined,
} from '@ant-design/icons'
import { useNavigate, useLocation, Outlet } from 'react-router-dom'
import { authService } from '../../services/auth'
import Header from './Header'
import type { MenuProps } from 'antd'

const { Sider, Content } = Layout

/**
 * MainLayout组件
 */
const MainLayout: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [openKeys, setOpenKeys] = useState<string[]>([])

  // 获取当前用户信息
  const isAdmin = authService.isAdmin()
  const isAuthenticated = authService.isAuthenticated()

  /**
   * 根据用户角色动态生成菜单项
   */
  const menuItems: MenuProps['items'] = useMemo(() => {
    // 基础菜单项(所有用户可见)
    const baseItems = [
      {
        key: '/dashboard',
        icon: <DashboardOutlined />,
        label: '控制台',
      },
      {
        key: 'detection',
        icon: <SafetyOutlined />,
        label: '安全检测',
        children: [
          {
            key: '/detection',
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
        key: '/analysis',
        icon: <BarChartOutlined />,
        label: '数据分析',
      },
      // {
      //   key: '/monitor',
      //   icon: <MonitorOutlined />,
      //   label: '系统监控',
      // },
    ]

    // 管理员专属菜单
    if (isAdmin) {
      baseItems.push({
        key: '/admin-dashboard',
        icon: <TeamOutlined />,
        label: '管理控制台',
      })
    }

    // 普通用户专属菜单 - 用户中心
    if (!isAdmin && isAuthenticated) {
      

      baseItems.push({
        key: 'subscription',
        icon: <ShoppingCartOutlined />,
        label: '编程套餐',
        children: [
          {
            key: '/usercenter/subscription',
            icon: <DashboardOutlined />,
            label: '总览',
          },
          {
            key: '/usercenter/packages',
            icon: <WalletOutlined />,
            label: '我的套餐',
          },
          {
            key: '/usercenter/usage',
            icon: <BarChartOutlined />,
            label: '用量统计',
          },
        ],
      })

      baseItems.push({
        key: 'billing',
        icon: <WalletOutlined />,
        label: '账单发票',
        children: [
          {
            key: '/usercenter/billing',
            icon: <WalletOutlined />,
            label: '账单管理',
          },
          {
            key: '/usercenter/invoice',
            icon: <FileTextOutlined />,
            label: '发票管理',
          },
          {
            key: '/usercenter/recharge',
            icon: <WalletOutlined />,
            label: '充值中心',
          },
        ],
      })

      baseItems.push({
        key: 'project',
        icon: <ApiOutlined />,
        label: '项目管理',
        children: [
          {
            key: '/usercenter/projects',
            icon: <ApiOutlined />,
            label: 'API Keys',
          },
          {
            key: '/usercenter/apicalls',
            icon: <DatabaseOutlined />,
            label: 'API调用',
          },
        ],
      })

      baseItems.push({
        key: 'benefits',
        icon: <ThunderboltOutlined />,
        label: '用户权益',
        children: [
          {
            key: '/usercenter/benefits',
            icon: <SafetyOutlined />,
            label: '用户权益',
          },
        ],
      })

      baseItems.push({
        key: 'support',
        icon: <CustomerServiceOutlined />,
        label: '工单记录',
        children: [
          {
            key: '/usercenter/tickets',
            icon: <CustomerServiceOutlined />,
            label: '工单记录',
          },
        ],
      })
    }

    // 帮助支持(所有用户)
    baseItems.push({
      key: 'help',
      icon: <QuestionCircleOutlined />,
      label: '帮助中心',
      children: [
        {
          key: '/help',
          icon: <QuestionCircleOutlined />,
          label: '帮助中心',
        },
        {
          key: '/community',
          icon: <CommentOutlined />,
          label: '技术社群',
        },
      ],
    })

    // 设置菜单 - 根据用户角色显示不同的子菜单
    if (isAdmin) {
      // 管理员的设置菜单
      baseItems.push({
        key: '/settings',
        icon: <SettingOutlined />,
        label: '设置',
      })
    } else {
      // 普通用户的设置菜单 - 包含账号、认证等子项
      baseItems.push({
        key: 'settings',
        icon: <SettingOutlined />,
        label: '设置',
        children: [
          {
            key: '/usercenter/account',
            icon: <UserOutlined />,
            label: '账号设置',
          },
          {
            key: '/usercenter/verify',
            icon: <SafetyOutlined />,
            label: '实名认证',
          },
          {
            key: '/usercenter/auth',
            icon: <FileTextOutlined />,
            label: '授权管理',
          },
        ],
      })
    }
      
    return baseItems
  }, [isAdmin, isAuthenticated])

  /**
   * 根据当前路由初始化展开的菜单
   */
  React.useEffect(() => {
    const path = location.pathname
    if (path.startsWith('/detection')) {
      setOpenKeys(['detection'])
    } else if (path.startsWith('/usercenter')) {
      // 根据具体路径展开对应的子菜单
      if (path.includes('/account') || path.includes('/verify') || path.includes('/auth')) {
        setOpenKeys(['settings'])
      } else if (path.includes('/subscription') || path.includes('/packages') || path.includes('/usage')) {
        setOpenKeys(['subscription'])
      } else if (path.includes('/billing') || path.includes('/invoice') || path.includes('/recharge')) {
        setOpenKeys(['billing'])
      } else if (path.includes('/projects') || path.includes('/apicalls')) {
        setOpenKeys(['project'])
      } else if (path.includes('/benefits')) {
        setOpenKeys(['benefits'])
      } else if (path.includes('/tickets')) {
        setOpenKeys(['support'])
      } else {
        setOpenKeys(['settings'])
      }
    } else if (path.startsWith('/help') || path.startsWith('/community')) {
      setOpenKeys(['help'])
    } else if (path.startsWith('/user-dashboard') || path.startsWith('/admin-dashboard')) {
      setOpenKeys(['user'])
    } else {
      setOpenKeys([])
    }
  }, [location.pathname])

  /**
   * 菜单点击处理
   */
  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    navigate(key)
  }

  /**
   * 子菜单展开/收起处理
   */
  const handleOpenChange: MenuProps['onOpenChange'] = (keys) => {
    setOpenKeys(keys)
  }

  /**
   * 获取当前选中的菜单键
   */
  const getSelectedKeys = () => {
    return [location.pathname]
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
          openKeys={openKeys}
          onOpenChange={handleOpenChange}
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
