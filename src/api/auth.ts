import { http } from '@/utils/request'
import type { 
  LoginRequest, 
  LoginResponse, 
  RegisterRequest, 
  RegisterResponse,
  User 
} from '@/types/api'

/**
 * 认证相关 API 接口模块
 * 提供完整的用户认证功能，包括登录、注册、密码管理等
 * 
 * @namespace authApi
 */
export const authApi = {
  /**
   * 用户登录接口
   * 验证用户凭据并返回访问令牌和用户信息
   * 
   * @param {LoginRequest} loginData - 登录数据，包含用户名和密码
   * @returns {Promise<LoginResponse>} 登录响应，包含token和用户信息
   * @throws {Error} 登录失败时抛出错误
   * @complexity O(1) - 单次HTTP请求
   * @flow 发送登录请求 -> 服务器验证 -> 返回token -> 设置认证状态
   * 
   * @example
   * ```typescript
   * const loginResult = await authApi.login({
   *   username: 'user@example.com',
   *   password: 'password123'
   * })
   * ```
   */
  login: async (loginData: LoginRequest): Promise<LoginResponse> => {
    try {
      const response = await http.post<LoginResponse>('/auth/login', loginData)
      return response
    } catch (error) {
      console.error('[认证API] 登录失败:', error)
      throw error
    }
  },

  /**
   * 用户注册接口（支持邀请码）
   * 创建新用户账户，支持使用邀请码设置用户角色
   * 
   * @param {RegisterRequest} registerData - 注册数据，包含用户信息和可选的邀请码
   * @returns {Promise<RegisterResponse>} 注册响应，包含新用户信息
   * @throws {Error} 注册失败时抛出错误（用户名存在、邮箱重复等）
   * @complexity O(1) - 单次HTTP请求加数据库插入
   * @flow 验证数据 -> 检查唯一性 -> 创建用户 -> 处理邀请码 -> 返回结果
   * 
   * @example
   * ```typescript
   * const registerResult = await authApi.register({
   *   username: 'newuser',
   *   email: 'new@example.com',
   *   password: 'securePassword123',
   *   inviteCode: 'INVITE123' // 可选
   * })
   * ```
   */
  register: async (registerData: RegisterRequest): Promise<RegisterResponse> => {
    try {
      const response = await http.post<RegisterResponse>('/auth/register', registerData)
      return response
    } catch (error) {
      console.error('[认证API] 注册失败:', error)
      throw error
    }
  },

  /**
   * 使用邀请码注册（registerWithInvite 的明确方法，强制要求邀请码）
   * 专门用于邀请码注册场景，确保邀请码的存在和有效性
   * 
   * @param {Required<Pick<RegisterRequest, 'inviteCode'>> & RegisterRequest} registerData - 注册数据，必须包含邀请码
   * @returns {Promise<RegisterResponse>} 注册响应，包含新用户信息
   * @throws {Error} 注册失败或邀请码为空时抛出错误
   * @complexity O(1) - 单次HTTP请求加邀请码验证
   * @flow 验证邀请码存在 -> 发送注册请求 -> 处理邀请码逻辑 -> 返回结果
   * 
   * @example
   * ```typescript
   * const registerResult = await authApi.registerWithInvite({
   *   username: 'inviteduser',
   *   email: 'invited@example.com',
   *   password: 'securePassword123',
   *   inviteCode: 'MANDATORY_INVITE' // 必需字段
   * })
   * ```
   */
  registerWithInvite: async (registerData: Required<Pick<RegisterRequest, 'inviteCode'>> & RegisterRequest): Promise<RegisterResponse> => {
    try {
      // 确保邀请码存在
      if (!registerData.inviteCode) {
        throw new Error('邀请码不能为空')
      }
      
      const response = await http.post<RegisterResponse>('/auth/register', registerData)
      return response
    } catch (error) {
      console.error('[认证API] 邀请码注册失败:', error)
      throw error
    }
  },

  /**
   * 获取当前用户信息接口
   * 通过认证token获取当前登录用户的详细信息和权限列表
   * 
   * @returns {Promise<{user: User; permissions: string[]}>} 用户信息和权限列表
   * @throws {Error} 获取失败时抛出错误（通常是token无效）
   * @complexity O(1) - 单次HTTP请求
   * @flow 发送请求 -> 验证token -> 查询用户信息 -> 返回用户数据和权限
   * 
   * @example
   * ```typescript
   * const { user, permissions } = await authApi.getUserProfile()
   * console.log(`当前用户: ${user.username}, 权限: ${permissions.join(', ')}`)
   * ```
   */
  getUserProfile: async (): Promise<{ user: User; permissions: string[] }> => {
    try {
      const response = await http.get<{ user: User; permissions: string[] }>('/user/profile')
      return response
    } catch (error) {
      console.error('[认证API] 获取用户信息失败:', error)
      throw error
    }
  },

  /**
   * 用户登出接口
   * 安全地结束用户会话，清理服务器端的认证状态
   * 
   * @returns {Promise<void>} 无返回值，登出完成后前端应清理本地状态
   * @throws {Error} 登出失败时静默处理，不抛出错误（允许前端自行清理状态）
   * @complexity O(1) - 单次HTTP请求
   * @flow 发送登出请求 -> 清理服务器session -> 前端清理token和状态
   * 
   * @example
   * ```typescript
   * await authApi.logout()
   * // 登出后清理本地状态
   * userStore.clearUserData()
   * router.push('/login')
   * ```
   */
  logout: async (): Promise<void> => {
    try {
      await http.post('/auth/logout')
    } catch (error) {
      console.error('[认证API] 登出失败:', error)
      // 登出失败不抛出错误，因为前端可以自行清理状态
    }
  },

  /**
   * 刷新访问令牌接口
   * 使用刷新令牌获取新的访问令牌，延长用户会话有效期
   * 
   * @returns {Promise<{token: string}>} 新的访问令牌对象
   * @throws {Error} 刷新失败时抛出错误（通常是刷新令牌无效或过期）
   * @complexity O(1) - 单次HTTP请求
   * @flow 发送刷新请求 -> 验证刷新令牌 -> 生成新访问令牌 -> 返回新token
   * 
   * @example
   * ```typescript
   * try {
   *   const { token } = await authApi.refreshToken()
   *   // 更新本地存储的token
   *   userStore.setToken(token)
   * } catch (error) {
   *   // 刷新失败，重定向到登录页
   *   router.push('/login')
   * }
   * ```
   */
  refreshToken: async (): Promise<{ token: string }> => {
    try {
      const response = await http.post<{ token: string }>('/auth/refresh')
      return response
    } catch (error) {
      console.error('[认证API] 刷新令牌失败:', error)
      throw error
    }
  },

  /**
   * 发起密码重置请求接口
   * 向指定邮箱发送密码重置链接，启动密码重置流程
   * 
   * @param {string} email - 用户注册时使用的邮箱地址
   * @returns {Promise<{message: string}>} 操作结果消息
   * @throws {Error} 请求失败时抛出错误（邮箱不存在、发送失败等）
   * @complexity O(1) - 单次HTTP请求加邮件发送
   * @flow 验证邮箱存在 -> 生成重置token -> 发送重置邮件 -> 返回确认信息
   * 
   * @example
   * ```typescript
   * const result = await authApi.requestPasswordReset('user@example.com')
   * console.log(result.message) // "重置邮件已发送，请查收"
   * ```
   */
  requestPasswordReset: async (email: string): Promise<{ message: string }> => {
    try {
      const response = await http.post<{ message: string }>('/auth/password-reset/request', { email })
      return response
    } catch (error) {
      console.error('[认证API] 重置密码请求失败:', error)
      throw error
    }
  },

  /**
   * 确认密码重置接口
   * 使用重置令牌完成密码重置，设置用户新密码
   * 
   * @param {string} token - 从重置邮件中获取的重置令牌
   * @param {string} newPassword - 用户设置的新密码
   * @returns {Promise<{message: string}>} 操作结果消息
   * @throws {Error} 重置失败时抛出错误（令牌无效、过期、密码不符合要求等）
   * @complexity O(1) - 单次HTTP请求加密码加密存储
   * @flow 验证重置token -> 检查密码强度 -> 更新用户密码 -> 返回确认信息
   * 
   * @example
   * ```typescript
   * const result = await authApi.confirmPasswordReset(
   *   'reset_token_from_email',
   *   'newSecurePassword123!'
   * )
   * console.log(result.message) // "密码重置成功"
   * ```
   */
  confirmPasswordReset: async (token: string, newPassword: string): Promise<{ message: string }> => {
    try {
      const response = await http.post<{ message: string }>('/auth/password-reset/confirm', {
        token,
        newPassword
      })
      return response
    } catch (error) {
      console.error('[认证API] 确认密码重置失败:', error)
      throw error
    }
  },

  /**
   * 检查用户名可用性接口
   * 验证指定用户名是否可以注册使用，避免用户名冲突
   * 
   * @param {string} username - 要检查的用户名
   * @returns {Promise<{available: boolean}>} 可用性检查结果
   * @throws {Error} 检查失败时抛出错误
   * @complexity O(1) - 单次HTTP请求加数据库查询
   * @flow 发送检查请求 -> 数据库查询用户名 -> 返回可用状态
   * 
   * @example
   * ```typescript
   * const { available } = await authApi.checkUsernameAvailability('newuser')
   * if (available) {
   *   console.log('用户名可以使用')
   * } else {
   *   console.log('用户名已被占用')
   * }
   * ```
   */
  checkUsernameAvailability: async (username: string): Promise<{ available: boolean }> => {
    try {
      const response = await http.get<{ available: boolean }>('/auth/check-username', {
        params: { username }
      })
      return response
    } catch (error) {
      console.error('[认证API] 检查用户名可用性失败:', error)
      throw error
    }
  },

  /**
   * 检查邮箱可用性接口
   * 验证指定邮箱是否可以注册使用，避免邮箱重复注册
   * 
   * @param {string} email - 要检查的邮箱地址
   * @returns {Promise<{available: boolean}>} 可用性检查结果
   * @throws {Error} 检查失败时抛出错误
   * @complexity O(1) - 单次HTTP请求加数据库查询
   * @flow 发送检查请求 -> 数据库查询邮箱 -> 返回可用状态
   * 
   * @example
   * ```typescript
   * const { available } = await authApi.checkEmailAvailability('user@example.com')
   * if (available) {
   *   console.log('邮箱可以使用')
   * } else {
   *   console.log('邮箱已被注册')
   * }
   * ```
   */
  checkEmailAvailability: async (email: string): Promise<{ available: boolean }> => {
    try {
      const response = await http.get<{ available: boolean }>('/auth/check-email', {
        params: { email }
      })
      return response
    } catch (error) {
      console.error('[认证API] 检查邮箱可用性失败:', error)
      throw error
    }
  }
}

