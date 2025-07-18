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
  referralCode?: string; // 添加了 referralCode 字段
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
}

// 更新代理参数（与创建代理参数相同）
export type UpdateAgentParams = CreateAgentParams; 