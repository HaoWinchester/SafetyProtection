/**
 * Monitor Slice - Redux状态管理
 * Monitor state management with Redux Toolkit
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { SystemStatus, PerformanceMetrics, EngineStatus } from '@/types'
import { getSystemHealth, getPerformanceMetrics, getEngineStatus } from '@/services/monitorService'

/**
 * Monitor State接口
 */
interface MonitorState {
  // 系统状态
  systemStatus: SystemStatus
  // 性能指标
  performanceMetrics: PerformanceMetrics | null
  // 引擎状态
  engineStatus: EngineStatus | null
  // 加载状态
  loading: boolean
  // 错误信息
  error: string | null
  // 最后更新时间
  lastUpdated: string | null
  // 是否正在监控
  isMonitoring: boolean
}

/**
 * 初始状态
 */
const initialState: MonitorState = {
  systemStatus: SystemStatus.HEALTHY,
  performanceMetrics: null,
  engineStatus: null,
  loading: false,
  error: null,
  lastUpdated: null,
  isMonitoring: false,
}

/**
 * 异步Thunk: 获取系统健康状态
 */
export const fetchSystemHealth = createAsyncThunk(
  'monitor/fetchSystemHealth',
  async (_, { rejectWithValue }) => {
    try {
      const health = await getSystemHealth()
      return health
    } catch (error: any) {
      return rejectWithValue(error.message || '获取系统状态失败')
    }
  }
)

/**
 * 异步Thunk: 获取性能指标
 */
export const fetchPerformanceMetrics = createAsyncThunk(
  'monitor/fetchPerformanceMetrics',
  async (_, { rejectWithValue }) => {
    try {
      const metrics = await getPerformanceMetrics()
      return metrics
    } catch (error: any) {
      return rejectWithValue(error.message || '获取性能指标失败')
    }
  }
)

/**
 * 异步Thunk: 获取引擎状态
 */
export const fetchEngineStatus = createAsyncThunk(
  'monitor/fetchEngineStatus',
  async (_, { rejectWithValue }) => {
    try {
      const status = await getEngineStatus()
      return status
    } catch (error: any) {
      return rejectWithValue(error.message || '获取引擎状态失败')
    }
  }
)

/**
 * 异步Thunk: 获取所有监控数据
 */
export const fetchAllMonitorData = createAsyncThunk(
  'monitor/fetchAllMonitorData',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const [health, metrics, engine] = await Promise.all([
        dispatch(fetchSystemHealth()),
        dispatch(fetchPerformanceMetrics()),
        dispatch(fetchEngineStatus()),
      ])
      return { health, metrics, engine }
    } catch (error: any) {
      return rejectWithValue(error.message || '获取监控数据失败')
    }
  }
)

/**
 * Monitor Slice
 */
const monitorSlice = createSlice({
  name: 'monitor',
  initialState,
  reducers: {
    // 开始监控
    startMonitoring: (state) => {
      state.isMonitoring = true
    },
    // 停止监控
    stopMonitoring: (state) => {
      state.isMonitoring = false
    },
    // 更新性能指标
    updatePerformanceMetrics: (state, action: PayloadAction<PerformanceMetrics>) => {
      state.performanceMetrics = action.payload
      state.lastUpdated = new Date().toISOString()
    },
    // 更新系统状态
    updateSystemStatus: (state, action: PayloadAction<SystemStatus>) => {
      state.systemStatus = action.payload
      state.lastUpdated = new Date().toISOString()
    },
    // 更新引擎状态
    updateEngineStatus: (state, action: PayloadAction<EngineStatus>) => {
      state.engineStatus = action.payload
      state.lastUpdated = new Date().toISOString()
    },
    // 清除错误
    clearError: (state) => {
      state.error = null
    },
    // 重置状态
    resetMonitorState: () => initialState,
  },
  extraReducers: (builder) => {
    // 获取系统健康状态
    builder
      .addCase(fetchSystemHealth.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchSystemHealth.fulfilled, (state, action) => {
        state.loading = false
        state.systemStatus = action.payload.status
        state.lastUpdated = new Date().toISOString()
      })
      .addCase(fetchSystemHealth.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

    // 获取性能指标
    builder
      .addCase(fetchPerformanceMetrics.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchPerformanceMetrics.fulfilled, (state, action) => {
        state.loading = false
        state.performanceMetrics = action.payload
        state.lastUpdated = new Date().toISOString()
      })
      .addCase(fetchPerformanceMetrics.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

    // 获取引擎状态
    builder
      .addCase(fetchEngineStatus.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchEngineStatus.fulfilled, (state, action) => {
        state.loading = false
        state.engineStatus = action.payload
        state.lastUpdated = new Date().toISOString()
      })
      .addCase(fetchEngineStatus.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
  },
})

/**
 * 导出actions
 */
export const {
  startMonitoring,
  stopMonitoring,
  updatePerformanceMetrics,
  updateSystemStatus,
  updateEngineStatus,
  clearError,
  resetMonitorState,
} = monitorSlice.actions

/**
 * 导出selectors
 */
export const selectSystemStatus = (state: { monitor: MonitorState }) =>
  state.monitor.systemStatus

export const selectPerformanceMetrics = (state: { monitor: MonitorState }) =>
  state.monitor.performanceMetrics

export const selectEngineStatus = (state: { monitor: MonitorState }) =>
  state.monitor.engineStatus

export const selectMonitorLoading = (state: { monitor: MonitorState }) =>
  state.monitor.loading

export const selectMonitorError = (state: { monitor: MonitorState }) =>
  state.monitor.error

export const selectIsMonitoring = (state: { monitor: MonitorState }) =>
  state.monitor.isMonitoring

export const selectLastUpdated = (state: { monitor: MonitorState }) =>
  state.monitor.lastUpdated

/**
 * 导出reducer
 */
export default monitorSlice.reducer
