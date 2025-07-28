/**
 * @fileoverview 客资管理状态管理Store
 * 基于Pinia的客资管理系统状态存储，提供完整的客资生命周期管理功能
 * 包含客资列表管理、审核流程控制、高级筛选、分页控制、批量操作和性能优化等核心功能
 * 集成审核统计、状态缓存、错误处理和选择管理，为客资管理提供统一的数据层
 * 
 * @module store/lead
 * @author Frontend Team
 * @since 1.0.0
 */

import { defineStore } from 'pinia'
import type { 
  Lead, 
  LeadStatus, 
  LeadAuditStatus, 
  CreateLeadRequest, 
  UpdateLeadRequest,
  LeadListParams,
  LeadListResponse
} from '@/types/lead'
import type { 
  LeadAuditRecord, 
  AuditDecision, 
  AuditStatistics 
} from '@/types/leadAudit'
import { leadApi } from '@/api/lead'
import { leadAuditApi } from '@/api/leadAudit'

/**
 * 客资Store状态接口
 * 定义客资管理系统的完整状态结构，包含列表数据、分页信息、筛选条件和审核状态
 * 
 * @interface LeadState
 */
interface LeadState {
  // 客资列表
  leads: Lead[]
  total: number
  loading: boolean
  
  // 分页信息
  pagination: {
    page: number
    pageSize: number
  }
  
  // 筛选条件
  filters: {
    name?: string
    phone?: string
    status?: LeadStatus | 'all'
    auditStatus?: LeadAuditStatus | 'all'
    source?: string | 'all'
    salespersonId?: string | 'all'
    dateRange?: string
    keyword?: string
  }
  
  // 审核相关
  auditStatistics: AuditStatistics | null
  auditRecords: Record<string, LeadAuditRecord[]> // leadId -> records
  auditLoading: boolean
  
  // 选择状态
  selectedLeads: string[]
  
  // 缓存控制
  lastFetchTime: number
  cacheExpiry: number // 缓存过期时间（毫秒）
  
  // 错误状态
  error: string | null
}

/**
 * 客资管理Store
 * 提供完整的客资管理状态和操作方法，支持CRUD、审核、筛选、分页和批量操作
 * 
 * @store useLeadStore
 * @example
 * ```typescript
 * import { useLeadStore } from '@/store/lead'
 * 
 * const leadStore = useLeadStore()
 * 
 * // 获取客资列表
 * await leadStore.fetchLeads()
 * 
 * // 创建新客资
 * const newLead = await leadStore.createLead({
 *   name: '张三',
 *   phone: '13800138000',
 *   source: 'WeChat'
 * })
 * ```
 */
