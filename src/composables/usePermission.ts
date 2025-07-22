/**
 * 权限控制 Composable
 * 提供响应式的权限检查和状态管理
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
 */
export interface PermissionState {
  /** 是否有权限 */
  hasPermission: boolean
  /** 权限检查结果 */
  checkResult: PermissionCheckResult | null
  /** 是否正在检查权限 */
  checking: boolean
  /** 错误信息 */
  error: string | null
}

/**
 * 邀请权限状态接口
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
 */
export function usePermission() {
  const userStore = useUserStore()
  
  // 当前用户角色
  const currentRole = computed(() => userStore.userInfo?.role as UserRole)
  const currentUserId = computed(() => userStore.userInfo?.id)
  
  /**
   * 检查操作权限
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
 * 支持实时权限状态变化
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
 * 用于页面或组件级别的权限控制
 */
export function usePermissionGuard() {
  const { currentRole } = usePermission()
  
  /**
   * 要求特定权限
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
 * 用于生成用户友好的权限提示信息
 */
export function usePermissionHints() {
  const { currentRole } = usePermission()
  
  /**
   * 生成权限缺失提示
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
 */
export default usePermission