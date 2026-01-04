/**
 * 账号设置页面
 * Account Settings Page
 */

import React, { useState, useEffect } from 'react'
import {
  Card,
  Form,
  Input,
  Button,
  message,
  Descriptions,
  Tag,
  Space,
  Divider,
} from 'antd'
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  BankOutlined,
  EnvironmentOutlined,
  EditOutlined,
} from '@ant-design/icons'
import { userService } from '@/services/userService'

const AccountSettings: React.FC = () => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [accountInfo, setAccountInfo] = useState<any>(null)

  // 加载账号信息
  const loadAccountInfo = async () => {
    try {
      setLoading(true)
      const info = await userService.getAccountInfo()
      setAccountInfo(info)
      form.setFieldsValue(info)
    } catch (error) {
      message.error('加载账号信息失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAccountInfo()
  }, [])

  // 保存修改
  const handleSave = async (values: any) => {
    try {
      setLoading(true)
      await userService.updateAccountInfo(values)
      message.success('账号信息更新成功')
      setEditMode(false)
      await loadAccountInfo()
    } catch (error) {
      message.error('账号信息更新失败')
    } finally {
      setLoading(false)
    }
  }

  // 取消编辑
  const handleCancel = () => {
    setEditMode(false)
    form.setFieldsValue(accountInfo)
  }

  return (
    <div>
      <Card
        title="账号设置"
        extra={
          !editMode && (
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => setEditMode(true)}
            >
              编辑
            </Button>
          )
        }
        loading={loading}
      >
        {!editMode ? (
          // 查看模式
          <Descriptions column={2} bordered>
            <Descriptions.Item label="用户ID">
              {accountInfo?.user_id || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="用户名">
              {accountInfo?.username || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="邮箱">
              <Space>
                <MailOutlined />
                {accountInfo?.email || '-'}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="手机号">
              <Space>
                <PhoneOutlined />
                {accountInfo?.phone || '-'}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="真实姓名">
              <Space>
                <UserOutlined />
                {accountInfo?.real_name || '-'}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="身份证号">
              {accountInfo?.id_card
                ? accountInfo.id_card.replace(/(.{6})(.*)(.{4})/, '$1****$3')
                : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="公司">
              <Space>
                <BankOutlined />
                {accountInfo?.company || '-'}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="职位">
              {accountInfo?.position || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="地址" span={2}>
              <Space>
                <EnvironmentOutlined />
                {accountInfo?.address || '-'}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="认证状态">
              {accountInfo?.verified ? (
                <Tag color="success">已认证</Tag>
              ) : (
                <Tag color="warning">未认证</Tag>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="注册时间">
              {accountInfo?.created_at || '-'}
            </Descriptions.Item>
          </Descriptions>
        ) : (
          // 编辑模式
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSave}
          >
            <Divider orientation="left">基本信息</Divider>

            <Form.Item
              label="邮箱"
              name="email"
              rules={[
                { required: true, message: '请输入邮箱' },
                { type: 'email', message: '邮箱格式不正确' },
              ]}
            >
              <Input prefix={<MailOutlined />} placeholder="请输入邮箱" />
            </Form.Item>

            <Form.Item
              label="手机号"
              name="phone"
              rules={[
                { required: true, message: '请输入手机号' },
                {
                  pattern: /^1[3-9]\d{9}$/,
                  message: '手机号格式不正确',
                },
              ]}
            >
              <Input prefix={<PhoneOutlined />} placeholder="请输入手机号" />
            </Form.Item>

            <Form.Item
              label="公司"
              name="company"
            >
              <Input prefix={<BankOutlined />} placeholder="请输入公司名称" />
            </Form.Item>

            <Form.Item
              label="职位"
              name="position"
            >
              <Input placeholder="请输入职位" />
            </Form.Item>

            <Form.Item
              label="地址"
              name="address"
            >
              <Input.TextArea
                placeholder="请输入地址"
                rows={3}
              />
            </Form.Item>

            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" loading={loading}>
                  保存
                </Button>
                <Button onClick={handleCancel}>
                  取消
                </Button>
              </Space>
            </Form.Item>
          </Form>
        )}
      </Card>
    </div>
  )
}

export default AccountSettings
