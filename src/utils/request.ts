/**
 * @fileoverview 分销系统前端HTTP请求工具模块
 * 提供配置好的Axios实例，包含身份验证、错误处理和响应拦截器
 * 
 * @module utils/request
 * @requires axios
 * @requires @/types/api
 */

import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios'
import type { ApiResponse } from '@/types/api'

/**
 * 分销系统API主要的Axios实例
 * 
 * 功能特性:
 * - 基础URL从环境变量获取或回退到'/api'
 * - 所有请求10秒超时
 * - 默认JSON内容类型头
 * - 自动Bearer token身份验证
 * - HTTP状态码的全面错误处理
 * 
 * @type {AxiosInstance}
 * @complexity O(1) - 简单实例创建
 */
const request: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

/**
 * 请求拦截器配置
 * 在每个请求发送前自动添加Authorization头部
 * 
 * 功能:
 * - 从localStorage获取JWT token
 * - 自动添加Bearer认证头部
 * - 处理请求配置错误
 * 
 * @complexity O(1) - 简单的token获取和头部设置
 * @flow 请求发送前 -> 检查token -> 设置Authorization头 -> 发送请求
 */
request.interceptors.request.use(
  (config) => {
    // 从 localStorage 获取 token
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

/**
 * 响应拦截器配置
 * 处理API响应的业务逻辑判断和错误处理
 * 
 * 成功响应处理:
 * - 检查业务状态码 (200, 0) 或 success 字段
 * - 返回完整response对象保持Axios类型一致性
 * 
 * 失败响应处理:
 * - 记录业务错误日志
 * - 抛出包含错误信息的Promise.reject
 * 
 * @complexity O(1) - 简单的条件判断和错误处理
 * @flow 响应接收 -> 检查业务状态 -> 成功返回/失败抛出异常
 */
request.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const { data } = response

    // 业务成功判断
    if (data.code === 200 || data.code === 0 || data.success) {
      return response // 保持返回整个 response 以符合 Axios 类型
    }

    // 业务失败
    if (typeof window !== 'undefined') {
      console.error('API Error:', data.message)
    }
    return Promise.reject(new Error(data.message || '请求失败'))
  },
  /**
   * HTTP错误处理器
   * 根据不同的HTTP状态码执行相应的错误处理逻辑
   * 
   * 处理的错误类型:
   * - 401: Token失效，自动清除localStorage并重定向到登录页
   * - 403: 权限不足，记录错误日志
   * - 404: 资源不存在，记录错误日志  
   * - 500: 服务器内部错误，记录错误日志
   * - 网络错误: 连接失败或超时
   * - 配置错误: 请求配置问题
   * 
   * @param {any} error - Axios错误对象
   * @returns {Promise<never>} 始终返回rejected promise
   * @complexity O(1) - 基于状态码的简单switch判断
   * @flow 错误发生 -> 判断错误类型 -> 执行对应处理 -> 抛出错误
   */
  (error) => {
    // 网络错误或服务器错误
    if (error.response) {
      const { status, data } = error.response

      switch (status) {
        case 401:
          // Token 失效，清除本地存储并跳转登录
          if (typeof window !== 'undefined') {
            localStorage.removeItem('token')
            window.location.href = '/login'
          }
          break
        case 403:
          // 无权限
          if (typeof window !== 'undefined') {
            console.error('无权限访问')
          }
          break
        case 404:
          if (typeof window !== 'undefined') {
            console.error('请求的资源不存在')
          }
          break
        case 500:
          if (typeof window !== 'undefined') {
            console.error('服务器内部错误')
          }
          break
        default:
          if (typeof window !== 'undefined') {
            console.error('请求失败:', data.message || error.message)
          }
      }
    } else if (error.request) {
      console.error('网络错误，请检查网络连接')
    } else {
      console.error('请求配置错误:', error.message)
    }

    return Promise.reject(error)
  }
)

