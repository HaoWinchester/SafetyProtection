/**
 * 统计卡片组件
 * Statistic card component
 */

import React from 'react'
import { Card, Statistic, Typography } from 'antd'
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons'
import type { StatisticProps } from 'antd'

const { Text } = Typography

/**
 * StatisticCard组件
 */
interface StatisticCardProps extends StatisticProps {
  title: string
  value: number
  prefix?: React.ReactNode
  suffix?: string
  trend?: number // 趋势百分比
  loading?: boolean
  color?: string
}

const StatisticCard: React.FC<StatisticCardProps> = ({
  title,
  value,
  prefix,
  suffix,
  trend,
  loading,
  color,
}) => {
  return (
    <Card loading={loading} hoverable>
      <Statistic
        title={
          <Space>
            <Text type="secondary">{title}</Text>
            {trend !== undefined && (
              <Text
                style={{
                  fontSize: 12,
                  color: trend >= 0 ? '#52c41a' : '#ff4d4f',
                }}
              >
                {trend >= 0 ? (
                  <ArrowUpOutlined />
                ) : (
                  <ArrowDownOutlined />
                )}
                {Math.abs(trend)}%
              </Text>
            )}
          </Space>
        }
        value={value}
        prefix={prefix}
        suffix={suffix}
        valueStyle={{ color }}
      />
    </Card>
  )
}

// 引入Space组件
import { Space } from 'antd'

export default StatisticCard
