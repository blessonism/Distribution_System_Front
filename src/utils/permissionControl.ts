/**
 * 邀请系统权限控制工具
 * 提供精确的权限验证和角色限制检查
 */
import type { UserRole } from '@/types/api'
import type { InvitationCode } from '@/types/invitation'
import type { AuditDataScope } from '@/types/promotion'

/**
 * 权限验证结果接口
 */
export interface PermissionCheckResult {
  /** 是否有权限 */
  hasPermission: boolean
  /** 权限缺失的原因 */
  reason?: string
  /** 建议的操作或解决方案 */
  suggestion?: string
  /** 错误代码 */
  errorCode?: string
}

/**
 * 操作上下文接口
 */
export interface OperationContext {
  /** 当前用户角色 */
  userRole: UserRole
  /** 用户ID */
  userId?: string
  /** 操作类型 */
  operation: string
  /** 目标角色（如果适用） */
  targetRole?: UserRole
  /** 相关的邀请码（如果适用） */
  invitationCode?: InvitationCode
  /** 额外的上下文数据 */
  metadata?: Record<string, any>
}

/**
 * 角色层级定义
 * 数字越小，权限越高
 */
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  super_admin: 0,
  director: 1,
  leader: 2,
  sales: 3,
  agent: 4
}

/**
 * 邀请权限矩阵
 * 定义每个角色可以邀请哪些角色
 */
export const INVITATION_MATRIX: Record<UserRole, UserRole[]> = {
  super_admin: ['director', 'leader', 'sales', 'agent'],
  director: ['leader', 'sales', 'agent'],
  leader: ['sales', 'agent'],
  sales: ['agent'],
  agent: [] // 代理无法邀请任何人
}

/**
 * 邀请码数量限制
 */
export const INVITATION_CODE_LIMITS: Record<UserRole, number> = {
  super_admin: 4, // 超级管理员可以有4个邀请码
  director: 3,    // 销售总监可以有3个邀请码
  leader: 2,      // 销售组长可以有2个邀请码
  sales: 1,       // 销售人员可以有1个邀请码
  agent: 0        // 代理没有邀请码
}

/**
 * 操作权限矩阵
 * 定义每个角色可以执行的操作
 */
export const OPERATION_PERMISSIONS: Record<string, UserRole[]> = {
  'view_invitation_codes': ['super_admin', 'director', 'leader', 'sales'],
  'view_invitation_history': ['super_admin', 'director', 'leader', 'sales'],
  'view_invitation_stats': ['super_admin', 'director', 'leader', 'sales'],
  'generate_invitation_code': ['super_admin', 'director', 'leader', 'sales'],
  'activate_invitation_code': ['super_admin', 'director', 'leader', 'sales'],
  'deactivate_invitation_code': ['super_admin', 'director', 'leader', 'sales'],
  'export_invitation_history': ['super_admin', 'director', 'leader'],
  'export_invitation_stats': ['super_admin', 'director', 'leader'],
  'validate_invitation_code': ['super_admin', 'director', 'leader', 'sales', 'agent'], // 所有人都可以验证
  'use_invitation_code': ['super_admin', 'director', 'leader', 'sales', 'agent'], // 所有人都可以使用
  'view_all_invitations': ['super_admin'], // 只有超级管理员可以查看所有邀请
  'manage_user_invitations': ['super_admin'], // 只有超级管理员可以管理用户邀请权限
  
  // 推广审核权限
  'view_promotion_audit_list': ['super_admin', 'director', 'leader'],
  'view_promotion_task_detail': ['super_admin', 'director', 'leader'],
  'approve_promotion_task': ['super_admin', 'director', 'leader'],
  'reject_promotion_task': ['super_admin', 'director', 'leader'],
  'view_promotion_audit_stats': ['super_admin', 'director', 'leader'],
  'export_promotion_audit_data': ['super_admin', 'director'],
  'batch_audit_promotion': ['super_admin', 'director'], // V2功能
  'modify_audit_result': ['super_admin'], // 修改审核结果
  'view_all_auditor_data': ['super_admin'] // 查看所有审核员数据
}

/**
 * 权限控制器类
 */
