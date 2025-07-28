/**
 * @fileoverview 客资审核权限检查组合式API模块
 * 提供完整的客资审核权限管理功能，包括权限状态检查、数据范围获取、批量权限验证等
 * 
 * @module composables/useLeadAuditPermission
 * @requires vue
 * @requires @/store/user
 * @requires @/utils/permissionControl
 * @requires @/types/user
 * @requires @/types/lead
 */

import { ref, computed, watch, type Ref } from 'vue'
import { useUserStore } from '@/store/user'
import { 
  LeadAuditPermissionController, 
  PermissionCheck,
  type LeadAuditDataScope,
  type PermissionCheckResult 
} from '@/utils/permissionControl'
import type { UserRole } from '@/types/user'
import type { Lead, LeadAuditStatus } from '@/types/lead'

/**
 * 权限状态接口
 */
export interface LeadAuditPermissionState {
  // 基础权限
  canViewPendingLeads: boolean
  canAuditLead: boolean
  canBatchAudit: boolean
  canViewAuditRecords: boolean
  canExportAuditData: boolean
  canRevokeAudit: boolean
  canMarkUrgent: boolean
  canViewStatistics: boolean
  canViewWorkbench: boolean
  canConfigureReminders: boolean
  
  // 数据范围
  canViewAll: boolean
  allowedSalesIds: string[]
  allowedLeadIds: string[]
  teamIds: string[]
  restrictions: string[]
  
  // 状态
  isLoading: boolean
  error: string | null
}

/**
 * 权限检查选项
 */
export interface PermissionCheckOptions {
  leadId?: string
  salespersonId?: string
  teamId?: string
  auditStatus?: LeadAuditStatus
  autoRefresh?: boolean
}

/**
 * 客资审核权限检查组合式API
 * 提供完整的客资审核权限管理功能，包括权限状态检查、数据范围获取、批量权限验证等
 * 
 * @function useLeadAuditPermission
 * @param {PermissionCheckOptions} options - 权限检查配置选项，包含自动刷新等设置
 * @returns {Object} 权限管理相关的状态、计算属性和操作方法
 * @complexity O(1) - 基础权限检查为常数时间，具体操作复杂度取决于调用的方法
 * @flow 初始化状态 -> 获取用户信息 -> 权限检查 -> 提供管理方法
 * 
 * @example
 * ```typescript
 * const {
 *   permissionState,
 *   canAuditLead,
 *   canBatchAudit,
 *   checkPermission,
 *   canAuditSpecificLead,
 *   refreshPermissions
 * } = useLeadAuditPermission({
 *   autoRefresh: true
 * })
 * 
 * // 检查是否可以审核客资
 * if (canAuditLead.value) {
 *   console.log('当前用户可以审核客资')
 * }
 * 
 * // 检查特定客资的审核权限
 * const leadPermission = canAuditSpecificLead({
 *   id: 'lead123',
 *   salespersonId: 'sales456',
 *   auditStatus: 'PENDING'
 * })
 * ```
 */
