/**
 * 实时检测页面
 * Real-time Detection Page
 */

import React, { useState } from 'react'
import {
  Card,
  Form,
  Input,
  Button,
  Alert,
  Result,
  Tag,
  Space,
  Typography,
  Row,
  Col,
  Statistic,
  Progress,
} from 'antd'
import {
  ScanOutlined,
  SafetyOutlined,
  WarningOutlined,
  CloseCircleOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons'

const { TextArea } = Input
const { Title, Text, Paragraph } = Typography
const { Option } = Select

interface DetectionResult {
  is_compliant: boolean
  risk_score: number
  risk_level: 'low' | 'medium' | 'high' | 'critical'
  threat_category: string | null
  recommendation: string
  processing_time_ms: number
  detection_details: {
    static_checks: any[]
    semantic_analysis: any
    behavioral_analysis: any
    context_analysis: any
  }
}

const RealtimeDetection: React.FC = () => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<DetectionResult | null>(null)
  const [inputText, setInputText] = useState('')

  // 模拟检测API调用
  const handleDetect = async (values: any) => {
    setLoading(true)
    setResult(null)

    // 模拟API延迟
    await new Promise(resolve => setTimeout(resolve, 1000))

    // 模拟检测结果
    const mockResult: DetectionResult = {
      is_compliant: Math.random() > 0.3,
      risk_score: Math.random(),
      risk_level: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)] as any,
      threat_category: ['prompt_injection', 'jailbreak', 'data_leakage', 'benign'][Math.floor(Math.random() * 4)],
      recommendation: 'pass',
      processing_time_ms: Math.floor(Math.random() * 100) + 20,
      detection_details: {
        static_checks: [
          { check: '关键词匹配', result: Math.random() > 0.5, details: '未发现敏感关键词' },
          { check: '模式识别', result: Math.random() > 0.5, details: '未检测到攻击模式' },
        ],
        semantic_analysis: {
          similarity_score: Math.random(),
          detected_threats: [],
        },
        behavioral_analysis: {
          anomalies: [],
          risk_indicators: [],
        },
        context_analysis: {
          conversation_history: [],
          context_risk: 'low',
        },
      },
    }

    setResult(mockResult)
    setLoading(false)
  }

  const getRiskLevelConfig = (level: string) => {
    const configs = {
      low: { color: 'success', text: '低风险', icon: <CheckCircleOutlined /> },
      medium: { color: 'warning', text: '中风险', icon: <WarningOutlined /> },
      high: { color: 'error', text: '高风险', icon: <CloseCircleOutlined /> },
      critical: { color: 'error', text: '严重风险', icon: <CloseCircleOutlined /> },
    }
    return configs[level as keyof typeof configs] || configs.low
  }

  const renderResult = () => {
    if (!result) return null

    const riskConfig = getRiskLevelConfig(result.risk_level)

    return (
      <Card
        title="检测结果"
        style={{ marginTop: 24 }}
        extra={
          <Tag color={riskConfig.color} icon={riskConfig.icon}>
            {riskConfig.text}
          </Tag>
        }
      >
        <Row gutter={16}>
          <Col span={6}>
            <Statistic
              title="风险分数"
              value={result.risk_score}
              precision={2}
              valueStyle={{ color: result.risk_score > 0.5 ? '#cf1322' : '#3f8600' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="处理时间"
              value={result.processing_time_ms}
              suffix="ms"
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="检测状态"
              value={result.is_compliant ? '通过' : '拦截'}
              valueStyle={{ color: result.is_compliant ? '#3f8600' : '#cf1322' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="威胁类型"
              value={result.threat_category || '无'}
            />
          </Col>
        </Row>

        <Progress
          percent={result.risk_score * 100}
          status={result.risk_score > 0.5 ? 'exception' : 'success'}
          strokeColor={{
            '0%': '#108ee9',
            '100%': result.risk_score > 0.5 ? '#ff4d4f' : '#87d068',
          }}
          style={{ marginTop: 24 }}
        />

        <Alert
          message={result.is_compliant ? '内容安全' : '检测到潜在威胁'}
          description={
            result.is_compliant
              ? '未检测到明显的安全风险,内容可以正常处理'
              : '内容包含潜在的安全威胁,建议进行人工审核'
          }
          type={result.is_compliant ? 'success' : 'error'}
          showIcon
          style={{ marginTop: 16 }}
        />
      </Card>
    )
  }

  return (
    <div>
      <Title level={2}>
        <ScanOutlined /> 实时安全检测
      </Title>
      <Paragraph type="secondary">
        实时检测输入内容的安全性,识别提示词注入、越狱攻击等威胁
      </Paragraph>

      <Card title="输入检测" style={{ marginTop: 24 }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleDetect}
        >
          <Form.Item
            label="检测内容"
            name="content"
            rules={[{ required: true, message: '请输入要检测的内容' }]}
          >
            <TextArea
              rows={10}
              placeholder="请输入需要检测的文本内容..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
          </Form.Item>

          <Form.Item
            label="检测模型"
            name="model"
            initialValue="GLM-4"
          >
            <Select>
              <Option value="GLM-4">GLM-4</Option>
              <Option value="GLM-4-0520">GLM-4-0520</Option>
              <Option value="GLM-3-Turbo">GLM-3-Turbo</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                icon={<ScanOutlined />}
                size="large"
              >
                开始检测
              </Button>
              <Button
                onClick={() => {
                  form.resetFields()
                  setInputText('')
                  setResult(null)
                }}
              >
                清空
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      {renderResult()}

      <Card title="检测说明" style={{ marginTop: 24 }}>
        <Row gutter={16}>
          <Col span={8}>
            <Card type="inner" title="静态检测">
              <p>基于关键词和模式匹配,快速识别已知威胁</p>
            </Card>
          </Col>
          <Col span={8}>
            <Card type="inner" title="语义分析">
              <p>使用深度学习模型理解语义,识别隐含威胁</p>
            </Card>
          </Col>
          <Col span={8}>
            <Card type="inner" title="行为分析">
              <p>分析异常行为模式,识别潜在攻击</p>
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  )
}

export default RealtimeDetection
