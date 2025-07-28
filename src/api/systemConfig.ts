/**
 * @fileoverview 系统配置API接口模块
 * 提供完整的系统配置管理功能，包括配置的CRUD操作、审核流程、历史记录等
 * 支持等级规则、代理规则、返佣规则的统一管理
 * 
 * @module api/systemConfig
 * @requires @/utils/request
 * @requires @/types/systemConfig
 * @author Frontend Team
 * @since 1.0.0
 * @version 1.0.0
 */

import { http } from '@/utils/request'
import type { ApiListResponse } from '@/types/api'
import type {
  ConfigType,
  SystemConfig,
  LevelConfig,
  AgentConfig,
  CommissionConfig,
  BaseConfig,
  AuditDecision,
  CreateConfigRequest,
  UpdateConfigRequest,
  ConfigQueryParams
} from '@/types/systemConfig'

/**
 * 配置历史记录接口
 */
export interface ConfigHistory {
  /** 配置ID */
  id: string
  /** 配置类型 */
  type: ConfigType
  /** 版本号 */
  version: number
  /** 操作类型 */
  operation: 'create' | 'update' | 'audit' | 'activate' | 'archive'
  /** 操作人 */
  operator: string
  /** 操作时间 */
  operatedAt: string
  /** 操作描述 */
  description: string
  /** 配置快照 */
  snapshot?: SystemConfig
}

/**
 * 配置审核记录接口
 */
export interface ConfigAuditRecord {
  /** 审核ID */
  auditId: string
  /** 配置ID */
  configId: string
  /** 配置类型 */
  configType: ConfigType
  /** 审核状态 */
  status: 'pending' | 'approved' | 'rejected'
  /** 提交人 */
  submitter: string
  /** 提交时间 */
  submittedAt: string
  /** 审核人 */
  auditor?: string
  /** 审核时间 */
  auditedAt?: string
  /** 审核意见 */
  comment?: string
  /** 配置数据 */
  configData: SystemConfig
}

/**
 * 数据同步结果接口
 */
export interface DataSyncResult {
  /** 同步类型 */
  syncType: 'user_levels' | 'agent_tiers' | 'commissions'
  /** 影响的记录数 */
  affectedCount: number
  /** 成功处理数 */
  successCount: number
  /** 失败处理数 */
  failureCount: number
  /** 同步开始时间 */
  startTime: string
  /** 同步结束时间 */
  endTime: string
  /** 错误信息 */
  errors: string[]
}

/**
 * 系统配置API接口模块
 * 提供完整的配置管理功能，包括配置的增删改查、审核流程、数据同步等
 * 
 * @namespace systemConfigApi
 * 
 * @example
 * ```typescript
 * // 获取当前生效的等级配置
 * const levelConfig = await systemConfigApi.getCurrentConfig('level')
 * 
 * // 保存配置草稿
 * await systemConfigApi.saveDraft({
 *   type: 'level',
 *   rules: [...]
 * })
 * 
 * // 提交审核
 * const auditId = await systemConfigApi.submitForAudit('config_001')
 * ```
 */
