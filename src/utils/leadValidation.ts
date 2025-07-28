/**
 * @fileoverview 客资表单验证规则工具模块
 * 提供完整的客资管理表单验证功能，包括字段格式验证、业务逻辑验证、异步验证和综合验证服务
 * 
 * @module utils/leadValidation
 * @requires zod
 * @requires @/types/lead
 * @requires @/api/leadAudit
 * @requires @/api/lead
 */

import { z } from 'zod'
import type { CreateLeadRequest, UpdateLeadRequest, PredefinedSource } from '@/types/lead'
import { leadAuditApi } from '@/api/leadAudit'
import { leadApi } from '@/api/lead'

/**
 * 手机号验证正则表达式
 * 支持中国大陆手机号格式：13x, 14x, 15x, 16x, 17x, 18x, 19x
 * 
 * @constant
 * @type {RegExp}
 * @complexity O(1) - 正则表达式匹配为常数时间复杂度
 * 
 * @example
 * ```typescript
 * console.log(PHONE_REGEX.test('13800138000')) // true
 * console.log(PHONE_REGEX.test('12800138000')) // false
 * console.log(PHONE_REGEX.test('1380013800'))  // false
 * ```
 */
export const PHONE_REGEX = /^1[3-9]\d{9}$/

/**
 * 微信号验证正则表达式
 * 支持：字母、数字、下划线、中划线，6-20位
 * 
 * @constant
 * @type {RegExp}
 * @complexity O(1) - 正则表达式匹配为常数时间复杂度
 * 
 * @example
 * ```typescript
 * console.log(WECHAT_ID_REGEX.test('wechat_123')) // true
 * console.log(WECHAT_ID_REGEX.test('wx-abc'))     // false (少于6位)
 * console.log(WECHAT_ID_REGEX.test('wechat@123')) // false (包含@)
 * ```
 */
export const WECHAT_ID_REGEX = /^[a-zA-Z0-9_-]{6,20}$/

/**
 * 推荐码验证正则表达式
 * 支持：字母、数字，4-12位
 * 
 * @constant
 * @type {RegExp}
 * @complexity O(1) - 正则表达式匹配为常数时间复杂度
 * 
 * @example
 * ```typescript
 * console.log(REFERRAL_CODE_REGEX.test('ABC123'))   // true
 * console.log(REFERRAL_CODE_REGEX.test('ab1'))      // false (少于4位)
 * console.log(REFERRAL_CODE_REGEX.test('abc_123'))  // false (包含下划线)
 * ```
 */
export const REFERRAL_CODE_REGEX = /^[A-Za-z0-9]{4,12}$/

/**
 * 客户姓名验证正则表达式
 * 支持：中文、英文、数字、空格，2-20位
 * 
 * @constant
 * @type {RegExp}
 * @complexity O(1) - 正则表达式匹配为常数时间复杂度
 * 
 * @example
 * ```typescript
 * console.log(CUSTOMER_NAME_REGEX.test('张三'))      // true
 * console.log(CUSTOMER_NAME_REGEX.test('John Smith')) // true
 * console.log(CUSTOMER_NAME_REGEX.test('李四123'))    // true
 * console.log(CUSTOMER_NAME_REGEX.test('王@五'))      // false (包含特殊字符)
 * ```
 */
export const CUSTOMER_NAME_REGEX = /^[\u4e00-\u9fa5a-zA-Z0-9\s]{2,20}$/

/**
 * 基础字段验证函数集合
 * 提供各个字段的同步验证功能，包括格式检查、长度验证等
 * 
 * @namespace fieldValidators
 * @complexity O(1) - 所有验证函数都是常数时间复杂度
 */
