/**
 * @fileoverview 邀请系统专用错误处理工具模块
 * 提供统一的错误处理、用户友好提示和错误恢复机制，覆盖验证、网络、权限、业务和系统等各类错误
 * 包含错误分类处理、友好提示显示、错误历史记录、恢复建议和装饰器模式封装等核心功能
 * 集成Toast组件提供优雅的用户反馈体验，支持错误统计和调试信息输出
 * 
 * @module utils/invitationErrorHandler
 * @author Frontend Team
 * @since 1.0.0
 */
import { toast } from '@/components/ui/toast/use-toast'
import type { InviteCodeErrorType } from '@/utils/invitation'
import { INVITE_CODE_ERRORS, getInviteCodeErrorMessage } from '@/utils/invitation'

/**
 * 邀请系统错误接口
 * 定义标准化的错误对象结构，包含错误分类和恢复信息
 *
 * @interface InvitationError
 */
interface InvitationError {
  code: string
  message: string
  type: 'validation' | 'network' | 'permission' | 'business' | 'system'
  context?: Record<string, any>
  recoverable?: boolean
  retryable?: boolean
  timestamp?: number
}

/**
 * 错误恢复操作接口
 * 定义用户可执行的错误恢复动作
 * 
 * @interface ErrorRecoveryAction
 */
interface ErrorRecoveryAction {
  label: string
  action: () => void | Promise<void>
  type: 'primary' | 'secondary'
}

/**
 * 邀请错误处理器类
 * 提供完整的邀请系统错误处理能力，包括错误分类、用户提示和历史管理
 * 
 * @class InvitationErrorHandler
 * @example
 * ```typescript
 * const handler = new InvitationErrorHandler()
 * 
 * try {
 *   await inviteUser(userData)
 * } catch (error) {
 *   handler.handleValidationError(error, { inviteCode: 'ABC123' })
 * }
 * ```
 */
class InvitationErrorHandler {
  private errorHistory: InvitationError[] = []
  private maxHistorySize = 20

