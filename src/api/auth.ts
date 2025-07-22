import { http } from '@/utils/request'
import type { 
  LoginRequest, 
  LoginResponse, 
  RegisterRequest, 
  RegisterResponse,
  User 
} from '@/types/api'

/**
 * 认证相关 API 接口
 */
export const authApi = {
  /**
   * 用户登录
   * @param loginData - 登录数据
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
   * 用户注册（支持邀请码）
   * @param registerData - 注册数据，包含可选的邀请码
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
   * 使用邀请码注册（registerWithInvite 的别名方法，便于明确调用意图）
   * @param registerData - 注册数据，必须包含邀请码
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
   * 获取当前用户信息
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
   * 用户登出
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
   * 刷新令牌
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
   * 重置密码请求
   * @param email - 用户邮箱
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
   * 确认密码重置
   * @param token - 重置令牌
   * @param newPassword - 新密码
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
   * 检查用户名是否可用
   * @param username - 用户名
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
   * 检查邮箱是否可用
   * @param email - 邮箱地址
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
 * @param error - 错误对象
 * @returns 用户友好的错误信息
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
 * 检查密码强度
 * @param password - 密码
 * @returns 密码强度评估结果
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
 * 验证邮箱格式
 * @param email - 邮箱地址
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * 验证用户名格式
 * @param username - 用户名
 */
export const validateUsername = (username: string): boolean => {
  // 用户名规则：3-20个字符，只能包含字母、数字、下划线
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
  return usernameRegex.test(username)
}