// 导出默认对象以便解构使用
export default authApi

/**
 * 认证错误处理工具函数
 * 将后端返回的错误码和HTTP状态码转换为用户友好的中文错误信息
 * 
 * @param {any} error - 错误对象，可能来自axios或自定义错误
 * @returns {string} 用户友好的中文错误信息
 * @complexity O(1) - 基于错误码的直接映射查找
 * @flow 提取错误码 -> 查询映射表 -> 检查HTTP状态 -> 返回友好信息
 * 
 * @example
 * ```typescript
 * try {
 *   await authApi.login(loginData)
 * } catch (error) {
 *   const friendlyMessage = handleAuthError(error)
 *   showMessage(friendlyMessage) // "用户名或密码错误"
 * }
 * ```
 */
export const handleAuthError = (error: any): string => {
  const errorMap: Record<string, string> = {
    // 登录相关错误
    'AUTH_001': '用户名或密码错误',
    'AUTH_002': '账户已被禁用',
    'AUTH_003': '账户已被锁定，请稍后重试',
    'AUTH_004': '登录会话已过期，请重新登录',
    
    // 注册相关错误
    'REG_001': '用户名已存在',
    'REG_002': '邮箱已被注册',
    'REG_003': '密码强度不够',
    'REG_004': '邮箱格式不正确',
    'REG_005': '用户名格式不正确',
    'REG_006': '手机号格式不正确',
    'REG_007': '注册失败，请稍后重试',
    
    // 邀请码相关错误（复用邀请API的错误处理）
    'INVITE_001': '邀请码无效或不存在',
    'INVITE_002': '邀请码已过期',
    'INVITE_003': '您的角色无法使用此邀请码',
    'INVITE_004': '不能使用自己的邀请码',
    'INVITE_005': '您没有邀请权限',
    
    // 令牌相关错误
    'TOKEN_001': '访问令牌无效',
    'TOKEN_002': '访问令牌已过期',
    'TOKEN_003': '刷新令牌无效',
    'TOKEN_004': '刷新令牌已过期',
    
    // 密码重置相关错误
    'PWD_RESET_001': '重置令牌无效',
    'PWD_RESET_002': '重置令牌已过期',
    'PWD_RESET_003': '该邮箱未注册',
    'PWD_RESET_004': '重置邮件发送失败',
  }
  
  // 提取错误码
  const errorCode = error?.response?.data?.code || error?.code || error?.message
  
  // 如果有对应的错误映射，返回友好信息
  if (errorCode && errorMap[errorCode]) {
    return errorMap[errorCode]
  }
  
  // 检查HTTP状态码
  const status = error?.response?.status
  switch (status) {
    case 400:
      return '请求参数错误'
    case 401:
      return '用户名或密码错误'
    case 403:
      return '账户无权限访问'
    case 404:
      return '用户不存在'
    case 409:
      return '用户名或邮箱已存在'
    case 422:
      return '数据验证失败'
    case 429:
      return '请求过于频繁，请稍后重试'
    case 500:
      return '服务器内部错误，请稍后重试'
    default:
      return error?.response?.data?.message || error?.message || '操作失败，请重试'
  }
}

