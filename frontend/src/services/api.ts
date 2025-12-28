/**
 * Axios API客户端配置
 * Axios API client configuration
 */

import axios, { AxiosInstance, AxiosError, AxiosRequestConfig, AxiosResponse, CancelTokenSource } from 'axios'
import { message } from 'antd'

/**
 * API响应接口
 */
interface ApiResponse<T = any> {
  success: boolean
  data: T
  message?: string
  code?: number
}

/**
 * 请求取消令牌映射
 */
const pendingRequests = new Map<string, CancelTokenSource>()

/**
 * 创建Axios实例
 */
const createApiClient = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
    // 缩短超时时间：从30秒改为5秒，快速失败
    timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '5000'),
    headers: {
      'Content-Type': 'application/json',
    },
  })

  // 请求拦截器
  instance.interceptors.request.use(
    (config) => {
      // 生成请求唯一标识
      const requestKey = `${config.method}-${config.url}-${JSON.stringify(config.params || {})}`

      // 取消之前的重复请求
      const pendingSource = pendingRequests.get(requestKey)
      if (pendingSource) {
        pendingSource.cancel('取消重复请求')
      }

      // 创建新的取消令牌
      const source = axios.CancelToken.source()
      config.cancelToken = source.token
      pendingRequests.set(requestKey, source)

      // 可以在这里添加认证token
      // const token = localStorage.getItem('token')
      // if (token) {
      //   config.headers.Authorization = `Bearer ${token}`
      // }
      return config
    },
    (error: AxiosError) => {
      return Promise.reject(error)
    }
  )

  // 响应拦截器
  instance.interceptors.response.use(
    (response: AxiosResponse) => {
      // 清理已完成的请求
      const requestKey = `${response.config.method}-${response.config.url}-${JSON.stringify(response.config.params || {})}`
      pendingRequests.delete(requestKey)

      // 直接返回响应数据,因为后端没有包装在ApiResponse中
      return response
    },
    (error: AxiosError<ApiResponse>) => {
      // 清理已取消或失败的请求
      if (error.config) {
        const requestKey = `${error.config.method}-${error.config.url}-${JSON.stringify(error.config.params || {})}`
        pendingRequests.delete(requestKey)
      }

      // 如果是请求取消，不显示错误消息
      if (axios.isCancel(error)) {
        console.log('请求已取消:', error.message)
        return Promise.reject(error)
      }

      const { response } = error

      if (response) {
        const { status, data } = response

        switch (status) {
          case 400:
            message.error(data?.message || '请求参数错误')
            break
          case 401:
            message.error('未授权，请重新登录')
            // 可以在这里跳转到登录页
            break
          case 403:
            message.error('拒绝访问')
            break
          case 404:
            message.error('请求的资源不存在')
            break
          case 500:
            message.error('服务器内部错误')
            break
          default:
            message.error(data?.message || `请求失败 (${status})`)
        }
      } else if (error.code === 'ECONNABORTED') {
        message.error('请求超时，请检查后端服务是否已启动')
      } else {
        message.error('网络错误，请检查网络连接和后端服务状态')
      }

      return Promise.reject(error)
    }
  )

  return instance
}

/**
 * API客户端实例
 */
export const apiClient = createApiClient()

/**
 * 通用请求方法
 */
export const request = async <T = any>(
  config: AxiosRequestConfig
): Promise<T> => {
  const response = await apiClient.request<T>(config)
  // 后端直接返回数据，没有包装在ApiResponse中
  return response.data
}

/**
 * GET请求
 */
export const get = <T = any>(
  url: string,
  params?: any,
  config?: AxiosRequestConfig
): Promise<T> => {
  return request<T>({
    method: 'GET',
    url,
    params,
    ...config,
  })
}

/**
 * POST请求
 */
export const post = <T = any>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<T> => {
  return request<T>({
    method: 'POST',
    url,
    data,
    ...config,
  })
}

/**
 * PUT请求
 */
export const put = <T = any>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<T> => {
  return request<T>({
    method: 'PUT',
    url,
    data,
    ...config,
  })
}

/**
 * DELETE请求
 */
export const del = <T = any>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T> => {
  return request<T>({
    method: 'DELETE',
    url,
    ...config,
  })
}

/**
 * 文件上传
 */
export const upload = <T = any>(
  url: string,
  file: File,
  onProgress?: (percent: number) => void
): Promise<T> => {
  const formData = new FormData()
  formData.append('file', file)

  return request<T>({
    method: 'POST',
    url,
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        onProgress(percent)
      }
    },
  })
}

export default apiClient
