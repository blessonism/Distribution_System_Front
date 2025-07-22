/**
 * 邀请码相关工具函数
 */
import type { ValidateCodeRequest, ValidateCodeResponse, InvitationCode } from '@/types/invitation'
import type { UserRole } from '@/types/api'
import { validateCode as validateCodeAPI } from '@/api/invitation'

// 邀请码格式验证规则
export const INVITE_CODE_RULES = {
  // 邀请码长度范围
  MIN_LENGTH: 6,
  MAX_LENGTH: 12,
  // 邀请码字符集合（数字+大写字母，排除易混淆字符）
  ALLOWED_CHARS: 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789',
  // 邀请码正则表达式
  PATTERN: /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6,12}$/,
  // 禁用的易混淆字符
  EXCLUDED_CHARS: ['0', 'O', 'I', '1']
} as const

/**
 * 邀请码格式验证
 * @param code 邀请码
 * @returns 验证结果
 */
export interface InviteCodeValidationResult {
  isValid: boolean
  error?: string
  normalizedCode?: string
}

export function validateInviteCodeFormat(code: string): InviteCodeValidationResult {
  if (!code) {
    return { isValid: false, error: '邀请码不能为空' }
  }

  const trimmedCode = code.trim().toUpperCase()

  if (trimmedCode.length < INVITE_CODE_RULES.MIN_LENGTH) {
    return { isValid: false, error: `邀请码长度至少${INVITE_CODE_RULES.MIN_LENGTH}位` }
  }

  if (trimmedCode.length > INVITE_CODE_RULES.MAX_LENGTH) {
    return { isValid: false, error: `邀请码长度最多${INVITE_CODE_RULES.MAX_LENGTH}位` }
  }

  if (!INVITE_CODE_RULES.PATTERN.test(trimmedCode)) {
    return { isValid: false, error: '邀请码格式不正确，只能包含数字和大写字母' }
  }

  // 检查是否包含易混淆字符
  for (const excludedChar of INVITE_CODE_RULES.EXCLUDED_CHARS) {
    if (trimmedCode.includes(excludedChar)) {
      return { isValid: false, error: '邀请码包含不允许的字符（0、O、I、1）' }
    }
  }

  return { 
    isValid: true, 
    normalizedCode: trimmedCode 
  }
}

/**
 * 邀请码完整验证（格式验证 + 服务器验证）
 * @param code 邀请码
 * @returns 验证结果
 */
export interface CompleteValidationResult {
  isValid: boolean
  error?: string
  normalizedCode?: string
  inviterInfo?: {
    id: string
    name: string
    role: UserRole
  }
  targetRole?: UserRole
  expiresAt?: string
  maxUsage?: number
  usageCount?: number
}

export async function validateInviteCodeComplete(code: string): Promise<CompleteValidationResult> {
  // 先进行格式验证
  const formatValidation = validateInviteCodeFormat(code)
  if (!formatValidation.isValid) {
    return {
      isValid: false,
      error: formatValidation.error
    }
  }

  try {
    // 调用API进行服务器验证
    const response = await validateCodeAPI(formatValidation.normalizedCode!)

    if (response.valid && response.inviterInfo) {
      return {
        isValid: true,
        normalizedCode: formatValidation.normalizedCode,
        inviterInfo: response.inviterInfo,
        targetRole: response.targetRole,
        expiresAt: response.expiresAt,
        maxUsage: response.maxUsage,
        usageCount: response.usageCount
      }
    } else {
      return {
        isValid: false,
        error: response.message || '邀请码无效或已过期'
      }
    }
  } catch (error) {
    console.error('邀请码验证API调用失败:', error)
    return {
      isValid: false,
      error: '验证邀请码时发生错误，请稍后重试'
    }
  }
}

/**
 * 从URL参数中提取邀请码信息
 * @param searchParams URLSearchParams对象
 * @returns 邀请信息
 */
export interface UrlInvitationInfo {
  inviteCode?: string
  targetRole?: UserRole
  hasInvitation: boolean
}

