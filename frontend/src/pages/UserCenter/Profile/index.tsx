/**
 * 个人信息页面
 * User Profile Page
 */

import React, { useState, useEffect } from 'react'
import {
  Card,
  Form,
  Input,
  Button,
  message,
  Typography,
  Row,
  Col,
  Avatar,
  Space,
  Upload,
  Modal,
} from 'antd'
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  EditOutlined,
  LockOutlined,
} from '@ant-design/icons'
import { userService, type UserInfo } from '@/services/userService'

const { Title, Text, Paragraph } = Typography

/**
 * Profile组件
 */
const Profile: React.FC = () => {
  const [form] = Form.useForm()
  const [passwordForm] = Form.useForm()
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [passwordModalVisible, setPasswordModalVisible] = useState(false)
  const [loading, setLoading] = useState(false)

  // 用户信息状态
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)

  /**
   * 加载用户信息
   */
  const loadUserInfo = async () => {
    try {
      const data = await userService.getUserInfo()
      setUserInfo(data)
    } catch (error) {
      console.error('加载用户信息失败:', error)
      message.error('加载用户信息失败')
    }
  }

  /**
   * 组件挂载时加载用户信息
   */
  useEffect(() => {
    loadUserInfo()
  }, [])

  /**
   * 更新个人信息
   */
  const handleUpdateProfile = async (values: any) => {
    try {
      setLoading(true)
      await userService.updateUserInfo(values)
      message.success('个人信息更新成功')
      setEditModalVisible(false)
      // 重新加载用户信息
      await loadUserInfo()
    } catch (error) {
      console.error('更新个人信息失败:', error)
      message.error('更新个人信息失败')
    } finally {
      setLoading(false)
    }
  }

  /**
   * 修改密码
   */
  const handleChangePassword = async (values: any) => {
    try {
      setLoading(true)
      await userService.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      })
      message.success('密码修改成功,请重新登录')
      setPasswordModalVisible(false)
      passwordForm.resetFields()
    } catch (error) {
      console.error('修改密码失败:', error)
      message.error('修改密码失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Title level={2}>个人信息</Title>
      <Paragraph type="secondary">
        管理您的个人信息和账户安全
      </Paragraph>

      {!userInfo ? (
        <Card loading={true} />
      ) : (
        <Row gutter={[16, 16]}>
          {/* 基本信息 */}
          <Col span={24}>
            <Card
              title="基本信息"
              extra={
                <Button
                  type="link"
                  icon={<EditOutlined />}
                  onClick={() => {
                    form.setFieldsValue({
                      username: userInfo.username,
                      email: userInfo.email,
                      phone: userInfo.phone,
                      company: userInfo.company || '',
                      position: userInfo.position || '',
                      address: userInfo.address || '',
                    })
                    setEditModalVisible(true)
                  }}
                >
                  编辑
                </Button>
              }
            >
              <Row gutter={[24, 24]}>
                <Col span={4}>
                  <Avatar size={100} icon={<UserOutlined />} src={userInfo.avatar} />
                </Col>
                <Col span={20}>
                  <Row gutter={[16, 16]}>
                    <Col span={8}>
                      <Text type="secondary">用户名</Text>
                      <br />
                      <Text strong style={{ fontSize: 16 }}>
                        {userInfo.username}
                      </Text>
                    </Col>
                    <Col span={8}>
                      <Text type="secondary">邮箱</Text>
                      <br />
                      <Text strong style={{ fontSize: 16 }}>
                        {userInfo.email}
                      </Text>
                    </Col>
                    <Col span={8}>
                      <Text type="secondary">手机号</Text>
                      <br />
                      <Text strong style={{ fontSize: 16 }}>
                        {userInfo.phone}
                      </Text>
                    </Col>
                    <Col span={8}>
                      <Text type="secondary">真实姓名</Text>
                      <br />
                      <Text strong style={{ fontSize: 16 }}>
                        {userInfo.realName || '未填写'}
                      </Text>
                    </Col>
                    <Col span={8}>
                      <Text type="secondary">身份证号</Text>
                      <br />
                      <Text strong style={{ fontSize: 16 }}>
                        {userInfo.idCard || '未填写'}
                      </Text>
                    </Col>
                    <Col span={8}>
                      <Text type="secondary">认证状态</Text>
                      <br />
                      <Text
                        strong
                        style={{
                          fontSize: 16,
                          color: userInfo.verified ? '#52c41a' : '#faad14',
                        }}
                      >
                        {userInfo.verified ? '已认证' : '未认证'}
                      </Text>
                    </Col>
                    {userInfo.company && (
                      <Col span={8}>
                        <Text type="secondary">公司</Text>
                        <br />
                        <Text strong style={{ fontSize: 16 }}>
                          {userInfo.company}
                        </Text>
                      </Col>
                    )}
                    {userInfo.position && (
                      <Col span={8}>
                        <Text type="secondary">职位</Text>
                        <br />
                        <Text strong style={{ fontSize: 16 }}>
                          {userInfo.position}
                        </Text>
                      </Col>
                    )}
                    {userInfo.address && (
                      <Col span={8}>
                        <Text type="secondary">地址</Text>
                        <br />
                        <Text strong style={{ fontSize: 16 }}>
                          {userInfo.address}
                        </Text>
                      </Col>
                    )}
                  </Row>
                </Col>
              </Row>
            </Card>
          </Col>

          {/* 账户安全 */}
          <Col span={24}>
            <Card title="账户安全">
              <Space direction="vertical" style={{ width: '100%' }} size="large">
                <div>
                  <Text strong>登录密码</Text>
                  <br />
                  <Text type="secondary">用于登录系统的密码</Text>
                  <Button
                    type="link"
                    icon={<LockOutlined />}
                    onClick={() => setPasswordModalVisible(true)}
                    style={{ float: 'right' }}
                  >
                    修改密码
                  </Button>
                </div>
                <div>
                  <Text strong>绑定手机</Text>
                  <br />
                  <Text type="secondary">已绑定: {userInfo.phone}</Text>
                  <Button
                    type="link"
                    icon={<PhoneOutlined />}
                    style={{ float: 'right' }}
                  >
                    更换手机
                  </Button>
                </div>
                <div>
                  <Text strong>绑定邮箱</Text>
                  <br />
                  <Text type="secondary">已绑定: {userInfo.email}</Text>
                  <Button
                    type="link"
                    icon={<MailOutlined />}
                    style={{ float: 'right' }}
                  >
                    更换邮箱
                  </Button>
                </div>
              </Space>
            </Card>
          </Col>
        </Row>
      )}

      {/* 编辑个人信息模态框 */}
      <Modal
        title="编辑个人信息"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpdateProfile}
        >
          <Form.Item
            label="用户名"
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input placeholder="请输入用户名" />
          </Form.Item>

          <Form.Item
            label="邮箱"
            name="email"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '邮箱格式不正确' },
            ]}
          >
            <Input placeholder="请输入邮箱" />
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
            <Input placeholder="请输入手机号" />
          </Form.Item>

          <Form.Item label="公司" name="company">
            <Input placeholder="请输入公司名称" />
          </Form.Item>

          <Form.Item label="职位" name="position">
            <Input placeholder="请输入职位" />
          </Form.Item>

          <Form.Item label="地址" name="address">
            <Input placeholder="请输入地址" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              保存
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* 修改密码模态框 */}
      <Modal
        title="修改密码"
        open={passwordModalVisible}
        onCancel={() => setPasswordModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={handleChangePassword}
        >
          <Form.Item
            label="当前密码"
            name="currentPassword"
            rules={[{ required: true, message: '请输入当前密码' }]}
          >
            <Input.Password placeholder="请输入当前密码" />
          </Form.Item>

          <Form.Item
            label="新密码"
            name="newPassword"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码长度至少6位' },
            ]}
          >
            <Input.Password placeholder="请输入新密码" />
          </Form.Item>

          <Form.Item
            label="确认新密码"
            name="confirmPassword"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: '请确认新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve()
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'))
                },
              }),
            ]}
          >
            <Input.Password placeholder="请再次输入新密码" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              确认修改
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Profile
