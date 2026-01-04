import React, { useState, useEffect } from 'react'
import { Card, Select, Row, Col, Statistic, List } from 'antd'
import { userService } from '@/services/userService'

const Usage: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [usageData, setUsageData] = useState<any>(null)
  const [days, setDays] = useState(30)

  const loadUsage = async () => {
    try {
      setLoading(true)
      const data = await userService.getUsageStatistics(days)
      setUsageData(data)
    } catch (error) {
      console.error('加载用量统计失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadUsage() }, [days])

  return (
    <div>
      <Card
        title="用量统计"
        extra={
          <Select
            value={days}
            onChange={setDays}
            style={{ width: 120 }}
          >
            <Select.Option value={7}>最近7天</Select.Option>
            <Select.Option value={30}>最近30天</Select.Option>
            <Select.Option value={90}>最近90天</Select.Option>
          </Select>
        }
      >
        <Row gutter={16}>
          <Col span={8}>
            <Statistic
              title="总调用次数"
              value={usageData?.total_requests || 0}
              loading={loading}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="总消耗Token"
              value={usageData?.total_tokens || 0}
              loading={loading}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="日均使用"
              value={usageData?.daily_usage?.length || 0}
              suffix="次"
              loading={loading}
            />
          </Col>
        </Row>

        <Card style={{ marginTop: 24 }} title="每日使用明细" loading={loading}>
          <List
            dataSource={usageData?.daily_usage || []}
            renderItem={(item: any) => (
              <List.Item>
                <List.Item.Meta
                  title={item.date}
                  description={`使用 ${item.tokens} tokens`}
                />
              </List.Item>
            )}
            pagination={{ pageSize: 10 }}
          />
        </Card>
      </Card>
    </div>
  )
}

export default Usage
