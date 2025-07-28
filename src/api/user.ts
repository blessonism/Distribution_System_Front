import type {
  User,
  UserQueryParams,
  UserListResponse,
  CreateUserRequest,
  UpdateUserRequest,
} from '@/types/user'
import { http } from '@/utils/request'

/**
 * 用户管理相关 API 接口模块
 * 提供完整的用户CRUD操作，包括查询、创建、更新、删除和批量操作
 * 
 * @namespace userApi
 */
export const userApi = {
  /**
   * 获取用户列表接口
   * 支持分页查询、搜索筛选和排序功能
   * 
   * @param {UserQueryParams} params - 查询参数，包含分页、筛选、排序等条件
   * @returns {Promise<UserListResponse>} 用户列表响应，包含用户数据和分页信息
   * @throws {Error} 查询失败时抛出错误
   * @complexity O(n) - n为查询结果数量，涉及数据库查询和分页计算
   * @flow 构建查询条件 -> 数据库查询 -> 应用筛选和排序 -> 分页处理 -> 返回结果
   * 
   * @example
   * ```typescript
   * const userList = await userApi.getUserList({
   *   page: 1,
   *   pageSize: 20,
   *   keyword: 'admin',
   *   status: 'active',
   *   sortBy: 'createTime',
   *   sortOrder: 'desc'
   * })
   * console.log(`共找到 ${userList.total} 个用户`)
   * ```
   */
  getUserList: async (params: UserQueryParams): Promise<UserListResponse> => {
    const response = await http.get<UserListResponse>('/users', { params })
    return response
  },

  /**
   * 获取用户详情接口
   * 根据用户ID获取完整的用户信息和权限数据
   * 
   * @param {string} id - 用户唯一标识符
   * @returns {Promise<User>} 用户详细信息对象
   * @throws {Error} 用户不存在或获取失败时抛出错误
   * @complexity O(1) - 单次数据库主键查询
   * @flow 验证用户ID -> 数据库查询 -> 权限数据关联 -> 返回用户信息
   * 
   * @example
   * ```typescript
   * const user = await userApi.getUser('user-123')
   * console.log(`用户名: ${user.username}, 角色: ${user.role}`)
   * ```
   */
  getUser: async (id: string): Promise<User> => {
    const response = await http.get<User>(`/users/${id}`)
    return response
  },

  /**
   * 创建用户接口
   * 创建新用户账户，包含用户信息验证和权限设置
   * 
   * @param {CreateUserRequest} data - 新用户数据，包含用户名、邮箱、角色等信息
   * @returns {Promise<User>} 创建成功的用户信息
   * @throws {Error} 创建失败时抛出错误（用户名重复、邮箱重复、数据验证失败等）
   * @complexity O(1) - 单次数据库插入加唯一性检查
   * @flow 数据验证 -> 唯一性检查 -> 密码加密 -> 数据库插入 -> 返回用户信息
   * 
   * @example
   * ```typescript
   * const newUser = await userApi.createUser({
   *   username: 'newuser',
   *   email: 'newuser@example.com',
   *   password: 'securePassword123',
   *   role: 'user',
   *   phone: '13800138000'
   * })
   * console.log(`用户创建成功: ${newUser.id}`)
   * ```
   */
  createUser: async (data: CreateUserRequest): Promise<User> => {
    const response = await http.post<User>('/users', data)
    return response
  },

  /**
   * 更新用户接口
   * 更新指定用户的信息，支持部分字段更新
   * 
   * @param {string} id - 要更新的用户ID
   * @param {UpdateUserRequest} data - 更新数据，只需包含要修改的字段
   * @returns {Promise<User>} 更新后的用户信息
   * @throws {Error} 更新失败时抛出错误（用户不存在、数据验证失败、权限不足等）
   * @complexity O(1) - 单次数据库更新操作
   * @flow 验证用户存在 -> 数据验证 -> 权限检查 -> 数据库更新 -> 返回更新结果
   * 
   * @example
   * ```typescript
   * const updatedUser = await userApi.updateUser('user-123', {
   *   email: 'newemail@example.com',
   *   phone: '13900139000',
   *   status: 'active'
   * })
   * console.log(`用户信息已更新: ${updatedUser.username}`)
   * ```
   */
  updateUser: async (id: string, data: UpdateUserRequest): Promise<User> => {
    const response = await http.put<User>(`/users/${id}`, data)
    return response
  },

  /**
   * 删除用户接口
   * 软删除指定用户，保留数据但标记为已删除状态
   * 
   * @param {string} id - 要删除的用户ID
   * @returns {Promise<void>} 删除操作无返回值
   * @throws {Error} 删除失败时抛出错误（用户不存在、权限不足、系统用户不可删除等）
   * @complexity O(1) - 单次数据库软删除更新
   * @flow 验证用户存在 -> 检查删除权限 -> 检查系统用户 -> 软删除操作 -> 清理相关数据
   * 
   * @example
   * ```typescript
   * await userApi.deleteUser('user-123')
   * console.log('用户已删除')
   * ```
   */
  deleteUser: async (id: string): Promise<void> => {
    await http.delete(`/users/${id}`)
  },

  /**
   * 批量删除用户接口
   * 同时软删除多个用户，提高批量操作效率
   * 
   * @param {string[]} ids - 要删除的用户ID数组
   * @returns {Promise<void>} 批量删除操作无返回值
   * @throws {Error} 删除失败时抛出错误（部分用户不存在、权限不足、包含系统用户等）
   * @complexity O(n) - n为要删除的用户数量，批量数据库操作
   * @flow 验证用户ID列表 -> 批量权限检查 -> 过滤系统用户 -> 批量软删除 -> 清理相关数据
   * 
   * @example
   * ```typescript
   * await userApi.batchDeleteUsers(['user-123', 'user-456', 'user-789'])
   * console.log('批量删除完成')
   * ```
   */
  batchDeleteUsers: async (ids: string[]): Promise<void> => {
    await http.delete('/users/batch', { data: { ids } })
  },

  /**
   * 重置用户密码接口
   * 管理员重置指定用户的登录密码
   * 
   * @param {string} id - 要重置密码的用户ID
   * @param {string} newPassword - 新密码（明文，服务器端会进行加密）
   * @returns {Promise<void>} 重置操作无返回值
   * @throws {Error} 重置失败时抛出错误（用户不存在、密码不符合安全要求、权限不足等）
   * @complexity O(1) - 单次数据库更新加密码加密
   * @flow 验证用户存在 -> 检查重置权限 -> 密码强度验证 -> 密码加密 -> 数据库更新
   * 
   * @example
   * ```typescript
   * await userApi.resetPassword('user-123', 'newSecurePassword123!')
   * console.log('密码重置成功')
   * ```
   */
  resetPassword: async (id: string, newPassword: string): Promise<void> => {
    await http.post(`/users/${id}/reset-password`, { password: newPassword })
  },

  /**
   * 导出用户数据接口
   * 根据筛选条件导出用户数据为Excel或CSV文件
   * 
   * @param {Partial<UserQueryParams>} params - 导出筛选条件，可选的查询参数
   * @returns {Promise<Blob>} 文件数据流，可用于下载
   * @throws {Error} 导出失败时抛出错误（查询失败、文件生成失败等）
   * @complexity O(n) - n为导出用户数量，涉及数据查询和文件生成
   * @flow 应用筛选条件 -> 查询用户数据 -> 生成导出文件 -> 返回文件流
   * 
   * @example
   * ```typescript
   * const fileBlob = await userApi.exportUsers({
   *   status: 'active',
   *   role: 'user',
   *   createTimeStart: '2024-01-01',
   *   createTimeEnd: '2024-12-31'
   * })
   * 
   * // 创建下载链接
   * const url = URL.createObjectURL(fileBlob)
   * const link = document.createElement('a')
   * link.href = url
   * link.download = 'users.xlsx'
   * link.click()
   * ```
   */
  exportUsers: async (params: Partial<UserQueryParams>): Promise<Blob> => {
    const response = await http.get('/users/export', {
      params,
      responseType: 'blob',
    })
    return response
  },
}