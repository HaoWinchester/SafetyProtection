/**
 * Admin Dashboard Page
 */
import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Button,
  Input,
  Modal,
  Form,
  message,
  Tag,
  Space,
  Popconfirm
} from 'antd';
import {
  UserOutlined,
  TeamOutlined,
  DollarOutlined,
  SafetyOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { authAxios } from '../../services/auth';
import { useRefreshData } from '../../hooks/useRefreshData';

import './AdminDashboard.css';

interface UserInfo {
  user_id: string;
  email: string;
  username: string;
  full_name?: string;
  role: string;
  is_active: boolean;
  remaining_quota: number;
  total_quota: number;
  created_at: string;
}

interface SystemStats {
  total_users: number;
  active_users: number;
  total_orders: number;
  total_revenue: number;
}

const AdminDashboard: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [stats, setStats] = useState<SystemStats>({
    total_users: 0,
    active_users: 0,
    total_orders: 0,
    total_revenue: 0
  });
  const [quotaModalVisible, setQuotaModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserInfo | null>(null);
  const [quotaForm] = Form.useForm();

  // Fetch users
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await authAxios.get('/auth/admin/users');
      setUsers(response.data);

      // Calculate stats
      const activeUsers = response.data.filter((u: UserInfo) => u.is_active).length;
      setStats({
        total_users: response.data.length,
        active_users: activeUsers,
        total_orders: 0,
        total_revenue: 0
      });
    } catch (error: any) {
      console.error('加载用户列表失败:', error);
      // 如果不是401错误,显示错误消息
      if (error.response?.status !== 401) {
        message.error(error.response?.data?.detail || '加载用户列表失败');
      }
      // 如果是401错误,静默处理(会被路由守卫拦截)
    } finally {
      setLoading(false);
    }
  };

  // 使用refresh hook - 路由变化时自动刷新
  useRefreshData(fetchUsers, []);

  // Handle quota update
  const handleUpdateQuota = async (values: any) => {
    try {
      await authAxios.patch(`/auth/admin/users/${selectedUser?.user_id}/quota`, values);
      message.success('配额更新成功');
      setQuotaModalVisible(false);
      quotaForm.resetFields();
      fetchUsers();
    } catch (error: any) {
      message.error(error.response?.data?.detail || '更新配额失败');
    }
  };

  // Open quota modal
  const openQuotaModal = (user: UserInfo) => {
    setSelectedUser(user);
    setQuotaModalVisible(true);
  };

  // User table columns
  const userColumns: ColumnsType<UserInfo> = [
    {
      title: '用户ID',
      dataIndex: 'user_id',
      key: 'user_id',
      ellipsis: true,
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role) => (
        <Tag color={role === 'admin' ? 'red' : 'blue'}>
          {role === 'admin' ? '管理员' : '普通用户'}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? '正常' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '剩余配额',
      dataIndex: 'remaining_quota',
      key: 'remaining_quota',
      render: (value) => `${value} 次`,
    },
    {
      title: '总配额',
      dataIndex: 'total_quota',
      key: 'total_quota',
      render: (value) => `${value} 次`,
    },
    {
      title: '注册时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (value) => new Date(value).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => openQuotaModal(record)}
          >
            调整配额
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>管理员控制台</h1>
        <p>系统管理 & 用户管理</p>
      </div>

      {/* System Statistics */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="总用户数"
              value={stats.total_users}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="活跃用户"
              value={stats.active_users}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="订单总数"
              value={stats.total_orders}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="总收入"
              value={stats.total_revenue}
              prefix="¥"
              precision={2}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
      </Row>

      {/* User Management */}
      <Card
        title="用户管理"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={fetchUsers}
            loading={loading}
          >
            刷新
          </Button>
        }
        style={{ marginTop: 16 }}
      >
        <Table
          columns={userColumns}
          dataSource={users}
          rowKey="user_id"
          loading={loading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 个用户`,
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* Quota Update Modal */}
      <Modal
        title="调整用户配额"
        open={quotaModalVisible}
        onCancel={() => {
          setQuotaModalVisible(false);
          quotaForm.resetFields();
        }}
        footer={null}
      >
        <Form
          form={quotaForm}
          layout="vertical"
          onFinish={handleUpdateQuota}
        >
          <Form.Item label="用户">
            <Input value={selectedUser?.username} disabled />
          </Form.Item>

          <Form.Item label="当前配额">
            <Input value={`${selectedUser?.remaining_quota} 次`} disabled />
          </Form.Item>

          <Form.Item
            name="amount"
            label="配额调整量"
            rules={[
              { required: true, message: '请输入调整量' },
              { type: 'number', min: -10000, max: 10000, message: '调整量范围 -10000 到 10000' }
            ]}
          >
            <Input
              type="number"
              placeholder="正数增加,负数减少"
              suffix="次"
            />
          </Form.Item>

          <Form.Item
            name="reason"
            label="调整原因"
            rules={[{ required: true, message: '请输入调整原因' }]}
          >
            <Input.TextArea
              rows={3}
              placeholder="请说明调整原因"
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              确认调整
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminDashboard;
