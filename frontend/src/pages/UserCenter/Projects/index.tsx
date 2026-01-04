/**
 * API Keys管理页面
 * API Keys Management Page
 */

import React, { useState, useEffect, useRef } from 'react'
import {
  Card,
  Table,
  Button,
  Space,
  Typography,
  Modal,
  Form,
  Input,
  message,
  Tag,
  Tooltip,
  Tabs,
  Row,
  Col,
  Statistic,
  Popconfirm,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ApiOutlined,
  CopyOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { userService } from '@/services/userService'

const { Title, Text, Paragraph } = Typography
const { TextArea } = Input

/**
 * API Key类型定义
 */
interface ApiKey {
  id: string
  name: string
  description: string
  api_key: string
  status: 'active' | 'inactive'
  create_time: string
  last_used: string
  call_count: number
}

/**
 * Projects组件
 */
const Projects: React.FC = () => {
  const [form] = Form.useForm()
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingApiKey, setEditingApiKey] = useState<ApiKey | null>(null)
  const [visibleApiKeys, setVisibleApiKeys] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)

  // 从后端API加载的API Key数据
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])

  // 使用ref跟踪是否正在加载,避免重复请求
  const isLoadingRef = useRef(false)
  // 使用ref跟踪是否已经加载过一次
  const hasLoadedRef = useRef(false)

  /**
   * 加载API Keys列表
   */
  const loadApiKeys = async () => {
    // 防止重复请求
    if (isLoadingRef.current) {
      return
    }

    try {
      isLoadingRef.current = true
      setLoading(true)
      const projects = await userService.getProjects()

      console.log('从API获取的原始数据:', projects)

      // 将Project类型转换为ApiKey类型
      const apiKeysData: ApiKey[] = projects.map((project: any) => {
        // 确保每个字段都有默认值
        return {
          id: project.id || '',
          name: project.name || '未命名',
          description: project.description || '',
          // 兼容后端返回的api_key(蛇形)和apiKey(驼峰)两种字段名
          api_key: project.api_key || project.apiKey || '',
          status: project.status || 'active',
          create_time: project.create_time || project.createTime || '',
          last_used: project.last_used || project.lastUsed || '-',
          call_count: project.call_count || project.callCount || 0,
        }
      })

      console.log('转换后的数据:', apiKeysData)
      setApiKeys(apiKeysData)
      hasLoadedRef.current = true
    } catch (error) {
      console.error('加载API Keys失败:', error)
      // 只在首次加载后显示错误,避免初始化时的错误干扰
      if (hasLoadedRef.current) {
        message.error('加载API Keys失败: ' + (error as Error).message)
      }
    } finally {
      setLoading(false)
      isLoadingRef.current = false
    }
  }

  /**
   * 组件挂载时加载数据
   */
  useEffect(() => {
    loadApiKeys()

    // 清理函数
    return () => {
      isLoadingRef.current = false
      hasLoadedRef.current = false
    }
  }, []) // 空依赖数组,只执行一次

  /**
   * 复制API Key
   */
  const copyApiKey = (apiKey: string) => {
    if (!apiKey) {
      message.error('API Key为空,无法复制')
      return
    }
    navigator.clipboard.writeText(apiKey).then(() => {
      message.success('API Key已复制到剪贴板')
    }).catch(() => {
      message.error('复制失败,请手动复制')
    })
  }

  /**
   * 切换API Key显示/隐藏
   */
  const toggleApiKeyVisibility = (keyId: string) => {
    const newVisibleKeys = new Set(visibleApiKeys)
    if (newVisibleKeys.has(keyId)) {
      newVisibleKeys.delete(keyId)
    } else {
      newVisibleKeys.add(keyId)
    }
    setVisibleApiKeys(newVisibleKeys)
  }

  /**
   * 格式化API Key显示
   */
  const formatApiKey = (apiKey: string, isVisible: boolean) => {
    // 添加空值保护
    if (!apiKey) {
      return 'N/A'
    }

    if (isVisible) {
      return apiKey
    }
    return `${apiKey.substring(0, 7)}${'*'.repeat(20)}${apiKey.substring(apiKey.length - 4)}`
  }

  /**
   * 打开新建API Key模态框
   */
  const handleCreate = () => {
    setEditingApiKey(null)
    form.resetFields()
    setIsModalVisible(true)
  }

  /**
   * 打开编辑API Key模态框
   */
  const handleEdit = (apiKey: ApiKey) => {
    setEditingApiKey(apiKey)
    form.setFieldsValue({
      name: apiKey.name,
      description: apiKey.description,
    })
    setIsModalVisible(true)
  }

  /**
   * 删除API Key
   */
  const handleDelete = async (id: string) => {
    try {
      setLoading(true)
      await userService.deleteProject(id)
      // 重新加载数据
      await loadApiKeys()
      message.success('API Key已删除')
    } catch (error) {
      console.error('删除API Key失败:', error)
      message.error('删除API Key失败')
    } finally {
      setLoading(false)
    }
  }

  /**
   * 重新生成API Key
   */
  const handleRegenerate = async (id: string) => {
    try {
      setLoading(true)
      await userService.regenerateApiKey(id)
      // 重新加载数据
      await loadApiKeys()
      message.success('API Key重新生成成功')
    } catch (error) {
      console.error('重新生成API Key失败:', error)
      message.error('重新生成API Key失败')
    } finally {
      setLoading(false)
    }
  }

  /**
   * 提交表单
   */
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setLoading(true)

      if (editingApiKey) {
        // 更新API Key
        await userService.updateProject(editingApiKey.id, {
          name: values.name,
          description: values.description,
        })
        message.success('API Key更新成功')
      } else {
        // 创建新API Key
        await userService.createProject({
          name: values.name,
          description: values.description,
        })
        message.success('API Key创建成功')
      }

      // 重新加载数据
      await loadApiKeys()
      setIsModalVisible(false)
      form.resetFields()
    } catch (error) {
      console.error('表单提交失败:', error)
    } finally {
      setLoading(false)
    }
  }

  /**
   * 表格列定义
   */
  const columns: ColumnsType<ApiKey> = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: ApiKey) => (
        <Space direction="vertical" size={0}>
          <Text strong>{text}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.description}
          </Text>
        </Space>
      ),
    },
    {
      title: 'API Key',
      dataIndex: 'api_key',
      key: 'api_key',
      render: (apiKey: string, record: ApiKey) => {
        const isVisible = visibleApiKeys.has(record.id)
        return (
          <Space>
            <Text code style={{ fontSize: 12 }}>
              {formatApiKey(apiKey, isVisible)}
            </Text>
            <Tooltip title="复制">
              <Button
                type="text"
                size="small"
                icon={<CopyOutlined />}
                onClick={() => copyApiKey(apiKey)}
              />
            </Tooltip>
            <Tooltip title={isVisible ? '隐藏' : '显示'}>
              <Button
                type="text"
                size="small"
                icon={isVisible ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                onClick={() => toggleApiKeyVisibility(record.id)}
              />
            </Tooltip>
          </Space>
        )
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'success' : 'default'}>
          {status === 'active' ? '活跃' : '已停用'}
        </Tag>
      ),
    },
    {
      title: '调用次数',
      dataIndex: 'call_count',
      key: 'call_count',
      render: (count: number) => <Text>{count.toLocaleString()}</Text>,
    },
    {
      title: '创建时间',
      dataIndex: 'create_time',
      key: 'create_time',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: ApiKey) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => handleRegenerate(record.id)}
            disabled={loading}
          >
            重新生成
          </Button>
          <Popconfirm
            title="确定要删除这个API Key吗?"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  // 标签页配置
  const tabItems = [
    {
      key: 'list',
      label: 'API Keys列表',
      children: (
        <div>
          <Card>
            <div style={{ marginBottom: 16 }}>
              <Space>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleCreate}
                >
                  添加新的API Key
                </Button>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={loadApiKeys}
                  loading={loading}
                >
                  刷新
                </Button>
                <Text type="secondary">
                  共 {apiKeys.length} 个API Keys
                </Text>
              </Space>
            </div>

            <Table
              columns={columns}
              dataSource={apiKeys}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 个API Keys`,
              }}
            />
          </Card>
        </div>
      ),
    },
    {
      key: 'usage',
      label: '使用统计',
      children: (
        <Row gutter={[16, 16]}>
          <Col span={6}>
            <Card>
              <Statistic
                title="总API Keys数"
                value={apiKeys.length}
                prefix={<ApiOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="活跃Keys"
                value={apiKeys.filter(k => k.status === 'active').length}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="总调用次数"
                value={apiKeys.reduce((sum, k) => sum + k.call_count, 0)}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="本月调用"
                value={apiKeys.reduce((sum, k) => sum + k.call_count, 0)}
                suffix="次"
              />
            </Card>
          </Col>
        </Row>
      ),
    },
  ]

  return (
    <div>
      <Title level={2}>API Keys管理</Title>
      <Paragraph type="secondary">
        管理您的API Keys和调用统计
      </Paragraph>

      <Tabs
        defaultActiveKey="list"
        items={tabItems}
        size="large"
        style={{ marginTop: 24 }}
      />

      {/* 新建/编辑API Key模态框 */}
      <Modal
        title={editingApiKey ? '编辑API Key' : '添加新的API Key'}
        open={isModalVisible}
        onOk={handleSubmit}
        onCancel={() => {
          setIsModalVisible(false)
          form.resetFields()
        }}
        width={600}
        confirmLoading={loading}
      >
        <Form
          form={form}
          layout="vertical"
          autoComplete="off"
        >
          <Form.Item
            label="名称"
            name="name"
            rules={[
              { required: true, message: '请输入名称' },
              { min: 2, max: 50, message: '名称长度为2-50个字符' },
            ]}
          >
            <Input placeholder="请输入名称" />
          </Form.Item>

          <Form.Item
            label="描述"
            name="description"
            rules={[
              { required: true, message: '请输入描述' },
              { min: 5, max: 200, message: '描述长度为5-200个字符' },
            ]}
          >
            <TextArea
              rows={4}
              placeholder="请输入描述"
            />
          </Form.Item>

          {!editingApiKey && (
            <Form.Item label="API Key">
              <Input
                disabled
                value="创建后自动生成"
                placeholder="系统将自动生成API Key"
              />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  )
}

export default Projects
