<template>
  <div class="error-handling-example p-6 space-y-4">
    <h2 class="text-2xl font-bold mb-4">错误处理示例</h2>
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- 基础错误处理示例 -->
      <div class="border rounded-lg p-4">
        <h3 class="text-lg font-semibold mb-2">基础错误处理</h3>
        <button 
          @click="testBasicError"
          class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          测试基础错误
        </button>
      </div>

      <!-- 业务错误码处理示例 -->
      <div class="border rounded-lg p-4">
        <h3 class="text-lg font-semibold mb-2">业务错误码处理</h3>
        <button 
          @click="testBusinessError"
          class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          测试业务错误码
        </button>
      </div>

      <!-- 装饰器错误处理示例 -->
      <div class="border rounded-lg p-4">
        <h3 class="text-lg font-semibold mb-2">装饰器错误处理</h3>
        <button 
          @click="testDecoratorError"
          class="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
        >
          测试装饰器错误
        </button>
      </div>

      <!-- HTTP状态码错误处理示例 -->
      <div class="border rounded-lg p-4">
        <h3 class="text-lg font-semibold mb-2">HTTP状态码错误</h3>
        <button 
          @click="testHttpError"
          class="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          测试HTTP错误
        </button>
      </div>
    </div>

    <!-- 错误日志显示 -->
    <div class="border rounded-lg p-4 mt-6">
      <h3 class="text-lg font-semibold mb-2">错误日志</h3>
      <div class="bg-gray-100 p-3 rounded max-h-40 overflow-y-auto">
        <div v-if="errorLogs.length === 0" class="text-gray-500">
          暂无错误日志
        </div>
        <div 
          v-for="(log, index) in errorLogs" 
          :key="index"
          class="text-sm mb-1 font-mono"
        >
          <span class="text-gray-500">{{ log.timestamp }}</span>
          <span class="text-red-600 ml-2">{{ log.message }}</span>
        </div>
      </div>
      <button 
        @click="clearLogs"
        class="mt-2 bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600"
      >
        清空日志
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { 
  handleApiError, 
  showErrorToast, 
  withErrorHandling,
  type ErrorResponse 
} from '@/utils/errorCodeMapping'

// 错误日志
const errorLogs = ref<Array<{ timestamp: string; message: string }>>([])

// 添加错误日志
const addErrorLog = (message: string) => {
  errorLogs.value.unshift({
    timestamp: new Date().toLocaleTimeString(),
    message
  })
  // 限制日志数量
  if (errorLogs.value.length > 10) {
    errorLogs.value = errorLogs.value.slice(0, 10)
  }
}

// 清空日志
const clearLogs = () => {
  errorLogs.value = []
}

// 测试基础错误处理
const testBasicError = () => {
  try {
    // 模拟一个包含业务错误码的错误
    const mockError = {
      response: {
        status: 422,
        data: {
          code: 422,
          success: false,
          message: '数据验证失败',
          data: {
            error_code: 'USER_002',
            field: 'username',
            value: 'existing_user'
          }
        }
      }
    }
    
    const friendlyMessage = handleApiError(mockError)
    addErrorLog(`基础错误处理: ${friendlyMessage}`)
    showErrorToast(mockError, '基础错误测试')
  } catch (error) {
    addErrorLog(`基础错误处理异常: ${error}`)
  }
}

// 测试业务错误码处理
const testBusinessError = () => {
  try {
    // 模拟推广管理错误
    const mockError = {
      response: {
        status: 403,
        data: {
          code: 403,
          success: false,
          message: '权限不足',
          data: {
            error_code: 'PROMOTION_002',
            details: '当前用户没有审核权限'
          }
        }
      }
    }
    
    const friendlyMessage = handleApiError(mockError)
    addErrorLog(`业务错误码处理: ${friendlyMessage}`)
    showErrorToast(mockError, '业务错误测试')
  } catch (error) {
    addErrorLog(`业务错误处理异常: ${error}`)
  }
}

// 测试装饰器错误处理
const testDecoratorError = async () => {
  // 模拟一个会抛出错误的异步函数
  const mockApiCall = async () => {
    throw {
      response: {
        status: 404,
        data: {
          code: 404,
          success: false,
          message: '资源不存在',
          data: {
            error_code: 'AGENT_001'
          }
        }
      }
    }
  }

  // 使用装饰器包装函数
  const wrappedApiCall = withErrorHandling(mockApiCall, '装饰器错误测试')
  
  try {
    await wrappedApiCall()
  } catch (error) {
    addErrorLog(`装饰器错误处理: 已自动处理并显示Toast`)
  }
}

// 测试HTTP状态码错误
const testHttpError = () => {
  try {
    // 模拟HTTP 500错误
    const mockError = {
      response: {
        status: 500,
        data: {
          code: 500,
          success: false,
          message: '服务器内部错误'
        }
      }
    }
    
    const friendlyMessage = handleApiError(mockError)
    addErrorLog(`HTTP错误处理: ${friendlyMessage}`)
    showErrorToast(mockError, 'HTTP错误测试')
  } catch (error) {
    addErrorLog(`HTTP错误处理异常: ${error}`)
  }
}
</script>

<style scoped>
.error-handling-example {
  max-width: 800px;
  margin: 0 auto;
}
</style>