export function useLeadAuditPermission(options: PermissionCheckOptions = {}) {
  const userStore = useUserStore()
  
  // 响应式状态
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const permissionState = ref<LeadAuditPermissionState>({
    // 基础权限
    canViewPendingLeads: false,
    canAuditLead: false,
    canBatchAudit: false,
    canViewAuditRecords: false,
    canExportAuditData: false,
    canRevokeAudit: false,
    canMarkUrgent: false,
    canViewStatistics: false,
    canViewWorkbench: false,
    canConfigureReminders: false,
    
    // 数据范围
    canViewAll: false,
    allowedSalesIds: [],
    allowedLeadIds: [],
    teamIds: [],
    restrictions: [],
    
    // 状态
    isLoading: false,
    error: null
  })
  
  /**
   * 计算属性：当前用户信息
   */
  const currentUser = computed(() => userStore.userInfo)
  const currentUserRole = computed(() => currentUser.value?.role as UserRole)
  const currentUserId = computed(() => currentUser.value?.id || '')
  
  /**
   * 计算属性：数据范围权限
   */
  const dataScope = computed(() => {
    if (!currentUserRole.value || !currentUserId.value) {
      return null
    }
    
    return PermissionCheck.getLeadAuditDataScope(currentUserRole.value, currentUserId.value)
  })
  
  /**
   * 计算属性：可审核的数据范围
   */
  const auditableScope = computed(() => {
    if (!currentUserRole.value || !currentUserId.value) {
      return null
    }
    
    return LeadAuditPermissionController.getAuditableLeadScope(
      currentUserRole.value, 
      currentUserId.value
    )
  })
  
  /**
   * 检查特定操作的权限
   * 根据用户角色和上下文信息检查是否有权限执行指定操作
   * 
   * @param {string} operation - 操作名称，如 'audit_lead', 'view_pending_leads' 等
   * @param {PermissionCheckOptions} context - 权限检查上下文，包含客资ID、销售人员ID等
   * @returns {PermissionCheckResult} 权限检查结果，包含是否有权限和失败原因
   * @complexity O(1) - 权限检查为常数时间操作
   * @flow 验证用户信息 -> 调用权限控制器 -> 返回检查结果
   * 
   * @example
   * ```typescript
   * // 检查审核权限
   * const auditPermission = checkPermission('audit_lead', {
   *   leadId: 'lead123',
   *   salespersonId: 'sales456'
   * })
   * 
   * if (auditPermission.hasPermission) {
   *   console.log('可以审核此客资')
   * } else {
   *   console.log('权限不足:', auditPermission.reason)
   * }
   * 
   * // 检查导出权限
   * const exportPermission = checkPermission('export_audit_data')
   * ```
   */
  const checkPermission = (operation: string, context?: PermissionCheckOptions): PermissionCheckResult => {
    if (!currentUserRole.value || !currentUserId.value) {
      return {
        hasPermission: false,
        reason: '用户信息不完整',
        errorCode: 'USER_INFO_INCOMPLETE'
      }
    }
    
    return LeadAuditPermissionController.checkLeadAuditPermission(
      currentUserRole.value,
      operation,
      {
        userId: currentUserId.value,
        leadId: context?.leadId || options.leadId,
        salespersonId: context?.salespersonId || options.salespersonId,
        teamId: context?.teamId || options.teamId
      }
    )
  }
  
  /**
   * 检查是否可以审核特定客资
   * 根据客资的具体信息（所属销售人员、审核状态等）检查当前用户是否有审核权限
   * 
   * @param {Object} leadData - 客资数据对象
   * @param {string} leadData.id - 客资ID
   * @param {string} leadData.salespersonId - 所属销售人员ID
   * @param {LeadAuditStatus} leadData.auditStatus - 当前审核状态
   * @param {string} leadData.teamId - 所属团队ID（可选）
   * @returns {PermissionCheckResult} 权限检查结果
   * @complexity O(1) - 权限检查为常数时间操作
   * @flow 验证用户信息 -> 调用客资审核权限控制器 -> 返回检查结果
   * 
   * @example
   * ```typescript
   * const leadData = {
   *   id: 'lead_123',
   *   salespersonId: 'sales_456',
   *   auditStatus: 'PENDING',
   *   teamId: 'team_789'
   * }
   * 
   * const permission = canAuditSpecificLead(leadData)
   * if (permission.hasPermission) {
   *   console.log('可以审核此客资')
   *   // 显示审核按钮或执行审核操作
   * } else {
   *   console.log('无法审核:', permission.reason)
   *   // 隐藏审核按钮或显示权限提示
   * }
   * ```
   */
  const canAuditSpecificLead = (leadData: {
    id: string
    salespersonId: string
    auditStatus: LeadAuditStatus
    teamId?: string
  }): PermissionCheckResult => {
    if (!currentUserRole.value || !currentUserId.value) {
      return {
        hasPermission: false,
        reason: '用户信息不完整',
        errorCode: 'USER_INFO_INCOMPLETE'
      }
    }
    
    return LeadAuditPermissionController.canAuditLead(
      currentUserRole.value,
      currentUserId.value,
      {
        id: leadData.id,
        salespersonId: leadData.salespersonId,
        auditStatus: leadData.auditStatus,
        teamId: leadData.teamId
      }
    )
  }
  
  /**
   * 检查是否可以查看特定销售人员的客资
   * 根据数据范围权限判断当前用户是否可以查看指定销售人员的客资数据
   * 
   * @param {string} salespersonId - 销售人员ID
   * @returns {boolean} 是否可以查看该销售人员的客资
   * @complexity O(1) - 权限检查为常数时间操作
   * @flow 获取审核权限范围 -> 检查全局权限 -> 检查销售人员权限范围
   * 
   * @example
   * ```typescript
   * // 检查是否可以查看特定销售人员的客资
   * const canView = canViewSalespersonLeads('sales_123')
   * if (canView) {
   *   console.log('可以查看该销售人员的客资')
   *   // 显示客资列表或允许筛选
   * } else {
   *   console.log('无权查看该销售人员的客资')
   *   // 隐藏数据或显示权限提示
   * }
   * 
   * // 在客资列表中筛选可见的销售人员
   * const visibleSalespeople = allSalespeople.filter(person => 
   *   canViewSalespersonLeads(person.id)
   * )
   * ```
   */
  const canViewSalespersonLeads = (salespersonId: string): boolean => {
    const scope = auditableScope.value
    if (!scope) return false
    
    if (scope.canAuditAll) return true
    
    return scope.allowedSalesIds?.includes(salespersonId) || false
  }
  
  /**
   * 获取基于权限的筛选条件
   * 根据当前用户的权限范围生成数据查询的筛选条件，用于限制数据访问范围
   * 
   * @function getPermissionFilters
   * @returns {Record<string, any>} 权限筛选条件对象
   * @complexity O(1) - 权限筛选条件生成为常数时间操作
   * @flow 获取权限范围 -> 检查全局权限 -> 生成筛选条件
   * 
   * @example
   * ```typescript
   * // 获取权限筛选条件
   * const filters = getPermissionFilters()
   * console.log('权限筛选条件:', filters)
   * // 可能返回: { salespersonId: ['sales1', 'sales2'], teamId: ['team1'] }
   * 
   * // 在API调用中使用筛选条件
   * const leadList = await leadApi.getLeadList({
   *   ...searchParams,
   *   ...filters // 应用权限筛选
   * })
   * 
   * // 在数据表格中应用筛选
   * const allowedLeads = allLeads.filter(lead => {
   *   const filters = getPermissionFilters()
   *   if (filters.salespersonId && !filters.salespersonId.includes(lead.salespersonId)) {
   *     return false
   *   }
   *   return true
   * })
   * ```
   */
  const getPermissionFilters = (): Record<string, any> => {
    const scope = auditableScope.value
    if (!scope) return {}
    
    const filters: Record<string, any> = {}
    
    // 如果不能查看所有数据，添加筛选条件
    if (!scope.canAuditAll) {
      if (scope.allowedSalesIds && scope.allowedSalesIds.length > 0) {
        filters.salespersonId = scope.allowedSalesIds
      }
      
      if (scope.allowedLeadIds && scope.allowedLeadIds.length > 0) {
        filters.leadId = scope.allowedLeadIds
      }
      
      if (scope.teamIds && scope.teamIds.length > 0) {
        filters.teamId = scope.teamIds
      }
    }
    
    return filters
  }
  
  /**
   * 刷新权限状态
   * 重新获取并更新当前用户的所有权限状态，包括基础权限和数据范围权限
   * 
   * @function refreshPermissions
   * @returns {Promise<void>}
   * @complexity O(1) - 权限刷新为常数时间操作
   * @flow 验证用户信息 -> 获取权限范围 -> 批量检查权限 -> 更新状态
   * 
   * @example
   * ```typescript
   * // 用户角色变更后刷新权限
   * await refreshPermissions()
   * console.log('权限已刷新')
   * 
   * // 在权限相关操作失败时重新刷新
   * try {
   *   await performAuditOperation()
   * } catch (error) {
   *   if (error.code === 'PERMISSION_DENIED') {
   *     await refreshPermissions()
   *     // 重新检查权限状态
   *   }
   * }
   * 
   * // 定期刷新权限（可选）
   * setInterval(async () => {
   *   await refreshPermissions()
   * }, 5 * 60 * 1000) // 每5分钟刷新一次
   * ```
   */
  const refreshPermissions = async () => {
    if (!currentUserRole.value || !currentUserId.value) {
      error.value = '用户信息不完整'
      return
    }
    
    isLoading.value = true
    error.value = null
    
    try {
      const scope = dataScope.value
      if (!scope) {
        throw new Error('无法获取权限范围')
      }
      
      // 更新权限状态
      permissionState.value = {
        // 基础权限检查
        canViewPendingLeads: checkPermission('view_pending_leads').hasPermission,
        canAuditLead: checkPermission('audit_lead').hasPermission,
        canBatchAudit: checkPermission('batch_audit_leads').hasPermission,
        canViewAuditRecords: checkPermission('view_audit_records').hasPermission,
        canExportAuditData: checkPermission('export_audit_data').hasPermission,
        canRevokeAudit: checkPermission('revoke_audit').hasPermission,
        canMarkUrgent: checkPermission('mark_urgent_lead').hasPermission,
        canViewStatistics: checkPermission('view_audit_statistics').hasPermission,
        canViewWorkbench: checkPermission('view_audit_workbench').hasPermission,
        canConfigureReminders: checkPermission('configure_audit_reminders').hasPermission,
        
        // 数据范围
        canViewAll: scope.canViewAll || false,
        allowedSalesIds: scope.allowedSalesIds || [],
        allowedLeadIds: scope.allowedLeadIds || [],
        teamIds: scope.teamIds || [],
        restrictions: scope.restrictions || [],
        
        // 状态
        isLoading: false,
        error: null
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '权限检查失败'
      console.error('权限检查失败:', err)
    } finally {
      isLoading.value = false
    }
  }
  
  /**
   * 获取权限错误提示信息
   * 根据操作类型获取友好的权限错误提示信息，用于向用户展示
   * 
   * @param {string} operation - 操作名称
   * @returns {string} 权限错误提示信息
   * @complexity O(1) - 错误信息获取为常数时间操作
   * @flow 检查权限 -> 获取错误原因 -> 返回友好提示
   * 
   * @example
   * ```typescript
   * // 获取审核权限错误提示
   * const errorMessage = getPermissionErrorMessage('audit_lead')
   * if (errorMessage !== '权限不足') {
   *   showToast({
   *     title: '操作失败',
   *     description: errorMessage,
   *     variant: 'destructive'
   *   })
   * }
   * 
   * // 在按钮点击时显示权限提示
   * const handleAuditClick = () => {
   *   if (!canAuditLead.value) {
   *     const message = getPermissionErrorMessage('audit_lead')
   *     alert(message)
   *     return
   *   }
   *   // 执行审核操作
   * }
   * ```
   */
  const getPermissionErrorMessage = (operation: string): string => {
    const result = checkPermission(operation)
    return result.reason || '权限不足'
  }
  
  /**
   * 检查批量审核客资的权限
   * 对多个客资进行批量权限检查，返回详细的权限分析结果
   * 
   * @param {string[]} leadIds - 要检查的客资ID数组
   * @returns {Object} 批量权限检查结果
   * @returns {boolean} returns.canAudit - 是否可以进行批量审核
   * @returns {string[]} returns.allowedLeadIds - 允许审核的客资ID列表
   * @returns {string[]} returns.deniedLeadIds - 拒绝审核的客资ID列表
   * @returns {Record<string, string>} returns.reasons - 各客资的拒绝原因
   * @complexity O(n) - n为客资数量，需要检查每个客资的权限
   * @flow 检查基础批量权限 -> 获取权限范围 -> 逐个检查客资权限 -> 汇总结果
   * 
   * @example
   * ```typescript
   * const leadIds = ['lead1', 'lead2', 'lead3', 'lead4']
   * const batchResult = canBatchAuditLeads(leadIds)
   * 
   * console.log('批量审核结果:', batchResult)
   * // {
   * //   canAudit: true,
   * //   allowedLeadIds: ['lead1', 'lead2'],
   * //   deniedLeadIds: ['lead3', 'lead4'],
   * //   reasons: {
   * //     'lead3': '超出权限范围',
   * //     'lead4': '超出权限范围'
   * //   }
   * // }
   * 
   * if (batchResult.canAudit) {
   *   if (batchResult.deniedLeadIds.length > 0) {
   *     console.log(`部分客资无法审核: ${batchResult.deniedLeadIds.length}个`)
   *   }
   *   // 只审核允许的客资
   *   await batchAuditLeads(batchResult.allowedLeadIds)
   * } else {
   *   console.log('无法进行批量审核')
   * }
   * ```
   */
  const canBatchAuditLeads = (leadIds: string[]): {
    canAudit: boolean
    allowedLeadIds: string[]
    deniedLeadIds: string[]
    reasons: Record<string, string>
  } => {
    const result = {
      canAudit: false,
      allowedLeadIds: [] as string[],
      deniedLeadIds: [] as string[],
      reasons: {} as Record<string, string>
    }
    
    // 检查基础批量审核权限
    const batchPermission = checkPermission('batch_audit_leads')
    if (!batchPermission.hasPermission) {
      result.deniedLeadIds = [...leadIds]
      leadIds.forEach(id => {
        result.reasons[id] = batchPermission.reason || '无批量审核权限'
      })
      return result
    }
    
    // 检查每个客资的权限
    const scope = auditableScope.value
    if (!scope) {
      result.deniedLeadIds = [...leadIds]
      leadIds.forEach(id => {
        result.reasons[id] = '无法获取权限范围'
      })
      return result
    }
    
    leadIds.forEach(leadId => {
      if (scope.canAuditAll || !scope.allowedLeadIds || scope.allowedLeadIds.includes(leadId)) {
        result.allowedLeadIds.push(leadId)
      } else {
        result.deniedLeadIds.push(leadId)
        result.reasons[leadId] = '超出权限范围'
      }
    })
    
    result.canAudit = result.allowedLeadIds.length > 0
    return result
  }
  
  // 监听用户信息变化，自动刷新权限
  watch(
    [currentUser, currentUserRole],
    () => {
      if (options.autoRefresh !== false) {
        refreshPermissions()
      }
    },
    { immediate: true }
  )
  
  // 初始化时刷新权限
  if (options.autoRefresh !== false) {
    refreshPermissions()
  }
  
  return {
    // 状态
    isLoading: computed(() => isLoading.value),
    error: computed(() => error.value),
    permissionState: computed(() => permissionState.value),
    
    // 计算属性
    dataScope,
    auditableScope,
    currentUser,
    currentUserRole,
    
    // 方法
    checkPermission,
    canAuditSpecificLead,
    canViewSalespersonLeads,
    getPermissionFilters,
    refreshPermissions,
    getPermissionErrorMessage,
    canBatchAuditLeads,
    
    // 便捷的权限检查方法
    canViewPendingLeads: computed(() => permissionState.value.canViewPendingLeads),
    canAuditLead: computed(() => permissionState.value.canAuditLead),
    canBatchAudit: computed(() => permissionState.value.canBatchAudit),
    canViewAuditRecords: computed(() => permissionState.value.canViewAuditRecords),
    canExportAuditData: computed(() => permissionState.value.canExportAuditData),
    canRevokeAudit: computed(() => permissionState.value.canRevokeAudit),
    canMarkUrgent: computed(() => permissionState.value.canMarkUrgent),
    canViewStatistics: computed(() => permissionState.value.canViewStatistics),
    canViewWorkbench: computed(() => permissionState.value.canViewWorkbench),
    canConfigureReminders: computed(() => permissionState.value.canConfigureReminders)
  }
}
