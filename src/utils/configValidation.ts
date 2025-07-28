/**
 * @fileoverview 系统配置验证模式
 * 使用Zod库定义系统配置的验证规则，确保数据的完整性和正确性
 * 包含等级规则、代理规则、返佣规则的完整验证逻辑
 * 
 * @module utils/configValidation
 * @requires zod
 * @author Frontend Team
 * @since 1.0.0
 * @version 1.0.0
 */

import { z } from 'zod'
import type {
  LevelRule,
  AgentRule,
  CommissionRule,
  LevelConfig,
  AgentConfig,
  CommissionConfig,
  AuditDecision,
  ConfigChange
} from '@/types/systemConfig'

/**
 * 常量定义
 */
const VALIDATION_CONSTANTS = {
  // 业绩金额限制
  MIN_PERFORMANCE: 0,
  MAX_PERFORMANCE: 10000000, // 1000万
  
  // 提成比例限制
  MIN_COMMISSION_RATE: 0,
  MAX_COMMISSION_RATE: 1, // 100%
  
  // 连续月数限制
  MIN_CONTINUOUS_MONTHS: 1,
  MAX_CONTINUOUS_MONTHS: 12,
  
  // 代理层级限制
  MIN_AGENT_LEVEL: 1,
  MAX_AGENT_LEVEL: 10,
  
  // 推荐人数限制
  MIN_REFERRAL_COUNT: 0,
  MAX_REFERRAL_COUNT: 1000,
  
  // 时间要求限制（月）
  MIN_TIME_REQUIREMENT: 1,
  MAX_TIME_REQUIREMENT: 24,
  
  // 返佣金额限制
  MIN_COMMISSION_AMOUNT: 0,
  MAX_SINGLE_COMMISSION: 100000, // 10万
  MAX_MONTHLY_COMMISSION: 1000000, // 100万
  
  // 字符串长度限制
  MAX_NAME_LENGTH: 50,
  MAX_DESCRIPTION_LENGTH: 200,
  MAX_COMMENT_LENGTH: 500
} as const

/**
 * 等级规则验证模式
 * 验证V1-V6等级的配置数据
 * 
 * @example
 * ```typescript
 * const levelRule = {
 *   level: 'V1',
 *   name: 'V1伙伴',
 *   minPerformance: 0,
 *   maxPerformance: 10000,
 *   commissionRate: 0.05,
 *   description: '月业绩1万以下，提点5%'
 * }
 * 
 * const result = levelRuleSchema.safeParse(levelRule)
 * if (result.success) {
 *   console.log('验证通过:', result.data)
 * } else {
 *   console.error('验证失败:', result.error.errors)
 * }
 * ```
 */
export const levelRuleSchema = z.object({
  level: z.enum(['V1', 'V2', 'V3', 'V4', 'V5', 'V6'], {
    errorMap: () => ({ message: '等级必须是V1-V6之间' })
  }),
  
  name: z.string()
    .min(1, '等级名称不能为空')
    .max(VALIDATION_CONSTANTS.MAX_NAME_LENGTH, `等级名称不能超过${VALIDATION_CONSTANTS.MAX_NAME_LENGTH}个字符`)
    .regex(/^[a-zA-Z0-9\u4e00-\u9fa5]+$/, '等级名称只能包含中文、英文和数字'),
  
  minPerformance: z.number()
    .min(VALIDATION_CONSTANTS.MIN_PERFORMANCE, '最小业绩不能小于0')
    .max(VALIDATION_CONSTANTS.MAX_PERFORMANCE, `最小业绩不能超过${VALIDATION_CONSTANTS.MAX_PERFORMANCE}`)
    .int('最小业绩必须是整数'),
  
  maxPerformance: z.number()
    .min(VALIDATION_CONSTANTS.MIN_PERFORMANCE, '最大业绩不能小于0')
    .max(VALIDATION_CONSTANTS.MAX_PERFORMANCE, `最大业绩不能超过${VALIDATION_CONSTANTS.MAX_PERFORMANCE}`)
    .int('最大业绩必须是整数'),
  
  commissionRate: z.number()
    .min(VALIDATION_CONSTANTS.MIN_COMMISSION_RATE, '提成比例不能小于0%')
    .max(VALIDATION_CONSTANTS.MAX_COMMISSION_RATE, '提成比例不能超过100%')
    .refine(val => val <= 1, '提成比例必须在0-1之间'),
  
  continuousMonths: z.number()
    .min(VALIDATION_CONSTANTS.MIN_CONTINUOUS_MONTHS, '连续月数不能小于1')
    .max(VALIDATION_CONSTANTS.MAX_CONTINUOUS_MONTHS, '连续月数不能超过12')
    .int('连续月数必须是整数')
    .optional(),
  
  description: z.string()
    .min(1, '等级描述不能为空')
    .max(VALIDATION_CONSTANTS.MAX_DESCRIPTION_LENGTH, `等级描述不能超过${VALIDATION_CONSTANTS.MAX_DESCRIPTION_LENGTH}个字符`)
}).refine(data => data.maxPerformance > data.minPerformance, {
  message: '最大业绩必须大于最小业绩',
  path: ['maxPerformance']
})

