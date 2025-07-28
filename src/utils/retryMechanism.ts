/**
 * @fileoverview 网络重试机制工具模块
 * 为邀请系统和其他API调用提供智能重试、错误恢复和网络状况自适应功能
 * 包含指数退避重试、网络状态检测、连接质量评估和自适应配置等核心功能
 * 支持超时控制、错误分类、重试历史记录和装饰器模式封装
 * 
 * @module utils/retryMechanism
 * @author Frontend Team
 * @since 1.0.0
 */

/**
 * 重试配置接口
 * 定义重试机制的完整配置参数，支持自定义重试策略
 * 
 * @interface RetryConfig
 */
interface RetryConfig {
  /** 最大重试次数 */
  maxAttempts: number
  /** 基础延迟时间（毫秒） */
  baseDelay: number
  /** 延迟倍数（指数退避） */
  backoffMultiplier: number
  /** 最大延迟时间（毫秒） */
  maxDelay: number
  /** 是否启用抖动（随机化延迟） */
  enableJitter: boolean
  /** 可重试的错误类型 */
  retryableErrors: string[]
  /** 超时时间（毫秒） */
  timeout: number
}

/**
 * 重试上下文接口
 * 记录重试过程中的状态信息和历史记录
 * 
 * @interface RetryContext
 */
interface RetryContext {
  /** 当前尝试次数 */
  attempt: number
  /** 总耗时 */
  totalDuration: number
  /** 上次错误 */
  lastError?: Error
  /** 重试历史 */
  retryHistory: Array<{
    attempt: number
    error: Error
    delay: number
    timestamp: number
  }>
}

/**
 * 重试结果接口
 * 封装操作执行结果和重试上下文信息
 * 
 * @interface RetryResult
 * @template T 操作返回数据的类型
 */
interface RetryResult<T> {
  /** 执行结果 */
  data?: T
  /** 是否成功 */
  success: boolean
  /** 错误信息 */
  error?: Error
  /** 重试上下文 */
  context: RetryContext
}

/**
 * 默认重试配置常量
 * 提供通用的重试策略配置，适用于大多数网络操作
 * 
 * @constant {RetryConfig} DEFAULT_RETRY_CONFIG
 * @example
 * ```typescript
 * const retryMechanism = new RetryMechanism(DEFAULT_RETRY_CONFIG)
 * ```
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,
  backoffMultiplier: 2,
  maxDelay: 10000,
  enableJitter: true,
  retryableErrors: [
    'NetworkError',
    'TimeoutError',
    'AbortError',
    'fetch',
    'ECONNRESET',
    'ENOTFOUND',
    'ECONNREFUSED',
    'ETIMEDOUT'
  ],
  timeout: 30000
}

/**
 * 邀请系统特定的重试配置常量
 * 针对邀请操作的敏感性调整的重试策略，减少重试次数和缩短超时时间
 * 
 * @constant {RetryConfig} INVITATION_RETRY_CONFIG
 * @example
 * ```typescript
 * const inviteRetry = new RetryMechanism(INVITATION_RETRY_CONFIG)
 * ```
 */
export const INVITATION_RETRY_CONFIG: RetryConfig = {
  ...DEFAULT_RETRY_CONFIG,
  maxAttempts: 2, // 邀请操作较为敏感，减少重试次数
  baseDelay: 1500,
  timeout: 15000
}

/**
 * 网络重试机制类
 * 提供完整的网络重试功能，支持指数退避、超时控制和错误分类
 * 
 * @class RetryMechanism
 * @example
 * ```typescript
 * const retryMechanism = new RetryMechanism({
 *   maxAttempts: 3,
 *   baseDelay: 1000,
 *   backoffMultiplier: 2
 * })
 * 
 * const result = await retryMechanism.execute(async () => {
 *   return await fetch('/api/data')
 * })
 * ```
 */
export class RetryMechanism {
  private config: RetryConfig

  /**
   * 构造函数
   * 初始化重试机制实例，合并默认配置和自定义配置
   * 
   * @complexity O(1) - 常数时间复杂度，仅进行对象合并
   * @flow 配置合并 → 实例初始化
   * 
   * @param {Partial<RetryConfig>} config - 自定义重试配置，可选
   * 
   * @example
   * ```typescript
   * // 使用默认配置
   * const retry1 = new RetryMechanism()
   * 
   * // 自定义配置
   * const retry2 = new RetryMechanism({
   *   maxAttempts: 5,
   *   baseDelay: 2000
   * })
   * ```
   */
  constructor(config?: Partial<RetryConfig>) {
    this.config = { ...DEFAULT_RETRY_CONFIG, ...config }
  }

