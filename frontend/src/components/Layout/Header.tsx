/**
 * 页面头部组件
 * Header component with authentication
 */

import React from 'react'
import { Layout, Button, Dropdown, Avatar, Space, Typography, message, Badge } from 'antd'
import {
  DashboardOutlined,
  SafetyOutlined,
  SettingOutlined,
  UserOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BellOutlined,
  ShoppingCartOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import type { MenuProps } from 'antd'
import { authService } from '../../services/auth'

const { Header: AntHeader } = Layout
const { Text } = Typography

/**
 * Header组件
 */
const Header: React.FC<{
  collapsed: boolean
  onToggle: () => void
}> = ({ collapsed, onToggle }) => {
  const navigate = useNavigate()
  const [quotaInfo, setQuotaInfo] = React.useState<any>(null)

  // Fetch quota info
  React.useEffect(() => {
    if (authService.isAuthenticated()) {
      authService.getQuotaInfo().then(setQuotaInfo).catch(() => {})
    }
  }, [])

  const user = authService.getCurrentUser()
  const isAuthenticated = authService.isAuthenticated()
  const isAdmin = authService.isAdmin()

  /**
   * 用户菜单 - 根据角色动态生成
   */
  const userMenuItems: MenuProps['items'] = isAuthenticated ? [
    // 用户中心 - 仅普通用户可见
    ...(!isAdmin ? [{
      key: 'usercenter',
      icon: <UserOutlined />,
      label: '用户中心',
      onClick: () => navigate('/usercenter'),
    }] : []),
    // 我的仪表板 - 仅普通用户可见
    ...(!isAdmin ? [{
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: '我的仪表板',
      onClick: () => navigate('/user-dashboard'),
    }] : []),
    // 管理控制台 - 仅管理员可见
    ...(isAdmin ? [{
      key: 'admin',
      icon: <SettingOutlined />,
      label: '管理控制台',
      onClick: () => navigate('/admin-dashboard'),
    }] : []),
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '设置',
      onClick: () => navigate('/settings'),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      danger: true,
      onClick: () => {
        authService.logout()
        message.success('已退出登录')
        navigate('/login')
      },
    },
  ] : [
    {
      key: 'login',
      icon: <UserOutlined />,
      label: '登录',
      onClick: () => navigate('/login'),
    },
  ]

  /**
   * 通知菜单
   */
  const notificationMenuItems: MenuProps['items'] = [
    {
      key: '1',
      label: '系统通知',
    },
    {
      key: '2',
      label: '检测告警',
    },
    {
      key: '3',
      label: '全部标记为已读',
    },
  ]

  return (
    <AntHeader
      style={{
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#001529',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      {/* 左侧 */}
      <Space size="large">
        {/* 折叠按钮 */}
        {isAuthenticated && (
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={onToggle}
            style={{
              color: 'white',
              fontSize: 16,
            }}
          />
        )}

        {/* Logo */}
        <Space
          style={{ cursor: 'pointer' }}
          onClick={() => navigate(isAuthenticated ? '/dashboard' : '/')}
        >
          <SafetyOutlined style={{ fontSize: 24, color: '#1890ff' }} />
          <Text style={{ color: 'white', fontSize: 18, fontWeight: 600 }}>
            幻谱安全检测
          </Text>
        </Space>
      </Space>

      {/* 右侧 */}
      <Space size="middle">
        {/* 配额信息 (仅登录用户) */}
        {isAuthenticated && quotaInfo && (
          <Badge count={quotaInfo.remaining_quota} overflowCount={9999}>
            <Button
              type="text"
              icon={<ShoppingCartOutlined />}
              style={{ color: 'white' }}
              onClick={() => navigate('/user-dashboard')}
            >
              配额
            </Button>
          </Badge>
        )}

        {/* 通知 */}
        <Dropdown menu={{ items: notificationMenuItems }} placement="bottomRight">
          <Button type="text" icon={<BellOutlined />} style={{ color: 'white' }} />
        </Dropdown>

        {/* 用户信息 */}
        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
          <Space style={{ cursor: 'pointer' }}>
            <Avatar icon={<UserOutlined />} />
            <Text style={{ color: 'white' }}>
              {isAuthenticated ? user?.username : '未登录'}
            </Text>
            {isAuthenticated && user?.role === 'admin' && (
              <Badge count="管理员" style={{ backgroundColor: '#f5222d' }} />
            )}
          </Space>
        </Dropdown>
      </Space>
    </AntHeader>
  )
}

export default Header
