/**
 * @fileoverview 系统配置状态管理Store
 * 基于Pinia的系统配置管理状态存储，支持等级规则、代理规则、返佣规则的统一管理
 * 包含配置的CRUD操作、审核流程、数据同步等完整功能
 * 
 * @module store/systemConfig
 * @requires pinia
 * @requires @/types/systemConfig
 * @requires @/api/systemConfig
 * @author Frontend Team
 * @since 1.0.0
 * @version 1.0.0
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  ConfigType,
  SystemConfig,
  LevelConfig,
  AgentConfig,
  CommissionConfig,
  AuditDecision,
  CreateConfigRequest,
  UpdateConfigRequest,
  ConfigQueryParams
} from '@/types/systemConfig'
import { 
  systemConfigApi, 
  type ConfigHistory, 
  type ConfigAuditRecord, 
  type DataSyncResult 
} from '@/api/systemConfig'
import { ConfigValidator } from '@/utils/configValidation'
import { configNotificationService } from '@/services/configNotification'
import { dataSyncService } from '@/services/dataSyncService'

/**
 * 系统配置Store状态接口
 * 定义系统配置管理的完整状态结构
 * 
 * @interface SystemConfigState
 */
interface SystemConfigState {
  /** 当前生效的配置 */
  currentConfigs: {
    level: LevelConfig | null
    agent: AgentConfig | null
    commission: CommissionConfig | null
  }
  /** 待审核的配置 */
  pendingConfigs: {
    level: LevelConfig | null
    agent: AgentConfig | null
    commission: CommissionConfig | null
  }
  /** 草稿配置 */
  draftConfigs: {
    level: LevelConfig | null
    agent: AgentConfig | null
    commission: CommissionConfig | null
  }
  /** 配置历史记录 */
  configHistory: {
    level: ConfigHistory[]
    agent: ConfigHistory[]
    commission: ConfigHistory[]
  }
  /** 审核记录 */
  auditRecords: ConfigAuditRecord[]
  /** 数据同步结果 */
  syncResults: DataSyncResult[]
  /** 加载状态 */
  loading: {
    fetching: boolean
    saving: boolean
    auditing: boolean
    syncing: boolean
  }
  /** 错误状态 */
  errors: {
    fetch: string | null
    save: string | null
    audit: string | null
    sync: string | null
  }
  /** 验证状态 */
  validation: {
    level: { isValid: boolean; errors: string[]; warnings: string[] }
    agent: { isValid: boolean; errors: string[]; warnings: string[] }
    commission: { isValid: boolean; errors: string[]; warnings: string[] }
  }
}

/**
 * 系统配置Store
 * 提供完整的系统配置管理功能，包括状态管理、API调用、数据验证等
 * 
 * @example
 * ```typescript
 * const configStore = useSystemConfigStore()
 * 
 * // 获取当前配置
 * await configStore.fetchCurrentConfig('level')
 * 
 * // 保存草稿
 * await configStore.saveDraftConfig('level', { type: 'level', rules: [...] })
 * 
 * // 提交审核
 * await configStore.submitConfigForAudit('level')
 * ```
 */