  /**
   * 执行带重试的异步操作
   * 核心重试方法，支持自定义配置和完整的错误处理
   * 
   * @complexity O(n) - n为最大重试次数，每次重试包含指数延迟
   * @flow 参数合并 → 循环重试 → 超时执行 → 错误检查 → 延迟计算 → 历史记录
   * 
   * @template T 操作返回值类型
   * @param {() => Promise<T>} operation - 要执行的异步操作函数
   * @param {Partial<RetryConfig>} customConfig - 自定义配置，可选
   * @returns {Promise<RetryResult<T>>} 执行结果包含数据、状态和上下文
   * 
   * @example
   * ```typescript
   * const result = await retryMechanism.execute(async () => {
   *   const response = await fetch('/api/users')
   *   if (!response.ok) throw new Error('Network error')
   *   return response.json()
   * })
   * 
   * if (result.success) {
   *   console.log('Data:', result.data)
   * } else {
   *   console.error('Failed after retries:', result.error)
   * }
   * ```
   */
  async execute<T>(
    operation: () => Promise<T>,
    customConfig?: Partial<RetryConfig>
  ): Promise<RetryResult<T>> {
    const config = { ...this.config, ...customConfig }
    const context: RetryContext = {
      attempt: 0,
      totalDuration: 0,
      retryHistory: []
    }

    const startTime = Date.now()

    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      context.attempt = attempt

      try {
        // 设置超时控制
        const result = await this.executeWithTimeout(operation, config.timeout)
        
        context.totalDuration = Date.now() - startTime
        return {
          data: result,
          success: true,
          context
        }
      } catch (error) {
        const currentError = error as Error
        context.lastError = currentError
        
        // 检查是否为可重试的错误
        if (!this.isRetryableError(currentError, config)) {
          context.totalDuration = Date.now() - startTime
          return {
            success: false,
            error: currentError,
            context
          }
        }

        // 如果是最后一次尝试，直接返回错误
        if (attempt === config.maxAttempts) {
          context.totalDuration = Date.now() - startTime
          return {
            success: false,
            error: currentError,
            context
          }
        }

        // 计算延迟时间
        const delay = this.calculateDelay(attempt, config)
        
        // 记录重试历史
        context.retryHistory.push({
          attempt,
          error: currentError,
          delay,
          timestamp: Date.now()
        })

        console.warn(`[RetryMechanism] 第${attempt}次尝试失败，${delay}ms后重试:`, currentError.message)

        // 等待延迟
        await this.delay(delay)
      }
    }

