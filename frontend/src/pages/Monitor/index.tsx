/**
 * 系统监控页面
 * System monitoring page
 */

import React, { useEffect, useState } from 'react'
import {
  Card,
  Row,
  Col,
  Statistic,
  Progress,
  Typography,
  Space,
  Tag,
  Button,
  Alert,
  Table,
  Badge,
  Divider,
} from 'antd'
import {
  ThunderboltOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
  ApiOutlined,
  DatabaseOutlined,
  CloudServerOutlined,
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import { useSelector, useDispatch } from 'react-redux'
import {
  selectSystemStatus,
  selectPerformanceMetrics,
  selectEngineStatus,
  selectIsMonitoring,
  selectMonitorLoading,
  fetchAllMonitorData,
  startMonitoring,
  stopMonitoring,
} from '@/store/monitorSlice'
import { SystemStatus } from '@/types'
import { PERFORMANCE_THRESHOLDS } from '@/utils/constants'
import { formatDuration, formatNumber } from '@/utils/helpers'

const { Title, Text } = Typography

/**
 * Monitor组件
 */
const Monitor: React.FC = () => {
  const dispatch = useDispatch()
  const systemStatus = useSelector(selectSystemStatus)
  const performanceMetrics = useSelector(selectPerformanceMetrics)
  const engineStatus = useSelector(selectEngineStatus)
  const isMonitoring = useSelector(selectIsMonitoring)
  const loading = useSelector(selectMonitorLoading)

  const [cpuHistory, setCpuHistory] = useState<number[]>([])
  const [memoryHistory, setMemoryHistory] = useState<number[]>([])
  const [timeLabels, setTimeLabels] = useState<string[]>([])

  /**
   * 初始化监控
   */
  useEffect(() => {
    dispatch(fetchAllMonitorData())

    return () => {
      dispatch(stopMonitoring())
    }
  }, [dispatch])

  /**
   * 启动/停止监控
   */
  const handleToggleMonitoring = () => {
    if (isMonitoring) {
      dispatch(stopMonitoring())
    } else {
      dispatch(startMonitoring())
    }
  }

  /**
   * 刷新数据
   */
  const handleRefresh = () => {
    dispatch(fetchAllMonitorData())
  }

  /**
   * 获取系统状态标签
   */
  const getSystemStatusTag = (status: SystemStatus) => {
    const config = {
      [SystemStatus.HEALTHY]: { color: 'success', text: '正常', icon: <CheckCircleOutlined /> },
      [SystemStatus.DEGRADED]: { color: 'warning', text: '降级', icon: <WarningOutlined /> },
      [SystemStatus.DOWN]: { color: 'error', text: '离线', icon: <CloseCircleOutlined /> },
    }
    const { color, text, icon } = config[status]
    return (
      <Tag color={color} icon={icon}>
        {text}
      </Tag>
    )
  }

  /**
   * 渲染性能指标卡片
   */
  const renderPerformanceCards = () => {
    if (!performanceMetrics) {
      return null
    }

    const cpuPercent = performanceMetrics.cpu_usage
    const memoryPercent = performanceMetrics.memory_usage
    const responseTime = performanceMetrics.response_time
    const errorRate = performanceMetrics.error_rate

    return (
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="CPU使用率"
              value={cpuPercent}
              suffix="%"
              valueStyle={{
                color: cpuPercent > PERFORMANCE_THRESHOLDS.CPU_CRITICAL
                  ? '#cf1322'
                  : cpuPercent > PERFORMANCE_THRESHOLDS.CPU_WARNING
                  ? '#faad14'
                  : '#52c41a'
              }}
              prefix={<CloudServerOutlined />}
            />
            <Progress
              percent={cpuPercent}
              status={
                cpuPercent > PERFORMANCE_THRESHOLDS.CPU_CRITICAL
                  ? 'exception'
                  : cpuPercent > PERFORMANCE_THRESHOLDS.CPU_WARNING
                  ? 'active'
                  : 'success'
              }
              showInfo={false}
              style={{ marginTop: 16 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="内存使用率"
              value={memoryPercent}
              suffix="%"
              valueStyle={{
                color: memoryPercent > PERFORMANCE_THRESHOLDS.MEMORY_CRITICAL
                  ? '#cf1322'
                  : memoryPercent > PERFORMANCE_THRESHOLDS.MEMORY_WARNING
                  ? '#faad14'
                  : '#52c41a'
              }}
              prefix={<DatabaseOutlined />}
            />
            <Progress
              percent={memoryPercent}
              status={
                memoryPercent > PERFORMANCE_THRESHOLDS.MEMORY_CRITICAL
                  ? 'exception'
                  : memoryPercent > PERFORMANCE_THRESHOLDS.MEMORY_WARNING
                  ? 'active'
                  : 'success'
              }
              showInfo={false}
              style={{ marginTop: 16 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="响应时间"
              value={responseTime}
              suffix="ms"
              valueStyle={{
                color: responseTime > PERFORMANCE_THRESHOLDS.RESPONSE_TIME_CRITICAL
                  ? '#cf1322'
                  : responseTime > PERFORMANCE_THRESHOLDS.RESPONSE_TIME_WARNING
                  ? '#faad14'
                  : '#52c41a'
              }}
              prefix={<ThunderboltOutlined />}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              P95 响应时间
            </Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="错误率"
              value={(errorRate * 100).toFixed(2)}
              suffix="%"
              valueStyle={{
                color: errorRate > PERFORMANCE_THRESHOLDS.ERROR_RATE_CRITICAL
                  ? '#cf1322'
                  : errorRate > PERFORMANCE_THRESHOLDS.ERROR_RATE_WARNING
                  ? '#faad14'
                  : '#52c41a'
              }}
              prefix={<WarningOutlined />}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              当前错误率
            </Text>
          </Card>
        </Col>
      </Row>
    )
  }

  /**
   * 渲染引擎状态
   */
  const renderEngineStatus = () => {
    if (!engineStatus) {
      return null
    }

    return (
      <Card title="检测引擎状态">
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={6}>
            <Statistic
              title="状态"
              value={engineStatus.running ? '运行中' : '已停止'}
              valueStyle={{
                color: engineStatus.running ? '#52c41a' : '#ff4d4f',
              }}
              prefix={
                <Badge
                  status={engineStatus.running ? 'processing' : 'error'}
                />
              }
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic
              title="队列大小"
              value={engineStatus.queue_size}
              prefix={<ApiOutlined />}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic
              title="已处理"
              value={engineStatus.processed_count}
              prefix={<CheckCircleOutlined />}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic
              title="失败数"
              value={engineStatus.failed_count}
              valueStyle={{ color: engineStatus.failed_count > 0 ? '#ff4d4f' : '#52c41a' }}
              prefix={<WarningOutlined />}
            />
          </Col>
        </Row>
        <Divider />
        <Statistic
          title="平均处理时间"
          value={formatDuration(engineStatus.avg_processing_time)}
          prefix={<ThunderboltOutlined />}
        />
      </Card>
    )
  }

  return (
    <div>
      {/* 页面标题 */}
      <div style={{ marginBottom: 24 }}>
        <Space>
          <Title level={2} style={{ margin: 0 }}>
            系统监控
          </Title>
          {getSystemStatusTag(systemStatus)}
        </Space>
        <Text type="secondary">
          实时监控系统运行状态和性能指标
        </Text>
      </div>

      {/* 操作按钮 */}
      <Card style={{ marginBottom: 24 }}>
        <Space>
          <Button
            type={isMonitoring ? 'default' : 'primary'}
            icon={<ThunderboltOutlined />}
            onClick={handleToggleMonitoring}
          >
            {isMonitoring ? '停止监控' : '启动监控'}
          </Button>
          <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={loading}>
            刷新数据
          </Button>
        </Space>
      </Card>

      {/* 性能指标 */}
      {renderPerformanceCards()}

      {/* 引擎状态 */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col span={24}>
          {renderEngineStatus()}
        </Col>
      </Row>
    </div>
  )
}

export default Monitor
