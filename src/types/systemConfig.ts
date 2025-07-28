/**
 * @fileoverview 系统配置模块类型定义
 * 定义分销系统配置管理相关的所有TypeScript接口和类型
 * 包含等级规则、代理规则、返佣规则的完整数据结构
 * 
 * @module types/systemConfig
 * @author Frontend Team
 * @since 1.0.0
 * @version 1.0.0
 */

/**
 * 配置类型枚举
 * 定义系统支持的三种配置类型
 */
export type ConfigType = 'level' | 'agent' | 'commission'

/**
 * 配置状态枚举
 * 定义配置在生命周期中的各种状态
 */
export type ConfigStatus = 'draft' | 'pending' | 'active' | 'archived'

/**
 * 审核状态枚举
 * 定义配置审核的状态
 */
export type AuditStatus = 'pending' | 'approved' | 'rejected'

/**
 * 配置变更类型枚举
 * 定义配置变更的操作类型
 */
export type ChangeType = 'create' | 'update' | 'delete'

/**
 * 等级类型枚举
 * 定义分销系统支持的用户等级
 */
export type LevelType = 'V1' | 'V2' | 'V3' | 'V4' | 'V5' | 'V6'

/**
 * 返佣类型枚举
 * 定义返佣计算的方式
 */
export type CommissionType = 'percentage' | 'fixed' | 'tiered'

/**
 * 返佣发放时机枚举
 * 定义返佣发放的时间策略
 */
export type PaymentTiming = 'immediate' | 'monthly' | 'quarterly'

/**
 * 配置变更记录接口
 * 记录配置字段的具体变更信息
 * 
 * @interface ConfigChange
 * 
 * @example
 * ```typescript
 * const change: ConfigChange = {
 *   field: 'commissionRate',
 *   oldValue: 0.05,
 *   newValue: 0.06,
 *   changeType: 'update'
 * }
 * ```
 */
export interface ConfigChange {
  /** 变更的字段名称 */
  field: string
  /** 变更前的值 */
  oldValue: any
  /** 变更后的值 */
  newValue: any
  /** 变更操作类型 */
  changeType: ChangeType
}

/**
 * 审核决策接口
 * 定义配置审核时的决策信息
 * 
 * @interface AuditDecision
 * 
 * @example
 * ```typescript
 * const decision: AuditDecision = {
 *   action: 'approve',
 *   comment: '配置合理，符合业务需求',
 *   auditorId: 'admin_001'
 * }
 * ```
 */
export interface AuditDecision {
  /** 审核动作：通过或拒绝 */
  action: 'approve' | 'reject'
  /** 审核意见 */
  comment: string
  /** 审核人ID */
  auditorId: string
}

/**
 * 审核信息接口
 * 记录配置审核的完整信息
 * 
 * @interface AuditInfo
 * 
 * @example
 * ```typescript
 * const auditInfo: AuditInfo = {
 *   auditId: 'audit_001',
 *   auditor: 'admin_001',
 *   auditTime: '2024-01-01T10:00:00Z',
 *   status: 'approved',
 *   comment: '配置审核通过',
 *   changes: [...]
 * }
 * ```
 */
export interface AuditInfo {
  /** 审核记录唯一标识 */
  auditId: string
  /** 审核人ID */
  auditor: string
  /** 审核时间 */
  auditTime: string
  /** 审核状态 */
  status: AuditStatus
  /** 审核意见 */
  comment: string
  /** 配置变更记录列表 */
  changes: ConfigChange[]
}

/**
 * 系统配置基础接口
 * 所有配置类型的基础结构，包含通用字段
 * 
 * @interface BaseConfig
 * 
 * @example
 * ```typescript
 * const baseConfig: BaseConfig = {
 *   id: 'config_001',
 *   type: 'level',
 *   version: 1,
 *   status: 'active',
 *   createdBy: 'admin_001',
 *   createdAt: '2024-01-01T00:00:00Z',
 *   updatedAt: '2024-01-01T00:00:00Z'
 * }
 * ```
 */
export interface BaseConfig {
  /** 配置唯一标识ID */
  id: string
  /** 配置类型 */
  type: ConfigType
  /** 配置版本号 */
  version: number
  /** 配置状态 */
  status: ConfigStatus
  /** 创建人ID */
  createdBy: string
  /** 创建时间 */
  createdAt: string
  /** 最后更新时间 */
  updatedAt: string
  /** 审核信息，可选 */
  auditInfo?: AuditInfo
}

/**
 * 等级规则接口
 * 定义用户等级的判定标准和权益
 * 
 * @interface LevelRule
 * 
 * @example
 * ```typescript
 * const levelRule: LevelRule = {
 *   level: 'V1',
 *   name: 'V1伙伴',
 *   minPerformance: 0,
 *   maxPerformance: 10000,
 *   commissionRate: 0.05,
 *   description: '月业绩1万以下，提点5%'
 * }
 * ```
 */