    // 理论上不应该到达这里
    context.totalDuration = Date.now() - startTime
    return {
      success: false,
      error: new Error('重试机制执行完毕但未返回结果'),
      context
    }
  }

  /**
   * 带超时的操作执行
   * 为异步操作添加超时控制，防止长时间挂起
   * 
   * @complexity O(1) - 常数时间复杂度，创建Promise包装
   * @flow Promise包装 → 超时定时器 → 操作执行 → 清理定时器
   * 
   * @template T 操作返回值类型
   * @param {() => Promise<T>} operation - 要执行的异步操作
   * @param {number} timeout - 超时时间（毫秒）
   * @returns {Promise<T>} 操作结果或超时错误
   * 
   * @private
   * @example
   * ```typescript
   * const result = await this.executeWithTimeout(
   *   () => fetch('/api/data'),
   *   5000 // 5秒超时
   * )
   * ```
   */
  private async executeWithTimeout<T>(
    operation: () => Promise<T>,
    timeout: number
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`操作超时 (${timeout}ms)`))
      }, timeout)

      operation()
        .then(result => {
          clearTimeout(timeoutId)
          resolve(result)
        })
        .catch(error => {
          clearTimeout(timeoutId)
          reject(error)
        })
    })
  }

  /**
   * 检查错误是否可重试
   * 根据错误类型和配置判断是否应该进行重试
   * 
   * @complexity O(n) - n为可重试错误类型数量，通常为常数
   * @flow 错误信息提取 → 错误类型检查 → 配置匹配 → 重试决策
   * 
   * @param {Error} error - 要检查的错误对象
   * @param {RetryConfig} config - 重试配置
   * @returns {boolean} 如果错误可重试返回true，否则返回false
   * 
   * @private
   * @example
   * ```typescript
   * const isRetryable = this.isRetryableError(
   *   new Error('NetworkError'),
   *   this.config
   * )
   * console.log(isRetryable) // true
   * ```
   */
  private isRetryableError(error: Error, config: RetryConfig): boolean {
    const errorMessage = error.message.toLowerCase()
    const errorName = error.name.toLowerCase()
    
    return config.retryableErrors.some(retryableError => 
      errorMessage.includes(retryableError.toLowerCase()) ||
      errorName.includes(retryableError.toLowerCase())
    )
  }

  /**
   * 计算延迟时间（指数退避 + 抖动）
   * 使用指数退避算法计算重试延迟，并可选择性添加随机抖动
   * 
   * @complexity O(1) - 常数时间复杂度，数学计算
   * @flow 指数计算 → 最大值限制 → 抖动添加 → 延迟返回
   * 
   * @param {number} attempt - 当前尝试次数（从1开始）
   * @param {RetryConfig} config - 重试配置
   * @returns {number} 计算出的延迟时间（毫秒）
   * 
   * @private
   * @example
   * ```typescript
   * // 第1次重试：1000ms
   * const delay1 = this.calculateDelay(1, config) // ~1000ms
   * // 第2次重试：2000ms + 抖动
   * const delay2 = this.calculateDelay(2, config) // ~2000-2200ms
   * // 第3次重试：4000ms + 抖动
   * const delay3 = this.calculateDelay(3, config) // ~4000-4400ms
   * ```
   */
  private calculateDelay(attempt: number, config: RetryConfig): number {
    // 指数退避计算
    const exponentialDelay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1)
    
    // 限制最大延迟
    const cappedDelay = Math.min(exponentialDelay, config.maxDelay)
    
    // 添加抖动（随机化）
    if (config.enableJitter) {
      const jitter = Math.random() * 0.1 * cappedDelay // 最多10%的抖动
      return Math.floor(cappedDelay + jitter)
    }
    
    return cappedDelay
  }

  /**
   * 延迟执行
   * 创建指定时间的延迟Promise，用于重试间隔控制
   * 
   * @complexity O(1) - 常数时间复杂度，Promise包装
   * @flow 延迟创建 → 定时器设置 → Promise解析
   * 
   * @param {number} ms - 延迟时间（毫秒）
   * @returns {Promise<void>} 延迟完成的Promise
   * 
   * @private
   * @example
   * ```typescript
   * await this.delay(2000) // 等待2秒
   * console.log('2秒后执行')
   * ```
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * 更新配置
   * 动态更新重试机制的配置参数
   * 
   * @complexity O(1) - 常数时间复杂度，对象合并
   * @flow 配置合并 → 实例更新
   * 
   * @param {Partial<RetryConfig>} newConfig - 新的配置参数
   * 
   * @example
   * ```typescript
   * retryMechanism.updateConfig({
   *   maxAttempts: 5,
   *   baseDelay: 2000
   * })
   * ```
   */
  updateConfig(newConfig: Partial<RetryConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  /**
   * 重置为默认配置
   * 将重试机制配置重置为系统默认值
   * 
   * @complexity O(1) - 常数时间复杂度，对象赋值
   * @flow 默认配置复制 → 实例重置
   * 
   * @example
   * ```typescript
   * retryMechanism.resetConfig()
   * console.log(retryMechanism.config) // 恢复为DEFAULT_RETRY_CONFIG
   * ```
   */
  resetConfig(): void {
    this.config = { ...DEFAULT_RETRY_CONFIG }
  }
}

/**
 * 创建专用于邀请系统的重试机制实例
 * 工厂函数，返回预配置的邀请系统重试机制
 * 
 * @complexity O(1) - 常数时间复杂度，实例创建
 * @flow 邀请配置加载 → 实例创建 → 返回
 * 
 * @returns {RetryMechanism} 配置了邀请系统参数的重试机制实例
 * 
 * @example
 * ```typescript
 * const inviteRetry = createInvitationRetryMechanism()
 * const result = await inviteRetry.execute(async () => {
 *   return await inviteUserAPI(userData)
 * })
 * ```
 */
export function createInvitationRetryMechanism(): RetryMechanism {
  return new RetryMechanism(INVITATION_RETRY_CONFIG)
}

