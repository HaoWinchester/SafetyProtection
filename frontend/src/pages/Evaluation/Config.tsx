/**
 * 测评配置页面
 * Evaluation configuration page
 */
import React, { useState, useEffect } from 'react'
import {
  Card,
  Button,
  Table,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  message,
  Space,
  Tag,
  Popconfirm
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, PlayCircleOutlined } from '@ant-design/icons'
import api from '../../services/api'

const { Option } = Select
const { TextArea } = Input

interface EvaluationConfig {
  id: number
  config_id: string
  model_name: string
  model_type: string
  api_endpoint: string
  evaluation_level: string
  concurrent_requests: number
  timeout_ms: number
  is_active: boolean
  created_at: string
}

const EvaluationConfigPage: React.FC = () => {
  const [configs, setConfigs] = useState<EvaluationConfig[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingConfig, setEditingConfig] = useState<EvaluationConfig | null>(null)
  const [form] = Form.useForm()

  useEffect(() => {
    fetchConfigs()
  }, [])

  const fetchConfigs = async () => {
    setLoading(true)
    try {
      // TODO: 实现真实的API调用
      // const response = await api.get('/evaluation/configs')
      // setConfigs(response.data)

      // 模拟数据
      setConfigs([
        {
          id: 1,
          config_id: 'config_demo001',
          model_name: '测试模型(MOCK)',
          model_type: 'mock',
          api_endpoint: 'mock',
          evaluation_level: 'basic',
          concurrent_requests: 3,
          timeout_ms: 10000,
          is_active: true,
          created_at: new Date().toISOString()
        }
      ])
    } catch (error) {
      message.error('加载配置失败')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingConfig(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (config: EvaluationConfig) => {
    setEditingConfig(config)
    form.setFieldsValue(config)
    setModalVisible(true)
  }

  const handleDelete = async (configId: string) => {
    try {
      // await api.delete(`/evaluation/configs/${configId}`)
      message.success('删除成功')
      fetchConfigs()
    } catch (error) {
      message.error('删除失败')
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()

      if (editingConfig) {
        // await api.put(`/evaluation/configs/${editingConfig.config_id}`, values)
        message.success('更新成功')
      } else {
        // await api.post('/evaluation/configs', values)
        message.success('创建成功')
      }

      setModalVisible(false)
      fetchConfigs()
    } catch (error) {
      message.error('操作失败')
    }
  }

  const handleStartEvaluation = (configId: string) => {
    // TODO: 跳转到测评执行页面
    message.info('启动测评功能开发中...')
  }

  const columns = [
    {
      title: '模型名称',
      dataIndex: 'model_name',
      key: 'model_name',
    },
    {
      title: '模型类型',
      dataIndex: 'model_type',
      key: 'model_type',
      render: (type: string) => {
        const colors: Record<string, string> = {
          openai: 'green',
          claude: 'blue',
          mock: 'orange',
          local: 'purple'
        }
        return <Tag color={colors[type] || 'default'}>{type.toUpperCase()}</Tag>
      }
    },
    {
      title: '测评级别',
      dataIndex: 'evaluation_level',
      key: 'evaluation_level',
      render: (level: string) => {
        const colors: Record<string, string> = {
          basic: 'green',
          standard: 'blue',
          advanced: 'orange',
          expert: 'red'
        }
        return <Tag color={colors[level]}>{level.toUpperCase()}</Tag>
      }
    },
    {
      title: '并发数',
      dataIndex: 'concurrent_requests',
      key: 'concurrent_requests',
    },
    {
      title: '超时(ms)',
      dataIndex: 'timeout_ms',
      key: 'timeout_ms',
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (active: boolean) => (
        <Tag color={active ? 'success' : 'default'}>
          {active ? '启用' : '禁用'}
        </Tag>
      )
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: EvaluationConfig) => (
        <Space>
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            size="small"
            onClick={() => handleStartEvaluation(record.config_id)}
          >
            启动测评
          </Button>
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个配置吗?"
            onConfirm={() => handleDelete(record.config_id)}
            okText="确定"
            cancelText="取消"
          >
            <Button icon={<DeleteOutlined />} size="small" danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Card
        title="测评配置管理"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            新建配置
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={configs}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={editingConfig ? '编辑配置' : '新建配置'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="模型名称"
            name="model_name"
            rules={[{ required: true, message: '请输入模型名称' }]}
          >
            <Input placeholder="例如: GPT-3.5 Turbo" />
          </Form.Item>

          <Form.Item
            label="模型类型"
            name="model_type"
            rules={[{ required: true, message: '请选择模型类型' }]}
          >
            <Select placeholder="请选择">
              <Option value="mock">Mock (测试模式)</Option>
              <Option value="openai">OpenAI</Option>
              <Option value="claude">Claude</Option>
              <Option value="local">本地模型</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="API端点"
            name="api_endpoint"
            rules={[{ required: true, message: '请输入API端点' }]}
          >
            <Input placeholder="https://api.openai.com/v1/chat/completions" />
          </Form.Item>

          <Form.Item label="API密钥" name="api_key">
            <Input.Password placeholder="sk-..." />
          </Form.Item>

          <Form.Item
            label="测评级别"
            name="evaluation_level"
            rules={[{ required: true, message: '请选择测评级别' }]}
          >
            <Select placeholder="请选择">
              <Option value="basic">Basic (基础级)</Option>
              <Option value="standard">Standard (标准级)</Option>
              <Option value="advanced">Advanced (高级级)</Option>
              <Option value="expert">Expert (专家级)</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="并发请求数"
            name="concurrent_requests"
            rules={[{ required: true, message: '请输入并发数' }]}
          >
            <InputNumber min={1} max={20} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            label="超时时间(ms)"
            name="timeout_ms"
            rules={[{ required: true, message: '请输入超时时间' }]}
          >
            <InputNumber min={1000} max={300000} step={1000} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default EvaluationConfigPage
