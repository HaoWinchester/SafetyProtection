/**
 * 批量检测页面
 * Batch Detection Page
 */

import React, { useState } from 'react'
import {
  Card,
  Upload,
  Button,
  Table,
  Tag,
  Space,
  Progress,
  Alert,
  Typography,
  Row,
  Col,
  Statistic,
} from 'antd'
import {
  UploadOutlined,
  FileTextOutlined,
  ScanOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DownloadOutlined,
} from '@ant-design/icons'
import type { UploadProps } from 'antd'

const { Title, Text, Paragraph } = Typography
const { Dragger } = Upload

interface BatchResult {
  id: string
  filename: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  risk_score: number
  risk_level: 'low' | 'medium' | 'high' | 'critical'
  threats: string[]
}

const BatchDetection: React.FC = () => {
  const [fileList, setFileList] = useState<any[]>([])
  const [results, setResults] = useState<BatchResult[]>([])
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)

  const uploadProps: UploadProps = {
    name: 'file',
    multiple: true,
    fileList,
    accept: '.txt,.json,.csv',
    onChange: (info) => {
      setFileList(info.fileList)
    },
    onRemove: (file) => {
      const index = fileList.indexOf(file)
      const newFileList = fileList.slice()
      newFileList.splice(index, 1)
      setFileList(newFileList)
    },
    beforeUpload: () => {
      return false
    },
  }

  const handleBatchDetect = async () => {
    if (fileList.length === 0) {
      return
    }

    setProcessing(true)
    setProgress(0)
    setResults([])

    // 模拟批量检测
    const mockResults: BatchResult[] = fileList.map((file, index) => ({
      id: `${Date.now()}-${index}`,
      filename: file.name,
      status: 'processing' as const,
      risk_score: 0,
      risk_level: 'low' as const,
      threats: [],
    }))

    setResults(mockResults)

    // 模拟进度
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 200))
      setProgress(i)
    }

    // 完成检测
    const completedResults = mockResults.map((result) => {
      const riskScore = Math.random()
      const riskLevel = ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)]
      const threats = riskScore > 0.5
        ? ['prompt_injection', 'jailbreak', 'data_leakage'].slice(0, Math.floor(Math.random() * 3) + 1)
        : []

      return {
        ...result,
        status: 'completed',
        risk_score: riskScore,
        risk_level: riskLevel as any,
        threats,
      }
    })

    setResults(completedResults)
    setProcessing(false)
  }

  const columns = [
    {
      title: '文件名',
      dataIndex: 'filename',
      key: 'filename',
      render: (name: string) => (
        <Space>
          <FileTextOutlined />
          {name}
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const config = {
          pending: { text: '等待中', color: 'default' },
          processing: { text: '检测中', color: 'processing' },
          completed: { text: '已完成', color: 'success' },
          failed: { text: '失败', color: 'error' },
        }
        const { text, color } = config[status as keyof typeof config]
        return <Tag color={color}>{text}</Tag>
      },
    },
    {
      title: '风险分数',
      dataIndex: 'risk_score',
      key: 'risk_score',
      render: (score: number) => score.toFixed(2),
    },
    {
      title: '风险等级',
      dataIndex: 'risk_level',
      key: 'risk_level',
      render: (level: string) => {
        const config = {
          low: { text: '低', color: 'success' },
          medium: { text: '中', color: 'warning' },
          high: { text: '高', color: 'error' },
          critical: { text: '严重', color: 'error' },
        }
        const { text, color } = config[level as keyof typeof config]
        return <Tag color={color}>{text}</Tag>
      },
    },
    {
      title: '威胁类型',
      dataIndex: 'threats',
      key: 'threats',
      render: (threats: string[]) => (
        <>
          {threats.length === 0 ? (
            <Tag color="success">无</Tag>
          ) : (
            threats.map((threat) => (
              <Tag key={threat} color="error">
                {threat}
              </Tag>
            ))
          )}
        </>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: BatchResult) => (
        <Space>
          {record.status === 'completed' && (
            <Button size="small" icon={<DownloadOutlined />}>
              详情
            </Button>
          )}
        </Space>
      ),
    },
  ]

  const safeCount = results.filter(r => r.risk_score < 0.5).length
  const riskCount = results.filter(r => r.risk_score >= 0.5).length
  const avgRiskScore = results.length > 0
    ? results.reduce((sum, r) => sum + r.risk_score, 0) / results.length
    : 0

  return (
    <div>
      <Title level={2}>
        <ScanOutlined /> 批量安全检测
      </Title>
      <Paragraph type="secondary">
        批量上传文件进行安全检测,快速识别潜在威胁
      </Paragraph>

      <Card title="文件上传" style={{ marginTop: 24 }}>
        <Dragger {...uploadProps}>
          <p className="ant-upload-drag-icon">
            <UploadOutlined />
          </p>
          <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
          <p className="ant-upload-hint">
            支持单个或批量上传。严禁上传公司数据或其他带有敏感信息的文件。
          </p>
        </Dragger>

        <div style={{ marginTop: 16 }}>
          <Space>
            <Button
              type="primary"
              icon={<ScanOutlined />}
              onClick={handleBatchDetect}
              disabled={fileList.length === 0 || processing}
              loading={processing}
            >
              开始批量检测
            </Button>
            <Button
              onClick={() => {
                setFileList([])
                setResults([])
                setProgress(0)
              }}
              disabled={processing}
            >
              清空列表
            </Button>
          </Space>
        </div>
      </Card>

      {processing && (
        <Card style={{ marginTop: 24 }}>
          <Progress
            percent={progress}
            status="active"
            strokeColor={{
              '0%': '#108ee9',
              '100%': '#87d068',
            }}
          />
          <p style={{ textAlign: 'center', marginTop: 16 }}>
            正在检测中...
          </p>
        </Card>
      )}

      {results.length > 0 && (
        <>
          <Row gutter={16} style={{ marginTop: 24 }}>
            <Col span={6}>
              <Statistic
                title="已检测"
                value={results.length}
                suffix="个"
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="安全"
                value={safeCount}
                suffix="个"
                valueStyle={{ color: '#3f8600' }}
                prefix={<CheckCircleOutlined />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="风险"
                value={riskCount}
                suffix="个"
                valueStyle={{ color: '#cf1322' }}
                prefix={<CloseCircleOutlined />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="平均风险"
                value={avgRiskScore}
                precision={2}
              />
            </Col>
          </Row>

          <Card title="检测结果" style={{ marginTop: 24 }}>
            <Table
              columns={columns}
              dataSource={results}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `共 ${total} 个文件`,
              }}
            />
          </Card>
        </>
      )}

      <Card title="批量检测说明" style={{ marginTop: 24 }}>
        <Alert
          message="支持的文件格式"
          description="支持 .txt、.json、.csv 格式的纯文本文件,单个文件大小不超过10MB"
          type="info"
          showIcon
        />
        <Alert
          message="检测能力"
          description="每批次最多可检测100个文件,平均检测时间约1-2秒/文件"
          type="info"
          showIcon
          style={{ marginTop: 8 }}
        />
      </Card>
    </div>
  )
}

export default BatchDetection
