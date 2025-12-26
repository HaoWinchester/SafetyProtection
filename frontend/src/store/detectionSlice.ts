/**
 * Detection Slice - Redux状态管理
 * Detection state management with Redux Toolkit
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { DetectionResult, DetectionHistory, RiskLevel } from '@/types'
import { detectRealtime, getDetectionHistory } from '@/services/detectionService'

/**
 * Detection State接口
 */
interface DetectionState {
  // 当前检测结果
  currentResult: DetectionResult | null
  // 检测历史记录
  history: DetectionHistory | null
  // 加载状态
  loading: boolean
  // 错误信息
  error: string | null
  // 实时检测队列
  detectionQueue: string[]
  // 最近检测记录
  recentDetections: DetectionResult[]
}

/**
 * 初始状态
 */
const initialState: DetectionState = {
  currentResult: null,
  history: null,
  loading: false,
  error: null,
  detectionQueue: [],
  recentDetections: [],
}

/**
 * 异步Thunk: 实时检测
 */
export const performDetection = createAsyncThunk(
  'detection/performDetection',
  async (request: { text: string; detection_level?: string }, { rejectWithValue }) => {
    try {
      const result = await detectRealtime(request)
      return result
    } catch (error: any) {
      return rejectWithValue(error.message || '检测失败')
    }
  }
)

/**
 * 异步Thunk: 获取检测历史
 */
export const fetchDetectionHistory = createAsyncThunk(
  'detection/fetchHistory',
  async (params?: { page?: number; page_size?: number }, { rejectWithValue }) => {
    try {
      const history = await getDetectionHistory(params)
      return history
    } catch (error: any) {
      return rejectWithValue(error.message || '获取历史记录失败')
    }
  }
)

/**
 * Detection Slice
 */
const detectionSlice = createSlice({
  name: 'detection',
  initialState,
  reducers: {
    // 清除当前结果
    clearCurrentResult: (state) => {
      state.currentResult = null
    },
    // 添加到检测队列
    addToQueue: (state, action: PayloadAction<string>) => {
      state.detectionQueue.push(action.payload)
    },
    // 从检测队列移除
    removeFromQueue: (state, action: PayloadAction<string>) => {
      state.detectionQueue = state.detectionQueue.filter(id => id !== action.payload)
    },
    // 添加到最近检测记录
    addRecentDetection: (state, action: PayloadAction<DetectionResult>) => {
      state.recentDetections.unshift(action.payload)
      // 只保留最近10条
      if (state.recentDetections.length > 10) {
        state.recentDetections = state.recentDetections.slice(0, 10)
      }
    },
    // 清除错误
    clearError: (state) => {
      state.error = null
    },
    // 重置状态
    resetDetectionState: () => initialState,
  },
  extraReducers: (builder) => {
    // 实时检测
    builder
      .addCase(performDetection.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(performDetection.fulfilled, (state, action) => {
        state.loading = false
        state.currentResult = action.payload
        state.recentDetections.unshift(action.payload)
        if (state.recentDetections.length > 10) {
          state.recentDetections = state.recentDetections.slice(0, 10)
        }
      })
      .addCase(performDetection.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

    // 获取历史记录
    builder
      .addCase(fetchDetectionHistory.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchDetectionHistory.fulfilled, (state, action) => {
        state.loading = false
        state.history = action.payload
      })
      .addCase(fetchDetectionHistory.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
  },
})

/**
 * 导出actions
 */
export const {
  clearCurrentResult,
  addToQueue,
  removeFromQueue,
  addRecentDetection,
  clearError,
  resetDetectionState,
} = detectionSlice.actions

/**
 * 导出selectors
 */
export const selectCurrentResult = (state: { detection: DetectionState }) =>
  state.detection.currentResult

export const selectDetectionHistory = (state: { detection: DetectionState }) =>
  state.detection.history

export const selectDetectionLoading = (state: { detection: DetectionState }) =>
  state.detection.loading

export const selectDetectionError = (state: { detection: DetectionState }) =>
  state.detection.error

export const selectRecentDetections = (state: { detection: DetectionState }) =>
  state.detection.recentDetections

export const selectDetectionQueue = (state: { detection: DetectionState }) =>
  state.detection.detectionQueue

/**
 * 导出reducer
 */
export default detectionSlice.reducer
