/**
 * 实时检测页面
 * Realtime detection page
 */

import React, { useState } from 'react'
import {
  Card,
  Row,
  Col,
  Input,
  Button,
  Select,
  Space,
  Typography,
  Alert,
  Tag,
  Divider,
  Descriptions,
  Progress,
  Collapse,
} from 'antd'
import {
  ScanOutlined,
  ClearOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons'
import { useDetection } from '@/hooks/useDetection'
import { DetectionLevel, RiskLevel } from '@/types'
import { getRiskLevelColor, getRiskLevelLabel, formatDuration } from '@/utils/helpers'
import { DETECTION_LEVEL_CONFIG, ATTACK_TYPE_CONFIG } from '@/utils/constants'

const { TextArea } = Input
const { Title, Text, Paragraph } = Typography
const { Option } = Select

/**
 * RealtimeDetection组件
 */
const RealtimeDetection: React.FC = () => {
  const [text, setText] = useState('')
  const [detectionLevel, setDetectionLevel] = useState<DetectionLevel>(DetectionLevel.STANDARD)
  const { result, loading, detect, clearResult } = useDetection()

  /**
   * 执行检测
   */
  const handleDetect = async () => {
    if (!text.trim()) {
      return
    }

    await detect(text, detectionLevel)
  }

  /**
   * 清除输入
   */
  const handleClear = () => {
    setText('')
    clearResult()
  }

  /**
   * 渲染检测结果
   */
  const renderResult = () => {
    if (!result) {
      return null
    }

    const isSuccess = result.is_compliant

    return (
      <Card
        title={
          <Space>
            {isSuccess ? (
              <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 20 }} />
            ) : (
              <WarningOutlined style={{ color: '#ff4d4f', fontSize: 20 }} />
            )}
            <span>检测结果</span>
            <Tag color={isSuccess ? 'success' : 'error'}>
              {isSuccess ? '合规' : '不合规'}
            </Tag>
          </Space>
        }
        style={{ marginTop: 24 }}
      >
        {/* 风险等级 */}
        <Alert
          message={
            <Space>
              <span>风险等级：</span>
              <Tag
                color={getRiskLevelColor(result.risk_level)}
                style={{ fontSize: 16, padding: '4px 12px' }}
              >
                {getRiskLevelLabel(result.risk_level)}
              </Tag>
              <span>风险评分：{result.risk_score.toFixed(3)}</span>
            </Space>
          }
          type={isSuccess ? 'success' : 'warning'}
          showIcon
          style={{ marginBottom: 16 }}
        />

        {/* 详细信息 */}
        <Descriptions column={2} bordered size="small">
          <Descriptions.Item label="检测ID">{result.id}</Descriptions.Item>
          <Descriptions.Item label="检测时间">
            {formatDuration(result.processing_time)}
          </Descriptions.Item>
          <Descriptions.Item label="置信度">
            <Progress
              percent={(result.confidence * 100).toFixed(1)}
              size="small"
              status={isSuccess ? 'success' : 'exception'}
            />
          </Descriptions.Item>
          <Descriptions.Item label="检测级别">
            {DETECTION_LEVEL_CONFIG[detectionLevel].label}
          </Descriptions.Item>
        </Descriptions>

        <Divider />

        {/* 检测到的攻击类型 */}
        {result.attack_types.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <Text strong>检测到的攻击类型：</Text>
            <div style={{ marginTop: 8 }}>
              {result.attack_types.map((type) => (
                <Tag
                  key={type}
                  color={ATTACK_TYPE_CONFIG[type]?.color || 'default'}
                  style={{ marginBottom: 8, fontSize: 14 }}
                >
                  {ATTACK_TYPE_CONFIG[type]?.label || type}
                </Tag>
              ))}
            </div>
          </div>
        )}

        {/* 检测详情 */}
        <Collapse
          items={[
            {
              key: 'details',
              label: '详细分析',
              children: (
                <div>
                  {/* 静态分析 */}
                  {result.details.static_analysis && (
                    <div style={{ marginBottom: 16 }}>
                      <Text strong>静态分析：</Text>
                      <ul style={{ marginTop: 8 }}>
                        <li>匹配关键词：{result.details.static_analysis.matched_keywords.join(', ') || '无'}</li>
                        <li>匹配模式：{result.details.static_analysis.matched_patterns.join(', ') || '无'}</li>
                        <li>是否黑名单：{result.details.static_analysis.blacklisted ? '是' : '否'}</li>
                      </ul>
                    </div>
                  )}

                  {/* 语义分析 */}
                  {result.details.semantic_analysis && (
                    <div style={{ marginBottom: 16 }}>
                      <Text strong>语义分析：</Text>
                      <ul style={{ marginTop: 8 }}>
                        <li>意图识别：{result.details.semantic_analysis.intent}</li>
                        <li>分类：{result.details.semantic_analysis.category}</li>
                        <li>相似度：{result.details.semantic_analysis.similarity_score.toFixed(3)}</li>
                      </ul>
                    </div>
                  )}

                  {/* 行为分析 */}
                  {result.details.behavioral_analysis && (
                    <div style={{ marginBottom: 16 }}>
                      <Text strong>行为分析：</Text>
                      <ul style={{ marginTop: 8 }}>
                        <li>
                          角色扮演：
                          {result.details.behavioral_analysis.role_playing_detected ? (
                            <Tag color="red" style={{ marginLeft: 8 }}>
                              检测到
                            </Tag>
                          ) : (
                            '未检测到'
                          )}
                        </li>
                        <li>
                          越狱尝试：
                          {result.details.behavioral_analysis.jailbreak_attempt ? (
                            <Tag color="red" style={{ marginLeft: 8 }}>
                              检测到
                            </Tag>
                          ) : (
                            '未检测到'
                          )}
                        </li>
                        <li>
                          提示词注入：
                          {result.details.behavioral_analysis.prompt_injection ? (
                            <Tag color="red" style={{ marginLeft: 8 }}>
                              检测到
                            </Tag>
                          ) : (
                            '未检测到'
                          )}
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
              ),
            },
          ]}
        />
      </Card>
    )
  }

  return (
    <div>
      {/* 页面标题 */}
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>实时检测</Title>
        <Text type="secondary">对文本进行实时安全检测，识别潜在的提示词注入攻击</Text>
      </div>

      <Row gutter={24}>
        {/* 左侧：输入区域 */}
        <Col xs={24} lg={12}>
          <Card title="输入文本" extra={
            <Space>
              <Select
                value={detectionLevel}
                onChange={setDetectionLevel}
                style={{ width: 120 }}
              >
                {Object.entries(DETECTION_LEVEL_CONFIG).map(([key, config]) => (
                  <Option key={key} value={key}>
                    {config.label}
                  </Option>
                ))}
              </Select>
              <Button icon={<ClearOutlined />} onClick={handleClear}>
                清空
              </Button>
            </Space>
          }>
            <TextArea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="请输入要检测的文本内容..."
              rows={12}
              maxLength={10000}
              showCount
            />

            <div style={{ marginTop: 16, textAlign: 'right' }}>
              <Button
                type="primary"
                icon={<ScanOutlined />}
                loading={loading}
                onClick={handleDetect}
                size="large"
              >
                开始检测
              </Button>
            </div>
          </Card>
        </Col>

        {/* 右侧：结果区域 */}
        <Col xs={24} lg={12}>
          {result ? (
            renderResult()
          ) : (
            <Card style={{ height: '100%', minHeight: 400 }}>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%',
                color: '#999'
              }}>
                <ScanOutlined style={{ fontSize: 64, marginBottom: 16 }} />
                <Paragraph type="secondary">
                  在左侧输入文本并点击"开始检测"按钮进行安全检测
                </Paragraph>
              </div>
            </Card>
          )}
        </Col>
      </Row>
    </div>
  )
}

export default RealtimeDetection
