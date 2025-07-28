/**
 * @fileoverview 代理管理类型定义
 * 定义分销系统中代理管理相关的核心类型接口和枚举
 * 包含代理基础信息、状态管理、分类体系、业绩跟踪、权限控制和查询参数等完整功能模块
 * 集成多维度代理管理、业绩分析、趋势跟踪和权限验证等高级功能
 * 
 * @module types/agent
 * @author Frontend Team
 * @since 1.0.0
 */

/**
 * 代理状态枚举
 * 定义代理在系统中的不同状态，用于状态管理和权限控制
 * 
 * @enum {string} AgentStatus
 * 
 * 状态说明：
 * - ACTIVE: 激活状态 - 代理正常运营，所有功能可用
 * - INACTIVE: 非激活状态 - 代理暂时停止运营，功能受限
 * - PENDING: 待激活状态 - 新注册代理，等待审核激活
 * - BLOCKED: 封禁状态 - 代理违规被封禁，禁止所有操作
 * 
 * @example
 * ```typescript
 * const activeAgent: AgentStatus = AgentStatus.ACTIVE
 * const newAgent: AgentStatus = AgentStatus.PENDING
 * 
 * // 状态检查
 * function canOperate(status: AgentStatus): boolean {
 *   return status === AgentStatus.ACTIVE
 * }
 * 
 * // 状态转换
 * function activateAgent(currentStatus: AgentStatus): AgentStatus {
 *   return currentStatus === AgentStatus.PENDING ? AgentStatus.ACTIVE : currentStatus
 * }
 * ```
 */
export enum AgentStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  BLOCKED = 'blocked',
}

/**
 * 代理分类枚举
 * 定义代理的业务分类体系，用于业绩考核和奖励计算
 * 
 * @enum {string} AgentCategory
 * 
 * 分类说明：
 * - A: A类代理 - 顶级代理，业绩最优，享受最高奖励比例
 * - B: B类代理 - 优秀代理，业绩良好，享受较高奖励比例
 * - C: C类代理 - 普通代理，业绩一般，享受标准奖励比例
 * - D: D类代理 - 新手代理，业绩较低，享受基础奖励比例
 * 
 * @example
 * ```typescript
 * const topAgent: AgentCategory = AgentCategory.A
 * const newAgent: AgentCategory = AgentCategory.D
 * 
 * // 奖励比例计算
 * function getRewardRate(category: AgentCategory): number {
 *   const rates = {
 *     [AgentCategory.A]: 0.15,
 *     [AgentCategory.B]: 0.12,
 *     [AgentCategory.C]: 0.10,
 *     [AgentCategory.D]: 0.08
 *   }
 *   return rates[category]
 * }
 * ```
 */
export enum AgentCategory {
  A = 'a',
  B = 'b',
  C = 'c',
  D = 'd',
}

/**
 * 代理级别枚举
 * 定义代理的晋升级别体系，反映代理的成长路径和能力水平
 * 
 * @enum {string} AgentLevel
 * 
 * 级别说明：
 * - SV1: 初级代理 - 入门级别，基础权限
 * - SV2: 进阶代理 - 初步成长，增加部分权限
 * - SV3: 中级代理 - 中等水平，标准权限配置
 * - SV4: 高级代理 - 较高水平，扩展权限
 * - SV5: 资深代理 - 资深水平，高级权限
 * - SV6: 顶级代理 - 最高级别，完整权限
 * 
 * @example
 * ```typescript
 * const beginnerAgent: AgentLevel = AgentLevel.SV1
 * const expertAgent: AgentLevel = AgentLevel.SV6
 * 
 * // 级别权限检查
 * function hasAdvancedPermissions(level: AgentLevel): boolean {
 *   return [AgentLevel.SV5, AgentLevel.SV6].includes(level)
 * }
 * 
 * // 级别数值转换
 * function getLevelNumber(level: AgentLevel): number {
 *   return parseInt(level.substring(2))
 * }
 * ```
 */
export enum AgentLevel {
  SV1 = 'sv1',
  SV2 = 'sv2',
  SV3 = 'sv3',
  SV4 = 'sv4',
  SV5 = 'sv5',
  SV6 = 'sv6',
}

