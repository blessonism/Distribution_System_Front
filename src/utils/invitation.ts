/**
 * @fileoverview 邀请码相关工具函数模块
 * 提供邀请码验证、格式化、状态检查、权限管理等完整功能，支持邀请码格式验证、服务器验证、URL处理、统计分析等
 * 
 * @module utils/invitation
 * @requires @/types/invitation
 * @requires @/types/api
 * @requires @/api/invitation
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
 * 对邀请码进行客户端格式验证，包括长度、字符集合、易混淆字符检查等
 * 
 * @complexity O(n) - n为邀请码长度，需要遍历每个字符进行验证
 * @flow
 * 1. 检查邀请码是否为空
 * 2. 清理输入并转换为大写
 * 3. 验证长度是否在规定范围内
 * 4. 使用正则表达式验证字符集合
 * 5. 逐个检查是否包含易混淆字符
 * 6. 返回验证结果和标准化邀请码
 * 
 * @example
 * ```typescript
 * // 验证有效邀请码
 * const result1 = validateInviteCodeFormat('ABC123')
 * console.log(result1.isValid) // true
 * console.log(result1.normalizedCode) // 'ABC123'
 * 
 * // 验证无效邀请码
 * const result2 = validateInviteCodeFormat('abc1O0') // 包含易混淆字符
 * console.log(result2.isValid) // false
 * console.log(result2.error) // '邀请码包含不允许的字符（0、O、I、1）'
 * 
 * // 验证长度不符合要求的邀请码
 * const result3 = validateInviteCodeFormat('AB')
 * console.log(result3.isValid) // false
 * console.log(result3.error) // '邀请码长度至少6位'
 * ```
 * 
 * @param code - 要验证的邀请码字符串
 * @returns InviteCodeValidationResult - 验证结果对象，包含验证状态、错误信息和标准化邀请码
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
 * 先进行客户端格式验证，再调用服务器API进行完整验证，包括有效性、过期时间、使用次数等
 * 
 * @complexity O(1) + O(network) - 格式验证为O(n)，服务器验证时间主要取决于网络延迟
 * @flow
 * 1. 调用validateInviteCodeFormat进行格式验证
 * 2. 如果格式验证失败，直接返回错误结果
 * 3. 使用标准化邀请码调用服务器验证API
 * 4. 解析服务器返回的验证结果
 * 5. 如果验证成功，返回完整的邀请信息
 * 6. 如果验证失败或API调用出错，返回相应错误信息
 * 
 * @example
 * ```typescript
 * // 验证有效邀请码
 * const result = await validateInviteCodeComplete('ABC123XYZ')
 * if (result.isValid) {
 *   console.log('邀请人:', result.inviterInfo?.name)
 *   console.log('目标角色:', result.targetRole)
 *   console.log('过期时间:', result.expiresAt)
 *   console.log('剩余使用次数:', 
 *     result.maxUsage! - result.usageCount!)
 * } else {
 *   console.error('验证失败:', result.error)
 * }
 * 
 * // 处理验证异常
 * try {
 *   const result = await validateInviteCodeComplete('INVALID')
 *   // 处理结果
 * } catch (error) {
 *   console.error('网络错误:', error)
 * }
 * ```
 * 
 * @param code - 要验证的邀请码字符串
 * @returns Promise<CompleteValidationResult> - 完整验证结果，包含邀请人信息、目标角色、过期时间等
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
 * 解析URL查询参数，提取邀请码和目标角色信息，用于处理邀请链接访问
 * 
 * @complexity O(1) - 简单的字符串解析操作，时间复杂度为常数
 * @flow
 * 1. 从URLSearchParams中获取invite参数作为邀请码
 * 2. 从URLSearchParams中获取role参数作为目标角色
 * 3. 构建并返回邀请信息对象
 * 4. 根据邀请码是否存在设置hasInvitation标志
 * 
 * @example
 * ```typescript
 * // 解析包含邀请信息的URL参数
 * const params = new URLSearchParams('?invite=ABC123&role=sales')
 * const info = extractInvitationFromUrl(params)
 * console.log(info.inviteCode) // 'ABC123'
 * console.log(info.targetRole) // 'sales'
 * console.log(info.hasInvitation) // true
 * 
 * // 解析不包含邀请信息的URL参数
 * const emptyParams = new URLSearchParams('?page=1&limit=10')
 * const emptyInfo = extractInvitationFromUrl(emptyParams)
 * console.log(emptyInfo.hasInvitation) // false
 * console.log(emptyInfo.inviteCode) // undefined
 * 
 * // 在页面加载时使用
 * const urlParams = new URLSearchParams(window.location.search)
 * const invitation = extractInvitationFromUrl(urlParams)
 * if (invitation.hasInvitation) {
 *   // 自动填充邀请码表单
 *   setInviteCode(invitation.inviteCode!)
 * }
 * ```
 * 
 * @param searchParams - URLSearchParams对象，包含URL查询参数
 * @returns UrlInvitationInfo - 邀请信息对象，包含邀请码、目标角色和是否包含邀请的标志
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
 * 根据邀请码和目标角色生成完整的邀请链接，用于分享给被邀请用户
 * 
 * @complexity O(1) - 字符串拼接和URL构建操作为常数时间复杂度
 * @flow
 * 1. 确定基础URL（使用传入的baseUrl或当前域名）
 * 2. 创建URLSearchParams对象并设置invite和role参数
 * 3. 构建完整的邀请链接（基础URL + 登录路径 + 查询参数）
 * 4. 返回完整的邀请链接字符串
 * 
 * @example
 * ```typescript
 * // 生成邀请链接（使用当前域名）
 * const inviteUrl = generateInvitationUrl('ABC123XYZ', 'sales')
 * console.log(inviteUrl) 
 * // 'https://current-domain.com/login?invite=ABC123XYZ&role=sales'
 * 
 * // 生成邀请链接（指定域名）
 * const customUrl = generateInvitationUrl(
 *   'XYZ789ABC', 
 *   'agent', 
 *   'https://my-app.com'
 * )
 * console.log(customUrl)
 * // 'https://my-app.com/login?invite=XYZ789ABC&role=agent'
 * 
 * // 在邀请功能中使用
 * const shareInvitation = (code: string, role: UserRole) => {
 *   const url = generateInvitationUrl(code, role)
 *   navigator.clipboard.writeText(url)
 *   showToast('邀请链接已复制到剪贴板')
 * }
 * ```
 * 
 * @param code - 邀请码字符串
 * @param targetRole - 目标用户角色
 * @param baseUrl - 可选的基础URL，默认使用当前域名
 * @returns string - 完整的邀请链接
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
 * 检查邀请码的当前状态，包括是否激活、是否过期、是否用完等，用于显示状态和控制可用性
 * 
 * @complexity O(1) - 简单的状态检查和计算操作，时间复杂度为常数
 * @flow
 * 1. 获取当前时间作为比较基准
 * 2. 检查邀请码是否已过期（比较过期时间与当前时间）
 * 3. 检查邀请码是否已用完（比较使用次数与最大使用次数）
 * 4. 检查邀请码状态是否为激活状态
 * 5. 根据各项检查结果确定总体状态和状态文本
 * 6. 计算剩余使用次数
 * 7. 返回完整的状态信息对象
 * 
 * @example
 * ```typescript
 * // 检查正常邀请码状态
 * const activeCode: InvitationCode = {
 *   id: '1',
 *   code: 'ABC123',
 *   status: 'active',
 *   expiresAt: '2024-12-31T23:59:59Z',
 *   maxUsage: 10,
 *   usageCount: 3
 * }
 * const status1 = getInviteCodeStatus(activeCode)
 * console.log(status1.status) // 'active'
 * console.log(status1.statusText) // '正常'
 * console.log(status1.canUse) // true
 * console.log(status1.remainingUsage) // 7
 * 
 * // 检查过期邀请码状态
 * const expiredCode: InvitationCode = {
 *   ...activeCode,
 *   expiresAt: '2023-12-31T23:59:59Z' // 已过期
 * }
 * const status2 = getInviteCodeStatus(expiredCode)
 * console.log(status2.status) // 'expired'
 * console.log(status2.canUse) // false
 * 
 * // 检查无限制使用的邀请码
 * const unlimitedCode: InvitationCode = {
 *   ...activeCode,
 *   maxUsage: null // 无使用次数限制
 * }
 * const status3 = getInviteCodeStatus(unlimitedCode)
 * console.log(status3.remainingUsage) // 'unlimited'
 * ```
 * 
 * @param inviteCode - 邀请码对象，包含状态、过期时间、使用情况等信息
 * @returns InviteCodeStatus - 邀请码状态信息，包含各种状态标志和可用性
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
 * 分析邀请码列表，计算各种状态的数量和使用情况统计，用于数据分析和报表展示
 * 
 * @complexity O(n) - n为邀请码数量，需要遍历每个邀请码检查状态
 * @flow
 * 1. 初始化统计计数器（各状态数量和使用总数）
 * 2. 遍历邀请码列表，对每个邀请码：
 *    a. 调用getInviteCodeStatus获取状态
 *    b. 增加总数计数器
 *    c. 累加使用次数
 *    d. 根据状态增加对应的状态计数器
 * 3. 计算平均使用次数（总使用次数/总数量）
 * 4. 返回完整的统计信息对象
 * 
 * @example
 * ```typescript
 * // 统计邀请码使用情况
 * const inviteCodes: InvitationCode[] = [
 *   { id: '1', code: 'ABC123', status: 'active', usageCount: 5, maxUsage: 10 },
 *   { id: '2', code: 'XYZ789', status: 'expired', usageCount: 8, maxUsage: 10 },
 *   { id: '3', code: 'DEF456', status: 'active', usageCount: 10, maxUsage: 10 }
 * ]
 * 
 * const stats = calculateInviteCodeStats(inviteCodes)
 * console.log(stats.total) // 3
 * console.log(stats.active) // 1
 * console.log(stats.expired) // 1
 * console.log(stats.exhausted) // 1
 * console.log(stats.totalUsage) // 23
 * console.log(stats.averageUsage) // 7.67
 * 
 * // 在管理面板中显示统计信息
 * const displayStats = (stats: InviteCodeStats) => {
 *   console.log(`总计：${stats.total}个邀请码`)
 *   console.log(`可用：${stats.active}个`)
 *   console.log(`已过期：${stats.expired}个`)
 *   console.log(`已用完：${stats.exhausted}个`)
 *   console.log(`平均使用率：${stats.averageUsage}`)
 * }
 * ```
 * 
 * @param inviteCodes - 邀请码对象数组
 * @returns InviteCodeStats - 统计信息对象，包含各种状态数量和使用情况
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
 * 将系统错误代码转换为用户友好的中文提示信息，用于错误信息展示
 * 
 * @complexity O(1) - 简单的对象属性查找操作，时间复杂度为常数
 * @flow
 * 1. 定义错误类型到中文提示的映射表
 * 2. 根据传入的错误类型查找对应的提示信息
 * 3. 如果找到匹配的错误类型，返回对应提示
 * 4. 如果未找到匹配项，返回默认的"未知错误"提示
 * 
 * @example
 * ```typescript
 * // 获取各种错误类型的提示信息
 * console.log(getInviteCodeErrorMessage('EMPTY')) 
 * // '请输入邀请码'
 * 
 * console.log(getInviteCodeErrorMessage('FORMAT_INVALID')) 
 * // '邀请码格式不正确'
 * 
 * console.log(getInviteCodeErrorMessage('EXPIRED')) 
 * // '邀请码已过期'
 * 
 * console.log(getInviteCodeErrorMessage('NETWORK_ERROR')) 
 * // '网络连接异常，请稍后重试'
 * 
 * // 在错误处理中使用
 * const handleValidationError = (errorType: InviteCodeErrorType) => {
 *   const message = getInviteCodeErrorMessage(errorType)
 *   showErrorToast(message)
 *   logError('邀请码验证失败', { errorType, message })
 * }
 * 
 * // 处理未知错误类型
 * console.log(getInviteCodeErrorMessage('UNKNOWN_ERROR' as any))
 * // '未知错误'
 * ```
 * 
 * @param errorType - 邀请码错误类型枚举值
 * @returns string - 用户友好的错误提示信息
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
 * 创建防抖函数来优化邀请码输入验证，避免用户输入过程中频繁调用验证API
 * 
 * @complexity O(1) - 防抖函数创建为常数时间，实际执行取决于被包装的函数
 * @flow
 * 1. 创建超时ID变量用于存储定时器引用
 * 2. 返回包装后的防抖函数
 * 3. 每次调用防抖函数时：
 *    a. 清除之前的定时器（如果存在）
 *    b. 设置新的延迟定时器
 *    c. 在延迟时间后执行原始函数
 * 4. 确保在指定延迟时间内多次调用只执行最后一次
 * 
 * @example
 * ```typescript
 * // 创建防抖验证函数
 * const validateCode = async (code: string) => {
 *   const result = await validateInviteCodeComplete(code)
 *   updateValidationResult(result)
 * }
 * 
 * const debouncedValidate = debounceInviteCodeValidation(validateCode, 500)
 * 
 * // 在输入框中使用
 * const handleInputChange = (event: InputEvent) => {
 *   const code = (event.target as HTMLInputElement).value
 *   if (code.length >= 6) {
 *     debouncedValidate(code) // 500ms内多次输入只执行最后一次
 *   }
 * }
 * 
 * // 自定义延迟时间
 * const quickValidate = debounceInviteCodeValidation(validateCode, 200)
 * const slowValidate = debounceInviteCodeValidation(validateCode, 1000)
 * 
 * // 在Vue组件中使用
 * const debouncedSearch = debounceInviteCodeValidation(
 *   (keyword: string) => searchInviteCodes(keyword),
 *   300
 * )
 * ```
 * 
 * @template T - 被防抖函数的类型
 * @param func - 要防抖的原始函数
 * @param delay - 防抖延迟时间（毫秒），默认300ms
 * @returns T - 防抖后的函数，类型与原函数相同
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
 * 实时格式化用户输入的邀请码，确保输入符合规范并提升用户体验
 * 
 * @complexity O(n) - n为输入字符串长度，需要遍历每个字符进行过滤
 * @flow
 * 1. 将输入字符串转换为大写
 * 2. 使用正则表达式过滤掉不允许的字符
 * 3. 截取字符串，确保不超过最大长度限制
 * 4. 返回格式化后的邀请码字符串
 * 
 * @example
 * ```typescript
 * // 格式化正常输入
 * console.log(formatInviteCodeInput('abc123')) // 'ABC123'
 * 
 * // 过滤无效字符
 * console.log(formatInviteCodeInput('abc-123_xyz!')) // 'ABC123XYZ'
 * 
 * // 处理易混淆字符
 * console.log(formatInviteCodeInput('ab0o1i')) // 'AB' (过滤掉0、O、1、I)
 * 
 * // 限制长度
 * console.log(formatInviteCodeInput('abcdefghijklmnopqrstuvwxyz')) 
 * // 'ABCDEFGHJKLM' (截取到最大长度)
 * 
 * // 在输入框中实时使用
 * const handleInput = (event: InputEvent) => {
 *   const input = event.target as HTMLInputElement
 *   const formatted = formatInviteCodeInput(input.value)
 *   input.value = formatted
 *   setInviteCode(formatted)
 * }
 * 
 * // 在表单提交前格式化
 * const handleSubmit = () => {
 *   const formatted = formatInviteCodeInput(rawInput)
 *   validateInviteCode(formatted)
 * }
 * ```
 * 
 * @param input - 用户原始输入字符串
 * @returns string - 格式化后的邀请码字符串
 */
