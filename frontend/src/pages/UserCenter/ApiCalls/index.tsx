import React, { useState, useEffect } from 'react'
import { Card, Table, Tag, DatePicker, Select, Space, Button, Statistic, Row, Col } from 'antd'
import { ReloadOutlined, DownloadOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker

interface ApiCall {
  id: string
  timestamp: string
  model: string
  endpoint: string
  method: string
  status: 'success' | 'error'
  tokens: number
  duration: number
  cost: number
}

const ApiCalls: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [calls, setCalls] = useState<ApiCall[]>([])
  const [dateRange, setDateRange] = useState<any>([dayjs().subtract(7, 'days'), dayjs()])
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const loadApiCalls = async () => {
    setLoading(true)
    // 模拟数据 - 实际应该从后端API获取
    setTimeout(() => {
      const mockData: ApiCall[] = Array.from({ length: 20 }, (_, i) => ({
        id: `call_${i + 1}`,
        timestamp: dayjs().subtract(Math.floor(Math.random() * 7), 'days').format('YYYY-MM-DD HH:mm:ss'),
        model: ['GLM-4', 'GLM-4-0520', 'GLM-3-Turbo'][Math.floor(Math.random() * 3)],
        endpoint: ['/chat/completions', '/embeddings', '/tools'][Math.floor(Math.random() * 3)],
        method: 'POST',
        status: Math.random() > 0.1 ? 'success' : 'error',
        tokens: Math.floor(Math.random() * 5000) + 100,
        duration: Math.floor(Math.random() * 2000) + 100,
        cost: parseFloat((Math.random() * 0.1).toFixed(4)),
      }))
      setCalls(mockData)
      setLoading(false)
    }, 500)
  }

  useEffect(() => {
    loadApiCalls()
  }, [dateRange, statusFilter])

  const columns = [
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 180,
    },
    {
      title: '模型',
      dataIndex: 'model',
      key: 'model',
      render: (model: string) => <Tag color="blue">{model}</Tag>,
    },
    {
      title: '接口',
      dataIndex: 'endpoint',
      key: 'endpoint',
      render: (endpoint: string) => <code>{endpoint}</code>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'success' ? 'success' : 'error'}>
          {status === 'success' ? '成功' : '失败'}
        </Tag>
      ),
    },
    {
      title: 'Token数',
      dataIndex: 'tokens',
      key: 'tokens',
      render: (tokens: number) => tokens.toLocaleString(),
    },
    {
      title: '耗时(ms)',
      dataIndex: 'duration',
      key: 'duration',
    },
    {
      title: '费用(元)',
      dataIndex: 'cost',
      key: 'cost',
      render: (cost: number) => `¥${cost.toFixed(4)}`,
    },
  ]

  const totalCost = calls.reduce((sum, call) => sum + call.cost, 0)
  const totalTokens = calls.reduce((sum, call) => sum + call.tokens, 0)
  const successRate = calls.length > 0
    ? (calls.filter(c => c.status === 'success').length / calls.length * 100).toFixed(1)
    : '0'

  return (
    <div>
      <Card
        title="API调用详情"
        extra={
          <Space>
            <RangePicker
              value={dateRange}
              onChange={(dates) => setDateRange(dates)}
            />
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 120 }}
            >
              <Select.Option value="all">全部状态</Select.Option>
              <Select.Option value="success">成功</Select.Option>
              <Select.Option value="error">失败</Select.Option>
            </Select>
            <Button icon={<ReloadOutlined />} onClick={loadApiCalls} loading={loading}>
              刷新
            </Button>
            <Button icon={<DownloadOutlined />}>
              导出
            </Button>
          </Space>
        }
      >
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Statistic title="总调用次数" value={calls.length} />
          </Col>
          <Col span={6}>
            <Statistic title="总Token数" value={totalTokens} />
          </Col>
          <Col span={6}>
            <Statistic
              title="总费用"
              value={totalCost}
              precision={4}
              prefix="¥"
            />
          </Col>
          <Col span={6}>
            <Statistic title="成功率" value={successRate} suffix="%" />
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={calls}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
      </Card>
    </div>
  )
}

export default ApiCalls
