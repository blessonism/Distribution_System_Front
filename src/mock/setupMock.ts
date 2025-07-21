import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'
import request from '@/utils/request'
import { realAgentsData } from './agentData'
import type { Lead, LeadStatus } from '@/types/lead'
import allPersonnel from './personnelData';
import dayjs from 'dayjs';

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

    // 模拟登录API
    mock.onPost('/auth/login').reply((config) => {
      console.log('[Mock API] 请求登录', config.data)
      const { username, password } = JSON.parse(config.data)
      
      // 简单的用户名密码验证
      if (username === 'admin' && password === 'admin123') {
        return [
          200, 
          {
            code: 200,
            success: true,
            data: {
              token: 'mock-token-admin',
              user: {
                id: 1,
                username: 'admin',
                nickname: '系统管理员',
                email: 'admin@example.com',
                role: 'super_admin',
                status: 'active',
                avatar: '',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              },
              permissions: ['*'],
            }
          }
        ]
      } else if (username === 'sales' && password === 'sales123') {
        return [
          200, 
          {
            code: 200,
            success: true,
            data: {
              token: 'mock-token-sales',
              user: {
                id: 2,
                username: 'sales',
                nickname: '销售人员',
                email: 'sales@example.com',
                role: 'sales',
                status: 'active',
                avatar: '',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              },
              permissions: ['dashboard', 'lead', 'deal'],
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
      
      if (token === 'mock-token-admin') {
        return [
          200,
          {
            code: 200,
            success: true,
            data: {
              user: {
                id: 1,
                username: 'admin',
                nickname: '系统管理员',
                email: 'admin@example.com',
                role: 'super_admin',
                status: 'active',
                avatar: '',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              },
              permissions: ['*'],
            }
          }
        ]
      } else if (token === 'mock-token-sales') {
        return [
          200,
          {
            code: 200,
            success: true,
            data: {
              user: {
                id: 2,
                username: 'sales',
                nickname: '销售人员',
                email: 'sales@example.com',
                role: 'sales',
                status: 'active',
                avatar: '',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              },
              permissions: ['dashboard', 'lead', 'deal'],
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

    // 模拟客资API
    const leads: Lead[] = []
    const totalLeads = 73 // 增加数据总量
    const leadStatus: LeadStatus[] = ['PENDING', 'FOLLOWING', 'CONVERTED', 'INVALID']
    // 丰富来源渠道
    const sources = ['搜索引擎', '客户推荐', '广告投放', '社交媒体-小红书', '线下活动', '合作渠道', '官网咨询']
    // 增加销售人员
    const salespersons = [
      { id: 'S001', name: '张三' },
      { id: 'S002', name: '李四' },
      { id: 'S003', name: '王五' },
      { id: 'S004', name: '赵六' },
      { id: 'S005', name: '孙月' },
      { id: 'S006', name: '周鹏' },
      { id: 'S007', name: '吴佳琪' }
    ]
    // 预设一批更真实的客户姓名
    const customerNames = [
      '王伟', '李娜', '张敏', '刘洋', '陈静', '杨磊', '黄英', '吴刚', '赵丽', '周强',
      '徐丹', '孙杰', '马琳', '胡斌', '郭婷', '林鹏', '高远', '郑洁', '何峰', '梁爽',
      '宋妍', '谢超', '唐思', '韩雪', '曹阳', '邓宇', '傅海', '袁媛', '彭涛', '董雷',
      '范文', '程程', '蒋欣', '丁浩', '沈悦', '曾兰', '萧然', '田甜', '金鑫', '石磊'
    ]

    // 生成模拟数据
    for (let i = 1; i <= totalLeads; i++) {
      const salesperson = salespersons[i % salespersons.length]
      const customerName = customerNames[i % customerNames.length] + (Math.random() > 0.5 ? '先生' : '女士')
      
      leads.push({
        id: `LID_${String(i).padStart(4, '0')}`,
        name: customerName,
        phone: `1${[3, 5, 8][i % 3]}${String(Math.floor(Math.random() * 100000000)).padStart(9, '0')}`,
        status: leadStatus[i % leadStatus.length],
        source: sources[i % sources.length],
        salespersonId: salesperson.id,
        salespersonName: salesperson.name,
        // 扩大时间范围到最近90天
        createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString()
      })
    }

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
      const salesperson = salespersons.find(s => s.id === leadData.salespersonId) || salespersons[0]
      
      // 创建新客资
      const newLead = {
        id: `LID_${String(leads.length + 1).padStart(4, '0')}`,
        name: leadData.name,
        phone: leadData.phone,
        status: 'PENDING' as LeadStatus,
        source: leadData.source || '搜索引擎',
        salespersonId: salesperson.id,
        salespersonName: salesperson.name,
        createdAt: new Date().toISOString()
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
          const salesperson = salespersons.find(s => s.id === leadData.salespersonId)
          
          // 更新客资信息
          leads[leadIndex] = {
            ...leads[leadIndex],
            name: leadData.name || leads[leadIndex].name,
            phone: leadData.phone || leads[leadIndex].phone,
            status: leadData.status || leads[leadIndex].status,
            source: leadData.source || leads[leadIndex].source,
            salespersonId: salesperson?.id || leads[leadIndex].salespersonId,
            salespersonName: salesperson?.name || leads[leadIndex].salespersonName
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

    // 更多模拟API可以根据需要添加
    console.log('[Mock] axios-mock-adapter设置成功')
  } catch (error) {
    console.error('[Mock] 设置axios-mock-adapter时出错:', error)
  }
} 