/**
 * 代理信息主接口
 * 定义分销系统中代理的完整信息结构，包含基础信息、业务状态、权限管理和关联关系
 * 支持完整的代理生命周期管理和多维度信息跟踪
 * 
 * @interface Agent
 * 
 * @example
 * ```typescript
 * const agent: Agent = {
 *   id: 'agent_001',
 *   name: '张代理',
 *   phone: '13800138000',
 *   wechatName: 'zhangdaili_wx',
 *   redBookAccount: 'zhangdaili_xhs',
 *   referrer: '李经理',
 *   referralCode: 'REF123456',
 *   category: AgentCategory.B,
 *   level: AgentLevel.SV3,
 *   status: AgentStatus.ACTIVE,
 *   isAdded: true,
 *   isPosting: true,
 *   isIntercept: false,
 *   isAttracting: true,
 *   isInGroup: true,
 *   notes: '表现优秀的代理，积极参与推广活动',
 *   addedDate: '2024-01-01',
 *   createdAt: '2024-01-01T00:00:00Z',
 *   updatedAt: '2024-01-15T12:30:00Z',
 *   groupId: 'group_001',
 *   groupName: '华东区销售组',
 *   managerId: 'manager_001',
 *   managerName: '王经理',
 *   permissions: ['view_reports', 'submit_tasks', 'manage_leads'],
 *   roles: ['agent', 'team_member']
 * }
 * 
 * // 代理状态检查
 * function isActiveAgent(agent: Agent): boolean {
 *   return agent.status === AgentStatus.ACTIVE && agent.isAdded
 * }
 * 
 * // 代理能力评估
 * function getAgentCapabilities(agent: Agent): string[] {
 *   const capabilities = []
 *   if (agent.isPosting) capabilities.push('内容发布')
 *   if (agent.isAttracting) capabilities.push('客户吸引')
 *   if (agent.isInGroup) capabilities.push('团队协作')
 *   return capabilities
 * }
 * ```
 */
export interface Agent {
  /** 代理唯一标识ID */
  id: string;
  /** 代理真实姓名 */
  name: string;
  /** 联系电话 */
  phone: string;
  /** 微信昵称或微信号 */
  wechatName: string;
  /** 小红书账号，可选 */
  redBookAccount?: string;
  /** 推荐人姓名 */
  referrer?: string;
  /** 推荐码 */
  referralCode?: string;
  /** 代理分类等级 */
  category: AgentCategory;
  /** 代理业务级别 */
  level: AgentLevel;
  /** 代理当前状态 */
  status: AgentStatus;
  /** 是否已添加到系统 */
  isAdded: boolean;
  /** 是否在发布内容 */
  isPosting: boolean;
  /** 是否设置拦截 */
  isIntercept: boolean;
  /** 是否在吸引客户 */
  isAttracting: boolean;
  /** 是否在群组中 */
  isInGroup: boolean;
  /** 备注信息 */
  notes?: string;
  /** 添加日期 */
  addedDate?: string;
  /** 记录创建时间 */
  createdAt: string;
  /** 记录最后更新时间 */
  updatedAt: string;
  
  // 权限相关字段
  /** 所属组ID */
  groupId?: string;
  /** 所属组名称 */
  groupName?: string;
  /** 管理人员ID */
  managerId?: string;
  /** 管理人员名称 */
  managerName?: string;
  /** 代理权限列表 */
  permissions?: string[];
  /** 代理角色列表 */
  roles?: string[];
}

/**
 * 趋势数据点接口
 * 定义时间序列数据的单个数据点结构，用于业绩趋势分析
 * 
 * @interface TrendDataPoint
 * 
 * @example
 * ```typescript
 * const dataPoint: TrendDataPoint = {
 *   date: '2024-01-15',
 *   value: 8500.50
 * }
 * 
 * // 数据点数组用于构建趋势图
 * const trendPoints: TrendDataPoint[] = [
 *   { date: '2024-01-01', value: 5000 },
 *   { date: '2024-01-02', value: 5500 },
 *   { date: '2024-01-03', value: 6200 }
 * ]
 * ```
 */
export interface TrendDataPoint {
  /** 日期，格式：YYYY-MM-DD */
  date: string;
  /** 数值，支持小数 */
  value: number;
}

