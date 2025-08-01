/**
 * @fileoverview 分销系统统一错误码映射工具模块
 * 提供完整的错误码到用户友好消息的映射表，确保前后端错误码的一致性
 * 
 * @module utils/errorCodeMapping
 * @author Frontend Team
 * @since 1.0.0
 */

import { toast } from '@/components/ui/toast/use-toast'

/**
 * 错误响应接口
 * 定义后端返回的标准错误响应格式
 */
export interface ErrorResponse {
  code: number           // HTTP状态码
  success: false         // 固定为false
  message: string        // 用户友好的错误消息
  data: {
    error_code: string   // 业务错误码，如 "USER_001"
    field?: string       // 错误字段（如果适用）
    value?: any         // 错误值（如果适用）
    details?: any       // 详细错误信息（如果适用）
  } | null
}

/**
 * 完整的错误码映射表
 * 基于API文档中的统一错误码规范
 */
export const ERROR_CODE_MESSAGES: Record<string, string> = {
  // 通用错误码 (COMMON_001-099)
  'COMMON_001': '系统维护中，请稍后重试',
  'COMMON_002': '请求超时，请稍后重试',
  'COMMON_003': '数据库连接失败，请联系技术支持',
  'COMMON_004': '缓存服务异常，请稍后重试',
  'COMMON_005': '第三方服务异常，请稍后重试',

  // 认证服务 (AUTH_001-099)
  'AUTH_001': '用户名或密码错误',
  'AUTH_002': '账户已被锁定',
  'AUTH_003': '账户已被禁用',
  'AUTH_004': 'Token已过期，请重新登录',
  'AUTH_005': 'Token格式无效',
  'AUTH_006': '刷新Token无效',
  'AUTH_007': '登录失败次数过多，请稍后重试',
  'AUTH_008': '验证码错误',
  'AUTH_009': '验证码已过期',
  'AUTH_010': '密码强度不足',

  // 用户管理 (USER_001-099)
  'USER_001': '用户不存在，请检查用户信息',
  'USER_002': '用户名已存在，请使用其他用户名',
  'USER_003': '邮箱已被使用，请使用其他邮箱',
  'USER_004': '手机号已被使用，请使用其他手机号',
  'USER_005': '密码格式不正确',
  'USER_006': '用户状态异常',
  'USER_007': '层级关系错误',
  'USER_008': '权限不足',
  'USER_009': '批量操作数量超限',
  'USER_010': '导出数据过多',

  // 客资管理 (LEAD_001-099)
  'LEAD_001': '客资不存在',
  'LEAD_002': '手机号已存在',
  'LEAD_003': '客资姓名不能为空',
  'LEAD_004': '手机号格式不正确',
  'LEAD_005': '来源信息无效',
  'LEAD_006': '客资状态异常',
  'LEAD_007': '权限不足',
  'LEAD_008': '销售人员不存在',
  'LEAD_009': '重复客资检查失败',
  'LEAD_010': '来源检测失败',
  'LEAD_011': '推荐码无效',
  'LEAD_012': '批量导入失败',
  'LEAD_013': '导出数据过多',
  'LEAD_014': 'UTM参数格式错误',
  'LEAD_015': '来源验证失败',

  // 交易管理 (DEAL_001-099)
  'DEAL_001': '交易不存在',
  'DEAL_002': '交易状态异常',
  'DEAL_003': '交易金额无效',
  'DEAL_004': '佣金计算失败',
  'DEAL_005': '产品不存在',
  'DEAL_006': '客资未分配',
  'DEAL_007': '重复交易',
  'DEAL_008': '交易已完成无法修改',
  'DEAL_009': '权限不足',
  'DEAL_010': '结算周期错误',

  // 产品管理 (PRODUCT_001-099)
  'PRODUCT_001': '产品不存在',
  'PRODUCT_002': '产品名称已存在',
  'PRODUCT_003': '产品状态异常',
  'PRODUCT_004': '价格配置错误',
  'PRODUCT_005': '佣金比例无效',
  'PRODUCT_006': '产品分类不存在',
  'PRODUCT_007': '库存不足',
  'PRODUCT_008': '产品已下架',
  'PRODUCT_009': '权限不足',
  'PRODUCT_010': '批量操作失败',

  // 推广管理 (PROMOTION_001-099)
  'PROMOTION_001': '推广任务不存在',
  'PROMOTION_002': '没有审核权限',
  'PROMOTION_003': '只能审核指定范围内的任务',
  'PROMOTION_004': '任务已被其他审核员处理',
  'PROMOTION_005': '任务当前状态不允许审核',
  'PROMOTION_006': '无法审核自己提交的任务',
  'PROMOTION_007': '审核意见不能为空',
  'PROMOTION_008': '审核意见长度超限',
  'PROMOTION_009': '奖励金额必须大于0',
  'PROMOTION_010': '奖励金额超出范围限制',
  'PROMOTION_011': '任务状态异常',
  'PROMOTION_012': '审核操作超时',
  'PROMOTION_013': '批量审核任务数量超限',
  'PROMOTION_014': '提交次数已达每日限制',
  'PROMOTION_015': 'URL无法识别或不支持',

  // 代理管理 (AGENT_001-099)
  'AGENT_001': '代理不存在',
  'AGENT_002': '邮箱已被使用',
  'AGENT_003': '手机号已被使用',
  'AGENT_004': '代理等级无效',
  'AGENT_005': '上级代理不存在',
  'AGENT_006': '存在下级代理，无法删除',
  'AGENT_007': '业绩数据计算失败',
  'AGENT_008': '层级关系冲突',
  'AGENT_009': '代理状态异常',
  'AGENT_010': '权限不足',

  // 邀请系统 (INVITE_001-099)
  'INVITE_001': '邀请码无效或不存在',
  'INVITE_002': '邀请码已过期',
  'INVITE_003': '角色无法使用此邀请码',
  'INVITE_004': '不能使用自己的邀请码',
  'INVITE_005': '没有邀请权限',
  'INVITE_006': '邀请码使用次数已达上限',
  'INVITE_007': '邀请码不存在',
  'INVITE_008': '此邀请码已被使用过',
  'INVITE_009': '邀请码配额已达上限',
  'INVITE_010': '目标角色无效',

  // 奖励系统 (REWARD_001-099)
  'REWARD_001': '提交次数已达每日限制',
  'REWARD_002': '结算周期不存在',
  'REWARD_003': '二次审核资格不符合',
  'REWARD_004': '奖励记录不存在',
  'REWARD_005': '结算状态异常',
  'REWARD_006': '奖励金额计算错误',
  'REWARD_007': '权限不足',
  'REWARD_008': '结算周期已锁定',
  'REWARD_009': '重复结算',
  'REWARD_010': '数据同步失败',

  // 系统配置 (CONFIG_001-099)
  'CONFIG_001': '配置不存在',
  'CONFIG_002': '配置格式错误',
  'CONFIG_003': '配置版本冲突',
  'CONFIG_004': '配置审核失败',
  'CONFIG_005': '数据同步失败',
  'CONFIG_006': '权限不足',
  'CONFIG_007': '配置类型无效',
  'CONFIG_008': '配置状态异常',
  'CONFIG_009': '配置规则验证失败',
  'CONFIG_010': '批量操作失败',

  // 仪表盘统计 (DASHBOARD_001-099)
  'DASHBOARD_001': '数据不存在',
  'DASHBOARD_002': '时间范围无效',
  'DASHBOARD_003': '图表类型不支持',
  'DASHBOARD_004': '数据计算失败',
  'DASHBOARD_005': '权限不足',
  'DASHBOARD_006': '数据量过大',
  'DASHBOARD_007': '缓存失效',
  'DASHBOARD_008': '导出失败',
  'DASHBOARD_009': '筛选条件无效',
  'DASHBOARD_010': '统计维度不支持',

  // 兼容旧错误码（逐步废弃）
  'AUDIT_001': '没有审核权限',
  'AUDIT_002': '只能审核指定范围内的任务',
  'AUDIT_003': '任务已被其他审核员处理',
  'AUDIT_004': '任务当前状态不允许审核',
  'AUDIT_005': '无法审核自己提交的任务',
  'AUDIT_101': '审核意见不能为空',
  'AUDIT_102': '审核意见长度超限',
  'AUDIT_103': '奖励金额必须大于0',
  'AUDIT_104': '奖励金额超出范围限制',
  'AUDIT_201': '任务不存在或已被删除',
  'AUDIT_202': '任务状态异常',
  'AUDIT_203': '审核操作超时',
  'AUDIT_204': '批量审核任务数量超限',

  // 注册相关错误（兼容）
  'REG_001': '用户名已存在',
  'REG_002': '邮箱已被注册',
  'REG_003': '密码强度不够',
  'REG_004': '邮箱格式不正确',
  'REG_005': '用户名格式不正确',
  'REG_006': '手机号格式不正确',
  'REG_007': '注册失败，请稍后重试',

  // 令牌相关错误（兼容）
  'TOKEN_001': '访问令牌无效',
  'TOKEN_002': '访问令牌已过期',
  'TOKEN_003': '刷新令牌无效',
  'TOKEN_004': '刷新令牌已过期',

  // 密码重置相关错误（兼容）
  'PWD_RESET_001': '重置令牌无效',
  'PWD_RESET_002': '重置令牌已过期',
  'PWD_RESET_003': '该邮箱未注册',
  'PWD_RESET_004': '重置邮件发送失败',
}

