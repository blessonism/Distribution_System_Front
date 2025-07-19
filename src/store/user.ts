import { defineStore } from 'pinia'
import type { User, LoginRequest, LoginResponse } from '@/types/api'
import { http } from '@/utils/request'

interface UserState {
  token: string | null
  userInfo: User | null
  roles: string[]
  permissions: string[]
  routesLoaded: boolean
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
    userInfo: null,
    roles: [],
    permissions: [],
    routesLoaded: false,
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
    userRole: (state) => state.userInfo?.role || null,
    hasPermission: (state) => (role: string) => {
      if (!state.userInfo?.role) return false
      return role === state.userInfo.role || state.userInfo.role === 'super_admin'
    },
  },

  actions: {
    async login(loginData: LoginRequest) {
      try {
        const responseData = await http.post<LoginResponse>('/auth/login', loginData)
        
        this.token = responseData.token
        this.userInfo = responseData.user
        this.roles = responseData.user.role ? [responseData.user.role] : []
        this.permissions = responseData.permissions
        
        console.log('登录成功，用户角色:', this.roles)
        
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', responseData.token)
          localStorage.setItem('userRoles', JSON.stringify(this.roles))
        }
        
        return responseData
      } catch (error) {
        throw error
      }
    },

    async getUserInfo() {
      try {
        const profileData = await http.get<LoginResponse>('/user/profile')
        
        this.userInfo = profileData.user
        this.roles = profileData.user.role ? [profileData.user.role] : []
        this.permissions = profileData.permissions
        
        console.log('获取用户信息成功，用户角色:', this.roles)
        
        return profileData
      } catch (error) {
        this.logout()
        throw error
      }
    },

    logout() {
      this.token = null
      this.userInfo = null
      this.roles = []
      this.permissions = []
      this.routesLoaded = false
      
      if (typeof window !== 'undefined') {
        // 先清除localStorage中的状态
        localStorage.removeItem('token')
        localStorage.removeItem('routesLoaded')
        localStorage.removeItem('userRoles')
        
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
        return updatedUser
      } catch (error) {
        throw error
      }
    },
  },
})