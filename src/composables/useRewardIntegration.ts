/**
 * @fileoverview 奖励系统集成组合式API模块
 * 提供客资审核与奖励系统的完整集成功能，包括奖励计算、创建、批量处理、重试机制等
 * 
 * @module composables/useRewardIntegration
 * @requires vue
 * @requires @/components/ui/toast/use-toast
 * @requires @/api/reward
 * @requires @/types/lead
 * @requires @/types/leadAudit
 */

import { ref, reactive, computed } from 'vue'
import { useToast } from '@/components/ui/toast/use-toast'
import { rewardApi } from '@/api/reward'
import type { Lead } from '@/types/lead'
import type { AuditDecision } from '@/types/leadAudit'

/**
 * 奖励创建结果接口
 */
export interface RewardCreationResult {
  leadId: string
  success: boolean
  rewardId?: string
  rewardAmount?: number
  rewardType?: string
  eligibleForBonus?: boolean
  error?: string
  retryCount?: number
}

/**
 * 奖励计算结果接口
 */
export interface RewardCalculation {
  baseReward: number
  bonusReward: number
  totalReward: number
  calculation: {
    baseAmount: number
    sourceMultiplier: number
    qualityBonus: number
    finalAmount: number
  }
}

/**
 * 奖励规则接口
 */
export interface RewardRules {
  baseRewardAmount: number
  bonusMultiplier: number
  qualityThreshold: number
  sourceMultipliers: Record<string, number>
}

/**
 * 奖励集成状态接口
 */
export interface RewardIntegrationState {
  // 奖励创建状态
  creatingReward: boolean
  batchCreatingRewards: boolean
  
  // 奖励规则
  rules: RewardRules | null
  rulesLoading: boolean
  
  // 批量处理进度
  batchProgress: {
    total: number
    completed: number
    failed: number
    current: Lead | null
  }
  
  // 重试配置
  maxRetries: number
  retryDelay: number
  
  // 错误状态
  error: string | null
  lastErrorTime: number | null
}

/**
 * 奖励系统集成选项
 */
export interface RewardIntegrationOptions {
  enableAutoReward?: boolean
  showSuccessToast?: boolean
  showErrorToast?: boolean
  maxRetries?: number
  retryDelay?: number
  onRewardCreated?: (result: RewardCreationResult) => void
  onRewardFailed?: (error: Error, lead: Lead) => void
  onBatchProgress?: (progress: { completed: number; total: number; current?: Lead }) => void
}

/**
 * 奖励系统集成组合式API
 * 提供客资审核与奖励系统的完整集成功能，包括奖励计算、创建、批量处理和重试机制
 * 
 * @complexity O(1) - 初始化为常数时间，具体操作复杂度取决于调用的方法
 * @flow
 * 1. 初始化状态管理和配置参数
 * 2. 设置奖励创建的回调和错误处理
 * 3. 提供单个和批量奖励创建功能
 * 4. 支持重试机制和进度追踪
 * 
 * @example
 * ```typescript
 * // 基础使用
 * const {
 *   state,
 *   isProcessing,
 *   createLeadReward,
 *   batchCreateLeadRewards,
 *   fetchRewardRules
 * } = useRewardIntegration({
 *   enableAutoReward: true,
 *   showSuccessToast: true,
 *   maxRetries: 3,
 *   onRewardCreated: (result) => {
 *     console.log('奖励创建成功:', result)
 *   }
 * })
 * 
 * // 创建单个奖励
 * const result = await createLeadReward(
 *   leadData,
 *   { action: 'APPROVE', comment: '审核通过' },
 *   'auditor123'
 * )
 * 
 * // 批量创建奖励
 * const results = await batchCreateLeadRewards(
 *   leadsArray,
 *   { action: 'APPROVE', comment: '批量通过' },
 *   'auditor123'
 * )
 * ```
 * 
 * @param options - 奖励集成配置选项
 * @returns 奖励集成相关的状态、计算属性和操作方法
 */