export const useSystemConfigStore = defineStore('systemConfig', () => {
  // 状态定义
  const state = ref<SystemConfigState>({
    currentConfigs: {
      level: null,
      agent: null,
      commission: null
    },
    pendingConfigs: {
      level: null,
      agent: null,
      commission: null
    },
    draftConfigs: {
      level: null,
      agent: null,
      commission: null
    },
    configHistory: {
      level: [],
      agent: [],
      commission: []
    },
    auditRecords: [],
    syncResults: [],
    loading: {
      fetching: false,
      saving: false,
      auditing: false,
      syncing: false
    },
    errors: {
      fetch: null,
      save: null,
      audit: null,
      sync: null
    },
    validation: {
      level: { isValid: true, errors: [], warnings: [] },
      agent: { isValid: true, errors: [], warnings: [] },
      commission: { isValid: true, errors: [], warnings: [] }
    }
  })

  // 计算属性
  const hasUnsavedChanges = computed(() => {
    return Object.values(state.value.draftConfigs).some(config => config !== null)
  })

  const hasPendingAudits = computed(() => {
    return Object.values(state.value.pendingConfigs).some(config => config !== null)
  })

  const isLoading = computed(() => {
    return Object.values(state.value.loading).some(loading => loading)
  })

  const hasErrors = computed(() => {
    return Object.values(state.value.errors).some(error => error !== null)
  })

  // Actions

  /**
   * 获取当前生效的配置
   * 
   * @param type 配置类型
   */
  const fetchCurrentConfig = async (type: ConfigType): Promise<void> => {
    state.value.loading.fetching = true
    state.value.errors.fetch = null

    try {
      const config = await systemConfigApi.getCurrentConfig(type)
      state.value.currentConfigs[type] = config as any
    } catch (error) {
      state.value.errors.fetch = `获取${type}配置失败: ${error}`
      console.error(`[系统配置Store] 获取${type}配置失败:`, error)
      throw error
    } finally {
      state.value.loading.fetching = false
    }
  }

  /**
   * 获取待审核的配置
   * 
   * @param type 配置类型
   */
  const fetchPendingConfig = async (type: ConfigType): Promise<void> => {
    state.value.loading.fetching = true
    state.value.errors.fetch = null

    try {
      const config = await systemConfigApi.getPendingConfig(type)
      state.value.pendingConfigs[type] = config as any
    } catch (error) {
      state.value.errors.fetch = `获取${type}待审核配置失败: ${error}`
      console.error(`[系统配置Store] 获取${type}待审核配置失败:`, error)
      throw error
    } finally {
      state.value.loading.fetching = false
    }
  }

  /**
   * 保存配置草稿
   * 
   * @param type 配置类型
   * @param config 配置数据
   */
  const saveDraftConfig = async (type: ConfigType, config: SystemConfig): Promise<string> => {
    state.value.loading.saving = true
    state.value.errors.save = null

    try {
      // 验证配置数据
      validateConfig(type, config)

      const configId = await systemConfigApi.saveDraft({
        type,
        rules: config.rules
      })

      // 更新本地状态
      state.value.draftConfigs[type] = config as any

      // 发送保存成功通知
      await configNotificationService.notifyConfigSaved(type)

      return configId
    } catch (error) {
      state.value.errors.save = `保存${type}配置草稿失败: ${error}`
      console.error(`[系统配置Store] 保存${type}配置草稿失败:`, error)
      throw error
    } finally {
      state.value.loading.saving = false
    }
  }

  /**
   * 更新配置草稿
   * 
   * @param type 配置类型
   * @param configId 配置ID
   * @param config 配置数据
   */
  const updateDraftConfig = async (
    type: ConfigType, 
    configId: string, 
    config: SystemConfig
  ): Promise<void> => {
    state.value.loading.saving = true
    state.value.errors.save = null

    try {
      // 验证配置数据
      validateConfig(type, config)

      await systemConfigApi.updateDraft({
        id: configId,
        rules: config.rules
      })

      // 更新本地状态
      state.value.draftConfigs[type] = config as any
    } catch (error) {
      state.value.errors.save = `更新${type}配置草稿失败: ${error}`
      console.error(`[系统配置Store] 更新${type}配置草稿失败:`, error)
      throw error
    } finally {
      state.value.loading.saving = false
    }
  }

  /**
   * 提交配置审核
   * 
   * @param type 配置类型
   * @param configId 配置ID
   */
  const submitConfigForAudit = async (type: ConfigType, configId: string): Promise<string> => {
    state.value.loading.saving = true
    state.value.errors.save = null

    try {
      const auditId = await systemConfigApi.submitForAudit(configId)

      // 将草稿移动到待审核状态
      state.value.pendingConfigs[type] = state.value.draftConfigs[type]
      state.value.draftConfigs[type] = null

      // 发送提交审核通知
      await configNotificationService.notifyConfigSubmitted(type)

      return auditId
    } catch (error) {
      state.value.errors.save = `提交${type}配置审核失败: ${error}`
      console.error(`[系统配置Store] 提交${type}配置审核失败:`, error)
      throw error
    } finally {
      state.value.loading.saving = false
    }
  }

  /**
   * 审核配置
   *
   * @param auditId 审核ID
   * @param decision 审核决策
   */
  const auditConfig = async (auditId: string, decision: AuditDecision): Promise<void> => {
    state.value.loading.auditing = true
    state.value.errors.audit = null

    try {
      await systemConfigApi.auditConfig(auditId, decision)

      // 获取审核记录以确定配置类型
      const auditRecord = state.value.auditRecords.find(record => record.auditId === auditId)
      const configType = auditRecord?.configType

      // 发送审核结果通知
      if (configType) {
        await configNotificationService.notifyAuditResult(
          configType,
          decision.action === 'approve' ? 'approved' : 'rejected',
          decision.comment
        )
      }

      // 刷新审核记录
      await fetchAuditRecords()

      // 如果审核通过，刷新当前配置并触发数据同步
      if (decision.action === 'approve') {
        await Promise.all([
          fetchCurrentConfig('level'),
          fetchCurrentConfig('agent'),
          fetchCurrentConfig('commission')
        ])

        // 触发数据同步
        if (configType) {
          await triggerConfigDataSync(configType)
        }
      }
    } catch (error) {
      state.value.errors.audit = `审核配置失败: ${error}`
      console.error('[系统配置Store] 审核配置失败:', error)
      throw error
    } finally {
      state.value.loading.auditing = false
    }
  }

  /**
   * 获取配置历史记录
   *
   * @param type 配置类型
   * @param params 查询参数
   */
  const fetchConfigHistory = async (
    type: ConfigType,
    params?: ConfigQueryParams
  ): Promise<void> => {
    state.value.loading.fetching = true
    state.value.errors.fetch = null

    try {
      const response = await systemConfigApi.getConfigHistory(type, params)
      state.value.configHistory[type] = response.data
    } catch (error) {
      state.value.errors.fetch = `获取${type}配置历史失败: ${error}`
      console.error(`[系统配置Store] 获取${type}配置历史失败:`, error)
      throw error
    } finally {
      state.value.loading.fetching = false
    }
  }

  /**
   * 获取审核记录
   *
   * @param params 查询参数
   */
  const fetchAuditRecords = async (params?: ConfigQueryParams): Promise<void> => {
    state.value.loading.fetching = true
    state.value.errors.fetch = null

    try {
      const response = await systemConfigApi.getAuditRecords(params)
      state.value.auditRecords = response.list || []
    } catch (error) {
      state.value.errors.fetch = `获取审核记录失败: ${error}`
      console.error('[系统配置Store] 获取审核记录失败:', error)
      throw error
    } finally {
      state.value.loading.fetching = false
    }
  }

  /**
   * 触发数据同步
   *
   * @param type 配置类型
   * @param configId 配置ID
   */
  const triggerDataSync = async (type: ConfigType, configId: string): Promise<DataSyncResult> => {
    state.value.loading.syncing = true
    state.value.errors.sync = null

    try {
      const result = await systemConfigApi.triggerDataSync(type, configId)
      state.value.syncResults.push(result)
      return result
    } catch (error) {
      state.value.errors.sync = `触发${type}数据同步失败: ${error}`
      console.error(`[系统配置Store] 触发${type}数据同步失败:`, error)
      throw error
    } finally {
      state.value.loading.syncing = false
    }
  }

  /**
   * 触发配置数据同步（使用新的数据同步服务）
   *
   * @param type 配置类型
   */
  const triggerConfigDataSync = async (type: ConfigType): Promise<void> => {
    state.value.loading.syncing = true
    state.value.errors.sync = null

    try {
      const currentConfig = state.value.currentConfigs[type]
      if (!currentConfig) {
        throw new Error(`未找到${type}配置`)
      }

      // 发送配置生效通知
      await configNotificationService.notifyConfigActivated(type)

      // 根据配置类型执行相应的数据同步
      let syncResult
      switch (type) {
        case 'level':
          syncResult = await dataSyncService.syncLevelChanges(currentConfig as any)
          break
        case 'agent':
          syncResult = await dataSyncService.syncAgentChanges(currentConfig as any)
          break
        case 'commission':
          syncResult = await dataSyncService.syncCommissionChanges(currentConfig as any)
          break
        default:
          throw new Error(`不支持的配置类型: ${type}`)
      }

      console.log(`${type}配置数据同步完成:`, syncResult)
    } catch (error) {
      state.value.errors.sync = `${type}数据同步失败: ${error}`
      console.error(`[系统配置Store] ${type}数据同步失败:`, error)

      // 发送同步失败通知
      await configNotificationService.notifyConfigError(
        type,
        error instanceof Error ? error.message : '数据同步失败'
      )

      throw error
    } finally {
      state.value.loading.syncing = false
    }
  }

  /**
   * 验证配置数据
   *
   * @param type 配置类型
   * @param config 配置数据
   */
  const validateConfig = (type: ConfigType, config: SystemConfig): void => {
    let result

    switch (type) {
      case 'level':
        result = ConfigValidator.validateLevelConfig(config as LevelConfig)
        break
      case 'agent':
        result = ConfigValidator.validateAgentConfig(config as AgentConfig)
        break
      case 'commission':
        result = ConfigValidator.validateCommissionConfig(config as CommissionConfig)
        break
      default:
        throw new Error(`不支持的配置类型: ${type}`)
    }

    // 更新验证状态
    state.value.validation[type] = result

    // 如果验证失败，抛出错误
    if (!result.isValid) {
      throw new Error(`配置验证失败: ${result.errors.join(', ')}`)
    }
  }

  /**
   * 重置草稿配置
   *
   * @param type 配置类型
   */
  const resetDraft = (type: ConfigType): void => {
    state.value.draftConfigs[type] = null
    state.value.validation[type] = { isValid: true, errors: [], warnings: [] }
  }

  /**
   * 清除错误状态
   */
  const clearErrors = (): void => {
    state.value.errors = {
      fetch: null,
      save: null,
      audit: null,
      sync: null
    }
  }

  /**
   * 删除配置草稿
   *
   * @param type 配置类型
   * @param configId 配置ID
   */
  const deleteDraft = async (type: ConfigType, configId: string): Promise<void> => {
    state.value.loading.saving = true
    state.value.errors.save = null

    try {
      await systemConfigApi.deleteDraft(configId)
      state.value.draftConfigs[type] = null
    } catch (error) {
      state.value.errors.save = `删除${type}配置草稿失败: ${error}`
      console.error(`[系统配置Store] 删除${type}配置草稿失败:`, error)
      throw error
    } finally {
      state.value.loading.saving = false
    }
  }

  /**
   * 初始化Store
   * 加载所有必要的配置数据
   */
  const initialize = async (): Promise<void> => {
    try {
      await Promise.all([
        fetchCurrentConfig('level'),
        fetchCurrentConfig('agent'),
        fetchCurrentConfig('commission'),
        fetchPendingConfig('level'),
        fetchPendingConfig('agent'),
        fetchPendingConfig('commission')
      ])
    } catch (error) {
      console.error('[系统配置Store] 初始化失败:', error)
      throw error
    }
  }

  // 返回Store接口
  return {
    // 状态
    state: state.value,

    // 计算属性
    hasUnsavedChanges,
    hasPendingAudits,
    isLoading,
    hasErrors,

    // Actions
    fetchCurrentConfig,
    fetchPendingConfig,
    saveDraftConfig,
    updateDraftConfig,
    submitConfigForAudit,
    auditConfig,
    fetchConfigHistory,
    fetchAuditRecords,
    triggerDataSync,
    triggerConfigDataSync,
    validateConfig,
    resetDraft,
    clearErrors,
    deleteDraft,
    initialize
  }
})
