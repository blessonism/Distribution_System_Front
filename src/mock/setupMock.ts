import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'
import request from '@/utils/request'
import { realAgentsData } from './agentData'

export function setupMockApi() {
  // 创建一个MockAdapter实例，使用项目中的request实例而不是全局axios实例
  const mock = new MockAdapter(request, { delayResponse: 500 })

  // 模拟登录API
  mock.onPost('/auth/login').reply((config) => {
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
  
  // 3. 获取代理业绩数据
  mock.onGet(/\/agents\/[^\/]+\/performance/).reply((config) => {
    const id = config.url?.split('/')[2];
    
    const performance = {
      clientsTotal: 42,
      validClients: 25,
      invalidClients: 10,
      pendingClients: 7,
      closedDeals: 15,
      totalRevenue: 35000,
      commission: 2450,
      baseSalary: 1000,
      performance: 1450,
      periodStart: new Date(new Date().getFullYear(), 0, 1).toISOString(),
      periodEnd: new Date().toISOString()
    };
    
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

  // 更多模拟API可以根据需要添加
} 