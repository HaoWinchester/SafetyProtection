import React, { useState, useEffect } from 'react'
import { Card, Table, Tag, Button, Space, Modal, Form, Input, Select, message, Descriptions } from 'antd'
import { PlusOutlined, DownloadOutlined, EyeOutlined } from '@ant-design/icons'

interface Invoice {
  id: string
  invoiceNo: string
  type: 'electronic' | 'paper'
  amount: number
  status: 'pending' | 'approved' | 'rejected' | 'issued'
  applyTime: string
  title: string
  taxNo: string
  email: string
}

const Invoice: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [applyModalVisible, setApplyModalVisible] = useState(false)
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [form] = Form.useForm()

  const loadInvoices = async () => {
    setLoading(true)
    // 模拟数据
    setTimeout(() => {
      const mockData: Invoice[] = [
        {
          id: '1',
          invoiceNo: 'INV20240101001',
          type: 'electronic',
          amount: 100,
          status: 'issued',
          applyTime: '2024-01-01 10:00:00',
          title: '北京智谱华章科技有限公司',
          taxNo: '91110108MA01K3XXX',
          email: 'example@company.com',
        },
        {
          id: '2',
          invoiceNo: 'INV20240102001',
          type: 'paper',
          amount: 200,
          status: 'approved',
          applyTime: '2024-01-02 14:30:00',
          title: '测试公司',
          taxNo: '91110000MA00XXXXX',
          email: 'test@test.com',
        },
      ]
      setInvoices(mockData)
      setLoading(false)
    }, 500)
  }

  useEffect(() => {
    loadInvoices()
  }, [])

  const handleApply = async (values: any) => {
    try {
      message.success('发票申请已提交,请等待审核')
      setApplyModalVisible(false)
      form.resetFields()
      await loadInvoices()
    } catch (error) {
      message.error('申请失败')
    }
  }

  const handleViewDetail = (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setDetailModalVisible(true)
  }

  const columns = [
    {
      title: '发票号码',
      dataIndex: 'invoiceNo',
      key: 'invoiceNo',
    },
    {
      title: '发票类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const config = {
          electronic: { text: '电子发票', color: 'blue' },
          paper: { text: '纸质发票', color: 'green' },
        }
        const { text, color } = config[type as keyof typeof config]
        return <Tag color={color}>{text}</Tag>
      },
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => `¥${amount.toFixed(2)}`,
    },
    {
      title: '发票抬头',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const config = {
          pending: { text: '待审核', color: 'processing' },
          approved: { text: '已通过', color: 'success' },
          rejected: { text: '已拒绝', color: 'error' },
          issued: { text: '已开具', color: 'default' },
        }
        const { text, color } = config[status as keyof typeof config]
        return <Tag color={color}>{text}</Tag>
      },
    },
    {
      title: '申请时间',
      dataIndex: 'applyTime',
      key: 'applyTime',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Invoice) => (
        <Space>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            查看
          </Button>
          {record.status === 'issued' && (
            <Button
              size="small"
              icon={<DownloadOutlined />}
              type="primary"
            >
              下载
            </Button>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Card
        title="发票管理"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setApplyModalVisible(true)}>
            申请发票
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={invoices}
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
        title="申请发票"
        open={applyModalVisible}
        onCancel={() => {
          setApplyModalVisible(false)
          form.resetFields()
        }}
        onOk={() => form.submit()}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleApply}
        >
          <Form.Item
            label="发票类型"
            name="type"
            rules={[{ required: true, message: '请选择发票类型' }]}
          >
            <Select placeholder="请选择发票类型">
              <Select.Option value="electronic">电子发票</Select.Option>
              <Select.Option value="paper">纸质发票</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="发票抬头"
            name="title"
            rules={[
              { required: true, message: '请输入发票抬头' },
              { max: 100, message: '抬头长度不能超过100个字符' },
            ]}
          >
            <Input placeholder="请输入发票抬头(公司名称)" />
          </Form.Item>

          <Form.Item
            label="税号"
            name="taxNo"
            rules={[
              { required: true, message: '请输入税号' },
              {
                pattern: /^[A-Z0-9]{15,20}$/,
                message: '税号格式不正确',
              },
            ]}
          >
            <Input placeholder="请输入税号(15-20位字母或数字)" maxLength={20} />
          </Form.Item>

          <Form.Item
            label="开票金额"
            name="amount"
            rules={[
              { required: true, message: '请输入开票金额' },
              {
                pattern: /^(0|[1-9]\d*)(\.\d{1,2})?$/,
                message: '请输入有效的金额',
              },
            ]}
          >
            <Input
              prefix="¥"
              placeholder="请输入开票金额"
              type="number"
              step="0.01"
              min="0.01"
            />
          </Form.Item>

          <Form.Item
            label="接收邮箱"
            name="email"
            rules={[
              { required: true, message: '请输入接收邮箱' },
              { type: 'email', message: '邮箱格式不正确' },
            ]}
          >
            <Input placeholder="请输入接收发票的邮箱地址" />
          </Form.Item>

          <Form.Item
            label="备注"
            name="remark"
          >
            <Input.TextArea rows={3} placeholder="如有特殊要求,请在此说明" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="发票详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>,
          selectedInvoice?.status === 'issued' && (
            <Button key="download" type="primary" icon={<DownloadOutlined />}>
              下载发票
            </Button>
          ),
        ]}
        width={600}
      >
        {selectedInvoice && (
          <Descriptions column={2} bordered>
            <Descriptions.Item label="发票号码" span={2}>
              {selectedInvoice.invoiceNo}
            </Descriptions.Item>
            <Descriptions.Item label="发票类型">
              {selectedInvoice.type === 'electronic' ? '电子发票' : '纸质发票'}
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={
                selectedInvoice.status === 'issued' ? 'success' :
                selectedInvoice.status === 'approved' ? 'processing' :
                selectedInvoice.status === 'rejected' ? 'error' : 'default'
              }>
                {
                  selectedInvoice.status === 'issued' ? '已开具' :
                  selectedInvoice.status === 'approved' ? '已通过' :
                  selectedInvoice.status === 'rejected' ? '已拒绝' : '待审核'
                }
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="发票抬头" span={2}>
              {selectedInvoice.title}
            </Descriptions.Item>
            <Descriptions.Item label="税号" span={2}>
              {selectedInvoice.taxNo}
            </Descriptions.Item>
            <Descriptions.Item label="金额" span={2}>
              ¥{selectedInvoice.amount.toFixed(2)}
            </Descriptions.Item>
            <Descriptions.Item label="接收邮箱" span={2}>
              {selectedInvoice.email}
            </Descriptions.Item>
            <Descriptions.Item label="申请时间" span={2}>
              {selectedInvoice.applyTime}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  )
}

export default Invoice
