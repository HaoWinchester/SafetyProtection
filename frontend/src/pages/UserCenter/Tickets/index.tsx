import React, { useState, useEffect } from 'react'
import { Card, Table, Button, Modal, Form, Input, Select, message, Space, Tag } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { userService } from '@/services/userService'

const Tickets: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [tickets, setTickets] = useState<any[]>([])
  const [modalVisible, setModalVisible] = useState(false)
  const [form] = Form.useForm()

  const loadTickets = async () => {
    try {
      setLoading(true)
      console.log('开始加载工单列表...')
      const data = await userService.getTickets()
      console.log('工单列表数据:', data)
      setTickets(data.items || [])
    } catch (error: any) {
      // 如果是取消的请求(重复请求被阻止),不显示错误消息
      if (!error?.silent && !error?.isCanceled) {
        console.error('加载工单列表失败:', error)
        message.error('加载工单列表失败: ' + (error as Error).message)
      } else {
        console.log('工单列表请求被取消(重复请求或页面卸载)')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadTickets() }, [])

  const handleCreate = async (values: any) => {
    try {
      await userService.createTicket(values)
      message.success('工单创建成功')
      setModalVisible(false)
      form.resetFields()
      await loadTickets()
    } catch (error: any) {
      // 如果是取消的请求(重复请求被阻止),不显示错误消息
      if (!error?.silent && !error?.isCanceled) {
        message.error('创建工单失败')
      } else {
        console.log('创建工单请求被取消(重复请求或页面卸载)')
      }
    }
  }

  const columns = [
    { title: '工单ID', dataIndex: 'ticket_id', key: 'ticket_id' },
    { title: '标题', dataIndex: 'title', key: 'title' },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      render: (cat: string) => <Tag>{cat}</Tag>
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      render: (p: string) => {
        const color = p === 'high' ? 'red' : p === 'medium' ? 'orange' : 'green'
        return <Tag color={color}>{p}</Tag>
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => {
        const color = s === 'open' ? 'blue' : s === 'processing' ? 'orange' : 'green'
        const text = s === 'open' ? '待处理' : s === 'processing' ? '处理中' : '已关闭'
        return <Tag color={color}>{text}</Tag>
      }
    },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at' },
  ]

  return (
    <div>
      <Card
        title="工单记录"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
            新建工单
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={tickets}
          rowKey="ticket_id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="新建工单"
        open={modalVisible}
        onCancel={() => { setModalVisible(false); form.resetFields() }}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item label="标题" name="title" rules={[{ required: true }]}>
            <Input placeholder="请输入工单标题" />
          </Form.Item>
          <Form.Item label="分类" name="category" rules={[{ required: true }]}>
            <Select placeholder="请选择分类">
              <Select.Option value="technical">技术问题</Select.Option>
              <Select.Option value="billing">账单问题</Select.Option>
              <Select.Option value="feature">功能建议</Select.Option>
              <Select.Option value="other">其他</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="优先级" name="priority" initialValue="medium">
            <Select>
              <Select.Option value="low">低</Select.Option>
              <Select.Option value="medium">中</Select.Option>
              <Select.Option value="high">高</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="描述" name="description" rules={[{ required: true }]}>
            <Input.TextArea rows={4} placeholder="请详细描述您的问题" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Tickets
