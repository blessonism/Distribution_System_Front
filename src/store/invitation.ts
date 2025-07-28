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
 * @fileoverview 邀请系统状态管理Store
 * 基于Pinia的邀请系统状态存储，提供完整的邀请码管理、邀请历史追踪和统计分析功能
 * 包含邀请码生成与管理、邀请记录追踪、权限控制、统计数据分析和持久化缓存等核心功能
 * 集成角色权限配置、邀请转化率计算、历史记录管理和错误处理机制，为邀请系统提供统一的数据层
 * 
 * @module store/invitation
 * @author Frontend Team
 * @since 1.0.0
 */

/**
 * 邀请系统 Pinia Store
 * 管理邀请系统的完整生命周期，支持邀请码CRUD、历史记录、统计分析和权限控制
 * 
 * @store useInvitationStore
 * @example
 * ```typescript
 * import { useInvitationStore } from '@/store/invitation'
 * 
 * const invitationStore = useInvitationStore()
 * 
 * // 获取邀请码列表
 * await invitationStore.fetchInvitationCodes()
 * 
 * // 生成新邀请码
 * const newCode = await invitationStore.generateInviteCode('agent')
 * 
 * // 获取邀请统计
 * await invitationStore.fetchInvitationStats()
 * ```
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
     * 提供组件访问邀请码数据的响应式getter
     * 
     * @complexity O(1) - 直接返回状态中的数组引用
     * @returns {InvitationCode[]} 邀请码数组
     */
    invitationCodes: (state) => state.codes,

    /**
     * 获取邀请历史列表（用于组件访问）
     * 提供组件访问邀请历史数据的响应式getter
     * 
     * @complexity O(1) - 直接返回状态中的数组引用
     * @returns {InvitationRecord[]} 邀请历史记录数组
     */
    invitationHistory: (state) => state.history,

    /**
     * 获取邀请统计信息（用于组件访问）
     * 提供组件访问邀请统计数据的响应式getter
     * 
     * @complexity O(1) - 直接返回状态中的对象引用
     * @returns {InvitationStats | null} 邀请统计对象或null
     */
    invitationStats: (state) => state.stats,

    /**
     * 根据角色获取邀请码
     * 筛选出指定目标角色的邀请码列表
     * 
     * @complexity O(n) - n为邀请码总数，需要遍历筛选
     * @flow 邀请码列表遍历 → 目标角色匹配 → 结果收集
     * 
     * @param {UserRole} role - 目标用户角色
     * @returns {InvitationCode[]} 符合角色条件的邀请码数组
     * 
     * @example
     * ```typescript
     * const agentCodes = invitationStore.getCodesByRole('agent')
     * console.log(`代理邀请码数量: ${agentCodes.length}`)
     * ```
     */
    getCodesByRole: (state) => (role: UserRole) => {
      return state.codes.filter(code => code.targetRole === role)
    },

    /**
     * 获取可用的邀请码（状态为active）
     * 筛选出当前激活状态的所有邀请码
     * 
     * @complexity O(n) - n为邀请码总数，需要遍历筛选
     * @flow 邀请码列表遍历 → 活跃状态检查 → 结果收集
     * 
     * @returns {InvitationCode[]} 激活状态的邀请码数组
     * 
     * @example
     * ```typescript
     * const activeCodes = invitationStore.getActiveCodes
     * console.log(`当前有 ${activeCodes.length} 个可用邀请码`)
     * ```
     */
    getActiveCodes: (state) => {
      return state.codes.filter(code => code.status === 'active')
    },

    /**
     * 获取不可用的邀请码（状态为inactive）
     * 筛选出当前非激活状态的所有邀请码
     * 
     * @complexity O(n) - n为邀请码总数，需要遍历筛选
     * @flow 邀请码列表遍历 → 非活跃状态检查 → 结果收集
     * 
     * @returns {InvitationCode[]} 非激活状态的邀请码数组
     * 
     * @example
     * ```typescript
     * const inactiveCodes = invitationStore.getInactiveCodes
     * console.log(`有 ${inactiveCodes.length} 个邀请码已停用`)
     * ```
     */
    getInactiveCodes: (state) => {
      return state.codes.filter(code => code.status === 'inactive')
    },

    /**
     * 计算总邀请人数
     * 统计历史记录中的总邀请人数
     * 
     * @complexity O(1) - 直接返回数组长度
     * @flow 历史记录数组长度获取
     * 
     * @returns {number} 总邀请人数
     * 
     * @example
     * ```typescript
     * const totalInvitees = invitationStore.getTotalInvitees
     * console.log(`总共邀请了 ${totalInvitees} 人`)
     * ```
     */
    getTotalInvitees: (state) => {
      return state.history.length
    },

    /**
     * 获取本月邀请人数
     * 统计当前月份的邀请人数
     * 
     * @complexity O(n) - n为历史记录总数，需要遍历筛选
     * @flow 当前月份计算 → 历史记录遍历 → 月份匹配 → 计数统计
     * 
     * @returns {number} 本月邀请人数
     * 
     * @example
     * ```typescript
     * const monthlyCount = invitationStore.getMonthlyInvitees
     * console.log(`本月邀请了 ${monthlyCount} 人`)
     * ```
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
     * 统计各个角色的邀请人数分布
     * 
     * @complexity O(n) - n为历史记录总数，需要遍历统计
     * @flow 角色计数对象初始化 → 历史记录遍历 → 角色分类计数 → 统计结果返回
     * 
     * @returns {Partial<Record<UserRole, number>>} 角色邀请人数统计对象
     * 
     * @example
     * ```typescript
     * const roleStats = invitationStore.getInviteesByRole
     * Object.entries(roleStats).forEach(([role, count]) => {
     *   console.log(`${role}: ${count} 人`)
     * })
     * ```
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
     * 按注册时间倒序获取最近的邀请记录
     * 
     * @complexity O(n log n) - n为历史记录总数，需要排序操作
     * @flow 历史记录复制 → 时间倒序排序 → 数量限制截取 → 结果返回
     * 
     * @param {number} limit - 返回记录数量限制，默认5条
     * @returns {InvitationRecord[]} 最近的邀请记录数组
     * 
     * @example
     * ```typescript
     * const recentInvites = invitationStore.getRecentInvites(10)
     * recentInvites.forEach(record => {
     *   console.log(`${record.inviteeName} 于 ${record.registeredAt} 注册`)
     * })
     * ```
     */
    getRecentInvites: (state) => (limit: number = 5) => {
      return [...state.history]
        .sort((a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime())
        .slice(0, limit)
    },

    /**
     * 检查是否有正在加载的操作
     * 返回当前的加载状态
     * 
     * @complexity O(1) - 直接返回状态值
     * @returns {boolean} 正在加载返回true，否则返回false
     */
    isLoading: (state) => state.loading,

    /**
     * 获取最后的错误信息
     * 返回最近发生的错误信息
     * 
     * @complexity O(1) - 直接返回状态值
     * @returns {string | null} 错误信息字符串或null
     */
    getError: (state) => state.error,

    /**
     * 检查是否有邀请码数据
     * 判断当前是否已加载邀请码数据
     * 
     * @complexity O(1) - 直接检查数组长度
     * @returns {boolean} 有数据返回true，否则返回false
     */
    hasInvitationCodes: (state) => state.codes.length > 0,

    /**
     * 检查是否有邀请历史数据
     * 判断当前是否已加载邀请历史数据
     * 
     * @complexity O(1) - 直接检查数组长度
     * @returns {boolean} 有数据返回true，否则返回false
     */
    hasInvitationHistory: (state) => state.history.length > 0,

    /**
     * 获取邀请转化率
     * 计算邀请码使用到完成注册的转化率
     * 优先使用统计数据中的转化率，否则根据历史数据计算
     * 
     * @complexity O(n) - n为邀请码数量，需要计算使用总数
     * @flow 统计数据检查 → 备用计算逻辑 → 转化率计算 → 结果返回
     * 
     * @returns {number} 转化率百分比（0-100）
     * 
     * @example
     * ```typescript
     * const rate = invitationStore.getConversionRate
     * console.log(`邀请转化率: ${rate.toFixed(2)}%`)
     * ```
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
     * 根据当前用户角色返回可邀请的目标角色
     * （需要与用户store联动）
     * 
     * @complexity O(1) - 当前实现返回空数组，实际应该基于用户角色计算
     * @flow 用户角色获取 → 权限规则查询 → 目标角色列表返回
     * 
     * @returns {UserRole[]} 允许邀请的目标角色数组
     * 
     * @example
     * ```typescript
     * const allowedRoles = invitationStore.allowedTargetRoles
     * allowedRoles.forEach(role => {
     *   console.log(`可以邀请: ${role}`)
     * })
     * ```
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
     * 更新全局加载状态标志
     * 
     * @complexity O(1) - 简单状态赋值
     * @flow 加载状态参数验证 → 状态更新
     * 
     * @param {boolean} loading - 加载状态
     * 
     * @example
     * ```typescript
     * invitationStore.setLoading(true)
     * ```
     */
    setLoading(loading: boolean) {
      this.loading = loading
    },

    /**
     * 设置错误信息
     * 更新当前的错误状态信息
     * 
     * @complexity O(1) - 简单状态赋值
     * @flow 错误信息参数验证 → 状态更新
     * 
     * @param {string | null} error - 错误信息或null
     * 
     * @example
     * ```typescript
     * invitationStore.setError('邀请码生成失败')
     * ```
     */
    setError(error: string | null) {
      this.error = error
    },

    /**
     * 清除错误信息
     * 将错误状态重置为null
     * 
     * @complexity O(1) - 简单状态重置
     * @flow 错误状态清空
     * 
     * @example
     * ```typescript
     * invitationStore.clearError()
     * ```
     */
    clearError() {
      this.error = null
    },

    /**
     * 获取用户的邀请码列表
     * 从服务器获取当前用户的所有邀请码
     * 
     * @complexity O(1) - API调用为常数时间复杂度
     * @flow 加载状态设置 → 错误清除 → API调用 → 邀请码列表更新 → 错误处理 → 加载状态重置
     * 
     * @returns {Promise<InvitationCode[]>} 邀请码列表
     * @throws {Error} 当API调用失败时抛出错误
     * 
     * @example
     * ```typescript
     * try {
     *   const codes = await invitationStore.fetchInvitationCodes()
     *   console.log(`获取到 ${codes.length} 个邀请码`)
     * } catch (error) {
     *   console.error('获取邀请码失败:', error.message)
     * }
     * ```
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
     * 获取分页的邀请历史记录列表
     * 
     * @complexity O(1) - API调用为常数时间复杂度
     * @flow 加载状态设置 → 错误清除 → API调用 → 历史记录更新 → 分页处理 → 错误处理 → 加载状态重置
     * 
     * @param {HistoryQueryParams} params - 查询参数（可选）
     * @returns {Promise<PaginatedResponse<InvitationRecord>>} 分页的邀请历史记录
     * @throws {Error} 当API调用失败时抛出错误
     * 
     * @example
     * ```typescript
     * const response = await invitationStore.fetchInvitationHistory({
     *   page: 1,
     *   pageSize: 20,
     *   status: 'completed'
     * })
     * console.log(`第${response.page}页，共${response.total}条记录`)
     * ```
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
     * 获取邀请系统的统计数据
     * 
     * @complexity O(1) - API调用为常数时间复杂度
     * @flow 加载状态设置 → 错误清除 → API调用 → 统计数据更新 → 错误处理 → 加载状态重置
     * 
     * @param {StatsQueryParams} params - 统计查询参数（可选）
     * @returns {Promise<InvitationStats>} 邀请统计对象
     * @throws {Error} 当API调用失败时抛出错误
     * 
     * @example
     * ```typescript
     * const stats = await invitationStore.fetchInvitationStats({
     *   dateRange: 'thisMonth'
     * })
     * console.log(`转化率: ${stats.conversionRate}%`)
     * ```
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
     * 验证邀请码的有效性和可用性
     * 
     * @complexity O(1) - API调用为常数时间复杂度
     * @flow 加载状态设置 → 错误清除 → API调用 → 验证结果返回 → 错误处理 → 加载状态重置
     * 
     * @param {string} code - 要验证的邀请码
     * @returns {Promise<ValidateCodeResponse>} 验证结果对象
     * @throws {Error} 当验证失败时抛出错误
     * 
     * @example
     * ```typescript
     * try {
     *   const result = await invitationStore.validateInviteCode('INVITE123')
     *   if (result.valid) {
     *     console.log(`邀请码有效，目标角色: ${result.targetRole}`)
     *   }
     * } catch (error) {
     *   console.error('邀请码验证失败:', error.message)
     * }
     * ```
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
     * 为指定目标角色生成新的邀请码
     * 
     * @complexity O(n) - n为现有邀请码数量，需要查找是否存在相同角色的邀请码
     * @flow 加载状态设置 → 错误清除 → API调用 → 本地邀请码列表更新 → 错误处理 → 加载状态重置
     * 
     * @param {UserRole} targetRole - 目标用户角色
     * @returns {Promise<InvitationCode>} 新生成的邀请码对象
     * @throws {Error} 当生成失败时抛出错误
     * 
     * @example
     * ```typescript
     * try {
     *   const newCode = await invitationStore.generateInviteCode('agent')
     *   console.log(`生成邀请码: ${newCode.code}`)
     * } catch (error) {
     *   console.error('生成邀请码失败:', error.message)
     * }
     * ```
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
     * 重新激活已停用的邀请码
     * 
     * @complexity O(n) - n为邀请码数量，需要查找目标邀请码
     * @flow 加载状态设置 → 错误清除 → API调用 → 本地邀请码状态更新 → 错误处理 → 加载状态重置
     * 
     * @param {string} codeId - 邀请码ID
     * @returns {Promise<InvitationCode>} 更新后的邀请码对象
     * @throws {Error} 当激活失败时抛出错误
     * 
     * @example
     * ```typescript
     * try {
     *   const reactivatedCode = await invitationStore.reactivateCode('code123')
     *   console.log(`邀请码已重新激活: ${reactivatedCode.status}`)
     * } catch (error) {
     *   console.error('重新激活失败:', error.message)
     * }
     * ```
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
     * 停用指定的邀请码
     * 
     * @complexity O(n) - n为邀请码数量，需要查找目标邀请码
     * @flow 加载状态设置 → 错误清除 → API调用 → 本地邀请码状态更新 → 错误处理 → 加载状态重置
     * 
     * @param {string} codeId - 邀请码ID
     * @returns {Promise<InvitationCode>} 更新后的邀请码对象
     * @throws {Error} 当停用失败时抛出错误
     * 
     * @example
     * ```typescript
     * try {
     *   const deactivatedCode = await invitationStore.deactivateCode('code123')
     *   console.log(`邀请码已停用: ${deactivatedCode.status}`)
     * } catch (error) {
     *   console.error('停用邀请码失败:', error.message)
     * }
     * ```
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
     * 导出邀请历史数据为文件格式
     * 
     * @complexity O(1) - API调用为常数时间复杂度
     * @flow 加载状态设置 → 错误清除 → API调用 → 文件数据返回 → 错误处理 → 加载状态重置
     * 
     * @param {any} params - 导出参数（可选）
     * @returns {Promise<Blob>} 导出的文件数据
     * @throws {Error} 当导出失败时抛出错误
     * 
     * @example
     * ```typescript
     * try {
     *   const blob = await invitationStore.exportInvitationHistory({
     *     format: 'excel',
     *     dateRange: 'thisMonth'
     *   })
     *   // 处理下载逻辑
     * } catch (error) {
     *   console.error('导出失败:', error.message)
     * }
     * ```
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
     * 并行刷新邀请码、历史记录和统计数据
     * 
     * @complexity O(1) - 三个并行API调用
     * @flow 三个API并行调用 → 错误处理（不影响整体刷新）
     * 
     * @returns {Promise<void>} 异步操作完成
     * 
     * @example
     * ```typescript
     * await invitationStore.refreshAllData()
     * console.log('所有邀请数据已刷新')
     * ```
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
     * 重置所有状态到初始值
     * 
     * @complexity O(1) - 简单状态重置操作
     * @flow 邀请码清空 → 历史记录清空 → 统计数据清空 → 错误和加载状态重置
     * 
     * @example
     * ```typescript
     * invitationStore.clearAllData()
     * console.log('所有邀请数据已清空')
     * ```
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
     * 将新的邀请记录添加到历史列表开头，并更新对应邀请码的使用次数
     * 
     * @complexity O(n) - n为邀请码数量，需要查找对应的邀请码
     * @flow 记录添加到历史开头 → 邀请码查找 → 使用次数更新
     * 
     * @param {InvitationRecord} record - 新的邀请记录
     * 
     * @example
     * ```typescript
     * invitationStore.addInvitationRecord({
     *   id: 'record123',
     *   inviteCode: 'INVITE123',
     *   inviteeName: '张三',
     *   actualRole: 'agent',
     *   status: 'completed'
     * })
     * ```
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
     * 更新指定邀请记录的部分字段
     * 
     * @complexity O(n) - n为历史记录数量，需要查找目标记录
     * @flow 记录查找 → 字段合并更新
     * 
     * @param {string} recordId - 邀请记录ID
     * @param {Partial<InvitationRecord>} updates - 要更新的字段
     * 
     * @example
     * ```typescript
     * invitationStore.updateInvitationRecord('record123', {
     *   status: 'completed',
     *   registeredAt: new Date().toISOString()
     * })
     * ```
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
 * 定义每个角色的邀请权限和限制，包含邀请能力、目标角色和最大邀请码数量
 * 
 * @constant ROLE_INVITE_PERMISSIONS
 * @type {RoleInvitePermission}
 * 
 * @example
 * ```typescript
 * const permissions = ROLE_INVITE_PERMISSIONS['director']
 * console.log(`总监可以邀请: ${permissions.allowedTargetRoles.join(', ')}`)
 * console.log(`最多生成 ${permissions.maxCodes} 个邀请码`)
 * ```
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
 * 根据用户角色判断是否具备邀请其他用户的权限
 * 
 * @complexity O(1) - 常数时间复杂度，简单对象属性查找
 * @flow 角色权限查询 → 邀请能力检查 → 结果返回
 * 
 * @param {UserRole} userRole - 用户角色
 * @returns {boolean} 有邀请权限返回true，否则返回false
 * 
 * @example
 * ```typescript
 * if (canUserInvite('leader')) {
 *   console.log('组长可以邀请其他用户')
 * }
 * ```
 */
export const canUserInvite = (userRole: UserRole): boolean => {
  return ROLE_INVITE_PERMISSIONS[userRole]?.canInvite || false
}

/**
 * 获取用户可以邀请的角色列表
 * 根据用户角色返回允许邀请的目标角色数组
 * 
 * @complexity O(1) - 常数时间复杂度，简单对象属性查找
 * @flow 角色权限查询 → 目标角色列表获取 → 结果返回
 * 
 * @param {UserRole} userRole - 用户角色
 * @returns {UserRole[]} 允许邀请的角色数组
 * 
 * @example
 * ```typescript
 * const allowedRoles = getAllowedTargetRoles('sales')
 * console.log(`销售可以邀请: ${allowedRoles.join(', ')}`)
 * ```
 */
export const getAllowedTargetRoles = (userRole: UserRole): UserRole[] => {
  return ROLE_INVITE_PERMISSIONS[userRole]?.allowedTargetRoles || []
}

/**
 * 获取用户的最大邀请码数量
 * 根据用户角色返回允许生成的最大邀请码数量
 * 
 * @complexity O(1) - 常数时间复杂度，简单对象属性查找
 * @flow 角色权限查询 → 最大数量获取 → 结果返回
 * 
 * @param {UserRole} userRole - 用户角色
 * @returns {number} 最大邀请码数量
 * 
 * @example
 * ```typescript
 * const maxCodes = getMaxInviteCodes('director')
 * console.log(`总监最多可以生成 ${maxCodes} 个邀请码`)
 * ```
 */
export const getMaxInviteCodes = (userRole: UserRole): number => {
  return ROLE_INVITE_PERMISSIONS[userRole]?.maxCodes || 0
}