/**
 * 检查密码强度评估函数
 * 基于多个维度评估密码安全性并提供改进建议
 * 
 * 评估维度:
 * - 长度（至少8位）
 * - 小写字母
 * - 大写字母
 * - 数字
 * - 特殊字符
 * 
 * @param {string} password - 要评估的密码
 * @returns {{score: number, level: string, suggestions: string[]}} 密码强度评估结果
 * @complexity O(n) - n为密码长度，需要多次正则匹配
 * @flow 长度检查 -> 字符类型检查 -> 计算分数 -> 确定等级 -> 生成建议
 * 
 * @example
 * ```typescript
 * const result = checkPasswordStrength('Password123!')
 * // { score: 5, level: 'strong', suggestions: [] }
 * 
 * const weakResult = checkPasswordStrength('123')
 * // { score: 1, level: 'weak', suggestions: ['密码长度至少8位', ...] }
 * ```
 */
export const checkPasswordStrength = (password: string): {
  score: number // 0-4 分数
  level: 'weak' | 'fair' | 'good' | 'strong'
  suggestions: string[]
} => {
  let score = 0
  const suggestions: string[] = []
  
  // 长度检查
  if (password.length >= 8) {
    score += 1
  } else {
    suggestions.push('密码长度至少8位')
  }
  
  // 包含小写字母
  if (/[a-z]/.test(password)) {
    score += 1
  } else {
    suggestions.push('包含小写字母')
  }
  
  // 包含大写字母
  if (/[A-Z]/.test(password)) {
    score += 1
  } else {
    suggestions.push('包含大写字母')
  }
  
  // 包含数字
  if (/\d/.test(password)) {
    score += 1
  } else {
    suggestions.push('包含数字')
  }
  
  // 包含特殊字符
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score += 1
  } else {
    suggestions.push('包含特殊字符')
  }
  
  // 确定强度级别
  let level: 'weak' | 'fair' | 'good' | 'strong'
  if (score <= 1) {
    level = 'weak'
  } else if (score <= 2) {
    level = 'fair'
  } else if (score <= 3) {
    level = 'good'
  } else {
    level = 'strong'
  }
  
  return { score, level, suggestions }
}

