/**
 * 网络重试机制工具
 * 为邀请系统API调用提供智能重试和错误恢复能力
 */

export interface RetryConfig {
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

export interface RetryContext {
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

export interface RetryResult<T> {
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
 * 默认重试配置
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
 * 邀请系统特定的重试配置
 */
export const INVITATION_RETRY_CONFIG: RetryConfig = {
  ...DEFAULT_RETRY_CONFIG,
  maxAttempts: 2, // 邀请操作较为敏感，减少重试次数
  baseDelay: 1500,
  timeout: 15000
}

/**
 * 网络重试机制类
 */
export class RetryMechanism {
  private config: RetryConfig

  constructor(config: Partial<RetryConfig> = {}) {
    this.config = { ...DEFAULT_RETRY_CONFIG, ...config }
  }

  /**
   * 执行带重试的异步操作
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
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<RetryConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  /**
   * 重置为默认配置
   */
  resetConfig(): void {
    this.config = { ...DEFAULT_RETRY_CONFIG }
  }
}

/**
 * 创建专用于邀请系统的重试机制实例
 */
export function createInvitationRetryMechanism(): RetryMechanism {
  return new RetryMechanism(INVITATION_RETRY_CONFIG)
}

/**
 * 快捷函数：执行带重试的操作
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
 * 网络状态检测
 */
export class NetworkStatusDetector {
  private online: boolean = navigator.onLine
  private listeners: Array<(online: boolean) => void> = []

  constructor() {
    this.setupEventListeners()
  }

  private setupEventListeners(): void {
    window.addEventListener('online', () => {
      this.online = true
      this.notifyListeners()
    })

    window.addEventListener('offline', () => {
      this.online = false
      this.notifyListeners()
    })
  }

  isOnline(): boolean {
    return this.online
  }

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

  private notifyListeners(): void {
    this.listeners.forEach(callback => callback(this.online))
  }

  /**
   * 检测网络连接质量
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
 */
export const networkStatusDetector = new NetworkStatusDetector()

/**
 * 根据网络状况自动调整重试配置
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