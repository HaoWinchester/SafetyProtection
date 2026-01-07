/**
 * 系统设置页面
 * System settings page
 */

import React, { useState, useEffect } from 'react'
import {
  Card,
  Tabs,
  Form,
  Input,
  Switch,
  Button,
  Space,
  Typography,
  Divider,
  message,
  Row,
  Col,
  Select,
  InputNumber,
  Alert,
  Spin,
} from 'antd'
import {
  SaveOutlined,
  ReloadOutlined,
  SettingOutlined,
  ApiOutlined,
  SecurityScanOutlined,
  BellOutlined,
  DatabaseOutlined,
  BookOutlined,
  CopyOutlined,
  SafetyOutlined,
} from '@ant-design/icons'
import api from '@/services/api'
import VerificationReviewTab from './VerificationReviewTab'

const { Title, Text, Paragraph } = Typography
const { TabPane } = Tabs
const { Option } = Select
const { TextArea } = Input

/**
 * Settings组件
 */
const Settings: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('general')
  const [settings, setSettings] = useState<any>(null)
  const [initialLoading, setInitialLoading] = useState(true)

  // 加载设置
  const loadSettings = async () => {
    try {
      setInitialLoading(true)
      console.log('加载系统设置...')
      const data = await api.get('/settings')
      console.log('系统设置数据:', data)
      setSettings(data)
    } catch (error) {
      console.error('加载设置失败:', error)
      // 使用默认值
      setSettings({
        general: {
          appName: 'LLM安全检测工具',
          autoRefresh: true,
          refreshInterval: 30,
          enableNotifications: true,
          language: 'zh-CN',
        },
        api: {
          apiBaseUrl: 'http://localhost:8000',
          apiTimeout: 30,
          enableWs: true,
          wsUrl: 'ws://localhost:8000/ws',
          wsReconnectInterval: 5,
        },
        detection: {
          defaultDetectionLevel: 'standard',
          enableRealtimeDetection: true,
          enableBatchDetection: true,
          maxBatchSize: 100,
          enableCache: true,
          cacheTtl: 3600,
          riskThresholdLow: 0.3,
          riskThresholdMedium: 0.5,
          riskThresholdHigh: 0.8,
        },
      })
    } finally {
      setInitialLoading(false)
    }
  }

  useEffect(() => {
    loadSettings()
  }, [])

  /**
   * 通用设置表单提交
   */
  const handleGeneralSubmit = async (values: any) => {
    setLoading(true)
    try {
      console.log('保存通用设置:', values)
      const updatedSettings = {
        ...settings,
        general: values,
      }
      await api.post('/settings', updatedSettings)
      setSettings(updatedSettings)
      message.success('通用设置保存成功')
    } catch (error) {
      console.error('保存失败:', error)
      message.error('设置保存失败')
    } finally {
      setLoading(false)
    }
  }

  /**
   * API设置表单提交
   */
  const handleApiSubmit = async (values: any) => {
    setLoading(true)
    try {
      console.log('保存API设置:', values)
      const updatedSettings = {
        ...settings,
        api: values,
      }
      await api.post('/settings', updatedSettings)
      setSettings(updatedSettings)
      message.success('API设置保存成功')
      message.info('修改API配置后建议刷新页面')
    } catch (error) {
      console.error('保存失败:', error)
      message.error('设置保存失败')
    } finally {
      setLoading(false)
    }
  }

  /**
   * 检测规则设置表单提交
   */
  const handleDetectionSubmit = async (values: any) => {
    setLoading(true)
    try {
      console.log('保存检测规则设置:', values)
      const updatedSettings = {
        ...settings,
        detection: values,
      }
      await api.post('/settings', updatedSettings)
      setSettings(updatedSettings)
      message.success('检测规则设置保存成功')
    } catch (error) {
      console.error('保存失败:', error)
      message.error('设置保存失败')
    } finally {
      setLoading(false)
    }
  }

  if (initialLoading) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '50px 0' }}>
          <Spin size="large" tip="加载设置中..." />
        </div>
      </Card>
    )
  }

  /**
   * 渲染通用设置
   */
  const renderGeneralSettings = () => {
    return (
      <Form
        layout="vertical"
        onFinish={handleGeneralSubmit}
        initialValues={settings?.general || {}}
      >
        <Form.Item
          label="应用名称"
          name="appName"
          rules={[{ required: true, message: '请输入应用名称' }]}
        >
          <Input placeholder="请输入应用名称" />
        </Form.Item>

        <Form.Item
          label="语言"
          name="language"
          rules={[{ required: true, message: '请选择语言' }]}
        >
          <Select>
            <Option value="zh-CN">简体中文</Option>
            <Option value="en-US">English</Option>
          </Select>
        </Form.Item>

        <Form.Item
          label="自动刷新"
          name="autoRefresh"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <Form.Item
          label="刷新间隔（秒）"
          name="refreshInterval"
          dependencies={['autoRefresh']}
          rules={[
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (getFieldValue('autoRefresh') && !value) {
                  return Promise.reject(new Error('请输入刷新间隔'))
                }
                return Promise.resolve()
              },
            }),
          ]}
        >
          <InputNumber min={5} max={300} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          label="启用通知"
          name="enableNotifications"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>
              保存设置
            </Button>
            <Button icon={<ReloadOutlined />}>
              重置
            </Button>
          </Space>
        </Form.Item>
      </Form>
    )
  }

  /**
   * 渲染API设置
   */
  const renderApiSettings = () => {
    return (
      <Form
        layout="vertical"
        onFinish={handleApiSubmit}
        initialValues={settings?.api || {}}
      >
        <Alert
          message="API配置"
          description="修改API配置后需要重启应用才能生效"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Form.Item
          label="API基础URL"
          name="apiBaseUrl"
          rules={[{ required: true, message: '请输入API基础URL' }]}
        >
          <Input placeholder="请输入API基础URL" />
        </Form.Item>

        <Form.Item
          label="请求超时（秒）"
          name="apiTimeout"
          rules={[{ required: true, message: '请输入请求超时时间' }]}
        >
          <InputNumber min={5} max={300} style={{ width: '100%' }} />
        </Form.Item>

        <Divider />

        <Form.Item
          label="启用WebSocket"
          name="enableWs"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <Form.Item
          label="WebSocket URL"
          name="wsUrl"
          dependencies={['enableWs']}
          rules={[
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (getFieldValue('enableWs') && !value) {
                  return Promise.reject(new Error('请输入WebSocket URL'))
                }
                return Promise.resolve()
              },
            }),
          ]}
        >
          <Input placeholder="请输入WebSocket URL" />
        </Form.Item>

        <Form.Item
          label="重连间隔（秒）"
          name="wsReconnectInterval"
          dependencies={['enableWs']}
          rules={[
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (getFieldValue('enableWs') && !value) {
                  return Promise.reject(new Error('请输入重连间隔'))
                }
                return Promise.resolve()
              },
            }),
          ]}
        >
          <InputNumber min={1} max={60} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>
              保存设置
            </Button>
            <Button icon={<ReloadOutlined />}>
              重置
            </Button>
          </Space>
        </Form.Item>
      </Form>
    )
  }

  /**
   * 渲染检测规则设置
   */
  const renderDetectionSettings = () => {
    return (
      <Form
        layout="vertical"
        onFinish={handleDetectionSubmit}
        initialValues={settings?.detection || {}}
      >
        <Form.Item
          label="默认检测级别"
          name="defaultDetectionLevel"
          rules={[{ required: true, message: '请选择默认检测级别' }]}
        >
          <Select>
            <Option value="basic">基础检测</Option>
            <Option value="standard">标准检测</Option>
            <Option value="advanced">高级检测</Option>
            <Option value="expert">专家检测</Option>
          </Select>
        </Form.Item>

        <Form.Item
          label="启用实时检测"
          name="enableRealtimeDetection"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <Form.Item
          label="启用批量检测"
          name="enableBatchDetection"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <Form.Item
          label="最大批量数量"
          name="maxBatchSize"
          dependencies={['enableBatchDetection']}
          rules={[
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (getFieldValue('enableBatchDetection') && !value) {
                  return Promise.reject(new Error('请输入最大批量数量'))
                }
                return Promise.resolve()
              },
            }),
          ]}
        >
          <InputNumber min={10} max={1000} style={{ width: '100%' }} />
        </Form.Item>

        <Divider />

        <Form.Item
          label="启用缓存"
          name="enableCache"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <Form.Item
          label="缓存过期时间（秒）"
          name="cacheTtl"
          dependencies={['enableCache']}
          rules={[
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (getFieldValue('enableCache') && !value) {
                  return Promise.reject(new Error('请输入缓存过期时间'))
                }
                return Promise.resolve()
              },
            }),
          ]}
        >
          <InputNumber min={60} max={86400} style={{ width: '100%' }} />
        </Form.Item>

        <Divider />

        <Title level={5}>风险阈值设置</Title>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="低风险阈值"
              name="riskThresholdLow"
              rules={[{ required: true, message: '请输入低风险阈值' }]}
            >
              <InputNumber min={0} max={1} step={0.01} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="中风险阈值"
              name="riskThresholdMedium"
              rules={[{ required: true, message: '请输入中风险阈值' }]}
            >
              <InputNumber min={0} max={1} step={0.01} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="高风险阈值"
              name="riskThresholdHigh"
              rules={[{ required: true, message: '请输入高风险阈值' }]}
            >
              <InputNumber min={0} max={1} step={0.01} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>
              保存设置
            </Button>
            <Button icon={<ReloadOutlined />}>
              重置
            </Button>
          </Space>
        </Form.Item>
      </Form>
    )
  }

  /**
   * 渲染API文档
   */
  const renderApiDocs = () => {
    return (
      <div>
        <Alert
          message="API使用文档"
          description="本文档提供API接口的详细说明和使用示例"
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Card title="快速开始" style={{ marginBottom: 16 }}>
          <Paragraph>
            1. 注册账号或使用已有账号登录<br/>
            2. 获取访问令牌 (access_token)<br/>
            3. 在请求头中添加 Authorization: Bearer YOUR_ACCESS_TOKEN<br/>
            4. 调用检测 API
          </Paragraph>
        </Card>

        <Card title="检测API" style={{ marginBottom: 16 }}>
          <Title level={5}>实时检测接口</Title>
          <Paragraph>
            <Text strong>接口地址:</Text> <Text code>POST /api/v1/detection/detect</Text><br/>
            <Text strong>认证:</Text> <Text type="secondary">必需</Text>
          </Paragraph>

          <Title level={5}>请求参数</Title>
          <Paragraph>
            <Text code>prompt</Text> (string, 必需): 待检测的提示词内容
          </Paragraph>

          <Title level={5}>请求示例 (cURL)</Title>
          <div style={{
            background: '#f6f8fa',
            padding: 16,
            borderRadius: 6,
            position: 'relative',
            marginBottom: 16
          }}>
            <pre style={{ margin: 0, fontSize: 13, lineHeight: 1.5 }}>
              <code>{'curl -X POST "http://localhost:8000/api/v1/detection/detect" \\\n  -H "Content-Type: application/json" \\\n  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \\\n  -d \'{\n    "prompt": "你的提示词内容"\\n  }\''}</code>
            </pre>
          </div>

          <Title level={5}>响应示例</Title>
          <div style={{
            background: '#f6f8fa',
            padding: 16,
            borderRadius: 6
          }}>
            <pre style={{ margin: 0, fontSize: 13, lineHeight: 1.5 }}>
              <code>{'{\n  "is_compliant": false,\n  "risk_score": 0.85,\n  "risk_level": "high",\n  "threat_category": "prompt_injection",\n  "recommendation": "block"\n}'}</code>
            </pre>
          </div>
        </Card>

        <Card title="认证API" style={{ marginBottom: 16 }}>
          <Title level={5}>用户注册</Title>
          <Paragraph>
            <Text strong>接口地址:</Text> <Text code>POST /api/v1/auth/register</Text><br/>
            <Text strong>认证:</Text> <Text type="secondary">不需要</Text>
          </Paragraph>

          <Title level={5}>用户登录</Title>
          <Paragraph>
            <Text strong>接口地址:</Text> <Text code>POST /api/v1/auth/login</Text><br/>
            <Text strong>认证:</Text> <Text type="secondary">不需要</Text>
          </Paragraph>

          <Title level={5}>登录响应</Title>
          <div style={{
            background: '#f6f8fa',
            padding: 16,
            borderRadius: 6
          }}>
            <pre style={{ margin: 0, fontSize: 13, lineHeight: 1.5 }}>
              <code>{'{\n  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",\n  "token_type": "bearer",\n  "user": {\n    "user_id": "user_001",\n    "email": "user@example.com",\n    "role": "user"\n  }\n}'}</code>
            </pre>
          </div>
        </Card>

        <Card title="错误码说明">
          <Paragraph>
            <Text strong>200</Text> - 请求成功<br/>
            <Text strong>400</Text> - 请求参数错误<br/>
            <Text strong>401</Text> - 未授权，需要登录<br/>
            <Text strong>403</Text> - 无权限访问<br/>
            <Text strong>404</Text> - 资源不存在<br/>
            <Text strong>429</Text> - 请求过于频繁<br/>
            <Text strong>500</Text> - 服务器内部错误
          </Paragraph>
        </Card>

        <Card title="完整API文档" style={{ marginTop: 16 }}>
          <Paragraph>
            查看 Swagger 文档获取完整的API说明:<br/>
            <a href="http://localhost:8000/docs" target="_blank" rel="noopener noreferrer">
              http://localhost:8000/docs
            </a>
          </Paragraph>
        </Card>
      </div>
    )
  }

  return (
    <div>
      {/* 页面标题 */}
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>系统设置</Title>
        <Text type="secondary">配置应用程序参数和检测规则</Text>
      </div>

      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          tabPosition="left"
          style={{ minHeight: 400 }}
        >
          <TabPane
            tab={
              <span>
                <SettingOutlined />
                通用设置
              </span>
            }
            key="general"
          >
            <div style={{ padding: '0 24px' }}>
              <Title level={4}>通用设置</Title>
              <Text type="secondary">配置应用程序的基本参数</Text>
              <Divider />
              {renderGeneralSettings()}
            </div>
          </TabPane>

          <TabPane
            tab={
              <span>
                <ApiOutlined />
                API配置
              </span>
            }
            key="api"
          >
            <div style={{ padding: '0 24px' }}>
              <Title level={4}>API配置</Title>
              <Text type="secondary">配置后端API连接参数</Text>
              <Divider />
              {renderApiSettings()}
            </div>
          </TabPane>

          <TabPane
            tab={
              <span>
                <SecurityScanOutlined />
                检测规则
              </span>
            }
            key="detection"
          >
            <div style={{ padding: '0 24px' }}>
              <Title level={4}>检测规则</Title>
              <Text type="secondary">配置检测引擎的参数和规则</Text>
              <Divider />
              {renderDetectionSettings()}
            </div>
          </TabPane>

          <TabPane
            tab={
              <span>
                <BookOutlined />
                API文档
              </span>
            }
            key="api-docs"
          >
            <div style={{ padding: '0 24px' }}>
              <Title level={4}>API文档</Title>
              <Text type="secondary">API接口使用说明和示例</Text>
              <Divider />
              {renderApiDocs()}
            </div>
          </TabPane>

          <TabPane
            tab={
              <span>
                <SafetyOutlined />
                实名认证审核
              </span>
            }
            key="verification"
          >
            <div style={{ padding: '0 24px' }}>
              <Title level={4}>实名认证审核</Title>
              <Text type="secondary">管理用户提交的实名认证申请</Text>
              <Divider />
              <VerificationReviewTab />
            </div>
          </TabPane>
        </Tabs>
      </Card>
    </div>
  )
}

export default Settings
