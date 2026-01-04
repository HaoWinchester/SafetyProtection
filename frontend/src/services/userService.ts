/**
 * 用户中心相关服务
 * User Center Service
 */

import { message } from 'antd'
import api from './api'
import axios from 'axios'

/**
 * 用户信息类型
 */

/**
 * 检查错误是否是取消的请求
 * 如果是取消的请求,不显示错误消息
 */
const shouldSuppressErrorMessage = (error: any): boolean => {
  // 检查是否有静默标记
  if (error?.silent) {
    return true
  }
  // 检查是否有取消标记
  if (error?.isCanceled) {
    return true
  }
  // 检查是否是axios取消的请求
  if (axios.isCancel(error)) {
    return true
  }
  return false
}

/**
 * 显示错误消息(如果不是取消的请求)
 */
const showErrorIfNeeded = (errorMsg: string, error: any) => {
  if (!shouldSuppressErrorMessage(error)) {
    message.error(errorMsg)
  }
}

export interface UserInfo {
  id: string
  username: string
  email: string
  phone: string
  realName?: string
  idCard?: string
  company?: string
  position?: string
  address?: string
  verified: boolean
  avatar?: string
  balance: number
  remainingQuota: number
  totalQuota: number
  createTime: string
}

/**
 * 项目类型
 */
export interface Project {
  id: string
  name: string
  description: string
  apiKey?: string  // 可选,兼容旧版本
  api_key?: string // 后端实际返回的字段名
  status: 'active' | 'inactive'
  createTime?: string // 可选
  create_time?: string // 后端实际返回的字段名
  lastUsed?: string // 可选
  last_used?: string // 后端实际返回的字段名
  callCount?: number // 可选
  call_count?: number // 后端实际返回的字段名
}

/**
 * 账单类型
 */
export interface Bill {
  id: string
  billNo: string
  type: 'recharge' | 'consume' | 'refund'
  amount: number
  status: 'pending' | 'paid' | 'failed' | 'refunded'
  paymentMethod?: string
  createTime: string
  description: string
}

/**
 * 用户中心服务类
 */
class UserService {
  /**
   * 获取用户信息
   */
  async getUserInfo(): Promise<UserInfo> {
    try {
      const response = await api.get('/user/info')
      return response.data
    } catch (error) {
      console.error('获取用户信息失败:', error)
      throw error
    }
  }

  /**
   * 更新用户信息
   */
  async updateUserInfo(data: Partial<UserInfo>): Promise<UserInfo> {
    try {
      const response = await api.put('/user/info', data)
      message.success('个人信息更新成功')
      return response.data
    } catch (error) {
      showErrorIfNeeded('个人信息更新失败', error)
      throw error
    }
  }

  /**
   * 修改密码
   */
  async changePassword(data: {
    currentPassword: string
    newPassword: string
  }): Promise<void> {
    try {
      await api.post('/user/change-password', data)
      message.success('密码修改成功')
    } catch (error) {
      showErrorIfNeeded('密码修改失败', error)
      throw error
    }
  }

  /**
   * 获取项目列表
   */
  async getProjects(): Promise<Project[]> {
    try {
      const response = await api.get('/user/projects')

      // 打印响应数据用于调试
      console.log('getProjects API响应:', response.data)

      // 确保返回的是数组
      if (!Array.isArray(response.data)) {
        console.warn('API返回的数据不是数组:', response.data)
        return []
      }

      return response.data
    } catch (error) {
      console.error('获取项目列表失败:', error)
      throw error
    }
  }

  /**
   * 创建项目
   */
  async createProject(data: {
    name: string
    description: string
  }): Promise<Project> {
    try {
      const response = await api.post('/user/projects', data)
      message.success('项目创建成功')
      return response.data
    } catch (error) {
      showErrorIfNeeded('项目创建失败', error)
      throw error
    }
  }

  /**
   * 更新项目
   */
  async updateProject(id: string, data: {
    name?: string
    description?: string
    status?: 'active' | 'inactive'
  }): Promise<Project> {
    try {
      const response = await api.put(`/user/projects/${id}`, data)
      message.success('项目更新成功')
      return response.data
    } catch (error) {
      showErrorIfNeeded('项目更新失败', error)
      throw error
    }
  }

  /**
   * 删除项目
   */
  async deleteProject(id: string): Promise<void> {
    try {
      await api.delete(`/user/projects/${id}`)
      message.success('项目删除成功')
    } catch (error) {
      showErrorIfNeeded('项目删除失败', error)
      throw error
    }
  }

  /**
   * 重新生成API Key
   */
  async regenerateApiKey(id: string): Promise<{ apiKey: string }> {
    try {
      const response = await api.post(`/user/projects/${id}/regenerate-apikey`)
      message.success('API Key重新生成成功')
      return response.data
    } catch (error) {
      showErrorIfNeeded('API Key重新生成失败', error)
      throw error
    }
  }

  /**
   * 获取账单列表
   */
  async getBills(params?: {
    type?: string
    status?: string
    startDate?: string
    endDate?: string
    page?: number
    pageSize?: number
  }): Promise<{ list: Bill[]; total: number }> {
    try {
      const response = await api.get('/user/bills', { params })
      return response.data
    } catch (error) {
      console.error('获取账单列表失败:', error)
      throw error
    }
  }

  /**
   * 充值
   */
  async recharge(data: {
    amount: number
    paymentMethod: string
  }): Promise<void> {
    try {
      await api.post('/user/recharge', data)
      message.success('充值成功')
    } catch (error) {
      showErrorIfNeeded('充值失败', error)
      throw error
    }
  }

