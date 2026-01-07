import React, { useState, useEffect } from 'react'
import { Card, List, Tag, message } from 'antd'
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'
import { userService } from '@/services/userService'

const Benefits: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [benefits, setBenefits] = useState<any>(null)

  const loadBenefits = async () => {
    try {
      setLoading(true)
      const data = await userService.getBenefits()
      setBenefits(data)
    } catch (error: any) {
      // 如果是取消的请求(重复请求被阻止),不显示错误消息
      if (!error?.silent && !error?.isCanceled) {
        message.error('加载用户权益失败')
      } else {
        console.log('用户权益请求被取消(重复请求或页面卸载)')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadBenefits() }, [])

  return (
    <div>
      <Card title="用户权益" loading={loading}>
        <Tag color="blue" style={{ marginBottom: 16 }}>当前套餐: {benefits?.package_name || '免费版'}</Tag>
        <List
          itemLayout="horizontal"
          dataSource={benefits?.benefits || []}
          renderItem={(item: any) => (
            <List.Item>
              <List.Item.Meta
                avatar={
                  item.included ? (
                    <CheckCircleOutlined style={{ fontSize: 24, color: '#52c41a' }} />
                  ) : (
                    <CloseCircleOutlined style={{ fontSize: 24, color: '#ff4d4f' }} />
                  )
                }
                title={item.name}
                description={item.description}
              />
              <Tag color={item.included ? 'success' : 'default'}>
                {item.included ? '已包含' : '未包含'}
              </Tag>
            </List.Item>
          )}
        />
      </Card>
    </div>
  )
}

export default Benefits
