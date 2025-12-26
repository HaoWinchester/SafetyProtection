/**
 * 数据分析页面
 * Data analysis page
 */

import React, { useState } from 'react'
import {
  Card,
  Row,
  Col,
  DatePicker,
  Button,
  Typography,
  Space,
  Select,
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

  const { overview, trends, distribution, loading, refresh } = useStatistics(
    timeRange,
    false
  )

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
    if (!distribution) return null

    const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`)
    const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

    // 模拟数据
    const data = []
    for (let i = 0; i < days.length; i++) {
      for (let j = 0; j < hours.length; j++) {
        data.push([j, i, Math.floor(Math.random() * 100)])
      }
    }

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
        max: 100,
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
          data: data,
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
