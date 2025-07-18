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
    hasPermission: (state) => (roles: string[]) => {
      if (!state.userInfo?.role) return false
      return roles.includes(state.userInfo.role)
    },
  },

  actions: {
    async login(loginData: LoginRequest) {
      try {
        const response: LoginResponse = await http.post('/auth/login', loginData)
        
        this.token = response.token
        this.userInfo = response.user
        // 确保角色是字符串数组形式
        this.roles = response.user.role ? [response.user.role] : []
        this.permissions = response.permissions
        
        console.log('登录成功，用户角色:', this.roles)
        
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', response.token)
          // 保存用户角色到localStorage，用于刷新时恢复路由
          localStorage.setItem('userRoles', JSON.stringify(this.roles))
        }
        
        return response
      } catch (error) {
        throw error
      }
    },

    async getUserInfo() {
      try {
        const response: LoginResponse = await http.get('/user/profile')
        
        this.userInfo = response.user
        // 确保角色是字符串数组形式
        this.roles = response.user.role ? [response.user.role] : []
        this.permissions = response.permissions
        
        console.log('获取用户信息成功，用户角色:', this.roles)
        
        return response
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
        const response: User = await http.put(`/users/${this.userInfo?.id}`, userInfo)
        this.userInfo = { ...this.userInfo, ...response }
        return response
      } catch (error) {
        throw error
      }
    },
  },
})