export const useLeadStore = defineStore('lead', {
  state: (): LeadState => ({
    // 客资列表
    leads: [],
    total: 0,
    loading: false,
    
    // 分页信息
    pagination: {
      page: 1,
      pageSize: 10
    },
    
    // 筛选条件
    filters: {
      status: 'all',
      auditStatus: 'all',
      source: 'all',
      salespersonId: 'all'
    },
    
    // 审核相关
    auditStatistics: null,
    auditRecords: {},
    auditLoading: false,
    
    // 选择状态
    selectedLeads: [],
    
    // 缓存控制
    lastFetchTime: 0,
    cacheExpiry: 5 * 60 * 1000, // 5分钟缓存
    
    // 错误状态
    error: null
  }),

  getters: {
    /**
     * 获取筛选后的客资列表
     * 根据当前筛选条件对客资列表进行过滤，支持状态、审核状态、来源和关键词筛选
     * 
     * @complexity O(n) - n为客资总数，需要遍历所有客资进行筛选
     * @flow 状态筛选 → 审核状态筛选 → 来源筛选 → 销售筛选 → 关键词搜索
     * 
     * @returns {Lead[]} 符合筛选条件的客资数组
     * 
     * @example
     * ```typescript
     * // 设置筛选条件
     * leadStore.setFilters({ status: 'ACTIVE', keyword: '张' })
     * 
     * // 获取筛选后的结果
     * const filtered = leadStore.filteredLeads
     * console.log(`筛选后有 ${filtered.length} 条客资`)
     * ```
     */
    filteredLeads: (state) => {
      return state.leads.filter(lead => {
        // 状态筛选
        if (state.filters.status && state.filters.status !== 'all') {
          if (lead.status !== state.filters.status) return false
        }
        
        // 审核状态筛选
        if (state.filters.auditStatus && state.filters.auditStatus !== 'all') {
          if (lead.auditStatus !== state.filters.auditStatus) return false
        }
        
        // 来源筛选
        if (state.filters.source && state.filters.source !== 'all') {
          if (lead.source !== state.filters.source) return false
        }
        
        // 销售人员筛选
        if (state.filters.salespersonId && state.filters.salespersonId !== 'all') {
          if (lead.salespersonId !== state.filters.salespersonId) return false
        }
        
        // 关键词搜索
        if (state.filters.keyword) {
          const keyword = state.filters.keyword.toLowerCase()
          return lead.name.toLowerCase().includes(keyword) ||
                 lead.phone.includes(keyword) ||
                 (lead.wechatId && lead.wechatId.toLowerCase().includes(keyword))
        }
        
        return true
      })
    },

    /**
     * 获取待审核客资数量
     * 统计当前列表中处于待审核状态的客资数量
     * 
     * @complexity O(n) - n为客资总数，需要遍历统计
     * @flow 客资列表遍历 → 审核状态检查 → 计数统计
     * 
     * @returns {number} 待审核客资的数量
     * 
     * @example
     * ```typescript
     * const pendingCount = leadStore.pendingAuditCount
     * if (pendingCount > 0) {
     *   console.log(`有 ${pendingCount} 条客资待审核`)
     * }
     * ```
     */
    pendingAuditCount: (state) => {
      return state.leads.filter(lead => lead.auditStatus === 'PENDING_AUDIT').length
    },

    /**
     * 获取已选择的客资对象
     * 根据选择的ID数组返回对应的完整客资对象
     * 
     * @complexity O(n*m) - n为客资总数，m为选中ID数量
     * @flow 选中ID遍历 → 客资列表匹配 → 对象收集
     * 
     * @returns {Lead[]} 已选择的客资对象数组
     * 
     * @example
     * ```typescript
     * // 选择多个客资
     * leadStore.addToSelection(['id1', 'id2', 'id3'])
     * 
     * // 获取选中的客资对象
     * const selected = leadStore.selectedLeadObjects
     * console.log(`已选择 ${selected.length} 条客资`)
     * ```
     */
    selectedLeadObjects: (state) => {
      return state.leads.filter(lead => state.selectedLeads.includes(lead.id))
    },

    /**
     * 检查缓存是否有效
     * 基于最后获取时间和缓存过期时间判断当前缓存是否仍然有效
     * 
     * @complexity O(1) - 常数时间复杂度，简单时间比较
     * @flow 当前时间获取 → 时间差计算 → 过期判断
     * 
     * @returns {boolean} 缓存有效返回true，否则返回false
     * 
     * @example
     * ```typescript
     * if (leadStore.isCacheValid) {
     *   console.log('使用缓存数据')
     * } else {
     *   console.log('缓存已过期，需要重新获取')
     *   await leadStore.fetchLeads({}, true)
     * }
     * ```
     */
    isCacheValid: (state) => {
      return Date.now() - state.lastFetchTime < state.cacheExpiry
    },

    /**
     * 获取分页信息
     * 返回当前分页状态的完整信息，包含页码、页大小、总数和总页数
     * 
     * @complexity O(1) - 常数时间复杂度，简单计算和对象构建
     * @flow 分页参数获取 → 总页数计算 → 信息对象构建
     * 
     * @returns {object} 分页信息对象
     * 
     * @example
     * ```typescript
     * const pageInfo = leadStore.paginationInfo
     * console.log(`第 ${pageInfo.page} 页，共 ${pageInfo.totalPages} 页`)
     * console.log(`每页 ${pageInfo.pageSize} 条，总计 ${pageInfo.total} 条`)
     * ```
     */
    paginationInfo: (state) => ({
      page: state.pagination.page,
      pageSize: state.pagination.pageSize,
      total: state.total,
      totalPages: Math.ceil(state.total / state.pagination.pageSize)
    })
  },

  actions: {
    /**
     * 获取客资列表
     * 从服务器获取客资列表数据，支持分页、筛选和缓存机制
     * 
     * @complexity O(1) - API调用为常数时间，实际取决于网络和服务器响应
     * @flow 缓存检查 → 参数构建 → API调用 → 数据更新 → 缓存时间记录
     * 
     * @param {Partial<LeadListParams>} params - 可选的查询参数
     * @param {boolean} forceRefresh - 是否强制刷新，忽略缓存
     * @returns {Promise<void>} 异步操作完成
     * 
     * @example
     * ```typescript
     * // 使用默认参数获取列表
     * await leadStore.fetchLeads()
     * 
     * // 带筛选条件获取
     * await leadStore.fetchLeads({
     *   status: 'ACTIVE',
     *   page: 1,
     *   pageSize: 20
     * })
     * 
     * // 强制刷新
     * await leadStore.fetchLeads({}, true)
     * ```
     */
    async fetchLeads(params?: Partial<LeadListParams>, forceRefresh = false) {
      // 检查缓存
      if (!forceRefresh && this.isCacheValid && this.leads.length > 0) {
        return
      }

      this.loading = true
      this.error = null

      try {
        const requestParams: LeadListParams = {
          page: this.pagination.page,
          pageSize: this.pagination.pageSize,
          ...this.filters,
          ...params
        }

        const response: LeadListResponse = await leadApi.getLeads(requestParams)
        
        this.leads = response.list
        this.total = response.total
        this.lastFetchTime = Date.now()
      } catch (error) {
        this.error = error instanceof Error ? error.message : '获取客资列表失败'
        console.error('[客资Store] 获取客资列表失败:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * 创建客资
     * 创建新的客资记录并添加到列表中
     * 
     * @complexity O(1) - API调用为常数时间
     * @flow 数据验证 → API调用 → 列表更新 → 总数增加
     * 
     * @param {CreateLeadRequest} leadData - 新客资的数据
     * @returns {Promise<Lead>} 创建成功的客资对象
     * 
     * @example
     * ```typescript
     * const newLead = await leadStore.createLead({
     *   name: '李四',
     *   phone: '13900139000',
     *   source: 'XIAOHONGSHU',
     *   wechatId: 'lisi_wx',
     *   note: '来自小红书的潜在客户'
     * })
     * console.log('客资创建成功:', newLead.id)
     * ```
     */
    async createLead(leadData: CreateLeadRequest) {
      try {
        const newLead = await leadApi.createLead(leadData)
        
        // 添加到列表开头
        this.leads.unshift(newLead)
        this.total += 1
        
        return newLead
      } catch (error) {
        console.error('[客资Store] 创建客资失败:', error)
        throw error
      }
    },

    /**
     * 更新客资
     * 更新指定客资的信息并同步到列表中
     * 
     * @complexity O(n) - n为客资列表长度，需要查找目标客资
     * @flow API调用 → 列表查找 → 数据更新
     * 
     * @param {string} leadId - 要更新的客资ID
     * @param {UpdateLeadRequest} leadData - 更新的数据
     * @returns {Promise<Lead>} 更新后的客资对象
     * 
     * @example
     * ```typescript
     * const updatedLead = await leadStore.updateLead('lead123', {
     *   status: 'CONVERTED',
     *   note: '已成功转化为客户'
     * })
     * console.log('客资更新成功:', updatedLead.status)
     * ```
     */
    async updateLead(leadId: string, leadData: UpdateLeadRequest) {
      try {
        const updatedLead = await leadApi.updateLead(leadId, leadData)
        
        // 更新列表中的客资
        const index = this.leads.findIndex(lead => lead.id === leadId)
        if (index !== -1) {
          this.leads[index] = updatedLead
        }
        
        return updatedLead
      } catch (error) {
        console.error('[客资Store] 更新客资失败:', error)
        throw error
      }
    },

    /**
     * 删除客资
     * 删除指定的客资记录并从列表中移除
     * 
     * @complexity O(n) - n为客资列表长度，需要查找并移除
     * @flow API调用 → 列表查找 → 数据移除 → 总数减少 → 选择清理
     * 
     * @param {string} leadId - 要删除的客资ID
     * @returns {Promise<void>} 异步操作完成
     * 
     * @example
     * ```typescript
     * await leadStore.deleteLead('lead123')
     * console.log('客资删除成功')
     * ```
     */
    async deleteLead(leadId: string) {
      try {
        await leadApi.deleteLead(leadId)
        
        // 从列表中移除
        const index = this.leads.findIndex(lead => lead.id === leadId)
        if (index !== -1) {
          this.leads.splice(index, 1)
          this.total -= 1
        }
        
        // 从选择列表中移除
        this.removeFromSelection(leadId)
      } catch (error) {
        console.error('[客资Store] 删除客资失败:', error)
        throw error
      }
    },

    /**
     * 批量删除客资
     * 同时删除多个客资记录并清空当前选择
     * 
     * @complexity O(n) - n为客资列表长度，需要过滤移除
     * @flow API调用 → 列表过滤 → 总数更新 → 选择清空
     * 
     * @param {string[]} leadIds - 要删除的客资ID数组
     * @returns {Promise<void>} 异步操作完成
     * 
     * @example
     * ```typescript
     * // 删除选中的客资
     * const selectedIds = leadStore.selectedLeads
     * await leadStore.batchDeleteLeads(selectedIds)
     * console.log(`成功删除 ${selectedIds.length} 条客资`)
     * ```
     */
    async batchDeleteLeads(leadIds: string[]) {
      try {
        await leadApi.batchDeleteLeads(leadIds)
        
        // 从列表中移除
        this.leads = this.leads.filter(lead => !leadIds.includes(lead.id))
        this.total -= leadIds.length
        
        // 清空选择
        this.clearSelection()
      } catch (error) {
        console.error('[客资Store] 批量删除客资失败:', error)
        throw error
      }
    },

    /**
     * 审核客资
     * 对指定客资进行审核决策（通过或拒绝）
     * 
     * @complexity O(n) - n为客资列表长度，需要查找目标客资
     * @flow 审核API调用 → 客资状态更新 → 审核时间记录 → 缓存清理
     * 
     * @param {string} leadId - 要审核的客资ID
     * @param {AuditDecision} decision - 审核决策（包含动作和备注）
     * @returns {Promise<any>} 审核结果
     * 
     * @example
     * ```typescript
     * await leadStore.auditLead('lead123', {
     *   action: 'APPROVE',
     *   remark: '客资信息完整，质量较高'
     * })
     * console.log('客资审核通过')
     * ```
     */
    async auditLead(leadId: string, decision: AuditDecision) {
      this.auditLoading = true
      
      try {
        const result = await leadAuditApi.auditLead(leadId, decision)
        
        // 更新客资状态
        const lead = this.leads.find(l => l.id === leadId)
        if (lead) {
          lead.auditStatus = decision.action === 'APPROVE' ? 'APPROVED' : 'REJECTED'
          lead.auditedAt = new Date().toISOString()
          lead.auditorId = result.auditorId
          lead.auditorName = result.auditorName
        }
        
        // 清除该客资的审核记录缓存
        delete this.auditRecords[leadId]
        
        return result
      } catch (error) {
        console.error('[客资Store] 审核客资失败:', error)
        throw error
      } finally {
        this.auditLoading = false
      }
    },

    /**
     * 批量审核客资
     * 对多个客资同时进行相同的审核决策
     * 
     * @complexity O(n) - n为要审核的客资数量
     * @flow API调用 → 状态批量更新 → 时间记录 → 缓存清理 → 选择清空
     * 
     * @param {string[]} leadIds - 要审核的客资ID数组
     * @param {AuditDecision} decision - 统一的审核决策
     * @returns {Promise<any>} 批量审核结果
     * 
     * @example
     * ```typescript
     * const selectedIds = leadStore.selectedLeads
     * await leadStore.batchAuditLeads(selectedIds, {
     *   action: 'APPROVE',
     *   remark: '批量审核通过'
     * })
     * console.log(`批量审核了 ${selectedIds.length} 条客资`)
     * ```
     */
    async batchAuditLeads(leadIds: string[], decision: AuditDecision) {
      this.auditLoading = true
      
      try {
        const result = await leadAuditApi.batchAuditLeads({
          leadIds,
          decision
        })
        
        // 更新客资状态
        const auditStatus = decision.action === 'APPROVE' ? 'APPROVED' : 'REJECTED'
        const auditedAt = new Date().toISOString()
        
        leadIds.forEach(leadId => {
          const lead = this.leads.find(l => l.id === leadId)
          if (lead) {
            lead.auditStatus = auditStatus
            lead.auditedAt = auditedAt
          }
          
          // 清除审核记录缓存
          delete this.auditRecords[leadId]
        })
        
        // 清空选择
        this.clearSelection()
        
        return result
      } catch (error) {
        console.error('[客资Store] 批量审核客资失败:', error)
        throw error
      } finally {
        this.auditLoading = false
      }
    },

    /**
     * 获取审核统计
     * 获取审核相关的统计数据，如待审核数量、通过率等
     * 
     * @complexity O(1) - API调用为常数时间
     * @flow API调用 → 统计数据更新
     * 
     * @returns {Promise<void>} 异步操作完成
     * 
     * @example
     * ```typescript
     * await leadStore.fetchAuditStatistics()
     * const stats = leadStore.auditStatistics
     * if (stats) {
     *   console.log(`待审核: ${stats.pendingCount}`)
     *   console.log(`通过率: ${stats.approvalRate}%`)
     * }
     * ```
     */
    async fetchAuditStatistics() {
      try {
        this.auditStatistics = await leadAuditApi.getAuditStatistics()
      } catch (error) {
        console.error('[客资Store] 获取审核统计失败:', error)
        throw error
      }
    },

    /**
     * 获取客资审核记录
     * 获取指定客资的历史审核记录，支持缓存机制
     * 
     * @complexity O(1) - API调用为常数时间，缓存查找为常数时间
     * @flow 缓存检查 → API调用 → 记录缓存 → 数据返回
     * 
     * @param {string} leadId - 客资ID
     * @param {boolean} forceRefresh - 是否强制刷新缓存
     * @returns {Promise<LeadAuditRecord[]>} 审核记录数组
     * 
     * @example
     * ```typescript
     * const records = await leadStore.fetchAuditRecords('lead123')
     * records.forEach(record => {
     *   console.log(`${record.auditorName} 在 ${record.auditedAt} ${record.action}`)
     * })
     * ```
     */
    async fetchAuditRecords(leadId: string, forceRefresh = false) {
      // 检查缓存
      if (!forceRefresh && this.auditRecords[leadId]) {
        return this.auditRecords[leadId]
      }

      try {
        const records = await leadAuditApi.getAuditRecords(leadId)
        this.auditRecords[leadId] = records
        return records
      } catch (error) {
        console.error('[客资Store] 获取审核记录失败:', error)
        throw error
      }
    },

    /**
     * 设置筛选条件
     * 更新筛选条件并重置到第一页
     * 
     * @complexity O(1) - 常数时间复杂度，对象合并
     * @flow 筛选条件合并 → 页码重置
     * 
     * @param {Partial<LeadState['filters']>} filters - 新的筛选条件
     * 
     * @example
     * ```typescript
     * // 设置状态和关键词筛选
     * leadStore.setFilters({
     *   status: 'ACTIVE',
     *   keyword: '张三',
     *   source: 'WECHAT'
     * })
     * 
     * // 清除特定筛选
     * leadStore.setFilters({ source: 'all' })
     * ```
     */
    setFilters(filters: Partial<LeadState['filters']>) {
      Object.assign(this.filters, filters)
      this.pagination.page = 1 // 重置到第一页
    },

    /**
     * 设置分页
     * 更新分页参数，如页码和页大小
     * 
     * @complexity O(1) - 常数时间复杂度，对象合并
     * @flow 分页参数合并
     * 
     * @param {Partial<LeadState['pagination']>} pagination - 新的分页参数
     * 
     * @example
     * ```typescript
     * // 跳转到第3页
     * leadStore.setPagination({ page: 3 })
     * 
     * // 修改页大小为20
     * leadStore.setPagination({ pageSize: 20 })
     * ```
     */
    setPagination(pagination: Partial<LeadState['pagination']>) {
      Object.assign(this.pagination, pagination)
    },

    /**
     * 添加到选择列表
     * 将客资ID添加到选择列表中，支持单个或批量添加
     * 
     * @complexity O(n) - n为要添加的ID数量
     * @flow 参数标准化 → ID遍历 → 重复检查 → 列表添加
     * 
     * @param {string | string[]} leadIds - 要添加的客资ID或ID数组
     * 
     * @example
     * ```typescript
     * // 添加单个客资
     * leadStore.addToSelection('lead123')
     * 
     * // 批量添加
     * leadStore.addToSelection(['lead123', 'lead456', 'lead789'])
     * ```
     */
    addToSelection(leadIds: string | string[]) {
      const ids = Array.isArray(leadIds) ? leadIds : [leadIds]
      ids.forEach(id => {
        if (!this.selectedLeads.includes(id)) {
          this.selectedLeads.push(id)
        }
      })
    },

    /**
     * 从选择列表中移除
     * 将客资ID从选择列表中移除，支持单个或批量移除
     * 
     * @complexity O(n*m) - n为要移除的ID数量，m为选择列表长度
     * @flow 参数标准化 → ID遍历 → 索引查找 → 列表移除
     * 
     * @param {string | string[]} leadIds - 要移除的客资ID或ID数组
     * 
     * @example
     * ```typescript
     * // 移除单个客资
     * leadStore.removeFromSelection('lead123')
     * 
     * // 批量移除
     * leadStore.removeFromSelection(['lead123', 'lead456'])
     * ```
     */
    removeFromSelection(leadIds: string | string[]) {
      const ids = Array.isArray(leadIds) ? leadIds : [leadIds]
      ids.forEach(id => {
        const index = this.selectedLeads.indexOf(id)
        if (index !== -1) {
          this.selectedLeads.splice(index, 1)
        }
      })
    },

    /**
     * 切换选择状态
     * 如果客资已选中则移除，未选中则添加
     * 
     * @complexity O(1) - 常数时间复杂度，单次查找和操作
     * @flow 选择状态检查 → 添加或移除操作
     * 
     * @param {string} leadId - 要切换的客资ID
     * 
     * @example
     * ```typescript
     * // 切换客资的选择状态
     * leadStore.toggleSelection('lead123')
     * ```
     */
    toggleSelection(leadId: string) {
      if (this.selectedLeads.includes(leadId)) {
        this.removeFromSelection(leadId)
      } else {
        this.addToSelection(leadId)
      }
    },

    /**
     * 全选/取消全选
     * 如果当前已全选则清空选择，否则选择所有客资
     * 
     * @complexity O(n) - n为客资列表长度
     * @flow 选择状态检查 → 全选或清空操作
     * 
     * @example
     * ```typescript
     * // 切换全选状态
     * leadStore.toggleSelectAll()
     * 
     * // 检查是否全选
     * const isAllSelected = leadStore.selectedLeads.length === leadStore.leads.length
     * ```
     */
    toggleSelectAll() {
      if (this.selectedLeads.length === this.leads.length) {
        this.clearSelection()
      } else {
        this.selectedLeads = this.leads.map(lead => lead.id)
      }
    },

    /**
     * 清空选择
     * 清空所有已选择的客资
     * 
     * @complexity O(1) - 常数时间复杂度，数组重置
     * @flow 选择列表清空
     * 
     * @example
     * ```typescript
     * leadStore.clearSelection()
     * console.log(leadStore.selectedLeads.length) // 0
     * ```
     */
    clearSelection() {
      this.selectedLeads = []
    },

    /**
     * 刷新数据
     * 强制刷新客资列表和审核统计数据
     * 
     * @complexity O(1) - 两个API调用的复杂度
     * @flow 并行刷新列表和统计数据
     * 
     * @returns {Promise<void>} 异步操作完成
     * 
     * @example
     * ```typescript
     * await leadStore.refresh()
     * console.log('数据刷新完成')
     * ```
     */
    async refresh() {
      await Promise.all([
        this.fetchLeads({}, true),
        this.fetchAuditStatistics()
      ])
    },

    /**
     * 重置状态
     * 将Store状态重置为初始值
     * 
     * @complexity O(1) - 常数时间复杂度，状态重置
     * @flow 各状态字段重置到初始值
     * 
     * @example
     * ```typescript
     * leadStore.reset()
     * console.log('Store状态已重置')
     * ```
     */
    reset() {
      this.leads = []
      this.total = 0
      this.pagination = { page: 1, pageSize: 10 }
      this.filters = {
        status: 'all',
        auditStatus: 'all',
        source: 'all',
        salespersonId: 'all'
      }
      this.selectedLeads = []
      this.auditRecords = {}
      this.auditStatistics = null
      this.error = null
      this.lastFetchTime = 0
    },

    /**
     * 清除错误状态
     * 清除当前的错误信息
     * 
     * @complexity O(1) - 常数时间复杂度，简单赋值
     * @flow 错误状态清空
     * 
     * @example
     * ```typescript
     * leadStore.clearError()
     * console.log(leadStore.error) // null
     * ```
     */
    clearError() {
      this.error = null
    }
  }
})