  /**
   * 处理邀请码验证错误
   * 专门处理邀请码格式、有效性等验证相关错误
   * 
   * @complexity O(1) - 常数时间复杂度，错误处理和提示显示
   * @flow 错误转换 → Toast提示 → 历史记录 → 错误返回
   * 
   * @param {any} error - 原始错误对象
   * @param {object} context - 验证上下文信息
   * @param {string} context.inviteCode - 邀请码
   * @param {string} context.action - 执行的操作
   * @returns {InvitationError} 标准化的邀请错误对象
   * 
   * @example
   * ```typescript
   * const validationError = handler.handleValidationError(
   *   new Error('邀请码格式错误'),
   *   { inviteCode: 'INVALID', action: 'validation' }
   * )
   * ```
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
   * 处理网络连接、超时等网络层面的错误
   * 
   * @complexity O(1) - 常数时间复杂度，错误处理和提示显示
   * @flow 错误转换 → 重试标记 → Toast提示 → 历史记录 → 错误返回
   * 
   * @param {any} error - 原始错误对象
   * @param {object} context - 网络操作上下文
   * @param {string} context.operation - 网络操作类型
   * @param {number} context.retryCount - 已重试次数
   * @returns {InvitationError} 标准化的邀请错误对象
   * 
   * @example
   * ```typescript
   * const networkError = handler.handleNetworkError(
   *   new Error('ECONNRESET'),
   *   { operation: 'invite_user', retryCount: 2 }
   * )
   * ```
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
   * 处理用户权限不足、角色限制等权限问题
   * 
   * @complexity O(1) - 常数时间复杂度，错误处理和提示显示
   * @flow 错误转换 → 不可恢复标记 → Toast提示 → 历史记录 → 错误返回
   * 
   * @param {any} error - 原始错误对象
   * @param {object} context - 权限检查上下文
   * @param {string} context.userRole - 用户当前角色
   * @param {string} context.requiredRole - 所需角色
   * @returns {InvitationError} 标准化的邀请错误对象
   * 
   * @example
   * ```typescript
   * const permissionError = handler.handlePermissionError(
   *   new Error('权限不足'),
   *   { userRole: 'agent', requiredRole: 'manager' }
   * )
   * ```
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
   * 处理业务规则违反、数据冲突等业务层面的错误
   * 
   * @complexity O(1) - 常数时间复杂度，错误处理和提示显示
   * @flow 错误转换 → Toast提示 → 历史记录 → 错误返回
   * 
   * @param {any} error - 原始错误对象
   * @param {object} context - 业务操作上下文
   * @param {string} context.operation - 业务操作类型
   * @param {any} context.data - 相关业务数据
   * @returns {InvitationError} 标准化的邀请错误对象
   * 
   * @example
   * ```typescript
   * const businessError = handler.handleBusinessError(
   *   new Error('用户已存在'),
   *   { operation: 'create_user', data: userData }
   * )
   * ```
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
   * 处理服务器内部错误、系统异常等系统层面的错误
   * 
   * @complexity O(1) - 常数时间复杂度，错误处理和提示显示
   * @flow 错误转换 → 重试标记 → Toast提示 → 历史记录 → 错误返回
   * 
   * @param {any} error - 原始错误对象
   * @param {object} context - 系统操作上下文
   * @param {string} context.component - 出错的组件名
   * @param {string} context.method - 出错的方法名
   * @returns {InvitationError} 标准化的邀请错误对象
   * 
   * @example
   * ```typescript
   * const systemError = handler.handleSystemError(
   *   new Error('Internal Server Error'),
   *   { component: 'InviteService', method: 'processInvitation' }
   * )
   * ```
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
   * 显示操作成功的友好提示信息
   * 
   * @complexity O(1) - 常数时间复杂度，Toast组件调用
   * @flow 参数处理 → Toast显示
   * 
   * @param {string} message - 成功消息标题
   * @param {string} description - 可选的详细描述
   * 
   * @example
   * ```typescript
   * handler.showSuccess('邀请发送成功', '邀请链接已发送到用户邮箱')
   * ```
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
   * 显示需要用户注意的警告信息
   * 
   * @complexity O(1) - 常数时间复杂度，Toast组件调用
   * @flow 参数处理 → Toast显示
   * 
   * @param {string} message - 警告消息标题
   * @param {string} description - 可选的详细描述
   * 
   * @example
   * ```typescript
   * handler.showWarning('邀请码即将过期', '请尽快使用邀请码完成注册')
   * ```
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
   * 将各种类型的错误转换为统一的邀请错误格式
   * 
   * @complexity O(1) - 常数时间复杂度，错误分析和对象创建
   * @flow 错误类型检查 → 错误码提取 → 消息生成 → 对象构建
   * 
   * @param {any} error - 原始错误对象
   * @param {InvitationError['type']} type - 错误类型分类
   * @param {Record<string, any>} context - 错误上下文信息
   * @returns {InvitationError} 标准化的邀请错误对象
   * 
   * @private
   * @example
   * ```typescript
   * const standardError = this.createInvitationError(
   *   new Error('Network Error'),
   *   'network',
   *   { operation: 'invite' }
   * )
   * ```
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
   * 检查错误是否属于预定义的邀请码错误类型
   * 
   * @complexity O(1) - 常数时间复杂度，数组包含检查
   * @flow 错误码提取 → 错误类型数组检查
   * 
   * @param {any} error - 要检查的错误对象
   * @returns {boolean} 如果是邀请码特定错误返回true
   * 
   * @private
   * @example
   * ```typescript
   * const isInviteError = this.isInviteCodeError(error)
   * if (isInviteError) {
   *   // 使用专门的邀请码错误处理逻辑
   * }
   * ```
   */
  private isInviteCodeError(error: any): boolean {
    const errorCode = error?.response?.data?.code || error?.code
    return errorCode && Object.values(INVITE_CODE_ERRORS).includes(errorCode)
  }

  /**
   * 提取邀请码错误类型
   * 从错误对象中提取具体的邀请码错误类型标识
   * 
   * @complexity O(1) - 常数时间复杂度，属性访问
   * @flow 响应错误码提取 → 通用错误码提取 → 默认错误码
   * 
   * @param {any} error - 错误对象
   * @returns {string} 邀请码错误类型标识
   * 
   * @private
   * @example
   * ```typescript
   * const errorType = this.extractInviteCodeErrorType(error)
   * console.log(errorType) // 'INVALID_INVITE_CODE'
   * ```
   */
  private extractInviteCodeErrorType(error: any): string {
    return error?.response?.data?.code || error?.code || INVITE_CODE_ERRORS.SERVER_ERROR
  }