/**
 * 快捷函数：执行带重试的操作
 * 便捷的重试操作封装，自动创建重试机制实例并执行操作
 * 
 * @complexity O(n) - n为重试次数，取决于操作成功率
 * @flow 实例创建 → 操作执行 → 结果处理 → 异常转换
 * 
 * @template T 操作返回值类型
 * @param {() => Promise<T>} operation - 要执行的异步操作
 * @param {Partial<RetryConfig>} config - 可选的重试配置
 * @returns {Promise<T>} 操作成功的结果
 * @throws {Error} 重试失败后抛出最后一次的错误
 * 
 * @example
 * ```typescript
 * try {
 *   const data = await retryOperation(async () => {
 *     const response = await fetch('/api/data')
 *     return response.json()
 *   }, { maxAttempts: 3 })
 *   console.log(data)
 * } catch (error) {
 *   console.error('操作失败:', error)
 * }
 * ```
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  config?: Partial<RetryConfig>
): Promise<T> {
  const retryMechanism = new RetryMechanism(config)
  const result = await retryMechanism.execute(operation)
  
  if (result.success) {
    return result.data!
  } else {
    throw result.error
  }
}

/**
 * 专用于邀请API的重试装饰器
 * 将现有的邀请API方法包装为支持重试的版本
 * 
 * @complexity O(n) - n为重试次数，取决于API调用成功率
 * @flow 重试机制创建 → 方法包装 → 参数传递 → 错误增强 → 结果返回
 * 
 * @template T 原方法参数类型数组
 * @template R 原方法返回值类型
 * @param {(...args: T) => Promise<R>} originalMethod - 要包装的原始方法
 * @returns {(...args: T) => Promise<R>} 包装后支持重试的方法
 * 
 * @example
 * ```typescript
 * // 原始邀请API方法
 * const inviteUser = async (userData: UserData) => {
 *   return await fetch('/api/invite', {
 *     method: 'POST',
 *     body: JSON.stringify(userData)
 *   })
 * }
 * 
 * // 包装为支持重试的方法
 * const inviteUserWithRetry = withInvitationRetry(inviteUser)
 * 
 * // 使用包装后的方法
 * try {
 *   const result = await inviteUserWithRetry(userData)
 *   console.log('邀请成功:', result)
 * } catch (error) {
 *   console.error('邀请失败:', error.message)
 * }
 * ```
 */
export function withInvitationRetry<T extends any[], R>(
  originalMethod: (...args: T) => Promise<R>
): (...args: T) => Promise<R> {
  const retryMechanism = createInvitationRetryMechanism()
  
  return async (...args: T): Promise<R> => {
    const result = await retryMechanism.execute(() => originalMethod(...args))
    
    if (result.success) {
      return result.data!
    } else {
      // 增强错误信息
      const enhancedError = new Error(
        `邀请操作失败 (尝试${result.context.attempt}次): ${result.error?.message}`
      )
      enhancedError.cause = result.error
      throw enhancedError
    }
  }
}

/**
 * 网络状态检测类
 * 提供网络连接状态监控和连接质量评估功能
 * 
 * @class NetworkStatusDetector
 * @example
 * ```typescript
 * const detector = new NetworkStatusDetector()
 * console.log(detector.isOnline()) // true/false
 * 
 * const unsubscribe = detector.onStatusChange((online) => {
 *   console.log('网络状态:', online ? '在线' : '离线')
 * })
 * ```
 */
export class NetworkStatusDetector {
  private online: boolean = navigator.onLine
  private listeners: Array<(online: boolean) => void> = []

  /**
   * 构造函数
   * 初始化网络状态检测器并设置事件监听
   * 
   * @complexity O(1) - 常数时间复杂度，事件监听器设置
   * @flow 初始状态获取 → 事件监听器设置 → 实例初始化
   */
  constructor() {
    this.setupEventListeners()
  }

  /**
   * 设置网络状态事件监听器
   * 监听浏览器的online和offline事件
   * 
   * @complexity O(1) - 常数时间复杂度，事件绑定
   * @flow online事件绑定 → offline事件绑定 → 监听器通知
   * 
   * @private
   */
  private setupEventListeners() {
    window.addEventListener('online', () => {
      this.online = true
      this.notifyListeners()
    })

    window.addEventListener('offline', () => {
      this.online = false
      this.notifyListeners()
    })
  }

  /**
   * 获取当前网络状态
   * 返回当前的网络连接状态
   * 
   * @complexity O(1) - 常数时间复杂度，属性访问
   * @flow 状态返回
   * 
   * @returns {boolean} 如果网络在线返回true，否则返回false
   * 
   * @example
   * ```typescript
   * if (detector.isOnline()) {
   *   console.log('网络正常，可以发送请求')
   * } else {
   *   console.log('网络断开，请检查连接')
   * }
   * ```
   */
  isOnline(): boolean {
    return this.online
  }

