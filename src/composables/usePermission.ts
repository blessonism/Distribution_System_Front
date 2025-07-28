/**
 * @fileoverview 权限控制组合式API模块
 * 基于Vue 3 Composition API的响应式权限检查和状态管理系统
 * 提供完整的权限验证、动态检查、权限守卫等功能
 * 
 * @module composables/usePermission
 * @requires vue
 * @requires @/types/api
 * @requires @/types/invitation
 * @requires @/store/user
 * @requires @/utils/permissionControl
 */

import { computed, ref, watchEffect } from 'vue'
import type { ComputedRef, Ref } from 'vue'
import type { UserRole } from '@/types/api'
import type { InvitationCode } from '@/types/invitation'
import { useUserStore } from '@/store/user'
import { 
  InvitationPermissionController, 
  PermissionCheck,
  type PermissionCheckResult,
  type OperationContext
} from '@/utils/permissionControl'

/**
 * 权限状态接口
 * 定义权限检查的完整状态信息
 * 
 * @interface PermissionState
 * 
 * @example
 * ```typescript
 * const permissionState: PermissionState = {
 *   hasPermission: true,
 *   checkResult: { hasPermission: true },
 *   checking: false,
 *   error: null
 * }
 * ```
 */
export interface PermissionState {
  /** 是否有权限执行操作 */
  hasPermission: boolean
  /** 详细的权限检查结果 */
  checkResult: PermissionCheckResult | null
  /** 是否正在进行权限检查 */
  checking: boolean
  /** 权限检查过程中的错误信息 */
  error: string | null
}

/**
 * 邀请权限状态接口
 * 定义用户在邀请功能中的完整权限状态和限制信息
 * 
 * @interface InvitationPermissions
 * 
 * @example
 * ```typescript
 * const permissions: InvitationPermissions = {
 *   canAccessInvitation: true,
 *   canViewCodes: true,
 *   canViewHistory: true,
 *   canViewStats: false,
 *   canGenerateCodes: true,
 *   canExport: false,
 *   allowedTargetRoles: ['agent'],
 *   codeLimit: 10,
 *   roleDisplayName: '销售人员'
 * }
 * ```
 */
export interface InvitationPermissions {
  /** 是否可以访问邀请功能 */
  canAccessInvitation: boolean
  /** 是否可以查看邀请码 */
  canViewCodes: boolean
  /** 是否可以查看邀请历史 */
  canViewHistory: boolean
  /** 是否可以查看邀请统计 */
  canViewStats: boolean
  /** 是否可以生成邀请码 */
  canGenerateCodes: boolean
  /** 是否可以导出数据 */
  canExport: boolean
  /** 可以邀请的角色列表 */
  allowedTargetRoles: UserRole[]
  /** 邀请码数量限制 */
  codeLimit: number
  /** 当前角色显示名称 */
  roleDisplayName: string
}

/**
 * 基础权限检查 Composable
 * 提供权限验证的核心功能，包括操作权限、邀请权限、邀请码权限等检查
 * 
 * @function usePermission
 * @returns {Object} 权限检查相关的响应式状态和方法
 * @complexity O(1) - 各个权限检查方法的时间复杂度均为常数级
 * @flow 获取用户信息 -> 构建权限检查函数 -> 返回响应式权限状态
 * 
 * @example
 * ```typescript
 * // 在组件中使用
 * const { 
 *   currentRole, 
 *   checkOperationPermission, 
 *   checkInvitationPermission 
 * } = usePermission()
 * 
 * // 检查特定操作权限
 * const canCreateInvite = checkOperationPermission('create_invitation_code')
 * console.log(canCreateInvite.value.hasPermission) // true/false
 * 
 * // 检查邀请权限
 * const targetRole = ref('agent')
 * const invitePermission = checkInvitationPermission(targetRole)
 * console.log(invitePermission.value.error) // 错误信息或null
 * ```
 */