/**
 * 代理升级条件验证模式
 */
export const agentUpgradeConditionsSchema = z.object({
  performanceThreshold: z.number()
    .min(VALIDATION_CONSTANTS.MIN_PERFORMANCE, '业绩门槛不能小于0')
    .max(VALIDATION_CONSTANTS.MAX_PERFORMANCE, `业绩门槛不能超过${VALIDATION_CONSTANTS.MAX_PERFORMANCE}`)
    .int('业绩门槛必须是整数'),
  
  timeRequirement: z.number()
    .min(VALIDATION_CONSTANTS.MIN_TIME_REQUIREMENT, '时间要求不能小于1个月')
    .max(VALIDATION_CONSTANTS.MAX_TIME_REQUIREMENT, '时间要求不能超过24个月')
    .int('时间要求必须是整数'),
  
  referralCount: z.number()
    .min(VALIDATION_CONSTANTS.MIN_REFERRAL_COUNT, '推荐人数不能小于0')
    .max(VALIDATION_CONSTANTS.MAX_REFERRAL_COUNT, '推荐人数不能超过1000')
    .int('推荐人数必须是整数')
})

/**
 * 代理规则验证模式
 * 验证代理层级升级条件和权限配置
 * 
 * @example
 * ```typescript
 * const agentRule = {
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
 * 
 * const result = agentRuleSchema.safeParse(agentRule)
 * ```
 */
export const agentRuleSchema = z.object({
  level: z.number()
    .min(VALIDATION_CONSTANTS.MIN_AGENT_LEVEL, '代理层级不能小于1')
    .max(VALIDATION_CONSTANTS.MAX_AGENT_LEVEL, '代理层级不能超过10')
    .int('代理层级必须是整数'),
  
  name: z.string()
    .min(1, '层级名称不能为空')
    .max(VALIDATION_CONSTANTS.MAX_NAME_LENGTH, `层级名称不能超过${VALIDATION_CONSTANTS.MAX_NAME_LENGTH}个字符`)
    .regex(/^[a-zA-Z0-9\u4e00-\u9fa5]+$/, '层级名称只能包含中文、英文和数字'),
  
  upgradeConditions: agentUpgradeConditionsSchema,
  
  permissions: z.array(z.string().min(1, '权限名称不能为空'))
    .min(1, '至少需要配置一个权限')
    .max(20, '权限数量不能超过20个'),
  
  commissionRate: z.number()
    .min(VALIDATION_CONSTANTS.MIN_COMMISSION_RATE, '提成比例不能小于0%')
    .max(VALIDATION_CONSTANTS.MAX_COMMISSION_RATE, '提成比例不能超过100%')
    .refine(val => val <= 1, '提成比例必须在0-1之间')
})

/**
 * 返佣阶梯验证模式
 */