export const fieldValidators = {
  /**
   * 验证客户姓名
   * 检查姓名的格式、长度和字符集合是否符合要求
   * 
   * @param {string} name - 客户姓名
   * @returns {{ isValid: boolean; message?: string }} 验证结果
   * @complexity O(n) - n为姓名长度，需要正则表达式匹配
   * @flow 空值检查 -> 长度验证 -> 格式验证 -> 返回结果
   * 
   * @example
   * ```typescript
   * const result1 = fieldValidators.validateCustomerName('张三')
   * console.log(result1.isValid) // true
   * 
   * const result2 = fieldValidators.validateCustomerName('A')
   * console.log(result2.isValid) // false
   * console.log(result2.message) // '客户姓名至少需要2个字符'
   * 
   * const result3 = fieldValidators.validateCustomerName('王@五')
   * console.log(result3.isValid) // false
   * console.log(result3.message) // '客户姓名只能包含中文、英文、数字和空格'
   * ```
   */
  validateCustomerName: (name: string): { isValid: boolean; message?: string } => {
    if (!name || name.trim().length === 0) {
      return { isValid: false, message: '客户姓名不能为空' }
    }
    
    if (name.trim().length < 2) {
      return { isValid: false, message: '客户姓名至少需要2个字符' }
    }
    
    if (name.trim().length > 20) {
      return { isValid: false, message: '客户姓名不能超过20个字符' }
    }
    
    if (!CUSTOMER_NAME_REGEX.test(name.trim())) {
      return { isValid: false, message: '客户姓名只能包含中文、英文、数字和空格' }
    }
    
    return { isValid: true }
  },

  /**
   * 验证手机号
   * 检查手机号格式是否符合中国大陆手机号规范
   * 
   * @param {string} phone - 手机号码
   * @returns {{ isValid: boolean; message?: string }} 验证结果
   * @complexity O(n) - n为手机号长度，需要字符串处理和正则匹配
   * @flow 空值检查 -> 格式清理 -> 正则验证 -> 返回结果
   * 
   * @example
   * ```typescript
   * const result1 = fieldValidators.validatePhone('13800138000')
   * console.log(result1.isValid) // true
   * 
   * const result2 = fieldValidators.validatePhone('138 0013 8000')
   * console.log(result2.isValid) // true (自动清理空格)
   * 
   * const result3 = fieldValidators.validatePhone('12800138000')
   * console.log(result3.isValid) // false
   * console.log(result3.message) // '请输入正确的手机号格式'
   * ```
   */
  validatePhone: (phone: string): { isValid: boolean; message?: string } => {
    if (!phone || phone.trim().length === 0) {
      return { isValid: false, message: '手机号不能为空' }
    }
    
    const cleanPhone = phone.replace(/\s|-/g, '') // 移除空格和中划线
    
    if (!PHONE_REGEX.test(cleanPhone)) {
      return { isValid: false, message: '请输入正确的手机号格式' }
    }
    
    return { isValid: true }
  },

  /**
   * 验证微信号
   * 检查微信号格式是否符合规范，微信号为可选字段
   * 
   * @param {string} wechatId - 微信号
   * @returns {{ isValid: boolean; message?: string }} 验证结果
   * @complexity O(n) - n为微信号长度，需要正则表达式匹配
   * @flow 空值检查 -> 长度验证 -> 格式验证 -> 返回结果
   * 
   * @example
   * ```typescript
   * const result1 = fieldValidators.validateWechatId('wechat_123')
   * console.log(result1.isValid) // true
   * 
   * const result2 = fieldValidators.validateWechatId('')
   * console.log(result2.isValid) // true (可选字段)
   * 
   * const result3 = fieldValidators.validateWechatId('wx123')
   * console.log(result3.isValid) // false
   * console.log(result3.message) // '微信号至少需要6个字符'
   * ```
   */
  validateWechatId: (wechatId: string): { isValid: boolean; message?: string } => {
    if (!wechatId || wechatId.trim().length === 0) {
      return { isValid: true } // 微信号是可选的
    }
    
    if (wechatId.trim().length < 6) {
      return { isValid: false, message: '微信号至少需要6个字符' }
    }
    
    if (wechatId.trim().length > 20) {
      return { isValid: false, message: '微信号不能超过20个字符' }
    }
    
    if (!WECHAT_ID_REGEX.test(wechatId.trim())) {
      return { isValid: false, message: '微信号只能包含字母、数字、下划线和中划线' }
    }
    
    return { isValid: true }
  },

  /**
   * 验证推荐码
   * 检查推荐码格式是否符合规范，推荐码为可选字段
   * 
   * @param {string} code - 推荐码
   * @returns {{ isValid: boolean; message?: string }} 验证结果
   * @complexity O(n) - n为推荐码长度，需要正则表达式匹配
   * @flow 空值检查 -> 长度验证 -> 格式验证 -> 返回结果
   * 
   * @example
   * ```typescript
   * const result1 = fieldValidators.validateReferralCode('ABC123')
   * console.log(result1.isValid) // true
   * 
   * const result2 = fieldValidators.validateReferralCode('')
   * console.log(result2.isValid) // true (可选字段)
   * 
   * const result3 = fieldValidators.validateReferralCode('AB1')
   * console.log(result3.isValid) // false
   * console.log(result3.message) // '推荐码至少需要4个字符'
   * ```
   */
  validateReferralCode: (code: string): { isValid: boolean; message?: string } => {
    if (!code || code.trim().length === 0) {
      return { isValid: true } // 推荐码是可选的
    }
    
    if (code.trim().length < 4) {
      return { isValid: false, message: '推荐码至少需要4个字符' }
    }
    
    if (code.trim().length > 12) {
      return { isValid: false, message: '推荐码不能超过12个字符' }
    }
    
    if (!REFERRAL_CODE_REGEX.test(code.trim())) {
      return { isValid: false, message: '推荐码只能包含字母和数字' }
    }
    
    return { isValid: true }
  },

  /**
   * 验证来源
   * 检查客资来源描述是否符合要求
   * 
   * @param {string} source - 来源描述
   * @returns {{ isValid: boolean; message?: string }} 验证结果
   * @complexity O(n) - n为来源字符串长度，需要长度检查
   * @flow 空值检查 -> 长度验证 -> 返回结果
   * 
   * @example
   * ```typescript
   * const result1 = fieldValidators.validateSource('朋友介绍')
   * console.log(result1.isValid) // true
   * 
   * const result2 = fieldValidators.validateSource('')
   * console.log(result2.isValid) // false
   * console.log(result2.message) // '来源不能为空'
   * 
   * const result3 = fieldValidators.validateSource('a'.repeat(51))
   * console.log(result3.isValid) // false
   * console.log(result3.message) // '来源描述不能超过50个字符'
   * ```
   */
  validateSource: (source: string): { isValid: boolean; message?: string } => {
    if (!source || source.trim().length === 0) {
      return { isValid: false, message: '来源不能为空' }
    }
    
    if (source.trim().length > 50) {
      return { isValid: false, message: '来源描述不能超过50个字符' }
    }
    
    return { isValid: true }
  },

  /**
   * 验证备注
   * 检查备注信息长度是否符合要求，备注为可选字段
   * 
   * @param {string} notes - 备注信息
   * @returns {{ isValid: boolean; message?: string }} 验证结果
   * @complexity O(n) - n为备注字符串长度，需要长度检查
   * @flow 空值检查 -> 长度验证 -> 返回结果
   * 
   * @example
   * ```typescript
   * const result1 = fieldValidators.validateNotes('客户很有兴趣')
   * console.log(result1.isValid) // true
   * 
   * const result2 = fieldValidators.validateNotes('')
   * console.log(result2.isValid) // true (可选字段)
   * 
   * const result3 = fieldValidators.validateNotes('a'.repeat(501))
   * console.log(result3.isValid) // false
   * console.log(result3.message) // '备注不能超过500个字符'
   * ```
   */
  validateNotes: (notes: string): { isValid: boolean; message?: string } => {
    if (!notes || notes.trim().length === 0) {
      return { isValid: true } // 备注是可选的
    }
    
    if (notes.trim().length > 500) {
      return { isValid: false, message: '备注不能超过500个字符' }
    }
    
    return { isValid: true }
  }
}

