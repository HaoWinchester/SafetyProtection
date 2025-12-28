/**
 * 测评结果列表页面
 * Evaluation results list page
 */
import React, { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Progress,
  Descriptions,
  Modal,
  message
} from 'antd'
import { EyeOutlined, DownloadOutlined } from '@ant-design/icons'

interface EvaluationResult {
  id: number
  evaluation_id: string
  status: string
  total_cases: number
  executed_cases: number
  passed_cases: number
  failed_cases: number
  safety_score?: number
  safety_level?: string
  created_at: string
  completed_at?: string
}

const EvaluationResultsPage: React.FC = () => {
  const [results, setResults] = useState<EvaluationResult[]>([])
  const [loading, setLoading] = useState(false)
  const [detailVisible, setDetailVisible] = useState(false)
  const [selectedResult, setSelectedResult] = useState<EvaluationResult | null>(null)

  useEffect(() => {
    fetchResults()
  }, [])

  const fetchResults = async () => {
    setLoading(true)
    try {
      // TODO: 实际API调用
      // const response = await api.get('/evaluation/results')

      // 模拟数据
      setResults([
        {
          id: 1,
          evaluation_id: 'eval_demo_001',
          status: 'completed',
          total_cases: 7,
          executed_cases: 7,
          passed_cases: 5,
          failed_cases: 2,
          safety_score: 75.5,
          safety_level: 'MEDIUM',
          created_at: new Date().toISOString(),
          completed_at: new Date().toISOString()
        }
      ])
    } catch (error) {
      message.error('加载失败')
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetail = (result: EvaluationResult) => {
    setSelectedResult(result)
    setDetailVisible(true)
  }

  const handleDownloadReport = (result: EvaluationResult) => {
    message.info(`下载 ${result.evaluation_id} 的报告功能开发中...`)
  }

  const columns = [
    {
      title: '测评ID',
      dataIndex: 'evaluation_id',
      key: 'evaluation_id',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusConfig: Record<string, { color: string; text: string }> = {
          pending: { color: 'default', text: '待执行' },
          running: { color: 'processing', text: '进行中' },
          completed: { color: 'success', text: '已完成' },
          failed: { color: 'error', text: '失败' }
        }
        const config = statusConfig[status] || { color: 'default', text: status }
        return <Tag color={config.color}>{config.text}</Tag>
      }
    },
    {
      title: '进度',
      key: 'progress',
      render: (_: any, record: EvaluationResult) => {
        const percent = record.total_cases > 0 ? (record.executed_cases / record.total_cases) * 100 : 0
        return <Progress percent={Math.round(percent)} size="small" status={record.status === 'completed' ? 'success' : 'active'} />
      }
    },
    {
      title: '通过率',
      key: 'pass_rate',
      render: (_: any, record: EvaluationResult) => {
        if (record.total_cases === 0) return '-'
        const rate = (record.passed_cases / record.total_cases) * 100
        return <span>{rate.toFixed(1)}%</span>
      }
    },
    {
      title: '安全评分',
      dataIndex: 'safety_score',
      key: 'safety_score',
      render: (score?: number) => {
        if (score === undefined) return '-'
        const color = score >= 90 ? '#3f8600' : score >= 70 ? '#faad14' : '#cf1322'
        return <span style={{ color, fontWeight: 'bold' }}>{score.toFixed(1)}</span>
      }
    },
    {
      title: '安全等级',
      dataIndex: 'safety_level',
      key: 'safety_level',
      render: (level?: string) => {
        if (!level) return '-'
        const colors: Record<string, string> = {
          HIGH: 'success',
          MEDIUM: 'warning',
          LOW: 'error'
        }
        return <Tag color={colors[level]}>{level}</Tag>
      }
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (time: string) => new Date(time).toLocaleString('zh-CN')
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: EvaluationResult) => (
        <Space>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
          {record.status === 'completed' && (
            <Button
              size="small"
              icon={<DownloadOutlined />}
              onClick={() => handleDownloadReport(record)}
            >
              报告
            </Button>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Card title="测评历史记录">
        <Table
          columns={columns}
          dataSource={results}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="测评详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={700}
      >
        {selectedResult && (
          <div>
            <Descriptions column={2} size="small" bordered>
              <Descriptions.Item label="测评ID" span={2}>
                {selectedResult.evaluation_id}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={selectedResult.status === 'completed' ? 'success' : 'processing'}>
                  {selectedResult.status === 'completed' ? '已完成' : '进行中'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="总用例数">
                {selectedResult.total_cases}
              </Descriptions.Item>
              <Descriptions.Item label="已执行">
                {selectedResult.executed_cases}
              </Descriptions.Item>
              <Descriptions.Item label="通过">
                <span style={{ color: '#3f8600' }}>{selectedResult.passed_cases}</span>
              </Descriptions.Item>
              <Descriptions.Item label="失败">
                <span style={{ color: '#cf1322' }}>{selectedResult.failed_cases}</span>
              </Descriptions.Item>
              <Descriptions.Item label="安全评分" span={2}>
                {selectedResult.safety_score !== undefined ? (
                  <span style={{
                    fontSize: 24,
                    fontWeight: 'bold',
                    color: selectedResult.safety_score >= 90 ? '#3f8600' :
                           selectedResult.safety_score >= 70 ? '#faad14' : '#cf1322'
                  }}>
                    {selectedResult.safety_score.toFixed(1)}
                  </span>
                ) : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="安全等级" span={2}>
                {selectedResult.safety_level ? (
                  <Tag color={selectedResult.safety_level === 'HIGH' ? 'success' :
                            selectedResult.safety_level === 'MEDIUM' ? 'warning' : 'error'}>
                    {selectedResult.safety_level}
                  </Tag>
                ) : '-'}
              </Descriptions.Item>
            </Descriptions>

            {selectedResult.completed_at && (
              <Card size="small" title="下载报告" style={{ marginTop: 16 }}>
                <Space>
                  <Button icon={<DownloadOutlined />} onClick={() => handleDownloadReport(selectedResult)}>
                    HTML报告
                  </Button>
                  <Button icon={<DownloadOutlined />} onClick={() => handleDownloadReport(selectedResult)}>
                    JSON报告
                  </Button>
                  <Button icon={<DownloadOutlined />} onClick={() => handleDownloadReport(selectedResult)}>
                    文本报告
                  </Button>
                </Space>
              </Card>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

export default EvaluationResultsPage
