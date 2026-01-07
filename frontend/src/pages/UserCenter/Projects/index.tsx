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
  DatePicker,
  Select,
  Descriptions,
  Drawer,
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
  BookOutlined,
  CodeOutlined,
  HistoryOutlined,
  SafetyOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { userService } from '@/services/userService'

const { Title, Text, Paragraph } = Typography
const { TextArea } = Input

// 引入 Prism.js 样式用于代码高亮
const prismStyle = `
  pre {
    background-color: #f5f5f5;
    padding: 16px;
    border-radius: 4px;
    overflow-x: auto;
  }
  code {
    font-family: 'Courier New', Courier, monospace;
    font-size: 14px;
    line-height: 1.5;
  }
  .code-block {
    background-color: #f5f5f5;
    padding: 12px;
    border-radius: 4px;
    border-left: 3px solid #1890ff;
    margin: 8px 0;
  }
`

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
 * API调用日志类型定义
 */
interface ApiLog {
  id: string
  user_id: string
  api_key_id: string
  endpoint: string
  method: string
  request_text: string
  request_body: any
  response_status: number
  response_body: any
  risk_score: number
  risk_level: string
  is_compliant: boolean
  threat_category: string
  processing_time_ms: number
  ip_address: string
  call_time: string
}

/**
 * API统计类型定义
 */
interface ApiStats {
  period_days: number
  total_calls: number
  risk_distribution: Record<string, number>
  threat_categories: Array<Record<string, number>>
  compliance_stats: {
    compliant_calls: number
    non_compliant_calls: number
    compliance_rate: number
  }
  performance: {
    avg_processing_time_ms: number
  }
  daily_calls: Array<{ date: string; count: number }>
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