/**
 * 异步验证函数集合
 * 提供需要服务器验证的功能，如重复性检查、推荐码有效性验证等
 * 
 * @namespace asyncValidators
 * @complexity O(1) + O(network) - 基础验证为常数时间，网络请求时间取决于服务器响应
 */
export const asyncValidators = {
  /**
   * 检查手机号重复性
   * 通过API检查指定手机号是否已存在于系统中，支持排除特定客资ID（用于更新场景）
   * 
   * @param {string} phone - 待检查的手机号
   * @param {string} [excludeLeadId] - 需要排除的客资ID（更新时使用）
   * @returns {Promise<{ isValid: boolean; message?: string; duplicateLeads?: any[] }>} 检查结果
   * @complexity O(1) + O(network) - API调用的时间复杂度主要取决于网络延迟
   * @flow API调用 -> 结果处理 -> 排除逻辑 -> 返回验证结果
   * 
   * @example
   * ```typescript
   * // 检查新手机号
   * const result1 = await asyncValidators.checkPhoneDuplicate('13800138000')
   * if (!result1.isValid) {
   *   console.log(result1.message) // '该手机号已存在2条客资记录'
   *   console.log(result1.duplicateLeads) // 重复客资列表
   * }
   * 
   * // 更新时排除当前客资
   * const result2 = await asyncValidators.checkPhoneDuplicate('13800138000', 'lead123')
   * // 不会将ID为lead123的客资计入重复检查
   * ```
   */
  checkPhoneDuplicate: async (phone: string, excludeLeadId?: string): Promise<{
    isValid: boolean
    message?: string
    duplicateLeads?: any[]
  }> => {
    try {
      const result = await leadApi.checkDuplicateLead({ phone })
      
      if (result.isDuplicate) {
        // 如果是更新操作，排除当前客资
        const duplicates = excludeLeadId 
          ? result.duplicateLeads.filter(lead => lead.id !== excludeLeadId)
          : result.duplicateLeads
        
        if (duplicates.length > 0) {
          return {
            isValid: false,
            message: `该手机号已存在${duplicates.length}条客资记录`,
            duplicateLeads: duplicates
          }
        }
      }
      
      return { isValid: true }
    } catch (error) {
      console.error('重复性检查失败:', error)
      return {
        isValid: true, // 检查失败时不阻止提交
        message: '重复性检查失败，请稍后重试'
      }
    }
  },

  /**
   * 验证推荐码有效性
   * 通过API检查推荐码是否有效、是否过期、是否已用完等状态
   * 
   * @param {string} code - 待验证的推荐码
   * @returns {Promise<{ isValid: boolean; message?: string; referrerInfo?: any }>} 验证结果
   * @complexity O(1) + O(network) - API调用的时间复杂度主要取决于网络延迟
   * @flow 空值检查 -> API调用 -> 状态判断 -> 返回验证结果
   * 
   * @example
   * ```typescript
   * // 验证推荐码
   * const result = await asyncValidators.validateReferralCodeAsync('ABC123')
   * if (result.isValid) {
   *   console.log('推荐人信息:', result.referrerInfo)
   * } else {
   *   console.log('验证失败:', result.message)
   *   // 可能的错误：推荐码无效、已过期、使用次数已达上限
   * }
   * 
   * // 空推荐码验证
   * const emptyResult = await asyncValidators.validateReferralCodeAsync('')
   * console.log(emptyResult.isValid) // true (可选字段)
   * ```
   */
  validateReferralCodeAsync: async (code: string): Promise<{
    isValid: boolean
    message?: string
    referrerInfo?: any
  }> => {
    if (!code || code.trim().length === 0) {
      return { isValid: true }
    }
    
    try {
      const result = await leadApi.validateReferralCode(code.trim())
      
      if (!result.isValid) {
        let message = '推荐码无效'
        
        if (result.isExpired) {
          message = '推荐码已过期'
        } else if (result.isExhausted) {
          message = '推荐码使用次数已达上限'
        }
        
        return {
          isValid: false,
          message
        }
      }
      
      return {
        isValid: true,
        referrerInfo: result.referrerInfo
      }
    } catch (error) {
      console.error('推荐码验证失败:', error)
      return {
        isValid: true, // 验证失败时不阻止提交
        message: '推荐码验证失败，请稍后重试'
      }
    }
  }
}