export class InvitationPermissionController {
  /**
   * 检查用户是否有执行特定操作的权限
   */
  static checkOperationPermission(
    userRole: UserRole,
    operation: string
  ): PermissionCheckResult {
    const allowedRoles = OPERATION_PERMISSIONS[operation]
    
    if (!allowedRoles) {
      return {
        hasPermission: false,
        reason: '未知的操作类型',
        errorCode: 'UNKNOWN_OPERATION'
      }
    }
    
    if (allowedRoles.includes(userRole)) {
      return {
        hasPermission: true
      }
    }
    
    return {
      hasPermission: false,
      reason: `您的角色 (${this.getRoleDisplayName(userRole)}) 无权执行此操作`,
      suggestion: `此操作需要以下角色之一: ${allowedRoles.map(r => this.getRoleDisplayName(r)).join('、')}`,
      errorCode: 'INSUFFICIENT_ROLE'
    }
  }
  
  /**
   * 检查用户是否可以邀请指定角色
   */
  static checkInvitationPermission(
    userRole: UserRole,
    targetRole: UserRole
  ): PermissionCheckResult {
    // 检查基本邀请权限
    const basePermission = this.checkOperationPermission(userRole, 'generate_invitation_code')
    if (!basePermission.hasPermission) {
      return basePermission
    }
    
    // 检查是否可以邀请目标角色
    const allowedTargetRoles = INVITATION_MATRIX[userRole] || []
    
    if (!allowedTargetRoles.includes(targetRole)) {
      return {
        hasPermission: false,
        reason: `您无法邀请 ${this.getRoleDisplayName(targetRole)}`,
        suggestion: `您可以邀请: ${allowedTargetRoles.map(r => this.getRoleDisplayName(r)).join('、')}`,
        errorCode: 'TARGET_ROLE_NOT_ALLOWED'
      }
    }
    
    return {
      hasPermission: true
    }
  }
  
  /**
   * 检查用户是否可以创建更多邀请码
   */
  static checkInvitationCodeLimit(
    userRole: UserRole,
    currentCodeCount: number
  ): PermissionCheckResult {
    const limit = INVITATION_CODE_LIMITS[userRole] || 0
    
    if (limit === 0) {
      return {
        hasPermission: false,
        reason: `您的角色 (${this.getRoleDisplayName(userRole)}) 无法创建邀请码`,
        errorCode: 'ROLE_NO_INVITATION_RIGHTS'
      }
    }
    
    if (currentCodeCount >= limit) {
      return {
        hasPermission: false,
        reason: `您已达到邀请码数量上限 (${limit}个)`,
        suggestion: '请停用不需要的邀请码后再创建新的',
        errorCode: 'INVITATION_CODE_LIMIT_REACHED'
      }
    }
    
    return {
      hasPermission: true
    }
  }
  
  /**
   * 检查用户是否可以操作特定邀请码
   */
  static checkInvitationCodeOwnership(
    userRole: UserRole,
    userId: string,
    invitationCode: InvitationCode
  ): PermissionCheckResult {
    // 超级管理员可以操作所有邀请码
    if (userRole === 'super_admin') {
      return {
        hasPermission: true
      }
    }
    
    // 检查是否是邀请码的所有者
    if (invitationCode.userId !== userId) {
      return {
        hasPermission: false,
        reason: '您只能操作自己的邀请码',
        errorCode: 'NOT_CODE_OWNER'
      }
    }
    
    return {
      hasPermission: true
    }
  }
  
  /**
   * 检查用户是否可以使用邀请码
   */
  static checkInvitationCodeUsage(
    userRole: UserRole,
    userId: string,
    invitationCode: InvitationCode
  ): PermissionCheckResult {
    // 不能使用自己创建的邀请码
    if (invitationCode.userId === userId) {
      return {
        hasPermission: false,
        reason: '不能使用自己创建的邀请码',
        errorCode: 'CANNOT_USE_OWN_CODE'
      }
    }
    
    // 检查邀请码状态
    if (invitationCode.status !== 'active') {
      return {
        hasPermission: false,
        reason: '邀请码已停用或无效',
        errorCode: 'CODE_INACTIVE'
      }
    }
    
    // 检查邀请码是否过期
    if (invitationCode.expiresAt && new Date(invitationCode.expiresAt) < new Date()) {
      return {
        hasPermission: false,
        reason: '邀请码已过期',
        errorCode: 'CODE_EXPIRED'
      }
    }
    
    // 检查使用次数限制
    if (invitationCode.maxUsage && invitationCode.usageCount >= invitationCode.maxUsage) {
      return {
        hasPermission: false,
        reason: '邀请码使用次数已达上限',
        errorCode: 'CODE_USAGE_LIMIT_REACHED'
      }
    }
    
    return {
      hasPermission: true
    }
  }
  