/**
 * 趋势数据接口
 * 定义多维度业绩趋势数据结构，支持收入、客户和佣金等多个指标的时间序列分析
 * 
 * @interface TrendData
 * 
 * @example
 * ```typescript
 * const trendData: TrendData = {
 *   labels: ['2024-01-01', '2024-01-02', '2024-01-03', '2024-01-04'],
 *   revenue: [10000, 12000, 11500, 13000],
 *   clients: [25, 30, 28, 35],
 *   commission: [1500, 1800, 1725, 1950]
 * }
 * 
 * // 计算趋势增长率
 * function calculateGrowthRate(data: number[]): number {
 *   if (data.length < 2) return 0
 *   const first = data[0]
 *   const last = data[data.length - 1]
 *   return ((last - first) / first) * 100
 * }
 * 
 * const revenueGrowth = calculateGrowthRate(trendData.revenue)
 * console.log(`收入增长率: ${revenueGrowth.toFixed(2)}%`)
 * ```
 */
export interface TrendData {
  /** 日期标签数组，对应X轴 */
  labels: string[];
  /** 收入趋势数据，对应labels的时间点 */
  revenue: number[];
  /** 客户数趋势数据，对应labels的时间点 */
  clients: number[];
  /** 佣金趋势数据，对应labels的时间点 */
  commission: number[];
}

/**
 * 代理业绩数据接口
 * 定义代理的完整业绩信息，包含客户统计、收入数据、趋势分析和详细的日常表现记录
 * 支持多维度业绩评估和时间序列分析
 * 
 * @interface AgentPerformance
 * 
 * @example
 * ```typescript
 * const performance: AgentPerformance = {
 *   clientsTotal: 150,
 *   validClients: 120,
 *   invalidClients: 20,
 *   pendingClients: 10,
 *   closedDeals: 80,
 *   totalRevenue: 250000,
 *   commission: 37500,
 *   baseSalary: 8000,
 *   performance: 95.5,
 *   periodStart: '2024-01-01',
 *   periodEnd: '2024-01-31',
 *   trendData: {
 *     labels: ['Week1', 'Week2', 'Week3', 'Week4'],
 *     revenue: [60000, 65000, 62000, 63000],
 *     clients: [35, 40, 38, 37],
 *     commission: [9000, 9750, 9300, 9450]
 *   },
 *   dailyPerformance: {
 *     '2024-01-01': { clients: 5, revenue: 8000, commission: 1200 },
 *     '2024-01-02': { clients: 3, revenue: 6500, commission: 975 }
 *   }
 * }
 * 
 * // 业绩分析
 * function analyzePerformance(perf: AgentPerformance): object {
 *   const conversionRate = (perf.closedDeals / perf.validClients) * 100
 *   const avgDealValue = perf.totalRevenue / perf.closedDeals
 *   const commissionRate = (perf.commission / perf.totalRevenue) * 100
 *   
 *   return {
 *     conversionRate: conversionRate.toFixed(2) + '%',
 *     avgDealValue: avgDealValue.toFixed(2),
 *     commissionRate: commissionRate.toFixed(2) + '%',
 *     totalEarnings: perf.commission + perf.baseSalary
 *   }
 * }
 * ```
 */
export interface AgentPerformance {
  /** 客户总数 */
  clientsTotal: number;
  /** 有效客户数 */
  validClients: number;
  /** 无效客户数 */
  invalidClients: number;
  /** 待处理客户数 */
  pendingClients: number;
  /** 成交订单数 */
  closedDeals: number;
  /** 总收入金额 */
  totalRevenue: number;
  /** 佣金收入 */
  commission: number;
  /** 基础工资 */
  baseSalary: number;
  /** 业绩评分（0-100） */
  performance: number;
  /** 统计周期开始日期 */
  periodStart: string;
  /** 统计周期结束日期 */
  periodEnd: string;
  
  /** 趋势数据，用于图表展示 */
  trendData?: TrendData;
  
  /** 按日期的详细业绩数据 */
  dailyPerformance?: {
    [date: string]: {
      /** 当日客户数 */
      clients: number;
      /** 当日收入 */
      revenue: number;
      /** 当日佣金 */
      commission: number;
    }
  };
}

