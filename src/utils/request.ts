import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios'
import type { ApiResponse } from '@/types/api'

// 创建 axios 实例
const request: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器
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

// 响应拦截器
request.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const { data } = response

    // 业务成功
    if (data.code === 200 || data.success) {
      return data.data
    }

    // 业务失败
    // 使用 console.error，避免在服务端渲染时出错
    if (typeof window !== 'undefined') {
      console.error('API Error:', data.message)
    }
    return Promise.reject(new Error(data.message || '请求失败'))
  },
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

// 封装请求方法
export const http = {
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    request.get(url, config),

  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> =>
    request.post(url, data, config),

  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> =>
    request.put(url, data, config),

  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    request.delete(url, config),
}

export default request