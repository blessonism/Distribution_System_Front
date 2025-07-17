import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'
import request from '@/utils/request'

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
  mock.onGet('/users').reply(200, {
    code: 200,
    success: true,
    data: {
      list: Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        username: `user${i + 1}`,
        nickname: `用户${i + 1}`,
        email: `user${i + 1}@example.com`,
        phone: `1381234${String(i).padStart(4, '0')}`,
        role: i === 0 ? 'super_admin' : i < 3 ? 'leader' : 'sales',
        status: i % 3 === 0 ? 'inactive' : 'active',
        createdAt: new Date(Date.now() - i * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - i * 86400000).toISOString(),
      })),
      total: 25,
    }
  })

  // 模拟仪表盘数据API
  mock.onGet('/dashboard/stats').reply(200, {
    code: 200,
    success: true,
    data: {
      today: {
        leadCount: 85,
        dealCount: 12,
        salesAmount: 26500,
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
      }
    }
  })

  // 更多模拟API可以根据需要添加
} 