  /**
   * 上传文件
   */
  async uploadFile(file: File): Promise<{ url: string }> {
    try {
      const formData = new FormData()
      formData.append('file', file)
      const response = await api.post('/user/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      return response.data
    } catch (error) {
      showErrorIfNeeded('文件上传失败', error)
      throw error
    }
  }

  // ========== 新增:用户中心完整API ==========

  /**
   * 获取账号信息
   */
  async getAccountInfo(): Promise<any> {
    try {
      const response = await api.get('/user/account')
      return response.data
    } catch (error) {
      console.error('获取账号信息失败:', error)
      throw error
    }
  }

  /**
   * 更新账号信息
   */
  async updateAccountInfo(data: any): Promise<void> {
    try {
      await api.put('/user/account', data)
      message.success('账号信息更新成功')
    } catch (error) {
      showErrorIfNeeded('账号信息更新失败', error)
      throw error
    }
  }

  /**
   * 提交实名认证
   */
  async submitVerification(data: {
    real_name: string
    id_card: string
    company?: string
    position?: string
  }): Promise<any> {
    try {
      const response = await api.post('/user/verify', data)
      message.success('实名认证申请已提交')
      return response.data
    } catch (error) {
      showErrorIfNeeded('提交实名认证失败', error)
      throw error
    }
  }

  /**
   * 获取实名认证状态
   */
  async getVerifyStatus(): Promise<any> {
    try {
      const response = await api.get('/user/verify-status')
      return response.data
    } catch (error) {
      console.error('获取实名认证状态失败:', error)
      throw error
    }
  }

  /**
   * 获取授权列表
   */
  async getAuthList(): Promise<any> {
    try {
      const response = await api.get('/user/auth')
      return response.data
    } catch (error) {
      console.error('获取授权列表失败:', error)
      throw error
    }
  }

  /**
   * 创建授权应用
   */
  async createAuth(data: {
    name: string
    app_id: string
    permissions: string[]
    callback_url?: string
  }): Promise<any> {
    try {
      const response = await api.post('/user/auth', data)
      message.success('授权应用创建成功')
      return response.data
    } catch (error) {
      showErrorIfNeeded('创建授权应用失败', error)
      throw error
    }
  }

  /**
   * 删除授权应用
   */
  async deleteAuth(authId: string): Promise<void> {
    try {
      await api.delete(`/user/auth/${authId}`)
      message.success('授权应用删除成功')
    } catch (error) {
      showErrorIfNeeded('删除授权应用失败', error)
      throw error
    }
  }

  /**
   * 获取套餐总览
   */
  async getSubscriptionOverview(): Promise<any> {
    try {
      const response = await api.get('/user/subscription/overview')
      return response.data
    } catch (error) {
      console.error('获取套餐总览失败:', error)
      throw error
    }
  }

  /**
   * 获取套餐列表
   */
  async getPackages(): Promise<any> {
    try {
      const response = await api.get('/user/packages')
      return response.data
    } catch (error) {
      console.error('获取套餐列表失败:', error)
      throw error
    }
  }

  /**
   * 订阅套餐
   */
  async subscribePackage(packageId: string): Promise<any> {
    try {
      const response = await api.post('/user/packages/subscribe', null, {
        params: { package_id: packageId }
      })
      message.success('套餐订阅成功')
      return response.data
    } catch (error) {
      showErrorIfNeeded('套餐订阅失败', error)
      throw error
    }
  }

  /**
   * 取消订阅
   */
  async cancelSubscription(): Promise<void> {
    try {
      await api.post('/user/packages/cancel')
      message.success('套餐已取消')
    } catch (error) {
      showErrorIfNeeded('取消套餐失败', error)
      throw error
    }
  }

  /**
   * 获取用量统计
   */
  async getUsageStatistics(days: number = 30): Promise<any> {
    try {
      const response = await api.get('/user/usage', {
        params: { days }
      })
      return response.data
    } catch (error) {
      console.error('获取用量统计失败:', error)
      throw error
    }
  }

  /**
   * 获取用户权益
   */
  async getBenefits(): Promise<any> {
    try {
      const response = await api.get('/user/benefits')
      return response.data
    } catch (error) {
      console.error('获取用户权益失败:', error)
      throw error
    }
  }

  /**
   * 获取工单列表
   */
  async getTickets(params?: {
    page?: number
    page_size?: number
    status?: string
  }): Promise<any> {
    try {
      const response = await api.get('/user/tickets', { params })
      return response.data
    } catch (error) {
      console.error('获取工单列表失败:', error)
      throw error
    }
  }

  /**
   * 创建工单
   */
  async createTicket(data: {
    title: string
    category: string
    priority?: string
    description: string
  }): Promise<any> {
    try {
      const response = await api.post('/user/tickets', data)
      message.success('工单创建成功')
      return response.data
    } catch (error) {
      showErrorIfNeeded('创建工单失败', error)
      throw error
    }
  }

  /**
   * 获取工单详情
   */
  async getTicketDetail(ticketId: string): Promise<any> {
    try {
      const response = await api.get(`/user/tickets/${ticketId}`)
      return response.data
    } catch (error) {
      console.error('获取工单详情失败:', error)
      throw error
    }
  }

  /**
   * 更新工单
   */
  async updateTicket(ticketId: string, data: {
    status?: string
    response?: string
  }): Promise<void> {
    try {
      await api.put(`/user/tickets/${ticketId}`, data)
      message.success('工单更新成功')
    } catch (error) {
      showErrorIfNeeded('更新工单失败', error)
      throw error
    }
  }

  /**
   * 获取常见问题
   */
  async getFAQ(): Promise<any> {
    try {
      const response = await api.get('/help/faq')
      return response.data
    } catch (error) {
      console.error('获取常见问题失败:', error)
      throw error
    }
  }
}

// 导出单例
export const userService = new UserService()
export default userService