export function usePermission() {
  const userStore = useUserStore()
  
  // 当前用户角色
  const currentRole = computed(() => userStore.userInfo?.role as UserRole)
  const currentUserId = computed(() => userStore.userInfo?.id)
  
  /**
   * 检查操作权限
   * 根据当前用户角色验证是否有执行特定操作的权限
   * 
   * @param {string} operation - 操作类型，如 'create_invitation_code', 'view_stats' 等
   * @returns {ComputedRef<PermissionState>} 响应式的权限检查状态
   * @complexity O(1) - 权限检查为常数时间操作
   * @flow 获取当前角色 -> 调用权限控制器 -> 封装返回状态
   * 
   * @example
   * ```typescript
   * const canViewStats = checkOperationPermission('view_invitation_stats')
   * 
   * watchEffect(() => {
   *   if (canViewStats.value.hasPermission) {
   *     console.log('用户可以查看统计信息')
   *   } else {
   *     console.log('权限不足:', canViewStats.value.error)
   *   }
   * })
   * ```
   */
  const checkOperationPermission = (operation: string): ComputedRef<PermissionState> => {
    return computed(() => {
      const role = currentRole.value
      if (!role) {
        return {
          hasPermission: false,
          checkResult: {
            hasPermission: false,
            reason: '用户未登录或角色信息不完整',
            errorCode: 'USER_NOT_AUTHENTICATED'
          },
          checking: false,
          error: '用户未登录'
        }
      }

      const result = InvitationPermissionController.checkOperationPermission(role, operation)
      
      return {
        hasPermission: result.hasPermission,
        checkResult: result,
        checking: false,
        error: result.hasPermission ? null : result.reason || '权限不足'
      }
    })
  }

  /**
   * 检查邀请权限
   * 验证当前用户是否有权限邀请指定角色的用户
   * 
   * @param {Ref<UserRole | undefined>} targetRole - 响应式的目标用户角色
   * @returns {ComputedRef<PermissionState>} 响应式的邀请权限检查状态
   * @complexity O(1) - 邀请权限检查为常数时间操作
   * @flow 获取当前角色和目标角色 -> 调用邀请权限控制器 -> 封装返回状态
   * 
   * @example
   * ```typescript
   * const targetRole = ref<UserRole>('agent')
   * const invitePermission = checkInvitationPermission(targetRole)
   * 
   * // 响应式监听权限变化
   * watch(invitePermission, (permission) => {
   *   if (permission.hasPermission) {
   *     enableInviteButton()
   *   } else {
   *     showToast(permission.error)
   *   }
   * })
   * ```
   */
  const checkInvitationPermission = (targetRole: Ref<UserRole | undefined>): ComputedRef<PermissionState> => {
    return computed(() => {
      const role = currentRole.value
      const target = targetRole.value
      
      if (!role) {
        return {
          hasPermission: false,
          checkResult: {
            hasPermission: false,
            reason: '用户未登录或角色信息不完整',
            errorCode: 'USER_NOT_AUTHENTICATED'
          },
          checking: false,
          error: '用户未登录'
        }
      }

      if (!target) {
        return {
          hasPermission: false,
          checkResult: {
            hasPermission: false,
            reason: '目标角色未指定',
            errorCode: 'TARGET_ROLE_MISSING'
          },
          checking: false,
          error: '目标角色未指定'
        }
      }

      const result = InvitationPermissionController.checkInvitationPermission(role, target)
      
      return {
        hasPermission: result.hasPermission,
        checkResult: result,
        checking: false,
        error: result.hasPermission ? null : result.reason || '邀请权限不足'
      }
    })
  }

  /**
   * 检查邀请码操作权限
   * 验证当前用户对特定邀请码是否有执行指定操作的权限
   * 
   * @param {Ref<InvitationCode | undefined>} invitationCode - 响应式的邀请码对象
   * @param {string} operation - 操作类型，如 'edit', 'delete', 'view_details' 等
   * @returns {ComputedRef<PermissionState>} 响应式的邀请码操作权限状态
   * @complexity O(1) - 综合权限检查为常数时间操作
   * @flow 获取用户信息和邀请码 -> 构建操作上下文 -> 调用综合权限检查
   * 
   * @example
   * ```typescript
   * const inviteCode = ref<InvitationCode>(codeData)
   * const canEdit = checkInvitationCodePermission(inviteCode, 'edit')
   * 
   * // 在模板中使用
   * const showEditButton = computed(() => canEdit.value.hasPermission)
   * ```
   */
  const checkInvitationCodePermission = (
    invitationCode: Ref<InvitationCode | undefined>,
    operation: string
  ): ComputedRef<PermissionState> => {
    return computed(() => {
      const role = currentRole.value
      const userId = currentUserId.value
      const code = invitationCode.value
      
      if (!role || !userId) {
        return {
          hasPermission: false,
          checkResult: {
            hasPermission: false,
            reason: '用户未登录或信息不完整',
            errorCode: 'USER_NOT_AUTHENTICATED'
          },
          checking: false,
          error: '用户未登录'
        }
      }

      if (!code) {
        return {
          hasPermission: false,
          checkResult: {
            hasPermission: false,
            reason: '邀请码信息不完整',
            errorCode: 'INVITATION_CODE_MISSING'
          },
          checking: false,
          error: '邀请码信息不完整'
        }
      }

      const context: OperationContext = {
        userRole: role,
        userId,
        operation,
        invitationCode: code
      }

      const result = InvitationPermissionController.comprehensivePermissionCheck(context)
      
      return {
        hasPermission: result.hasPermission,
        checkResult: result,
        checking: false,
        error: result.hasPermission ? null : result.reason || '操作权限不足'
      }
    })
  }

  /**
   * 综合权限检查
   * 基于完整的操作上下文进行全面的权限验证
   * 
   * @param {Ref<OperationContext>} context - 响应式的操作上下文，包含角色、用户ID、操作类型等
   * @returns {ComputedRef<PermissionState>} 响应式的综合权限检查状态
   * @complexity O(1) - 综合权限检查为常数时间操作
   * @flow 获取操作上下文 -> 验证必要字段 -> 调用权限控制器 -> 返回检查结果
   * 
   * @example
   * ```typescript
   * const context = ref<OperationContext>({
   *   userRole: 'sales',
   *   userId: '123',
   *   operation: 'create_invitation_code',
   *   targetRole: 'agent',
   *   metadata: { source: 'dashboard' }
   * })
   * 
   * const permission = comprehensiveCheck(context)
   * console.log(permission.value.checkResult?.suggestion) // 获取权限建议
   * ```
   */
  const comprehensiveCheck = (context: Ref<OperationContext>): ComputedRef<PermissionState> => {
    return computed(() => {
      const ctx = context.value
      
      if (!ctx.userRole) {
        return {
          hasPermission: false,
          checkResult: {
            hasPermission: false,
            reason: '用户角色信息缺失',
            errorCode: 'USER_ROLE_MISSING'
          },
          checking: false,
          error: '用户角色信息缺失'
        }
      }

      const result = InvitationPermissionController.comprehensivePermissionCheck(ctx)
      
      return {
        hasPermission: result.hasPermission,
        checkResult: result,
        checking: false,
        error: result.hasPermission ? null : result.reason || '权限检查失败'
      }
    })
  }

  return {
    currentRole,
    currentUserId,
    checkOperationPermission,
    checkInvitationPermission,
    checkInvitationCodePermission,
    comprehensiveCheck
  }
}