/**
 * 验证邮箱格式函数
 * 使用正则表达式验证邮箱地址的格式有效性
 * 
 * @param {string} email - 要验证的邮箱地址
 * @returns {boolean} 邮箱格式是否有效
 * @complexity O(n) - n为邮箱字符串长度，正则匹配复杂度
 * @flow 正则匹配 -> 返回布尔结果
 * 
 * @example
 * ```typescript
 * validateEmail('user@example.com') // true
 * validateEmail('invalid-email') // false
 * ```
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * 验证用户名格式函数
 * 验证用户名是否符合平台规范：3-20个字符，只能包含字母、数字、下划线
 * 
 * @param {string} username - 要验证的用户名
 * @returns {boolean} 用户名格式是否有效
 * @complexity O(n) - n为用户名字符串长度，正则匹配复杂度
 * @flow 正则匹配 -> 返回布尔结果
 * 
 * @example
 * ```typescript
 * validateUsername('user_123') // true
 * validateUsername('abc') // true  
 * validateUsername('ab') // false (少于3个字符)
 * validateUsername('user@123') // false (包含非法字符)
 * ```
 */
export const validateUsername = (username: string): boolean => {
  // 用户名规则：3-20个字符，只能包含字母、数字、下划线
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
  return usernameRegex.test(username)
}