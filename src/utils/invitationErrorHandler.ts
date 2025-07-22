/**
 * 邀请系统专用错误处理工具
 * 提供统一的错误处理、用户友好提示和错误恢复机制
 */
import { toast } from '@/components/ui/toast/use-toast'
import type { InviteCodeErrorType } from '@/utils/invitation'
import { INVITE_CODE_ERRORS, getInviteCodeErrorMessage } from '@/utils/invitation'

// 邀请系统错误类型定义
export interface InvitationError {
  code: string
  message: string
  type: 'validation' | 'network' | 'permission' | 'business' | 'system'
  context?: Record<string, any>
  recoverable?: boolean
  retryable?: boolean
  timestamp?: number
}

// 错误恢复操作定义
export interface ErrorRecoveryAction {
  label: string
  action: () => void | Promise<void>
  type: 'primary' | 'secondary'
}

/**
 * 邀请错误处理器类
 */
class InvitationErrorHandler {
  private errorHistory: InvitationError[] = []
  private maxHistorySize = 20

  /**
   * 处理邀请码验证错误
   */
  handleValidationError(
    error: any, 
    context: { inviteCode?: string; action?: string } = {}
  ): InvitationError {
    const invitationError = this.createInvitationError(error, 'validation', context)
    
    // 显示用户友好的错误提示
    toast({
      title: '邀请码验证失败',
      description: invitationError.message,
      variant: 'destructive'
    })

    this.recordError(invitationError)
    return invitationError
  }

  /**
   * 处理网络相关错误
   */
  handleNetworkError(
    error: any,
    context: { operation?: string; retryCount?: number } = {}
  ): InvitationError {
    const invitationError = this.createInvitationError(error, 'network', context)
    invitationError.retryable = true

    // 网络错误通常可以重试
    toast({
      title: '网络连接异常',
      description: `${invitationError.message}，请检查网络连接后重试`,
      variant: 'destructive'
    })

    this.recordError(invitationError)
    return invitationError
  }

  /**
   * 处理权限相关错误
   */
  handlePermissionError(
    error: any,
    context: { userRole?: string; requiredRole?: string } = {}
  ): InvitationError {
    const invitationError = this.createInvitationError(error, 'permission', context)
    invitationError.recoverable = false

    toast({
      title: '权限不足',
      description: invitationError.message,
      variant: 'destructive'
    })

    this.recordError(invitationError)
    return invitationError
  }

  /**
   * 处理业务逻辑错误
   */
  handleBusinessError(
    error: any,
    context: { operation?: string; data?: any } = {}
  ): InvitationError {
    const invitationError = this.createInvitationError(error, 'business', context)

    toast({
      title: '操作失败',
      description: invitationError.message,
      variant: 'destructive'
    })

    this.recordError(invitationError)
    return invitationError
  }

  /**
   * 处理系统级错误
   */
  handleSystemError(
    error: any,
    context: { component?: string; method?: string } = {}
  ): InvitationError {
    const invitationError = this.createInvitationError(error, 'system', context)
    invitationError.retryable = true

    toast({
      title: '系统异常',
      description: '系统出现异常，请稍后重试或联系管理员',
      variant: 'destructive'
    })

    this.recordError(invitationError)
    return invitationError
  }

  /**
   * 显示成功提示
   */
  showSuccess(message: string, description?: string) {
    toast({
      title: message,
      description: description,
      variant: 'default'
    })
  }

  /**
   * 显示警告提示
   */
  showWarning(message: string, description?: string) {
    toast({
      title: message,
      description: description,
      variant: 'default'
    })
  }

  /**
   * 创建标准化的邀请错误对象
   */
  private createInvitationError(
    error: any,
    type: InvitationError['type'],
    context: Record<string, any> = {}
  ): InvitationError {
    let code = 'UNKNOWN_ERROR'
    let message = '未知错误'

    // 处理邀请码特定错误
    if (this.isInviteCodeError(error)) {
      const errorType = this.extractInviteCodeErrorType(error)
      code = errorType
      message = getInviteCodeErrorMessage(errorType as InviteCodeErrorType)
    }
    // 处理HTTP错误
    else if (error?.response?.status) {
      const status = error.response.status
      code = `HTTP_${status}`
      message = this.getHttpErrorMessage(status)
    }
    // 处理网络错误
    else if (error?.code === 'NETWORK_ERROR' || error?.message?.includes('Network')) {
      code = 'NETWORK_ERROR'
      message = '网络连接失败，请检查网络状态'
    }
    // 处理业务错误
    else if (error?.response?.data?.message) {
      code = error.response.data.code || 'BUSINESS_ERROR'
      message = error.response.data.message
    }
    // 处理一般错误
    else if (error?.message) {
      code = 'GENERAL_ERROR'
      message = error.message
    }

    return {
      code,
      message,
      type,
      context,
      recoverable: type === 'validation' || type === 'network',
      retryable: type === 'network' || type === 'system',
      timestamp: Date.now()
    }
  }