/**
 * 邀请功能权限 Composable
 * 提供当前用户在邀请系统中的完整权限状态，包括各项操作权限和限制信息
 * 
 * @function useInvitationPermissions
 * @returns {ComputedRef<InvitationPermissions>} 响应式的邀请权限状态对象
 * @complexity O(1) - 权限状态计算为常数时间操作
 * @flow 获取用户角色 -> 检查各项权限 -> 获取角色限制 -> 构建完整权限对象
 * 
 * @example
 * ```typescript
 * // 在组件中使用
 * const invitePermissions = useInvitationPermissions()
 * 
 * // 访问权限状态
 * const canCreateCodes = computed(() => invitePermissions.value.canGenerateCodes)
 * const allowedRoles = computed(() => invitePermissions.value.allowedTargetRoles)
 * 
 * // 在模板中使用
 * <button v-if="invitePermissions.canViewStats" @click="showStats">
 *   查看统计
 * </button>
 * ```
 */
export function useInvitationPermissions(): ComputedRef<InvitationPermissions> {
  const userStore = useUserStore()
  
  return computed(() => {
    const role = userStore.userInfo?.role as UserRole
    
    if (!role) {
      return {
        canAccessInvitation: false,
        canViewCodes: false,
        canViewHistory: false,
        canViewStats: false,
        canGenerateCodes: false,
        canExport: false,
        allowedTargetRoles: [],
        codeLimit: 0,
        roleDisplayName: '未知角色'
      }
    }

    // 检查各项权限
    const canAccessInvitation = PermissionCheck.canAccessInvitation(role).hasPermission
    const canViewCodes = InvitationPermissionController.checkOperationPermission(role, 'view_invitation_codes').hasPermission
    const canViewHistory = InvitationPermissionController.checkOperationPermission(role, 'view_invitation_history').hasPermission
    const canViewStats = InvitationPermissionController.checkOperationPermission(role, 'view_invitation_stats').hasPermission
    const canGenerateCodes = InvitationPermissionController.checkOperationPermission(role, 'generate_invitation_code').hasPermission
    const canExport = PermissionCheck.canExport(role).hasPermission
    
    return {
      canAccessInvitation,
      canViewCodes,
      canViewHistory,
      canViewStats,
      canGenerateCodes,
      canExport,
      allowedTargetRoles: InvitationPermissionController.getAllowedTargetRoles(role),
      codeLimit: InvitationPermissionController.getInvitationCodeLimit(role),
      roleDisplayName: InvitationPermissionController.getRoleDisplayName(role)
    }
  })
}

