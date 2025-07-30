/**
 * @fileoverview 层级关系权限控制 Composable
 * 提供层级关系页面的权限验证和数据范围控制功能
 * 
 * @author Frontend Team
 * @since 1.0.0
 * @version 1.0.0
 */

import { computed } from 'vue'
import { useUserStore } from '@/store/user'
import { PermissionCheck } from '@/utils/permissionControl'
import type { UserRole, HierarchyDataScope } from '@/utils/permissionControl'
import type { PersonnelRole, TreeNodeData } from '@/types/personnel'

/**
 * 层级关系权限控制 Composable
 * 提供层级关系页面的权限验证、数据范围控制和数据过滤功能
 * 
 * @function useHierarchyPermission
 * @returns {Object} 层级关系权限相关的响应式状态和方法
 * @complexity O(1) - 权限检查和数据过滤的时间复杂度
 * @flow 获取用户信息 -> 计算权限范围 -> 提供数据过滤方法
 * 
 * @example
 * ```typescript
 * // 在层级关系页面中使用
 * const {
 *   hierarchyDataScope,
 *   canViewLevel,
 *   filterPersonnelData,
 *   getAccessibleLevels
 * } = useHierarchyPermission()
 * 
 * // 检查是否可以查看特定层级
 * const canViewSales = canViewLevel('sales')
 * 
 * // 过滤人员数据
 * const filteredData = filterPersonnelData(rawPersonnelData)
 * ```
 */
export function useHierarchyPermission() {
  const userStore = useUserStore()

  /**
   * 计算属性：当前用户信息
   */
  const currentUser = computed(() => userStore.userInfo)
  const currentUserRole = computed(() => currentUser.value?.role as UserRole)
  const currentUserId = computed(() => currentUser.value?.id || '')

  /**
   * 计算属性：层级关系数据范围权限
   */
  const hierarchyDataScope = computed((): HierarchyDataScope | null => {
    if (!currentUserRole.value || !currentUserId.value) {
      return null
    }
    
    return PermissionCheck.getHierarchyDataScope(currentUserRole.value, currentUserId.value)
  })

  /**
   * 检查是否可以查看指定层级
   * 
   * @param {PersonnelRole} level - 要检查的层级
   * @returns {boolean} 是否有权限查看该层级
   */
  const canViewLevel = (level: PersonnelRole): boolean => {
    const scope = hierarchyDataScope.value
    if (!scope) return false

    // 超管和总监可以查看所有层级
    if (scope.canViewAll) return true

    // 检查是否在允许的层级列表中
    return scope.allowedLevels?.includes(level) || false
  }

  /**
   * 获取可访问的层级列表
   * 
   * @returns {PersonnelRole[]} 当前用户可以访问的层级列表
   */
  const getAccessibleLevels = (): PersonnelRole[] => {
    const scope = hierarchyDataScope.value
    if (!scope) return []

    if (scope.canViewAll) {
      return ['director', 'leader', 'sales', 'agent']
    }

    return (scope.allowedLevels as PersonnelRole[]) || []
  }

  /**
   * 过滤人员数据
   * 根据当前用户的权限范围过滤人员数据
   * 
   * @param {TreeNodeData[]} personnelData - 原始人员数据
   * @returns {TreeNodeData[]} 过滤后的人员数据
   */
  const filterPersonnelData = (personnelData: TreeNodeData[]): TreeNodeData[] => {
    const scope = hierarchyDataScope.value
    if (!scope || !personnelData.length) return []

    // 超管和总监可以查看所有数据
    if (scope.canViewAll) return personnelData

    // 根据角色进行数据过滤
    return personnelData.filter(person => {
      // 检查层级权限
      if (!canViewLevel(person.role)) return false

      // 销售组长：可以查看自己团队的数据
      if (currentUserRole.value === 'leader') {
        // 如果是自己，可以查看
        if (person.id === currentUserId.value) return true
        
        // 如果在允许的销售ID列表中，可以查看
        if (scope.allowedSalesIds?.includes(person.id)) return true
        
        // 如果在允许的代理ID列表中，可以查看
        if (scope.allowedAgentIds?.includes(person.id)) return true
        
        return false
      }

      // 销售人员：只能查看自己和自己发展的代理
      if (currentUserRole.value === 'sales') {
        // 如果是自己，可以查看
        if (person.id === currentUserId.value) return true
        
        // 如果是自己发展的代理，可以查看
        if (person.role === 'agent' && scope.allowedAgentIds?.includes(person.id)) return true
        
        return false
      }

      return false
    })
  }

  /**
   * 检查是否可以查看特定人员的详细信息
   * 
   * @param {TreeNodeData} person - 人员数据
   * @returns {boolean} 是否有权限查看该人员的详细信息
   */
  const canViewPersonDetail = (person: TreeNodeData): boolean => {
    const scope = hierarchyDataScope.value
    if (!scope) return false

    // 超管和总监可以查看所有人员详情
    if (scope.canViewAll) return true

    // 检查是否是自己
    if (person.id === currentUserId.value) return true

    // 根据角色检查权限
    switch (currentUserRole.value) {
      case 'leader':
        // 销售组长可以查看团队成员详情
        return scope.allowedSalesIds?.includes(person.id) || 
               scope.allowedAgentIds?.includes(person.id) || false

      case 'sales':
        // 销售人员只能查看自己发展的代理详情
        return person.role === 'agent' && 
               scope.allowedAgentIds?.includes(person.id) || false

      default:
        return false
    }
  }

  /**
   * 获取权限限制说明
   * 
   * @returns {string[]} 当前用户的权限限制说明
   */
  const getPermissionRestrictions = (): string[] => {
    const scope = hierarchyDataScope.value
    return scope?.restrictions || []
  }

  /**
   * 检查是否有层级查看权限
   * 
   * @returns {boolean} 是否有基本的层级查看权限
   */
  const hasHierarchyPermission = computed((): boolean => {
    const scope = hierarchyDataScope.value
    return scope ? (scope.canViewAll || scope.canViewTeam || scope.canViewPersonal) : false
  })

  return {
    // 响应式状态
    hierarchyDataScope,
    hasHierarchyPermission,
    currentUserRole,
    currentUserId,

    // 权限检查方法
    canViewLevel,
    canViewPersonDetail,
    
    // 数据处理方法
    filterPersonnelData,
    getAccessibleLevels,
    getPermissionRestrictions
  }
}

/**
 * 层级关系权限检查结果接口
 */
export interface HierarchyPermissionResult {
  hasPermission: boolean
  reason?: string
  allowedLevels?: PersonnelRole[]
  restrictions?: string[]
}

/**
 * 层级关系权限上下文接口
 */
export interface HierarchyPermissionContext {
  userId: string
  targetLevel?: PersonnelRole
  targetPersonId?: string
  operation?: 'view' | 'navigate' | 'detail'
}
