/**
 * 管理员实名认证审核组件
 */
import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, Modal, Form, Input, message, Space, Radio } from 'antd';
import { ReloadOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import api from '@/services/api';

interface Verification {
  id: string;
  user_id: string;
  real_name: string;
  id_card: string;
  company?: string;
  position?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

const VerificationManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [selectedVerification, setSelectedVerification] = useState<Verification | null>(null);
  const [reviewForm] = Form.useForm();

  // 获取认证列表
  const fetchVerifications = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/verifications');
      setVerifications(response.data.items || []);
    } catch (error: any) {
      console.error('获取认证列表失败:', error);
      if (error.response?.status !== 401) {
        message.error('获取认证列表失败');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVerifications();
  }, []);

  // 打开审核弹窗
  const openReviewModal = (verification: Verification) => {
    setSelectedVerification(verification);
    reviewForm.setFieldsValue({
      approved: undefined,
      reason: '',
    });
    setReviewModalVisible(true);
  };

  // 提交审核
  const handleReview = async (values: any) => {
    if (!selectedVerification) return;

    try {
      await api.post(`/admin/verifications/${selectedVerification.id}/review`, {
        approved: values.approved,
        reason: values.reason,
      });

      message.success('审核完成');
      setReviewModalVisible(false);
      reviewForm.resetFields();
      fetchVerifications();
    } catch (error: any) {
      console.error('审核失败:', error);
      message.error(error.response?.data?.detail || '审核失败');
    }
  };

  // 表格列定义
  const columns: ColumnsType<Verification> = [
    {
      title: '认证ID',
      dataIndex: 'id',
      key: 'id',
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
      title: '真实姓名',
      dataIndex: 'real_name',
      key: 'real_name',
      width: 150,
    },
    {
      title: '身份证号',
      dataIndex: 'id_card',
      key: 'id_card',
      width: 200,
      render: (idCard: string) => {
        // 隐藏中间部分
        if (idCard.length === 18) {
          return `${idCard.substring(0, 6)}********${idCard.substring(14)}`;
        }
        return idCard;
      },
    },
    {
      title: '公司',
      dataIndex: 'company',
      key: 'company',
      width: 150,
      render: (value) => value || '-',
    },
    {
      title: '职位',
      dataIndex: 'position',
      key: 'position',
      width: 150,
      render: (value) => value || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const statusMap: Record<string, { text: string; color: string }> = {
          'pending': { text: '待审核', color: 'orange' },
          'approved': { text: '已通过', color: 'green' },
          'rejected': { text: '已拒绝', color: 'red' },
        };
        const info = statusMap[status] || { text: status, color: 'default' };
        return <Tag color={info.color}>{info.text}</Tag>;
      },
    },
    {
      title: '提交时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (value: string) => new Date(value).toLocaleString('zh-CN'),
    },
    {
      title: '更新时间',
      dataIndex: 'updated_at',
      key: 'updated_at',
      width: 180,
      render: (value: string) => new Date(value).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right' as const,
      render: (_, record) => (
        <Space>
          {record.status === 'pending' && (
            <Button
              type="primary"
              size="small"
              icon={<CheckOutlined />}
              onClick={() => openReviewModal(record)}
            >
              审核
            </Button>
          )}
          {record.status !== 'pending' && (
            <Tag color="default">已审核</Tag>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="实名认证审核"
        extra={
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchVerifications}
            loading={loading}
          >
            刷新
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={verifications}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条认证`,
          }}
          scroll={{ x: 1600 }}
        />
      </Card>

      {/* 审核弹窗 */}
      <Modal
        title="审核实名认证"
        open={reviewModalVisible}
        onCancel={() => {
          setReviewModalVisible(false);
          reviewForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        {selectedVerification && (
          <div>
            <Card size="small" style={{ marginBottom: 16 }}>
              <p><strong>认证ID:</strong> {selectedVerification.id}</p>
              <p><strong>用户ID:</strong> {selectedVerification.user_id}</p>
              <p><strong>真实姓名:</strong> {selectedVerification.real_name}</p>
              <p><strong>身份证号:</strong> {selectedVerification.id_card}</p>
              <p><strong>公司:</strong> {selectedVerification.company || '-'}</p>
              <p><strong>职位:</strong> {selectedVerification.position || '-'}</p>
              <p><strong>提交时间:</strong> {new Date(selectedVerification.created_at).toLocaleString('zh-CN')}</p>
            </Card>

            <Form form={reviewForm} layout="vertical" onFinish={handleReview}>
              <Form.Item
                name="approved"
                label="审核结果"
                rules={[{ required: true, message: '请选择审核结果' }]}
              >
                <Radio.Group>
                  <Radio value={true}>
                    <Space>
                      <CheckOutlined style={{ color: '#52c41a' }} />
                      通过
                    </Space>
                  </Radio>
                  <Radio value={false}>
                    <Space>
                      <CloseOutlined style={{ color: '#ff4d4f' }} />
                      拒绝
                    </Space>
                  </Radio>
                </Radio.Group>
              </Form.Item>

              <Form.Item
                name="reason"
                label="审核意见"
                rules={[{ required: true, message: '请输入审核意见' }]}
              >
                <Input.TextArea
                  rows={4}
                  placeholder="请输入审核意见"
                  maxLength={500}
                  showCount
                />
              </Form.Item>

              <Form.Item>
                <Space>
                  <Button type="primary" htmlType="submit">
                    提交审核
                  </Button>
                  <Button onClick={() => {
                    setReviewModalVisible(false);
                    reviewForm.resetFields();
                  }}>
                    取消
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default VerificationManagement;