  /**
   * 根据HTTP状态码获取错误消息
   * 将HTTP状态码映射为用户友好的中文错误消息
   * 
   * @complexity O(1) - 常数时间复杂度，对象属性查找
   * @flow 状态码映射 → 消息查找 → 默认消息
   * 
   * @param {number} status - HTTP状态码
   * @returns {string} 对应的用户友好错误消息
   * 
   * @private
   * @example
   * ```typescript
   * const message = this.getHttpErrorMessage(404)
   * console.log(message) // '请求的资源不存在'
   * 
   * const unknownMessage = this.getHttpErrorMessage(999)
   * console.log(unknownMessage) // '网络请求失败'
   * ```
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
   * 将错误添加到历史记录并维护记录大小限制
   * 
   * @complexity O(1) - 常数时间复杂度，数组操作和条件检查
   * @flow 错误添加 → 大小检查 → 数组截取 → 开发环境日志
   * 
   * @param {InvitationError} error - 要记录的错误对象
   * 
   * @private
   * @example
   * ```typescript
   * this.recordError(invitationError)
   * // 错误会被添加到历史记录，并在开发环境输出详细信息
   * ```
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
   * 返回所有已记录的错误历史记录的副本
   * 
   * @complexity O(n) - n为错误历史记录数量，数组复制
   * @flow 历史数组复制 → 副本返回
   * 
   * @returns {InvitationError[]} 错误历史记录数组的副本
   * 
   * @example
   * ```typescript
   * const history = handler.getErrorHistory()
   * console.log(`共有 ${history.length} 条错误记录`)
   * history.forEach((error, index) => {
   *   console.log(`${index + 1}. ${error.message} (${error.type})`)
   * })
   * ```
   */
  getErrorHistory(): InvitationError[] {
    return [...this.errorHistory]
  }

  /**
   * 清除错误历史
   * 清空所有已记录的错误历史记录
   * 
   * @complexity O(1) - 常数时间复杂度，数组重置
   * @flow 历史数组清空
   * 
   * @example
   * ```typescript
   * handler.clearErrorHistory()
   * console.log(handler.getErrorHistory().length) // 0
   * ```
   */
  clearErrorHistory() {
    this.errorHistory = []
  }

  /**
   * 获取最近的错误
   * 返回最近发生的一个错误，如果没有错误则返回null
   * 
   * @complexity O(1) - 常数时间复杂度，数组索引访问
   * @flow 历史数组检查 → 首个元素返回
   * 
   * @returns {InvitationError | null} 最近的错误对象或null
   * 
   * @example
   * ```typescript
   * const lastError = handler.getLastError()
   * if (lastError) {
   *   console.log(`最近错误: ${lastError.message}`)
   *   console.log(`错误类型: ${lastError.type}`)
   *   console.log(`是否可重试: ${lastError.retryable}`)
   * }
   * ```
   */
  getLastError(): InvitationError | null {
    return this.errorHistory[0] || null
  }

  /**
   * 检查是否有可重试的错误
   * 检查最近30秒内是否有可重试的错误发生
   * 
   * @complexity O(n) - n为错误历史数量，需要遍历检查时间戳
   * @flow 历史遍历 → 时间检查 → 重试属性检查
   * 
   * @returns {boolean} 如果有可重试的错误返回true
   * 
   * @example
   * ```typescript
   * if (handler.hasRetryableErrors()) {
   *   console.log('检测到可重试的错误，建议重试操作')
   *   const advice = handler.getRetryAdvice()
   *   console.log(advice)
   * }
   * ```
   */
  hasRetryableErrors(): boolean {
    return this.errorHistory.some(error => error.retryable && 
      Date.now() - error.timestamp! < 30000) // 30秒内的错误
  }