/**
 * 代理查询参数接口
 * 定义查询代理列表时支持的筛选和分页参数，支持多维度复合查询
 * 
 * @interface AgentQueryParams
 * 
 * @example
 * ```typescript
 * const queryParams: AgentQueryParams = {
 *   page: 1,
 *   pageSize: 20,
 *   keyword: '张',
 *   status: AgentStatus.ACTIVE,
 *   category: AgentCategory.A,
 *   level: AgentLevel.SV3,
 *   isAdded: true,
 *   isPosting: true,
 *   isIntercept: false,
 *   isAttracting: true,
 *   isInGroup: true,
 *   groupId: 'group_001',
 *   managerId: 'manager_001',
 *   startDate: '2024-01-01',
 *   endDate: '2024-01-31'
 * }
 * 
 * // 构建查询条件
 * function buildQueryConditions(params: AgentQueryParams): object {
 *   const conditions: any = {}
 *   if (params.status) conditions.status = params.status
 *   if (params.category) conditions.category = params.category
 *   if (params.level) conditions.level = params.level
 *   if (params.keyword) {
 *     conditions.$or = [
 *       { name: { $regex: params.keyword, $options: 'i' } },
 *       { phone: { $regex: params.keyword } },
 *       { wechatName: { $regex: params.keyword, $options: 'i' } }
 *     ]
 *   }
 *   return conditions
 * }
 * ```
 */
export interface AgentQueryParams {
  /** 页码，从1开始 */
  page: number;
  /** 每页数量 */
  pageSize: number;
  /** 搜索关键词，匹配姓名、电话、微信名 */
  keyword?: string;
  /** 代理状态筛选 */
  status?: AgentStatus;
  /** 代理分类筛选 */
  category?: AgentCategory;
  /** 代理级别筛选 */
  level?: AgentLevel;
  /** 是否已添加筛选 */
  isAdded?: boolean;
  /** 是否在发布内容筛选 */
  isPosting?: boolean;
  /** 是否设置拦截筛选 */
  isIntercept?: boolean;
  /** 是否在吸引客户筛选 */
  isAttracting?: boolean;
  /** 是否在群组中筛选 */
  isInGroup?: boolean;
  /** 按组ID筛选 */
  groupId?: string;
  /** 按管理人ID筛选 */
  managerId?: string;
  /** 创建时间范围-开始日期 */
  startDate?: string;
  /** 创建时间范围-结束日期 */
  endDate?: string;
}

/**
 * 创建代理参数接口
 * 定义创建新代理时需要提供的完整信息
 * 
 * @interface CreateAgentParams
 * 
 * @example
 * ```typescript
 * const newAgentData: CreateAgentParams = {
 *   name: '王代理',
 *   phone: '13900139000',
 *   wechatName: 'wangdaili_wx',
 *   redBookAccount: 'wangdaili_xhs',
 *   referrer: '李经理',
 *   category: AgentCategory.C,
 *   level: AgentLevel.SV1,
 *   isAdded: true,
 *   isPosting: false,
 *   isIntercept: false,
 *   isAttracting: true,
 *   isInGroup: false,
 *   notes: '新加入的代理，需要培训',
 *   groupId: 'group_002',
 *   managerId: 'manager_002'
 * }
 * 
 * // 数据验证
 * function validateCreateParams(params: CreateAgentParams): boolean {
 *   return params.name.trim().length > 0 &&
 *          /^1[3-9]\d{9}$/.test(params.phone) &&
 *          params.wechatName.trim().length > 0
 * }
 * ```
 */
export interface CreateAgentParams {
  /** 代理真实姓名，必填 */
  name: string;
  /** 联系电话，必填 */
  phone: string;
  /** 微信昵称或微信号，必填 */
  wechatName: string;
  /** 小红书账号，可选 */
  redBookAccount?: string;
  /** 推荐人姓名，可选 */
  referrer?: string;
  /** 代理分类等级 */
  category: AgentCategory;
  /** 代理业务级别 */
  level: AgentLevel;
  /** 是否已添加到系统 */
  isAdded: boolean;
  /** 是否在发布内容 */
  isPosting: boolean;
  /** 是否设置拦截 */
  isIntercept: boolean;
  /** 是否在吸引客户 */
  isAttracting: boolean;
  /** 是否在群组中 */
  isInGroup: boolean;
  /** 备注信息，可选 */
  notes?: string;
  /** 所属组ID，可选 */
  groupId?: string;
  /** 管理人员ID，可选 */
  managerId?: string;
}

