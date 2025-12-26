/**
 * 页面头部组件
 * Header component
 */

import React, { useState } from 'react'
import { Layout, Menu, Button, Dropdown, Avatar, Space, Typography } from 'antd'
import {
  DashboardOutlined,
  SafetyOutlined,
  FileTextOutlined,
  MonitorOutlined,
  SettingOutlined,
  UserOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BellOutlined,
} from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'
import type { MenuProps } from 'antd'

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
  const location = useLocation()

  /**
   * 用户菜单
   */
  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人资料',
    },
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
        <Button
          type="text"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={onToggle}
          style={{
            color: 'white',
            fontSize: 16,
          }}
        />

        {/* Logo */}
        <Space>
          <SafetyOutlined style={{ fontSize: 24, color: '#1890ff' }} />
          <Text style={{ color: 'white', fontSize: 18, fontWeight: 600 }}>
            LLM安全检测工具
          </Text>
        </Space>
      </Space>

      {/* 右侧 */}
      <Space size="middle">
        {/* 通知 */}
        <Dropdown menu={{ items: notificationMenuItems }} placement="bottomRight">
          <Button type="text" icon={<BellOutlined />} style={{ color: 'white' }} />
        </Dropdown>

        {/* 用户信息 */}
        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
          <Space style={{ cursor: 'pointer' }}>
            <Avatar icon={<UserOutlined />} />
            <Text style={{ color: 'white' }}>管理员</Text>
          </Space>
        </Dropdown>
      </Space>
    </AntHeader>
  )
}

export default Header
