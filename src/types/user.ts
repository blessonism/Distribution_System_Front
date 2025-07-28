/**
 * @fileoverview 分销系统用户类型定义
 * 定义分销系统中用户管理相关的核心类型接口和枚举
 * 包含用户信息、角色权限、状态管理、查询参数和请求响应结构
 * 
 * @module types/user
 * @author Frontend Team
 * @since 1.0.0
 */

/**
 * 用户信息接口
 * 定义分销系统中用户的完整信息结构，包含基础信息、权限角色和上下级关系
 * 
 * @interface User
 * 
 * @example
 * ```typescript
 * const user: User = {
 *   id: 'user_001',
 *   username: 'john_doe',
 *   email: 'john@example.com',
 *   phone: '13800138000',
 *   avatar: 'https://example.com/avatar.jpg',
 *   role: 'sales',
 *   status: 'active',
 *   level: 3,
 *   commission_rate: 0.15,
 *   parent_id: 'manager_001',
 *   parent_name: '张经理',
 *   created_at: '2024-01-01T00:00:00Z',
 *   updated_at: '2024-01-02T00:00:00Z',
 *   last_login_at: '2024-01-02T08:30:00Z'
 * }
 * ```
 */
export interface User {
  /** 用户唯一标识ID */
  id: string
  /** 用户名，用于登录和显示 */
  username: string
  /** 邮箱地址，用于通知和登录 */
  email: string
  /** 手机号码，用于联系和验证 */
  phone: string
  /** 头像URL地址，可选 */
  avatar?: string
  /** 用户角色，决定权限范围 */
  role: UserRole
  /** 用户状态，控制账户可用性 */
  status: UserStatus
  /** 用户等级，影响提成和权限 */
  level: number
  /** 提成比例，0-1之间的小数 */
  commission_rate: number
  /** 上级用户ID，建立层级关系 */
  parent_id?: string
  /** 上级用户姓名，用于显示 */
  parent_name?: string
  /** 账户创建时间 */
  created_at: string
  /** 最后更新时间 */
  updated_at: string
  /** 最后登录时间，可选 */
  last_login_at?: string
}

/**
 * 用户角色类型
 * 定义分销系统中的用户权限层级，从高到低排列
 * 
 * @typedef {string} UserRole
 * 
 * 权限层级说明：
 * - super_admin: 超级管理员 - 系统最高权限，可管理所有功能
 * - director: 销售总监 - 管理多个销售团队和区域
 * - leader: 销售组长 - 管理销售人员和代理
 * - sales: 销售人员 - 发展和管理代理客户
 * - agent: 代理 - 基础用户，无下级管理权限
 * 
 * @example
 * ```typescript
 * const adminRole: UserRole = 'super_admin'
 * const salesRole: UserRole = 'sales'
 * 
 * // 权限检查
 * function hasHigherRole(role: UserRole): boolean {
 *   const hierarchy = ['agent', 'sales', 'leader', 'director', 'super_admin']
 *   return hierarchy.indexOf(role) >= 2
 * }
 * ```
 */
export type UserRole = 'super_admin' | 'director' | 'leader' | 'sales' | 'agent'

/**
 * 用户状态类型
 * 定义用户账户的当前可用状态
 * 
 * @typedef {string} UserStatus
 * 
 * 状态说明：
 * - active: 激活状态 - 正常使用，所有功能可用
 * - inactive: 非激活状态 - 已禁用或暂停，无法登录
 * - pending: 待激活状态 - 刚注册待审核，功能受限
 * - banned: 封禁状态 - 违规封禁，禁止使用
 * 
 * @example
 * ```typescript
 * const activeUser: UserStatus = 'active'
 * const pendingUser: UserStatus = 'pending'
 * 
 * // 状态检查
 * function canLogin(status: UserStatus): boolean {
 *   return status === 'active'
 * }
 * ```
 */
export type UserStatus = 'active' | 'inactive' | 'pending' | 'banned'

/**
 * 搜索角色类型
 * 在用户角色基础上添加"all"选项，用于搜索筛选
 * 
 * @typedef {UserRole | 'all'} SearchRole
 * 
 * @example
 * ```typescript
 * const searchFilter: SearchRole = 'all' // 搜索所有角色
 * const specificRole: SearchRole = 'sales' // 搜索特定角色
 * ```
 */
export type SearchRole = UserRole | 'all'

/**
 * 搜索状态类型
 * 在用户状态基础上添加"all"选项，用于搜索筛选
 * 
 * @typedef {UserStatus | 'all'} SearchStatus
 * 
 * @example
 * ```typescript
 * const searchFilter: SearchStatus = 'all' // 搜索所有状态
 * const activeOnly: SearchStatus = 'active' // 仅搜索激活用户
 * ```
 */
export type SearchStatus = UserStatus | 'all'

/**
 * 用户查询参数接口
 * 定义后端API查询用户列表时的标准参数结构
 * 
 * @interface UserQueryParams
 * 
 * @example
 * ```typescript
 * const queryParams: UserQueryParams = {
 *   page: 1,
 *   page_size: 20,
 *   keyword: '张三',
 *   role: 'sales',
 *   status: 'active',
 *   level: 3,
 *   date_from: '2024-01-01',
 *   date_to: '2024-01-31'
 * }
 * 
 * // API调用示例
 * const users = await userApi.getUsers(queryParams)
 * ```
 */