export function useRewardIntegration(options: RewardIntegrationOptions = {}) {
  const { toast } = useToast()
  
  // 状态管理
  const state = reactive<RewardIntegrationState>({
    creatingReward: false,
    batchCreatingRewards: false,
    rules: null,
    rulesLoading: false,
    batchProgress: {
      total: 0,
      completed: 0,
      failed: 0,
      current: null
    },
    maxRetries: options.maxRetries || 3,
    retryDelay: options.retryDelay || 1000,
    error: null,
    lastErrorTime: null
  })
  
  /**
   * 是否正在处理中计算属性
   * 检查是否有任何奖励相关的处理在进行中
   * 
   * @complexity O(1) - 简单的布尔逻辑判断
   * @flow
   * 1. 检查单个奖励创建状态
   * 2. 检查批量奖励创建状态
   * 3. 检查规则加载状态
   * 4. 返回任意状态为true的结果
   * 
   * @example
   * ```typescript
   * // 在UI中显示加载状态
   * if (isProcessing.value) {
   *   console.log('正在处理奖励相关操作...')
   * }
   * 
   * // 禁用按钮在处理期间
   * const buttonDisabled = isProcessing.value
   * ```
   * 
   * @returns 是否正在处理中
   */
  const isProcessing = computed(() => {
    return state.creatingReward || state.batchCreatingRewards || state.rulesLoading
  })
  
  /**
   * 批量处理进度百分比计算属性
   * 计算当前批量处理的完成百分比
   * 
   * @complexity O(1) - 简单的数学计算
   * @flow
   * 1. 检查总任务数量是否为0
   * 2. 如果为0则返回0百分比
   * 3. 计算完成数量/总数量的百分比
   * 4. 四舍五入到整数
   * 
   * @example
   * ```typescript
   * // 显示进度条
   * const progress = batchProgressPercentage.value
   * console.log(`批量处理进度: ${progress}%`)
   * 
   * // 在UI中使用
   * <progress :value="progress" max="100">{progress}%</progress>
   * ```
   * 
   * @returns 进度百分比（0-100）
   */
  const batchProgressPercentage = computed(() => {
    if (state.batchProgress.total === 0) return 0
    return Math.round((state.batchProgress.completed / state.batchProgress.total) * 100)
  })
  
  /**
   * 是否有错误计算属性
   * 检查当前是否存在错误状态
   * 
   * @complexity O(1) - 简单的null检查
   * @flow
   * 1. 检查状态中的error字段
   * 2. 返回是否不为null的布尔结果
   * 
   * @example
   * ```typescript
   * // 显示错误信息
   * if (hasError.value) {
   *   console.error('奖励处理出现错误:', state.error)
   * }
   * 
   * // 条件渲染错误提示
   * const showErrorMessage = hasError.value
   * ```
   * 
   * @returns 是否存在错误
   */
  const hasError = computed(() => {
    return state.error !== null
  })
  
  /**
   * 获取奖励规则
   * 从后端获取客资奖励规则，带有缓存机制和错误处理
   * 
   * @complexity O(1) - API调用的时间复杂度主要取决于网络延迟
   * @flow
   * 1. 检查是否已有缓存的规则，有则直接返回
   * 2. 设置加载状态和清除错误
   * 3. 调用API获取奖励规则
   * 4. 缓存获取的规则数据
   * 5. 错误处理：记录错误信息和时间
   * 6. 清理加载状态
   * 
   * @example
   * ```typescript
   * // 获取奖励规则
   * const rules = await fetchRewardRules()
   * if (rules) {
   *   console.log('基础奖励:', rules.baseRewardAmount)
   *   console.log('奖励倍数:', rules.bonusMultiplier)
   * }
   * 
   * // 在组件初始化时获取
   * onMounted(async () => {
   *   try {
   *     await fetchRewardRules()
   *   } catch (error) {
   *     console.error('获取规则失败:', error)
   *   }
   * })
   * ```
   * 
   * @returns Promise<RewardRules | null> - 奖励规则对象或null
   */
  async function fetchRewardRules(): Promise<RewardRules | null> {
    if (state.rules) {
      return state.rules
    }
    
    state.rulesLoading = true
    state.error = null
    
    try {
      const rules = await rewardApi.getLeadRewardRules()
      state.rules = rules
      return rules
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取奖励规则失败'
      state.error = errorMessage
      state.lastErrorTime = Date.now()
      console.error('[奖励集成] 获取奖励规则失败:', error)
      return null
    } finally {
      state.rulesLoading = false
    }
  }
  
  /**
   * 计算客资奖励
   * 基于客资信息计算应得的奖励金额，包括基础奖励和质量奖励
   * 
   * @complexity O(1) - API调用的时间复杂度主要取决于网络延迟
   * @flow
   * 1. 提取客资的关键信息（来源、销售、价值、质量评分）
   * 2. 调用API进行奖励计算
   * 3. 返回详细的计算结果
   * 4. 错误处理：记录错误并返回null
   * 
   * @example
   * ```typescript
   * // 计算客资奖励
   * const calculation = await calculateLeadReward(leadData)
   * if (calculation) {
   *   console.log('基础奖励:', calculation.baseReward)
   *   console.log('奖励奖励:', calculation.bonusReward)
   *   console.log('总奖励:', calculation.totalReward)
   *   console.log('计算细节:', calculation.calculation)
   * }
   * 
   * // 在审核前预览奖励
   * const previewReward = async (lead) => {
   *   const calc = await calculateLeadReward(lead)
   *   return calc?.totalReward || 0
   * }
   * ```
   * 
   * @param lead - 客资对象，包含所有计算所需的信息
   * @returns Promise<RewardCalculation | null> - 奖励计算结果或null
   */
  async function calculateLeadReward(lead: Lead): Promise<RewardCalculation | null> {
    try {
      const calculation = await rewardApi.calculateLeadReward({
        source: lead.source,
        salespersonId: lead.salespersonId,
        leadValue: lead.estimatedValue,
        qualityScore: lead.qualityScore
      })
      
      return calculation
    } catch (error) {
      console.error('[奖励集成] 计算奖励失败:', error)
      return null
    }
  }
  
  /**
   * 处理奖励创建成功
   * 处理奖励创建成功后的后续操作，包括显示提示和调用回调
   * 
   * @complexity O(1) - 简单的同步操作
   * @flow
   * 1. 检查是否允许显示成功提示
   * 2. 显示包含客资名称和奖励金额的成功消息
   * 3. 调用用户配置的成功回调函数
   * 
   * @example
   * ```typescript
   * // 成功处理示例
   * const result = {
   *   leadId: 'lead123',
   *   success: true,
   *   rewardAmount: 100.50,
   *   rewardId: 'reward456'
   * }
   * const lead = { id: 'lead123', name: '张三' }
   * 
   * handleRewardSuccess(result, lead)
   * // 会显示: "为客资 "张三" 创建了 ¥100.50 的奖励"
   * ```
   * 
   * @param result - 奖励创建结果
   * @param lead - 客资对象
   */
  function handleRewardSuccess(result: RewardCreationResult, lead: Lead) {
    // 显示成功提示
    if (options.showSuccessToast !== false) {
      toast({
        title: '奖励创建成功',
        description: `为客资 "${lead.name}" 创建了 ¥${result.rewardAmount} 的奖励`,
        variant: 'default'
      })
    }
    
    // 调用成功回调
    if (options.onRewardCreated) {
      options.onRewardCreated(result)
    }
  }
  
  /**
   * 处理奖励创建失败
   * 处理奖励创建失败后的后续操作，包括状态更新、错误提示和回调
   * 
   * @complexity O(1) - 简单的同步操作
   * @flow
   * 1. 更新错误状态和时间戳
   * 2. 记录错误日志
   * 3. 检查是否允许显示错误提示
   * 4. 显示包含客资名称和错误信息的失败消息
   * 5. 调用用户配置的失败回调函数
   * 
   * @example
   * ```typescript
   * // 失败处理示例
   * const error = new Error('用户权限不足')
   * const lead = { id: 'lead123', name: '李四' }
   * 
   * handleRewardError(error, lead)
   * // 会显示: "客资 "李四" 的奖励创建失败: 用户权限不足"
   * ```
   * 
   * @param error - 错误对象
   * @param lead - 客资对象
   */
  function handleRewardError(error: Error, lead: Lead) {
    state.error = error.message
    state.lastErrorTime = Date.now()
    
    console.error('[奖励集成] 奖励创建失败:', error)
    
    // 显示错误提示
    if (options.showErrorToast !== false) {
      toast({
        title: '奖励创建失败',
        description: `客资 "${lead.name}" 的奖励创建失败: ${error.message}`,
        variant: 'destructive'
      })
    }
    
    // 调用错误回调
    if (options.onRewardFailed) {
      options.onRewardFailed(error, lead)
    }
  }
  
  /**
   * 延迟执行工具函数
   * 创建一个指定延迟时间的Promise，用于控制执行节奏
   * 
   * @complexity O(1) - 定时器设置为常数时间操作
   * @flow
   * 1. 创建新的Promise
   * 2. 使用setTimeout设置延迟
   * 3. 在指定时间后解决Promise
   * 
   * @example
   * ```typescript
   * // 延迟1秒执行
   * await delay(1000)
   * console.log('1秒后执行')
   * 
   * // 在重试前添加延迟
   * for (let i = 0; i < 3; i++) {
   *   try {
   *     await apiCall()
   *     break
   *   } catch (error) {
   *     if (i < 2) await delay(1000 * (i + 1)) // 指数退记
   *   }
   * }
   * ```
   * 
   * @param ms - 延迟时间（毫秒）
   * @returns Promise<void> - 在指定时间后解决的Promise
   */
  function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
  
  /**
   * 带重试的奖励创建
   * 使用指数退记策略重试奖励创建，提高成功率
   * 
   * @complexity O(n) - n为最大重试次数，每次重试都有延迟
   * @flow
   * 1. 初始化重试参数和错误记录
   * 2. 循环执行重试逻辑（最多maxRetries+1次）
   * 3. 在非首次尝试前添加指数退记延迟
   * 4. 调用API创建奖励
   * 5. 成功则返回结果，失败则检查是否可重试
   * 6. 不可重试或达到最大次数则结束重试
   * 7. 返回最终的失败结果
   * 
   * @example
   * ```typescript
   * // 创建带重试的奖励
   * const result = await createRewardWithRetry(leadData, {
   *   action: 'APPROVE',
   *   auditorId: 'auditor123'
   * })
   * 
   * if (result.success) {
   *   console.log('奖励创建成功，重试次数:', result.retryCount)
   * } else {
   *   console.error('奖励创建失败:', result.error)
   * }
   * ```
   * 
   * @param lead - 客资对象
   * @param auditResult - 审核结果，包含操作类型和审核员ID
   * @returns Promise<RewardCreationResult> - 奖励创建结果（成功或失败）
   */
  async function createRewardWithRetry(
    lead: Lead, 
    auditResult: {
      action: 'APPROVE' | 'REJECT'
      auditorId: string
    }
  ): Promise<RewardCreationResult> {
    let lastError: Error
    let retryCount = 0
    
    for (let attempt = 0; attempt <= state.maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          retryCount = attempt
          await delay(state.retryDelay * attempt) // 指数退避
        }
        
        const result = await rewardApi.createLeadAuditReward(lead.id, {
          action: auditResult.action,
          salespersonId: lead.salespersonId,
          auditorId: auditResult.auditorId,
          leadSource: lead.source,
          leadValue: lead.estimatedValue
        })
        
        return {
          leadId: lead.id,
          success: true,
          rewardId: result.rewardId,
          rewardAmount: result.rewardAmount,
          rewardType: result.rewardType,
          eligibleForBonus: result.eligibleForBonus,
          retryCount
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('奖励创建失败')
        
        // 如果是最后一次尝试，或者是不可重试的错误，直接抛出
        if (attempt === state.maxRetries || isNonRetryableError(error)) {
          break
        }
        
        console.warn(`[奖励集成] 奖励创建失败，准备重试 (${attempt + 1}/${state.maxRetries}):`, error)
      }
    }
    
    return {
      leadId: lead.id,
      success: false,
      error: lastError!.message,
      retryCount
    }
  }
  
  /**
   * 判断是否为不可重试的错误
   * 根据错误类型和信息判断是否应该停止重试
   * 
   * @complexity O(1) - 简单的状态码检查和字符串匹配
   * @flow
   * 1. 检查HTTP状态码（400、401、403为不可重试）
   * 2. 检查错误信息中是否包含不可重试关键词
   * 3. 返回是否为不可重试错误
   * 
   * @example
   * ```typescript
   * // 检查不同类型的错误
   * const error400 = { status: 400, message: 'Invalid request' }
   * console.log(isNonRetryableError(error400)) // true
   * 
   * const error500 = { status: 500, message: 'Server error' }
   * console.log(isNonRetryableError(error500)) // false
   * 
   * const duplicateError = { message: 'Duplicate reward detected' }
   * console.log(isNonRetryableError(duplicateError)) // true
   * 
   * const networkError = { message: 'Network timeout' }
   * console.log(isNonRetryableError(networkError)) // false
   * ```
   * 
   * @param error - 错误对象，可能包含status和message属性
   * @returns 是否为不可重试的错误
   */
  function isNonRetryableError(error: any): boolean {
    // 业务逻辑错误、权限错误等不应该重试
    if (error?.status === 400 || error?.status === 401 || error?.status === 403) {
      return true
    }
    
    // 包含特定关键词的错误不重试
    const nonRetryableKeywords = ['duplicate', 'invalid', 'permission', 'rule']
    const errorMessage = error?.message?.toLowerCase() || ''
    
    return nonRetryableKeywords.some(keyword => errorMessage.includes(keyword))
  }
  
  /**
   * 创建单个客资奖励
   * 为审核通过的单个客资创建奖励，包含完整的错误处理和状态管理
   * 
   * @complexity O(1) + O(retry) - 基础操作加上可能的重试次数
   * @flow
   * 1. 检查审核结果：只有APPROVE才创建奖励
   * 2. 检查自动奖励配置：禁用则返回null
   * 3. 防重复检查：正在创建中则返回null
   * 4. 设置加载状态和清除错误
   * 5. 调用带重试的创建方法
   * 6. 根据结果调用成功或失败处理函数
   * 7. 清理加载状态并返回结果
   * 
   * @example
   * ```typescript
   * // 创建单个奖励
   * const result = await createLeadReward(
   *   {
   *     id: 'lead123',
   *     name: '张三',
   *     salespersonId: 'sales001',
   *     source: 'WeChat',
   *     estimatedValue: 10000
   *   },
   *   { action: 'APPROVE', comment: '客资质量好' },
   *   'auditor123'
   * )
   * 
   * if (result?.success) {
   *   console.log('奖励创建成功:', result.rewardAmount)
   * } else if (result) {
   *   console.error('奖励创建失败:', result.error)
   * } else {
   *   console.log('未创建奖励（未通过审核或禁用自动奖励）')
   * }
   * ```
   * 
   * @param lead - 客资对象
   * @param auditDecision - 审核决定，包含操作类型和评论
   * @param auditorId - 审核员ID
   * @returns Promise<RewardCreationResult | null> - 奖励创建结果或null
   */
  async function createLeadReward(
    lead: Lead, 
    auditDecision: AuditDecision,
    auditorId: string
  ): Promise<RewardCreationResult | null> {
    // 只有审核通过才创建奖励
    if (auditDecision.action !== 'APPROVE') {
      return null
    }
    
    // 检查是否启用自动奖励
    if (options.enableAutoReward === false) {
      return null
    }
    
    if (state.creatingReward) {
      console.warn('[奖励集成] 正在创建奖励中，忽略重复操作')
      return null
    }
    
    state.creatingReward = true
    state.error = null
    
    try {
      const result = await createRewardWithRetry(lead, {
        action: auditDecision.action,
        auditorId
      })
      
      if (result.success) {
        handleRewardSuccess(result, lead)
      } else {
        const error = new Error(result.error || '奖励创建失败')
        handleRewardError(error, lead)
      }
      
      return result
    } catch (error) {
      const rewardError = error instanceof Error ? error : new Error('奖励创建失败')
      handleRewardError(rewardError, lead)
      
      return {
        leadId: lead.id,
        success: false,
        error: rewardError.message
      }
    } finally {
      state.creatingReward = false
    }
  }
  
  /**
   * 批量创建客资奖励
   * 为多个审核通过的客资批量创建奖励，包含进度追踪和统计信息
   * 
   * @complexity O(n) - n为客资数量，每个客资都需要独立的API调用
   * @flow
   * 1. 检查审核结果：只有APPROVE才处理
   * 2. 检查自动奖励配置和防重复检查
   * 3. 初始化批量处理状态和进度计数器
   * 4. 遍历客资列表，为每个客资执行奖励创建
   * 5. 更新进度状态和通知进度回调
   * 6. 收集所有结果并统计成功/失败数量
   * 7. 显示批量处理结果提示
   * 8. 清理批量处理状态
   * 
   * @example
   * ```typescript
   * // 批量创建奖励
   * const leadsToReward = [
   *   { id: 'lead1', name: '客户A', salespersonId: 'sales1' },
   *   { id: 'lead2', name: '客户B', salespersonId: 'sales2' },
   *   { id: 'lead3', name: '客户C', salespersonId: 'sales1' }
   * ]
   * 
   * const results = await batchCreateLeadRewards(
   *   leadsToReward,
   *   { action: 'APPROVE', comment: '批量通过审核' },
   *   'auditor123'
   * )
   * 
   * const successCount = results.filter(r => r.success).length
   * const failedCount = results.filter(r => !r.success).length
   * console.log(`批量处理完成: 成功${successCount}个，失败${failedCount}个`)
   * ```
   * 
   * @param leads - 客资数组
   * @param auditDecision - 审核决定，包含操作类型和评论
   * @param auditorId - 审核员ID
   * @returns Promise<RewardCreationResult[]> - 所有奖励创建结果数组
   * @throws {Error} - 正在执行批量操作时抛出错误
   */
  async function batchCreateLeadRewards(
    leads: Lead[],
    auditDecision: AuditDecision,
    auditorId: string
  ): Promise<RewardCreationResult[]> {
    // 只处理审核通过的客资
    if (auditDecision.action !== 'APPROVE') {
      return []
    }
    
    // 检查是否启用自动奖励
    if (options.enableAutoReward === false) {
      return []
    }
    
    if (state.batchCreatingRewards) {
      throw new Error('正在执行批量奖励创建，请稍后重试')
    }
    
    // 初始化批量处理状态
    state.batchCreatingRewards = true
    state.batchProgress = {
      total: leads.length,
      completed: 0,
      failed: 0,
      current: null
    }
    state.error = null
    
    const results: RewardCreationResult[] = []
    
    try {
      for (const lead of leads) {
        state.batchProgress.current = lead
        
        // 通知进度
        if (options.onBatchProgress) {
          options.onBatchProgress({
            completed: state.batchProgress.completed,
            total: state.batchProgress.total,
            current: lead
          })
        }
        
        try {
          const result = await createRewardWithRetry(lead, {
            action: auditDecision.action,
            auditorId
          })
          
          results.push(result)
          
          if (result.success) {
            state.batchProgress.completed++
          } else {
            state.batchProgress.failed++
          }
          
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '奖励创建失败'
          results.push({
            leadId: lead.id,
            success: false,
            error: errorMessage
          })
          
          state.batchProgress.failed++
          console.error(`[奖励集成] 客资 ${lead.id} 奖励创建失败:`, error)
        }
        
        // 添加小延迟避免请求过于频繁
        await delay(200)
      }
      
      // 显示批量处理结果
      const successCount = state.batchProgress.completed
      const failedCount = state.batchProgress.failed
      
      if (options.showSuccessToast !== false) {
        if (failedCount === 0) {
          toast({
            title: '批量奖励创建完成',
            description: `成功为 ${successCount} 条客资创建奖励`,
            variant: 'default'
          })
        } else {
          toast({
            title: '批量奖励创建完成',
            description: `成功 ${successCount} 条，失败 ${failedCount} 条`,
            variant: 'default'
          })
        }
      }
      
      return results
      
    } catch (error) {
      const batchError = error instanceof Error ? error : new Error('批量奖励创建失败')
      handleRewardError(batchError, leads[0])
      throw batchError
    } finally {
      state.batchCreatingRewards = false
      state.batchProgress.current = null
    }
  }
  
  /**
   * 清除错误状态
   * 清除当前的错误信息和错误时间戳
   * 
   * @complexity O(1) - 简单的状态更新操作
   * @flow
   * 1. 将错误信息设为null
   * 2. 将错误时间戳设为null
   * 
   * @example
   * ```typescript
   * // 清除错误后重新尝试
   * if (hasError.value) {
   *   clearError()
   *   await createLeadReward(leadData, auditDecision, auditorId)
   * }
   * 
   * // 在重新操作前清除错误
   * const handleRetry = () => {
   *   clearError()
   *   // 重新执行操作
   * }
   * ```
   */
  function clearError() {
    state.error = null
    state.lastErrorTime = null
  }
  
  /**
   * 重置所有状态
   * 将所有奖励集成状态重置为初始值
   * 
   * @complexity O(1) - 状态重置为常数时间操作
   * @flow
   * 1. 重置所有加载状态为false
   * 2. 重置批量处理进度为初始值
   * 3. 清除错误信息和时间戳
   * 
   * @example
   * ```typescript
   * // 在组件卸载时重置状态
   * onBeforeUnmount(() => {
   *   reset()
   * })
   * 
   * // 在页面切换时重置
   * const handlePageChange = () => {
   *   reset()
   *   // 切换到新页面
   * }
   * 
   * // 在遇到严重错误时重置
   * if (criticalError) {
   *   reset()
   *   console.log('奖励集成状态已重置')
   * }
   * ```
   */
  function reset() {
    state.creatingReward = false
    state.batchCreatingRewards = false
    state.batchProgress = {
      total: 0,
      completed: 0,
      failed: 0,
      current: null
    }
    state.error = null
    state.lastErrorTime = null
  }
  
  return {
    // 状态
    state: readonly(state),
    
    // 计算属性
    isProcessing,
    batchProgressPercentage,
    hasError,
    
    // 方法
    fetchRewardRules,
    calculateLeadReward,
    createLeadReward,
    batchCreateLeadRewards,
    clearError,
    reset
  }
}
