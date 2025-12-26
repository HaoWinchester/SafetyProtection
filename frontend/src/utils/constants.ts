/**
 * 常量定义
 * Constants definitions
 */

import { RiskLevel, AttackType, DetectionLevel } from '@/types'

/**
 * API端点
 */
export const API_ENDPOINTS = {
  // 检测相关
  DETECTION_REALTIME: '/api/detect',
  DETECTION_BATCH: '/api/detect/batch',
  DETECTION_HISTORY: '/api/detections/history',

  // 统计相关
  STATISTICS_OVERVIEW: '/api/statistics/overview',
  STATISTICS_TRENDS: '/api/statistics/trends',
  STATISTICS_DISTRIBUTION: '/api/statistics/distribution',

  // 监控相关
  MONITOR_SYSTEM: '/api/monitor/system',
  MONITOR_ENGINE: '/api/monitor/engine',
  MONITOR_PERFORMANCE: '/api/monitor/performance',

  // 设置相关
  SETTINGS_CONFIG: '/api/settings/config',
  SETTINGS_RULES: '/api/settings/rules',
} as const

/**
 * 风险级别配置
 */
export const RISK_LEVEL_CONFIG = {
  [RiskLevel.LOW]: {
    label: '低风险',
    color: '#52c41a',
    bgColor: '#f6ffed',
    borderColor: '#b7eb8f',
    icon: 'CheckCircleOutlined',
    threshold: [0, 0.3],
  },
  [RiskLevel.MEDIUM]: {
    label: '中风险',
    color: '#faad14',
    bgColor: '#fffbe6',
    borderColor: '#ffe58f',
    icon: 'WarningOutlined',
    threshold: [0.3, 0.5],
  },
  [RiskLevel.HIGH]: {
    label: '高风险',
    color: '#ff4d4f',
    bgColor: '#fff1f0',
    borderColor: '#ffccc7',
    icon: 'CloseCircleOutlined',
    threshold: [0.5, 0.8],
  },
  [RiskLevel.CRITICAL]: {
    label: '严重风险',
    color: '#cf1322',
    bgColor: '#5c0011',
    borderColor: '#a8071a',
    icon: 'StopOutlined',
    threshold: [0.8, 1.0],
  },
} as const

/**
 * 攻击类型配置
 */
export const ATTACK_TYPE_CONFIG = {
  [AttackType.DIRECT_PROMPT_INJECTION]: {
    label: '直接提示词注入',
    description: '直接尝试覆盖或修改系统提示词',
    color: '#ff4d4f',
  },
  [AttackType.INDIRECT_PROMPT_INJECTION]: {
    label: '间接提示词注入',
    description: '通过外部数据源进行提示词注入',
    color: '#faad14',
  },
  [AttackType.JAILBREAK]: {
    label: '越狱攻击',
    description: '尝试绕过安全限制和防护措施',
    color: '#cf1322',
  },
  [AttackType.DATA_LEAKAGE]: {
    label: '数据泄露',
    description: '尝试提取训练数据或敏感信息',
    color: '#722ed1',
  },
  [AttackType.MODEL_MANIPULATION]: {
    label: '模型操纵',
    description: '尝试控制模型输出或行为',
    color: '#13c2c2',
  },
  [AttackType.SOCIAL_ENGINEERING]: {
    label: '社会工程学',
    description: '通过欺骗手段获取信息或权限',
    color: '#1890ff',
  },
} as const

/**
 * 检测级别配置
 */
export const DETECTION_LEVEL_CONFIG = {
  [DetectionLevel.BASIC]: {
    label: '基础检测',
    description: '快速静态检测',
    testCases: '30-50',
    duration: '5-10分钟',
  },
  [DetectionLevel.STANDARD]: {
    label: '标准检测',
    description: '多维度综合检测',
    testCases: '100-150',
    duration: '20-30分钟',
  },
  [DetectionLevel.ADVANCED]: {
    label: '高级检测',
    description: '深度语义和行为分析',
    testCases: '300-500',
    duration: '60-90分钟',
  },
  [DetectionLevel.EXPERT]: {
    label: '专家检测',
    description: '全方位安全评估',
    testCases: '1000+',
    duration: '2-4小时',
  },
} as const

/**
 * 分页配置
 */
export const PAGINATION_CONFIG = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: ['10', '20', '50', '100'],
  SHOW_SIZE_CHANGER: true,
  SHOW_QUICK_JUMPER: true,
  SHOW_TOTAL: (total: number, range: [number, number]) =>
    `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
} as const

/**
 * 刷新间隔配置（毫秒）
 */
export const REFRESH_INTERVALS = {
  FAST: 5000, // 5秒
  NORMAL: 15000, // 15秒
  SLOW: 30000, // 30秒
  VERY_SLOW: 60000, // 1分钟
} as const

/**
 * WebSocket配置
 */
export const WS_CONFIG = {
  RECONNECT_INTERVAL: 5000, // 重连间隔
  MAX_RECONNECT_ATTEMPTS: 5, // 最大重连次数
  HEARTBEAT_INTERVAL: 30000, // 心跳间隔
  MESSAGE_TIMEOUT: 10000, // 消息超时
} as const

/**
 * 图表配置
 */
export const CHART_COLORS = [
  '#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1',
  '#13c2c2', '#eb2f96', '#fa8c16', '#a0d911', '#2f54eb'
] as const

/**
 * 本地存储键
 */
export const STORAGE_KEYS = {
  THEME: 'llm-security-theme',
  SIDEBAR_COLLAPSED: 'llm-security-sidebar-collapsed',
  RECENT_DETECTIONS: 'llm-security-recent-detections',
  SETTINGS: 'llm-security-settings',
} as const

/**
 * 文件上传限制
 */
export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: ['.txt', '.json', '.csv'],
  MAX_BATCH_SIZE: 100, // 最大批量数量
} as const

/**
 * 性能指标阈值
 */
export const PERFORMANCE_THRESHOLDS = {
  CPU_WARNING: 70,
  CPU_CRITICAL: 90,
  MEMORY_WARNING: 70,
  MEMORY_CRITICAL: 90,
  RESPONSE_TIME_WARNING: 100,
  RESPONSE_TIME_CRITICAL: 500,
  ERROR_RATE_WARNING: 0.01,
  ERROR_RATE_CRITICAL: 0.05,
} as const
