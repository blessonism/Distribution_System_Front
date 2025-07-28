/**
 * @fileoverview 邀请系统类型定义
 * 定义分销系统中邀请码管理、邀请记录、统计分析相关的核心类型接口
 * 包含邀请码生成与验证、用户注册流程、权限控制和统计报表等完整功能模块
 * 集成角色权限体系、邀请链路map、错误处理和多维度数据分析等高级功能
 * 
 * @module types/invitation
 * @author Frontend Team
 * @since 1.0.0
 */

import type { UserRole } from './api'

/**
 * 邀请码数据模型接口
 * 定义邀请码的完整数据结构，包含码值、权限、状态和统计信息
 * 支持多角色邀请、使用次数跟踪和状态管理，实现精细化的邀请控制
 * 
 * @interface InvitationCode
 * 
 * @complexity O(1) - 单条邀请码数据结构，常数时间复杂度访问
 * @flow 码生成 → 权限配置 → 状态激活 → 使用跟踪 → 失效管理
 * 
 * @example
 * ```typescript
 * const inviteCode: InvitationCode = {
 *   id: 'invite_001',
 *   userId: 'user_001',
 *   code: 'AGENT2024ABC',
 *   targetRole: 'agent',
 *   status: 'active',
 *   usageCount: 5,
 *   createdAt: '2024-04-01T00:00:00Z',
 *   updatedAt: '2024-04-10T12:30:00Z'
 * }
 * 
 * // 检查邀请码是否有效
 * function isCodeValid(code: InvitationCode): boolean {
 *   return code.status === 'active'
 * }
 * 
 * // 获取邀请码使用统计
 * function getUsageStats(code: InvitationCode): string {
 *   return `已使用${code.usageCount}次`
 * }
 * 
 * // 检查是否可以邀请指定角色
 * function canInviteRole(code: InvitationCode, role: UserRole): boolean {
 *   return code.targetRole === role && code.status === 'active'
 * }
 * ```
 */
export interface InvitationCode {
  /** 邀请码唯一标识ID */
  id: string
  /** 邀请人用户ID */
  userId: string              
  /** 邀请码字符串 */
  code: string                
  /** 目标角色类型 */
  targetRole: UserRole        
  /** 邀请码状态：激活/非激活 */
  status: 'active' | 'inactive' 
  /** 使用次数（仅统计用途） */
  usageCount: number          
  /** 创建时间 */
  createdAt: string
  /** 更新时间 */
  updatedAt: string
}

/**
 * 邀请记录数据模型接口
 * 定义邀请成功后的详细记录信息，包含邀请人和被邀请人的完整信息
 * 用于邀请历史追踪、绩效考核和奖励计算，实现全链路邀请管理
 * 
 * @interface InvitationRecord
 * 
 * @complexity O(1) - 单条邀请记录数据结构，常数时间复杂度访问
 * @flow 邀请发送 → 用户注册 → 记录创建 → 状态更新 → 统计分析
 * 
 * @example
 * ```typescript
 * const record: InvitationRecord = {
 *   id: 'record_001',
 *   inviterId: 'user_001',
 *   inviterName: '李经理',
 *   inviteeId: 'user_002',
 *   inviteeName: '张代理',
 *   inviteCode: 'AGENT2024ABC',
 *   targetRole: 'agent',
 *   actualRole: 'agent',
 *   registeredAt: '2024-04-05T14:30:00Z',
 *   status: 'completed'
 * }
 * 
 * 

 
 * // 检查邀请是否成功
 * function isInvitationSuccessful(record: InvitationRecord): boolean {
 *   return record.status === 'completed' && record.targetRole === record.actualRole
 * }
 * 
 * // 获取邀请关系描述
 * function getInvitationDescription(record: InvitationRecord): string {
 *   return `${record.inviterName}邀请${record.inviteeName}成为${record.actualRole}`
 * }
 * 
 * // 计算邀请成功时间
 * function getInvitationDuration(record: InvitationRecord): number {
 *   return new Date(record.registeredAt).getTime()
 * }
 * ```
 */