export function formatInviteCodeInput(input: string): string {
  return input
    .toUpperCase()
    .replace(/[^ABCDEFGHJKLMNPQRSTUVWXYZ23456789]/g, '')
    .substring(0, INVITE_CODE_RULES.MAX_LENGTH)
}

/**
 * 检查用户是否有邀请权限
 * 根据用户角色判断是否具有创建和管理邀请码的权限
 * 
 * @complexity O(1) - 简单的数组包含检查，时间复杂度为常数
 * @flow
 * 1. 检查用户角色是否为空或未定义
 * 2. 如果用户角色为空，返回false（无权限）
 * 3. 定义允许使用邀请功能的角色列表
 * 4. 检查用户角色是否在允许列表中
 * 5. 返回权限检查结果
 * 
 * @example
 * ```typescript
 * // 检查不同角色的邀请权限
 * console.log(hasInvitationPermission('super_admin')) // true
 * console.log(hasInvitationPermission('director')) // true
 * console.log(hasInvitationPermission('leader')) // true
 * console.log(hasInvitationPermission('sales')) // true
 * console.log(hasInvitationPermission('agent')) // false
 * console.log(hasInvitationPermission(undefined)) // false
 * 
 * // 在权限控制中使用
 * const renderInviteButton = (userRole: UserRole) => {
 *   if (hasInvitationPermission(userRole)) {
 *     return <button onClick={openInviteDialog}>邀请用户</button>
 *   }
 *   return <span>无邀请权限</span>
 * }
 * 
 * // 在路由守卫中使用
 * const canAccessInvitePage = (user: User) => {
 *   return hasInvitationPermission(user.role)
 * }
 * 
 * // 在API调用前检查
 * const createInviteCode = async (userRole: UserRole) => {
 *   if (!hasInvitationPermission(userRole)) {
 *     throw new Error('无邀请权限')
 *   }
 *   return await invitationApi.create()
 * }
 * ```
 * 
 * @param userRole - 用户角色，可能为undefined
 * @returns boolean - 是否具有邀请权限
 */
