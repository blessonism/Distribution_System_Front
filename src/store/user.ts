import { defineStore } from 'pinia'
import type { User, LoginRequest, LoginResponse, RegisterRequest, RegisterResponse } from '@/types/api'
import type { UserRole } from '@/types/api'
import { http } from '@/utils/request'
import { authApi, handleAuthError } from '@/api/auth'
import { canUserInvite, getAllowedTargetRoles, getMaxInviteCodes } from '@/store/invitation'

interface UserState {
  token: string | null
  userInfo: User | null
  roles: string[]
  permissions: string[]
  routesLoaded: boolean
  // 新增邀请相关状态
  invitePermissions: {
    canInvite: boolean
    allowedTargetRoles: UserRole[]
    maxCodes: number
  }
}

export const useUserStore = defineStore('user', {
  state: (): UserState => {
    // 从localStorage恢复角色信息和用户信息
    let roles: string[] = []
    let userInfo: User | null = null

    if (typeof window !== 'undefined') {
      // 恢复角色信息
      const storedRoles = localStorage.getItem('userRoles')
      if (storedRoles) {
        try {
          roles = JSON.parse(storedRoles)
        } catch (error) {
          console.error('[用户Store] 解析存储的角色信息失败:', error)
        }
      }

      // 恢复用户信息
      const storedUserInfo = localStorage.getItem('userInfo')
      if (storedUserInfo) {
        try {
          userInfo = JSON.parse(storedUserInfo)
        } catch (error) {
          console.error('[用户Store] 解析存储的用户信息失败:', error)
        }
      }
    }

    console.log('[用户Store] 初始化状态，恢复的角色:', roles)
    console.log('[用户Store] 初始化状态，恢复的用户信息:', userInfo)

    return {
      token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
      userInfo,
      roles,
      permissions: [],
      routesLoaded: false,
      invitePermissions: {
        canInvite: false,
        allowedTargetRoles: [],
        maxCodes: 0
      }
    }
  },

  getters: {
    isLoggedIn: (state) => !!state.token,
    userRole: (state) => state.userInfo?.role || null,
    hasPermission: (state) => (role: string) => {
      // 使用state.roles数组而不是userInfo.role
      if (!state.roles || state.roles.length === 0) return false
      return state.roles.includes(role) || state.roles.includes('super_admin')
    },
    
    // 新增邀请相关getters
    canUserInvite: (state) => state.invitePermissions.canInvite,
    getAllowedInviteRoles: (state) => state.invitePermissions.allowedTargetRoles,
    getMaxInviteCodes: (state) => state.invitePermissions.maxCodes,
    
    // 检查是否可以邀请特定角色
    canInviteRole: (state) => (targetRole: UserRole) => {
      return state.invitePermissions.canInvite && 
             state.invitePermissions.allowedTargetRoles.includes(targetRole)
    },
    
    // 检查是否是代理角色（代理无邀请权限）
    isAgent: (state) => state.userInfo?.role === 'agent',
    
    // 获取用户显示名称（昵称优先，否则用户名）
    displayName: (state) => state.userInfo?.nickname || state.userInfo?.username || '未知用户'
  },

  actions: {
    /**
     * 更新邀请权限信息
     */
    updateInvitePermissions() {
      if (this.userInfo?.role) {
        this.invitePermissions = {
          canInvite: canUserInvite(this.userInfo.role),
          allowedTargetRoles: getAllowedTargetRoles(this.userInfo.role),
          maxCodes: getMaxInviteCodes(this.userInfo.role)
        }
      } else {
        this.invitePermissions = {
          canInvite: false,
          allowedTargetRoles: [],
          maxCodes: 0
        }
      }
    },

    async login(loginData: LoginRequest) {
      try {
        // 使用新的 authApi 而不是直接调用 http
        const responseData = await authApi.login(loginData)
        
        this.token = responseData.token
        this.userInfo = responseData.user
        this.roles = responseData.user.role ? [responseData.user.role] : []
        this.permissions = responseData.permissions
        
        // 更新邀请权限
        this.updateInvitePermissions()
        
        console.log('登录成功，用户角色:', this.roles)
        console.log('邀请权限:', this.invitePermissions)
        
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', responseData.token)
          localStorage.setItem('userRoles', JSON.stringify(this.roles))
          localStorage.setItem('userInfo', JSON.stringify(this.userInfo))
        }
        
        return responseData
      } catch (error: any) {
        const errorMessage = handleAuthError(error)
        console.error('[用户Store] 登录失败:', error)
        throw new Error(errorMessage)
      }
    },

    async getUserInfo() {
      try {
        console.log('[用户Store] 开始获取用户信息，当前角色:', this.roles)

        // 使用新的 authApi
        const profileData = await authApi.getUserProfile()

        console.log('[用户Store] API返回的用户信息:', profileData.user)

        this.userInfo = profileData.user
        this.roles = profileData.user.role ? [profileData.user.role] : []
        this.permissions = profileData.permissions

        // 更新localStorage中的角色信息和用户信息
        if (typeof window !== 'undefined') {
          localStorage.setItem('userRoles', JSON.stringify(this.roles))
          localStorage.setItem('userInfo', JSON.stringify(this.userInfo))
        }

        // 更新邀请权限
        this.updateInvitePermissions()

        console.log('[用户Store] 获取用户信息成功，更新后的角色:', this.roles)
        console.log('[用户Store] 邀请权限:', this.invitePermissions)

        return profileData
      } catch (error: any) {
        console.error('[用户Store] 获取用户信息失败:', error)
        this.logout()
        throw error
      }
    },

    logout() {
      // 调用登出API（不阻塞流程）
      authApi.logout().catch(error => {
        console.warn('[用户Store] 登出API调用失败:', error)
      })

      // 清除本地状态
      this.token = null
      this.userInfo = null
      this.roles = []
      this.permissions = []
      this.routesLoaded = false
      this.invitePermissions = {
        canInvite: false,
        allowedTargetRoles: [],
        maxCodes: 0
      }
      
      if (typeof window !== 'undefined') {
        // 清除所有本地存储
        localStorage.removeItem('token')
        localStorage.removeItem('routesLoaded')
        localStorage.removeItem('userRoles')
        localStorage.removeItem('userInfo')
        localStorage.removeItem('invitation-store') // 清除邀请数据缓存
        
        // 重置路由
        import('@/router').then(({ resetRouter, default: router }) => {
          resetRouter()
          // 确保路由状态被重置后再跳转到登录页
          setTimeout(() => {
            router.push('/login')
          }, 100)
        })
      }
    },

    async updateUserInfo(userInfo: Partial<User>) {
      try {
        const updatedUser = await http.put<User>(`/users/${this.userInfo?.id}`, userInfo)
        this.userInfo = { ...this.userInfo, ...updatedUser }
        
        // 如果角色发生变化，更新邀请权限
        if (updatedUser.role !== this.userInfo?.role) {
          this.updateInvitePermissions()
        }
        
        return updatedUser
      } catch (error: any) {
        const errorMessage = handleAuthError(error)
        console.error('[用户Store] 更新用户信息失败:', error)
        throw new Error(errorMessage)
      }
    },

    /**
     * 用户注册（支持邀请码）
     */
    async register(registerData: RegisterRequest): Promise<RegisterResponse> {
      try {
        const responseData = await authApi.register(registerData)
        
        // 注册成功后自动登录
        this.token = responseData.token
        this.userInfo = responseData.user
        this.roles = responseData.user.role ? [responseData.user.role] : []
        this.permissions = responseData.permissions
        
        // 更新邀请权限
        this.updateInvitePermissions()
        
        console.log('注册成功，用户角色:', this.roles)
        console.log('邀请信息:', responseData.invitationInfo)
        
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', responseData.token)
          localStorage.setItem('userRoles', JSON.stringify(this.roles))
        }
        
        return responseData
      } catch (error: any) {
        const errorMessage = handleAuthError(error)
        console.error('[用户Store] 注册失败:', error)
        throw new Error(errorMessage)
      }
    },

    /**
     * 使用邀请码注册
     */
    async registerWithInvite(registerData: RegisterRequest): Promise<RegisterResponse> {
      try {
        if (!registerData.inviteCode) {
          throw new Error('邀请码不能为空')
        }

        const responseData = await authApi.registerWithInvite(registerData as Required<Pick<RegisterRequest, 'inviteCode'>> & RegisterRequest)
        
        // 注册成功后自动登录
        this.token = responseData.token
        this.userInfo = responseData.user
        this.roles = responseData.user.role ? [responseData.user.role] : []
        this.permissions = responseData.permissions
        
        // 更新邀请权限
        this.updateInvitePermissions()
        
        console.log('邀请码注册成功，用户角色:', this.roles)
        console.log('邀请信息:', responseData.invitationInfo)
        
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', responseData.token)
          localStorage.setItem('userRoles', JSON.stringify(this.roles))
        }
        
        // 如果建立了邀请关系，可以触发邀请store刷新
        if (responseData.invitationInfo?.relationshipEstablished) {
          // 延迟刷新邀请数据，让邀请人能看到最新的邀请记录
          setTimeout(() => {
            // 这里可以发出事件或调用邀请store的刷新方法
            console.log('邀请关系建立成功，建议刷新邀请数据')
          }, 1000)
        }
        
        return responseData
      } catch (error: any) {
        const errorMessage = handleAuthError(error)
        console.error('[用户Store] 邀请码注册失败:', error)
        throw new Error(errorMessage)
      }
    },

    /**
     * 检查用户名可用性
     */
    async checkUsernameAvailability(username: string): Promise<boolean> {
      try {
        const result = await authApi.checkUsernameAvailability(username)
        return result.available
      } catch (error: any) {
        console.error('[用户Store] 检查用户名可用性失败:', error)
        return false
      }
    },

    /**
     * 检查邮箱可用性
     */
    async checkEmailAvailability(email: string): Promise<boolean> {
      try {
        const result = await authApi.checkEmailAvailability(email)
        return result.available
      } catch (error: any) {
        console.error('[用户Store] 检查邮箱可用性失败:', error)
        return false
      }
    },

    /**
     * 刷新令牌
     */
    async refreshToken(): Promise<string> {
      try {
        const result = await authApi.refreshToken()
        this.token = result.token
        
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', result.token)
        }
        
        return result.token
      } catch (error: any) {
        console.error('[用户Store] 刷新令牌失败:', error)
        // 刷新失败则登出用户
        this.logout()
        throw error
      }
    }
  },
})