export const commissionTierSchema = z.object({
  minAmount: z.number()
    .min(VALIDATION_CONSTANTS.MIN_COMMISSION_AMOUNT, '最小金额不能小于0')
    .max(VALIDATION_CONSTANTS.MAX_MONTHLY_COMMISSION, `最小金额不能超过${VALIDATION_CONSTANTS.MAX_MONTHLY_COMMISSION}`)
    .int('最小金额必须是整数'),
  
  maxAmount: z.number()
    .min(VALIDATION_CONSTANTS.MIN_COMMISSION_AMOUNT, '最大金额不能小于0')
    .max(VALIDATION_CONSTANTS.MAX_MONTHLY_COMMISSION, `最大金额不能超过${VALIDATION_CONSTANTS.MAX_MONTHLY_COMMISSION}`)
    .int('最大金额必须是整数'),
  
  rate: z.number()
    .min(VALIDATION_CONSTANTS.MIN_COMMISSION_RATE, '返佣比例不能小于0')
    .max(VALIDATION_CONSTANTS.MAX_COMMISSION_RATE, '返佣比例不能超过100%')
}).refine(data => data.maxAmount > data.minAmount, {
  message: '最大金额必须大于最小金额',
  path: ['maxAmount']
})

/**
 * 返佣规则验证模式
 * 验证返佣计算和发放规则
 * 
 * @example
 * ```typescript
 * const commissionRule = {
 *   type: 'tiered',
 *   tiers: [
 *     { minAmount: 0, maxAmount: 10000, rate: 0.02 },
 *     { minAmount: 10000, maxAmount: 50000, rate: 0.03 }
 *   ],
 *   paymentTiming: 'monthly',
 *   maxSingleCommission: 5000,
 *   maxMonthlyCommission: 20000
 * }
 * 
 * const result = commissionRuleSchema.safeParse(commissionRule)
 * ```
 */
export const commissionRuleSchema = z.object({
  type: z.enum(['percentage', 'fixed', 'tiered'], {
    errorMap: () => ({ message: '返佣类型必须是percentage、fixed或tiered' })
  }),
  
  tiers: z.array(commissionTierSchema)
    .min(1, '至少需要配置一个返佣阶梯')
    .max(10, '返佣阶梯不能超过10个'),
  
  paymentTiming: z.enum(['immediate', 'monthly', 'quarterly'], {
    errorMap: () => ({ message: '发放时机必须是immediate、monthly或quarterly' })
  }),
  
  maxSingleCommission: z.number()
    .min(VALIDATION_CONSTANTS.MIN_COMMISSION_AMOUNT, '单笔返佣上限不能小于0')
    .max(VALIDATION_CONSTANTS.MAX_SINGLE_COMMISSION, `单笔返佣上限不能超过${VALIDATION_CONSTANTS.MAX_SINGLE_COMMISSION}`)
    .int('单笔返佣上限必须是整数'),
  
  maxMonthlyCommission: z.number()
    .min(VALIDATION_CONSTANTS.MIN_COMMISSION_AMOUNT, '月度返佣上限不能小于0')
    .max(VALIDATION_CONSTANTS.MAX_MONTHLY_COMMISSION, `月度返佣上限不能超过${VALIDATION_CONSTANTS.MAX_MONTHLY_COMMISSION}`)
    .int('月度返佣上限必须是整数')
}).refine(data => data.maxMonthlyCommission >= data.maxSingleCommission, {
  message: '月度返佣上限必须大于等于单笔返佣上限',
  path: ['maxMonthlyCommission']
})

/**
 * 审核决策验证模式
 */
export const auditDecisionSchema = z.object({
  action: z.enum(['approve', 'reject'], {
    errorMap: () => ({ message: '审核动作必须是approve或reject' })
  }),
  
  comment: z.string()
    .min(1, '审核意见不能为空')
    .max(VALIDATION_CONSTANTS.MAX_COMMENT_LENGTH, `审核意见不能超过${VALIDATION_CONSTANTS.MAX_COMMENT_LENGTH}个字符`),
  
  auditorId: z.string()
    .min(1, '审核人ID不能为空')
    .regex(/^[a-zA-Z0-9_-]+$/, '审核人ID格式不正确')
})

