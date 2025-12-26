/**
 * 通用类型定义
 * Common type definitions
 */

/**
 * 风险级别枚举
 */
export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * API响应基础接口
 */
export interface ApiResponse<T = any> {
  success: boolean
  data: T
  message?: string
  code?: number
}

/**
 * 分页请求参数
 */
export interface PageParams {
  page: number
  page_size: number
}

/**
 * 排序参数
 */
export interface SortParams {
  field: string
  order: 'asc' | 'desc'
}

/**
 * 时间范围
 */
export interface TimeRange {
  start: string
  end: string
}

/**
 * 统计数据点
 */
export interface DataPoint {
  timestamp: string
  value: number
  label?: string
}

/**
 * 图表数据
 */
export interface ChartData {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    color?: string
  }[]
}

/**
 * 系统状态
 */
export enum SystemStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  DOWN = 'down',
}

/**
 * 性能指标
 */
export interface PerformanceMetrics {
  cpu_usage: number
  memory_usage: number
  request_rate: number
  response_time: number
  error_rate: number
  uptime: number
}

/**
 * WebSocket消息类型
 */
export enum WebSocketMessageType {
  DETECTION_RESULT = 'detection_result',
  SYSTEM_UPDATE = 'system_update',
  STATISTICS_UPDATE = 'statistics_update',
  ALERT = 'alert',
}

/**
 * WebSocket消息
 */
export interface WebSocketMessage<T = any> {
  type: WebSocketMessageType
  data: T
  timestamp: string
}

/**
 * 表格列配置
 */
export interface TableColumn {
  key: string
  title: string
  dataIndex: string
  width?: number
  align?: 'left' | 'center' | 'right'
  sortable?: boolean
  filterable?: boolean
  render?: (value: any, record: any) => React.ReactNode
}

/**
 * 菜单项
 */
export interface MenuItem {
  key: string
  label: string
  icon?: React.ReactNode
  path: string
  children?: MenuItem[]
}

/**
 * 用户权限
 */
export enum Permission {
  VIEW_DASHBOARD = 'view_dashboard',
  PERFORM_DETECTION = 'perform_detection',
  VIEW_ANALYTICS = 'view_analytics',
  MANAGE_SETTINGS = 'manage_settings',
}

/**
 * 主题模式
 */
export enum ThemeMode {
  LIGHT = 'light',
  DARK = 'dark',
  AUTO = 'auto',
}