/**
 * 动态权限检查 Composable
 * 支持实时权限状态变化，当操作类型或相关参数变化时自动重新检查权限
 * 
 * @function useDynamicPermission
 * @param {Ref<string>} operation - 响应式的操作类型
 * @param {Ref<Object>} options - 响应式的操作选项，包含目标角色、邀请码等
 * @returns {Object} 包含权限状态和相关计算属性的对象
 * @complexity O(1) - 每次权限检查为常数时间操作
 * @flow 监听参数变化 -> 重新执行权限检查 -> 更新权限状态 -> 触发响应式更新
 * 
 * @example
 * ```typescript
 * const operation = ref('create_invitation_code')
 * const options = ref({ targetRole: 'agent' })
 * 
 * const {
 *   permissionState,
 *   hasPermission,
 *   isChecking,
 *   error
 * } = useDynamicPermission(operation, options)
 * 
 * // 动态改变操作类型
 * operation.value = 'view_invitation_stats'
 * // 权限状态会自动重新计算
 * 
 * // 监听权限变化
 * watch(hasPermission, (canAccess) => {
 *   if (canAccess) {
 *     console.log('用户获得权限')
 *   }
 * })
 * ```
 */
export function useDynamicPermission(
  operation: Ref<string>,
  options: Ref<{
    targetRole?: UserRole
    invitationCode?: InvitationCode
    metadata?: Record<string, any>
  }> = ref({})
) {
  const userStore = useUserStore()
  const permissionState = ref<PermissionState>({
    hasPermission: false,
    checkResult: null,
    checking: false,
    error: null
  })

  // 实时权限检查
  watchEffect(() => {
    const role = userStore.userInfo?.role as UserRole
    const userId = userStore.userInfo?.id
    const op = operation.value
    const opts = options.value

    if (!role || !op) {
      permissionState.value = {
        hasPermission: false,
        checkResult: {
          hasPermission: false,
          reason: '用户信息或操作类型缺失',
          errorCode: 'INCOMPLETE_CONTEXT'
        },
        checking: false,
        error: '权限检查条件不足'
      }
      return
    }

    permissionState.value.checking = true

    try {
      const context: OperationContext = {
        userRole: role,
        userId,
        operation: op,
        targetRole: opts.targetRole,
        invitationCode: opts.invitationCode,
        metadata: opts.metadata
      }

      const result = InvitationPermissionController.comprehensivePermissionCheck(context)
      
      permissionState.value = {
        hasPermission: result.hasPermission,
        checkResult: result,
        checking: false,
        error: result.hasPermission ? null : result.reason || '权限不足'
      }
    } catch (error) {
      permissionState.value = {
        hasPermission: false,
        checkResult: {
          hasPermission: false,
          reason: '权限检查过程中发生错误',
          errorCode: 'PERMISSION_CHECK_ERROR'
        },
        checking: false,
        error: error instanceof Error ? error.message : '未知错误'
      }
    }
  })

  return {
    permissionState: computed(() => permissionState.value),
    hasPermission: computed(() => permissionState.value.hasPermission),
    isChecking: computed(() => permissionState.value.checking),
    error: computed(() => permissionState.value.error),
    checkResult: computed(() => permissionState.value.checkResult)
  }
}

