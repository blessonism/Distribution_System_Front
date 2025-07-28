/**
 * @fileoverview 客资审核操作组合式API模块
 * 提供完整的客资审核功能，包括单个和批量审核、权限控制、记录管理、统计功能、奖励集成等
 * 
 * @module composables/useLeadAudit
 * @requires vue
 * @requires @/components/ui/toast/use-toast
 * @requires @/store/lead
 * @requires @/composables/useLeadAuditPermission
 * @requires @/composables/useRewardIntegration
 * @requires @/api/leadAudit
 * @requires @/types/lead
 * @requires @/types/leadAudit
 */

import { ref, reactive, computed, nextTick } from 'vue'
import { useToast } from '@/components/ui/toast/use-toast'
import { useLeadStore } from '@/store/lead'
import { useLeadAuditPermission } from '@/composables/useLeadAuditPermission'
import { useRewardIntegration } from '@/composables/useRewardIntegration'
import { leadAuditApi } from '@/api/leadAudit'
import type { 
  Lead, 
  LeadAuditStatus 
} from '@/types/lead'
import type { 
  AuditDecision, 
  LeadAuditRecord, 
  AuditStatistics,
  BatchAuditRequest,
  BatchAuditResult
} from '@/types/leadAudit'

/**
 * 审核操作选项接口
 * 定义审核操作的配置选项和回调函数
 * 
 * @interface AuditOptions
 * 
 * @example
 * ```typescript
 * const options: AuditOptions = {
 *   showSuccessToast: true,
 *   autoRefreshList: true,
 *   enableRewardIntegration: true,
 *   onSuccess: (result) => console.log('审核成功:', result),
 *   onBatchProgress: (progress) => console.log(`进度: ${progress.completed}/${progress.total}`)
 * }
 * ```
 */
export interface AuditOptions {
  /** 是否显示成功提示，默认true */
  showSuccessToast?: boolean
  /** 是否显示错误提示，默认true */
  showErrorToast?: boolean
  /** 是否自动刷新列表，默认true */
  autoRefreshList?: boolean
  /** 是否启用乐观更新，默认false */
  optimisticUpdate?: boolean
  /** 是否启用奖励系统集成，默认true */
  enableRewardIntegration?: boolean
  /** 操作成功回调函数 */
  onSuccess?: (result: any) => void
  /** 操作失败回调函数 */
  onError?: (error: Error) => void
  /** 批量操作进度回调函数 */
  onBatchProgress?: (progress: { completed: number; total: number; current?: Lead }) => void
  /** 奖励创建成功回调函数 */
  onRewardCreated?: (result: any) => void
  /** 奖励创建失败回调函数 */
  onRewardFailed?: (error: Error, lead: Lead) => void
}

/**
 * 审核状态接口
 * 定义客资审核操作的完整状态信息
 * 
 * @interface AuditState
 * 
 * @example
 * ```typescript
 * const state: AuditState = {
 *   auditing: false,
 *   auditingLeadId: null,
 *   batchAuditing: false,
 *   batchProgress: { total: 0, completed: 0, failed: 0, current: null },
 *   revoking: false,
 *   revokingRecordId: null,
 *   loadingRecords: false,
 *   recordsCache: {},
 *   loadingStatistics: false,
 *   statistics: null,
 *   error: null,
 *   lastErrorTime: null
 * }
 * ```
 */
export interface AuditState {
  /** 是否正在进行单个审核 */
  auditing: boolean
  /** 正在审核的客资ID */
  auditingLeadId: string | null
  
  /** 是否正在进行批量审核 */
  batchAuditing: boolean
  /** 批量审核进度信息 */
  batchProgress: {
    /** 总数量 */
    total: number
    /** 已完成数量 */
    completed: number
    /** 失败数量 */
    failed: number
    /** 当前处理的客资 */
    current: Lead | null
  }
  
  /** 是否正在撤销审核 */
  revoking: boolean
  /** 正在撤销的审核记录ID */
  revokingRecordId: string | null
  
  /** 是否正在加载审核记录 */
  loadingRecords: boolean
  /** 审核记录缓存，按客资ID索引 */
  recordsCache: Record<string, LeadAuditRecord[]>
  
