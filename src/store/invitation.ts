import { defineStore } from 'pinia'
import { invitationApi, handleInvitationError } from '@/api/invitation'
import { hasInvitationPermission } from '@/utils/invitation'
import type {
  InvitationCode,
  InvitationRecord,
  InvitationStats,
  InvitationState,
  HistoryQueryParams,
  StatsQueryParams,
  ValidateCodeResponse,
  RoleInvitePermission
} from '@/types/invitation'
import type { UserRole, PaginatedResponse } from '@/types/api'

/**
 * 邀请系统 Pinia Store
 */
export const useInvitationStore = defineStore('invitation', {
  state: (): InvitationState => ({
    codes: [],
    history: [],
    stats: null,
    loading: false,
    error: null,
  }),

  getters: {
    /**
     * 获取邀请码列表（用于组件访问）
     */
    invitationCodes: (state) => state.codes,

    /**
     * 获取邀请历史列表（用于组件访问）
     */
    invitationHistory: (state) => state.history,

    /**
     * 获取邀请统计信息（用于组件访问）
     */
    invitationStats: (state) => state.stats,

    /**
     * 根据角色获取邀请码
     */
    getCodesByRole: (state) => (role: UserRole) => {
      return state.codes.filter(code => code.targetRole === role)
    },

    /**
     * 获取可用的邀请码（状态为active）
     */
    getActiveCodes: (state) => {
      return state.codes.filter(code => code.status === 'active')
    },

    /**
     * 获取不可用的邀请码（状态为inactive）
     */
    getInactiveCodes: (state) => {
      return state.codes.filter(code => code.status === 'inactive')
    },

    /**
     * 计算总邀请人数
     */
    getTotalInvitees: (state) => {
      return state.history.length
    },

    /**
     * 获取本月邀请人数
     */
    getMonthlyInvitees: (state) => {
      const currentMonth = new Date().getMonth()
      const currentYear = new Date().getFullYear()
      return state.history.filter(record => {
        const recordDate = new Date(record.registeredAt)
        return recordDate.getMonth() === currentMonth && 
               recordDate.getFullYear() === currentYear
      }).length
    },

    /**
     * 按角色统计邀请人数
     */
    getInviteesByRole: (state) => {
      const roleCount: Partial<Record<UserRole, number>> = {}
      state.history.forEach(record => {
        roleCount[record.actualRole] = (roleCount[record.actualRole] || 0) + 1
      })
      return roleCount
    },

    /**
     * 获取最近的邀请记录
     */
    getRecentInvites: (state) => (limit: number = 5) => {
      return [...state.history]
        .sort((a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime())
        .slice(0, limit)
    },

    /**
     * 检查是否有正在加载的操作
     */
    isLoading: (state) => state.loading,

    /**
     * 获取最后的错误信息
     */
    getError: (state) => state.error,

    /**
     * 检查是否有邀请码数据
     */
    hasInvitationCodes: (state) => state.codes.length > 0,

    /**
     * 检查是否有邀请历史数据
     */
    hasInvitationHistory: (state) => state.history.length > 0,

    /**
     * 获取邀请转化率
     */
    getConversionRate: (state) => {
      if (state.stats) {
        return state.stats.conversionRate
      }
      // 如果没有统计数据，根据历史数据计算
      const totalCodes = state.codes.reduce((sum, code) => sum + code.usageCount, 0)
      const completedInvites = state.history.filter(record => record.status === 'completed').length
      return totalCodes > 0 ? (completedInvites / totalCodes) * 100 : 0
    },

    /**
     * 获取当前用户允许邀请的目标角色列表
     * （需要与用户store联动）
     */
    allowedTargetRoles: () => {
      // 这里需要从用户store获取当前用户角色
      // 暂时返回空数组，实际应该在组件中通过用户角色计算
      return []
    }
  },

  actions: {
    /**
     * 设置加载状态
     */
    setLoading(loading: boolean) {
      this.loading = loading
    },

    /**
     * 设置错误信息
     */
    setError(error: string | null) {
      this.error = error
    },

    /**
     * 清除错误信息
     */
    clearError() {
      this.error = null
    },

    /**
     * 获取用户的邀请码列表
     */
    async fetchInvitationCodes(): Promise<InvitationCode[]> {
      this.setLoading(true)
      this.clearError()

      try {
        const codes = await invitationApi.getCodes()
        this.codes = codes
        return codes
      } catch (error: any) {
        const errorMessage = handleInvitationError(error)
        this.setError(errorMessage)
        console.error('[邀请Store] 获取邀请码失败:', error)
        throw new Error(errorMessage)
      } finally {
        this.setLoading(false)
      }
    },

    /**
     * 获取邀请历史记录
     */
    async fetchInvitationHistory(params?: HistoryQueryParams): Promise<PaginatedResponse<InvitationRecord>> {
      this.setLoading(true)
      this.clearError()

      try {
        const response = await invitationApi.getHistory(params)
        // 如果是第一页，替换历史记录；否则追加到现有记录
        if (!params?.page || params.page === 1) {
          this.history = response.list
        } else {
          this.history = [...this.history, ...response.list]
        }
        return response
      } catch (error: any) {
        const errorMessage = handleInvitationError(error)
        this.setError(errorMessage)
        console.error('[邀请Store] 获取邀请历史失败:', error)
        throw new Error(errorMessage)
      } finally {
        this.setLoading(false)
      }
    },

    /**
     * 获取邀请统计信息
     */
    async fetchInvitationStats(params?: StatsQueryParams): Promise<InvitationStats> {
      this.setLoading(true)
      this.clearError()

      try {
        const stats = await invitationApi.getStats(params)
        this.stats = stats
        return stats
      } catch (error: any) {
        const errorMessage = handleInvitationError(error)
        this.setError(errorMessage)
        console.error('[邀请Store] 获取邀请统计失败:', error)
        throw new Error(errorMessage)
      } finally {
        this.setLoading(false)
      }
    },

    /**
     * 验证邀请码
     */
    async validateInviteCode(code: string): Promise<ValidateCodeResponse> {
      this.setLoading(true)
      this.clearError()

      try {
        const result = await invitationApi.validateCode(code)
        return result
      } catch (error: any) {
        const errorMessage = handleInvitationError(error)
        this.setError(errorMessage)
        console.error('[邀请Store] 验证邀请码失败:', error)
        throw new Error(errorMessage)
      } finally {
        this.setLoading(false)
      }
    },

    /**
     * 生成新的邀请码
     */
    async generateInviteCode(targetRole: UserRole): Promise<InvitationCode> {
      this.setLoading(true)
      this.clearError()

      try {
        const newCode = await invitationApi.generateCode(targetRole)
        // 更新本地邀请码列表
        const existingIndex = this.codes.findIndex(code => 
          code.targetRole === targetRole && code.userId === newCode.userId
        )
        if (existingIndex >= 0) {
          this.codes[existingIndex] = newCode
        } else {
          this.codes.push(newCode)
        }
        return newCode
      } catch (error: any) {
        const errorMessage = handleInvitationError(error)
        this.setError(errorMessage)
        console.error('[邀请Store] 生成邀请码失败:', error)
        throw new Error(errorMessage)
      } finally {
        this.setLoading(false)
      }
    },

    /**
     * 重新激活邀请码
     */
    async reactivateCode(codeId: string): Promise<InvitationCode> {
      this.setLoading(true)
      this.clearError()

      try {
        const updatedCode = await invitationApi.reactivateCode(codeId)
        // 更新本地邀请码状态
        const index = this.codes.findIndex(code => code.id === codeId)
        if (index >= 0) {
          this.codes[index] = updatedCode
        }
        return updatedCode
      } catch (error: any) {
        const errorMessage = handleInvitationError(error)
        this.setError(errorMessage)
        console.error('[邀请Store] 重新激活邀请码失败:', error)
        throw new Error(errorMessage)
      } finally {
        this.setLoading(false)
      }
    },

    /**
     * 停用邀请码
     */
    async deactivateCode(codeId: string): Promise<InvitationCode> {
      this.setLoading(true)
      this.clearError()

      try {
        const updatedCode = await invitationApi.deactivateCode(codeId)
        // 更新本地邀请码状态
        const index = this.codes.findIndex(code => code.id === codeId)
        if (index >= 0) {
          this.codes[index] = updatedCode
        }
        return updatedCode
      } catch (error: any) {
        const errorMessage = handleInvitationError(error)
        this.setError(errorMessage)
        console.error('[邀请Store] 停用邀请码失败:', error)
        throw new Error(errorMessage)
      } finally {
        this.setLoading(false)
      }
    },

    /**
     * 导出邀请历史
     */
    async exportInvitationHistory(params?: any): Promise<Blob> {
      this.setLoading(true)
      this.clearError()

      try {
        const blob = await invitationApi.exportHistory(params)
        return blob
      } catch (error: any) {
        const errorMessage = handleInvitationError(error)
        this.setError(errorMessage)
        console.error('[邀请Store] 导出邀请历史失败:', error)
        throw new Error(errorMessage)
      } finally {
        this.setLoading(false)
      }
    },

    /**
     * 刷新所有邀请数据
     */
    async refreshAllData(): Promise<void> {
      const promises = [
        this.fetchInvitationCodes(),
        this.fetchInvitationHistory({ page: 1, pageSize: 20 }),
        this.fetchInvitationStats()
      ]

      try {
        await Promise.all(promises)
      } catch (error) {
        console.error('[邀请Store] 刷新邀请数据失败:', error)
        // 单个API失败不影响整体刷新
      }
    },

    /**
     * 清空所有邀请数据
     */
    clearAllData() {
      this.codes = []
      this.history = []
      this.stats = null
      this.error = null
      this.loading = false
    },

    /**
     * 添加新的邀请记录到历史（用于实时更新）
     */
    addInvitationRecord(record: InvitationRecord) {
      this.history.unshift(record)
      // 更新对应邀请码的使用次数
      const codeIndex = this.codes.findIndex(code => code.code === record.inviteCode)
      if (codeIndex >= 0) {
        this.codes[codeIndex].usageCount += 1
      }
    },

    /**
     * 更新邀请记录状态
     */
    updateInvitationRecord(recordId: string, updates: Partial<InvitationRecord>) {
      const index = this.history.findIndex(record => record.id === recordId)
      if (index >= 0) {
        this.history[index] = { ...this.history[index], ...updates }
      }
    }
  },

  // 持久化配置（可选）
  persist: {
    key: 'invitation-store',
    storage: localStorage,
    // 只持久化非敏感数据，loading和error不需要持久化
    paths: ['codes', 'stats'],
    // 设置过期时间（15分钟）
    beforeRestore: (ctx) => {
      const stored = localStorage.getItem('invitation-store')
      if (stored) {
        try {
          const data = JSON.parse(stored)
          const now = Date.now()
          const storeTime = data._timestamp || 0
          // 如果数据超过15分钟，清除缓存
          if (now - storeTime > 15 * 60 * 1000) {
            localStorage.removeItem('invitation-store')
            return false
          }
        } catch {
          localStorage.removeItem('invitation-store')
          return false
        }
      }
      return true
    },
    afterRestore: (ctx) => {
      // 恢复后添加时间戳
      const data = ctx.store.$state
      localStorage.setItem('invitation-store', JSON.stringify({
        ...data,
        _timestamp: Date.now()
      }))
    }
  }
})

/**
 * 角色邀请权限配置
 * 定义每个角色的邀请权限和限制
 */
export const ROLE_INVITE_PERMISSIONS: RoleInvitePermission = {
  super_admin: {
    canInvite: true,
    allowedTargetRoles: ['director', 'leader', 'sales', 'agent'],
    maxCodes: 4
  },
  director: {
    canInvite: true,
    allowedTargetRoles: ['leader', 'sales', 'agent'],
    maxCodes: 3
  },
  leader: {
    canInvite: true,
    allowedTargetRoles: ['sales', 'agent'],
    maxCodes: 2
  },
  sales: {
    canInvite: true,
    allowedTargetRoles: ['agent'],
    maxCodes: 1
  },
  agent: {
    canInvite: false,
    allowedTargetRoles: [],
    maxCodes: 0
  }
}

/**
 * 检查用户是否有邀请权限
 * @param userRole - 用户角色
 */
export const canUserInvite = (userRole: UserRole): boolean => {
  return ROLE_INVITE_PERMISSIONS[userRole]?.canInvite || false
}

/**
 * 获取用户可以邀请的角色列表
 * @param userRole - 用户角色
 */
export const getAllowedTargetRoles = (userRole: UserRole): UserRole[] => {
  return ROLE_INVITE_PERMISSIONS[userRole]?.allowedTargetRoles || []
}

/**
 * 获取用户的最大邀请码数量
 * @param userRole - 用户角色
 */
export const getMaxInviteCodes = (userRole: UserRole): number => {
  return ROLE_INVITE_PERMISSIONS[userRole]?.maxCodes || 0
}