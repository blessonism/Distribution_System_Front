import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'
import request from '@/utils/request'
import { realAgentsData } from './agentData'
import type { Lead, LeadStatus } from '@/types/lead'
import allPersonnel from './personnelData';
import dayjs from 'dayjs';
import { mockInvitationCodes, mockInvitationHistory, mockInvitationStats } from './invitationData'
import {
  mockPromotionTasks,
  mockAuditStatsData,
  generateMockAuditHistory,
  filterTasksByPermission,
  filterTasksByParams,
  getMockTaskDetail,
  updateTaskStatus,
  mockSubmitTask,
  mockGetAgentTaskList,
  mockGetAgentTaskStats,
  mockRecognizePlatform
} from './promotionData'
import {
  generateMockLeads,
  generateMockAuditRecords,
  generateMockDuplicateCheck,
  generateMockSourceDetection,
  generateMockReferralCodeValidation,
  generateMockAuditStatistics,
  generateMockBatchAuditResult,
  mockSalespersons,
  mockSources
} from './leadData'
import {
  mockLevelConfig,
  mockAgentConfig,
  mockCommissionConfig,
  mockAuditRecords,
  mockConfigHistory,
  mockDataSyncResult,
  getMockConfigByType,
  generateConfigId,
  generateAuditId,
  generateSyncId
} from './systemConfigData'

interface TrendData {
  labels: string[];
  revenue: number[];
  clients: number[];
  commission: number[];
}

interface AgentPerformance {
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
  trendData?: TrendData; // 新增趋势数据属性
}