  /** 是否正在加载审核统计 */
  loadingStatistics: boolean
  /** 审核统计数据 */
  statistics: AuditStatistics | null
  
  /** 最后的错误信息 */
  error: string | null
  /** 最后错误发生时间 */
  lastErrorTime: number | null
}

/**
 * 批量审核进度结果接口
 * 定义批量审核操作的进度和结果信息
 * 
 * @interface BatchAuditProgress
 * 
 * @example
 * ```typescript
 * const progress: BatchAuditProgress = {
 *   total: 100,
 *   completed: 80,
 *   failed: 5,
 *   current: null,
 *   results: [
 *     { leadId: '1', success: true },
 *     { leadId: '2', success: false, error: '权限不足' }
 *   ]
 * }
 * ```
 */
export interface BatchAuditProgress {
  /** 总数量 */
  total: number
  /** 已完成数量 */
  completed: number
  /** 失败数量 */
  failed: number
  /** 当前处理的客资 */
  current: Lead | null
  /** 详细结果列表 */
  results: Array<{
    /** 客资ID */
    leadId: string
    /** 是否成功 */
    success: boolean
    /** 错误信息（失败时） */
    error?: string
  }>
}

/**
 * 客资审核操作组合式API
 * 提供完整的客资审核功能，包括单个审核、批量审核、权限控制、记录管理、统计和奖励集成
 * 
 * @function useLeadAudit
 * @param {AuditOptions} options - 审核操作配置选项，包含回调函数和行为控制
 * @returns {Object} 审核操作相关的状态、方法和计算属性
 * @complexity O(1) - 初始化操作为常数时间，具体操作复杂度取决于调用的方法
 * @flow 初始化状态 -> 配置权限检查 -> 集成奖励系统 -> 提供操作方法
 * 
 * @example
 * ```typescript
 * // 基础使用
 * const {
 *   auditState,
 *   auditLead,
 *   batchAuditLeads,
 *   fetchAuditRecords,
 *   canBatchAudit
 * } = useLeadAudit({
 *   showSuccessToast: true,
 *   autoRefreshList: true,
 *   enableRewardIntegration: true,
 *   onSuccess: (result) => {
 *     console.log('审核成功:', result)
 *   },
 *   onBatchProgress: ({ completed, total }) => {
 *     console.log(`进度: ${completed}/${total}`)
 *   }
 * })
 * 
 * // 审核单个客资
 * const handleAudit = async (lead, decision) => {
 *   const success = await auditLead(lead, decision)
 *   if (success) {
 *     console.log('审核完成')
 *   }
 * }
 * 
 * // 批量审核
 * const handleBatchAudit = async (leads, decision) => {
 *   if (canBatchAudit.value) {
 *     const progress = await batchAuditLeads(leads, decision)
 *     console.log('批量审核结果:', progress)
 *   }
 * }
 * ```
 */
