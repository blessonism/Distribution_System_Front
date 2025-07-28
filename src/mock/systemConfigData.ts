/**
 * @fileoverview 系统配置Mock数据
 * 提供系统配置模块的模拟数据和API接口
 */

import type { 
  SystemConfig, 
  LevelConfig, 
  AgentConfig, 
  CommissionConfig,
  ConfigType,
  LevelRule,
  AgentRule,
  CommissionRule
} from '@/types/systemConfig'

/**
 * 模拟的等级规则配置
 */
export const mockLevelConfig: LevelConfig = {
  id: 'level_config_001',
  type: 'level',
  version: 1,
  status: 'active',
  createdBy: 'admin',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  rules: [
    {
      level: 'V1',
      name: 'V1伙伴',
      minPerformance: 0,
      maxPerformance: 10000,
      commissionRate: 0.05,
      description: '月业绩1万以下，提点5%'
    },
    {
      level: 'V2',
      name: 'V2伙伴',
      minPerformance: 10000,
      maxPerformance: 20000,
      commissionRate: 0.06,
      continuousMonths: 2,
      description: '连续2个月业绩稳定在1万-2万，提点6%'
    },
    {
      level: 'V3',
      name: 'V3伙伴',
      minPerformance: 20000,
      maxPerformance: 40000,
      commissionRate: 0.07,
      description: '月业绩2万-4万，提点7%'
    },
    {
      level: 'V4',
      name: 'V4伙伴',
      minPerformance: 40000,
      maxPerformance: 60000,
      commissionRate: 0.08,
      description: '月业绩4万-6万，提点8%'
    },
    {
      level: 'V5',
      name: 'V5伙伴',
      minPerformance: 60000,
      maxPerformance: 80000,
      commissionRate: 0.09,
      description: '月业绩6万-8万，提点9%'
    },
    {
      level: 'V6',
      name: 'V6伙伴',
      minPerformance: 80000,
      maxPerformance: 100000,
      commissionRate: 0.10,
      description: '月业绩8万-10万及以上，提点10%'
    }
  ]
}

/**
 * 模拟的代理规则配置
 */
export const mockAgentConfig: AgentConfig = {
  id: 'agent_config_001',
  type: 'agent',
  version: 1,
  status: 'active',
  createdBy: 'admin',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  rules: [
    {
      level: 1,
      name: '初级代理',
      upgradeConditions: {
        performanceThreshold: 50000,
        timeRequirement: 3,
        referralCount: 5
      },
      permissions: ['view_leads', 'create_leads', 'view_deals', 'view_commissions'],
      commissionRate: 0.03
    },
    {
      level: 2,
      name: '中级代理',
      upgradeConditions: {
        performanceThreshold: 100000,
        timeRequirement: 6,
        referralCount: 10
      },
      permissions: ['view_leads', 'create_leads', 'edit_leads', 'view_deals', 'create_deals', 'view_agents', 'view_commissions'],
      commissionRate: 0.04
    },
    {
      level: 3,
      name: '高级代理',
      upgradeConditions: {
        performanceThreshold: 200000,
        timeRequirement: 12,
        referralCount: 20
      },
      permissions: ['view_leads', 'create_leads', 'edit_leads', 'view_deals', 'create_deals', 'view_agents', 'invite_agents', 'view_commissions', 'withdraw_commissions', 'view_reports'],
      commissionRate: 0.05
    }
  ]
}

/**
 * 模拟的返佣规则配置
 */
export const mockCommissionConfig: CommissionConfig = {
  id: 'commission_config_001',
  type: 'commission',
  version: 1,
  status: 'active',
  createdBy: 'admin',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  rules: [
    {
      type: 'tiered',
      tiers: [
        { minAmount: 0, maxAmount: 10000, rate: 0.02 },
        { minAmount: 10000, maxAmount: 50000, rate: 0.03 },
        { minAmount: 50000, maxAmount: 100000, rate: 0.04 },
        { minAmount: 100000, maxAmount: 1000000, rate: 0.05 }
      ],
      paymentTiming: 'monthly',
      maxSingleCommission: 5000,
      maxMonthlyCommission: 20000
    }
  ]
}

/**
 * 模拟的审核记录
 */
export const mockAuditRecords = [
  {
    auditId: 'audit_001',
    configType: 'level' as ConfigType,
    configId: 'level_config_002',
    submitter: 'admin',
    submittedAt: '2024-01-15T10:00:00Z',
    status: 'pending',
    auditor: null,
    auditedAt: null,
    comment: null,
    configData: mockLevelConfig
  },
  {
    auditId: 'audit_002',
    configType: 'agent' as ConfigType,
    configId: 'agent_config_002',
    submitter: 'admin',
    submittedAt: '2024-01-14T15:30:00Z',
    status: 'approved',
    auditor: 'super_admin',
    auditedAt: '2024-01-14T16:00:00Z',
    comment: '配置合理，审核通过',
    configData: mockAgentConfig
  }
]

/**
 * 模拟的配置历史记录
 */
export const mockConfigHistory = [
  {
    id: 'history_001',
    type: 'level' as ConfigType,
    version: 1,
    operation: 'create' as const,
    operator: 'admin',
    operatedAt: '2024-01-01T00:00:00Z',
    description: '创建等级规则配置',
    snapshot: mockLevelConfig
  },
  {
    id: 'history_002',
    type: 'agent' as ConfigType,
    version: 1,
    operation: 'create' as const,
    operator: 'admin',
    operatedAt: '2024-01-01T00:00:00Z',
    description: '创建代理规则配置',
    snapshot: mockAgentConfig
  },
  {
    id: 'history_003',
    type: 'commission' as ConfigType,
    version: 1,
    operation: 'create' as const,
    operator: 'admin',
    operatedAt: '2024-01-01T00:00:00Z',
    description: '创建返佣规则配置',
    snapshot: mockCommissionConfig
  }
]

/**
 * 模拟的数据同步结果
 */
export const mockDataSyncResult = {
  syncId: 'sync_001',
  configType: 'level' as ConfigType,
  configId: 'level_config_001',
  status: 'completed' as const,
  startTime: '2024-01-15T10:00:00Z',
  endTime: '2024-01-15T10:05:00Z',
  duration: 300000,
  affectedRecords: 1250,
  processedRecords: 1250,
  successCount: 1200,
  failureCount: 50,
  errors: [
    {
      recordId: 'user_001',
      error: '用户数据不完整',
      details: {}
    }
  ]
}

/**
 * 获取配置数据的辅助函数
 */
export function getMockConfigByType(type: ConfigType): SystemConfig {
  switch (type) {
    case 'level':
      return mockLevelConfig
    case 'agent':
      return mockAgentConfig
    case 'commission':
      return mockCommissionConfig
    default:
      throw new Error(`不支持的配置类型: ${type}`)
  }
}

/**
 * 生成新的配置ID
 */
export function generateConfigId(type: ConfigType): string {
  const timestamp = Date.now()
  return `${type}_config_${timestamp}`
}

/**
 * 生成新的审核ID
 */
export function generateAuditId(): string {
  const timestamp = Date.now()
  return `audit_${timestamp}`
}

/**
 * 生成新的同步ID
 */
export function generateSyncId(): string {
  const timestamp = Date.now()
  return `sync_${timestamp}`
}