export function extractInvitationFromUrl(searchParams: URLSearchParams): UrlInvitationInfo {
  const inviteCode = searchParams.get('invite')
  const targetRole = searchParams.get('role') as UserRole

  return {
    inviteCode: inviteCode || undefined,
    targetRole: targetRole || undefined,
    hasInvitation: !!inviteCode
  }
}

/**
 * 生成邀请链接
 * @param code 邀请码
 * @param targetRole 目标角色
 * @param baseUrl 基础URL，默认为当前域名
 * @returns 完整的邀请链接
 */
export function generateInvitationUrl(
  code: string, 
  targetRole: UserRole, 
  baseUrl?: string
): string {
  const base = baseUrl || window.location.origin
  const params = new URLSearchParams({
    invite: code,
    role: targetRole
  })
  
  return `${base}/login?${params.toString()}`
}

/**
 * 邀请码状态检查
 * @param inviteCode 邀请码对象
 * @returns 状态信息
 */
export interface InviteCodeStatus {
  isActive: boolean
  isExpired: boolean
  isExhausted: boolean
  remainingUsage: number | 'unlimited'
  status: 'active' | 'expired' | 'exhausted' | 'inactive'
  statusText: string
  canUse: boolean
}

export function getInviteCodeStatus(inviteCode: InvitationCode): InviteCodeStatus {
  const now = new Date()
  const isExpired = inviteCode.expiresAt ? new Date(inviteCode.expiresAt) < now : false
  const isExhausted = inviteCode.maxUsage ? inviteCode.usageCount >= inviteCode.maxUsage : false
  const isActive = inviteCode.status === 'active'
  
  let status: InviteCodeStatus['status']
  let statusText: string
  
  if (!isActive) {
    status = 'inactive'
    statusText = '已停用'
  } else if (isExpired) {
    status = 'expired'
    statusText = '已过期'
  } else if (isExhausted) {
    status = 'exhausted'
    statusText = '已用完'
  } else {
    status = 'active'
    statusText = '正常'
  }
  
  const remainingUsage = inviteCode.maxUsage 
    ? Math.max(0, inviteCode.maxUsage - inviteCode.usageCount)
    : 'unlimited' as const
  
  return {
    isActive,
    isExpired,
    isExhausted,
    remainingUsage,
    status,
    statusText,
    canUse: isActive && !isExpired && !isExhausted
  }
}

/**
 * 邀请码使用情况统计
 * @param inviteCodes 邀请码列表
 * @returns 统计信息
 */
export interface InviteCodeStats {
  total: number
  active: number
  expired: number
  exhausted: number
  inactive: number
  totalUsage: number
  averageUsage: number
}

export function calculateInviteCodeStats(inviteCodes: InvitationCode[]): InviteCodeStats {
  const stats = inviteCodes.reduce((acc, code) => {
    const status = getInviteCodeStatus(code)
    
    acc.total++
    acc.totalUsage += code.usageCount
    
    switch (status.status) {
      case 'active':
        acc.active++
        break
      case 'expired':
        acc.expired++
        break
      case 'exhausted':
        acc.exhausted++
        break
      case 'inactive':
        acc.inactive++
        break
    }
    
    return acc
  }, {
    total: 0,
    active: 0,
    expired: 0,
    exhausted: 0,
    inactive: 0,
    totalUsage: 0
  })
  
  return {
    ...stats,
    averageUsage: stats.total > 0 ? Math.round(stats.totalUsage / stats.total * 100) / 100 : 0
  }
}

/**
 * 邀请码错误类型枚举
 */
export const INVITE_CODE_ERRORS = {
  EMPTY: 'EMPTY',
  FORMAT_INVALID: 'FORMAT_INVALID',
  TOO_SHORT: 'TOO_SHORT',
  TOO_LONG: 'TOO_LONG',
  INVALID_CHARS: 'INVALID_CHARS',
  EXCLUDED_CHARS: 'EXCLUDED_CHARS',
  NOT_FOUND: 'NOT_FOUND',
  EXPIRED: 'EXPIRED',
  EXHAUSTED: 'EXHAUSTED',
  INACTIVE: 'INACTIVE',
  NETWORK_ERROR: 'NETWORK_ERROR',
  SERVER_ERROR: 'SERVER_ERROR'
} as const