/**
 * HTTP请求方法封装对象
 * 提供标准化的GET、POST、PUT、DELETE方法，自动处理响应数据解构
 * 
 * 所有方法都会:
 * - 自动解构response.data.data返回业务数据
 * - 支持泛型类型推断
 * - 统一错误处理通过拦截器处理
 * 
 * @namespace http
 */
export const http = {
  /**
   * 发送GET请求
   * 
   * @template T 响应数据类型
   * @param {string} url - 请求URL
   * @param {AxiosRequestConfig} [config] - 请求配置选项
   * @returns {Promise<T>} 解构后的业务数据
   * @complexity O(1) - HTTP请求的复杂度取决于网络和服务端
   * @flow 发送请求 -> 响应拦截器处理 -> 解构data.data -> 返回业务数据
   * 
   * @example
   * ```typescript
   * const users = await http.get<User[]>('/users')
   * const user = await http.get<User>('/users/1')
   * ```
   */
  get: async <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    console.log(`[HTTP] 发送GET请求: ${url}`, config);
    const response = await request.get(url, config);
    console.log(`[HTTP] 获得原始响应: ${url}`, response);
    
    // 添加详细的响应结构日志
    if (url.includes('performance')) {
      console.log(`[HTTP] 响应data结构:`, {
        hasData: !!response.data,
        dataType: response.data ? typeof response.data : 'undefined',
        hasInnerData: !!response.data?.data,
        innerDataType: response.data?.data ? typeof response.data.data : 'undefined',
        hasTrendData: !!response.data?.data?.trendData,
        success: response.data?.success,
        code: response.data?.code
      });
    }
    
    return response.data.data; // 解构两层 data
  },

  /**
   * 发送POST请求
   * 
   * @template T 响应数据类型
   * @param {string} url - 请求URL
   * @param {any} [data] - 请求体数据
   * @param {AxiosRequestConfig} [config] - 请求配置选项
   * @returns {Promise<T>} 解构后的业务数据
   * @complexity O(1) - HTTP请求的复杂度取决于网络和服务端
   * @flow 发送请求 -> 响应拦截器处理 -> 解构data.data -> 返回业务数据
   * 
   * @example
   * ```typescript
   * const newUser = await http.post<User>('/users', { name: 'John', email: 'john@example.com' })
   * ```
   */
  post: async <T = any>(url:string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    const response = await request.post(url, data, config)
    return response.data.data
  },

  /**
   * 发送PUT请求
   * 
   * @template T 响应数据类型
   * @param {string} url - 请求URL
   * @param {any} [data] - 请求体数据
   * @param {AxiosRequestConfig} [config] - 请求配置选项
   * @returns {Promise<T>} 解构后的业务数据
   * @complexity O(1) - HTTP请求的复杂度取决于网络和服务端
   * @flow 发送请求 -> 响应拦截器处理 -> 解构data.data -> 返回业务数据
   * 
   * @example
   * ```typescript
   * const updatedUser = await http.put<User>('/users/1', { name: 'John Updated' })
   * ```
   */
  put: async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    const response = await request.put(url, data, config)
    return response.data.data
  },

  /**
   * 发送DELETE请求
   * 
   * @template T 响应数据类型
   * @param {string} url - 请求URL
   * @param {AxiosRequestConfig} [config] - 请求配置选项
   * @returns {Promise<T>} 解构后的业务数据
   * @complexity O(1) - HTTP请求的复杂度取决于网络和服务端
   * @flow 发送请求 -> 响应拦截器处理 -> 解构data.data -> 返回业务数据
   * 
   * @example
   * ```typescript
   * await http.delete('/users/1')
   * ```
   */
  delete: async <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    const response = await request.delete(url, config)
    return response.data.data
  },
}

/**
 * 默认导出的Axios实例
 * 可用于需要直接访问原始Axios功能的场景
 * 大多数情况下推荐使用http对象的封装方法
 * 
 * @default request
 */
export default request