export function useLeadAudit(options: AuditOptions = {}) {
  const { toast } = useToast()
  const leadStore = useLeadStore()
  const {
    canAuditSpecificLead,
    canBatchAudit,
    canRevokeAudit,
    canViewAuditRecords,
    getPermissionFilters
  } = useLeadAuditPermission()

  // 奖励系统集成
  const rewardIntegration = useRewardIntegration({
    enableAutoReward: options.enableRewardIntegration !== false,
    showSuccessToast: false, // 由审核成功统一处理
    showErrorToast: false,   // 由审核失败统一处理
    onRewardCreated: options.onRewardCreated,
    onRewardFailed: options.onRewardFailed
  })
  
  // 审核状态
  const auditState = reactive<AuditState>({
    // 单个审核状态
    auditing: false,
    auditingLeadId: null,
    
    // 批量审核状态
    batchAuditing: false,
    batchProgress: {
      total: 0,
      completed: 0,
      failed: 0,
      current: null
    },
    
    // 撤销状态
    revoking: false,
    revokingRecordId: null,
    
    // 记录加载状态
    loadingRecords: false,
    recordsCache: {},
    
    // 统计状态
    loadingStatistics: false,
    statistics: null,
    
    // 错误状态
    error: null,
    lastErrorTime: null
  })
  
  // 计算属性
  const isAnyOperationInProgress = computed(() => {
    return auditState.auditing || 
           auditState.batchAuditing || 
           auditState.revoking || 
           auditState.loadingRecords || 
           auditState.loadingStatistics
  })
  
  const batchProgressPercentage = computed(() => {
    if (auditState.batchProgress.total === 0) return 0
    return Math.round((auditState.batchProgress.completed / auditState.batchProgress.total) * 100)
  })
  
  const hasError = computed(() => {
    return auditState.error !== null
  })
  
  /**
   * 检查客资审核权限
   * 根据当前用户权限和客资信息检查是否可以审核指定客资
   * 
   * @param {Lead} lead - 要检查的客资对象
   * @returns {Object} 权限检查结果，包含是否有权限和原因说明
   * @complexity O(1) - 权限检查为常数时间操作
   * @flow 获取客资信息 -> 调用权限检查 -> 返回检查结果
   * 
   * @example
   * ```typescript
   * const lead = { id: '123', salespersonId: 'user1', auditStatus: 'PENDING' }
   * const permission = checkAuditPermission(lead)
   * 
   * if (permission.canAudit) {
   *   console.log('可以审核该客资')
   * } else {
   *   console.log('无法审核:', permission.reason)
   * }
   * ```
   */
  function checkAuditPermission(lead: Lead): { canAudit: boolean; reason?: string } {
    const result = canAuditSpecificLead({
      id: lead.id,
      salespersonId: lead.salespersonId,
      auditStatus: lead.auditStatus,
      teamId: lead.teamId
    })
    
    return {
      canAudit: result.hasPermission,
      reason: result.reason
    }
  }
  
  /**
   * 处理审核成功
   */
  async function handleAuditSuccess(lead: Lead, decision: AuditDecision, result: any) {
    // 清除该客资的记录缓存
    delete auditState.recordsCache[lead.id]

    // 创建奖励（如果审核通过且启用奖励集成）
    let rewardResult = null
    if (decision.action === 'APPROVE' && options.enableRewardIntegration !== false) {
      try {
        rewardResult = await rewardIntegration.createLeadReward(
          lead,
          decision,
          result.auditorId || 'unknown'
        )
      } catch (error) {
        console.error('[审核Composable] 奖励创建失败:', error)
        // 奖励创建失败不影响审核成功的流程
      }
    }

    // 显示成功提示
    if (options.showSuccessToast !== false) {
      const actionText = decision.action === 'APPROVE' ? '通过' : '驳回'
      let description = `客资 "${lead.name}" 已${actionText}`

      // 如果创建了奖励，添加奖励信息
      if (rewardResult && rewardResult.success) {
        description += `，已创建 ¥${rewardResult.rewardAmount} 奖励`
      }

      toast({
        title: '审核成功',
        description,
        variant: 'default'
      })
    }

    // 自动刷新列表
    if (options.autoRefreshList !== false) {
      leadStore.refresh()
    }

    // 调用成功回调
    if (options.onSuccess) {
      options.onSuccess({ ...result, rewardResult })
    }
  }
  
  /**
   * 处理审核错误
   */
  function handleAuditError(error: Error, lead?: Lead) {
    auditState.error = error.message
    auditState.lastErrorTime = Date.now()
    
    console.error('[审核Composable] 审核失败:', error)
    
    // 显示错误提示
    if (options.showErrorToast !== false) {
      toast({
        title: '审核失败',
        description: lead ? `客资 "${lead.name}" 审核失败: ${error.message}` : error.message,
        variant: 'destructive'
      })
    }
    
    // 调用错误回调
    if (options.onError) {
      options.onError(error)
    }
  }
  
  /**
   * 审核单个客资
   * 对指定客资执行审核操作，包括权限检查、状态更新、奖励创建等完整流程
   * 
   * @param {Lead} lead - 要审核的客资对象
   * @param {AuditDecision} decision - 审核决策，包含审核结果和原因
   * @returns {Promise<boolean>} 审核是否成功
   * @complexity O(1) - 单次审核操作的时间复杂度主要取决于API调用
   * @flow 防重复检查 -> 权限验证 -> 乐观更新 -> 执行审核 -> 处理成功/失败
   * 
   * @example
   * ```typescript
   * const lead = { id: '123', name: '张三', auditStatus: 'PENDING' }
   * const decision = {
   *   action: 'APPROVE',
   *   reason: '客资信息完整，符合标准',
   *   auditorId: 'user123'
   * }
   * 
   * const success = await auditLead(lead, decision)
   * if (success) {
   *   console.log('审核成功，已自动创建奖励')
   * } else {
   *   console.log('审核失败，请查看错误信息')
   * }
   * ```
   */
  async function auditLead(lead: Lead, decision: AuditDecision): Promise<boolean> {
    if (auditState.auditing) {
      console.warn('[审核Composable] 正在审核中，忽略重复操作')
      return false
    }
    
    // 权限检查
    const permission = checkAuditPermission(lead)
    if (!permission.canAudit) {
      const error = new Error(permission.reason || '无权限审核此客资')
      handleAuditError(error, lead)
      return false
    }
    
    auditState.auditing = true
    auditState.auditingLeadId = lead.id
    auditState.error = null
    
    try {
      // 乐观更新
      if (options.optimisticUpdate) {
        const optimisticStatus: LeadAuditStatus = decision.action === 'APPROVE' ? 'APPROVED' : 'REJECTED'
        // 这里可以临时更新UI状态
      }
      
      // 执行审核
      const result = await leadStore.auditLead(lead.id, decision)
      
      // 处理成功
      handleAuditSuccess(lead, decision, result)
      
      return true
    } catch (error) {
      const auditError = error instanceof Error ? error : new Error('审核失败')
      handleAuditError(auditError, lead)
      return false
    } finally {
      auditState.auditing = false
      auditState.auditingLeadId = null
    }
  }
  
  /**
   * 批量审核客资
   * 对多个客资执行批量审核操作，支持进度回调和错误处理，包含奖励自动创建
   * 
   * @param {Lead[]} leads - 要审核的客资列表
   * @param {AuditDecision} decision - 统一的审核决策
   * @returns {Promise<BatchAuditProgress>} 批量审核的详细进度和结果
   * @throws {Error} 权限不足或正在执行其他批量操作时抛出错误
   * @complexity O(n) - n为客资数量，每个客资需要单独的API调用
   * @flow 权限检查 -> 初始化状态 -> 过滤可审核客资 -> 逐个审核 -> 批量创建奖励 -> 返回结果
   * 
   * @example
   * ```typescript
   * const leads = [
   *   { id: '1', name: '张三', auditStatus: 'PENDING' },
   *   { id: '2', name: '李四', auditStatus: 'PENDING' }
   * ]
   * 
   * const decision = {
   *   action: 'APPROVE',
   *   reason: '批量审核通过',
   *   auditorId: 'user123'
   * }
   * 
   * try {
   *   const progress = await batchAuditLeads(leads, decision)
   *   console.log(`批量审核完成: 成功 ${progress.completed} 个, 失败 ${progress.failed} 个`)
   *   
   *   // 查看详细结果
   *   progress.results.forEach(result => {
   *     if (result.success) {
   *       console.log(`客资 ${result.leadId} 审核成功`)
   *     } else {
   *       console.log(`客资 ${result.leadId} 审核失败: ${result.error}`)
   *     }
   *   })
   * } catch (error) {
   *   console.error('批量审核失败:', error.message)
   * }
   * ```
   */
  async function batchAuditLeads(leads: Lead[], decision: AuditDecision): Promise<BatchAuditProgress> {
    if (auditState.batchAuditing) {
      throw new Error('正在执行批量审核，请稍后重试')
    }
    
    // 权限检查
    if (!canBatchAudit.value) {
      throw new Error('您没有批量审核权限')
    }
    
    // 初始化批量审核状态
    auditState.batchAuditing = true
    auditState.batchProgress = {
      total: leads.length,
      completed: 0,
      failed: 0,
      current: null
    }
    auditState.error = null
    
    const results: BatchAuditProgress['results'] = []
    
    try {
      // 过滤可审核的客资
      const auditableLeads = leads.filter(lead => {
        const permission = checkAuditPermission(lead)
        if (!permission.canAudit) {
          results.push({
            leadId: lead.id,
            success: false,
            error: permission.reason || '无权限审核'
          })
          auditState.batchProgress.failed++
          return false
        }
        return true
      })
      
      // 执行批量审核
      for (const lead of auditableLeads) {
        auditState.batchProgress.current = lead
        
        // 通知进度
        if (options.onBatchProgress) {
          options.onBatchProgress({
            completed: auditState.batchProgress.completed,
            total: auditState.batchProgress.total,
            current: lead
          })
        }
        
        try {
          await leadStore.auditLead(lead.id, decision)
          
          results.push({
            leadId: lead.id,
            success: true
          })
          
          auditState.batchProgress.completed++
          
          // 清除记录缓存
          delete auditState.recordsCache[lead.id]
          
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '审核失败'
          results.push({
            leadId: lead.id,
            success: false,
            error: errorMessage
          })
          
          auditState.batchProgress.failed++
          console.error(`[审核Composable] 客资 ${lead.id} 审核失败:`, error)
        }
        
        // 添加小延迟避免请求过于频繁
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      
      // 批量创建奖励（如果审核通过且启用奖励集成）
      let batchRewardResults: any[] = []
      if (decision.action === 'APPROVE' && options.enableRewardIntegration !== false) {
        try {
          const approvedLeads = auditableLeads.filter((_, index) => results[index]?.success)
          if (approvedLeads.length > 0) {
            batchRewardResults = await rewardIntegration.batchCreateLeadRewards(
              approvedLeads,
              decision,
              'batch_auditor' // 批量审核的审核人ID
            )
          }
        } catch (error) {
          console.error('[审核Composable] 批量奖励创建失败:', error)
          // 奖励创建失败不影响审核成功的流程
        }
      }

      // 显示批量审核结果
      const successCount = auditState.batchProgress.completed
      const failedCount = auditState.batchProgress.failed
      const rewardSuccessCount = batchRewardResults.filter(r => r.success).length

      if (options.showSuccessToast !== false) {
        if (failedCount === 0) {
          let description = `成功审核 ${successCount} 条客资`
          if (rewardSuccessCount > 0) {
            description += `，创建了 ${rewardSuccessCount} 条奖励记录`
          }

          toast({
            title: '批量审核完成',
            description,
            variant: 'default'
          })
        } else {
          let description = `成功 ${successCount} 条，失败 ${failedCount} 条`
          if (rewardSuccessCount > 0) {
            description += `，奖励 ${rewardSuccessCount} 条`
          }

          toast({
            title: '批量审核完成',
            description,
            variant: 'default'
          })
        }
      }
      
      // 自动刷新列表
      if (options.autoRefreshList !== false) {
        leadStore.refresh()
      }
      
      const progress: BatchAuditProgress = {
        total: auditState.batchProgress.total,
        completed: auditState.batchProgress.completed,
        failed: auditState.batchProgress.failed,
        current: null,
        results
      }
      
      // 调用成功回调
      if (options.onSuccess) {
        options.onSuccess(progress)
      }
      
      return progress
      
    } catch (error) {
      const batchError = error instanceof Error ? error : new Error('批量审核失败')
      handleAuditError(batchError)
      throw batchError
    } finally {
      auditState.batchAuditing = false
      auditState.batchProgress.current = null
    }
  }
  
  /**
   * 撤销审核记录
   * 撤销已完成的审核记录，将客资重新设置为待审核状态
   * 
   * @param {string} recordId - 要撤销的审核记录ID
   * @param {string} reason - 撤销原因说明
   * @returns {Promise<boolean>} 撤销是否成功
   * @complexity O(1) - 撤销操作的时间复杂度主要取决于API调用
   * @flow 权限检查 -> 防重复检查 -> 执行撤销 -> 清除缓存 -> 刷新列表
   * 
   * @example
   * ```typescript
   * const recordId = 'audit_record_123'
   * const reason = '发现审核标准有误，需要重新审核'
   * 
   * const success = await revokeAudit(recordId, reason)
   * if (success) {
   *   console.log('审核已撤销，客资重新进入待审核状态')
   * } else {
   *   console.log('撤销失败，请检查权限或联系管理员')
   * }
   * ```
   */
  async function revokeAudit(recordId: string, reason: string): Promise<boolean> {
    if (!canRevokeAudit.value) {
      const error = new Error('您没有撤销审核的权限')
      handleAuditError(error)
      return false
    }
    
    if (auditState.revoking) {
      console.warn('[审核Composable] 正在撤销中，忽略重复操作')
      return false
    }
    
    auditState.revoking = true
    auditState.revokingRecordId = recordId
    auditState.error = null
    
    try {
      await leadAuditApi.revokeAudit(recordId, { reason })
      
      // 清除相关缓存
      Object.keys(auditState.recordsCache).forEach(leadId => {
        delete auditState.recordsCache[leadId]
      })
      
      // 显示成功提示
      if (options.showSuccessToast !== false) {
        toast({
          title: '撤销成功',
          description: '审核已撤销，客资重新进入待审核状态',
          variant: 'default'
        })
      }
      
      // 自动刷新
      if (options.autoRefreshList !== false) {
        leadStore.refresh()
      }
      
      return true
    } catch (error) {
      const revokeError = error instanceof Error ? error : new Error('撤销失败')
      handleAuditError(revokeError)
      return false
    } finally {
      auditState.revoking = false
      auditState.revokingRecordId = null
    }
  }
  
  /**
   * 获取客资审核记录
   * 获取指定客资的完整审核历史记录，支持缓存机制以提高性能
   * 
   * @param {string} leadId - 客资ID
   * @param {boolean} forceRefresh - 是否强制刷新缓存，默认false
   * @returns {Promise<LeadAuditRecord[]>} 审核记录列表
   * @throws {Error} 权限不足时抛出错误
   * @complexity O(1) - 有缓存时为常数时间，无缓存时取决于API调用
   * @flow 权限检查 -> 检查缓存 -> API调用 -> 更新缓存 -> 返回记录
   * 
   * @example
   * ```typescript
   * try {
   *   // 获取缓存记录（如果有）
   *   const records = await fetchAuditRecords('lead_123')
   *   
   *   records.forEach(record => {
   *     console.log(`${record.createdAt}: ${record.action} - ${record.reason}`)
   *   })
   *   
   *   // 强制刷新获取最新记录
   *   const freshRecords = await fetchAuditRecords('lead_123', true)
   *   console.log('最新审核记录:', freshRecords)
   * } catch (error) {
   *   console.error('获取审核记录失败:', error.message)
   * }
   * ```
   */
  async function fetchAuditRecords(leadId: string, forceRefresh = false): Promise<LeadAuditRecord[]> {
    if (!canViewAuditRecords.value) {
      throw new Error('您没有查看审核记录的权限')
    }
    
    // 检查缓存
    if (!forceRefresh && auditState.recordsCache[leadId]) {
      return auditState.recordsCache[leadId]
    }
    
    auditState.loadingRecords = true
    auditState.error = null
    
    try {
      const records = await leadStore.fetchAuditRecords(leadId, forceRefresh)
      auditState.recordsCache[leadId] = records
      return records
    } catch (error) {
      const fetchError = error instanceof Error ? error : new Error('获取审核记录失败')
      handleAuditError(fetchError)
      throw fetchError
    } finally {
      auditState.loadingRecords = false
    }
  }
  
  /**
   * 获取审核统计数据
   * 获取当前用户的审核统计信息，包括审核数量、通过率等关键指标
   * 
   * @returns {Promise<AuditStatistics | null>} 审核统计数据，失败时返回null
   * @complexity O(1) - 统计数据获取的时间复杂度主要取决于API调用
   * @flow 设置加载状态 -> API调用 -> 更新统计数据 -> 处理错误 -> 返回结果
   * 
   * @example
   * ```typescript
   * try {
   *   const stats = await fetchAuditStatistics()
   *   
   *   if (stats) {
   *     console.log('审核统计:')
   *     console.log(`总审核数: ${stats.totalAudited}`)
   *     console.log(`通过数: ${stats.approved}`)
   *     console.log(`驳回数: ${stats.rejected}`)
   *     console.log(`通过率: ${stats.approvalRate}%`)
   *   }
   * } catch (error) {
   *   console.error('获取审核统计失败:', error.message)
   * }
   * ```
   */
  async function fetchAuditStatistics(): Promise<AuditStatistics | null> {
    auditState.loadingStatistics = true
    auditState.error = null
    
    try {
      await leadStore.fetchAuditStatistics()
      auditState.statistics = leadStore.auditStatistics
      return auditState.statistics
    } catch (error) {
      const statsError = error instanceof Error ? error : new Error('获取审核统计失败')
      handleAuditError(statsError)
      return null
    } finally {
      auditState.loadingStatistics = false
    }
  }
  
  /**
   * 清除错误状态
   * 清空当前的错误信息和错误时间，用于错误恢复
   * 
   * @function clearError
   * @returns {void}
   * @complexity O(1) - 状态清除为常数时间操作
   * @flow 重置错误信息 -> 重置错误时间
   * 
   * @example
   * ```typescript
   * // 在用户确认错误信息后清除错误状态
   * clearError()
   * console.log(auditState.error) // null
   * ```
   */
  function clearError() {
    auditState.error = null
    auditState.lastErrorTime = null
  }
  
  /**
   * 重置所有状态
   * 将审核相关的所有状态重置为初始值，通常在组件卸载或切换场景时使用
   * 
   * @function reset
   * @returns {void}
   * @complexity O(1) - 状态重置为常数时间操作
   * @flow 重置审核状态 -> 清空缓存 -> 重置错误状态
   * 
   * @example
   * ```typescript
   * // 在组件卸载时重置状态
   * onUnmounted(() => {
   *   reset()
   * })
   * 
   * // 或在切换用户时重置
   * const handleUserSwitch = () => {
   *   reset()
   *   // 其他切换逻辑...
   * }
   * ```
   */
  function reset() {
    auditState.auditing = false
    auditState.auditingLeadId = null
    auditState.batchAuditing = false
    auditState.batchProgress = {
      total: 0,
      completed: 0,
      failed: 0,
      current: null
    }
    auditState.revoking = false
    auditState.revokingRecordId = null
    auditState.loadingRecords = false
    auditState.recordsCache = {}
    auditState.loadingStatistics = false
    auditState.statistics = null
    auditState.error = null
    auditState.lastErrorTime = null
  }
  
  /**
   * 清除审核记录缓存
   * 清除指定客资或所有客资的审核记录缓存，强制下次获取时重新加载
   * 
   * @param {string} [leadId] - 可选的客资ID，不提供则清除所有缓存
   * @returns {void}
   * @complexity O(1) - 缓存清除为常数时间操作（单个）或O(n)（全部清除）
   * @flow 检查参数 -> 清除指定缓存或全部缓存
   * 
   * @example
   * ```typescript
   * // 清除特定客资的记录缓存
   * clearRecordsCache('lead_123')
   * 
   * // 清除所有记录缓存
   * clearRecordsCache()
   * 
   * // 在客资状态变化后清除缓存
   * const handleLeadUpdate = (leadId) => {
   *   clearRecordsCache(leadId)
   *   // 下次获取记录时会重新加载
   * }
   * ```
   */
  function clearRecordsCache(leadId?: string) {
    if (leadId) {
      delete auditState.recordsCache[leadId]
    } else {
      auditState.recordsCache = {}
    }
  }
  
  return {
    // 状态
    auditState: readonly(auditState),

    // 计算属性
    isAnyOperationInProgress,
    batchProgressPercentage,
    hasError,

    // 权限检查
    checkAuditPermission,
    canBatchAudit,
    canRevokeAudit,
    canViewAuditRecords,

    // 操作方法
    auditLead,
    batchAuditLeads,
    revokeAudit,
    fetchAuditRecords,
    fetchAuditStatistics,

    // 工具方法
    clearError,
    reset,
    clearRecordsCache,

    // 奖励集成
    rewardIntegration: {
      state: rewardIntegration.state,
      isProcessing: rewardIntegration.isProcessing,
      fetchRewardRules: rewardIntegration.fetchRewardRules,
      calculateLeadReward: rewardIntegration.calculateLeadReward
    }
  }
}
