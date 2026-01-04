import React, { useState, useEffect } from 'react'
import { Card, Table, Tag, DatePicker, Button, Space, Statistic, Row, Col, Modal, Form, Input, Select, message } from 'antd'
import { ReloadOutlined, PlusOutlined, DownloadOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker

interface Bill {
  id: string
  billNo: string
  type: 'consume' | 'recharge' | 'refund'
  amount: number
  balance: number
  status: 'paid' | 'pending' | 'failed'
  createTime: string
  description: string
}

const Billing: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [bills, setBills] = useState<Bill[]>([])
  const [rechargeModalVisible, setRechargeModalVisible] = useState(false)
  const [form] = Form.useForm()

  const loadBills = async () => {
    setLoading(true)
    // 模拟数据
    setTimeout(() => {
      const mockData: Bill[] = [
        {
          id: '1',
          billNo: 'BILL20240101001',
          type: 'consume',
          amount: -0.0523,
          balance: 95.1234,
          status: 'paid',
          createTime: '2024-01-01 14:30:25',
          description: 'GLM-4 API调用',
        },
        {
          id: '2',
          billNo: 'BILL20240101002',
          type: 'consume',
          amount: -0.0312,
          balance: 95.1757,
          status: 'paid',
          createTime: '2024-01-01 15:20:10',
          description: 'GLM-4-0520 API调用',
        },
        {
          id: '3',
          billNo: 'RECHARGE20240101001',
          type: 'recharge',
          amount: 100,
          balance: 95.2069,
          status: 'paid',
          createTime: '2024-01-01 10:00:00',
          description: '账户充值',
        },
      ]
      setBills(mockData)
      setLoading(false)
    }, 500)
  }

  useEffect(() => {
    loadBills()
  }, [])

  const handleRecharge = async (values: any) => {
    try {
      message.success('充值成功!')
      setRechargeModalVisible(false)
      form.resetFields()
      await loadBills()
    } catch (error) {
      message.error('充值失败')
    }
  }

  const columns = [
    {
      title: '账单号',
      dataIndex: 'billNo',
      key: 'billNo',
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const config = {
          consume: { text: '消费', color: 'orange' },
          recharge: { text: '充值', color: 'green' },
          refund: { text: '退款', color: 'blue' },
        }
        const { text, color } = config[type as keyof typeof config]
        return <Tag color={color}>{text}</Tag>
      },
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => (
        <span style={{ color: amount > 0 ? '#52c41a' : '#ff4d4f', fontWeight: 'bold' }}>
          {amount > 0 ? '+' : ''}{amount.toFixed(4)}
        </span>
      ),
    },
    {
      title: '账户余额',
      dataIndex: 'balance',
      key: 'balance',
      render: (balance: number) => `¥${balance.toFixed(4)}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const config = {
          paid: { text: '已完成', color: 'success' },
          pending: { text: '处理中', color: 'processing' },
          failed: { text: '失败', color: 'error' },
        }
        const { text, color } = config[status as keyof typeof config]
        return <Tag color={color}>{text}</Tag>
      },
    },
    {
      title: '说明',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: '时间',
      dataIndex: 'createTime',
      key: 'createTime',
    },
  ]

  const currentBalance = bills.length > 0 ? bills[0].balance : 0
  const totalRecharge = bills.filter(b => b.type === 'recharge').reduce((sum, b) => sum + b.amount, 0)
  const totalConsume = Math.abs(bills.filter(b => b.type === 'consume').reduce((sum, b) => sum + b.amount, 0))

  return (
    <div>
      <Card
        title="账单管理"
        extra={
          <Space>
            <RangePicker />
            <Button icon={<ReloadOutlined />} onClick={loadBills} loading={loading}>
              刷新
            </Button>
            <Button icon={<DownloadOutlined />}>
              导出账单
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setRechargeModalVisible(true)}>
              充值
            </Button>
          </Space>
        }
      >
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Statistic
              title="当前余额"
              value={currentBalance}
              precision={4}
              prefix="¥"
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="累计充值"
              value={totalRecharge}
              precision={4}
              prefix="¥"
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="累计消费"
              value={totalConsume}
              precision={4}
              prefix="¥"
              valueStyle={{ color: '#cf1322' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="账单记录"
              value={bills.length}
              suffix="条"
            />
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={bills}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
      </Card>

      <Modal
        title="账户充值"
        open={rechargeModalVisible}
        onCancel={() => {
          setRechargeModalVisible(false)
          form.resetFields()
        }}
        onOk={() => form.submit()}
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleRecharge}
        >
          <Form.Item
            label="充值金额"
            name="amount"
            rules={[
              { required: true, message: '请输入充值金额' },
              {
                pattern: /^(0|[1-9]\d*)(\.\d{1,4})?$/,
                message: '请输入有效的金额',
              },
            ]}
          >
            <Input
              prefix="¥"
              placeholder="请输入充值金额"
              type="number"
              step="0.01"
              min="0.01"
            />
          </Form.Item>

          <Form.Item
            label="支付方式"
            name="paymentMethod"
            rules={[{ required: true, message: '请选择支付方式' }]}
          >
            <Select placeholder="请选择支付方式">
              <Select.Option value="alipay">支付宝</Select.Option>
              <Select.Option value="wechat">微信支付</Select.Option>
              <Select.Option value="bank">银行转账</Select.Option>
            </Select>
          </Form.Item>

          <div style={{ background: '#f0f2f5', padding: 16, borderRadius: 8 }}>
            <div style={{ marginBottom: 8 }}>
              <span style={{ color: '#999' }}>充值金额:</span>
              <span style={{ float: 'right', fontWeight: 'bold' }}>¥{form.getFieldValue('amount') || '0.00'}</span>
            </div>
            <div>
              <span style={{ color: '#999' }}>到账金额:</span>
              <span style={{ float: 'right', fontWeight: 'bold', color: '#52c41a' }}>
                ¥{form.getFieldValue('amount') || '0.00'}
              </span>
            </div>
          </div>
        </Form>
      </Modal>
    </div>
  )
}

export default Billing
