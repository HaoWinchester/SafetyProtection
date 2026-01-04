/**
 * 用户中心主页面
 * User Center main page - 类似 bigmodel.cn/usercenter
 */

import React, { useState } from 'react'
import { Card, Row, Col, Tabs, Button, Space, Typography, Statistic, Progress, Tag, Avatar } from 'antd'
import {
  ApiOutlined,
  DollarOutlined,
  SafetyOutlined,
  UserOutlined,
  RightOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'

const { Title, Text, Paragraph } = Typography

/**
 * UserCenter组件
 */
const UserCenter: React.FC = () => {
  const navigate = useNavigate()

  // 模拟用户数据
  const [userInfo] = useState({
    username: '用户',
    email: 'user@example.com',
    phone: '138****8888',
    verified: true,
    balance: 100.00,
    remainingQuota: 50000,
    totalQuota: 100000,
  })

  // 模拟项目数据
  const [projects] = useState([
    {
      id: '1',
      name: '默认项目',
      apiKey: 'sk-xxxx xxxx xxxx xxxx',
      status: 'active',
      createTime: '2024-01-01',
    },
  ])

  // 模拟账单数据
  const [bills] = useState([
    {
      id: '1',
      amount: 50.00,
      status: 'paid',
      date: '2024-01-01',
      description: '充值',
    },
  ])

  // 标签页配置
  const tabItems = [
    {
      key: 'overview',
      label: '概览',
      children: (
        <div>
          {/* 用户信息卡片 */}
          <Card
            title="用户信息"
            extra={
              <Button
                type="link"
                icon={<RightOutlined />}
                onClick={() => navigate('/usercenter/profile')}
              >
                查看详情
              </Button>
            }
            style={{ marginBottom: 16 }}
          >
            <Row gutter={16}>
              <Col span={6}>
                <Avatar size={80} icon={<UserOutlined />} />
              </Col>
              <Col span={18}>
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <Title level={4}>{userInfo.username}</Title>
                  <Text type="secondary">{userInfo.email}</Text>
                  <div>
                    <Tag color={userInfo.verified ? 'success' : 'warning'} icon={userInfo.verified ? <CheckCircleOutlined /> : <WarningOutlined />}>
                      {userInfo.verified ? '已实名认证' : '未实名认证'}
                    </Tag>
                  </div>
                </Space>
              </Col>
            </Row>
          </Card>

          {/* 账户余额 */}
          <Card
            title="账户余额"
            extra={
              <Button type="primary" icon={<DollarOutlined />} onClick={() => navigate('/usercenter/recharge')}>
                充值
              </Button>
            }
            style={{ marginBottom: 16 }}
          >
            <Row gutter={16}>
              <Col span={8}>
                <Statistic
                  title="账户余额"
                  prefix="¥"
                  value={userInfo.balance}
                  precision={2}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="剩余额度"
                  value={userInfo.remainingQuota}
                  suffix="次"
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="总额度"
                  value={userInfo.totalQuota}
                  suffix="次"
                />
              </Col>
            </Row>
            <div style={{ marginTop: 24 }}>
              <Text type="secondary">额度使用进度</Text>
              <Progress
                percent={((userInfo.totalQuota - userInfo.remainingQuota) / userInfo.totalQuota) * 100}
                status="active"
              />
            </div>
          </Card>

          {/* 项目概览 */}
          <Card
            title="我的项目"
            extra={
              <Button
                type="link"
                icon={<RightOutlined />}
                onClick={() => navigate('/usercenter/projects')}
              >
                管理项目
              </Button>
            }
            style={{ marginBottom: 16 }}
          >
            <Row gutter={[16, 16]}>
              {projects.map((project) => (
                <Col span={24} key={project.id}>
                  <Card size="small" style={{ background: '#fafafa' }}>
                    <Row justify="space-between" align="middle">
                      <Col>
                        <Space>
                          <ApiOutlined style={{ fontSize: 24, color: '#1890ff' }} />
                          <div>
                            <Text strong>{project.name}</Text>
                            <br />
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {project.apiKey}
                            </Text>
                          </div>
                        </Space>
                      </Col>
                      <Col>
                        <Tag color="success">活跃</Tag>
                      </Col>
                    </Row>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>

          {/* 快捷操作 */}
          <Card title="快捷操作">
            <Row gutter={[16, 16]}>
              <Col span={6}>
                <Button
                  block
                  size="large"
                  icon={<ApiOutlined />}
                  onClick={() => navigate('/usercenter/projects')}
                >
                  API管理
                </Button>
              </Col>
              <Col span={6}>
                <Button
                  block
                  size="large"
                  icon={<DollarOutlined />}
                  onClick={() => navigate('/usercenter/bills')}
                >
                  账单管理
                </Button>
              </Col>
              <Col span={6}>
                <Button
                  block
                  size="large"
                  icon={<SafetyOutlined />}
                  onClick={() => navigate('/usercenter/verify')}
                >
                  实名认证
                </Button>
              </Col>
              <Col span={6}>
                <Button
                  block
                  size="large"
                  icon={<UserOutlined />}
                  onClick={() => navigate('/usercenter/profile')}
                >
                  个人信息
                </Button>
              </Col>
            </Row>
          </Card>
        </div>
      ),
    },
    {
      key: 'projects',
      label: '项目管理',
      children: (
        <Card>
          <Paragraph>
            <Text>项目管理功能即将上线,将包含:</Text>
            <ul>
              <li>创建和管理项目</li>
              <li>API Keys管理</li>
              <li>权限控制</li>
              <li>使用统计</li>
            </ul>
          </Paragraph>
          <Button type="primary" onClick={() => navigate('/usercenter/projects')}>
            前往项目管理
          </Button>
        </Card>
      ),
    },
    {
      key: 'bills',
      label: '账单管理',
      children: (
        <Card>
          <Row gutter={16}>
            <Col span={8}>
              <Statistic title="本月消费" prefix="¥" value={0.00} precision={2} />
            </Col>
            <Col span={8}>
              <Statistic title="待支付金额" prefix="¥" value={0.00} precision={2} />
            </Col>
            <Col span={8}>
              <Statistic title="累计充值" prefix="¥" value={0.00} precision={2} />
            </Col>
          </Row>
          <div style={{ marginTop: 24 }}>
            <Button type="primary" onClick={() => navigate('/usercenter/bills')}>
              查看详细账单
            </Button>
          </div>
        </Card>
      ),
    },
  ]

  return (
    <div>
      <Title level={2}>用户中心</Title>
      <Paragraph type="secondary">
        管理您的账户信息、API密钥、账单和设置
      </Paragraph>

      <Tabs
        defaultActiveKey="overview"
        items={tabItems}
        size="large"
        style={{ marginTop: 24 }}
      />
    </div>
  )
}

export default UserCenter
