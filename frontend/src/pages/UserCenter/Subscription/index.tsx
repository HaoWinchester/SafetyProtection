import React, { useState, useEffect } from 'react'
import { Card, Statistic, Row, Col, Progress, Tag, Button, message, Spin, Alert } from 'antd'
import { ArrowUpOutlined, ReloadOutlined, WarningOutlined } from '@ant-design/icons'
import { userService } from '@/services/userService'

const Subscription: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [overview, setOverview] = useState<any>(null)

  const loadOverview = async () => {
    try {
      setLoading(true)
      console.log('加载套餐总览...')
      const data = await userService.getSubscriptionOverview()
      console.log('套餐总览数据:', data)
      setOverview(data)
    } catch (error: any) {
      // 如果是取消的请求(重复请求被阻止),不显示错误消息
      if (!error?.silent && !error?.isCanceled) {
        console.error('加载套餐总览失败:', error)
        message.error('加载套餐总览失败: ' + (error as Error).message)
      } else {
        console.log('套餐总览请求被取消(重复请求或页面卸载)')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOverview()
  }, [])

  const usagePercent = overview ? Math.round((overview.used_quota / overview.total_quota) * 100) : 0

  if (loading && !overview) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '50px 0' }}>
          <Spin size="large" tip="加载中..." />
        </div>
      </Card>
    )
  }

  return (
    <div>
      <Card
        title="套餐总览"
        extra={<Button icon={<ReloadOutlined />} onClick={loadOverview} loading={loading}>刷新</Button>}
      >
        {overview && (
          <Alert
            message="当前套餐信息"
            description={`您正在使用 ${overview.package_name || '免费版'}`}
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        <Row gutter={16}>
          <Col span={8}>
            <Card>
              <Statistic
                title="当前套餐"
                value={overview?.package_name || '免费版'}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="已用配额"
                value={overview?.used_quota || 0}
                suffix={`/ ${overview?.total_quota || 50}`}
                valueStyle={{ color: usagePercent > 80 ? '#cf1322' : undefined }}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="剩余配额"
                value={overview?.remaining_quota || 50}
                prefix={<ArrowUpOutlined />}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
        </Row>

        <Card style={{ marginTop: 24 }} title="配额使用情况">
          <Progress
            percent={usagePercent}
            status={usagePercent > 80 ? 'exception' : 'active'}
            strokeColor={{
              '0%': '#108ee9',
              '100%': usagePercent > 80 ? '#ff4d4f' : '#87d068',
            }}
          />
          {usagePercent > 80 && (
            <Alert
              message="配额不足警告"
              description="您的配额使用已超过80%,建议及时升级套餐或充值"
              type="warning"
              showIcon
              style={{ marginTop: 16 }}
            />
          )}
          <div style={{ marginTop: 16 }}>
            <Tag color={overview?.status === 'active' ? 'success' : 'default'}>
              状态: {overview?.status === 'active' ? '激活' : '未激活'}
            </Tag>
            <Tag color="blue">
              到期时间: {overview?.end_date ? new Date(overview.end_date).toLocaleDateString() : '无'}
            </Tag>
            <Tag color="purple">
              自动续费: {overview?.auto_renew ? '已开启' : '未开启'}
            </Tag>
          </div>
        </Card>

        {overview && usagePercent > 80 && (
          <Card style={{ marginTop: 16 }}>
            <Button type="primary" size="large" block>
              立即升级套餐
            </Button>
          </Card>
        )}
      </Card>
    </div>
  )
}

export default Subscription