/**
 * 权限守卫 Composable
 * 用于页面或组件级别的权限控制，提供强制权限验证和错误抛出功能
 * 
 * @function usePermissionGuard
 * @returns {Object} 包含权限守卫方法的对象
 * @complexity O(1) - 权限检查和守卫验证为常数时间操作
 * @flow 获取用户角色 -> 执行权限检查 -> 通过或抛出错误
 * 
 * @example
 * ```typescript
 * // 在路由守卫中使用
 * const { requirePermission, requireRole } = usePermissionGuard()
 * 
 * try {
 *   requirePermission('create_invitation_code')
 *   console.log('权限验证通过')
 * } catch (error) {
 *   router.push('/unauthorized')
 *   console.error(error.message)
 * }
 * 
 * // 在组件初始化时使用
 * onMounted(() => {
 *   try {
 *     requireRole(['sales', 'leader'])
 *   } catch (error) {
 *     showErrorToast(error.message)
 *     router.back()
 *   }
 * })
 * ```
 */
export function usePermissionGuard() {
  const { currentRole } = usePermission()
  
  /**
   * 要求特定权限
   * 强制要求用户具有指定操作的权限，权限不足时抛出错误
   * 
   * @param {string} operation - 要求的操作权限
   * @returns {boolean} 权限验证通过时返回 true
   * @throws {Error} 权限不足时抛出包含错误信息的异常
   * @complexity O(1) - 权限检查为常数时间操作
   * @flow 检查登录状态 -> 验证操作权限 -> 通过或抛出异常
   */
  const requirePermission = (operation: string): boolean => {
    const role = currentRole.value
    if (!role) {
      throw new Error('用户未登录，无法访问此功能')
    }

    const result = InvitationPermissionController.checkOperationPermission(role, operation)
    if (!result.hasPermission) {
      throw new Error(result.reason || '权限不足，无法访问此功能')
    }

    return true
  }

  /**
   * 要求特定角色
   * 强制要求用户具有指定角色之一，角色不匹配时抛出错误
   * 
   * @param {UserRole | UserRole[]} allowedRoles - 允许的角色，可以是单个角色或角色数组
   * @returns {boolean} 角色验证通过时返回 true
   * @throws {Error} 角色不匹配时抛出包含错误信息的异常
   * @complexity O(1) - 角色检查为常数时间操作
   * @flow 检查登录状态 -> 规范化角色列表 -> 验证角色匹配 -> 通过或抛出异常
   */
  const requireRole = (allowedRoles: UserRole | UserRole[]): boolean => {
    const role = currentRole.value
    if (!role) {
      throw new Error('用户未登录，无法访问此功能')
    }

    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]
    if (!roles.includes(role)) {
      const roleNames = roles.map(r => InvitationPermissionController.getRoleDisplayName(r)).join('、')
      throw new Error(`此功能仅限 ${roleNames} 访问`)
    }

    return true
  }

  /**
   * 要求邀请权限
   * 强制要求用户具有邀请指定角色用户的权限，权限不足时抛出错误
   * 
   * @param {UserRole} targetRole - 要邀请的目标用户角色
   * @returns {boolean} 邀请权限验证通过时返回 true
   * @throws {Error} 邀请权限不足时抛出包含错误信息的异常
   * @complexity O(1) - 邀请权限检查为常数时间操作
   * @flow 检查登录状态 -> 验证邀请权限 -> 通过或抛出异常
   */
  const requireInvitationPermission = (targetRole: UserRole): boolean => {
    const role = currentRole.value
    if (!role) {
      throw new Error('用户未登录，无法使用邀请功能')
    }

    const result = InvitationPermissionController.checkInvitationPermission(role, targetRole)
    if (!result.hasPermission) {
      throw new Error(result.reason || '邀请权限不足')
    }

    return true
  }

  return {
    currentRole,
    requirePermission,
    requireRole,
    requireInvitationPermission
  }
}