  /**
   * 获取重试建议
   * 基于最近的错误类型提供重试操作建议
   * 
   * @complexity O(1) - 常数时间复杂度，条件判断和字符串返回
   * @flow 最近错误获取 → 重试性检查 → 类型匹配 → 建议生成
   * 
   * @returns {string | null} 重试建议文本，如果不需要重试返回null
   * 
   * @example
   * ```typescript
   * const advice = handler.getRetryAdvice()
   * if (advice) {
   *   console.log('重试建议:', advice)
   *   // 可以显示给用户或用于自动重试逻辑
   * }
   * ```
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

/**
 * 创建全局错误处理器实例
 * 应用级别的邀请错误处理器单例，避免重复创建实例
 * 
 * @constant {InvitationErrorHandler} invitationErrorHandler
 * @example
 * ```typescript
 * import { invitationErrorHandler } from './invitationErrorHandler'
 * 
 * // 直接使用全局实例
 * invitationErrorHandler.handleNetworkError(error, context)
 * ```
 */
export const invitationErrorHandler = new InvitationErrorHandler()

/**
 * 邀请系统统一错误处理装饰器
 * 为函数添加自动错误处理能力，支持同步和异步函数
 * 
 * @complexity O(1) - 常数时间复杂度，函数包装
 * @flow 函数包装 → 错误捕获 → 处理器调用 → 错误重抛
 * 
 * @template T 被装饰函数的类型
 * @param {T} fn - 要装饰的函数
 * @param {InvitationError['type']} errorType - 默认错误类型，默认为'business'
 * @param {Record<string, any>} context - 错误处理上下文
 * @returns {T} 装饰后的函数
 * 
 * @example
 * ```typescript
 * const inviteUserWithErrorHandling = withInvitationErrorHandling(
 *   inviteUser,
 *   'business',
 *   { operation: 'user_invitation' }
 * )
 * 
 * // 使用装饰后的函数，错误会自动处理
 * try {
 *   await inviteUserWithErrorHandling(userData)
 * } catch (error) {
 *   // 错误已经被处理并显示给用户
 * }
 * ```
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
 * 便捷的邀请码验证错误处理函数
 * 
 * @complexity O(1) - 常数时间复杂度，直接调用验证错误处理器
 * @flow 参数包装 → 验证错误处理器调用
 * 
 * @param {any} error - 验证错误对象
 * @param {string} inviteCode - 可选的邀请码
 * @returns {InvitationError} 处理后的错误对象
 * 
 * @example
 * ```typescript
 * try {
 *   validateInviteCode('INVALID123')
 * } catch (error) {
 *   const handledError = handleInviteCodeValidation(error, 'INVALID123')
 *   console.log(handledError.message) // 用户友好的错误消息
 * }
 * ```
 */
export const handleInviteCodeValidation = (error: any, inviteCode?: string) => {
  return invitationErrorHandler.handleValidationError(error, { inviteCode, action: 'validation' })
}

/**
 * 快捷方法：处理邀请码注册
 * 便捷的邀请码注册错误处理函数
 * 
 * @complexity O(1) - 常数时间复杂度，直接调用业务错误处理器
 * @flow 上下文包装 → 业务错误处理器调用
 * 
 * @param {any} error - 注册错误对象
 * @param {any} context - 可选的注册上下文
 * @returns {InvitationError} 处理后的错误对象
 * 
 * @example
 * ```typescript
 * try {
 *   await registerWithInviteCode(userData, inviteCode)
 * } catch (error) {
 *   const handledError = handleInviteRegistration(error, {
 *     userData,
 *     inviteCode,
 *     step: 'registration'
 *   })
 * }
 * ```
 */
export const handleInviteRegistration = (error: any, context?: any) => {
  return invitationErrorHandler.handleBusinessError(error, { operation: 'registration', ...context })
}

/**
 * 快捷方法：处理邀请关系建立
 * 便捷的邀请关系建立错误处理函数
 * 
 * @complexity O(1) - 常数时间复杂度，直接调用业务错误处理器
 * @flow 上下文包装 → 业务错误处理器调用
 * 
 * @param {any} error - 关系建立错误对象
 * @param {any} context - 可选的关系上下文
 * @returns {InvitationError} 处理后的错误对象
 * 
 * @example
 * ```typescript
 * try {
 *   await establishInviteRelationship(inviterId, inviteeId)
 * } catch (error) {
 *   const handledError = handleInviteRelationship(error, {
 *     inviterId,
 *     inviteeId,
 *     relationshipType: 'referral'
 *   })
 * }
 * ```
 */
export const handleInviteRelationship = (error: any, context?: any) => {
  return invitationErrorHandler.handleBusinessError(error, { operation: 'relationship', ...context })
}

export default invitationErrorHandler