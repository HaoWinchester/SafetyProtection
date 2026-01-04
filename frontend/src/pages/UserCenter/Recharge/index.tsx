/**
 * 充值中心页面
 * Recharge Center Page
 */

import React, { useState } from 'react'
import {
  Card,
  Row,
  Col,
  Button,
  Form,
  InputNumber,
  Select,
  Radio,
  Space,
  message,
  Alert,
  Tag,
  Statistic,
  Divider,
  Typography,
} from 'antd'
import {
  WalletOutlined,
  AlipayOutlined,
  WechatOutlined,
  BankOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons'

const { Title, Text } = Typography
const { Option } = Select

const Recharge: React.FC = () => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<string>('alipay')

  const presetAmounts = [
    { value: 50, bonus: 0 },
    { value: 100, bonus: 5 },
    { value: 200, bonus: 15 },
    { value: 500, bonus: 50 },
    { value: 1000, bonus: 150 },
    { value: 2000, bonus: 400 },
  ]

  const handleRecharge = async (values: any) => {
    setLoading(true)
    // 模拟充值处理
    await new Promise(resolve => setTimeout(resolve, 2000))
    message.success('充值订单已创建,请完成支付!')
    setLoading(false)
  }

  return (
    <div>
      <Title level={2}>
        <WalletOutlined /> 充值中心
      </Title>
      <Text type="secondary">快速充值,享受更多服务</Text>

      <Row gutter={24} style={{ marginTop: 24 }}>
        <Col span={16}>
          <Card title="充值金额">
            <Form
              form={form}
              layout="vertical"
              onFinish={handleRecharge}
            >
              <Form.Item label="选择充值金额">
                <Row gutter={[16, 16]}>
                  {presetAmounts.map((item) => (
                    <Col span={8} key={item.value}>
                      <Card
                        hoverable
                        onClick={() => {
                          setSelectedAmount(item.value)
                          form.setFieldsValue({ amount: item.value })
                        }}
                        style={{
                          border: selectedAmount === item.value ? '2px solid #1890ff' : '1px solid #d9d9d9',
                          position: 'relative',
                        }}
                      >
                        <div style={{ textAlign: 'center' }}>
                          <Title level={3} style={{ color: '#1890ff', margin: 0 }}>
                            ¥{item.value}
                          </Title>
                          {item.bonus > 0 && (
                            <Tag color="red" style={{ marginTop: 8 }}>
                              赠送 ¥{item.bonus}
                            </Tag>
                          )}
                        </div>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </Form.Item>

              <Form.Item
                label="或输入自定义金额"
                name="amount"
                rules={[
                  { required: true, message: '请输入充值金额' },
                  { type: 'number', min: 1, message: '最低充值金额为¥1' },
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="请输入充值金额"
                  min={1}
                  precision={2}
                  prefix="¥"
                  size="large"
                  onChange={(value) => setSelectedAmount(value)}
                />
              </Form.Item>

              <Divider />

              <Form.Item
                label="支付方式"
                name="paymentMethod"
                initialValue="alipay"
                rules={[{ required: true, message: '请选择支付方式' }]}
              >
                <Radio.Group
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Radio value="alipay" style={{ display: 'flex', alignItems: 'center', padding: '12px', border: paymentMethod === 'alipay' ? '2px solid #1890ff' : '1px solid #d9d9d9', borderRadius: 8 }}>
                      <AlipayOutlined style={{ fontSize: 24, color: '#1677FF', marginRight: 12 }} />
                      <div>
                        <div style={{ fontWeight: 'bold' }}>支付宝</div>
                        <div style={{ fontSize: 12, color: '#999' }}>推荐使用</div>
                      </div>
                    </Radio>
                    <Radio value="wechat" style={{ display: 'flex', alignItems: 'center', padding: '12px', border: paymentMethod === 'wechat' ? '2px solid #1890ff' : '1px solid #d9d9d9', borderRadius: 8 }}>
                      <WechatOutlined style={{ fontSize: 24, color: '#07C160', marginRight: 12 }} />
                      <div>
                        <div style={{ fontWeight: 'bold' }}>微信支付</div>
                        <div style={{ fontSize: 12, color: '#999' }}>扫码支付</div>
                      </div>
                    </Radio>
                    <Radio value="bank" style={{ display: 'flex', alignItems: 'center', padding: '12px', border: paymentMethod === 'bank' ? '2px solid #1890ff' : '1px solid #d9d9d9', borderRadius: 8 }}>
                      <BankOutlined style={{ fontSize: 24, color: '#FF6B00', marginRight: 12 }} />
                      <div>
                        <div style={{ fontWeight: 'bold' }}>银行转账</div>
                        <div style={{ fontSize: 12, color: '#999' }}>对公转账</div>
                      </div>
                    </Radio>
                  </Space>
                </Radio.Group>
              </Form.Item>

              <Alert
                message="充值说明"
                description={
                  <ul style={{ margin: 0, paddingLeft: 20 }}>
                    <li>充值金额实时到账</li>
                    <li>单次最低充值¥1,单日最高充值¥50,000</li>
                    <li>充值过程中遇到问题,请联系客服</li>
                    <li>充值即代表您同意《用户协议》和《隐私政策》</li>
                  </ul>
                }
                type="info"
                showIcon
                style={{ marginBottom: 24 }}
              />

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  size="large"
                  block
                  icon={<WalletOutlined />}
                >
                  立即充值
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        <Col span={8}>
          <Card title="账户余额">
            <Statistic
              title="当前余额"
              value={95.1234}
              precision={4}
              prefix="¥"
              valueStyle={{ color: '#1890ff', fontSize: 32 }}
            />
            <Button type="link" style={{ marginTop: 8 }}>
              查看账单明细
            </Button>
          </Card>

          <Card title="充值优惠" style={{ marginTop: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ padding: 12, border: '1px solid #52c41a', borderRadius: 8 }}>
                <Tag color="success">满赠活动</Tag>
                <div style={{ marginTop: 8 }}>
                  充值¥100赠送¥5,充值¥500赠送¥50
                </div>
              </div>
              <div style={{ padding: 12, border: '1px solid #1890ff', borderRadius: 8 }}>
                <Tag color="blue">首充优惠</Tag>
                <div style={{ marginTop: 8 }}>
                  首次充值任意金额,额外赠送¥10
                </div>
              </div>
              <div style={{ padding: 12, border: '1px solid #faad14', borderRadius: 8 }}>
                <Tag color="orange">限时活动</Tag>
                <div style={{ marginTop: 8 }}>
                  本周充值,享1.1倍到账优惠
                </div>
              </div>
            </Space>
          </Card>

          <Card title="常见问题" style={{ marginTop: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text strong>Q: 充值后多久到账?</Text>
                <br />
                <Text type="secondary">A: 通常在1-5分钟内到账,最迟不超过24小时</Text>
              </div>
              <Divider style={{ margin: '12px 0' }} />
              <div>
                <Text strong>Q: 支持哪些支付方式?</Text>
                <br />
                <Text type="secondary">A: 支持支付宝、微信支付、银行转账</Text>
              </div>
              <Divider style={{ margin: '12px 0' }} />
              <div>
                <Text strong>Q: 如何申请发票?</Text>
                <br />
                <Text type="secondary">A: 充值后可在"发票管理"页面申请开具发票</Text>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Recharge