/**
 * 权限提示 Composable
 * 用于生成用户友好的权限提示信息，帮助用户理解权限状态和改进建议
 * 
 * @function usePermissionHints
 * @returns {Object} 包含权限提示方法的对象
 * @complexity O(1) - 权限提示生成为常数时间操作
 * @flow 获取用户角色 -> 检查权限状态 -> 生成友好提示信息
 * 
 * @example
 * ```typescript
 * const { 
 *   getPermissionHint, 
 *   getRolePermissionReport,
 *   getInvitationHint 
 * } = usePermissionHints()
 * 
 * // 获取操作权限提示
 * const hint = getPermissionHint('create_invitation_code')
 * console.log(hint) // "您有权限执行此操作" 或 "权限不足，需要销售人员以上角色"
 * 
 * // 获取角色权限报告
 * const report = getRolePermissionReport()
 * console.log(report?.allowedOperations) // 显示所有允许的操作
 * 
 * // 获取邀请权限提示
 * const inviteHint = getInvitationHint('agent')
 * showTooltip(inviteHint)
 * ```
 */
export function usePermissionHints() {
  const { currentRole } = usePermission()
  
  /**
   * 生成权限缺失提示
   * 根据用户当前角色和操作类型生成友好的权限提示信息
   * 
   * @param {string} operation - 操作类型
   * @returns {string} 权限提示文本
   * @complexity O(1) - 权限检查和提示生成为常数时间操作
   * @flow 获取用户角色 -> 检查操作权限 -> 返回相应提示信息
   */
  const getPermissionHint = (operation: string): string => {
    const role = currentRole.value
    if (!role) {
      return '请先登录后再尝试此操作'
    }

    const result = InvitationPermissionController.checkOperationPermission(role, operation)
    if (result.hasPermission) {
      return '您有权限执行此操作'
    }

    return result.suggestion || result.reason || '权限不足，无法执行此操作'
  }

  /**
   * 生成角色权限报告
   * 为当前用户角色生成完整的权限报告，包含允许和禁止的操作
   * 
   * @returns {Object | null} 角色权限报告对象，未登录时返回 null
   * @complexity O(1) - 权限报告生成为常数时间操作
   * @flow 获取用户角色 -> 调用权限控制器 -> 生成权限报告
   */
  const getRolePermissionReport = () => {
    const role = currentRole.value
    if (!role) {
      return null
    }

    return InvitationPermissionController.generatePermissionReport(role)
  }

  /**
   * 生成邀请权限提示
   * 根据目标角色生成邀请权限的友好提示信息
   * 
   * @param {UserRole} targetRole - 要邀请的目标用户角色
   * @returns {string} 邀请权限提示文本
   * @complexity O(1) - 权限检查和提示生成为常数时间操作
   * @flow 获取用户角色 -> 检查邀请权限 -> 返回相应提示信息
   */
  const getInvitationHint = (targetRole: UserRole): string => {
    const role = currentRole.value
    if (!role) {
      return '请先登录后再尝试邀请操作'
    }

    const result = InvitationPermissionController.checkInvitationPermission(role, targetRole)
    if (result.hasPermission) {
      return `您可以邀请${InvitationPermissionController.getRoleDisplayName(targetRole)}`
    }

    return result.suggestion || result.reason || '无法邀请此角色'
  }

  return {
    currentRole,
    getPermissionHint,
    getRolePermissionReport,
    getInvitationHint
  }
}

/**
 * 默认导出
 * 导出基础权限检查 Composable 作为模块的默认导出
 * 
 * @example
 * ```typescript
 * // 默认导入
 * import usePermission from '@/composables/usePermission'
 * 
 * // 使用默认导出
 * const permission = usePermission()
 * ```
 */
export default usePermission