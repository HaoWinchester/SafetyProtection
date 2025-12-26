/**
 * 批量检测页面
 * Batch detection page
 */

import React, { useState, useRef } from 'react'
import {
  Card,
  Row,
  Col,
  Button,
  Upload,
  Table,
  Space,
  Typography,
  Progress,
  Tag,
  Alert,
  message,
  Modal,
} from 'antd'
import {
  UploadOutlined,
  FileTextOutlined,
  DeleteOutlined,
  ScanOutlined,
  DownloadOutlined,
} from '@ant-design/icons'
import type { UploadFile, UploadProps } from 'antd'
import { useBatchDetection } from '@/hooks/useDetection'
import { DetectionResult, DetectionLevel, RiskLevel } from '@/types'
import { getRiskLevelColor, getRiskLevelLabel, downloadFile } from '@/utils/helpers'
import { DETECTION_LEVEL_CONFIG } from '@/utils/constants'
import dayjs from 'dayjs'

const { Title, Text } = Typography
const { Dragger } = Upload

/**
 * BatchDetection组件
 */
const BatchDetection: React.FC = () => {
  const [texts, setTexts] = useState<string[]>([])
  const [results, setResults] = useState<DetectionResult[]>([])
  const [detecting, setDetecting] = useState(false)
  const [progress, setProgress] = useState(0)
  const { detectBatch } = useBatchDetection()
  const fileInputRef = useRef<HTMLInputElement>(null)

  /**
   * 文件上传处理
   */
  const handleFileUpload: UploadProps['customRequest'] = (options) => {
    const { file, onSuccess, onError } = options

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const lines = content.split('\n').filter(line => line.trim())

        if (lines.length === 0) {
          message.error('文件内容为空')
          onError(new Error('文件内容为空'))
          return
        }

        if (lines.length > 100) {
          message.warning('文件内容过多，仅前100条将被检测')
          setTexts(lines.slice(0, 100))
        } else {
          setTexts(lines)
        }

        message.success(`成功导入 ${lines.length} 条文本`)
        onSuccess?.(file)
      } catch (error) {
        message.error('文件解析失败')
        onError?.(error as Error)
      }
    }

    reader.onerror = () => {
      message.error('文件读取失败')
      onError?.(new Error('文件读取失败'))
    }

    reader.readAsText(file as File)
  }

  /**
   * 执行批量检测
   */
  const handleBatchDetect = async () => {
    if (texts.length === 0) {
      message.warning('请先导入要检测的文本')
      return
    }

    setDetecting(true)
    setProgress(0)

    try {
      const detectionResults = await detectBatch(texts, DetectionLevel.STANDARD)

      if (detectionResults) {
        setResults(detectionResults)
        setProgress(100)
      }
    } catch (error) {
      message.error('批量检测失败')
    } finally {
      setDetecting(false)
    }
  }

  /**
   * 清除数据
   */
  const handleClear = () => {
    Modal.confirm({
      title: '确认清除',
      content: '确定要清除所有文本和检测结果吗？',
      onOk: () => {
        setTexts([])
        setResults([])
        setProgress(0)
      },
    })
  }

  /**
   * 导出结果
   */
  const handleExport = () => {
    if (results.length === 0) {
      message.warning('没有可导出的结果')
      return
    }

    const data = results.map((result) => ({
      id: result.id,
      text: result.text,
      is_compliant: result.is_compliant,
      risk_level: result.risk_level,
      risk_score: result.risk_score,
      attack_types: result.attack_types.join(', '),
      timestamp: result.timestamp,
    }))

    downloadFile(data, `detection-results-${dayjs().format('YYYYMMDD-HHmmss')}.json`)
  }

  /**
   * 表格列配置
   */
  const columns = [
    {
      title: '序号',
      key: 'index',
      width: 60,
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: '文本内容',
      dataIndex: 'text',
      key: 'text',
      ellipsis: true,
      width: 300,
    },
    {
      title: '检测结果',
      dataIndex: 'is_compliant',
      key: 'is_compliant',
      width: 100,
      render: (isCompliant: boolean) => (
        <Tag color={isCompliant ? 'success' : 'error'}>
          {isCompliant ? '合规' : '不合规'}
        </Tag>
      ),
    },
    {
      title: '风险等级',
      dataIndex: 'risk_level',
      key: 'risk_level',
      width: 120,
      render: (level: RiskLevel) => (
        <Tag color={getRiskLevelColor(level)}>
          {getRiskLevelLabel(level)}
        </Tag>
      ),
    },
    {
      title: '风险评分',
      dataIndex: 'risk_score',
      key: 'risk_score',
      width: 100,
      render: (score: number) => score.toFixed(3),
    },
    {
      title: '攻击类型',
      dataIndex: 'attack_types',
      key: 'attack_types',
      width: 200,
      render: (types: string[]) => (
        <>
          {types.map((type) => (
            <Tag key={type} color="warning" style={{ marginBottom: 4 }}>
              {type}
            </Tag>
          ))}
        </>
      ),
    },
    {
      title: '检测时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 180,
      render: (timestamp: string) => dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss'),
    },
  ]

  return (
    <div>
      {/* 页面标题 */}
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>批量检测</Title>
        <Text type="secondary">
          批量导入文本进行安全检测，最多支持100条文本
        </Text>
      </div>

      <Row gutter={24}>
        {/* 左侧：文件上传 */}
        <Col xs={24} lg={12}>
          <Card title="导入文本" extra={
            <Space>
              <Button icon={<DeleteOutlined />} onClick={handleClear} disabled={detecting}>
                清空
              </Button>
              <Button
                type="primary"
                icon={<ScanOutlined />}
                onClick={handleBatchDetect}
                disabled={texts.length === 0 || detecting}
                loading={detecting}
              >
                开始检测
              </Button>
            </Space>
          }>
            <Dragger
              accept=".txt,.csv,.json"
              showUploadList={false}
              customRequest={handleFileUpload}
              disabled={detecting}
              style={{ marginBottom: 16 }}
            >
              <p className="ant-upload-drag-icon">
                <UploadOutlined style={{ fontSize: 48 }} />
              </p>
              <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
              <p className="ant-upload-hint">
                支持 .txt、.csv、.json 格式，单次最多上传100条文本
              </p>
            </Dragger>

            {/* 文本统计 */}
            {texts.length > 0 && (
              <Alert
                message={
                  <Space>
                    <FileTextOutlined />
                    <span>已导入 {texts.length} 条文本</span>
                  </Space>
                }
                type="info"
                showIcon
              />
            )}

            {/* 检测进度 */}
            {detecting && (
              <div style={{ marginTop: 16 }}>
                <Text>检测进度：</Text>
                <Progress percent={progress} status="active" />
              </div>
            )}
          </Card>
        </Col>

        {/* 右侧：检测结果 */}
        <Col xs={24} lg={12}>
          <Card
            title="检测结果"
            extra={
              results.length > 0 && (
                <Button
                  icon={<DownloadOutlined />}
                  onClick={handleExport}
                >
                  导出结果
                </Button>
              )
            }
          >
            {results.length > 0 ? (
              <>
                {/* 统计摘要 */}
                <div style={{ marginBottom: 16 }}>
                  <Space size="large">
                    <Text>总计：{results.length} 条</Text>
                    <Text style={{ color: '#52c41a' }}>
                      合规：{results.filter(r => r.is_compliant).length} 条
                    </Text>
                    <Text style={{ color: '#ff4d4f' }}>
                      不合规：{results.filter(r => !r.is_compliant).length} 条
                    </Text>
                  </Space>
                </div>

                {/* 结果表格 */}
                <Table
                  columns={columns}
                  dataSource={results}
                  rowKey="id"
                  pagination={{
                    pageSize: 10,
                    showTotal: (total) => `共 ${total} 条`,
                    showSizeChanger: true,
                    showQuickJumper: true,
                  }}
                  scroll={{ x: 1200 }}
                />
              </>
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                height: 400,
                color: '#999'
              }}>
                <FileTextOutlined style={{ fontSize: 64, marginBottom: 16 }} />
                <Text type="secondary">
                  上传文件后点击"开始检测"按钮进行批量检测
                </Text>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default BatchDetection