export const systemConfigApi = {
  /**
   * 获取当前生效的配置
   * 获取指定类型的当前生效配置，用于页面初始化和数据展示
   * 
   * @param {ConfigType} type - 配置类型
   * @returns {Promise<SystemConfig>} 当前生效的配置
   * @throws {Error} 获取失败时抛出错误
   * @complexity O(1) - 单次HTTP请求
   * @flow 发送请求 -> 服务器查询 -> 返回配置数据
   * 
   * @example
   * ```typescript
   * const levelConfig = await systemConfigApi.getCurrentConfig('level')
   * console.log('当前等级配置:', levelConfig.rules)
   * ```
   */
  getCurrentConfig: async (type: ConfigType): Promise<SystemConfig> => {
    try {
      const response = await http.get<SystemConfig>(`/system-config/current/${type}`)
      return response
    } catch (error) {
      console.error(`[系统配置API] 获取${type}配置失败:`, error)
      throw error
    }
  },

  /**
   * 获取待审核的配置
   * 获取指定类型的待审核配置，用于审核页面展示
   * 
   * @param {ConfigType} type - 配置类型
   * @returns {Promise<SystemConfig | null>} 待审核的配置，如果没有则返回null
   * @throws {Error} 获取失败时抛出错误
   * @complexity O(1) - 单次HTTP请求
   * 
   * @example
   * ```typescript
   * const pendingConfig = await systemConfigApi.getPendingConfig('level')
   * if (pendingConfig) {
   *   console.log('待审核配置:', pendingConfig)
   * }
   * ```
   */
  getPendingConfig: async (type: ConfigType): Promise<SystemConfig | null> => {
    try {
      const response = await http.get<SystemConfig | null>(`/system-config/pending/${type}`)
      return response
    } catch (error) {
      console.error(`[系统配置API] 获取${type}待审核配置失败:`, error)
      throw error
    }
  },

  /**
   * 保存配置草稿
   * 保存配置为草稿状态，不会立即生效，需要后续提交审核
   * 
   * @param {CreateConfigRequest} configData - 配置数据
   * @returns {Promise<string>} 返回配置ID
   * @throws {Error} 保存失败时抛出错误
   * @complexity O(1) - 单次HTTP请求
   * @flow 验证数据 -> 保存草稿 -> 返回配置ID
   * 
   * @example
   * ```typescript
   * const configId = await systemConfigApi.saveDraft({
   *   type: 'level',
   *   rules: [
   *     { level: 'V1', name: 'V1伙伴', minPerformance: 0, maxPerformance: 10000, commissionRate: 0.05 }
   *   ]
   * })
   * console.log('草稿已保存，配置ID:', configId)
   * ```
   */
  saveDraft: async (configData: CreateConfigRequest): Promise<string> => {
    try {
      const response = await http.post<{ id: string }>('/system-config/draft', configData)
      return response.id
    } catch (error) {
      console.error('[系统配置API] 保存草稿失败:', error)
      throw error
    }
  },

  /**
   * 更新配置草稿
   * 更新已存在的配置草稿
   * 
   * @param {UpdateConfigRequest} configData - 更新的配置数据
   * @returns {Promise<void>} 更新成功
   * @throws {Error} 更新失败时抛出错误
   * 
   * @example
   * ```typescript
   * await systemConfigApi.updateDraft({
   *   id: 'config_001',
   *   rules: [...]
   * })
   * ```
   */
  updateDraft: async (configData: UpdateConfigRequest): Promise<void> => {
    try {
      await http.put(`/system-config/draft/${configData.id}`, {
        rules: configData.rules
      })
    } catch (error) {
      console.error('[系统配置API] 更新草稿失败:', error)
      throw error
    }
  },

  /**
   * 提交配置审核
   * 将草稿配置提交审核，提交后配置状态变为pending
   * 
   * @param {string} configId - 配置ID
   * @returns {Promise<string>} 返回审核ID
   * @throws {Error} 提交失败时抛出错误
   * @complexity O(1) - 单次HTTP请求
   * @flow 验证配置 -> 创建审核记录 -> 更新配置状态 -> 返回审核ID
   * 
   * @example
   * ```typescript
   * const auditId = await systemConfigApi.submitForAudit('config_001')
   * console.log('已提交审核，审核ID:', auditId)
   * ```
   */
  submitForAudit: async (configId: string): Promise<string> => {
    try {
      const response = await http.post<{ auditId: string }>(`/system-config/${configId}/submit-audit`)
      return response.auditId
    } catch (error) {
      console.error('[系统配置API] 提交审核失败:', error)
      throw error
    }
  },

  /**
   * 审核配置
   * 对待审核的配置进行审核，可以通过或拒绝
   * 
   * @param {string} auditId - 审核ID
   * @param {AuditDecision} decision - 审核决策
   * @returns {Promise<void>} 审核完成
   * @throws {Error} 审核失败时抛出错误
   * @complexity O(1) - 单次HTTP请求
   * @flow 验证权限 -> 执行审核 -> 更新配置状态 -> 触发数据同步
   * 
   * @example
   * ```typescript
   * await systemConfigApi.auditConfig('audit_001', {
   *   action: 'approve',
   *   comment: '配置合理，审核通过',
   *   auditorId: 'admin_001'
   * })
   * ```
   */
  auditConfig: async (auditId: string, decision: AuditDecision): Promise<void> => {
    try {
      await http.put(`/system-config/audit/${auditId}`, decision)
    } catch (error) {
      console.error('[系统配置API] 审核配置失败:', error)
      throw error
    }
  },

  /**
   * 获取配置历史记录
   * 获取指定类型配置的历史变更记录
   * 
   * @param {ConfigType} type - 配置类型
   * @param {ConfigQueryParams} params - 查询参数
   * @returns {Promise<ApiListResponse<ConfigHistory>>} 历史记录列表
   * @throws {Error} 获取失败时抛出错误
   * 
   * @example
   * ```typescript
   * const history = await systemConfigApi.getConfigHistory('level', {
   *   page: 1,
   *   pageSize: 10
   * })
   * console.log('配置历史:', history.data)
   * ```
   */
  getConfigHistory: async (
    type: ConfigType, 
    params?: ConfigQueryParams
  ): Promise<ApiListResponse<ConfigHistory>> => {
    try {
      const response = await http.get<ApiListResponse<ConfigHistory>>(
        `/system-config/history/${type}`,
        { params }
      )
      return response
    } catch (error) {
      console.error(`[系统配置API] 获取${type}配置历史失败:`, error)
      throw error
    }
  },

  /**
   * 获取审核记录列表
   * 获取配置审核记录，支持按状态筛选
   *
   * @param {ConfigQueryParams} params - 查询参数
   * @returns {Promise<ApiListResponse<ConfigAuditRecord>>} 审核记录列表
   * @throws {Error} 获取失败时抛出错误
   *
   * @example
   * ```typescript
   * const auditRecords = await systemConfigApi.getAuditRecords({
   *   status: 'pending',
   *   page: 1,
   *   pageSize: 10
   * })
   * ```
   */
  getAuditRecords: async (
    params?: ConfigQueryParams
  ): Promise<ApiListResponse<ConfigAuditRecord>> => {
    try {
      const response = await http.get<ApiListResponse<ConfigAuditRecord>>(
        '/system-config/audit-records',
        { params }
      )
      return response
    } catch (error) {
      console.error('[系统配置API] 获取审核记录失败:', error)
      throw error
    }
  },

  /**
   * 触发数据同步
   * 当配置变更后，触发相关数据的重新计算和同步
   *
   * @param {ConfigType} type - 配置类型
   * @param {string} configId - 配置ID
   * @returns {Promise<DataSyncResult>} 同步结果
   * @throws {Error} 同步失败时抛出错误
   * @complexity O(n) - n为需要同步的数据量
   * @flow 验证配置 -> 启动同步任务 -> 处理数据 -> 返回结果
   *
   * @example
   * ```typescript
   * const syncResult = await systemConfigApi.triggerDataSync('level', 'config_001')
   * console.log('同步完成:', syncResult.successCount, '成功,', syncResult.failureCount, '失败')
   * ```
   */
  triggerDataSync: async (type: ConfigType, configId: string): Promise<DataSyncResult> => {
    try {
      const response = await http.post<DataSyncResult>(`/system-config/${configId}/sync`, {
        type
      })
      return response
    } catch (error) {
      console.error(`[系统配置API] 触发${type}数据同步失败:`, error)
      throw error
    }
  },

  /**
   * 获取数据同步状态
   * 查询数据同步任务的执行状态
   *
   * @param {string} syncId - 同步任务ID
   * @returns {Promise<DataSyncResult>} 同步状态和结果
   * @throws {Error} 查询失败时抛出错误
   *
   * @example
   * ```typescript
   * const syncStatus = await systemConfigApi.getSyncStatus('sync_001')
   * if (syncStatus.successCount + syncStatus.failureCount === syncStatus.affectedCount) {
   *   console.log('同步已完成')
   * }
   * ```
   */
  getSyncStatus: async (syncId: string): Promise<DataSyncResult> => {
    try {
      const response = await http.get<DataSyncResult>(`/system-config/sync/${syncId}`)
      return response
    } catch (error) {
      console.error('[系统配置API] 获取同步状态失败:', error)
      throw error
    }
  },

  /**
   * 删除配置草稿
   * 删除指定的配置草稿
   *
   * @param {string} configId - 配置ID
   * @returns {Promise<void>} 删除成功
   * @throws {Error} 删除失败时抛出错误
   *
   * @example
   * ```typescript
   * await systemConfigApi.deleteDraft('config_001')
   * console.log('草稿已删除')
   * ```
   */
  deleteDraft: async (configId: string): Promise<void> => {
    try {
      await http.delete(`/system-config/draft/${configId}`)
    } catch (error) {
      console.error('[系统配置API] 删除草稿失败:', error)
      throw error
    }
  },

  /**
   * 获取配置详情
   * 获取指定配置的详细信息，包括审核信息
   *
   * @param {string} configId - 配置ID
   * @returns {Promise<SystemConfig>} 配置详情
   * @throws {Error} 获取失败时抛出错误
   *
   * @example
   * ```typescript
   * const config = await systemConfigApi.getConfigDetail('config_001')
   * console.log('配置详情:', config)
   * ```
   */
  getConfigDetail: async (configId: string): Promise<SystemConfig> => {
    try {
      const response = await http.get<SystemConfig>(`/system-config/${configId}`)
      return response
    } catch (error) {
      console.error('[系统配置API] 获取配置详情失败:', error)
      throw error
    }
  },

  /**
   * 复制配置
   * 基于现有配置创建新的草稿配置
   *
   * @param {string} sourceConfigId - 源配置ID
   * @returns {Promise<string>} 新配置ID
   * @throws {Error} 复制失败时抛出错误
   *
   * @example
   * ```typescript
   * const newConfigId = await systemConfigApi.copyConfig('config_001')
   * console.log('配置已复制，新配置ID:', newConfigId)
   * ```
   */
  copyConfig: async (sourceConfigId: string): Promise<string> => {
    try {
      const response = await http.post<{ id: string }>(`/system-config/${sourceConfigId}/copy`)
      return response.id
    } catch (error) {
      console.error('[系统配置API] 复制配置失败:', error)
      throw error
    }
  }
}
