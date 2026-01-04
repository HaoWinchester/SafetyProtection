/**
 * User Dashboard Page
 */
import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Progress,
  Button,
  Table,
  Tag,
  message,
  Descriptions,
  Avatar
} from 'antd';
import {
  UserOutlined,
  SafetyOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import { authService, Order, Package, QuotaInfo } from '../../services/auth';
import { useRefreshData } from '../../hooks/useRefreshData';

import './UserDashboard.css';

interface DashboardData {
  quotaInfo: QuotaInfo | null;
  orders: Order[];
  packages: Package[];
}

const UserDashboard: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState(false);
  const [data, setData] = useState<DashboardData>({
    quotaInfo: null,
    orders: [],
    packages: []
  });
  const user = authService.getCurrentUser();

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [quotaInfo, orders, packages] = await Promise.all([
        authService.getQuotaInfo().catch(err => {
          console.warn('获取配额信息失败:', err.message);
          return null;
        }),
        authService.getOrders(1, 10).catch(err => {
          console.warn('获取订单列表失败:', err.message);
          return { orders: [], total: 0 };
        }),
        authService.getPackages().catch(err => {
          console.warn('获取套餐列表失败:', err.message);
          return [];
        })
      ]);

      setData({
        quotaInfo: quotaInfo || { remaining_quota: 0, total_quota: 0, used_quota: 0, quota_percentage: 0 },
        orders: orders?.orders || [],
        packages: packages || []
      });
    } catch (error: any) {
      console.error('加载数据失败:', error);
      // 不显示错误消息,使用默认值
      setData({
        quotaInfo: { remaining_quota: 0, total_quota: 0, used_quota: 0, quota_percentage: 0 },
        orders: [],
        packages: []
      });
    } finally {
      setLoading(false);
    }
  };

  // 使用refresh hook - 路由变化时自动刷新
  useRefreshData(fetchDashboardData, []);

  // Handle order creation
  const handleCreateOrder = async (packageId: string) => {
    try {
      const order = await authService.createOrder(packageId);
      message.success(`订单创建成功! 订单号: ${order.order_id}`);

      // Auto-pay for demo
      if (confirm(`是否立即支付 ¥${order.price}?`)) {
        await handlePayOrder(order.order_id);
      }

      fetchDashboardData();
    } catch (error: any) {
      message.error(error.message || '创建订单失败');
    }
  };

  // Handle order payment
  const handlePayOrder = async (orderId: string) => {
    setPaying(true);
    try {
      const result = await authService.payOrder(orderId);
      message.success(`支付成功! 配额已增加 ${result.quota_added} 次`);
      fetchDashboardData();
    } catch (error: any) {
      message.error(error.message || '支付失败');
    } finally {
      setPaying(false);
    }
  };

  // Order table columns
  const orderColumns: ColumnsType<Order> = [
    {
      title: '订单号',
      dataIndex: 'order_id',
      key: 'order_id',
      ellipsis: true,
    },
    {
      title: '套餐名称',
      dataIndex: 'package_name',
      key: 'package_name',
    },
    {
      title: '配额数量',
      dataIndex: 'quota_amount',
      key: 'quota_amount',
      render: (value) => `${value} 次`,
    },
    {
      title: '价格',
      dataIndex: 'price',
      key: 'price',
      render: (value) => `¥${value}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusMap: Record<string, { text: string; color: string }> = {
          pending: { text: '待支付', color: 'orange' },
          paid: { text: '已支付', color: 'green' },
          cancelled: { text: '已取消', color: 'red' },
          refunded: { text: '已退款', color: 'default' },
        };
        const { text, color } = statusMap[status] || { text: status, color: 'default' };
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (value) => new Date(value).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        record.status === 'pending' ? (
          <Button
            type="primary"
            size="small"
            onClick={() => handlePayOrder(record.order_id)}
            loading={paying}
          >
            支付
          </Button>
        ) : null
      ),
    },
  ];

  return (
    <div className="user-dashboard">
      <div className="dashboard-header">
        <Row gutter={[16, 16]} align="middle">
          <Col>
            <Avatar size={64} icon={<UserOutlined />} />
          </Col>
          <Col flex="1">
            <h2>{user?.full_name || user?.username}</h2>
            <p>{user?.email}</p>
          </Col>
          <Col>
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchDashboardData}
              loading={loading}
            >
              刷新
            </Button>
          </Col>
        </Row>
      </div>

      <Row gutter={[16, 16]}>
        {/* Quota Statistics */}
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="剩余配额"
              value={data.quotaInfo?.remaining_quota || 0}
              suffix="次"
              prefix={<SafetyOutlined />}
              valueStyle={{ color: data.quotaInfo && data.quotaInfo.remaining_quota < 100 ? '#cf1322' : '#3f8600' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="总配额"
              value={data.quotaInfo?.total_quota || 0}
              suffix="次"
              prefix={<ShoppingCartOutlined />}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="已使用"
              value={data.quotaInfo?.used_quota || 0}
              suffix="次"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="使用率"
              value={data.quotaInfo?.quota_percentage || 0}
              suffix="%"
              valueStyle={{
                color: data.quotaInfo && data.quotaInfo.quota_percentage > 80 ? '#cf1322' : '#3f8600'
              }}
            />
          </Card>
        </Col>
      </Row>

      {/* Quota Progress */}
      <Card title="配额使用情况" style={{ marginTop: 16 }}>
        <Progress
          percent={data.quotaInfo?.quota_percentage || 0}
          status={data.quotaInfo && data.quotaInfo.quota_percentage > 80 ? 'exception' : 'normal'}
          strokeColor={{
            '0%': '#108ee9',
            '100%': '#87d068',
          }}
        />
      </Card>

      {/* Package Purchase */}
      <Card
        title="购买配额套餐"
        extra={
          <Button type="primary" icon={<DollarOutlined />} onClick={() => setOrderModalVisible(true)}>
            购买套餐
          </Button>
        }
        style={{ marginTop: 16 }}
      >
        <Row gutter={[16, 16]}>
          {data.packages.map((pkg) => (
            <Col xs={24} sm={12} md={8} key={pkg.package_id}>
              <Card
                hoverable
                className="package-card"
                actions={[
                  <Button
                    type="primary"
                    onClick={() => handleCreateOrder(pkg.package_id)}
                  >
                    购买 ¥{pkg.price}
                  </Button>
                ]}
              >
                <Card.Meta
                  title={
                    <div>
                      <div>{pkg.package_name}</div>
                      <div className="package-price">¥{pkg.price}</div>
                    </div>
                  }
                  description={
                    <div>
                      <p className="package-quota">{pkg.quota_amount} 次检测配额</p>
                      {pkg.discount > 0 && (
                        <Tag color="red">优惠 {pkg.discount}%</Tag>
                      )}
                      {pkg.features && pkg.features.length > 0 && (
                        <ul className="package-features">
                          {pkg.features.map((feature, idx) => (
                            <li key={idx}>{feature}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  }
                />
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      {/* Order History */}
      <Card title="订单历史" style={{ marginTop: 16 }}>
        <Table
          columns={orderColumns}
          dataSource={data.orders}
          rowKey="order_id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
      </Card>

      {/* User Profile */}
      <Card title="账户信息" style={{ marginTop: 16 }}>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="用户ID">{user?.user_id}</Descriptions.Item>
          <Descriptions.Item label="用户名">{user?.username}</Descriptions.Item>
          <Descriptions.Item label="邮箱">{user?.email}</Descriptions.Item>
          <Descriptions.Item label="姓名">{user?.full_name || '-'}</Descriptions.Item>
          <Descriptions.Item label="公司">{user?.company || '-'}</Descriptions.Item>
          <Descriptions.Item label="电话">{user?.phone || '-'}</Descriptions.Item>
          <Descriptions.Item label="账户类型">
            <Tag color={user?.role === 'admin' ? 'red' : 'blue'}>
              {user?.role === 'admin' ? '管理员' : '普通用户'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="账户状态">
            <Tag color={user?.is_active ? 'green' : 'red'}>
              {user?.is_active ? '正常' : '禁用'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="注册时间">
            {user?.created_at ? new Date(user.created_at).toLocaleString('zh-CN') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="最后登录">
            {user?.last_login_at ? new Date(user.last_login_at).toLocaleString('zh-CN') : '-'}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
};

export default UserDashboard;
