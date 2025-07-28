/**
 * @fileoverview 分销系统API相关的通用类型定义
 * 定义了API响应格式、用户认证、分页等核心类型接口
 * 
 * @module types/api
 */

/**
 * API通用响应格式接口
 * 所有后端API都遵循此统一响应结构
 * 
 * @template T 响应数据的具体类型
 * @interface ApiResponse
 * 
 * @example
 * ```typescript
 * // 用户信息响应
 * const userResponse: ApiResponse<User> = {
 *   code: 200,
 *   success: true,
 *   message: '获取成功',
 *   data: { id: 1, username: 'john', ... }
 * }
 * 
 * // 列表响应
 * const listResponse: ApiResponse<User[]> = {
 *   code: 200,
 *   success: true,
 *   message: '获取成功',
 *   data: [{ id: 1, username: 'john' }, ...]
 * }
 * ```
 */
export interface ApiResponse<T = any> {
  /** HTTP状态码或业务状态码 */
  code: number
  /** 请求是否成功 */
  success: boolean
  /** 响应消息，通常用于错误提示 */
  message: string
  /** 实际的业务数据 */
  data: T
}

/**
 * 分页响应格式接口
 * 用于包装需要分页的列表数据响应
 * 
 * @template T 列表项的数据类型
 * @interface PaginatedResponse
 * 
 * @example
 * ```typescript
 * const userListResponse: PaginatedResponse<User> = {
 *   list: [{ id: 1, username: 'john' }, ...],
 *   total: 100,
 *   page: 1,
 *   pageSize: 20,
 *   totalPages: 5
 * }
 * ```
 */
export interface PaginatedResponse<T> {
  /** 当前页的数据列表 */
  list: T[]
  /** 总记录数 */
  total: number
  /** 当前页码（从1开始） */
  page: number
  /** 每页显示数量 */
  pageSize: number
  /** 总页数 */
  totalPages: number
}

/**
 * 分页请求参数接口
 * 用于API请求中的分页、搜索和排序参数
 * 
 * @interface PaginationParams
 * 
 * @example
 * ```typescript
 * const params: PaginationParams = {
 *   page: 1,
 *   pageSize: 20,
 *   keyword: 'john',
 *   sortField: 'createdAt',
 *   sortOrder: 'desc'
 * }
 * ```
 */
export interface PaginationParams {
  /** 页码，从1开始 */
  page?: number
  /** 每页数量，默认通常为20 */
  pageSize?: number
  /** 搜索关键词 */
  keyword?: string
  /** 排序字段名 */
  sortField?: string
  /** 排序方向 */
  sortOrder?: 'asc' | 'desc'
}

/**
 * 用户信息接口
 * 定义分销系统中用户的完整信息结构
 * 
 * @interface User
 * 
 * @example
 * ```typescript
 * const user: User = {
 *   id: 1,
 *   username: 'john_doe',
 *   nickname: 'John',
 *   email: 'john@example.com',
 *   phone: '13800138000',
 *   role: 'sales',
 *   status: 'active',
 *   avatar: 'https://example.com/avatar.jpg',
 *   createdAt: '2023-01-01T00:00:00Z',
 *   updatedAt: '2023-01-02T00:00:00Z'
 * }
 * ```
 */
export interface User {
  /** 用户唯一标识ID */
  id: number
  /** 用户名，用于登录 */
  username: string
  /** 昵称，用于显示 */
  nickname?: string
  /** 邮箱地址 */
  email: string
  /** 手机号码 */
  phone?: string
  /** 用户角色 */
  role: UserRole
  /** 用户状态 */
  status: UserStatus
  /** 头像URL */
  avatar?: string
  /** 创建时间 */
  createdAt: string
  /** 最后更新时间 */
  updatedAt: string
}

/**
 * 用户角色类型
 * 定义分销系统中的用户权限层级
 * 
 * @typedef {string} UserRole
 * 
 * 权限层级（从高到低）:
 * - super_admin: 超级管理员 - 系统最高权限
 * - director: 销售总监 - 管理多个销售团队
 * - leader: 销售组长 - 管理销售人员和代理
 * - sales: 销售人员 - 发展和管理代理
 * - agent: 代理 - 基础用户，无下级管理权限
 */
