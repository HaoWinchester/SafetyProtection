/**
 * 通用加载组件
 * Common loading component
 */

import React from 'react'
import { Spin, Space, Typography } from 'antd'
import { LoadingOutlined } from '@ant-design/icons'

const { Text } = Typography

/**
 * Loading组件
 */
interface LoadingProps {
  tip?: string
  size?: 'small' | 'default' | 'large'
  spinning?: boolean
  children?: React.ReactNode
}

const Loading: React.FC<LoadingProps> = ({
  tip = '加载中...',
  size = 'default',
  spinning = true,
  children,
}) => {
  if (children) {
    return (
      <Spin tip={tip} size={size} spinning={spinning}>
        {children}
      </Spin>
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
        padding: '48px',
      }}
    >
      <Space direction="vertical" size="middle">
        <Spin indicator={<LoadingOutlined style={{ fontSize: size === 'large' ? 48 : 32 }} spin />} />
        <Text type="secondary">{tip}</Text>
      </Space>
    </div>
  )
}

export default Loading
