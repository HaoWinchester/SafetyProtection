/**
 * 系统设置页面
 * System settings page
 */

import React, { useState } from 'react'
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
} from 'antd'
import {
  SaveOutlined,
  ReloadOutlined,
  SettingOutlined,
  ApiOutlined,
  SecurityScanOutlined,
  BellOutlined,
  DatabaseOutlined,
} from '@ant-design/icons'

const { Title, Text } = Typography
const { TabPane } = Tabs
const { Option } = Select
const { TextArea } = Input

/**
 * Settings组件
 */
const Settings: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('general')

  /**
   * 通用设置表单提交
   */
  const handleGeneralSubmit = async (values: any) => {
    setLoading(true)
    try {
      // TODO: 调用API保存设置
      console.log('General settings:', values)
      await new Promise(resolve => setTimeout(resolve, 1000))
      message.success('设置保存成功')
    } catch (error) {
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
      // TODO: 调用API保存设置
      console.log('API settings:', values)
      await new Promise(resolve => setTimeout(resolve, 1000))
      message.success('设置保存成功')
    } catch (error) {
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
      // TODO: 调用API保存设置
      console.log('Detection settings:', values)
      await new Promise(resolve => setTimeout(resolve, 1000))
      message.success('设置保存成功')
    } catch (error) {
      message.error('设置保存失败')
    } finally {
      setLoading(false)
    }
  }

  /**
   * 渲染通用设置
   */
  const renderGeneralSettings = () => {
    return (
      <Form
        layout="vertical"
        onFinish={handleGeneralSubmit}
        initialValues={{
          appName: 'LLM安全检测工具',
          autoRefresh: true,
          refreshInterval: 30,
          enableNotifications: true,
          language: 'zh-CN',
        }}
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
        initialValues={{
          apiBaseUrl: 'http://localhost:8000',
          apiTimeout: 30,
          enableWs: true,
          wsUrl: 'ws://localhost:8000/ws',
          wsReconnectInterval: 5,
        }}
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
        initialValues={{
          defaultDetectionLevel: 'standard',
          enableRealtimeDetection: true,
          enableBatchDetection: true,
          maxBatchSize: 100,
          enableCache: true,
          cacheTtl: 3600,
          riskThresholdLow: 0.3,
          riskThresholdMedium: 0.5,
          riskThresholdHigh: 0.8,
        }}
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
        </Tabs>
      </Card>
    </div>
  )
}

export default Settings