/**
 * Zod 验证模式定义
 * 使用Zod库定义的结构化验证规则，支持类型安全的表单验证
 * 
 * @namespace leadValidationSchemas
 * @requires zod
 * @complexity O(n) - n为验证字段数量，Zod会逐个验证每个字段
 */
export const leadValidationSchemas = {
  /**
   * 创建客资验证模式
   * 定义创建新客资时所有字段的验证规则，包括必填字段和可选字段
   * 
   * @type {z.ZodObject}
   * @complexity O(n) - n为字段数量，每个字段都需要验证
   * 
   * @example
   * ```typescript
   * try {
   *   const validData = leadValidationSchemas.createLead.parse({
   *     name: '张三',
   *     phone: '13800138000',
   *     source: '朋友介绍',
   *     salespersonId: 'sales123'
   *   })
   *   console.log('验证通过:', validData)
   * } catch (error) {
   *   console.error('验证失败:', error.errors)
   * }
   * ```
   */
  createLead: z.object({
    name: z.string()
      .min(1, '客户姓名不能为空')
      .min(2, '客户姓名至少需要2个字符')
      .max(20, '客户姓名不能超过20个字符')
      .regex(CUSTOMER_NAME_REGEX, '客户姓名只能包含中文、英文、数字和空格'),
    
    phone: z.string()
      .min(1, '手机号不能为空')
      .regex(PHONE_REGEX, '请输入正确的手机号格式'),
    
    source: z.string()
      .min(1, '来源不能为空')
      .max(50, '来源描述不能超过50个字符'),
    
    salespersonId: z.string()
      .min(1, '请选择归属销售'),
    
    wechatId: z.string()
      .optional()
      .refine(
        (val) => !val || WECHAT_ID_REGEX.test(val),
        '微信号只能包含字母、数字、下划线和中划线'
      )
      .refine(
        (val) => !val || (val.length >= 6 && val.length <= 20),
        '微信号长度应在6-20个字符之间'
      ),
    
    notes: z.string()
      .optional()
      .refine(
        (val) => !val || val.length <= 500,
        '备注不能超过500个字符'
      ),
    
    referralCode: z.string()
      .optional()
      .refine(
        (val) => !val || REFERRAL_CODE_REGEX.test(val),
        '推荐码只能包含字母和数字'
      )
      .refine(
        (val) => !val || (val.length >= 4 && val.length <= 12),
        '推荐码长度应在4-12个字符之间'
      ),
    
    utmSource: z.string().optional(),
    utmMedium: z.string().optional(),
    utmCampaign: z.string().optional(),
    referrer: z.string().optional()
  }),

  /**
   * 更新客资验证模式
   * 定义更新客资时的验证规则，所有字段都为可选，允许部分更新
   * 
   * @type {z.ZodObject}
   * @complexity O(n) - n为提供的字段数量，只验证传入的字段
   * 
   * @example
   * ```typescript
   * try {
   *   const validData = leadValidationSchemas.updateLead.parse({
   *     name: '李四', // 只更新姓名
   *     notes: '客户很有兴趣' // 添加备注
   *   })
   *   console.log('验证通过:', validData)
   * } catch (error) {
   *   console.error('验证失败:', error.errors)
   * }
   * ```
   */
  updateLead: z.object({
    name: z.string()
      .min(2, '客户姓名至少需要2个字符')
      .max(20, '客户姓名不能超过20个字符')
      .regex(CUSTOMER_NAME_REGEX, '客户姓名只能包含中文、英文、数字和空格')
      .optional(),
    
    phone: z.string()
      .regex(PHONE_REGEX, '请输入正确的手机号格式')
      .optional(),
    
    source: z.string()
      .max(50, '来源描述不能超过50个字符')
      .optional(),
    
    salespersonId: z.string().optional(),
    
    wechatId: z.string()
      .optional()
      .refine(
        (val) => !val || WECHAT_ID_REGEX.test(val),
        '微信号只能包含字母、数字、下划线和中划线'
      ),
    
    notes: z.string()
      .optional()
      .refine(
        (val) => !val || val.length <= 500,
        '备注不能超过500个字符'
      ),
    
    referralCode: z.string()
      .optional()
      .refine(
        (val) => !val || REFERRAL_CODE_REGEX.test(val),
        '推荐码只能包含字母和数字'
      )
  })
}