  // API调用日志相关状态
  const [apiLogs, setApiLogs] = useState<ApiLog[]>([])
  const [apiLogsLoading, setApiLogsLoading] = useState(false)
  const [apiLogsPagination, setApiLogsPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  })
  const [apiLogsFilters, setApiLogsFilters] = useState({
    start_date: undefined as any,
    end_date: undefined as any,
    risk_level: undefined as string | undefined,
  })

  // API统计相关状态
  const [apiStats, setApiStats] = useState<ApiStats | null>(null)
  const [apiStatsLoading, setApiStatsLoading] = useState(false)

  // 日志详情抽屉状态
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false)
  const [selectedLog, setSelectedLog] = useState<ApiLog | null>(null)

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
    } catch (error: any) {
      // 如果是取消的请求(重复请求被阻止),不显示错误消息
      if (!error?.silent && !error?.isCanceled) {
        console.error('加载API Keys失败:', error)
        // 只在首次加载后显示错误,避免初始化时的错误干扰
        if (hasLoadedRef.current) {
          message.error('加载API Keys失败: ' + (error as Error).message)
        }
      } else {
        console.log('API Keys请求被取消(重复请求或页面卸载)')
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
    } catch (error: any) {
      // 如果是取消的请求(重复请求被阻止),不显示错误消息
      if (!error?.silent && !error?.isCanceled) {
        console.error('删除API Key失败:', error)
        message.error('删除API Key失败')
      } else {
        console.log('删除API Key请求被取消(重复请求或页面卸载)')
      }
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
    } catch (error: any) {
      // 如果是取消的请求(重复请求被阻止),不显示错误消息
      if (!error?.silent && !error?.isCanceled) {
        console.error('重新生成API Key失败:', error)
        message.error('重新生成API Key失败')
      } else {
        console.log('重新生成API Key请求被取消(重复请求或页面卸载)')
      }
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
   * 加载API调用日志
   */
  const loadApiLogs = async (page: number = 1) => {
    try {
      setApiLogsLoading(true)
      const params: any = {
        page,
        page_size: apiLogsPagination.pageSize,
      }

      if (apiLogsFilters.start_date) {
        params.start_date = apiLogsFilters.start_date.format('YYYY-MM-DD')
      }
      if (apiLogsFilters.end_date) {
        params.end_date = apiLogsFilters.end_date.format('YYYY-MM-DD')
      }
      if (apiLogsFilters.risk_level) {
        params.risk_level = apiLogsFilters.risk_level
      }

      const response = await userService.getApiLogs(params)
      setApiLogs(response.items || [])
      setApiLogsPagination({
        current: response.page,
        pageSize: response.page_size,
        total: response.total,
      })
    } catch (error: any) {
      // 如果是取消的请求(重复请求被阻止),不显示错误消息
      if (!error?.silent && !error?.isCanceled) {
        console.error('加载API调用日志失败:', error)
        message.error('加载API调用日志失败')
      } else {
        console.log('API调用日志请求被取消(重复请求或页面卸载)')
      }
    } finally {
      setApiLogsLoading(false)
    }
  }

  /**
   * 加载API调用统计
   */
  const loadApiStats = async () => {
    try {
      setApiStatsLoading(true)
      const stats = await userService.getApiLogsStats(30)
      setApiStats(stats)
    } catch (error: any) {
      // 如果是取消的请求(重复请求被阻止),不显示错误消息
      if (!error?.silent && !error?.isCanceled) {
        console.error('加载API调用统计失败:', error)
        message.error('加载API调用统计失败')
      } else {
        console.log('API调用统计请求被取消(重复请求或页面卸载)')
      }
    } finally {
      setApiStatsLoading(false)
    }
  }

  /**
   * 查看日志详情
   */
  const viewLogDetail = async (logId: string) => {
    try {
      const detail = await userService.getApiLogDetail(logId)
      setSelectedLog(detail)
      setDetailDrawerVisible(true)
    } catch (error: any) {
      // 如果是取消的请求(重复请求被阻止),不显示错误消息
      if (!error?.silent && !error?.isCanceled) {
        console.error('获取日志详情失败:', error)
        message.error('获取日志详情失败')
      } else {
        console.log('日志详情请求被取消(重复请求或页面卸载)')
      }
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
            <Button
              type="text"
              size="small"
              icon={isVisible ? <EyeInvisibleOutlined /> : <EyeOutlined />}
              onClick={() => toggleApiKeyVisibility(record.id)}
            />
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined />}
              onClick={() => copyApiKey(apiKey)}
            />
          </Space>
        )
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status === 'active' ? '活跃' : '停用'}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'create_time',
      key: 'create_time',
      render: (date: string) => (
        <Text style={{ fontSize: 12 }}>
          {date ? new Date(date).toLocaleString('zh-CN') : '-'}
        </Text>
      ),
    },
    {
      title: '最后使用',
      dataIndex: 'last_used',
      key: 'last_used',
      render: (date: string) => (
        <Text style={{ fontSize: 12 }}>
          {date && date !== '-' ? new Date(date).toLocaleString('zh-CN') : '从未使用'}
        </Text>
      ),
    },
    {
      title: '调用次数',
      dataIndex: 'call_count',
      key: 'call_count',
      render: (count: number) => <Text strong>{count}</Text>,
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: ApiKey) => (
        <Space size="small">
          <Tooltip title="编辑">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip title="重新生成">
            <Popconfirm
              title="确定要重新生成API Key吗?"
              onConfirm={() => handleRegenerate(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button type="text" icon={<ReloadOutlined />} />
            </Popconfirm>
          </Tooltip>
          <Tooltip title="删除">
            <Popconfirm
              title="确定要删除这个API Key吗?"
              onConfirm={() => handleDelete(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ]

  /**
   * API调用日志表格列定义
   */
  const apiLogsColumns: ColumnsType<ApiLog> = [
    {
      title: '调用时间',
      dataIndex: 'call_time',
      key: 'call_time',
      render: (date: string) => (
        <Text style={{ fontSize: 12 }}>
          {date ? new Date(date).toLocaleString('zh-CN') : '-'}
        </Text>
      ),
    },
    {
      title: '端点',
      dataIndex: 'endpoint',
      key: 'endpoint',
      render: (endpoint: string) => <Text code>{endpoint}</Text>,
    },
    {
      title: '方法',
      dataIndex: 'method',
      key: 'method',
      render: (method: string) => (
        <Tag color={method === 'GET' ? 'blue' : method === 'POST' ? 'green' : 'orange'}>
          {method}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'response_status',
      key: 'response_status',
      render: (status: number) => (
        <Tag color={status >= 200 && status < 300 ? 'green' : status >= 400 && status < 500 ? 'orange' : 'red'}>
          {status}
        </Tag>
      ),
    },
    {
      title: '风险等级',
      dataIndex: 'risk_level',
      key: 'risk_level',
      render: (level: string) => {
        const colorMap: Record<string, string> = {
          low: 'green',
          medium: 'orange',
          high: 'red',
          critical: 'red',
        }
        return level ? (
          <Tag color={colorMap[level] || 'default'}>
            {level.toUpperCase()}
          </Tag>
        ) : <Text type="secondary">-</Text>
      },
    },
    {
      title: '风险分数',
      dataIndex: 'risk_score',
      key: 'risk_score',
      render: (score: number) => {
        if (score === null || score === undefined) return <Text type="secondary">-</Text>
        const color = score >= 0.8 ? '#ff4d4f' : score >= 0.5 ? '#faad14' : '#52c41a'
        return <Text strong style={{ color }}>{score.toFixed(2)}</Text>
      },
    },
    {
      title: '合规性',
      dataIndex: 'is_compliant',
      key: 'is_compliant',
      render: (isCompliant: boolean) => (
        <Tag color={isCompliant ? 'green' : 'red'} icon={isCompliant ? <SafetyOutlined /> : undefined}>
          {isCompliant ? '合规' : '不合规'}
        </Tag>
      ),
    },
    {
      title: '处理时间',
      dataIndex: 'processing_time_ms',
      key: 'processing_time_ms',
      render: (time: number) => <Text>{time}ms</Text>,
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: ApiLog) => (
        <Button
          type="link"
          size="small"
          onClick={() => viewLogDetail(record.id)}
        >
          查看详情
        </Button>
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
        <div>
          <Card style={{ marginBottom: 16 }}>
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={loadApiStats}
                loading={apiStatsLoading}
              >
                刷新统计
              </Button>
              <Text type="secondary">最近30天的API调用统计</Text>
            </Space>
          </Card>

          {apiStats ? (
            <Row gutter={[16, 16]}>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="总调用次数"
                    value={apiStats.total_calls}
                    prefix={<ApiOutlined />}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="合规调用"
                    value={apiStats.compliance_stats.compliant_calls}
                    valueStyle={{ color: '#52c41a' }}
                    suffix={`/ ${apiStats.total_calls}`}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="不合规调用"
                    value={apiStats.compliance_stats.non_compliant_calls}
                    valueStyle={{ color: '#ff4d4f' }}
                    suffix={`/ ${apiStats.total_calls}`}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="合规率"
                    value={apiStats.compliance_stats.compliance_rate}
                    suffix="%"
                    valueStyle={{
                      color: apiStats.compliance_stats.compliance_rate >= 80 ? '#52c41a' :
                             apiStats.compliance_stats.compliance_rate >= 60 ? '#faad14' : '#ff4d4f'
                    }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="平均处理时间"
                    value={apiStats.performance.avg_processing_time_ms}
                    suffix="ms"
                    prefix={<SafetyOutlined />}
                  />
                </Card>
              </Col>
              <Col span={18}>
                <Card title="风险等级分布">
                  <Row gutter={[16, 16]}>
                    {Object.entries(apiStats.risk_distribution).map(([level, count]) => (
                      <Col span={6} key={level}>
                        <Statistic
                          title={level.toUpperCase()}
                          value={count}
                          valueStyle={{
                            color: level === 'low' ? '#52c41a' :
                                   level === 'medium' ? '#faad14' :
                                   level === 'high' ? '#ff4d4f' : '#cf1322'
                          }}
                        />
                      </Col>
                    ))}
                  </Row>
                </Card>
              </Col>
            </Row>
          ) : (
            <Card>
              <Text type="secondary">暂无统计数据</Text>
            </Card>
          )}
        </div>
      ),
    },
    {
      key: 'logs',
      label: 'API调用详情',
      children: (
        <div>
          <Card style={{ marginBottom: 16 }}>
            <Space wrap>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => loadApiLogs(1)}
                loading={apiLogsLoading}
              >
                刷新
              </Button>
              <DatePicker.RangePicker
                value={[apiLogsFilters.start_date, apiLogsFilters.end_date]}
                onChange={(dates) => {
                  setApiLogsFilters({
                    ...apiLogsFilters,
                    start_date: dates ? dates[0] : undefined,
                    end_date: dates ? dates[1] : undefined,
                  })
                  loadApiLogs(1)
                }}
                placeholder={['开始日期', '结束日期']}
              />
              <Select
                style={{ width: 150 }}
                value={apiLogsFilters.risk_level}
                onChange={(value) => {
                  setApiLogsFilters({ ...apiLogsFilters, risk_level: value })
                  loadApiLogs(1)
                }}
                placeholder="风险等级"
                allowClear
              >
                <Select.Option value="low">低风险</Select.Option>
                <Select.Option value="medium">中风险</Select.Option>
                <Select.Option value="high">高风险</Select.Option>
                <Select.Option value="critical">严重风险</Select.Option>
              </Select>
              <Text type="secondary">共 {apiLogsPagination.total} 条记录</Text>
            </Space>
          </Card>

          <Card>
            <Table
              columns={apiLogsColumns}
              dataSource={apiLogs}
              rowKey="id"
              loading={apiLogsLoading}
              pagination={{
                current: apiLogsPagination.current,
                pageSize: apiLogsPagination.pageSize,
                total: apiLogsPagination.total,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条记录`,
                onChange: (page, pageSize) => {
                  setApiLogsPagination({
                    ...apiLogsPagination,
                    current: page,
                    pageSize: pageSize || 10,
                  })
                  loadApiLogs(page)
                },
              }}
            />
          </Card>

          {/* 日志详情抽屉 */}
          <Drawer
            title="API调用详情"
            placement="right"
            width={720}
            open={detailDrawerVisible}
            onClose={() => {
              setDetailDrawerVisible(false)
              setSelectedLog(null)
            }}
          >
            {selectedLog && (
              <Descriptions column={1} bordered>
                <Descriptions.Item label="调用ID">{selectedLog.id}</Descriptions.Item>
                <Descriptions.Item label="调用时间">
                  {selectedLog.call_time ? new Date(selectedLog.call_time).toLocaleString('zh-CN') : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="端点">
                  <Text code>{selectedLog.endpoint}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="方法">
                  <Tag color={selectedLog.method === 'GET' ? 'blue' : 'green'}>
                    {selectedLog.method}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="响应状态">
                  <Tag
                    color={
                      selectedLog.response_status >= 200 && selectedLog.response_status < 300
                        ? 'green'
                        : 'red'
                    }
                  >
                    {selectedLog.response_status}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="风险分数">
                  <Text
                    strong
                    style={{
                      color:
                        selectedLog.risk_score >= 0.8
                          ? '#ff4d4f'
                          : selectedLog.risk_score >= 0.5
                          ? '#faad14'
                          : '#52c41a',
                    }}
                  >
                    {selectedLog.risk_score?.toFixed(2) || '-'}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="风险等级">
                  {selectedLog.risk_level ? (
                    <Tag
                      color={
                        selectedLog.risk_level === 'low'
                          ? 'green'
                          : selectedLog.risk_level === 'medium'
                          ? 'orange'
                          : 'red'
                      }
                    >
                      {selectedLog.risk_level.toUpperCase()}
                    </Tag>
                  ) : (
                    '-'
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="合规性">
                  <Tag color={selectedLog.is_compliant ? 'green' : 'red'}>
                    {selectedLog.is_compliant ? '合规' : '不合规'}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="威胁类别">
                  {selectedLog.threat_category || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="处理时间">
                  {selectedLog.processing_time_ms}ms
                </Descriptions.Item>
                <Descriptions.Item label="IP地址">
                  {selectedLog.ip_address || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="请求文本" span={3}>
                  <Text
                    copyable
                    style={{
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      maxHeight: 200,
                      overflow: 'auto',
                    }}
                  >
                    {selectedLog.request_text || '-'}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="请求体" span={3}>
                  {selectedLog.request_body ? (
                    <pre
                      style={{
                        background: '#f5f5f5',
                        padding: 12,
                        borderRadius: 4,
                        maxHeight: 300,
                        overflow: 'auto',
                      }}
                    >
                      {JSON.stringify(selectedLog.request_body, null, 2)}
                    </pre>
                  ) : (
                    '-'
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="响应体" span={3}>
                  {selectedLog.response_body ? (
                    <pre
                      style={{
                        background: '#f5f5f5',
                        padding: 12,
                        borderRadius: 4,
                        maxHeight: 300,
                        overflow: 'auto',
                      }}
                    >
                      {JSON.stringify(selectedLog.response_body, null, 2)}
                    </pre>
                  ) : (
                    '-'
                  )}
                </Descriptions.Item>
              </Descriptions>
            )}
          </Drawer>
        </div>
      ),
    },
    {
      key: 'docs',
      label: '使用说明',
      children: (
        <div style={{ padding: '24px' }}>
          <style>{prismStyle}</style>

          <Title level={3}>
            <BookOutlined /> API 使用说明
          </Title>
          <Paragraph>
            本文档介绍如何使用API Key调用大模型安全检测服务。
          </Paragraph>

          {/* 目录 */}
          <Card title="目录" style={{ marginBottom: 16 }}>
            <Paragraph>
              <ul>
                <li><a href="#auth">1. 身份认证</a></li>
                <li><a href="#detect">2. 检测接口</a></li>
                <li><a href="#response">3. 响应格式</a></li>
                <li><a href="#examples">4. 代码示例</a></li>
                <li><a href="#error">5. 错误处理</a></li>
              </ul>
            </Paragraph>
          </Card>

          {/* 1. 身份认证 */}
          <Card id="auth" title="1. 身份认证" style={{ marginBottom: 16 }}>
            <Paragraph>
              所有API请求都需要在HTTP Header中携带您的API Key进行身份认证：
            </Paragraph>
            <pre><code>{`Authorization: Bearer YOUR_API_KEY`}</code></pre>
            <Paragraph>
              <Text strong>获取API Key：</Text>
            </Paragraph>
            <ul>
              <li>在"API Keys列表"标签页中创建新的API Key</li>
              <li>复制生成的API Key（只显示一次，请妥善保存）</li>
              <li>在请求头中添加 <Text code>Authorization</Text> 字段</li>
            </ul>
          </Card>

          {/* 2. 检测接口 */}
          <Card id="detect" title="2. 检测接口" style={{ marginBottom: 16 }}>
            <Paragraph>
              <Text strong>接口地址：</Text>
            </Paragraph>
            <pre><code>{`POST http://localhost:8000/api/v1/detection/detect`}</code></pre>

            <Paragraph>
              <Text strong>请求头：</Text>
            </Paragraph>
            <pre><code>{`Content-Type: application/json
Authorization: Bearer YOUR_API_KEY`}</code></pre>

            <Paragraph>
              <Text strong>请求体：</Text>
            </Paragraph>
            <pre><code>{`{
  "text": "待检测的文本内容",
  "language": "zh-CN",
  "detection_type": "prompt_injection"
}`}</code></pre>

            <Paragraph>
              <Text strong>参数说明：</Text>
            </Paragraph>
            <Table
              dataSource={[
                { key: '1', param: 'text', type: 'string', required: '是', desc: '待检测的文本内容，最大长度10000字符' },
                { key: '2', param: 'language', type: 'string', required: '否', desc: '文本语言，默认zh-CN（简体中文）' },
                { key: '3', param: 'detection_type', type: 'string', required: '否', desc: '检测类型：prompt_injection（提示词注入）等' },
              ]}
              columns={[
                { title: '参数名', dataIndex: 'param', key: 'param' },
                { title: '类型', dataIndex: 'type', key: 'type' },
                { title: '必填', dataIndex: 'required', key: 'required' },
                { title: '说明', dataIndex: 'desc', key: 'desc' },
              ]}
              pagination={false}
              size="small"
            />
          </Card>

          {/* 3. 响应格式 */}
          <Card id="response" title="3. 响应格式" style={{ marginBottom: 16 }}>
            <Paragraph>
              <Text strong>成功响应：</Text>
            </Paragraph>
            <pre><code>{`{
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2026-01-05T20:00:00.000Z",
  "is_compliant": false,
  "risk_score": 0.85,
  "risk_level": "high",
  "threat_category": "prompt_injection",
  "detection_details": {
    "matched_patterns": ["忽略之前的指令", "以...的角色"],
    "confidence": 0.92
  },
  "recommendation": "block",
  "processing_time_ms": 45
}`}</code></pre>

            <Paragraph>
              <Text strong>字段说明：</Text>
            </Paragraph>
            <Table
              dataSource={[
                { key: '1', field: 'request_id', desc: '请求唯一标识符' },
                { key: '2', field: 'is_compliant', desc: '是否合规：true-合规，false-不合规' },
                { key: '3', field: 'risk_score', desc: '风险分数：0.0-1.0，越高越危险' },
                { key: '4', field: 'risk_level', desc: '风险等级：low/medium/high/critical' },
                { key: '5', field: 'threat_category', desc: '威胁类别' },
                { key: '6', field: 'recommendation', desc: '建议操作：pass/warn/block' },
              ]}
              columns={[
                { title: '字段名', dataIndex: 'field', key: 'field' },
                { title: '说明', dataIndex: 'desc', key: 'desc' },
              ]}
              pagination={false}
              size="small"
            />
          </Card>

          {/* 4. 代码示例 */}
          <Card id="examples" title="4. 代码示例" style={{ marginBottom: 16 }}>
            <Paragraph>
              <Text strong>Python 示例：</Text>
            </Paragraph>
            <pre><code>{`import requests

# API配置
API_KEY = "YOUR_API_KEY"
API_URL = "http://localhost:8000/api/v1/detection/detect"

# 请求头
headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {API_KEY}"
}

# 请求体
data = {
    "text": "待检测的文本内容",
    "language": "zh-CN",
    "detection_type": "prompt_injection"
}

# 发送请求
response = requests.post(API_URL, json=data, headers=headers)
result = response.json()

# 处理响应
if result["is_compliant"]:
    print("✅ 内容安全，可以继续")
else:
    print(f"❌ 检测到风险：{result['threat_category']}")
    print(f"风险等级：{result['risk_level']}")
    print(f"风险分数：{result['risk_score']}")`}</code></pre>

            <Paragraph>
              <Text strong>JavaScript 示例：</Text>
            </Paragraph>
            <pre><code>{`const API_KEY = "YOUR_API_KEY";
const API_URL = "http://localhost:8000/api/v1/detection/detect";

async function detectText(text) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': \`Bearer \${API_KEY}\`
    },
    body: JSON.stringify({
      text: text,
      language: 'zh-CN',
      detection_type: 'prompt_injection'
    })
  });

  const result = await response.json();

  if (result.is_compliant) {
    console.log('✅ 内容安全，可以继续');
  } else {
    console.log(\`❌ 检测到风险：\${result.threat_category}\`);
    console.log(\`风险等级：\${result.risk_level}\`);
    console.log(\`风险分数：\${result.risk_score}\`);
  }
}

// 使用示例
detectText("待检测的文本内容");`}</code></pre>

            <Paragraph>
              <Text strong>cURL 示例：</Text>
            </Paragraph>
            <pre><code>{`curl -X POST http://localhost:8000/api/v1/detection/detect \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{
    "text": "待检测的文本内容",
    "language": "zh-CN",
    "detection_type": "prompt_injection"
  }'`}</code></pre>
          </Card>

          {/* 5. 错误处理 */}
          <Card id="error" title="5. 错误处理" style={{ marginBottom: 16 }}>
            <Paragraph>
              API可能返回以下错误：
            </Paragraph>
            <Table
              dataSource={[
                { key: '1', code: '401', desc: '未授权：API Key无效或过期', solution: '检查API Key是否正确' },
                { key: '2', code: '403', desc: '禁止访问：配额不足或账号被禁用', solution: '充值配额或联系管理员' },
                { key: '3', code: '422', desc: '请求参数错误', solution: '检查请求参数格式和内容' },
                { key: '4', code: '429', desc: '请求过于频繁', solution: '降低请求频率' },
                { key: '5', code: '500', desc: '服务器内部错误', solution: '稍后重试或联系技术支持' },
              ]}
              columns={[
                { title: '状态码', dataIndex: 'code', key: 'code' },
                { title: '说明', dataIndex: 'desc', key: 'desc' },
                { title: '解决方案', dataIndex: 'solution', key: 'solution' },
              ]}
              pagination={false}
              size="small"
            />

            <Paragraph style={{ marginTop: 16 }}>
              <Text strong>错误响应示例：</Text>
            </Paragraph>
            <pre><code>{`{
  "detail": "Invalid API Key"
}`}</code></pre>
          </Card>

          {/* 6. 注意事项 */}
          <Card title="6. 注意事项" style={{ marginBottom: 16 }}>
            <ul>
              <li><Text strong>API Key安全：</Text>请妥善保管您的API Key，不要在客户端代码中暴露</li>
              <li><Text strong>请求限流：</Text>每个API Key有每分钟100次的请求限制</li>
              <li><Text strong>配额管理：</Text>每次检测消耗1次配额，请在"使用统计"中查看剩余配额</li>
              <li><Text strong>超时时间：</Text>请求超时时间为30秒，建议设置合理的客户端超时</li>
              <li><Text strong>日志记录：</Text>所有API调用都会被记录，用于审计和计费</li>
            </ul>
          </Card>

          {/* 7. 更多帮助 */}
          <Card title="7. 获取帮助">
            <Paragraph>
              如果您在使用API时遇到问题，可以通过以下方式获取帮助：
            </Paragraph>
            <ul>
              <li>查看完整的API文档：<a href="http://localhost:8000/docs" target="_blank" rel="noopener noreferrer">http://localhost:8000/docs</a></li>
              <li>联系技术支持：support@example.com</li>
              <li>提交工单：在管理控制台中提交问题反馈</li>
            </ul>
          </Card>
        </div>
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
