export interface User {
  id: string
  username: string
  email: string
  phone: string
  avatar?: string
  role: UserRole
  status: UserStatus
  level: number
  commission_rate: number
  parent_id?: string
  parent_name?: string
  created_at: string
  updated_at: string
  last_login_at?: string
}

export type UserRole = 'super_admin' | 'director' | 'leader' | 'sales' | 'agent'
export type UserStatus = 'active' | 'inactive' | 'pending' | 'banned'

// 为搜索参数添加特殊的"all"类型
export type SearchRole = UserRole | 'all'
export type SearchStatus = UserStatus | 'all'

export interface UserQueryParams {
  page: number
  page_size: number
  keyword?: string
  role?: UserRole
  status?: UserStatus
  level?: number
  date_from?: string
  date_to?: string
}

// 特殊的前端搜索参数接口
export interface UserSearchParams {
  page: number
  page_size: number
  keyword?: string
  role?: SearchRole
  status?: SearchStatus
  level?: number
  date_from?: string
  date_to?: string
}

export interface UserListResponse {
  items: User[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface CreateUserRequest {
  username: string
  email: string
  phone: string
  password: string
  role: UserRole
  level: number
  commission_rate: number
  parent_id?: string
}

export interface UpdateUserRequest {
  email?: string
  phone?: string
  role?: UserRole
  status?: UserStatus
  level?: number
  commission_rate?: number
  parent_id?: string
}