// API通用响应格式
export interface ApiResponse<T = any> {
  code: number
  success: boolean
  message: string
  data: T
}

// 分页响应格式
export interface PaginatedResponse<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// 分页请求参数
export interface PaginationParams {
  page?: number
  pageSize?: number
  keyword?: string
  sortField?: string
  sortOrder?: 'asc' | 'desc'
}

// 用户相关类型
export interface User {
  id: number
  username: string
  nickname?: string  // 添加昵称字段
  email: string
  phone?: string
  role: UserRole
  status: UserStatus
  avatar?: string
  createdAt: string
  updatedAt: string
}

export type UserRole = 'super_admin' | 'director' | 'leader' | 'sales' | 'agent'
export type UserStatus = 'active' | 'inactive' | 'pending'

// 登录相关类型
export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
  user: User
  permissions: string[]
}

// 注册相关类型
export interface RegisterRequest {
  username: string
  password: string
  email: string
  phone?: string
  nickname?: string
  inviteCode?: string  // 邀请码字段（可选）
}

export interface RegisterResponse {
  user: User
  token: string
  invitationInfo?: {    // 邀请信息（仅当使用邀请码注册时返回）
    inviterId: string
    inviterName: string
    relationshipEstablished: boolean
    targetRole: UserRole
    actualRole: UserRole
  }
  permissions: string[]
}