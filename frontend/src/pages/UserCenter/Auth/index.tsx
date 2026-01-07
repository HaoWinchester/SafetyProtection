/**
 * 授权管理页面
 * Authorization Management Page
 */

import React, { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Button,
  message,
  Modal,
  Form,
  Input,
  Select,
  Space,
  Tag,
  Popconfirm,
} from 'antd'
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  ApiOutlined,
} from '@ant-design/icons'
import { userService } from '@/services/userService'

const Auth: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [authList, setAuthList] = useState<any[]>([])
  const [modalVisible, setModalVisible] = useState(false)
  const [form] = Form.useForm()

  // 加载授权列表
  const loadAuthList = async () => {
    try {
      setLoading(true)
      const response = await userService.getAuthList()
      setAuthList(response.items || [])
    } catch (error: any) {
      // 如果是静默错误（请求被取消），不显示错误消息
      if (!error?.silent && !error?.isCanceled) {
        message.error('加载授权列表失败')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAuthList()
  }, [])

  // 创建授权
  const handleCreate = async (values: any) => {
    try {
      await userService.createAuth(values)
      message.success('授权应用创建成功')
      setModalVisible(false)
      form.resetFields()
      await loadAuthList()
    } catch (error: any) {
      // 如果是取消的请求(重复请求被阻止),不显示错误消息
      if (!error?.silent && !error?.isCanceled) {
        message.error('创建授权应用失败')
      } else {
        console.log('创建授权应用请求被取消(重复请求或页面卸载)')
      }
    }
  }

  // 删除授权
  const handleDelete = async (authId: string) => {
    try {
      await userService.deleteAuth(authId)
      message.success('授权应用删除成功')
      await loadAuthList()
    } catch (error: any) {
      // 如果是取消的请求(重复请求被阻止),不显示错误消息
      if (!error?.silent && !error?.isCanceled) {
        message.error('删除授权应用失败')
      } else {
        console.log('删除授权应用请求被取消(重复请求或页面卸载)')
      }
    }
  }

  const columns = [
    {
      title: '应用名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'App ID',
      dataIndex: 'app_id',
      key: 'app_id',
      render: (text: string) => <code>{text}</code>,
    },
    {
      title: '权限',
      dataIndex: 'permissions',
      key: 'permissions',
      render: (permissions: string[]) => (
        <>
          {permissions.map((perm) => (
            <Tag key={perm} color="blue">{perm}</Tag>
          ))}
        </>
      ),
    },
    {
      title: '回调地址',
      dataIndex: 'callback_url',
      key: 'callback_url',
      render: (url: string) => url || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'success' : 'default'}>
          {status === 'active' ? '激活' : '停用'}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Popconfirm
            title="确定要删除此授权吗?"
            onConfirm={() => handleDelete(record.auth_id)}
            okText="确定"
            cancelText="取消"
          >
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Card
        title="授权管理"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setModalVisible(true)}
          >
            新增授权
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={authList}
          rowKey="auth_id"
          loading={loading}
          pagination={{
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
        />
      </Card>

      <Modal
        title="新增授权应用"
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false)
          form.resetFields()
        }}
        onOk={() => form.submit()}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreate}
        >
          <Form.Item
            label="应用名称"
            name="name"
            rules={[{ required: true, message: '请输入应用名称' }]}
          >
            <Input placeholder="请输入应用名称" />
          </Form.Item>

          <Form.Item
            label="App ID"
            name="app_id"
            rules={[{ required: true, message: '请输入App ID' }]}
          >
            <Input placeholder="请输入App ID" />
          </Form.Item>

          <Form.Item
            label="权限"
            name="permissions"
            rules={[{ required: true, message: '请选择权限' }]}
          >
            <Select
              mode="tags"
              placeholder="请选择权限"
              options={[
                { label: '读取', value: 'read' },
                { label: '写入', value: 'write' },
                { label: '删除', value: 'delete' },
                { label: '管理', value: 'admin' },
              ]}
            />
          </Form.Item>

          <Form.Item
            label="回调地址"
            name="callback_url"
          >
            <Input placeholder="请输入回调地址(选填)" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Auth
