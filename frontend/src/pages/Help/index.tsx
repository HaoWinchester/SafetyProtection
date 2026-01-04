import React, { useState, useEffect } from 'react'
import { Card, List, Typography, Collapse, message } from 'antd'
import { QuestionCircleOutlined, CustomerServiceOutlined } from '@ant-design/icons'
import { userService } from '@/services/userService'

const { Title, Paragraph, Text } = Typography
const { Panel } = Collapse

const Help: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [faqs, setFaqs] = useState<any[]>([])

  const loadFAQ = async () => {
    try {
      setLoading(true)
      const data = await userService.getFAQ()
      setFaqs(data.faqs || [])
    } catch (error) {
      message.error('加载常见问题失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadFAQ() }, [])

  // Group FAQs by category
  const groupedFAQs = faqs.reduce((acc: any, faq: any) => {
    if (!acc[faq.category]) acc[faq.category] = []
    acc[faq.category].push(faq)
    return acc
  }, {})

  return (
    <div>
      <Card loading={loading}>
        <Title level={2}>
          <QuestionCircleOutlined /> 帮助中心
        </Title>
        <Paragraph>
          欢迎使用帮助中心,这里有常见问题的解答和使用指南
        </Paragraph>

        <Collapse accordion style={{ marginTop: 24 }}>
          {Object.keys(groupedFAQs).map((category) => (
            <Panel header={category} key={category}>
              <List
                dataSource={groupedFAQs[category]}
                renderItem={(item: any) => (
                  <List.Item>
                    <List.Item.Meta
                      title={<Text strong>{item.question}</Text>}
                      description={item.answer}
                    />
                  </List.Item>
                )}
              />
            </Panel>
          ))}
        </Collapse>

        <Card
          type="inner"
          title="联系客服"
          style={{ marginTop: 24 }}
          extra={<CustomerServiceOutlined />}
        >
          <Paragraph>
            如果您没有找到答案,可以通过以下方式联系我们:
          </Paragraph>
          <ul>
            <li>提交工单: 在"工单记录"页面提交您的问题</li>
            <li>技术社群: 加入我们的技术社群获取帮助</li>
            <li>工作时间: 周一至周五 9:00-18:00</li>
          </ul>
        </Card>
      </Card>
    </div>
  )
}

export default Help
