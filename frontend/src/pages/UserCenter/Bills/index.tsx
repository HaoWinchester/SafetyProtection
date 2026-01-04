/**
 * 账单管理页面
 * Bills Management Page
 */

import React, { useState } from 'react'
import {
  Card,
  Table,
  Button,
  Space,
  Typography,
  Tag,
  DatePicker,
  Select,
  Row,
  Col,
  Statistic,
  Modal,
  Form,
  InputNumber,
  message,
  Descriptions,
} from 'antd'
import {
  DollarOutlined,
  SearchOutlined,
  DownloadOutlined,
  PayCircleOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'

const { Title, Text, Paragraph } = Typography
const { RangePicker } = DatePicker
const { Option } = Select

/**
 * 账单类型定义
 */
interface Bill {
  id: string
  billNo: string
  type: 'recharge' | 'consume' | 'refund'
  amount: number
  status: 'pending' | 'paid' | 'failed' | 'refunded'
  paymentMethod?: string
  createTime: string
  description: string
}

/**
 * Bills组件
 */
const Bills: React.FC = () => {
  const [rechargeModalVisible, setRechargeModalVisible] = useState(false)
  const [loading, setLoading] = useState(false)

  // 模拟账单数据
  const [bills] = useState<Bill[]>([
    {
      id: '1',
      billNo: 'B20240101001',
      type: 'recharge',
      amount: 100.00,
      status: 'paid',
      paymentMethod: '微信支付',
      createTime: '2024-01-01 10:00:00',
      description: '账户充值',
    },
    {
      id: '2',
      billNo: 'B20240102001',
      type: 'consume',
      amount: 25.50,
      status: 'paid',
      createTime: '2024-01-02 14:30:00',
      description: 'API调用消费',
    },
  ])

  /**
   * 充值处理
   */
  const handleRecharge = async (values: any) => {
    setLoading(true)
    // 模拟API调用
    setTimeout(() => {
      setLoading(false)
      setRechargeModalVisible(false)
      message.success('充值成功!')
    }, 1000)
  }

  /**
   * 导出账单
   */
  const handleExport = () => {
    message.info('导出功能开发中...')
  }

  /**
   * 获取账单类型标签
   */
  const getTypeTag = (type: string) => {
    const typeMap: Record<string, { color: string; text: string }> = {
      recharge: { color: 'success', text: '充值' },
      consume: { color: 'blue', text: '消费' },
      refund: { color: 'orange', text: '退款' },
    }
    const config = typeMap[type] || { color: 'default', text: type }
    return <Tag color={config.color}>{config.text}</Tag>
  }

  /**
   * 获取账单状态标签
   */
  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      pending: { color: 'warning', text: '待支付' },
      paid: { color: 'success', text: '已支付' },
      failed: { color: 'error', text: '失败' },
      refunded: { color: 'default', text: '已退款' },
    }
    const config = statusMap[status] || { color: 'default', text: status }
    return <Tag color={config.color}>{config.text}</Tag>
  }

  /**
   * 表格列定义
   */
  const columns: ColumnsType<Bill> = [
    {
      title: '账单编号',
      dataIndex: 'billNo',
      key: 'billNo',
      render: (text: string) => <Text code>{text}</Text>,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => getTypeTag(type),
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number, record: Bill) => (
        <Text
          style={{
            color: record.type === 'recharge' ? '#52c41a' : '#ff4d4f',
            fontWeight: 600,
          }}
        >
          ¥{amount.toFixed(2)}
        </Text>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status),
    },
    {
      title: '支付方式',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      render: (method?: string) => method || '-',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
    },
  ]

  return (
    <div>
      <Title level={2}>账单管理</Title>
      <Paragraph type="secondary">
        查看和管理您的账户账单
      </Paragraph>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="账户余额"
              prefix="¥"
              value={100.00}
              precision={2}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="本月消费"
              prefix="¥"
              value={25.50}
              precision={2}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="累计充值"
              prefix="¥"
              value={100.00}
              precision={2}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="待支付金额"
              prefix="¥"
              value={0.00}
              precision={2}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 账单列表 */}
      <Card>
        <div style={{ marginBottom: 16 }}>
          <Space>
            <Button
              type="primary"
              icon={<PayCircleOutlined />}
              onClick={() => setRechargeModalVisible(true)}
            >
              充值
            </Button>
            <Button
              icon={<DownloadOutlined />}
              onClick={handleExport}
            >
              导出账单
            </Button>
            <RangePicker
              placeholder={['开始日期', '结束日期']}
              style={{ width: 240 }}
            />
            <Select
              placeholder="账单类型"
              allowClear
              style={{ width: 120 }}
            >
              <Option value="recharge">充值</Option>
              <Option value="consume">消费</Option>
              <Option value="refund">退款</Option>
            </Select>
            <Select
              placeholder="账单状态"
              allowClear
              style={{ width: 120 }}
            >
              <Option value="paid">已支付</Option>
              <Option value="pending">待支付</Option>
              <Option value="failed">失败</Option>
            </Select>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={bills}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
      </Card>

      {/* 充值模态框 */}
      <Modal
        title="账户充值"
        open={rechargeModalVisible}
        onCancel={() => setRechargeModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form
          layout="vertical"
          onFinish={handleRecharge}
        >
          <Form.Item
            label="充值金额"
            name="amount"
            rules={[
              { required: true, message: '请输入充值金额' },
              { type: 'number', min: 1, max: 10000, message: '充值金额为1-10000元' },
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="请输入充值金额"
              prefix="¥"
              min={1}
              max={10000}
              precision={2}
            />
          </Form.Item>

          <Form.Item label="支付方式">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button block size="large" style={{ textAlign: 'left' }}>
                <img src="/wechat.png" alt="" style={{ width: 24, marginRight: 8 }} />
                微信支付
              </Button>
              <Button block size="large" style={{ textAlign: 'left' }}>
                <img src="/alipay.png" alt="" style={{ width: 24, marginRight: 8 }} />
                支付宝
              </Button>
            </Space>
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              loading={loading}
            >
              确认充值
            </Button>
          </Form.Item>

          <Descriptions column={1} size="small">
            <Descriptions.Item label="注意事项">
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                <li>单次充值金额最低1元,最高10000元</li>
                <li>充值到账时间通常为1-5分钟</li>
                <li>如有问题,请联系客服</li>
              </ul>
            </Descriptions.Item>
          </Descriptions>
        </Form>
      </Modal>
    </div>
  )
}

export default Bills
