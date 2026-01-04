/**
 * 实名认证页面
 * Identity Verification Page
 */

import React, { useState, useEffect } from 'react'
import {
  Card,
  Form,
  Input,
  Button,
  message,
  Steps,
  Result,
  Tag,
  Descriptions,
  Alert,
  Space,
} from 'antd'
import {
  UserOutlined,
  IdcardOutlined,
  BankOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons'
import { userService } from '@/services/userService'

const { Step } = Steps

const Verify: React.FC = () => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [verifyStatus, setVerifyStatus] = useState<any>(null)

  // 加载认证状态
  const loadVerifyStatus = async () => {
    try {
      setLoading(true)
      const status = await userService.getVerifyStatus()
      setVerifyStatus(status)
    } catch (error) {
      message.error('加载认证状态失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadVerifyStatus()
  }, [])

  // 提交认证
  const handleSubmit = async (values: any) => {
    try {
      setLoading(true)
      await userService.submitVerification(values)
      message.success('实名认证申请已提交,请等待审核')
      await loadVerifyStatus()
    } catch (error) {
      message.error('提交实名认证失败')
    } finally {
      setLoading(false)
    }
  }

  // 获取当前步骤
  const getCurrentStep = () => {
    if (!verifyStatus) return 0
    if (verifyStatus.verified) return 2
    if (verifyStatus.status === 'pending') return 1
    if (verifyStatus.status === 'rejected') return 0
    return 0
  }

  // 获取状态显示
  const renderStatusContent = () => {
    if (!verifyStatus) return null

    if (verifyStatus.verified) {
      // 已认证
      return (
        <Result
          icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
          title="实名认证已通过"
          subTitle="您已完成实名认证,可以正常使用平台功能"
          extra={[
            <Descriptions column={2} bordered key="descriptions">
              <Descriptions.Item label="真实姓名">
                {verifyStatus.real_name}
              </Descriptions.Item>
              <Descriptions.Item label="认证时间">
                {verifyStatus.submit_time}
              </Descriptions.Item>
            </Descriptions>,
          ]}
        />
      )
    }

    if (verifyStatus.status === 'pending') {
      // 审核中
      return (
        <Result
          icon={<ClockCircleOutlined style={{ color: '#faad14' }} />}
          title="实名认证审核中"
          subTitle="我们将在1-3个工作日内完成审核,请耐心等待"
          extra={[
            <Descriptions column={2} bordered key="descriptions">
              <Descriptions.Item label="提交时间">
                {verifyStatus.submit_time}
              </Descriptions.Item>
              <Descriptions.Item label="审核状态">
                <Tag color="processing">审核中</Tag>
              </Descriptions.Item>
            </Descriptions>,
          ]}
        />
      )
    }

    if (verifyStatus.status === 'rejected') {
      // 已拒绝
      return (
        <Result
          icon={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
          title="实名认证未通过"
          subTitle={verifyStatus.reject_reason || '请核对信息后重新提交'}
          extra={[
            <Alert
              key="alert"
              message="拒绝原因"
              description={verifyStatus.reject_reason || '信息填写有误'}
              type="error"
              showIcon
              style={{ marginBottom: 16 }}
            />,
            <Button type="primary" key="resubmit" onClick={() => setVerifyStatus(null)}>
              重新提交
            </Button>,
          ]}
        />
      )
    }

    // 未提交
    return (
      <Card title="实名认证" extra={<Tag color="blue">提升账户安全</Tag>}>
        <Alert
          message="为什么要进行实名认证?"
          description="实名认证后,您可以享受更多权益和服务,包括但不限于:提高API调用限额、解锁高级功能、享受专属客服等"
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            label="真实姓名"
            name="real_name"
            rules={[
              { required: true, message: '请输入真实姓名' },
              { min: 2, message: '姓名至少2个字符' },
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="请输入您的真实姓名"
            />
          </Form.Item>

          <Form.Item
            label="身份证号"
            name="id_card"
            rules={[
              { required: true, message: '请输入身份证号' },
              {
                pattern: /^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/,
                message: '身份证号格式不正确',
              },
            ]}
          >
            <Input
              prefix={<IdcardOutlined />}
              placeholder="请输入18位身份证号"
            />
          </Form.Item>

          <Form.Item
            label="公司"
            name="company"
          >
            <Input
              prefix={<BankOutlined />}
              placeholder="请输入公司名称(选填)"
            />
          </Form.Item>

          <Form.Item
            label="职位"
            name="position"
          >
            <Input placeholder="请输入职位(选填)" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                提交认证
              </Button>
              <Button onClick={() => form.resetFields()}>
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    )
  }

  return (
    <div>
      <Steps current={getCurrentStep()} style={{ marginBottom: 32 }}>
        <Step title="提交认证" description="填写实名信息" />
        <Step title="审核中" description="等待平台审核" />
        <Step title="认证完成" description="享受更多权益" />
      </Steps>

      {renderStatusContent()}
    </div>
  )
}

export default Verify