  /**
   * 综合权限检查
   * 在执行任何邀请相关操作前调用此方法
   */
  static comprehensivePermissionCheck(
    context: OperationContext
  ): PermissionCheckResult {
    const { userRole, userId, operation, targetRole, invitationCode } = context
    
    // 1. 检查基本操作权限
    const operationCheck = this.checkOperationPermission(userRole, operation)
    if (!operationCheck.hasPermission) {
      return operationCheck
    }
    
    // 2. 根据操作类型进行特定检查
    switch (operation) {
      case 'generate_invitation_code':
        if (targetRole) {
          return this.checkInvitationPermission(userRole, targetRole)
        }
        break
        
      case 'activate_invitation_code':
      case 'deactivate_invitation_code':
        if (invitationCode && userId) {
          return this.checkInvitationCodeOwnership(userRole, userId, invitationCode)
        }
        break
        
      case 'use_invitation_code':
        if (invitationCode && userId) {
          return this.checkInvitationCodeUsage(userRole, userId, invitationCode)
        }
        break
    }
    
    return {
      hasPermission: true
    }
  }
  
  /**
   * 获取用户可邀请的角色列表
   */
  static getAllowedTargetRoles(userRole: UserRole): UserRole[] {
    return INVITATION_MATRIX[userRole] || []
  }
  
  /**
   * 获取用户的邀请码数量限制
   */
  static getInvitationCodeLimit(userRole: UserRole): number {
    return INVITATION_CODE_LIMITS[userRole] || 0
  }
  
  /**
   * 检查角色是否有邀请权限
   */
  static canRoleInvite(userRole: UserRole): boolean {
    return this.getInvitationCodeLimit(userRole) > 0
  }
  
  /**
   * 获取角色显示名称
   */
  static getRoleDisplayName(role: UserRole): string {
    const roleNames: Record<UserRole, string> = {
      super_admin: '超级管理员',
      director: '销售总监',
      leader: '销售组长',
      sales: '销售人员',
      agent: '代理'
    }
    return roleNames[role] || role
  }
  
  /**
   * 获取角色层级（数字越小权限越高）
   */
  static getRoleLevel(role: UserRole): number {
    return ROLE_HIERARCHY[role] ?? 999
  }
  
  /**
   * 比较两个角色的权限级别
   */
  static compareRoles(roleA: UserRole, roleB: UserRole): number {
    return this.getRoleLevel(roleA) - this.getRoleLevel(roleB)
  }
  
  /**
   * 检查角色A是否比角色B权限更高
   */
  static isHigherRole(roleA: UserRole, roleB: UserRole): boolean {
    return this.compareRoles(roleA, roleB) < 0
  }
  
  /**
   * 生成权限报告
   * 用于调试和审计
   */
  static generatePermissionReport(userRole: UserRole): {
    role: UserRole
    displayName: string
    level: number
    canInvite: boolean
    codeLimit: number
    allowedTargetRoles: UserRole[]
    allowedOperations: string[]
    restrictions: string[]
  } {
    const allowedOperations: string[] = []
    const restrictions: string[] = []
    
    // 检查所有操作权限
    Object.entries(OPERATION_PERMISSIONS).forEach(([operation, allowedRoles]) => {
      if (allowedRoles.includes(userRole)) {
        allowedOperations.push(operation)
      } else {
        restrictions.push(`无法执行: ${operation}`)
      }
    })
    
    return {
      role: userRole,
      displayName: this.getRoleDisplayName(userRole),
      level: this.getRoleLevel(userRole),
      canInvite: this.canRoleInvite(userRole),
      codeLimit: this.getInvitationCodeLimit(userRole),
      allowedTargetRoles: this.getAllowedTargetRoles(userRole),
      allowedOperations,
      restrictions
    }
  }
}

/**
 * 权限装饰器函数
 * 用于包装需要权限检查的函数
 */
