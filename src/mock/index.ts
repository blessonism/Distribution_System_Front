import { setupMockApi } from './setupMock'

// 检查是否启用Mock
const enableMock = import.meta.env.VITE_USE_MOCK === 'true'

// 初始化Mock服务
if (enableMock) {
  // 使用axios-mock-adapter方式
  setupMockApi()
  console.log('API Mock服务已启动')
} 