export function setupMockApi() {
  console.log('[Mock] 开始设置axios-mock-adapter...')
  try {
    // 创建一个MockAdapter实例，使用项目中的request实例而不是全局axios实例
    const mock = new MockAdapter(request, { delayResponse: 500 })
    console.log('[Mock] axios-mock-adapter创建成功')

    // 检查realAgentsData是否成功导入
    if (realAgentsData && Array.isArray(realAgentsData)) {
      console.log(`[Mock] 成功加载代理数据: ${realAgentsData.length}条`)
    } else {
      console.error('[Mock] 警告: realAgentsData导入失败或不是数组', realAgentsData)
    }
    
    // 检查邀请数据是否成功导入
    if (mockInvitationCodes && Array.isArray(mockInvitationCodes)) {
      console.log(`[Mock] 成功加载邀请码数据: ${mockInvitationCodes.length}条`)
    }

    // 定义测试用户数据
    const testUsers = {
      'director_test': {
        id: 'user_001',
        username: 'director_test',
        password: 'Director123!',
        nickname: '张总监',
        email: 'director@company.com',
        role: 'director',
        status: 'active',
        departmentId: 'dept_001',
        token: 'mock-token-director',
        permissions: ['*'], // 全部权限
        dataScope: 'ALL', // 全部数据权限
        modules: ['dashboard', 'user-management', 'agent-management', 'lead-management', 'system-config', 'invitation-history', 'promotion-audit']
      },
      'leader_test': {
        id: 'user_002',
        username: 'leader_test',
        password: 'Leader123!',
        nickname: '李组长',
        email: 'leader@company.com',
        role: 'leader',
        status: 'active',
        departmentId: 'dept_002',
        teamId: 'team_001',
        token: 'mock-token-leader',
        permissions: ['dashboard', 'user-management-dept', 'agent-management-team', 'lead-management', 'promotion-audit'],
        dataScope: 'DEPARTMENT', // 部门数据权限
        subordinates: ['user_003', 'user_004'], // 管理的销售
        agentSubordinates: ['user_005', 'user_006', 'user_007'], // 管理的3级代理
        modules: ['dashboard', 'user-management', 'agent-management', 'lead-management', 'promotion-audit']
      },
      'sales_test': {
        id: 'user_003',
        username: 'sales_test',
        password: 'Sales123!',
        nickname: '王销售',
        email: 'sales@company.com',
        role: 'sales',
        status: 'active',
        departmentId: 'dept_002',
        parentId: 'user_002', // 上级组长
        token: 'mock-token-sales-test',
        permissions: ['dashboard', 'agent-management-3-level', 'lead-management', 'promotion-audit'],
        dataScope: 'AGENT_3_LEVEL', // 3级代理数据权限
        agentSubordinates: ['user_008', 'user_009', 'user_010'], // 发展的3级代理
        modules: ['dashboard', 'agent-management', 'lead-management', 'promotion-audit']
      },
      'agent_test': {
        id: 'user_008',
        username: 'agent_test',
        password: 'Agent123!',
        nickname: '赵代理',
        email: 'agent@company.com',
        role: 'agent',
        status: 'active',
        parentSalesId: 'user_003', // 上级销售
        agentLevel: 3,
        token: 'mock-token-agent',
        permissions: ['lead-management-readonly', 'invitation-management', 'promotion-management'],
        dataScope: 'PERSONAL', // 个人数据权限
        modules: ['lead-management', 'invitation-management', 'promotion-management']
      },
      // 保留原有用户以兼容性
      'admin': {
        id: 1,
        username: 'admin',
        password: 'admin123',
        nickname: '系统管理员',
        email: 'admin@example.com',
        role: 'super_admin',
        status: 'active',
        token: 'mock-token-admin',
        permissions: ['*'],
        dataScope: 'ALL',
        modules: ['*']
      },
      'sales': {
        id: 2,
        username: 'sales',
        password: 'sales123',
        nickname: '销售人员',
        email: 'sales@example.com',
        role: 'sales',
        status: 'active',
        token: 'mock-token-sales',
        permissions: ['dashboard', 'lead', 'deal'],
        dataScope: 'PERSONAL',
        modules: ['dashboard', 'lead-management', 'deal-management']
      }
    }

    // 模拟登录API
    mock.onPost('/auth/login').reply((config) => {
      console.log('[Mock API] 请求登录', config.data)
      const { username, password } = JSON.parse(config.data)
      
      // 查找匹配的用户
      const user = testUsers[username as keyof typeof testUsers]
      
      if (user && user.password === password) {
        return [
          200, 
          {
            code: 200,
            success: true,
            data: {
              token: user.token,
              user: {
                id: user.id,
                username: user.username,
                nickname: user.nickname,
                email: user.email,
                role: user.role,
                status: user.status,
                avatar: '',
                departmentId: user.departmentId || null,
                teamId: user.teamId || null,
                parentId: user.parentId || null,
                agentLevel: user.agentLevel || null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              },
              permissions: user.permissions,
            }
          }
        ]
      }
      
      return [
        401, 
        {
          code: 401,
          success: false,
          message: '用户名或密码错误',
          data: null
        }
      ]
    })

    // 模拟获取用户信息API
    mock.onGet('/user/profile').reply((config) => {
      // 从请求头获取token
      const token = config.headers?.Authorization?.replace('Bearer ', '')
      
      // 查找匹配token的用户
      const user = Object.values(testUsers).find(u => u.token === token)
      
      if (user) {
        return [
          200,
          {
            code: 200,
            success: true,
            data: {
              user: {
                id: user.id,
                username: user.username,
                nickname: user.nickname,
                email: user.email,
                role: user.role,
                status: user.status,
                avatar: '',
                departmentId: user.departmentId || null,
                teamId: user.teamId || null,
                parentId: user.parentId || null,
                agentLevel: user.agentLevel || null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              },
              permissions: user.permissions,
            }
          }
        ]
      }
      
      return [
        401,
        {
          code: 401,
          success: false,
          message: '身份验证失败',
          data: null
        }
      ]
    })

    // 模拟客资API - 使用新的Mock数据生成器
    const leads: Lead[] = generateMockLeads(100) // 生成100条Mock客资数据

    // 模拟获取客资列表
    mock.onGet('/leads/all').reply((config) => {
      console.log('Mock API /leads/all triggered with params:', config.params)

      const { page = 1, pageSize = 10, name = '', status = '', source = '', salespersonId = '' } = config.params || {}
      const pageNum = parseInt(page, 10)
      const size = parseInt(pageSize, 10)

      // 应用筛选条件
      let filteredLeads = [...leads]
      
      // 按姓名筛选
      if (name) {
        filteredLeads = filteredLeads.filter(lead => 
          lead.name.includes(name)
        )
      }
      
      // 按状态筛选
      if (status && status !== 'all') {
        filteredLeads = filteredLeads.filter(lead => 
          lead.status === status
        )
      }
      
      // 按来源筛选
      if (source && source !== 'all') {
        filteredLeads = filteredLeads.filter(lead => 
          lead.source === source
        )
      }
      
      // 按销售人员筛选
      if (salespersonId && salespersonId !== 'all') {
        filteredLeads = filteredLeads.filter(lead => 
          lead.salespersonId === salespersonId
        )
      }
      
      // 分页
      const start = (pageNum - 1) * size
      const end = start + size
      const paginatedLeads = filteredLeads.slice(start, end)

      return [
        200,
        {
          code: 0,
          message: '成功',
          data: {
            list: paginatedLeads,
            total: filteredLeads.length // 返回过滤后的总数，而不是全部数据的总数
          }
        }
      ]
    })

    // 模拟分配客资
    mock.onPut(/\/leads\/(.*)\/assign/).reply(200, {
      code: 0,
      message: '分配成功',
      data: null
    })

    // 模拟更新客资状态
    mock.onPut(/\/leads\/(.*)\/status/).reply((config) => {
      const leadId = config.url?.match(/\/leads\/(.*)\/status/)?.[1]
      const { status } = JSON.parse(config.data)
      
      if (leadId) {
        const leadIndex = leads.findIndex(lead => lead.id === leadId)
        if (leadIndex !== -1) {
          leads[leadIndex].status = status
        }
      }
      
      return [
        200,
        {
          code: 0,
          message: '状态更新成功',
          data: null
        }
      ]
    })
    
    // 模拟创建客资
    mock.onPost('/leads/create').reply((config) => {
      const leadData = JSON.parse(config.data)

      // 获取销售人员信息
      const salesperson = mockSalespersons.find(s => s.id === leadData.salespersonId) || mockSalespersons[0]

      // 创建新客资
      const newLead: Lead = {
        id: `LID_${String(leads.length + 1).padStart(4, '0')}`,
        name: leadData.name,
        phone: leadData.phone,
        status: 'PENDING' as LeadStatus,
        source: leadData.source || '搜索引擎',
        salespersonId: salesperson.id,
        salespersonName: salesperson.name,
        createdAt: new Date().toISOString(),
        auditStatus: 'PENDING_AUDIT', // 新增必需字段
        wechatId: leadData.wechatId,
        notes: leadData.notes,
        sourceDetail: leadData.sourceDetail,
        referralCode: leadData.referralCode,
        utmSource: leadData.utmSource,
        utmMedium: leadData.utmMedium,
        utmCampaign: leadData.utmCampaign,
        referrer: leadData.referrer,
        updatedAt: new Date().toISOString(),
        version: 1
      }

      // 添加到数据列表
      leads.unshift(newLead)

      return [
        200,
        {
          code: 0,
          message: '创建成功',
          data: newLead
        }
      ]
    })
    
    // 模拟更新客资
    mock.onPut(/\/leads\/([^/]+)$/).reply((config) => {
      const leadId = config.url?.match(/\/leads\/([^/]+)$/)?.[1]
      const leadData = JSON.parse(config.data)

      if (leadId) {
        const leadIndex = leads.findIndex(lead => lead.id === leadId)
        if (leadIndex !== -1) {
          // 获取销售人员信息
          const salesperson = mockSalespersons.find(s => s.id === leadData.salespersonId)

          // 更新客资信息
          leads[leadIndex] = {
            ...leads[leadIndex],
            name: leadData.name || leads[leadIndex].name,
            phone: leadData.phone || leads[leadIndex].phone,
            status: leadData.status || leads[leadIndex].status,
            source: leadData.source || leads[leadIndex].source,
            salespersonId: salesperson?.id || leads[leadIndex].salespersonId,
            salespersonName: salesperson?.name || leads[leadIndex].salespersonName,
            wechatId: leadData.wechatId !== undefined ? leadData.wechatId : leads[leadIndex].wechatId,
            notes: leadData.notes !== undefined ? leadData.notes : leads[leadIndex].notes,
            updatedAt: new Date().toISOString(),
            version: (leads[leadIndex].version || 1) + 1
          }

          return [
            200,
            {
              code: 0,
              message: '更新成功',
              data: leads[leadIndex]
            }
          ]
        }
      }

      return [
        404,
        {
          code: 404,
          message: '客资不存在',
          data: null
        }
      ]
    })

    // 模拟用户列表API
    mock.onGet('/users').reply((config) => {
      const { page = 1, page_size = 10 } = config.params || {};
      
      const users = Array.from({ length: 10 }, (_, i) => {
        const index = (page - 1) * page_size + i;
        return {
          id: `${index + 1}`,
          username: `user${index + 1}`,
          nickname: `用户${index + 1}`,
          email: `user${index + 1}@example.com`,
          phone: `1381234${String(index).padStart(4, '0')}`,
          role: index === 0 ? 'super_admin' : index < 3 ? 'leader' : 'sales',
          status: index % 3 === 0 ? 'inactive' : 'active',
          level: Math.floor(Math.random() * 6) + 1,
          commission_rate: 5 + (index % 6),
          created_at: new Date(Date.now() - index * 86400000).toISOString(),
          updated_at: new Date(Date.now() - index * 86400000).toISOString(),
        };
      });
      
      console.log('Mock API: 返回用户列表，参数:', config.params);
      
      return [
        200, 
        {
          code: 200,
          success: true,
          data: {
            items: users,
            total: 25,
            page: Number(page),
            page_size: Number(page_size)
          }
        }
      ];
    });

    // 模拟代理API
    // 1. 获取代理列表
    mock.onGet('/agents').reply((config) => {
      const { page = 1, pageSize = 10, keyword = '', status = '', category = '', level = '' } = config.params || {};
      
      // 从真实数据中筛选
      let filteredAgents = [...realAgentsData];
      
      // 应用筛选条件
      if (keyword) {
        const lowerKeyword = keyword.toLowerCase();
        filteredAgents = filteredAgents.filter(agent => 
          agent.name.toLowerCase().includes(lowerKeyword) ||
          agent.phone.includes(lowerKeyword) ||
          agent.wechatName.toLowerCase().includes(lowerKeyword)
        );
      }
      
      if (status) {
        filteredAgents = filteredAgents.filter(agent => agent.status === status);
      }
      
      if (category) {
        filteredAgents = filteredAgents.filter(agent => agent.category === category);
      }
      
      if (level) {
        filteredAgents = filteredAgents.filter(agent => agent.level === level);
      }
      
      // 应用标记筛选
      if (config.params?.isAdded) {
        filteredAgents = filteredAgents.filter(agent => agent.isAdded);
      }
      
      if (config.params?.isPosting) {
        filteredAgents = filteredAgents.filter(agent => agent.isPosting);
      }
      
      if (config.params?.isIntercept) {
        filteredAgents = filteredAgents.filter(agent => agent.isIntercept);
      }
      
      if (config.params?.isAttracting) {
        filteredAgents = filteredAgents.filter(agent => agent.isAttracting);
      }
      
      if (config.params?.isInGroup) {
        filteredAgents = filteredAgents.filter(agent => agent.isInGroup);
      }
      
      // 计算总数
      const total = filteredAgents.length;
      
      // 分页
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + Number(pageSize);
      const pagedAgents = filteredAgents.slice(startIndex, endIndex);
      
      console.log('Mock API: 返回代理列表，参数:', config.params, '结果数量:', pagedAgents.length);
      
      return [
        200,
        {
          code: 200,
          success: true,
          data: {
            data: pagedAgents,
            total: total,
            page: Number(page),
            pageSize: Number(pageSize)
          }
        }
      ];
    });
    
    // 2. 获取单个代理详情
    mock.onGet(/\/agents\/[^\/]+$/).reply((config) => {
      const id = config.url?.split('/').pop() || '';
      
      // 从真实数据中查找
      const agent = realAgentsData.find(a => a.id === id);
      
      if (agent) {
        return [
          200,
          {
            code: 200,
            success: true,
            data: agent
          }
        ];
      }
      
      // 如果找不到，返回404
      return [
        404,
        {
          code: 404,
          success: false,
          message: '代理不存在'
        }
      ];
    });
    
    // 定义一个函数用于生成趋势数据
    function generateMockTrendData(period: string): TrendData {
      const now = new Date();
      let dataPoints = 0;
      let dateFormat = '';
      
      // 根据周期决定数据点数量和日期格式
      switch (period) {
        case 'week':
          dataPoints = 7; // 一周7天
          dateFormat = 'MM-DD'; // 月-日
          break;
        case 'month':
          dataPoints = 30; // 一个月约30天
          dateFormat = 'MM-DD'; // 月-日
          break;
        case 'quarter':
          dataPoints = 12; // 一个季度约12周
          dateFormat = 'MM-DD'; // 月-日
          break;
        case 'year':
          dataPoints = 12; // 一年12个月
          dateFormat = 'YYYY-MM'; // 年-月
          break;
        default:
          dataPoints = 30; // 默认月视图
          dateFormat = 'MM-DD';
      }
      
      // 创建标签数组
      const labels: string[] = [];
      for (let i = 0; i < dataPoints; i++) {
        const date = new Date(now);
        
        if (period === 'week') {
          date.setDate(date.getDate() - (dataPoints - 1) + i);
        } else if (period === 'month') {
          date.setDate(date.getDate() - (dataPoints - 1) + i);
        } else if (period === 'quarter') {
          date.setDate(date.getDate() - (dataPoints - 1) * 7 + i * 7);
        } else if (period === 'year') {
          date.setMonth(date.getMonth() - (dataPoints - 1) + i);
        }
        
        labels.push(dayjs(date).format(dateFormat));
      }
      
      // 随机生成营收、客户和佣金数据
      const revenue: number[] = [];
      const clients: number[] = [];
      const commission: number[] = [];
      
      for (let i = 0; i < dataPoints; i++) {
        revenue.push(Math.floor(Math.random() * 10000) + 1000);
        clients.push(Math.floor(Math.random() * 30));
        commission.push(Math.floor(Math.random() * 1000) + 100);
      }
      
      return {
        labels,
        revenue,
        clients,
        commission
      };
    }
    
    // 3. 获取代理业绩数据
    mock.onGet(/\/agents\/[^\/]+\/performance/).reply((config) => {
      const id = config.url?.split('/')[2];
      
      // 直接从config.params获取参数，而不是解析URL
      const period = config.params?.period || 'month';
      const includeTrend = !!config.params?.includeTrend; // 转为布尔值
      
      console.log('[Mock] 请求代理业绩数据:', id, '参数:', { 
        period, 
        includeTrend,
        'originalParamsObject': config.params,
        'originalURL': config.url
      });
      
      // 随机生成业绩数据
      const performance: AgentPerformance = {
        clientsTotal: Math.floor(Math.random() * 50) + 20,
        validClients: Math.floor(Math.random() * 30) + 10,
        invalidClients: Math.floor(Math.random() * 15) + 5,
        pendingClients: Math.floor(Math.random() * 10) + 3,
        closedDeals: Math.floor(Math.random() * 20) + 10,
        totalRevenue: Math.floor(Math.random() * 50000) + 10000,
        commission: Math.floor(Math.random() * 3000) + 1000,
        baseSalary: 1000,
        performance: Math.floor(Math.random() * 2000) + 500,
        periodStart: dayjs().subtract(1, 'month').toISOString(),
        periodEnd: dayjs().toISOString()
      };
      
      // 如果请求包含趋势数据，生成并添加
      if (includeTrend) {
        // 使用类型断言添加trendData
        (performance as any).trendData = generateMockTrendData(period);
        console.log('[Mock] 生成业绩趋势数据:', period, (performance as any).trendData);
      } else {
        console.log('[Mock] 不包含趋势数据的请求');
      }
      
      // 确保非空返回
      return [
        200,
        {
          code: 200,
          success: true,
          data: performance
        }
      ];
    });

    // 模拟仪表盘统计数据API
    mock.onGet('/dashboard/stats').reply(() => {
      console.log('Mock API: 请求dashboard/stats');
      
      const data = {
        today: {
          leadCount: 85,
          dealCount: 12,
          salesAmount: 26500,
          agentCount: 33,
          validLeadCount: 56,
          commissionAmount: 1250
        },
        thisWeek: {
          leadCount: 420,
          dealCount: 65,
          salesAmount: 154200,
        },
        thisMonth: {
          leadCount: 1280,
          dealCount: 187,
          salesAmount: 458600,
        },
        pending: {
          promotionAuditCount: 27,
          leadAssignCount: 35,
          dealConfirmCount: 12
        }
      };
      
      return [
        200, 
        {
          code: 200,
          success: true,
          data: data
        }
      ];
    });

    // 模拟仪表盘图表数据API
    mock.onGet('/dashboard/charts').reply(() => {
      console.log('Mock API: 请求dashboard/charts');
      
      const data = {
        // 代理数量趋势
        agentTrend: Array.from({ length: 30 }, (_, i) => ({
          date: `${new Date().getMonth() + 1}/${i + 1}`,
          count: 100 + Math.floor(Math.random() * 50),
          activeCount: 70 + Math.floor(Math.random() * 30)
        })),
        
        // 客资来源分布
        leadSourceDistribution: [
          { source: '小红书', value: 35 },
          { source: '微信', value: 28 },
          { source: '朋友介绍', value: 22 },
          { source: '其他渠道', value: 15 }
        ],
        
        // 成交金额统计
        dealAmountStats: Array.from({ length: 12 }, (_, i) => ({
          month: `${i + 1}月`,
          amount: 20000 + Math.floor(Math.random() * 60000)
        })),
        
        // 代理等级分布
        agentLevelDistribution: [
          { level: 'SV1', count: 45 },
          { level: 'SV2', count: 32 },
          { level: 'SV3', count: 18 },
          { level: 'SV4', count: 12 },
          { level: 'SV5', count: 8 },
          { level: 'SV6', count: 3 }
        ],
        
        // 客资状态分布
        leadStatusDistribution: [
          { status: '未添加', count: 45 },
          { status: '已成交', count: 32 },
          { status: '未回复', count: 25 },
          { status: '已流失', count: 15 },
          { status: '考虑中', count: 30 },
          { status: '周内给答复', count: 18 }
        ]
      };
      
      return [
        200, 
        {
          code: 200,
          success: true,
          data: data
        }
      ];
    });

    // 新增人员层级关系 mock
    mock.onGet('/api/users/hierarchy').reply(config => {
      const parentId = config.params?.parentId || null;
      const children = allPersonnel.filter(p => p.parentId === parentId);
      
      console.log('Mock API: 返回人员层级关系，参数:', config.params, '结果数量:', children.length);
      
      // 模拟网络延迟
      return new Promise(resolve => {
        setTimeout(() => {
          resolve([
            200, 
            {
              code: 200,
              success: true,
              data: children
            }
          ]);
        }, 500);
      });
    });

    // 邀请系统相关API mock
    // 获取邀请码列表
    mock.onGet('/invitation/codes').reply((config) => {
      const token = config.headers?.Authorization
      const currentUser = Object.values(testUsers).find(u => u.token === token)
      const userId = currentUser?.id || '1'
      
      // 根据用户ID过滤邀请码
      const userCodes = mockInvitationCodes.filter(code => code.userId === userId)
      
      return [
        200,
        {
          code: 200,
          success: true,
          message: "获取邀请码成功",
          data: userCodes
        }
      ]
    })
    
    // 获取邀请统计信息
    mock.onGet('/invitation/stats').reply((config) => {
      // 这里可以根据query参数过滤统计数据
      const { timeRange } = config.params || {}
      
      // 示例：根据timeRange过滤数据
      let filteredStats = { ...mockInvitationStats }
      
      if (timeRange) {
        const startDate = timeRange === 'week' ? dayjs().subtract(7, 'day') :
                         timeRange === 'month' ? dayjs().subtract(30, 'day') :
                         timeRange === 'quarter' ? dayjs().subtract(90, 'day') :
                         dayjs().subtract(365, 'day')
        
        const filteredInvites = mockInvitationHistory.filter(invite => 
          dayjs(invite.registeredAt).isAfter(startDate)
        )
        
        filteredStats = {
          ...filteredStats,
          totalInvites: filteredInvites.length,
          recentInvites: filteredInvites.slice(0, 5)
        }
      }
      
      return [
        200,
        {
          code: 200,
          success: true,
          message: "获取统计数据成功",
          data: filteredStats
        }
      ]
    })
    
    // 获取邀请历史
    mock.onGet('/invitation/history').reply((config) => {
      const { page = 1, pageSize = 20 } = config.params || {}
      
      // 分页处理
      const start = (page - 1) * pageSize
      const end = start + pageSize
      const paginatedHistory = mockInvitationHistory.slice(start, end)
      
      const responseData = {
        list: paginatedHistory,
        total: mockInvitationHistory.length,
        page: Number(page),
        pageSize: Number(pageSize),
        totalPages: Math.ceil(mockInvitationHistory.length / pageSize)
      }
      
      return [
        200,
        {
          code: 200,
          success: true,
          message: "获取邀请历史成功",
          data: responseData
        }
      ]
    })
    
        // 验证邀请码
    mock.onPost('/invitation/validate').reply((config) => {
      let code;
      try {
        // 检查是否为字符串形式的参数或对象形式的参数
        const data = JSON.parse(config.data);
        code = typeof data === 'string' ? data : data.code;
      } catch (e) {
        code = config.data;
      }
      
      const inviteCode = mockInvitationCodes.find(c => c.code === code)

      if (!inviteCode) {
        return [404, { code: 404, success: false, message: '邀请码不存在', data: { valid: false } }]
      }
      if (inviteCode.status !== 'active') {
        return [400, { code: 400, success: false, message: '邀请码已停用', data: { valid: false } }]
      }

      // 查找邀请人信息
      const userId = inviteCode.userId
      const userRoleMap: Record<string, string> = {
        '1': 'super_admin',
        '2': 'director',
        '3': 'leader',
        '4': 'sales'
      }
      const userNameMap: Record<string, string> = {
        '1': '系统管理员',
        '2': '张总监',
        '3': '李组长',
        '4': '王销售'
      }
      
      const responseData = {
        valid: true,
        inviterInfo: {
          id: userId,
          name: userNameMap[userId] || '未知用户',
          role: userRoleMap[userId] || 'unknown'
        },
        targetRole: inviteCode.targetRole,
        usageCount: inviteCode.usageCount
      }
      
      return [
        200,
        {
          code: 200,
          success: true,
          message: '验证成功',
          data: responseData
        }
      ]
    })
    
    // 重新激活邀请码
    mock.onPut(new RegExp('/invitation/codes/.*/reactivate')).reply((config) => {
      const codeId = config.url?.split('/')[3]
      const inviteCode = mockInvitationCodes.find(c => c.id === codeId)
      
      if (!inviteCode) {
        return [
          404,
          {
            code: 404,
            success: false,
            message: '邀请码不存在',
            data: null
          }
        ]
      }
      
      inviteCode.status = 'active'
      inviteCode.updatedAt = new Date().toISOString()
      
      return [
        200,
        {
          code: 200,
          success: true,
          message: '邀请码已激活',
          data: inviteCode
        }
      ]
    })
    
    // 停用邀请码
    mock.onPut(new RegExp('/invitation/codes/.*/deactivate')).reply((config) => {
      const codeId = config.url?.split('/')[3]
      const inviteCode = mockInvitationCodes.find(c => c.id === codeId)
      
      if (!inviteCode) {
        return [
          404,
          {
            code: 404,
            success: false,
            message: '邀请码不存在',
            data: null
          }
        ]
      }
      
      inviteCode.status = 'inactive'
      inviteCode.updatedAt = new Date().toISOString()
      
      return [
        200,
        {
          code: 200,
          success: true,
          message: '邀请码已停用',
          data: inviteCode
        }
      ]
    })
    
    // 生成新的邀请码
    mock.onPost('/invitation/codes').reply((config) => {
      const { targetRole } = JSON.parse(config.data)
      const token = config.headers?.Authorization
      const currentUser = Object.values(testUsers).find(u => u.token === token)
      const userId = currentUser?.id || '1'
      
      // 生成随机邀请码函数
      const generateRandomCode = (length: number = 8): string => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
        let result = ''
        for (let i = 0; i < length; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        return result
      }
      
      const newCode = {
        id: `${mockInvitationCodes.length + 1}`,
        userId,
        code: generateRandomCode(),
        targetRole,
        status: 'active' as const,
        usageCount: 0,
        maxUsage: 5,
        expiresAt: dayjs().add(30, 'day').toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      mockInvitationCodes.push(newCode as any)
      
      return [
        200,
        {
          code: 200,
          success: true,
          message: '邀请码生成成功',
          data: newCode
        }
      ]
    })
    
    // 导出邀请历史
    mock.onGet('/invitation/export').reply(() => {
      // 模拟导出文件，实际返回一个空的Blob
      // 对于文件下载，不需要使用标准API响应格式
      return [
        200,
        new Blob(['Fake exported data'], { type: 'text/plain' })
      ]
    })
    
    // 短链接生成API
    mock.onPost('/short-link').reply((config) => {
      try {
        const { url } = JSON.parse(config.data)
        // 生成随机短码
        const shortCode = Math.random().toString(36).substring(2, 8)
        const shortUrl = `${window.location.origin}/i/${shortCode}`
        
        return [
          200,
          {
            code: 200,
            success: true,
            message: '短链接生成成功',
            data: {
              originalUrl: url,
              shortUrl,
              shortCode,
              expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30天后过期
            }
          }
        ]
      } catch (error) {
        return [
          400,
          {
            code: 400,
            success: false,
            message: '生成短链接失败，参数错误',
            data: null
          }
        ]
      }
    })

    // 推广审核系统相关API mock
    // 获取审核任务列表
    mock.onGet('/promotion/audit/list').reply((config) => {
      const token = config.headers?.Authorization
      const currentUser = Object.values(testUsers).find(u => u.token === token)
      const userRole = currentUser?.role || 'super_admin'
      const userId = currentUser?.id || '1'

      const { 
        page = 1, 
        pageSize = 20, 
        keyword = '', 
        status = '', 
        platform = '', 
        contentType = '', 
        auditorId = '',
        startDate = '',
        endDate = '' 
      } = config.params || {}

      console.log('[Mock API] 推广审核列表请求:', config.params)

      // 根据用户权限过滤任务
      let filteredTasks = filterTasksByPermission(mockPromotionTasks, userRole, userId)

      // 根据筛选条件过滤
      const filterParams = {
        keyword,
        status: status || undefined,
        platform: platform || undefined,
        contentType: contentType || undefined,
        auditorId: auditorId || undefined,
        dateRange: startDate && endDate ? { startDate, endDate } : undefined
      }

      filteredTasks = filterTasksByParams(filteredTasks, filterParams)

      // 分页处理
      const total = filteredTasks.length
      const start = (Number(page) - 1) * Number(pageSize)
      const end = start + Number(pageSize)
      const paginatedTasks = filteredTasks.slice(start, end)

      return [
        200,
        {
          code: 200,
          success: true,
          message: '获取审核列表成功',
          data: {
            list: paginatedTasks,
            total,
            page: Number(page),
            pageSize: Number(pageSize),
            totalPages: Math.ceil(total / Number(pageSize))
          }
        }
      ]
    })

    // 获取任务详情
    mock.onGet(/\/promotion\/audit\/task\/(.+)/).reply((config) => {
      const taskId = config.url?.match(/\/promotion\/audit\/task\/(.+)/)?.[1]
      
      if (!taskId) {
        return [
          400,
          {
            code: 400,
            success: false,
            message: '任务ID不能为空',
            data: null
          }
        ]
      }

      const task = getMockTaskDetail(taskId)
      
      if (!task) {
        return [
          404,
          {
            code: 404,
            success: false,
            message: '任务不存在',
            data: null
          }
        ]
      }

      return [
        200,
        {
          code: 200,
          success: true,
          message: '获取任务详情成功',
          data: task
        }
      ]
    })

    // 执行审核操作
    mock.onPost('/promotion/audit/execute').reply((config) => {
      const token = config.headers?.Authorization
      const currentUser = Object.values(testUsers).find(u => u.token === token)
      const userId = currentUser?.id || '1'
      const userName = currentUser?.nickname || '系统管理员'

      try {
        const { taskId, action, comment, rewardAmount } = JSON.parse(config.data)

        // 参数验证
        if (!taskId || !action) {
          return [
            400,
            {
              code: 400,
              success: false,
              message: '参数不完整',
              data: null
            }
          ]
        }

        if (!['approve', 'reject'].includes(action)) {
          return [
            400,
            {
              code: 400,
              success: false,
              message: '审核动作无效',
              data: null
            }
          ]
        }

        // 拒绝时必须填写意见
        if (action === 'reject' && (!comment || comment.trim().length === 0)) {
          return [
            400,
            {
              code: 400,
              success: false,
              message: '拒绝时必须填写审核意见',
              data: null
            }
          ]
        }

        // 更新任务状态
        const updatedTask = updateTaskStatus(taskId, action, userId, userName, comment, rewardAmount)

        if (!updatedTask) {
          return [
            404,
            {
              code: 404,
              success: false,
              message: '任务不存在',
              data: null
            }
          ]
        }

        return [
          200,
          {
            code: 200,
            success: true,
            message: `审核${action === 'approve' ? '通过' : '拒绝'}成功`,
            data: updatedTask
          }
        ]
      } catch (error) {
        return [
          400,
          {
            code: 400,
            success: false,
            message: '请求数据格式错误',
            data: null
          }
        ]
      }
    })

    // 获取审核历史记录
    mock.onGet(/\/promotion\/audit\/history\/(.+)/).reply((config) => {
      const taskId = config.url?.match(/\/promotion\/audit\/history\/(.+)/)?.[1]
      
      if (!taskId) {
        return [
          400,
          {
            code: 400,
            success: false,
            message: '任务ID不能为空',
            data: null
          }
        ]
      }

      const history = generateMockAuditHistory(taskId)

      return [
        200,
        {
          code: 200,
          success: true,
          message: '获取审核历史成功',
          data: history
        }
      ]
    })

    // 获取审核统计数据
    mock.onGet('/promotion/audit/stats').reply((config) => {
      const { startDate, endDate } = config.params || {}
      
      // 根据时间范围调整统计数据（简化处理）
      let stats = { ...mockAuditStatsData }
      
      if (startDate && endDate) {
        const days = dayjs(endDate).diff(dayjs(startDate), 'day')
        const factor = Math.min(Math.max(days / 30, 0.1), 2) // 调整因子
        
        stats = {
          ...stats,
          todayAudited: Math.floor(stats.todayAudited * factor),
          todayApproved: Math.floor(stats.todayApproved * factor),
          todayRejected: Math.floor(stats.todayRejected * factor),
          rewardAmountToday: Math.floor(stats.rewardAmountToday * factor)
        }
        
        // 重新计算通过率
        if (stats.todayAudited > 0) {
          stats.approvalRate = Math.round((stats.todayApproved / stats.todayAudited) * 100) / 100
        }
      }

      return [
        200,
        {
          code: 200,
          success: true,
          message: '获取统计数据成功',
          data: stats
        }
      ]
    })

    // 获取个人审核统计
    mock.onGet('/promotion/audit/my-stats').reply(() => {
      return [
        200,
        {
          code: 200,
          success: true,
          message: '获取个人统计成功',
          data: {
            pendingCount: Math.floor(Math.random() * 30) + 10,
            todayAudited: Math.floor(Math.random() * 20) + 5,
            thisWeekAudited: Math.floor(Math.random() * 100) + 30
          }
        }
      ]
    })

    // 检查审核权限
    mock.onGet(/\/promotion\/audit\/check-permission\/(.+)/).reply((config) => {
      const taskId = config.url?.match(/\/promotion\/audit\/check-permission\/(.+)/)?.[1]
      const token = config.headers?.Authorization
      const currentUser = Object.values(testUsers).find(u => u.token === token)
      const userRole = currentUser?.role || 'super_admin'

      if (!taskId) {
        return [
          400,
          {
            code: 400,
            success: false,
            message: '任务ID不能为空',
            data: null
          }
        ]
      }

      const task = getMockTaskDetail(taskId)
      
      if (!task) {
        return [
          404,
          {
            code: 404,
            success: false,
            message: '任务不存在',
            data: null
          }
        ]
      }

      // 检查权限和状态
      const canAudit = ['super_admin', 'director', 'leader'].includes(userRole) &&
                       task.status === 'PENDING_MANUAL_AUDIT'

      return [
        200,
        {
          code: 200,
          success: true,
          message: '权限检查完成',
          data: {
            canAudit,
            reason: canAudit ? undefined : '无审核权限或任务状态不允许审核',
            taskStatus: task.status
          }
        }
      ]
    })

    // 批量审核操作 (V2功能)
    mock.onPost('/promotion/audit/batch').reply((config) => {
      const token = config.headers?.Authorization
      const currentUser = Object.values(testUsers).find(u => u.token === token)
      const userRole = currentUser?.role || 'super_admin'

      // 检查批量审核权限
      if (!['super_admin', 'director'].includes(userRole)) {
        return [
          403,
          {
            code: 403,
            success: false,
            message: '没有批量审核权限',
            data: null
          }
        ]
      }

      return [
        200,
        {
          code: 200,
          success: true,
          message: '批量审核成功',
          data: []
        }
      ]
    })

    // 导出审核数据
    mock.onGet('/promotion/audit/export').reply((config) => {
      const token = config.headers?.Authorization
      const currentUser = Object.values(testUsers).find(u => u.token === token)
      const userRole = currentUser?.role || 'super_admin'

      // 检查导出权限
      if (!['super_admin', 'director'].includes(userRole)) {
        return [
          403,
          {
            code: 403,
            success: false,
            message: '没有导出权限',
            data: null
          }
        ]
      }

      // 模拟生成Excel文件内容
      const csvContent = 'Task ID,Agent Name,Platform,Status,Submitted At\n' +
        mockPromotionTasks.slice(0, 10).map(task => 
          `${task.id},${task.agentName},${task.platform},${task.status},${task.submittedAt}`
        ).join('\n')

      // 返回文件数据
      return [
        200,
        new Blob([csvContent], { type: 'text/csv;charset=utf-8' }),
        {
          'Content-Disposition': 'attachment; filename="promotion_audit_export.csv"',
          'Content-Type': 'text/csv;charset=utf-8'
        }
      ]
    })

    // ==================== 代理任务提交相关API mock ====================

    // 代理提交推广任务
    mock.onPost('/promotion/task/submit').reply((config) => {
      const token = config.headers?.Authorization
      const agentId = token === 'mock-token-agent' ? 'A001' : 'A001' // 默认代理ID

      try {
        const request = JSON.parse(config.data)
        const newTask = mockSubmitTask(request, agentId)

        return [
          200,
          {
            code: 200,
            success: true,
            message: '任务提交成功',
            data: newTask
          }
        ]
      } catch (error) {
        return [
          400,
          {
            code: 400,
            success: false,
            message: '任务提交失败',
            error: error instanceof Error ? error.message : '未知错误'
          }
        ]
      }
    })

    // 获取代理任务列表
    mock.onGet('/promotion/task/agent-list').reply((config) => {
      const token = config.headers?.Authorization
      const agentId = token === 'mock-token-agent' ? 'A001' : 'A001' // 默认代理ID

      try {
        const params = config.params || {}
        const result = mockGetAgentTaskList(params, agentId)

        return [
          200,
          {
            code: 200,
            success: true,
            message: '获取任务列表成功',
            data: result
          }
        ]
      } catch (error) {
        return [
          500,
          {
            code: 500,
            success: false,
            message: '获取任务列表失败',
            error: error instanceof Error ? error.message : '未知错误'
          }
        ]
      }
    })

    // 获取代理任务统计
    mock.onGet('/promotion/task/agent-stats').reply((config) => {
      const token = config.headers?.Authorization
      const agentId = token === 'mock-token-agent' ? 'A001' : 'A001' // 默认代理ID

      try {
        const stats = mockGetAgentTaskStats(agentId)

        return [
          200,
          {
            code: 200,
            success: true,
            message: '获取统计数据成功',
            data: stats
          }
        ]
      } catch (error) {
        return [
          500,
          {
            code: 500,
            success: false,
            message: '获取统计数据失败',
            error: error instanceof Error ? error.message : '未知错误'
          }
        ]
      }
    })

    // URL平台识别
    mock.onPost('/promotion/task/recognize-platform').reply((config) => {
      try {
        const { url } = JSON.parse(config.data)

        if (!url) {
          return [
            400,
            {
              code: 400,
              success: false,
              message: 'URL不能为空'
            }
          ]
        }

        const result = mockRecognizePlatform(url)

        return [
          200,
          {
            code: 200,
            success: true,
            message: '平台识别成功',
            data: result
          }
        ]
      } catch (error) {
        return [
          500,
          {
            code: 500,
            success: false,
            message: '平台识别失败',
            error: error instanceof Error ? error.message : '未知错误'
          }
        ]
      }
    })

    // ==================== 客资扩展API Mock ====================

    // 获取单个客资详情
    mock.onGet(/\/leads\/([^/]+)$/).reply((config) => {
      const leadId = config.url?.match(/\/leads\/([^/]+)$/)?.[1]

      if (leadId) {
        const lead = leads.find(l => l.id === leadId)
        if (lead) {
          return [200, { code: 0, message: '成功', data: lead }]
        }
      }

      return [404, { code: 404, message: '客资不存在', data: null }]
    })

    // 重复性检查API
    mock.onPost('/leads/check-duplicate').reply((config) => {
      const { phone, name, wechatId } = JSON.parse(config.data)
      const result = generateMockDuplicateCheck(phone)

      return [200, { code: 0, message: '检查完成', data: result }]
    })

    // 来源检测API
    mock.onPost('/leads/detect-source').reply((config) => {
      const { referrer, utmParams, userAgent, referralCode } = JSON.parse(config.data)
      const result = generateMockSourceDetection(utmParams)

      return [200, { code: 0, message: '检测完成', data: result }]
    })

    // 来源验证API
    mock.onPost('/leads/validate-source').reply((config) => {
      const { source, sourceDetail, utmParams } = JSON.parse(config.data)

      const result = {
        isValid: Math.random() > 0.2, // 80% 概率有效
        source: source,
        issues: Math.random() > 0.7 ? ['来源信息不完整'] : [],
        suggestions: ['建议完善UTM参数'],
        validatedAt: new Date().toISOString()
      }

      return [200, { code: 0, message: '验证完成', data: result }]
    })

    // 推荐码验证API
    mock.onGet(/\/leads\/validate-referral-code\/(.+)/).reply((config) => {
      const code = decodeURIComponent(config.url?.split('/').pop() || '')
      const result = generateMockReferralCodeValidation(code)

      return [200, { code: 0, message: '验证完成', data: result }]
    })

    // 来源建议API
    mock.onGet('/leads/source-suggestions').reply((config) => {
      const { keyword } = config.params || {}

      let suggestions = [...mockSources]
      if (keyword) {
        suggestions = suggestions.filter(s => s.toLowerCase().includes(keyword.toLowerCase()))
      }

      const result = {
        suggestions: suggestions.slice(0, 10),
        popular: mockSources.slice(0, 5),
        recent: mockSources.slice(5, 10)
      }

      return [200, { code: 0, message: '成功', data: result }]
    })

    // 客资统计API
    mock.onGet('/leads/statistics').reply((config) => {
      const { dateFrom, dateTo, salespersonId, source, auditStatus } = config.params || {}

      // 根据筛选条件过滤数据
      let filteredLeads = [...leads]
      if (salespersonId) {
        filteredLeads = filteredLeads.filter(l => l.salespersonId === salespersonId)
      }
      if (source) {
        filteredLeads = filteredLeads.filter(l => l.source === source)
      }
      if (auditStatus) {
        filteredLeads = filteredLeads.filter(l => l.auditStatus === auditStatus)
      }

      const result = {
        totalCount: filteredLeads.length,
        pendingCount: filteredLeads.filter(l => l.auditStatus === 'PENDING_AUDIT').length,
        approvedCount: filteredLeads.filter(l => l.auditStatus === 'APPROVED').length,
        rejectedCount: filteredLeads.filter(l => l.auditStatus === 'REJECTED').length,
        conversionRate: 0.65 + Math.random() * 0.2, // 65%-85%
        sourceBreakdown: mockSources.slice(0, 5).map(source => ({
          source,
          count: Math.floor(Math.random() * 20) + 5,
          percentage: Math.random() * 0.3 + 0.1
        })),
        auditStatusBreakdown: [
          { status: 'PENDING_AUDIT', count: 25, percentage: 0.25 },
          { status: 'APPROVED', count: 60, percentage: 0.60 },
          { status: 'REJECTED', count: 15, percentage: 0.15 }
        ],
        dailyTrend: Array.from({ length: 7 }, (_, i) => ({
          date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          count: Math.floor(Math.random() * 20) + 5,
          approved: Math.floor(Math.random() * 15) + 3,
          rejected: Math.floor(Math.random() * 5) + 1
        }))
      }

      return [200, { code: 0, message: '成功', data: result }]
    })

    // ==================== 客资审核API Mock ====================

    // 获取待审核客资列表
    mock.onGet('/leads/audit/pending').reply((config) => {
      const { page = 1, pageSize = 10, salespersonId, keyword } = config.params || {}

      let pendingLeads = leads.filter(l => l.auditStatus === 'PENDING_AUDIT')

      // 基于权限过滤（简化处理）
      if (salespersonId) {
        pendingLeads = pendingLeads.filter(l => l.salespersonId === salespersonId)
      }

      // 关键词搜索
      if (keyword) {
        pendingLeads = pendingLeads.filter(l =>
          l.name.includes(keyword) || l.phone.includes(keyword)
        )
      }

      // 分页
      const start = (page - 1) * pageSize
      const end = start + pageSize
      const paginatedLeads = pendingLeads.slice(start, end)

      return [200, {
        code: 0,
        message: '成功',
        data: {
          list: paginatedLeads,
          total: pendingLeads.length,
          page: Number(page),
          pageSize: Number(pageSize)
        }
      }]
    })

    // 获取所有可审核客资列表
    mock.onGet('/leads/audit/all').reply((config) => {
      const { page = 1, pageSize = 10, auditStatus, salespersonId } = config.params || {}

      let auditableLeads = [...leads]

      // 审核状态筛选
      if (auditStatus) {
        auditableLeads = auditableLeads.filter(l => l.auditStatus === auditStatus)
      }

      // 基于权限过滤
      if (salespersonId) {
        auditableLeads = auditableLeads.filter(l => l.salespersonId === salespersonId)
      }

      // 分页
      const start = (page - 1) * pageSize
      const end = start + pageSize
      const paginatedLeads = auditableLeads.slice(start, end)

      return [200, {
        code: 0,
        message: '成功',
        data: {
          list: paginatedLeads,
          total: auditableLeads.length,
          page: Number(page),
          pageSize: Number(pageSize)
        }
      }]
    })

    // 审核单个客资
    mock.onPut(/\/leads\/([^/]+)\/audit/).reply((config) => {
      const leadId = config.url?.match(/\/leads\/([^/]+)\/audit/)?.[1]
      const { decision, context } = JSON.parse(config.data)

      if (leadId) {
        const leadIndex = leads.findIndex(l => l.id === leadId)
        if (leadIndex !== -1) {
          const lead = leads[leadIndex]

          // 更新审核状态
          lead.auditStatus = decision.action === 'APPROVE' ? 'APPROVED' : 'REJECTED'
          lead.auditedAt = new Date().toISOString()
          lead.auditedBy = context?.auditorId || 'MOCK_AUDITOR'
          lead.auditedByName = '审核员'
          lead.auditComment = decision.comment
          lead.rejectReason = decision.rejectReason
          lead.updatedAt = new Date().toISOString()
          lead.version = (lead.version || 1) + 1

          return [200, { code: 0, message: '审核成功', data: lead }]
        }
      }

      return [404, { code: 404, message: '客资不存在', data: null }]
    })

    // 批量审核客资
    mock.onPost('/leads/audit/batch').reply((config) => {
      const { leadIds, decision } = JSON.parse(config.data)
      const result = generateMockBatchAuditResult(leadIds)

      // 更新成功的客资状态
      result.successLeadIds.forEach(leadId => {
        const leadIndex = leads.findIndex(l => l.id === leadId)
        if (leadIndex !== -1) {
          leads[leadIndex].auditStatus = decision.action === 'APPROVE' ? 'APPROVED' : 'REJECTED'
          leads[leadIndex].auditedAt = new Date().toISOString()
          leads[leadIndex].auditComment = decision.comment
        }
      })

      return [200, { code: 0, message: '批量审核完成', data: result }]
    })

    // 获取审核记录
    mock.onGet(/\/leads\/([^/]+)\/audit-records/).reply((config) => {
      const leadId = config.url?.match(/\/leads\/([^/]+)\/audit-records/)?.[1]

      if (leadId) {
        const records = generateMockAuditRecords(leadId, 2)
        return [200, { code: 0, message: '成功', data: records }]
      }

      return [404, { code: 404, message: '客资不存在', data: null }]
    })

    // 获取审核记录列表
    mock.onGet('/leads/audit/records').reply((config) => {
      const { page = 1, pageSize = 10, leadId, auditorId } = config.params || {}

      // 生成模拟审核记录
      const allRecords = leads.slice(0, 20).flatMap(lead =>
        generateMockAuditRecords(lead.id, Math.floor(Math.random() * 3) + 1)
      )

      let filteredRecords = [...allRecords]

      if (leadId) {
        filteredRecords = filteredRecords.filter(r => r.leadId === leadId)
      }

      if (auditorId) {
        filteredRecords = filteredRecords.filter(r => r.auditorId === auditorId)
      }

      // 分页
      const start = (page - 1) * pageSize
      const end = start + pageSize
      const paginatedRecords = filteredRecords.slice(start, end)

      return [200, {
        code: 0,
        message: '成功',
        data: {
          list: paginatedRecords,
          total: filteredRecords.length,
          page: Number(page),
          pageSize: Number(pageSize)
        }
      }]
    })

    // 获取审核统计
    mock.onGet('/leads/audit/statistics').reply((config) => {
      const stats = generateMockAuditStatistics()
      return [200, { code: 0, message: '成功', data: stats }]
    })

    // 检查审核权限
    mock.onPost('/leads/audit/check-permission').reply((config) => {
      const { userId, leadIds } = JSON.parse(config.data)

      const result = {
        canAudit: true,
        canBatchAudit: Math.random() > 0.3, // 70% 概率可以批量审核
        canViewAll: Math.random() > 0.5, // 50% 概率可以查看所有
        allowedLeadIds: leadIds || leads.slice(0, 10).map(l => l.id),
        allowedSalesIds: mockSalespersons.map(s => s.id),
        reason: undefined
      }

      return [200, { code: 0, message: '权限检查完成', data: result }]
    })

    // 获取审核范围
    mock.onGet('/leads/audit/scope').reply((config) => {
      const { userId, userRole } = config.params || {}

      const result = {
        canAuditAll: ['super_admin', 'director'].includes(userRole),
        allowedLeadIds: userRole === 'sales' ? leads.filter(l => l.salespersonId === userId).map(l => l.id) : undefined,
        allowedSalesIds: userRole === 'leader' ? mockSalespersons.slice(0, 3).map(s => s.id) : undefined,
        teamIds: userRole === 'leader' ? ['TEAM_001'] : undefined,
        restrictions: userRole === 'sales' ? ['只能审核自己的客资'] : []
      }

      return [200, { code: 0, message: '成功', data: result }]
    })

    // 获取审核工作台
    mock.onGet(/\/leads\/audit\/workbench\/(.+)/).reply((config) => {
      const auditorId = config.url?.split('/').pop()

      const result = {
        pendingCount: Math.floor(Math.random() * 20) + 5,
        todayAudited: Math.floor(Math.random() * 15) + 3,
        weeklyAudited: Math.floor(Math.random() * 50) + 20,
        avgAuditTime: 15 + Math.random() * 20, // 15-35分钟
        recentAudits: generateMockAuditRecords('RECENT', 5),
        urgentLeads: leads.filter(l => l.auditStatus === 'PENDING_AUDIT').slice(0, 3),
        myStatistics: {
          approvalRate: 0.7 + Math.random() * 0.2, // 70%-90%
          rejectionRate: 0.1 + Math.random() * 0.2, // 10%-30%
          totalAudited: Math.floor(Math.random() * 100) + 50
        }
      }

      return [200, { code: 0, message: '成功', data: result }]
    })

    // ==================== 系统配置Mock接口 ====================

    // 获取当前配置
    mock.onGet(/\/system-config\/current\/(.+)/).reply((config) => {
      const configType = config.url?.split('/').pop()
      console.log('[Mock] 获取当前配置:', configType)

      try {
        const configData = getMockConfigByType(configType as any)
        console.log('[Mock] 返回配置数据:', configData)
        return [200, { code: 0, message: '获取成功', data: configData }]
      } catch (error) {
        console.log('[Mock] 配置不存在:', error)
        return [404, { code: 404, message: '配置不存在', data: null }]
      }
    })

    // 获取待审核配置
    mock.onGet(/\/system-config\/pending\/(.+)/).reply((config) => {
      const configType = config.url?.split('/').pop()
      console.log('[Mock] 获取待审核配置:', configType)

      // 模拟没有待审核配置的情况
      return [200, { code: 0, message: '获取成功', data: null }]
    })

    // 保存配置草稿
    mock.onPost('/system-config/draft').reply((config) => {
      const configData = JSON.parse(config.data)
      const configId = generateConfigId(configData.type)

      console.log('[Mock] 保存配置草稿:', configData)

      return [200, {
        code: 0,
        message: '保存成功',
        data: { id: configId }
      }]
    })

    // 提交审核
    mock.onPost(/\/system-config\/(.+)\/submit-audit/).reply((config) => {
      const configId = config.url?.split('/')[2]
      const auditId = generateAuditId()

      console.log('[Mock] 提交配置审核, configId:', configId)

      return [200, {
        code: 0,
        message: '提交成功',
        data: { auditId }
      }]
    })

    // 审核配置
    mock.onPut(/\/system-config\/audit\/(.+)/).reply((config) => {
      const auditId = config.url?.split('/').pop()
      const decision = JSON.parse(config.data)

      console.log('[Mock] 审核配置:', auditId, decision)

      return [200, {
        code: 0,
        message: '审核完成',
        data: { success: true }
      }]
    })

    // 获取审核记录
    mock.onGet('/system-config/audit-records').reply(() => {
      console.log('[Mock] 获取审核记录')
      return [200, {
        code: 0,
        message: '获取成功',
        data: {
          list: mockAuditRecords,
          total: mockAuditRecords.length,
          page: 1,
          pageSize: 10
        }
      }]
    })

    // 获取配置历史
    mock.onGet(/\/system-config\/(.+)\/history/).reply((config) => {
      const configType = config.url?.split('/')[2]
      const history = mockConfigHistory.filter(h => h.type === configType)

      return [200, {
        code: 0,
        message: '获取成功',
        data: history
      }]
    })

    // 触发数据同步
    mock.onPost(/\/system-config\/(.+)\/(.+)\/sync/).reply((config) => {
      const syncId = generateSyncId()

      console.log('[Mock] 触发数据同步')

      return [200, {
        code: 0,
        message: '同步已启动',
        data: { ...mockDataSyncResult, syncId }
      }]
    })

    // 获取同步状态
    mock.onGet(/\/system-config\/sync\/(.+)/).reply((config) => {
      const syncId = config.url?.split('/').pop()

      return [200, {
        code: 0,
        message: '获取成功',
        data: { ...mockDataSyncResult, syncId }
      }]
    })

    // 更多模拟API可以根据需要添加
    console.log('[Mock] axios-mock-adapter设置成功，包含系统配置接口')
  } catch (error) {
    console.error('[Mock] 设置axios-mock-adapter时出错:', error)
  }
}