// 代理状态枚举
export enum AgentStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  BLOCKED = 'blocked',
}

// 代理属性枚举
export enum AgentCategory {
  A = 'a',
  B = 'b',
  C = 'c',
  D = 'd',
}

// 代理级别枚举
export enum AgentLevel {
  SV1 = 'sv1',
  SV2 = 'sv2',
  SV3 = 'sv3',
  SV4 = 'sv4',
  SV5 = 'sv5',
  SV6 = 'sv6',
}

// 代理接口定义
export interface Agent {
  id: string;
  name: string;
  phone: string;
  wechatName: string;
  redBookAccount?: string;
  referrer?: string;
  referralCode?: string;
  category: AgentCategory;
  level: AgentLevel;
  status: AgentStatus;
  isAdded: boolean;
  isPosting: boolean;
  isIntercept: boolean;
  isAttracting: boolean;
  isInGroup: boolean;
  notes?: string;
  addedDate?: string;
  createdAt: string;
  updatedAt: string;
  
  // 权限相关字段
  groupId?: string;  // 所属组ID
  groupName?: string;  // 所属组名称
  managerId?: string;  // 管理人员ID
  managerName?: string;  // 管理人员名称
  permissions?: string[];  // 代理权限列表
  roles?: string[];  // 代理角色列表
}

// 趋势数据点接口
export interface TrendDataPoint {
  date: string;  // 日期
  value: number;  // 数值
}

// 趋势数据接口
export interface TrendData {
  labels: string[];  // 日期标签
  revenue: number[];  // 收入趋势
  clients: number[];  // 客户数趋势
  commission: number[];  // 佣金趋势
}

// 代理业绩数据接口
export interface AgentPerformance {
  clientsTotal: number;
  validClients: number;
  invalidClients: number;
  pendingClients: number;
  closedDeals: number;
  totalRevenue: number;
  commission: number;
  baseSalary: number;
  performance: number;
  periodStart: string;
  periodEnd: string;
  
  // 趋势数据
  trendData?: TrendData;
  
  // 按日期的详细数据
  dailyPerformance?: {
    [date: string]: {
      clients: number;
      revenue: number;
      commission: number;
    }
  };
}

// 代理查询参数
export interface AgentQueryParams {
  page: number;
  pageSize: number;
  keyword?: string;
  status?: AgentStatus;
  category?: AgentCategory;
  level?: AgentLevel;
  isAdded?: boolean;
  isPosting?: boolean;
  isIntercept?: boolean;
  isAttracting?: boolean;
  isInGroup?: boolean;
  groupId?: string;  // 按组筛选
  managerId?: string;  // 按管理人筛选
  startDate?: string;  // 开始日期
  endDate?: string;  // 结束日期
}

// 创建代理参数
export interface CreateAgentParams {
  name: string;
  phone: string;
  wechatName: string;
  redBookAccount?: string;
  referrer?: string;
  category: AgentCategory;
  level: AgentLevel;
  isAdded: boolean;
  isPosting: boolean;
  isIntercept: boolean;
  isAttracting: boolean;
  isInGroup: boolean;
  notes?: string;
  groupId?: string;  // 所属组ID
  managerId?: string;  // 管理人员ID
}

// 更新代理参数（与创建代理参数相同）
export type UpdateAgentParams = CreateAgentParams;

// 代理业绩查询参数
export interface AgentPerformanceQueryParams {
  period?: 'day' | 'week' | 'month' | 'quarter' | 'year';  // 时间周期
  startDate?: string;  // 开始日期
  endDate?: string;  // 结束日期
  includeTrend?: boolean;  // 是否包含趋势数据
}

// 列表状态接口定义
export interface AgentListState {
  filters: {
    keyword: string;
    status: string;
    category: string;
    level: string;
    isAdded: boolean;
    isPosting: boolean;
    isIntercept: boolean;
    isAttracting: boolean;
    isInGroup: boolean;
    groupId?: string;
    managerId?: string;
    startDate?: string;
    endDate?: string;
  };
  pagination: {
    page: number;
    pageSize: number;
  };
  selectedAgents: string[];  // 选中的代理ID列表
} 