/**
 * HTTP状态码对应的默认错误消息
 */
export const HTTP_ERROR_MESSAGES: Record<number, string> = {
  400: '请求参数错误',
  401: '未认证或登录已过期',
  403: '权限不足',
  404: '请求的资源不存在',
  409: '数据冲突',
  422: '数据验证失败',
  429: '请求过于频繁，请稍后重试',
  500: '服务器内部错误',
  502: '网关错误',
  503: '服务暂时不可用',
  504: '网关超时',
}

/**
 * 统一错误处理函数
 * 根据错误对象提取错误码并返回用户友好的错误消息
 * 
 * @param error - 错误对象
 * @returns 用户友好的错误消息
 */
export function handleApiError(error: any): string {
  // 提取业务错误码
  const errorCode = error?.response?.data?.data?.error_code || 
                   error?.response?.data?.error_code ||
                   error?.response?.data?.code ||
                   error?.code

  // 如果有业务错误码映射，优先使用
  if (errorCode && ERROR_CODE_MESSAGES[errorCode]) {
    return ERROR_CODE_MESSAGES[errorCode]
  }

  // 检查HTTP状态码
  const httpStatus = error?.response?.status
  if (httpStatus && HTTP_ERROR_MESSAGES[httpStatus]) {
    return HTTP_ERROR_MESSAGES[httpStatus]
  }

  // 使用后端返回的消息
  const backendMessage = error?.response?.data?.message || error?.message
  if (backendMessage) {
    return backendMessage
  }

  // 默认错误消息
  return '操作失败，请稍后重试'
}

/**
 * 显示错误提示的便捷函数
 * 自动处理错误并显示Toast提示
 * 
 * @param error - 错误对象
 * @param title - 可选的错误标题，默认为"操作失败"
 */
export function showErrorToast(error: any, title: string = '操作失败') {
  const message = handleApiError(error)
  
  toast({
    title,
    description: message,
    variant: 'destructive'
  })
}

/**
 * 错误处理装饰器
 * 为异步函数添加自动错误处理和Toast提示
 * 
 * @param fn - 要装饰的异步函数
 * @param errorTitle - 错误提示标题
 * @returns 装饰后的函数
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  errorTitle: string = '操作失败'
): T {
  return (async (...args: any[]) => {
    try {
      return await fn(...args)
    } catch (error) {
      showErrorToast(error, errorTitle)
      throw error
    }
  }) as T
}

export default {
  ERROR_CODE_MESSAGES,
  HTTP_ERROR_MESSAGES,
  handleApiError,
  showErrorToast,
  withErrorHandling
}