/**
 * 表单验证工具类
 * 提供完整的表单验证服务，整合同步验证、异步验证和业务逻辑验证
 * 
 * @class LeadFormValidator
 * @complexity 各方法复杂度不同，详见具体方法说明
 */
export class LeadFormValidator {
  /**
   * 验证创建客资表单
   * 执行完整的表单验证，包括Zod结构验证和异步业务验证
   * 
   * @param {CreateLeadRequest} data - 创建客资的表单数据
   * @returns {Promise<{ isValid: boolean; errors: Record<string, string>; warnings: Record<string, string> }>} 验证结果
   * @complexity O(n) + O(async) - n为字段数量，异步验证取决于网络请求
   * @flow Zod验证 -> 异步手机号检查 -> 异步推荐码验证 -> 汇总结果
   * 
   * @example
   * ```typescript
   * const formData = {
   *   name: '张三',
   *   phone: '13800138000',
   *   source: '朋友介绍',
   *   salespersonId: 'sales123',
   *   referralCode: 'ABC123'
   * }
   * 
   * const result = await LeadFormValidator.validateCreateForm(formData)
   * if (result.isValid) {
   *   console.log('表单验证通过')
   * } else {
   *   console.log('验证错误:', result.errors)
   *   // 例如：{ phone: '该手机号已存在2条客资记录' }
   * }
   * ```
   */
  static async validateCreateForm(data: CreateLeadRequest): Promise<{
    isValid: boolean
    errors: Record<string, string>
    warnings: Record<string, string>
  }> {
    const errors: Record<string, string> = {}
    const warnings: Record<string, string> = {}
    
    try {
      // Zod 基础验证
      leadValidationSchemas.createLead.parse(data)
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach(err => {
          const field = err.path.join('.')
          errors[field] = err.message
        })
      }
    }
    
