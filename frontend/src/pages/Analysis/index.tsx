/**
 * 数据分析页面
 * Data analysis page
 */

import React, { useState, useEffect } from 'react'
import {
  Card,
  Row,
  Col,
  DatePicker,
  Button,
  Typography,
  Space,
  Select,
  Spin,
  Empty,
  message,
} from 'antd'
import {
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined,
  DownloadOutlined,
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import dayjs from 'dayjs'
import { useStatistics } from '@/hooks/useStatistics'
import { getRiskLevelColor } from '@/utils/helpers'
import { CHART_COLORS } from '@/utils/constants'
import api from '@/services/api'

const { Title, Text } = Typography
const { RangePicker } = DatePicker

/**
 * Analysis组件
 */
const Analysis: React.FC = () => {
  const [timeRange, setTimeRange] = useState<{
    start: string
    end: string
  }>({
    start: dayjs().subtract(7, 'day').toISOString(),
    end: dayjs().toISOString(),
  })
  const [chartType, setChartType] = useState<'line' | 'bar'>('line')
  const [heatmapData, setHeatmapData] = useState<any[]>([])
  const [heatmapLoading, setHeatmapLoading] = useState(false)

  const { overview, trends, distribution, loading, refresh } = useStatistics(
    timeRange,
    false
  )

  /**
   * 加载热力图数据
   */
  useEffect(() => {
    loadHeatmapData()
  }, [timeRange])

  const loadHeatmapData = async () => {
    try {
      setHeatmapLoading(true)
      const days = Math.ceil((new Date(timeRange.end).getTime() - new Date(timeRange.start).getTime()) / (1000 * 60 * 60 * 24))

      const response = await api.get('/analysis/threat-heatmap', {
        params: { days }
      })

      setHeatmapData(response.data.data || [])
    } catch (error) {
      console.error('加载热力图数据失败:', error)
      // 静默失败,不显示错误消息
    } finally {
      setHeatmapLoading(false)
    }
  }

  /**
   * 时间范围变化处理
   */
  const handleDateRangeChange = (dates: any) => {
    if (dates && dates.length === 2) {
      setTimeRange({
        start: dates[0].toISOString(),
        end: dates[1].toISOString(),
      })
    }
  }

  /**
   * 导出分析报告
   */
  const handleExport = () => {
    // TODO: 实现导出功能
    console.log('Exporting analysis report...')
  }

  /**
   * 渲染趋势对比图
   */
  const renderTrendComparisonChart = () => {
    if (!trends) return null

    const option = {
      title: {
        text: '检测趋势对比',
        left: 'center',
      },
      tooltip: {
        trigger: 'axis',
      },
      legend: {
        data: ['总检测量', '风险检测量'],
        bottom: 0,
      },
      xAxis: {
        type: 'category',
        data: trends.labels,
      },
      yAxis: {
        type: 'value',
        name: '数量',
      },
      series: [
        {
          name: '总检测量',
          type: chartType,
          data: trends.datasets[0]?.data || [],
          smooth: true,
          itemStyle: { color: CHART_COLORS[0] },
        },
        {
          name: '风险检测量',
          type: chartType,
          data: trends.datasets[1]?.data || [],
          smooth: true,
          itemStyle: { color: CHART_COLORS[3] },
        },
      ],
    }

    return (
      <Card
        title="检测趋势对比"
        extra={
          <Space>
            <Select
              value={chartType}
              onChange={setChartType}
              style={{ width: 100 }}
            >
              <Select.Option value="line">折线图</Select.Option>
              <Select.Option value="bar">柱状图</Select.Option>
            </Select>
          </Space>
        }
      >
        <ReactECharts option={option} style={{ height: 400 }} />
      </Card>
    )
  }

  /**
   * 渲染风险分布热力图
   */
  const renderRiskHeatmap = () => {
    if (heatmapLoading) {
      return (
        <Card title="风险检测时间分布">
          <div style={{ textAlign: 'center', padding: '100px 0' }}>
            <Spin size="large" tip="加载中..." />
          </div>
        </Card>
      )
    }

    // 检查是否有数据
    if (!heatmapData || heatmapData.length === 0) {
      return (
        <Card title="风险检测时间分布">
          <div style={{ textAlign: 'center', padding: '100px 0' }}>
            <Empty
              description="暂无威胁检测数据"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
            <Text type="secondary" style={{ display: 'block', marginTop: 16 }}>
              调用检测接口后,数据将自动显示在这里
            </Text>
          </div>
        </Card>
      )
    }

    const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`)
    const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

    // 计算最大值用于visualMap
    const maxCount = Math.max(...heatmapData.map((item) => item[2]), 1)

    const option = {
      title: {
        text: '风险检测时间分布',
        left: 'center',
      },
      tooltip: {
        position: 'top',
        formatter: (params: any) => {
          return `${days[params.value[1]]} ${hours[params.value[0]]}: ${params.value[2]}次`
        },
      },
      grid: {
        height: '70%',
        top: '15%',
      },
      xAxis: {
        type: 'category',
        data: hours,
        splitArea: {
          show: true,
        },
      },
      yAxis: {
        type: 'category',
        data: days,
        splitArea: {
          show: true,
        },
      },
      visualMap: {
        min: 0,
        max: maxCount,
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: '5%',
        inRange: {
          color: ['#50a3ba', '#eac736', '#d94e5d'],
        },
      },
      series: [
        {
          name: '检测次数',
          type: 'heatmap',
          data: heatmapData,
          label: {
            show: false,
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(0, 0, 0, 0.5)',
            },
          },
        },
      ],
    }

    return (
      <Card title="风险检测时间分布">
        <ReactECharts option={option} style={{ height: 400 }} />
      </Card>
    )
  }

  return (
    <div>
      {/* 页面标题 */}
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>数据分析</Title>
        <Text type="secondary">深入分析检测数据，发现潜在威胁趋势</Text>
      </div>

      {/* 筛选条件 */}
      <Card style={{ marginBottom: 24 }}>
        <Space size="large">
          <Text>时间范围：</Text>
          <RangePicker
            defaultValue={[
              dayjs().subtract(7, 'day'),
              dayjs(),
            ]}
            onChange={handleDateRangeChange}
          />
          <Button
            icon={<DownloadOutlined />}
            onClick={handleExport}
          >
            导出报告
          </Button>
          <Button onClick={refresh} loading={loading}>
            刷新数据
          </Button>
        </Space>
      </Card>

      {/* 图表区域 */}
      <Row gutter={[16, 16]}>
        <Col span={24}>
          {renderTrendComparisonChart()}
        </Col>
        <Col span={24}>
          {renderRiskHeatmap()}
        </Col>
      </Row>
    </div>
  )
}

export default Analysis
