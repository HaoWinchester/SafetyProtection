/**
 * Redux Store配置
 * Redux store configuration
 */

import { configureStore } from '@reduxjs/toolkit'
import detectionReducer from './detectionSlice'
import monitorReducer from './monitorSlice'

/**
 * 配置Redux Store
 */
export const store = configureStore({
  reducer: {
    detection: detectionReducer,
    monitor: monitorReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // 忽略某些action的序列化检查
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
  devTools: import.meta.env.MODE !== 'production',
})

/**
 * 导出根状态类型
 */
export type RootState = ReturnType<typeof store.getState>

/**
 * 导出dispatch类型
 */
export type AppDispatch = typeof store.dispatch

export default store
