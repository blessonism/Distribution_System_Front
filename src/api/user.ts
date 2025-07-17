import type {
  User,
  UserQueryParams,
  UserListResponse,
  CreateUserRequest,
  UpdateUserRequest,
} from '@/types/user'
import { http } from '@/utils/request'

export const userApi = {
  /**
   * 获取用户列表
   */
  getUserList: async (params: UserQueryParams): Promise<UserListResponse> => {
    const response = await http.get<UserListResponse>('/users', { params })
    return response
  },

  /**
   * 获取用户详情
   */
  getUser: async (id: string): Promise<User> => {
    const response = await http.get<User>(`/users/${id}`)
    return response
  },

  /**
   * 创建用户
   */
  createUser: async (data: CreateUserRequest): Promise<User> => {
    const response = await http.post<User>('/users', data)
    return response
  },

  /**
   * 更新用户
   */
  updateUser: async (id: string, data: UpdateUserRequest): Promise<User> => {
    const response = await http.put<User>(`/users/${id}`, data)
    return response
  },

  /**
   * 删除用户
   */
  deleteUser: async (id: string): Promise<void> => {
    await http.delete(`/users/${id}`)
  },

  /**
   * 批量删除用户
   */
  batchDeleteUsers: async (ids: string[]): Promise<void> => {
    await http.delete('/users/batch', { data: { ids } })
  },

  /**
   * 重置用户密码
   */
  resetPassword: async (id: string, newPassword: string): Promise<void> => {
    await http.post(`/users/${id}/reset-password`, { password: newPassword })
  },

  /**
   * 导出用户数据
   */
  exportUsers: async (params: Partial<UserQueryParams>): Promise<Blob> => {
    const response = await http.get('/users/export', {
      params,
      responseType: 'blob',
    })
    return response
  },
}