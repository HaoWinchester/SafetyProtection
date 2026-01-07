/**
 * 管理员工单管理组件
 */
import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, Modal, Form, Input, message, Space } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import api from '@/services/api';

interface Ticket {
  ticket_id: string;
  user_id: string;
  title: string;
  category: string;
  priority: string;
  status: string;
  description: string;
  created_at: string;
}

const TicketManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  // 获取工单列表
  const fetchTickets = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/tickets');
      setTickets(response.data.items || []);
    } catch (error: any) {
      console.error('获取工单列表失败:', error);
      if (error.response?.status !== 401) {
        message.error('获取工单列表失败');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  // 查看工单详情
  const viewDetail = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setDetailModalVisible(true);
  };

  // 表格列定义
  const columns: ColumnsType<Ticket> = [
    {
      title: '工单ID',
      dataIndex: 'ticket_id',
      key: 'ticket_id',
      width: 200,
      ellipsis: true,
    },
    {
      title: '用户ID',
      dataIndex: 'user_id',
      key: 'user_id',
      width: 200,
      ellipsis: true,
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (category: string) => {
        const categoryMap: Record<string, { text: string; color: string }> = {
          'technical': { text: '技术问题', color: 'blue' },
          'billing': { text: '账单问题', color: 'green' },
          'feature': { text: '功能建议', color: 'orange' },
          'other': { text: '其他', color: 'default' },
        };
        const info = categoryMap[category] || { text: category, color: 'default' };
        return <Tag color={info.color}>{info.text}</Tag>;
      },
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (priority: string) => {
        const color = priority === 'high' ? 'red' : priority === 'medium' ? 'orange' : 'green';
        const text = priority === 'high' ? '高' : priority === 'medium' ? '中' : '低';
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const color = status === 'open' ? 'blue' : status === 'processing' ? 'orange' : 'green';
        const text = status === 'open' ? '待处理' : status === 'processing' ? '处理中' : '已关闭';
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (value: string) => new Date(value).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right' as const,
      render: (_, record) => (
        <Button type="link" onClick={() => viewDetail(record)}>
          查看详情
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="工单管理"
        extra={
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchTickets}
            loading={loading}
          >
            刷新
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={tickets}
          rowKey="ticket_id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条工单`,
          }}
          scroll={{ x: 1400 }}
        />
      </Card>

      {/* 工单详情弹窗 */}
      <Modal
        title="工单详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>,
        ]}
        width={700}
      >
        {selectedTicket && (
          <Form layout="vertical">
            <Form.Item label="工单ID">
              <Input value={selectedTicket.ticket_id} disabled />
            </Form.Item>
            <Form.Item label="用户ID">
              <Input value={selectedTicket.user_id} disabled />
            </Form.Item>
            <Form.Item label="标题">
              <Input value={selectedTicket.title} disabled />
            </Form.Item>
            <Form.Item label="分类">
              <Input value={selectedTicket.category} disabled />
            </Form.Item>
            <Form.Item label="优先级">
              <Input value={selectedTicket.priority} disabled />
            </Form.Item>
            <Form.Item label="状态">
              <Input value={selectedTicket.status} disabled />
            </Form.Item>
            <Form.Item label="描述">
              <Input.TextArea
                value={selectedTicket.description}
                disabled
                rows={6}
              />
            </Form.Item>
            <Form.Item label="创建时间">
              <Input value={new Date(selectedTicket.created_at).toLocaleString('zh-CN')} disabled />
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  );
};

export default TicketManagement;