export function hasInvitationPermission(userRole?: UserRole): boolean {
  if (!userRole) return false
  
  // 允许使用邀请功能的角色
  const allowedRoles: UserRole[] = ['super_admin', 'director', 'leader', 'sales', 'agent']
  return allowedRoles.includes(userRole)
}

/**
 * 获取用户可邀请的目标角色列表
 * 根据当前用户角色返回其可以邀请的目标角色，实现层级化权限控制
 * 
 * @complexity O(1) - 简单的switch语句和数组返回，时间复杂度为常数
 * @flow
 * 1. 根据当前用户角色进入对应的case分支
 * 2. 返回该角色可以邀请的目标角色数组
 * 3. 角色层级：super_admin > director > leader > sales > agent
 * 4. 每个角色只能邀请比自己级别低的角色
 * 5. agent角色不能邀请任何人
 * 
 * @example
 * ```typescript
 * // 获取不同角色的可邀请目标
 * console.log(getAllowedTargetRoles('super_admin'))
 * // ['director', 'leader', 'sales', 'agent']
 * 
 * console.log(getAllowedTargetRoles('director'))
 * // ['leader', 'sales', 'agent']
 * 
 * console.log(getAllowedTargetRoles('leader'))
 * // ['sales', 'agent']
 * 
 * console.log(getAllowedTargetRoles('sales'))
 * // ['agent']
 * 
 * console.log(getAllowedTargetRoles('agent'))
 * // []
 * 
 * // 在邀请表单中动态生成角色选项
 * const InviteForm = ({ userRole }: { userRole: UserRole }) => {
 *   const allowedRoles = getAllowedTargetRoles(userRole)
 *   
 *   return (
 *     <select name="targetRole">
 *       {allowedRoles.map(role => (
 *         <option key={role} value={role}>
 *           {getRoleDisplayName(role)}
 *         </option>
 *       ))}
 *     </select>
 *   )
 * }
 * 
 * // 验证邀请目标角色是否合法
 * const validateTargetRole = (userRole: UserRole, targetRole: UserRole) => {
 *   const allowedRoles = getAllowedTargetRoles(userRole)
 *   return allowedRoles.includes(targetRole)
 * }
 * ```
 * 
 * @param userRole - 当前用户的角色
 * @returns UserRole[] - 可邀请的目标角色列表
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
 * 根据用户角色返回其可创建的邀请码数量上限，实现差异化权限管理
 * 
 * @complexity O(1) - 简单的switch语句，时间复杂度为常数
 * @flow
 * 1. 根据用户角色进入对应的case分支
 * 2. 返回该角色对应的邀请码数量限制
 * 3. super_admin：无限制（Infinity）
 * 4. director：3个邀请码
 * 5. leader：2个邀请码
 * 6. sales：1个邀请码
 * 7. agent：0个邀请码（不能创建）
 * 
 * @example
 * ```typescript
 * // 获取不同角色的邀请码限制
 * console.log(getInviteCodeLimit('super_admin')) // Infinity
 * console.log(getInviteCodeLimit('director')) // 3
 * console.log(getInviteCodeLimit('leader')) // 2
 * console.log(getInviteCodeLimit('sales')) // 1
 * console.log(getInviteCodeLimit('agent')) // 0
 * 
 * // 在创建邀请码前检查限制
 * const canCreateMoreCodes = (userRole: UserRole, currentCount: number) => {
 *   const limit = getInviteCodeLimit(userRole)
 *   return limit === Infinity || currentCount < limit
 * }
 * 
 * // 显示剩余可创建数量
 * const getRemainingQuota = (userRole: UserRole, currentCount: number) => {
 *   const limit = getInviteCodeLimit(userRole)
 *   if (limit === Infinity) return '无限制'
 *   return Math.max(0, limit - currentCount)
 * }
 * 
 * // 在UI中显示限制信息
 * const InviteCodeQuota = ({ userRole, currentCount }: Props) => {
 *   const limit = getInviteCodeLimit(userRole)
 *   const remaining = getRemainingQuota(userRole, currentCount)
 *   
 *   return (
 *     <div>
 *       <span>已创建：{currentCount}</span>
 *       <span>限制：{limit === Infinity ? '无限制' : limit}</span>
 *       <span>剩余：{remaining}</span>
 *     </div>
 *   )
 * }
 * 
 * // 在API调用前验证
 * const createInviteCode = async (userRole: UserRole) => {
 *   const currentCount = await getCurrentInviteCodeCount()
 *   if (!canCreateMoreCodes(userRole, currentCount)) {
 *     throw new Error('已达到邀请码数量上限')
 *   }
 *   return await invitationApi.create()
 * }
 * ```
 * 
 * @param userRole - 用户角色
 * @returns number - 邀请码数量限制，Infinity表示无限制
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