export function requirePermission(
  operation: string,
  getUserContext: () => OperationContext
) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const method = descriptor.value
    
    descriptor.value = async function (...args: any[]) {
      const context = getUserContext()
      const permissionCheck = InvitationPermissionController.comprehensivePermissionCheck({
        ...context,
        operation
      })
      
      if (!permissionCheck.hasPermission) {
        const error = new Error(permissionCheck.reason || '权限不足')
        ;(error as any).code = permissionCheck.errorCode
        ;(error as any).suggestion = permissionCheck.suggestion
        throw error
      }
      
      return method.apply(this, args)
    }
  }
}

/**
 * 快捷权限检查函数
 */
export const PermissionCheck = {
  /**
   * 检查是否可以访问邀请功能
   */
  canAccessInvitation: (userRole: UserRole): PermissionCheckResult => {
    return InvitationPermissionController.checkOperationPermission(userRole, 'view_invitation_codes')
  },
  
  /**
   * 检查是否可以邀请特定角色
   */
  canInviteRole: (userRole: UserRole, targetRole: UserRole): PermissionCheckResult => {
    return InvitationPermissionController.checkInvitationPermission(userRole, targetRole)
  },
  
  /**
   * 检查是否可以导出数据
   */
  canExport: (userRole: UserRole): PermissionCheckResult => {
    return InvitationPermissionController.checkOperationPermission(userRole, 'export_invitation_history')
  },
  
  /**
   * 检查是否可以查看统计
   */
  canViewStats: (userRole: UserRole): PermissionCheckResult => {
    return InvitationPermissionController.checkOperationPermission(userRole, 'view_invitation_stats')
  },

  // 推广审核权限检查函数
  /**
   * 检查是否可以访问推广审核列表
   */
  canAccessPromotionAudit: (userRole: UserRole): PermissionCheckResult => {
    return InvitationPermissionController.checkOperationPermission(userRole, 'view_promotion_audit_list')
  },

  /**
   * 检查是否可以查看推广任务详情
   */
  canViewPromotionTaskDetail: (userRole: UserRole): PermissionCheckResult => {
    return InvitationPermissionController.checkOperationPermission(userRole, 'view_promotion_task_detail')
  },

  /**
   * 检查是否可以审核通过推广任务
   */
  canApprovePromotionTask: (userRole: UserRole): PermissionCheckResult => {
    return InvitationPermissionController.checkOperationPermission(userRole, 'approve_promotion_task')
  },

  /**
   * 检查是否可以拒绝推广任务
   */
  canRejectPromotionTask: (userRole: UserRole): PermissionCheckResult => {
    return InvitationPermissionController.checkOperationPermission(userRole, 'reject_promotion_task')
  },

  /**
   * 检查是否可以查看推广审核统计
   */
  canViewPromotionAuditStats: (userRole: UserRole): PermissionCheckResult => {
    return InvitationPermissionController.checkOperationPermission(userRole, 'view_promotion_audit_stats')
  },

  /**
   * 检查是否可以导出推广审核数据
   */
  canExportPromotionAuditData: (userRole: UserRole): PermissionCheckResult => {
    return InvitationPermissionController.checkOperationPermission(userRole, 'export_promotion_audit_data')
  },

  /**
   * 检查是否可以批量审核推广任务
   */
  canBatchAuditPromotion: (userRole: UserRole): PermissionCheckResult => {
    return InvitationPermissionController.checkOperationPermission(userRole, 'batch_audit_promotion')
  },

  /**
   * 获取推广审核数据范围权限
   */
  getPromotionAuditDataScope: (userRole: UserRole, userId: string): AuditDataScope => {
    switch (userRole) {
      case 'super_admin':
        return {
          canViewAll: true
        }
      case 'director':
        return {
          canViewAll: false,
          // 销售总监可以查看其管辖范围内的数据
          // 具体的销售ID列表需要从API获取
          allowedSalesIds: [] // 此处应该从用户管理系统获取实际的下属销售ID
        }
      case 'leader':
        return {
          canViewAll: false,
          // 销售组长只能查看其管辖销售发展的代理数据
          // 具体的代理ID和销售ID列表需要从API获取
          allowedAgentIds: [], // 此处应该从用户管理系统获取实际的下属代理ID
          allowedSalesIds: []  // 此处应该从用户管理系统获取实际的下属销售ID
        }
      default:
        return {
          canViewAll: false,
          allowedAgentIds: [],
          allowedSalesIds: []
        }
    }
  }
}

/**
 * 默认导出权限控制器
 */
export default InvitationPermissionController