export interface LevelRule {
  /** 等级标识 */
  level: LevelType
  /** 等级名称 */
  name: string
  /** 最小业绩要求（元） */
  minPerformance: number
  /** 最大业绩范围（元） */
  maxPerformance: number
  /** 提成比例（0-1之间的小数） */
  commissionRate: number
  /** 连续月数要求，可选（用于V2等级） */
  continuousMonths?: number
  /** 等级描述 */
  description: string
}

/**
 * 代理升级条件接口
 * 定义代理层级升级的多维度条件
 * 
 * @interface AgentUpgradeConditions
 */
export interface AgentUpgradeConditions {
  /** 业绩门槛（元） */
  performanceThreshold: number
  /** 时间要求（月） */
  timeRequirement: number
  /** 推荐人数要求 */
  referralCount: number
}

/**
 * 代理规则接口
 * 定义代理层级的升级条件和权限配置
 * 
 * @interface AgentRule
 * 
 * @example
 * ```typescript
 * const agentRule: AgentRule = {
 *   level: 1,
 *   name: '初级代理',
 *   upgradeConditions: {
 *     performanceThreshold: 50000,
 *     timeRequirement: 3,
 *     referralCount: 5
 *   },
 *   permissions: ['view_leads', 'create_leads'],
 *   commissionRate: 0.03
 * }
 * ```
 */
export interface AgentRule {
  /** 代理层级 */
  level: number
  /** 层级名称 */
  name: string
  /** 升级条件 */
  upgradeConditions: AgentUpgradeConditions
  /** 权限列表 */
  permissions: string[]
  /** 提成比例（0-1之间的小数） */
  commissionRate: number
}

/**
 * 返佣阶梯接口
 * 定义阶梯式返佣的单个阶梯配置
 * 
 * @interface CommissionTier
 */
export interface CommissionTier {
  /** 最小金额（元） */
  minAmount: number
  /** 最大金额（元） */
  maxAmount: number
  /** 返佣比例或固定金额 */
  rate: number
}

/**
 * 返佣规则接口
 * 定义返佣计算和发放的完整规则
 * 
 * @interface CommissionRule
 * 
 * @example
 * ```typescript
 * const commissionRule: CommissionRule = {
 *   type: 'tiered',
 *   tiers: [
 *     { minAmount: 0, maxAmount: 10000, rate: 0.02 },
 *     { minAmount: 10000, maxAmount: 50000, rate: 0.03 }
 *   ],
 *   paymentTiming: 'monthly',
 *   maxSingleCommission: 5000,
 *   maxMonthlyCommission: 20000
 * }
 * ```
 */
export interface CommissionRule {
  /** 返佣类型 */
  type: CommissionType
  /** 阶梯配置（用于阶梯式返佣） */
  tiers: CommissionTier[]
  /** 发放时机 */
  paymentTiming: PaymentTiming
  /** 单笔返佣上限（元） */
  maxSingleCommission: number
  /** 月度返佣上限（元） */
  maxMonthlyCommission: number
}

/**
 * 等级配置接口
 * 继承基础配置，包含等级规则列表
 * 
 * @interface LevelConfig
 * @extends BaseConfig
 */
export interface LevelConfig extends BaseConfig {
  /** 配置类型固定为level */
  type: 'level'
  /** 等级规则列表 */
  rules: LevelRule[]
}

/**
 * 代理配置接口
 * 继承基础配置，包含代理规则列表
 * 
 * @interface AgentConfig
 * @extends BaseConfig
 */
export interface AgentConfig extends BaseConfig {
  /** 配置类型固定为agent */
  type: 'agent'
  /** 代理规则列表 */
  rules: AgentRule[]
}

/**
 * 返佣配置接口
 * 继承基础配置，包含返佣规则列表
 * 
 * @interface CommissionConfig
 * @extends BaseConfig
 */
export interface CommissionConfig extends BaseConfig {
  /** 配置类型固定为commission */
  type: 'commission'
  /** 返佣规则列表 */
  rules: CommissionRule[]
}

/**
 * 系统配置联合类型
 * 包含所有可能的配置类型
 */
export type SystemConfig = LevelConfig | AgentConfig | CommissionConfig

/**
 * 配置创建请求接口
 * 用于创建新配置时的数据结构
 */
export interface CreateConfigRequest {
  /** 配置类型 */
  type: ConfigType
  /** 配置规则数据 */
  rules: LevelRule[] | AgentRule[] | CommissionRule[]
}

/**
 * 配置更新请求接口
 * 用于更新现有配置时的数据结构
 */
export interface UpdateConfigRequest {
  /** 配置ID */
  id: string
  /** 配置规则数据 */
  rules: LevelRule[] | AgentRule[] | CommissionRule[]
}

/**
 * 配置查询参数接口
 * 用于查询配置列表时的筛选条件
 */
export interface ConfigQueryParams {
  /** 配置类型 */
  type?: ConfigType
  /** 配置状态 */
  status?: ConfigStatus
  /** 创建人ID */
  createdBy?: string
  /** 创建时间范围开始 */
  createdAfter?: string
  /** 创建时间范围结束 */
  createdBefore?: string
  /** 页码 */
  page?: number
  /** 每页数量 */
  pageSize?: number
}