export type InviteCodeErrorType = typeof INVITE_CODE_ERRORS[keyof typeof INVITE_CODE_ERRORS]

/**
 * 获取错误类型对应的用户友好提示
 * @param errorType 错误类型
 * @returns 错误提示文本
 */
export function getInviteCodeErrorMessage(errorType: InviteCodeErrorType): string {
  const messages = {
    [INVITE_CODE_ERRORS.EMPTY]: '请输入邀请码',
    [INVITE_CODE_ERRORS.FORMAT_INVALID]: '邀请码格式不正确',
    [INVITE_CODE_ERRORS.TOO_SHORT]: `邀请码至少${INVITE_CODE_RULES.MIN_LENGTH}位`,
    [INVITE_CODE_ERRORS.TOO_LONG]: `邀请码最多${INVITE_CODE_RULES.MAX_LENGTH}位`,
    [INVITE_CODE_ERRORS.INVALID_CHARS]: '邀请码只能包含数字和大写字母',
    [INVITE_CODE_ERRORS.EXCLUDED_CHARS]: '邀请码包含不允许的字符',
    [INVITE_CODE_ERRORS.NOT_FOUND]: '邀请码不存在',
    [INVITE_CODE_ERRORS.EXPIRED]: '邀请码已过期',
    [INVITE_CODE_ERRORS.EXHAUSTED]: '邀请码使用次数已达上限',
    [INVITE_CODE_ERRORS.INACTIVE]: '邀请码已被停用',
    [INVITE_CODE_ERRORS.NETWORK_ERROR]: '网络连接异常，请稍后重试',
    [INVITE_CODE_ERRORS.SERVER_ERROR]: '服务器错误，请稍后重试'
  }
  
  return messages[errorType] || '未知错误'
}

/**
 * 防抖函数：用于邀请码输入验证
 * @param func 要防抖的函数
 * @param delay 延迟时间（毫秒）
 * @returns 防抖后的函数
 */
export function debounceInviteCodeValidation<T extends (...args: any[]) => void>(
  func: T,
  delay: number = 300
): T {
  let timeoutId: NodeJS.Timeout
  
  return ((...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func.apply(null, args), delay)
  }) as T
}

/**
 * 邀请码输入格式化：自动转换为大写并过滤无效字符
 * @param input 用户输入
 * @returns 格式化后的邀请码
 */
export function formatInviteCodeInput(input: string): string {
  return input
    .toUpperCase()
    .replace(/[^ABCDEFGHJKLMNPQRSTUVWXYZ23456789]/g, '')
    .substring(0, INVITE_CODE_RULES.MAX_LENGTH)
}

/**
 * 检查用户是否有邀请权限
 * @param userRole 用户角色
 * @returns 是否有邀请权限
 */
export function hasInvitationPermission(userRole?: UserRole): boolean {
  if (!userRole) return false
  
  // agent角色不能使用邀请功能
  const allowedRoles: UserRole[] = ['super_admin', 'director', 'leader', 'sales']
  return allowedRoles.includes(userRole)
}

/**
 * 获取用户可邀请的目标角色列表
 * @param userRole 当前用户角色
 * @returns 可邀请的角色列表
 */
export function getAllowedTargetRoles(userRole: UserRole): UserRole[] {
  switch (userRole) {
    case 'super_admin':
      return ['director', 'leader', 'sales', 'agent']
    case 'director':
      return ['leader', 'sales', 'agent']
    case 'leader':
      return ['sales', 'agent']
    case 'sales':
      return ['agent']
    case 'agent':
      return [] // agent不能邀请任何人
    default:
      return []
  }
}

/**
 * 获取用户的邀请码数量限制
 * @param userRole 用户角色
 * @returns 邀请码数量限制
 */
export function getInviteCodeLimit(userRole: UserRole): number {
  switch (userRole) {
    case 'super_admin':
      return Infinity // 超管无限制
    case 'director':
      return 3 // 销售总监3个
    case 'leader':
      return 2 // 销售组长2个
    case 'sales':
      return 1 // 销售1个
    case 'agent':
      return 0 // 代理不能邀请
    default:
      return 0
  }
}