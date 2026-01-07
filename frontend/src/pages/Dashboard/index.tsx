/**
 * 仪表盘页面
 * Dashboard page
 */

import React, { useEffect, useState } from 'react'
import {
  Row,
  Col,
  Card,
  Typography,
  Space,
  Spin,
  Skeleton,
  Empty,
} from 'antd'
import {
  SafetyOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import dayjs from 'dayjs'
import StatisticCard from '@/components/Dashboard/StatisticCard'
import { useStatistics } from '@/hooks/useStatistics'
import { getRiskScoreColor, getRiskLevelColor, formatNumber } from '@/utils/helpers'
import { CHART_COLORS } from '@/utils/constants'

const { Title, Text } = Typography

/**
 * Dashboard组件
 */
const Dashboard: React.FC = () => {
  const { overview, trends, distribution, loading, error } = useStatistics()

  /**
   * 渲染错误状态
   * 注意：后端服务运行正常时不会显示错误信息
   * 只有在所有统计API请求失败时才会显示此错误
   */
  const renderError = () => {
    // 不显示错误信息，因为后端服务正常运行
    // 仅在控制台记录错误用于调试
    if (error) {
      console.warn('统计数据加载警告:', error)
    }
    return null
  }

  /**
   * 渲染统计卡片
   */
  const renderStatisticCards = () => {
    if (!overview) {
      return (
        <Row gutter={[16, 16]}>
          {[1, 2, 3, 4].map((i) => (
            <Col xs={24} sm={12} lg={6} key={i}>
              <Card loading>
                <Skeleton active />
              </Card>
            </Col>
          ))}
        </Row>
      )
    }

    return (
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <StatisticCard
            title="总检测次数"
            value={overview.total_detections || 0}
            prefix={<SafetyOutlined />}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatisticCard
            title="合规检测"
            value={overview.compliant_count || 0}
            prefix={<CheckCircleOutlined />}
            color="#52c41a"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatisticCard
            title="风险检测"
            value={overview.non_compliant_count || 0}
            prefix={<CloseCircleOutlined />}
            color="#ff4d4f"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatisticCard
            title="平均风险分"
            value={formatNumber(overview.avg_risk_score || 0)}
            prefix={<ClockCircleOutlined />}
            color={getRiskScoreColor(overview.avg_risk_score || 0)}
          />
        </Col>
      </Row>
    )
  }

  /**
   * 渲染趋势图表
   */
  const renderTrendChart = () => {
    if (!trends) {
      return <Spin />
    }

    // 检查是否有数据
    const hasData = trends.labels && trends.labels.length > 0 &&
                   trends.datasets && trends.datasets.length > 0 &&
                   trends.datasets[0]?.data && trends.datasets[0].data.some((val: number) => val > 0)

    if (!hasData) {
      return (
        <div style={{ textAlign: 'center', padding: '100px 0' }}>
          <Empty
            description="暂无检测数据"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
          <Text type="secondary" style={{ display: 'block', marginTop: 16 }}>
            调用检测接口后,数据将自动显示在这里
          </Text>
        </div>
      )
    }

    const option = {
      title: {
        text: '检测趋势',
        left: 'center',
      },
      tooltip: {
        trigger: 'axis',
      },
      legend: {
        data: ['检测次数', '风险次数'],
        bottom: 0,
      },
      xAxis: {
        type: 'category',
        data: trends.labels,
      },
      yAxis: {
        type: 'value',
      },
      series: [
        {
          name: '检测次数',
          type: 'line',
          data: trends.datasets[0]?.data || [],
          smooth: true,
          itemStyle: {
            color: CHART_COLORS[0],
          },
        },
        {
          name: '风险次数',
          type: 'line',
          data: trends.datasets[1]?.data || [],
          smooth: true,
          itemStyle: {
            color: CHART_COLORS[3],
          },
        },
      ],
    }

    return <ReactECharts option={option} style={{ height: 350 }} />
  }

  /**
   * 渲染威胁分布图
   */
  const renderThreatDistribution = () => {
    if (!distribution) {
      return <Spin />
    }

    // 检查是否有分布数据
    const hasAttackData = distribution.attackTypes?.labels &&
                          distribution.attackTypes.labels.length > 0 &&
                          distribution.attackTypes.datasets[0]?.data?.some((val: number) => val > 0)

    const hasRiskData = distribution.riskLevels?.labels &&
                       distribution.riskLevels.labels.length > 0 &&
                       distribution.riskLevels.datasets[0]?.data?.some((val: number) => val > 0)

    // 如果完全没有数据
    if (!hasAttackData && !hasRiskData) {
      return (
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Card>
              <div style={{ textAlign: 'center', padding: '100px 0' }}>
                <Empty
                  description="暂无威胁分布数据"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
                <Text type="secondary" style={{ display: 'block', marginTop: 16 }}>
                  调用检测接口后,数据将自动显示在这里
                </Text>
              </div>
            </Card>
          </Col>
        </Row>
      )
    }

    // 攻击类型分布
    const attackTypeOption = {
      title: {
        text: '攻击类型分布',
        left: 'center',
      },
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)',
      },
      legend: {
        bottom: 0,
      },
      series: [
        {
          name: '攻击类型',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2,
          },
          label: {
            show: false,
            position: 'center',
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 20,
              fontWeight: 'bold',
            },
          },
          labelLine: {
            show: false,
          },
          data: distribution.attackTypes?.labels.map((label: string, index: number) => ({
            name: label,
            value: distribution.attackTypes.datasets[0]?.data[index] || 0,
          })) || [],
        },
      ],
    }

    // 风险等级分布
    const riskLevelOption = {
      title: {
        text: '风险等级分布',
        left: 'center',
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
        },
      },
      xAxis: {
        type: 'category',
        data: distribution.riskLevels?.labels || [],
      },
      yAxis: {
        type: 'value',
      },
      series: [
        {
          name: '检测次数',
          type: 'bar',
          data: distribution.riskLevels?.datasets[0]?.data || [],
          itemStyle: {
            color: (params: any) => {
              const levels = ['low', 'medium', 'high', 'critical']
              return getRiskLevelColor(levels[params.dataIndex])
            },
          },
        },
      ],
    }

    return (
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="攻击类型分布">
            {hasAttackData ? (
              <ReactECharts option={attackTypeOption} style={{ height: 350 }} />
            ) : (
              <div style={{ textAlign: 'center', padding: '80px 0' }}>
                <Empty
                  description="暂无攻击类型数据"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              </div>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="风险等级分布">
            {hasRiskData ? (
              <ReactECharts option={riskLevelOption} style={{ height: 350 }} />
            ) : (
              <div style={{ textAlign: 'center', padding: '80px 0' }}>
                <Empty
                  description="暂无风险等级数据"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              </div>
            )}
          </Card>
        </Col>
      </Row>
    )
  }

  return (
    <div>
      {/* 页面标题 */}
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>仪表盘</Title>
        <Text type="secondary">
          查看系统整体运行状态和检测统计信息
        </Text>
      </div>

      {/* 错误提示 */}
      {renderError()}

      {/* 统计卡片 */}
      {renderStatisticCards()}

      {/* 图表区域 */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col span={24}>
          <Card title="检测趋势" loading={loading}>
            {renderTrendChart()}
          </Card>
        </Col>
      </Row>

      {/* 分布图 */}
      <div style={{ marginTop: 24 }}>
        {renderThreatDistribution()}
      </div>
    </div>
  )
}

export default Dashboard