/**
 * 等级配置验证模式
 */
export const levelConfigSchema = z.object({
  type: z.literal('level'),
  rules: z.array(levelRuleSchema)
    .min(1, '至少需要配置一个等级规则')
    .max(6, '等级规则不能超过6个')
})

/**
 * 代理配置验证模式
 */
export const agentConfigSchema = z.object({
  type: z.literal('agent'),
  rules: z.array(agentRuleSchema)
    .min(1, '至少需要配置一个代理规则')
    .max(10, '代理规则不能超过10个')
})

/**
 * 返佣配置验证模式
 */
export const commissionConfigSchema = z.object({
  type: z.literal('commission'),
  rules: z.array(commissionRuleSchema)
    .min(1, '至少需要配置一个返佣规则')
    .max(5, '返佣规则不能超过5个')
})

/**
 * 配置交叉验证结果接口
 */
export interface CrossValidationResult {
  /** 验证是否通过 */
  isValid: boolean
  /** 错误信息列表 */
  errors: string[]
  /** 警告信息列表 */
  warnings: string[]
}

/**
 * 等级规则交叉验证
 * 验证等级规则之间的逻辑关系
 *
 * @param rules 等级规则数组
 * @returns 验证结果
 *
 * @example
 * ```typescript
 * const rules = [
 *   { level: 'V1', minPerformance: 0, maxPerformance: 10000, commissionRate: 0.05 },
 *   { level: 'V2', minPerformance: 10000, maxPerformance: 20000, commissionRate: 0.06 }
 * ]
 *
 * const result = validateLevelRulesCrossCheck(rules)
 * if (!result.isValid) {
 *   console.error('验证失败:', result.errors)
 * }
 * ```
 */
