import type { UserRole } from './api'

// 邀请码数据模型
export interface InvitationCode {
  id: string
  userId: string              // 邀请人ID
  code: string                // 邀请码
  targetRole: UserRole        // 目标角色
  status: 'active' | 'inactive' // 状态
  usageCount: number          // 使用次数（仅统计用途）
  createdAt: string
  updatedAt: string
}

// 邀请记录数据模型
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