/**
 * 更新代理参数类型
 * 与创建代理参数结构相同，用于代理信息更新操作
 * 
 * @typedef {CreateAgentParams} UpdateAgentParams
 * 
 * @example
 * ```typescript
 * const updateData: UpdateAgentParams = {
 *   name: '王代理（已认证）',
 *   phone: '13900139000',
 *   wechatName: 'wangdaili_verified',
 *   category: AgentCategory.B, // 升级到B类
 *   level: AgentLevel.SV2,     // 晋升到SV2
 *   isPosting: true,           // 开始发布内容
 *   // ... 其他字段
 * }
 * ```
 */
export type UpdateAgentParams = CreateAgentParams;

/**
 * 代理业绩查询参数接口
 * 定义查询代理业绩数据时的参数选项，支持多种时间维度和数据详细程度控制
 * 
 * @interface AgentPerformanceQueryParams
 * 
 * @example
 * ```typescript
 * // 查询本月业绩（包含趋势）
 * const monthlyQuery: AgentPerformanceQueryParams = {
 *   period: 'month',
 *   includeTrend: true
 * }
 * 
 * // 查询自定义时间范围
 * const customQuery: AgentPerformanceQueryParams = {
 *   startDate: '2024-01-01',
 *   endDate: '2024-01-31',
 *   includeTrend: false
 * }
 * 
 * // 查询季度数据
 * const quarterlyQuery: AgentPerformanceQueryParams = {
 *   period: 'quarter',
 *   includeTrend: true
 * }
 * ```
 */
export interface AgentPerformanceQueryParams {
  /** 预定义时间周期，与自定义日期范围二选一 */
  period?: 'day' | 'week' | 'month' | 'quarter' | 'year';
  /** 自定义开始日期，格式：YYYY-MM-DD */
  startDate?: string;
  /** 自定义结束日期，格式：YYYY-MM-DD */
  endDate?: string;
  /** 是否包含趋势数据，影响返回数据量 */
  includeTrend?: boolean;
}

/**
 * 代理列表状态接口
 * 定义代理列表页面的完整状态，包含筛选条件、分页信息和选择状态
 * 用于前端状态管理和用户交互控制
 * 
 * @interface AgentListState
 * 
 * @example
 * ```typescript
 * const listState: AgentListState = {
 *   filters: {
 *     keyword: '张',
 *     status: 'active',
 *     category: 'a',
 *     level: 'sv3',
 *     isAdded: true,
 *     isPosting: true,
 *     isIntercept: false,
 *     isAttracting: true,
 *     isInGroup: true,
 *     groupId: 'group_001',
 *     managerId: 'manager_001',
 *     startDate: '2024-01-01',
 *     endDate: '2024-01-31'
 *   },
 *   pagination: {
 *     page: 1,
 *     pageSize: 20
 *   },
 *   selectedAgents: ['agent_001', 'agent_002', 'agent_003']
 * }
 * 
 * // 状态重置
 * function resetListState(): Partial<AgentListState> {
 *   return {
 *     filters: {
 *       keyword: '',
 *       status: '',
 *       category: '',
 *       level: '',
 *       isAdded: false,
 *       isPosting: false,
 *       isIntercept: false,
 *       isAttracting: false,
 *       isInGroup: false
 *     },
 *     pagination: { page: 1, pageSize: 20 },
 *     selectedAgents: []
 *   }
 * }
 * ```
 */
export interface AgentListState {
  /** 筛选条件集合 */
  filters: {
    /** 搜索关键词 */
    keyword: string;
    /** 状态筛选 */
    status: string;
    /** 分类筛选 */
    category: string;
    /** 级别筛选 */
    level: string;
    /** 是否已添加筛选 */
    isAdded: boolean;
    /** 是否在发布内容筛选 */
    isPosting: boolean;
    /** 是否设置拦截筛选 */
    isIntercept: boolean;
    /** 是否在吸引客户筛选 */
    isAttracting: boolean;
    /** 是否在群组中筛选 */
    isInGroup: boolean;
    /** 组ID筛选，可选 */
    groupId?: string;
    /** 管理人ID筛选，可选 */
    managerId?: string;
    /** 开始日期筛选，可选 */
    startDate?: string;
    /** 结束日期筛选，可选 */
    endDate?: string;
  };
  /** 分页信息 */
  pagination: {
    /** 当前页码 */
    page: number;
    /** 每页数量 */
    pageSize: number;
  };
  /** 选中的代理ID列表，用于批量操作 */
  selectedAgents: string[];
} 