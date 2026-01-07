import React, { useState, useEffect } from 'react'
import { Card, Row, Col, Button, Tag, message, Modal, Statistic, Spin, Empty } from 'antd'
import { CheckCircleOutlined, ThunderboltOutlined, ReloadOutlined } from '@ant-design/icons'
import { userService } from '@/services/userService'

const Packages: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [packages, setPackages] = useState<any>(null)
  const [subscribing, setSubscribing] = useState<string | null>(null)

  const loadPackages = async () => {
    try {
      setLoading(true)
      console.log('开始加载套餐列表...')
      const data = await userService.getPackages()
      console.log('套餐数据:', data)
      setPackages(data)
    } catch (error: any) {
      // 如果是取消的请求(重复请求被阻止),不显示错误消息
      if (!error?.silent && !error?.isCanceled) {
        console.error('加载套餐列表失败:', error)
        message.error('加载套餐列表失败: ' + (error as Error).message)
      } else {
        console.log('套餐列表请求被取消(重复请求或页面卸载)')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPackages()
  }, [])

  const handleSubscribe = async (packageId: string) => {
    setSubscribing(packageId)
    try {
      console.log('订阅套餐:', packageId)
      await userService.subscribePackage(packageId)
      message.success('套餐订阅成功')
      await loadPackages()
    } catch (error: any) {
      // 如果是取消的请求(重复请求被阻止),不显示错误消息
      if (!error?.silent && !error?.isCanceled) {
        console.error('套餐订阅失败:', error)
        message.error('套餐订阅失败: ' + (error as Error).message)
      } else {
        console.log('套餐订阅请求被取消(重复请求或页面卸载)')
      }
    } finally {
      setSubscribing(null)
    }
  }

  // 如果packages为空或未加载完成,显示加载状态
  if (loading && !packages) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '50px 0' }}>
          <Spin size="large" tip="加载套餐列表中..." />
        </div>
      </Card>
    )
  }

  // 如果加载完成但没有数据
  if (!loading && (!packages || !packages.packages || packages.packages.length === 0)) {
    return (
      <div>
        <Card
          title="我的套餐"
          extra={<Button icon={<ReloadOutlined />} onClick={loadPackages}>刷新</Button>}
        >
          <Empty description="暂无可用套餐" />
        </Card>
      </div>
    )
  }

  return (
    <div>
      <Card
        title="我的套餐"
        extra={<Button icon={<ReloadOutlined />} onClick={loadPackages} loading={loading}>刷新</Button>}
        loading={loading}
      >
        <Row gutter={[16, 16]}>
          {packages?.packages?.map((pkg: any) => {
            const isLoading = subscribing === pkg.package_id

            return (
              <Col span={8} key={pkg.package_id}>
                <Card
                  title={pkg.package_name}
                  extra={
                    pkg.is_subscribed ? (
                      <Tag color="success">当前套餐</Tag>
                    ) : null
                  }
                  hoverable
                  style={{
                    border: pkg.is_subscribed ? '2px solid #52c41a' : '1px solid #d9d9d9'
                  }}
                  actions={[
                    <Button
                      key="subscribe"
                      type={pkg.is_subscribed ? "default" : "primary"}
                      disabled={pkg.is_subscribed || !pkg.can_subscribe || isLoading}
                      onClick={() => handleSubscribe(pkg.package_id)}
                      loading={isLoading}
                    >
                      {isLoading ? '处理中...' : pkg.is_subscribed ? '已订阅' : '立即订阅'}
                    </Button>
                  ]}
                >
                  <Statistic
                    title="价格"
                    prefix="¥"
                    value={pkg.price || 0}
                    suffix={`/${pkg.duration || '90天'}`}
                  />
                  <div style={{ marginTop: 16 }}>
                    <Statistic
                      title="配额"
                      value={pkg.quota_amount || 0}
                      suffix="次"
                    />
                  </div>
                  <div style={{ marginTop: 16 }}>
                    {pkg.include_vision && <Tag color="blue"><CheckCircleOutlined /> 视觉理解</Tag>}
                    {pkg.include_search && <Tag color="green"><CheckCircleOutlined /> 联网搜索</Tag>}
                    {pkg.include_mcp && <Tag color="purple"><CheckCircleOutlined /> MCP集成</Tag>}
                  </div>
                  {pkg.description && (
                    <div style={{ marginTop: 12, color: '#666', fontSize: 12 }}>
                      {pkg.description}
                    </div>
                  )}
                </Card>
              </Col>
            )
          })}
        </Row>
      </Card>
    </div>
  )
}

export default Packages
