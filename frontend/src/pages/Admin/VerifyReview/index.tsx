/**
 * 管理员审核实名认证页面
 * Admin Verification Review Page
 */

import React, { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  message,
  Modal,
  Form,
  Input,
  Select,
  Descriptions,
  Alert,
  Typography,
  Row,
  Col,
  Statistic,
} from 'antd'
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons'
import { authAxios } from '@/services/auth'

const { Title, Text } = Typography
const { Option } = Select
const { TextArea } = Input

interface VerificationRecord {
  user_id: string
  username: string
  email: string
  verification: {
    verified: boolean
    status: 'pending' | 'approved' | 'rejected'
    submit_time: string
    real_name: string
    id_card: string
    company: string
    position: string
    reject_reason?: string
  }
}

const VerifyReview: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [verifications, setVerifications] = useState<VerificationRecord[]>([])
  const [filteredVerifications, setFilteredVerifications] = useState<VerificationRecord[]>([])
  const [statusFilter, setStatusFilter] = useState<string>('pending')
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<VerificationRecord | null>(null)
  const [reviewForm] = Form.useForm()

  // 加载认证列表
  const loadVerifications = async () => {
    try {
      setLoading(true)
      const response = await authAxios.get('/admin/verifications', {
        params: { status: statusFilter || undefined }
      })
      setVerifications(response.data.verifications || [])
      setFilteredVerifications(response.data.verifications || [])
    } catch (error: any) {
      console.error('加载认证列表失败:', error)
      if (error.response?.status !== 401) {
        message.error('加载认证列表失败')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadVerifications()
  }, [statusFilter])

  // 查看详情
  const viewDetail = (record: VerificationRecord) => {
    setSelectedRecord(record)
    setDetailModalVisible(true)
    reviewForm.resetFields()
  }

  // 审核认证
  const handleReview = async (values: any) => {
    if (!selectedRecord) return

    try {
      setLoading(true)
      const { action, reject_reason } = values

      // 构建请求数据,只在reject时才发送reject_reason
      const requestData: any = {
        action
      }

      if (action === 'reject' && reject_reason) {
        requestData.reject_reason = reject_reason
      } else {
        requestData.reject_reason = null
      }

      await authAxios.post(`/admin/verifications/${selectedRecord.user_id}/review`, requestData)

      message.success(action === 'approve' ? '认证已通过' : '认证已拒绝')
      setDetailModalVisible(false)
      setSelectedRecord(null)
      reviewForm.resetFields()
      await loadVerifications()
    } catch (error: any) {
      console.error('审核操作失败:', error)
      message.error(error.response?.data?.detail || '审核操作失败')
    } finally {
      setLoading(false)
    }
  }

  // 获取状态标签
  const getStatusTag = (status: string) => {
    switch (status) {
      case 'pending':
        return <Tag color="processing" icon={<ClockCircleOutlined />}>审核中</Tag>
      case 'approved':
        return <Tag color="success" icon={<CheckCircleOutlined />}>已通过</Tag>
      case 'rejected':
        return <Tag color="error" icon={<CloseCircleOutlined />}>已拒绝</Tag>
      default:
        return <Tag>未知</Tag>
    }
  }

  // 计算统计数据
  const stats = {
    total: verifications.length,
    pending: verifications.filter(v => v.verification.status === 'pending').length,
    approved: verifications.filter(v => v.verification.status === 'approved').length,
    rejected: verifications.filter(v => v.verification.status === 'rejected').length,
  }

  // 表格列定义
  const columns = [
    {
      title: '用户ID',
      dataIndex: 'user_id',
      key: 'user_id',
      width: 150,
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      width: 120,
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      width: 200,
    },
    {
      title: '真实姓名',
      dataIndex: ['verification', 'real_name'],
      key: 'real_name',
      width: 120,
    },
    {
      title: '身份证号',
      dataIndex: ['verification', 'id_card'],
      key: 'id_card',
      width: 180,
      render: (id_card: string) => {
        if (!id_card) return '-'
        // 隐藏中间部分,只显示前4位和后4位
        return id_card.replace(/(\d{4})\d*(\d{4})/, '$1****$2')
      }
    },
    {
      title: '公司',
      dataIndex: ['verification', 'company'],
      key: 'company',
      width: 150,
      render: (company: string) => company || '-'
    },
    {
      title: '职位',
      dataIndex: ['verification', 'position'],
      key: 'position',
      width: 120,
      render: (position: string) => position || '-'
    },
    {
      title: '状态',
      dataIndex: ['verification', 'status'],
      key: 'status',
      width: 100,
      render: (status: string) => getStatusTag(status)
    },
    {
      title: '提交时间',
      dataIndex: ['verification', 'submit_time'],
      key: 'submit_time',
      width: 180,
      render: (time: string) => time ? new Date(time).toLocaleString('zh-CN') : '-'
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right' as const,
      render: (_: any, record: VerificationRecord) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => viewDetail(record)}
          >
            查看
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
      <Card style={{ marginBottom: 24 }}>
        <Title level={2}>实名认证审核</Title>
        <Text type="secondary">管理用户提交的实名认证申请</Text>
      </Card>

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic title="总申请数" value={stats.total} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="待审核"
              value={stats.pending}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已通过"
              value={stats.approved}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已拒绝"
              value={stats.rejected}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 列表表格 */}
      <Card
        title="认证申请列表"
        extra={
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 150 }}
          >
            <Option value="">全部</Option>
            <Option value="pending">待审核</Option>
            <Option value="approved">已通过</Option>
            <Option value="rejected">已拒绝</Option>
          </Select>
        }
      >
        <Table
          columns={columns}
          dataSource={filteredVerifications}
          rowKey="user_id"
          loading={loading}
          scroll={{ x: 1500 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
      </Card>

      {/* 详情和审核模态框 */}
      <Modal
        title="认证详情"
        open={detailModalVisible}
        onCancel={() => {
          setDetailModalVisible(false)
          setSelectedRecord(null)
          reviewForm.resetFields()
        }}
        footer={null}
        width={800}
      >
        {selectedRecord && (
          <div>
            {/* 用户信息 */}
            <Descriptions
              title="用户信息"
              bordered
              column={2}
              style={{ marginBottom: 16 }}
            >
              <Descriptions.Item label="用户ID">
                {selectedRecord.user_id}
              </Descriptions.Item>
              <Descriptions.Item label="用户名">
                {selectedRecord.username}
              </Descriptions.Item>
              <Descriptions.Item label="邮箱" span={2}>
                {selectedRecord.email}
              </Descriptions.Item>
            </Descriptions>

            {/* 认证信息 */}
            <Descriptions
              title="认证信息"
              bordered
              column={2}
              style={{ marginBottom: 16 }}
            >
              <Descriptions.Item label="真实姓名">
                {selectedRecord.verification.real_name}
              </Descriptions.Item>
              <Descriptions.Item label="身份证号">
                {selectedRecord.verification.id_card.replace(/(\d{4})\d*(\d{4})/, '$1****$2')}
              </Descriptions.Item>
              <Descriptions.Item label="公司">
                {selectedRecord.verification.company || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="职位">
                {selectedRecord.verification.position || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                {getStatusTag(selectedRecord.verification.status)}
              </Descriptions.Item>
              <Descriptions.Item label="提交时间">
                {new Date(selectedRecord.verification.submit_time).toLocaleString('zh-CN')}
              </Descriptions.Item>
            </Descriptions>

            {/* 拒绝原因 */}
            {selectedRecord.verification.reject_reason && (
              <Alert
                type="error"
                message="拒绝原因"
                description={selectedRecord.verification.reject_reason}
                style={{ marginBottom: 16 }}
              />
            )}

            {/* 审核表单 */}
            {selectedRecord.verification.status === 'pending' && (
              <Card title="审核操作" style={{ marginTop: 16 }}>
                <Form
                  form={reviewForm}
                  layout="vertical"
                  onFinish={handleReview}
                >
                  <Form.Item
                    name="action"
                    label="审核结果"
                    rules={[{ required: true, message: '请选择审核结果' }]}
                  >
                    <Select placeholder="请选择审核结果">
                      <Option value="approve">通过认证</Option>
                      <Option value="reject">拒绝认证</Option>
                    </Select>
                  </Form.Item>

                  <Form.Item
                    noStyle
                    shouldUpdate={(prevValues, currentValues) =>
                      prevValues.action !== currentValues.action
                    }
                  >
                    {({ getFieldValue }) =>
                      getFieldValue('action') === 'reject' ? (
                        <Form.Item
                          name="reject_reason"
                          label="拒绝原因"
                          rules={[
                            { required: true, message: '请填写拒绝原因' },
                            { min: 5, message: '拒绝原因至少5个字符' }
                          ]}
                        >
                          <TextArea
                            rows={4}
                            placeholder="请详细说明拒绝原因,以便用户了解问题所在"
                            maxLength={500}
                            showCount
                          />
                        </Form.Item>
                      ) : null
                    }
                  </Form.Item>

                  <Form.Item>
                    <Space>
                      <Button type="primary" htmlType="submit" loading={loading}>
                        完成审核
                      </Button>
                      <Button onClick={() => reviewForm.resetFields()}>
                        重置
                      </Button>
                    </Space>
                  </Form.Item>
                </Form>
              </Card>
            )}

            {selectedRecord.verification.status !== 'pending' && (
              <Alert
                type="info"
                message="该申请已被处理"
                description="此认证申请已经审核完成,无法再次操作"
                style={{ marginTop: 16 }}
              />
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

export default VerifyReview