export type UserRole = 'super_admin' | 'director' | 'leader' | 'sales' | 'agent'

/**
 * 用户状态类型
 * 定义用户账户的当前状态
 * 
 * @typedef {string} UserStatus
 * 
 * 状态说明:
 * - active: 激活状态 - 正常使用
 * - inactive: 非激活状态 - 已禁用或暂停
 * - pending: 待激活状态 - 刚注册待审核
 */
export type UserStatus = 'active' | 'inactive' | 'pending'

/**
 * 用户登录请求接口
 * 
 * @interface LoginRequest
 * 
 * @example
 * ```typescript
 * const loginData: LoginRequest = {
 *   username: 'john_doe',
 *   password: 'password123'
 * }
 * ```
 */
export interface LoginRequest {
  /** 用户名或邮箱 */
  username: string
  /** 登录密码 */
  password: string
}

/**
 * 用户登录响应接口
 * 
 * @interface LoginResponse
 * 
 * @example
 * ```typescript
 * const loginResponse: LoginResponse = {
 *   token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
 *   user: { id: 1, username: 'john_doe', ... },
 *   permissions: ['view_users', 'create_invitations']
 * }
 * ```
 */
export interface LoginResponse {
  /** JWT访问令牌 */
  token: string
  /** 用户完整信息 */
  user: User
  /** 用户权限列表 */
  permissions: string[]
}

/**
 * 用户注册请求接口
 * 支持普通注册和邀请码注册两种方式
 * 
 * @interface RegisterRequest
 * 
 * @example
 * ```typescript
 * // 普通注册
 * const registerData: RegisterRequest = {
 *   username: 'new_user',
 *   password: 'password123',
 *   email: 'new@example.com',
 *   phone: '13800138000',
 *   nickname: 'New User'
 * }
 * 
 * // 邀请码注册
 * const inviteRegisterData: RegisterRequest = {
 *   ...registerData,
 *   inviteCode: 'INVITE123ABC'
 * }
 * ```
 */
export interface RegisterRequest {
  /** 用户名，必须唯一 */
  username: string
  /** 登录密码 */
  password: string
  /** 邮箱地址，必须唯一 */
  email: string
  /** 手机号码 */
  phone?: string
  /** 显示昵称 */
  nickname?: string
  /** 邀请码，使用时将建立上下级关系 */
  inviteCode?: string
}

/**
 * 用户注册响应接口
 * 包含新用户信息和可能的邀请关系信息
 * 
 * @interface RegisterResponse
 * 
 * @example
 * ```typescript
 * // 普通注册响应
 * const registerResponse: RegisterResponse = {
 *   user: { id: 2, username: 'new_user', ... },
 *   token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
 *   permissions: ['basic_access']
 * }
 * 
 * // 邀请码注册响应
 * const inviteRegisterResponse: RegisterResponse = {
 *   user: { id: 2, username: 'new_user', role: 'agent', ... },
 *   token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
 *   invitationInfo: {
 *     inviterId: '1',
 *     inviterName: 'john_doe',
 *     relationshipEstablished: true,
 *     targetRole: 'agent',
 *     actualRole: 'agent'
 *   },
 *   permissions: ['basic_access']
 * }
 * ```
 */
export interface RegisterResponse {
  /** 新创建的用户信息 */
  user: User
  /** JWT访问令牌 */
  token: string
  /** 邀请信息，仅当使用邀请码注册时返回 */
  invitationInfo?: {
    /** 邀请人ID */
    inviterId: string
    /** 邀请人姓名 */
    inviterName: string
    /** 是否成功建立上下级关系 */
    relationshipEstablished: boolean
    /** 邀请码指定的目标角色 */
    targetRole: UserRole
    /** 用户实际获得的角色 */
    actualRole: UserRole
  }
  /** 用户权限列表 */
  permissions: string[]
}