  /**
   * 添加网络状态变化监听器
   * 注册网络状态变化的回调函数
   * 
   * @complexity O(1) - 常数时间复杂度，数组添加
   * @flow 监听器添加 → 取消函数返回
   * 
   * @param {(online: boolean) => void} callback - 状态变化回调函数
   * @returns {() => void} 取消监听的函数
   * 
   * @example
   * ```typescript
   * const unsubscribe = detector.onStatusChange((online) => {
   *   if (online) {
   *     console.log('网络已恢复')
   *   } else {
   *     console.log('网络已断开')
   *   }
   * })
   * 
   * // 取消监听
   * unsubscribe()
   * ```
   */
  onStatusChange(callback: (online: boolean) => void): () => void {
    this.listeners.push(callback)
    
    // 返回取消监听的函数
    return () => {
      const index = this.listeners.indexOf(callback)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  /**
   * 通知所有监听器
   * 向所有注册的监听器发送网络状态变化通知
   * 
   * @complexity O(n) - n为监听器数量
   * @flow 监听器遍历 → 回调执行
   * 
   * @private
   */
  private notifyListeners() {
    this.listeners.forEach(callback => callback(this.online))
  }

  /**
   * 检测网络连接质量
   * 获取网络连接的性能指标，包括延迟和带宽信息
   * 
   * @complexity O(1) - 常数时间复杂度，API调用或单次网络请求
   * @flow API检查 → 连接信息获取 → 降级测试 → 质量评估
   * 
   * @returns {Promise<{rtt: number, downlink: number, effectiveType: string}>} 连接质量信息
   * 
   * @example
   * ```typescript
   * const quality = await detector.checkConnectionQuality()
   * console.log(`延迟: ${quality.rtt}ms`)
   * console.log(`带宽: ${quality.downlink}Mbps`)
   * console.log(`连接类型: ${quality.effectiveType}`)
   * 
   * if (quality.rtt > 1000) {
   *   console.log('网络较慢，建议增加重试次数')
   * }
   * ```
   */
  async checkConnectionQuality(): Promise<{
    rtt: number // 往返时间
    downlink: number // 下行带宽
    effectiveType: string // 有效连接类型
  }> {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      return {
        rtt: connection.rtt || 0,
        downlink: connection.downlink || 0,
        effectiveType: connection.effectiveType || 'unknown'
      }
    }

    // 降级方案：通过请求小文件测试延迟
    const startTime = Date.now()
    try {
      await fetch('/favicon.ico', { 
        method: 'HEAD',
        cache: 'no-cache'
      })
      const rtt = Date.now() - startTime
      
      return {
        rtt,
        downlink: 1, // 默认值
        effectiveType: rtt < 100 ? 'fast' : rtt < 500 ? 'moderate' : 'slow'
      }
    } catch {
      return {
        rtt: 999999,
        downlink: 0,
        effectiveType: 'offline'
      }
    }
  }
}

/**
 * 全局网络状态检测器实例
 * 应用级别的网络状态检测器单例，避免重复创建实例
 * 
 * @constant {NetworkStatusDetector} networkStatusDetector
 * @example
 * ```typescript
 * import { networkStatusDetector } from './retryMechanism'
 * 
 * if (networkStatusDetector.isOnline()) {
 *   // 执行网络操作
 * }
 * ```
 */
export const networkStatusDetector = new NetworkStatusDetector()

/**
 * 根据网络状况自动调整重试配置
 * 基于当前网络质量动态生成最优的重试配置参数
 * 
 * @complexity O(1) - 常数时间复杂度，配置对象创建
 * @flow 网络质量检测 → 条件判断 → 配置调整 → 配置返回
 * 
 * @returns {Promise<RetryConfig>} 根据网络状况优化的重试配置
 * 
 * @example
 * ```typescript
 * const adaptiveConfig = await getAdaptiveRetryConfig()
 * const retryMechanism = new RetryMechanism(adaptiveConfig)
 * 
 * // 网络较慢时会自动增加重试次数和延迟
 * // 网络良好时会减少重试次数提高响应速度
 * const result = await retryMechanism.execute(someOperation)
 * ```
 */
export async function getAdaptiveRetryConfig(): Promise<RetryConfig> {
  const connectionQuality = await networkStatusDetector.checkConnectionQuality()
  
  if (connectionQuality.effectiveType === 'offline') {
    return {
      ...INVITATION_RETRY_CONFIG,
      maxAttempts: 1,
      baseDelay: 5000
    }
  }
  
  if (connectionQuality.rtt > 1000 || connectionQuality.effectiveType === 'slow') {
    return {
      ...INVITATION_RETRY_CONFIG,
      maxAttempts: 4,
      baseDelay: 3000,
      maxDelay: 15000
    }
  }
  
  if (connectionQuality.rtt < 100 && connectionQuality.effectiveType === 'fast') {
    return {
      ...INVITATION_RETRY_CONFIG,
      maxAttempts: 2,
      baseDelay: 500,
      maxDelay: 5000
    }
  }
  
  return INVITATION_RETRY_CONFIG
}