export interface InvitationRecord {
  id: string
  inviterId: string           // 邀请人ID
  inviterName: string         // 邀请人姓名
  inviteeId: string          // 被邀请人ID
  inviteeName: string        // 被邀请人姓名
  inviteCode: string         // 使用的邀请码
  targetRole: UserRole       // 目标角色
  actualRole: UserRole       // 实际注册角色
  registeredAt: string       // 注册时间
  status: 'completed' | 'pending' // 状态
}

// 邀请统计数据模型
export interface InvitationStats {
  totalInvites: number               // 总邀请数
  monthlyInvites: number            // 本月邀请数
  roleBreakdown: {                  // 角色分布
    [K in UserRole]: number
  }
  recentInvites: InvitationRecord[] // 最近邀请
  conversionRate: number            // 转化率
}

// 邀请码验证请求
export interface ValidateCodeRequest {
  code: string
}

// 邀请码验证响应
export interface ValidateCodeResponse {
  valid: boolean
  inviterInfo?: {
    id: string
    name: string
    role: UserRole
  }
  targetRole?: UserRole
  message?: string
}

// 邀请历史查询参数
export interface HistoryQueryParams {
  page?: number
  pageSize?: number
  role?: UserRole | 'all'
  keyword?: string
  startDate?: string
  endDate?: string
  sortField?: string
  sortOrder?: 'asc' | 'desc'
}

// 邀请统计查询参数
export interface StatsQueryParams {
  timeRange?: 'week' | 'month' | 'quarter' | 'year'
  startDate?: string
  endDate?: string
}

// Pinia Store 状态类型
export interface InvitationState {
  codes: InvitationCode[]
  history: InvitationRecord[]
  stats: InvitationStats | null
  loading: boolean
  error: string | null
}

// 角色邀请权限映射
export type RoleInvitePermission = {
  [K in UserRole]: {
    canInvite: boolean
    allowedTargetRoles: UserRole[]
    maxCodes: number
  }
}

// 邀请链接生成参数
export interface InvitationLinkOptions {
  code: string
  targetRole: UserRole
  baseUrl?: string
}

// 邀请码生成请求
export interface GenerateCodeRequest {
  targetRole: UserRole
}

// 邀请码生成响应
export interface GenerateCodeResponse extends InvitationCode {}

// 邀请系统错误码
export const InvitationErrors = {
  INVALID_CODE: 'INVITE_001',      // 邀请码无效
  EXPIRED_CODE: 'INVITE_002',      // 邀请码已过期
  ROLE_MISMATCH: 'INVITE_003',     // 角色不匹配
  SELF_INVITE: 'INVITE_004',       // 不能邀请自己
  PERMISSION_DENIED: 'INVITE_005', // 无邀请权限
  MAX_USAGE_EXCEEDED: 'INVITE_006', // 超过最大使用次数
  CODE_NOT_FOUND: 'INVITE_007',    // 邀请码不存在
  ALREADY_USED: 'INVITE_008',      // 邀请码已被使用
} as const

// 错误码类型
export type InvitationErrorCode = typeof InvitationErrors[keyof typeof InvitationErrors]

// 邀请链接生成结果
export interface InvitationLink {
  url: string
  code: string
  targetRole: UserRole
  qrCode?: string
  shareText?: string
}

// 邀请码卡片展示数据
export interface InvitationCodeCardData {
  code: InvitationCode
  link: InvitationLink
  roleName: string
  roleDescription: string
  usageStats: {
    used: number
    remaining: number | 'unlimited'
    percentage: number
  }
}

// 邀请历史表格列配置
export interface InvitationHistoryColumn {
  key: string
  title: string
  sortable?: boolean
  filterable?: boolean
  width?: string
  align?: 'left' | 'center' | 'right'
}

// 导出邀请历史的参数
export interface ExportHistoryParams extends HistoryQueryParams {
  format: 'excel' | 'csv'
  includeFields: string[]
}