export interface UserQueryParams {
  /** 页码，从1开始 */
  page: number
  /** 每页数量，通常为10、20、50 */
  page_size: number
  /** 搜索关键词，匹配用户名、邮箱、手机号 */
  keyword?: string
  /** 角色筛选 */
  role?: UserRole
  /** 状态筛选 */
  status?: UserStatus
  /** 等级筛选 */
  level?: number
  /** 创建时间起始日期，格式：YYYY-MM-DD */
  date_from?: string
  /** 创建时间结束日期，格式：YYYY-MM-DD */
  date_to?: string
}

/**
 * 前端用户搜索参数接口
 * 专为前端组件设计的搜索参数，支持"all"选项的扩展筛选
 * 
 * @interface UserSearchParams
 * 
 * @example
 * ```typescript
 * const searchParams: UserSearchParams = {
 *   page: 1,
 *   page_size: 20,
 *   keyword: '销售',
 *   role: 'all', // 前端特有的"全部"选项
 *   status: 'active',
 *   level: 2
 * }
 * 
 * // 转换为后端查询参数
 * function toQueryParams(search: UserSearchParams): UserQueryParams {
 *   const params: UserQueryParams = { ...search }
 *   if (search.role === 'all') delete params.role
 *   if (search.status === 'all') delete params.status
 *   return params
 * }
 * ```
 */
export interface UserSearchParams {
  /** 页码，从1开始 */
  page: number
  /** 每页数量 */
  page_size: number
  /** 搜索关键词 */
  keyword?: string
  /** 角色筛选，支持"all"选项 */
  role?: SearchRole
  /** 状态筛选，支持"all"选项 */
  status?: SearchStatus
  /** 等级筛选 */
  level?: number
  /** 创建时间起始日期 */
  date_from?: string
  /** 创建时间结束日期 */
  date_to?: string
}

/**
 * 用户列表响应接口
 * 定义后端返回用户列表数据的标准格式，包含分页信息
 * 
 * @interface UserListResponse
 * 
 * @example
 * ```typescript
 * const response: UserListResponse = {
 *   items: [
 *     { id: '1', username: 'john', role: 'sales', ... },
 *     { id: '2', username: 'jane', role: 'agent', ... }
 *   ],
 *   total: 100,
 *   page: 1,
 *   page_size: 20,
 *   total_pages: 5
 * }
 * 
 * // 分页计算示例
 * const hasNextPage = response.page < response.total_pages
 * const startIndex = (response.page - 1) * response.page_size + 1
 * const endIndex = Math.min(startIndex + response.page_size - 1, response.total)
 * ```
 */
export interface UserListResponse {
  /** 当前页的用户数据列表 */
  items: User[]
  /** 总记录数 */
  total: number
  /** 当前页码 */
  page: number
  /** 每页大小 */
  page_size: number
  /** 总页数 */
  total_pages: number
}

/**
 * 创建用户请求接口
 * 定义创建新用户时需要提供的完整信息
 * 
 * @interface CreateUserRequest
 * 
 * @example
 * ```typescript
 * const newUser: CreateUserRequest = {
 *   username: 'new_sales_001',
 *   email: 'newsales@company.com',
 *   phone: '13900139000',
 *   password: 'SecurePass123',
 *   role: 'sales',
 *   level: 2,
 *   commission_rate: 0.12,
 *   parent_id: 'leader_001'
 * }
 * 
 * // 数据验证示例
 * function validateCreateRequest(data: CreateUserRequest): boolean {
 *   return data.username.length >= 3 &&
 *          data.email.includes('@') &&
 *          data.commission_rate >= 0 && data.commission_rate <= 1
 * }
 * ```
 */
export interface CreateUserRequest {
  /** 用户名，必须唯一，长度3-20字符 */
  username: string
  /** 邮箱地址，必须唯一且格式正确 */
  email: string
  /** 手机号码，必须唯一且格式正确 */
  phone: string
  /** 登录密码，需要符合安全要求 */
  password: string
  /** 用户角色，决定权限范围 */
  role: UserRole
  /** 用户等级，影响提成和权限 */
  level: number
  /** 提成比例，0-1之间的小数 */
  commission_rate: number
  /** 上级用户ID，建立层级关系，可选 */
  parent_id?: string
}

/**
 * 更新用户请求接口
 * 定义更新用户信息时可修改的字段，所有字段都是可选的
 * 
 * @interface UpdateUserRequest
 * 
 * @example
 * ```typescript
 * // 更新用户角色和等级
 * const updateData: UpdateUserRequest = {
 *   role: 'leader',
 *   level: 4,
 *   commission_rate: 0.18
 * }
 * 
 * // 更新用户状态
 * const statusUpdate: UpdateUserRequest = {
 *   status: 'inactive'
 * }
 * 
 * // 调整上级关系
 * const hierarchyUpdate: UpdateUserRequest = {
 *   parent_id: 'new_manager_001'
 * }
 * 
 * // API调用示例
 * await userApi.updateUser('user_001', updateData)
 * ```
 */
export interface UpdateUserRequest {
  /** 邮箱地址，更新时需验证唯一性 */
  email?: string
  /** 手机号码，更新时需验证唯一性 */
  phone?: string
  /** 用户角色，权限变更需要相应授权 */
  role?: UserRole
  /** 用户状态，状态变更会影响登录和功能使用 */
  status?: UserStatus
  /** 用户等级，等级变更会影响提成计算 */
  level?: number
  /** 提成比例，0-1之间的小数 */
  commission_rate?: number
  /** 上级用户ID，层级关系变更需要验证有效性 */
  parent_id?: string
}