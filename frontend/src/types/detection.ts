/**
 * 检测相关类型定义
 * Detection related type definitions
 */

import { RiskLevel } from './common'

/**
 * 检测请求接口
 */
export interface DetectionRequest {
  text: string
  conversation_id?: string
  context?: string[]
  detection_level?: DetectionLevel
}

/**
 * 检测级别
 */
export enum DetectionLevel {
  BASIC = 'basic',
  STANDARD = 'standard',
  ADVANCED = 'advanced',
  EXPERT = 'expert',
}

/**
 * 检测结果接口
 */
export interface DetectionResult {
  id: string
  text: string
  is_compliant: boolean
  risk_score: number
  risk_level: RiskLevel
  attack_types: AttackType[]
  confidence: number
  detection_time: number
  processing_time: number
  details: DetectionDetails
  timestamp: string
}

/**
 * 检测详情接口
 */
export interface DetectionDetails {
  static_analysis?: StaticAnalysisResult
  semantic_analysis?: SemanticAnalysisResult
  behavioral_analysis?: BehavioralAnalysisResult
  context_analysis?: ContextAnalysisResult
}

/**
 * 静态分析结果
 */
export interface StaticAnalysisResult {
  matched_keywords: string[]
  matched_patterns: string[]
  blacklisted: boolean
  suspicious_count: number
}

/**
 * 语义分析结果
 */
export interface SemanticAnalysisResult {
  similarity_score: number
  intent: string
  category: string
  confidence: number
}

/**
 * 行为分析结果
 */
export interface BehavioralAnalysisResult {
  role_playing_detected: boolean
  jailbreak_attempt: boolean
  prompt_injection: boolean
  anomalies: string[]
}

/**
 * 上下文分析结果
 */
export interface ContextAnalysisResult {
  conversation_coherence: number
  historical_consistency: number
  context_relevance: number
}

/**
 * 攻击类型枚举
 */
export enum AttackType {
  DIRECT_PROMPT_INJECTION = 'direct_prompt_injection',
  INDIRECT_PROMPT_INJECTION = 'indirect_prompt_injection',
  JAILBREAK = 'jailbreak',
  DATA_LEAKAGE = 'data_leakage',
  MODEL_MANIPULATION = 'model_manipulation',
  SOCIAL_ENGINEERING = 'social_engineering',
}

/**
 * 批量检测请求
 */
export interface BatchDetectionRequest {
  texts: string[]
  detection_level?: DetectionLevel
}

/**
 * 批量检测结果
 */
export interface BatchDetectionResult {
  batch_id: string
  total: number
  compliant: number
  non_compliant: number
  results: DetectionResult[]
  summary: BatchSummary
  timestamp: string
}

/**
 * 批量检测摘要
 */
export interface BatchSummary {
  avg_risk_score: number
  max_risk_score: number
  attack_type_distribution: Record<AttackType, number>
  risk_level_distribution: Record<RiskLevel, number>
}

/**
 * 检测历史记录
 */
export interface DetectionHistory {
  id: string
  results: DetectionResult[]
  pagination: PaginationInfo
}

/**
 * 分页信息
 */
export interface PaginationInfo {
  page: number
  page_size: number
  total: number
  total_pages: number
}