  /**
   * 判断是否为邀请码特定错误
   */
  private isInviteCodeError(error: any): boolean {
    const errorCode = error?.response?.data?.code || error?.code
    return errorCode && Object.values(INVITE_CODE_ERRORS).includes(errorCode)
  }

  /**
   * 提取邀请码错误类型
   */
  private extractInviteCodeErrorType(error: any): string {
    return error?.response?.data?.code || error?.code || INVITE_CODE_ERRORS.SERVER_ERROR
  }

  /**
   * 根据HTTP状态码获取错误消息
   */
  private getHttpErrorMessage(status: number): string {
    const errorMessages: Record<number, string> = {
      400: '请求参数错误',
      401: '未授权访问',
      403: '没有操作权限',
      404: '请求的资源不存在',
      409: '数据冲突，请刷新后重试',
      422: '数据验证失败',
      429: '请求过于频繁，请稍后重试',
      500: '服务器内部错误',
      502: '服务器网关错误',
      503: '服务暂时不可用',
      504: '请求超时'
    }

    return errorMessages[status] || '网络请求失败'
  }

  /**
   * 记录错误到历史中
   */
  private recordError(error: InvitationError) {
    this.errorHistory.unshift(error)
    
    // 保持历史记录大小
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory = this.errorHistory.slice(0, this.maxHistorySize)
    }

    // 开发环境下输出详细错误信息
    if (import.meta.env.MODE === 'development') {
      console.error('[邀请系统错误]', {
        code: error.code,
        message: error.message,
        type: error.type,
        context: error.context,
        timestamp: new Date(error.timestamp!).toISOString()
      })
    }
  }

  /**
   * 获取错误历史
   */
  getErrorHistory(): InvitationError[] {
    return [...this.errorHistory]
  }

  /**
   * 清除错误历史
   */
  clearErrorHistory() {
    this.errorHistory = []
  }

  /**
   * 获取最近的错误
   */
  getLastError(): InvitationError | null {
    return this.errorHistory[0] || null
  }

  /**
   * 检查是否有可重试的错误
   */
  hasRetryableErrors(): boolean {
    return this.errorHistory.some(error => error.retryable && 
      Date.now() - error.timestamp! < 30000) // 30秒内的错误
  }

  /**
   * 获取重试建议
   */
  getRetryAdvice(): string | null {
    const lastError = this.getLastError()
    if (!lastError || !lastError.retryable) {
      return null
    }

    switch (lastError.type) {
      case 'network':
        return '网络连接异常，请检查网络后点击重试'
      case 'system':
        return '系统繁忙，请稍后重试'
      default:
        return '操作失败，请重试'
    }
  }
}

// 创建全局错误处理器实例
export const invitationErrorHandler = new InvitationErrorHandler()

/**
 * 邀请系统统一错误处理装饰器
 */
export function withInvitationErrorHandling<T extends (...args: any[]) => any>(
  fn: T,
  errorType: InvitationError['type'] = 'business',
  context: Record<string, any> = {}
): T {
  return ((...args: any[]) => {
    try {
      const result = fn(...args)
      
      // 如果是Promise，添加错误处理
      if (result && typeof result.catch === 'function') {
        return result.catch((error: any) => {
          const handlerMethod = `handle${errorType.charAt(0).toUpperCase() + errorType.slice(1)}Error`
          if (typeof (invitationErrorHandler as any)[handlerMethod] === 'function') {
            (invitationErrorHandler as any)[handlerMethod](error, context)
          } else {
            invitationErrorHandler.handleSystemError(error, context)
          }
          throw error
        })
      }
      
      return result
    } catch (error) {
      const handlerMethod = `handle${errorType.charAt(0).toUpperCase() + errorType.slice(1)}Error`
      if (typeof (invitationErrorHandler as any)[handlerMethod] === 'function') {
        (invitationErrorHandler as any)[handlerMethod](error, context)
      } else {
        invitationErrorHandler.handleSystemError(error, context)
      }
      throw error
    }
  }) as T
}

/**
 * 快捷方法：处理邀请码验证
 */
export const handleInviteCodeValidation = (error: any, inviteCode?: string) => {
  return invitationErrorHandler.handleValidationError(error, { inviteCode, action: 'validation' })
}

/**
 * 快捷方法：处理邀请码注册
 */
export const handleInviteRegistration = (error: any, context?: any) => {
  return invitationErrorHandler.handleBusinessError(error, { operation: 'registration', ...context })
}

/**
 * 快捷方法：处理邀请关系建立
 */
export const handleInviteRelationship = (error: any, context?: any) => {
  return invitationErrorHandler.handleBusinessError(error, { operation: 'relationship', ...context })
}

export default invitationErrorHandler