    // 异步验证
    if (data.phone && !errors.phone) {
      const phoneCheck = await asyncValidators.checkPhoneDuplicate(data.phone)
      if (!phoneCheck.isValid) {
        errors.phone = phoneCheck.message || '手机号验证失败'
      }
    }
    
    if (data.referralCode && !errors.referralCode) {
      const codeCheck = await asyncValidators.validateReferralCodeAsync(data.referralCode)
      if (!codeCheck.isValid) {
        errors.referralCode = codeCheck.message || '推荐码验证失败'
      }
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      warnings
    }
  }

  /**
   * 验证更新客资表单
   * 执行更新表单的完整验证，自动排除当前客资进行重复性检查
   * 
   * @param {UpdateLeadRequest} data - 更新客资的表单数据
   * @param {string} leadId - 当前客资ID，用于排除重复性检查
   * @returns {Promise<{ isValid: boolean; errors: Record<string, string>; warnings: Record<string, string> }>} 验证结果
   * @complexity O(n) + O(async) - n为字段数量，异步验证取决于网络请求
   * @flow Zod验证 -> 异步手机号检查（排除当前ID） -> 异步推荐码验证 -> 汇总结果
   * 
   * @example
   * ```typescript
   * const updateData = {
   *   name: '李四',
   *   phone: '13900139000' // 更新手机号
   * }
   * 
   * const result = await LeadFormValidator.validateUpdateForm(updateData, 'lead123')
   * if (result.isValid) {
   *   console.log('更新验证通过')
   * } else {
   *   console.log('验证错误:', result.errors)
   * }
   * ```
   */
  static async validateUpdateForm(data: UpdateLeadRequest, leadId: string): Promise<{
    isValid: boolean
    errors: Record<string, string>
    warnings: Record<string, string>
  }> {
    const errors: Record<string, string> = {}
    const warnings: Record<string, string> = {}
    
    try {
      // Zod 基础验证
      leadValidationSchemas.updateLead.parse(data)
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach(err => {
          const field = err.path.join('.')
          errors[field] = err.message
        })
      }
    }
    
    // 异步验证（更新时排除当前客资）
    if (data.phone && !errors.phone) {
      const phoneCheck = await asyncValidators.checkPhoneDuplicate(data.phone, leadId)
      if (!phoneCheck.isValid) {
        errors.phone = phoneCheck.message || '手机号验证失败'
      }
    }
    
    if (data.referralCode && !errors.referralCode) {
      const codeCheck = await asyncValidators.validateReferralCodeAsync(data.referralCode)
      if (!codeCheck.isValid) {
        errors.referralCode = codeCheck.message || '推荐码验证失败'
      }
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      warnings
    }
  }

  /**
   * 实时字段验证
   * 对单个字段进行即时验证，用于表单输入过程中的实时反馈
   * 
   * @param {string} fieldName - 字段名称
   * @param {any} value - 字段值
   * @returns {{ isValid: boolean; message?: string }} 验证结果
   * @complexity O(n) - n为字段值长度，取决于具体验证逻辑
   * @flow 字段名判断 -> 调用对应验证器 -> 返回结果
   * 
   * @example
   * ```typescript
   * // 验证客户姓名
   * const nameResult = LeadFormValidator.validateField('name', '张三')
   * console.log(nameResult.isValid) // true
   * 
   * // 验证手机号
   * const phoneResult = LeadFormValidator.validateField('phone', '13800138000')
   * console.log(phoneResult.isValid) // true
   * 
   * // 验证无效字段
   * const invalidResult = LeadFormValidator.validateField('phone', '123')
   * console.log(invalidResult.isValid) // false
   * console.log(invalidResult.message) // '请输入正确的手机号格式'
   * 
   * // 未知字段
   * const unknownResult = LeadFormValidator.validateField('unknown', 'value')
   * console.log(unknownResult.isValid) // true (默认通过)
   * ```
   */
  static validateField(fieldName: string, value: any): {
    isValid: boolean
    message?: string
  } {
    switch (fieldName) {
      case 'name':
        return fieldValidators.validateCustomerName(value)
      case 'phone':
        return fieldValidators.validatePhone(value)
      case 'wechatId':
        return fieldValidators.validateWechatId(value)
      case 'referralCode':
        return fieldValidators.validateReferralCode(value)
      case 'source':
        return fieldValidators.validateSource(value)
      case 'notes':
        return fieldValidators.validateNotes(value)
      default:
        return { isValid: true }
    }
  }
}
