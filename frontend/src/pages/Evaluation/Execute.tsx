/**
 * 测评执行页面
 * Evaluation execution page
 */
import React, { useState, useEffect } from 'react'
import {
  Card,
  Button,
  Progress,
  Table,
  Tag,
  Space,
  Descriptions,
  Statistic,
  Row,
  Col,
  Alert,
  Tabs,
  Modal,
  message
} from 'antd'
import { PlayCircleOutlined, SyncOutlined, DownloadOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'
import api from '../../services/api'

interface EvaluationResult {
  evaluation_id: string
  status: string
  total_cases: number
  executed_cases: number
  passed_cases: number
  failed_cases: number
  safety_score?: number
  safety_level?: string
  completed_at?: string
}

interface CaseResult {
  case_id: number
  is_passed: boolean | null
  risk_score?: number
  threat_category?: string
  model_response?: string
}

const EvaluationExecutePage: React.FC = () => {
  const [evaluationId, setEvaluationId] = useState<string>('')
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null)
  const [caseResults, setCaseResults] = useState<CaseResult[]>([])
  const [loading, setLoading] = useState(false)
  const [starting, setStarting] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  // 模拟启动测评
  const handleStart = async () => {
    if (!evaluationId) {
      message.warning('请先输入或选择测评配置ID')
      return
    }

    setStarting(true)
    try {
      // TODO: 实际API调用
      // const response = await api.post('/evaluation/start', {
      //   config_id: evaluationId,
      //   evaluation_level: 'basic'
      // })

      // 模拟创建测评
      setEvaluation({
        evaluation_id: 'eval_demo_001',
        status: 'running',
        total_cases: 7,
        executed_cases: 0,
        passed_cases: 0,
        failed_cases: 0
      })

      // 模拟进度更新
      let executed = 0
      const interval = setInterval(async () => {
        executed += 1
        const passed = Math.random() > 0.3 ? 1 : 0
        const failed = 1 - passed

        setEvaluation((prev) => ({
          ...prev!,
          executed_cases: executed,
          passed_cases: (prev?.passed_cases || 0) + passed,
          failed_cases: (prev?.failed_cases || 0) + failed,
          status: executed >= 7 ? 'completed' : 'running'
        }))

        if (executed >= 7) {
          clearInterval(interval)
          // 生成最终结果
          const finalScore = 75.5
          setEvaluation((prev) => ({
            ...prev!,
            status: 'completed',
            safety_score: finalScore,
            safety_level: 'MEDIUM',
            completed_at: new Date().toISOString()
          }))

          // 生成模拟的用例结果
          setCaseResults(Array.from({ length: 7 }, (_, i) => ({
            case_id: i + 1,
            is_passed: Math.random() > 0.3,
            risk_score: Math.random() * 0.8,
            threat_category: Math.random() > 0.5 ? 'PROMPT_INJECTION' : null,
            model_response: `这是第${i + 1}个测试用例的模拟响应...`
          })))

          message.success('测评完成!')
        }
      }, 1000)

      message.success('测评已启动')
    } catch (error) {
      message.error('启动失败')
    } finally {
      setStarting(false)
    }
  }

  const handleDownloadReport = (format: 'html' | 'json' | 'text') => {
    if (!evaluation) {
      message.warning('请先完成测评')
      return
    }

    // TODO: 实际下载
    message.info(`下载${format.toUpperCase()}报告功能开发中...`)
  }

  const progress = evaluation ? Math.round((evaluation.executed_cases / evaluation.total_cases) * 100) : 0

  const caseColumns = [
    {
      title: '用例ID',
      dataIndex: 'case_id',
      key: 'case_id',
    },
    {
      title: '结果',
      dataIndex: 'is_passed',
      key: 'is_passed',
      render: (passed: boolean | null) => {
        if (passed === true) return <Tag color="success" icon={<CheckCircleOutlined />}>通过</Tag>
        if (passed === false) return <Tag color="error" icon={<CloseCircleOutlined />}>失败</Tag>
        return <Tag color="default">未执行</Tag>
      }
    },
    {
      title: '风险分数',
      dataIndex: 'risk_score',
      key: 'risk_score',
      render: (score?: number) => score ? score.toFixed(3) : '-'
    },
    {
      title: '威胁类别',
      dataIndex: 'threat_category',
      key: 'threat_category',
      render: (category?: string) => category ? <Tag color="warning">{category}</Tag> : '-'
    },
    {
      title: '模型响应',
      dataIndex: 'model_response',
      key: 'model_response',
      ellipsis: true,
    },
  ]

  return (
    <div>
      <Card title="执行测评">
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* 输入区域 */}
          <Card size="small" title="第一步: 选择或输入测评配置">
            <Space>
              <Input
                placeholder="输入配置ID (例如: config_demo001)"
                value={evaluationId}
                onChange={(e) => setEvaluationId(e.target.value)}
                style={{ width: 300 }}
              />
              <Button
                type="primary"
                icon={<PlayCircleOutlined />}
                loading={starting}
                onClick={handleStart}
                disabled={!evaluationId || evaluation?.status === 'running'}
              >
                {evaluation?.status === 'running' ? '测评进行中...' : '启动测评'}
              </Button>
              <Button
                icon={<SyncOutlined />}
                onClick={() => {
                  setEvaluation(null)
                  setCaseResults([])
                }}
              >
                重置
              </Button>
            </Space>
          </Card>

          {/* 进度显示 */}
          {evaluation && (
            <Card size="small" title="第二步: 测评进度">
              <Descriptions column={2} size="small">
                <Descriptions.Item label="测评ID">{evaluation.evaluation_id}</Descriptions.Item>
                <Descriptions.Item label="状态">
                  <Tag color={
                    evaluation.status === 'completed' ? 'success' :
                    evaluation.status === 'running' ? 'processing' : 'default'
                  }>
                    {evaluation.status === 'running' ? '进行中' :
                     evaluation.status === 'completed' ? '已完成' : '待执行'}
                  </Tag>
                </Descriptions.Item>
              </Descriptions>

              <Progress
                percent={progress}
                status={evaluation.status === 'completed' ? 'success' : 'active'}
                strokeColor={{
                  '0%': '#108ee9',
                  '100%': '#87d068',
                }}
              />

              <Row gutter={16} style={{ marginTop: 16 }}>
                <Col span={6}>
                  <Statistic title="总用例数" value={evaluation.total_cases} />
                </Col>
                <Col span={6}>
                  <Statistic title="已执行" value={evaluation.executed_cases} />
                </Col>
                <Col span={6}>
                  <Statistic title="通过" value={evaluation.passed_cases} valueStyle={{ color: '#3f8600' }} />
                </Col>
                <Col span={6}>
                  <Statistic title="失败" value={evaluation.failed_cases} valueStyle={{ color: '#cf1322' }} />
                </Col>
              </Row>
            </Card>
          )}

          {/* 测评结果 */}
          {evaluation?.status === 'completed' && (
            <Card size="small" title="第三步: 查看结果">
              <Alert
                message="测评完成!"
                description={`安全评分: ${evaluation.safety_score} / 100 | 等级: ${evaluation.safety_level}`}
                type="success"
                showIcon
                style={{ marginBottom: 16 }}
              />

              <Row gutter={16} style={{ marginBottom: 16 }}>
                <Col span={12}>
                  <Statistic
                    title="安全评分"
                    value={evaluation.safety_score}
                    suffix="/ 100"
                    valueStyle={{ color: evaluation.safety_score! >= 90 ? '#3f8600' : evaluation.safety_score! >= 70 ? '#faad14' : '#cf1322' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="安全等级"
                    value={evaluation.safety_level}
                    valueStyle={{ color: '#3f8600' }}
                  />
                </Col>
              </Row>

              <Space>
                <Button
                  icon={<DownloadOutlined />}
                  onClick={() => handleDownloadReport('html')}
                >
                  下载HTML报告
                </Button>
                <Button
                  icon={<DownloadOutlined />}
                  onClick={() => handleDownloadReport('json')}
                >
                  下载JSON报告
                </Button>
                <Button
                  icon={<DownloadOutlined />}
                  onClick={() => handleDownloadReport('text')}
                >
                  下载文本报告
                </Button>
              </Space>
            </Card>
          )}
        </Space>
      </Card>

      {/* 详细结果表格 */}
      {caseResults.length > 0 && (
        <Card title="详细测试结果" style={{ marginTop: 16 }}>
          <Table
            columns={caseColumns}
            dataSource={caseResults}
            rowKey="case_id"
            pagination={false}
            size="small"
          />
        </Card>
      )}
    </div>
  )
}

export default EvaluationExecutePage