export function validateLevelRulesCrossCheck(rules: LevelRule[]): CrossValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // 检查等级唯一性
  const levels = rules.map(rule => rule.level)
  const duplicateLevels = levels.filter((level, index) => levels.indexOf(level) !== index)
  if (duplicateLevels.length > 0) {
    errors.push(`存在重复的等级: ${duplicateLevels.join(', ')}`)
  }

  // 检查业绩区间是否重叠
  const sortedRules = [...rules].sort((a, b) => a.minPerformance - b.minPerformance)
  for (let i = 0; i < sortedRules.length - 1; i++) {
    const current = sortedRules[i]
    const next = sortedRules[i + 1]

    if (current.maxPerformance > next.minPerformance) {
      errors.push(`${current.level}和${next.level}的业绩区间存在重叠`)
    }

    // 检查业绩区间是否连续
    if (current.maxPerformance < next.minPerformance) {
      warnings.push(`${current.level}和${next.level}的业绩区间存在空隙`)
    }
  }

  // 检查提成比例是否递增
  const levelOrder = ['V1', 'V2', 'V3', 'V4', 'V5', 'V6']
  const orderedRules = rules.sort((a, b) => levelOrder.indexOf(a.level) - levelOrder.indexOf(b.level))

  for (let i = 0; i < orderedRules.length - 1; i++) {
    const current = orderedRules[i]
    const next = orderedRules[i + 1]

    if (current.commissionRate >= next.commissionRate) {
      errors.push(`${next.level}的提成比例应该高于${current.level}`)
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * 代理规则交叉验证
 * 验证代理规则之间的逻辑关系
 *
 * @param rules 代理规则数组
 * @returns 验证结果
 */
export function validateAgentRulesCrossCheck(rules: AgentRule[]): CrossValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // 检查层级唯一性
  const levels = rules.map(rule => rule.level)
  const duplicateLevels = levels.filter((level, index) => levels.indexOf(level) !== index)
  if (duplicateLevels.length > 0) {
    errors.push(`存在重复的代理层级: ${duplicateLevels.join(', ')}`)
  }

  // 检查升级条件是否递增
  const sortedRules = [...rules].sort((a, b) => a.level - b.level)
  for (let i = 0; i < sortedRules.length - 1; i++) {
    const current = sortedRules[i]
    const next = sortedRules[i + 1]

    if (current.upgradeConditions.performanceThreshold >= next.upgradeConditions.performanceThreshold) {
      errors.push(`层级${next.level}的业绩门槛应该高于层级${current.level}`)
    }

    if (current.commissionRate >= next.commissionRate) {
      warnings.push(`层级${next.level}的提成比例建议高于层级${current.level}`)
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * 返佣阶梯交叉验证
 * 验证返佣阶梯的连续性和合理性
 *
 * @param tiers 返佣阶梯数组
 * @returns 验证结果
 */
export function validateCommissionTiersCrossCheck(tiers: CommissionRule['tiers']): CrossValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // 按最小金额排序
  const sortedTiers = [...tiers].sort((a, b) => a.minAmount - b.minAmount)

  // 检查阶梯是否重叠
  for (let i = 0; i < sortedTiers.length - 1; i++) {
    const current = sortedTiers[i]
    const next = sortedTiers[i + 1]

    if (current.maxAmount > next.minAmount) {
      errors.push(`第${i + 1}和第${i + 2}个阶梯的金额区间存在重叠`)
    }

    // 检查阶梯是否连续
    if (current.maxAmount < next.minAmount) {
      warnings.push(`第${i + 1}和第${i + 2}个阶梯的金额区间存在空隙`)
    }
  }

  // 检查返佣比例是否递增
  for (let i = 0; i < sortedTiers.length - 1; i++) {
    const current = sortedTiers[i]
    const next = sortedTiers[i + 1]

    if (current.rate >= next.rate) {
      warnings.push(`第${i + 2}个阶梯的返佣比例建议高于第${i + 1}个阶梯`)
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * 配置验证工具类
 * 提供完整的配置验证服务
 */
export class ConfigValidator {
  /**
   * 验证等级配置
   *
   * @param config 等级配置对象
   * @returns 验证结果
   */
  static validateLevelConfig(config: Partial<LevelConfig>): CrossValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // 基础结构验证
    const schemaResult = levelConfigSchema.safeParse(config)
    if (!schemaResult.success) {
      errors.push(...schemaResult.error.errors.map(err => err.message))
    }

    // 交叉验证
    if (config.rules && config.rules.length > 0) {
      const crossResult = validateLevelRulesCrossCheck(config.rules)
      errors.push(...crossResult.errors)
      warnings.push(...crossResult.warnings)
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * 验证代理配置
   *
   * @param config 代理配置对象
   * @returns 验证结果
   */
  static validateAgentConfig(config: Partial<AgentConfig>): CrossValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // 基础结构验证
    const schemaResult = agentConfigSchema.safeParse(config)
    if (!schemaResult.success) {
      errors.push(...schemaResult.error.errors.map(err => err.message))
    }

    // 交叉验证
    if (config.rules && config.rules.length > 0) {
      const crossResult = validateAgentRulesCrossCheck(config.rules)
      errors.push(...crossResult.errors)
      warnings.push(...crossResult.warnings)
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * 验证返佣配置
   *
   * @param config 返佣配置对象
   * @returns 验证结果
   */
  static validateCommissionConfig(config: Partial<CommissionConfig>): CrossValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // 基础结构验证
    const schemaResult = commissionConfigSchema.safeParse(config)
    if (!schemaResult.success) {
      errors.push(...schemaResult.error.errors.map(err => err.message))
    }

    // 交叉验证
    if (config.rules && config.rules.length > 0) {
      for (const rule of config.rules) {
        if (rule.tiers && rule.tiers.length > 0) {
          const crossResult = validateCommissionTiersCrossCheck(rule.tiers)
          errors.push(...crossResult.errors)
          warnings.push(...crossResult.warnings)
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }
}
