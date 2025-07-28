/**
 * @fileoverview 客资表单管理组合式API模块
 * 提供客资表单的统一提交逻辑，包括表单验证、状态管理、错误处理、重试机制等
 * 
 * @module composables/useLeadForm
 * @requires vue
 * @requires @/components/ui/toast/use-toast
 * @requires @/store/lead
 * @requires @/utils/leadValidation
 * @requires @/utils/sourceDetection
 * @requires @/types/lead
 */

import { ref, reactive, computed, nextTick } from 'vue'
import { useToast } from '@/components/ui/toast/use-toast'
import { useLeadStore } from '@/store/lead'
import { LeadFormValidator } from '@/utils/leadValidation'
import { SourceDetectionEngine, UTMParser } from '@/utils/sourceDetection'
import type { 
  CreateLeadRequest, 
  UpdateLeadRequest, 
  Lead,
  SourceDetectionResult 
} from '@/types/lead'

/**
 * 表单提交选项接口
 * 定义表单行为的配置参数
 * 
 * @interface LeadFormOptions
 * 
 * @example
 * ```typescript
 * const options: LeadFormOptions = {
 *   mode: 'create',
 *   autoDetectSource: true,
 *   showSuccessToast: true,
 *   optimisticUpdate: false,
 *   onSuccess: (lead) => console.log('创建成功:', lead)
 * }
 * ```
 */
export interface LeadFormOptions {
  mode: 'create' | 'edit'
  leadId?: string
  autoDetectSource?: boolean
  showSuccessToast?: boolean
  showErrorToast?: boolean
  optimisticUpdate?: boolean
  redirectAfterSuccess?: boolean
  onSuccess?: (lead: Lead) => void
  onError?: (error: Error) => void
}

/**
 * 表单状态接口
 * 定义表单的完整状态信息
 * 
 * @interface FormState
 * 
 * @example
 * ```typescript
 * const state: FormState = {
 *   isSubmitting: false,
 *   isValidating: false,
 *   hasErrors: false,
 *   isDirty: true,
 *   isValid: true,
 *   submitCount: 0,
 *   lastSubmitTime: null
 * }
 * ```
 */
export interface FormState {
  isSubmitting: boolean
  isValidating: boolean
  hasErrors: boolean
  isDirty: boolean
  isValid: boolean
  submitCount: number
  lastSubmitTime: number | null
}

/**
 * 验证结果接口
 * 定义表单验证的结果格式
 * 
 * @interface ValidationResult
 * 
 * @example
 * ```typescript
 * const result: ValidationResult = {
 *   isValid: false,
 *   errors: { name: '姓名不能为空', phone: '手机号格式错误' },
 *   warnings: { email: '建议填写邮箱以便联系' }
 * }
 * ```
 */
export interface ValidationResult {
  isValid: boolean
  errors: Record<string, string>
  warnings: Record<string, string>
}

/**
 * 客资表单管理组合式API
 * 提供完整的表单管理功能，包括验证、提交、状态管理、错误处理和重试机制
 * 
 * @function useLeadForm
 * @param {LeadFormOptions} options - 表单配置选项
 * @returns {Object} 表单管理相关的状态和方法
 * @complexity O(1) - 基础操作为常数时间，表单提交复杂度取决于验证和API调用
 * @flow 初始化状态 -> 配置选项 -> 提供管理方法 -> 处理提交流程
 * 
 * @example
 * ```typescript
 * const {
 *   formState,
 *   validationErrors,
 *   canSubmit,
 *   submitForm,
 *   validateField,
 *   resetForm
 * } = useLeadForm({
 *   mode: 'create',
 *   autoDetectSource: true,
 *   showSuccessToast: true,
 *   onSuccess: (lead) => {
 *     console.log('客资创建成功:', lead)
 *     router.push(`/leads/${lead.id}`)
 *   }
 * })
 * 
 * // 提交表单
 * const handleSubmit = async (formData) => {
 *   try {
 *     const result = await submitForm(formData)
 *     console.log('提交成功:', result)
 *   } catch (error) {
 *     console.error('提交失败:', error)
 *   }
 * }
 * ```
 */
export function useLeadForm(options: LeadFormOptions = { mode: 'create' }) {
  const { toast } = useToast()
  const leadStore = useLeadStore()
  
  // 表单状态
  const formState = reactive<FormState>({
    isSubmitting: false,
    isValidating: false,
    hasErrors: false,
    isDirty: false,
    isValid: false,
    submitCount: 0,
    lastSubmitTime: null
  })
  
  // 验证错误
  const validationErrors = ref<Record<string, string>>({})
  const validationWarnings = ref<Record<string, string>>({})
  
  // 来源检测结果
  const sourceDetectionResult = ref<SourceDetectionResult | null>(null)
  const sourceDetecting = ref(false)
  
  // 重试相关
  const retryCount = ref(0)
  const maxRetries = ref(3)
  const retryDelay = ref(1000) // 毫秒
  
  // 计算属性
  const canSubmit = computed(() => {
    return !formState.isSubmitting && 
           !formState.isValidating && 
           formState.isValid && 
           formState.isDirty
  })
  
  const canRetry = computed(() => {
    return !formState.isSubmitting && 
           retryCount.value < maxRetries.value
  })
  
  const submitButtonText = computed(() => {
    if (formState.isSubmitting) {
      return retryCount.value > 0 ? `重试中... (${retryCount.value}/${maxRetries.value})` : '提交中...'
    }
    return options.mode === 'create' ? '创建客资' : '更新客资'
  })
  
  /**
   * 验证表单数据
   * 根据表单模式（创建/编辑）执行相应的验证逻辑
   * 
   * @param {CreateLeadRequest | UpdateLeadRequest} data - 表单数据
   * @returns {Promise<ValidationResult>} 验证结果
   * @complexity O(n) - n为表单字段数量，需要验证每个字段
   * @flow 设置验证状态 -> 执行验证 -> 更新错误状态 -> 返回结果
   */
  async function validateForm(data: CreateLeadRequest | UpdateLeadRequest): Promise<ValidationResult> {
    formState.isValidating = true
    validationErrors.value = {}
    validationWarnings.value = {}
    
    try {
      let result: ValidationResult
      
      if (options.mode === 'create') {
        result = await LeadFormValidator.validateCreateForm(data as CreateLeadRequest)
      } else {
        result = await LeadFormValidator.validateUpdateForm(
          data as UpdateLeadRequest, 
          options.leadId || ''
        )
      }
      
      validationErrors.value = result.errors
      validationWarnings.value = result.warnings
      formState.hasErrors = !result.isValid
      formState.isValid = result.isValid
      
      return result
    } catch (error) {
      console.error('[表单Composable] 验证失败:', error)
      const errorMessage = error instanceof Error ? error.message : '表单验证失败'
      validationErrors.value = { _global: errorMessage }
      formState.hasErrors = true
      formState.isValid = false
      
      return {
        isValid: false,
        errors: validationErrors.value,
        warnings: {}
      }
    } finally {
      formState.isValidating = false
    }
  }
  
  /**
   * 自动检测来源
   * 基于当前页面信息自动检测客资来源，包括referrer、UTM参数等
   * 
   * @function detectSource
   * @returns {Promise<SourceDetectionResult | null>} 来源检测结果或null
   * @complexity O(1) - 来源检测为常数时间操作
   * @flow 检查配置 -> 收集检测数据 -> 执行来源检测 -> 更新结果
   */
  async function detectSource(): Promise<SourceDetectionResult | null> {
    if (!options.autoDetectSource) return null
    
    sourceDetecting.value = true
    
    try {
      const detectionData = {
        referrer: typeof window !== 'undefined' ? document.referrer : '',
        utmParams: typeof window !== 'undefined' ? UTMParser.parseFromCurrentURL() : {},
        userAgent: typeof window !== 'undefined' ? navigator.userAgent : '',
        currentURL: typeof window !== 'undefined' ? window.location.href : ''
      }
      
      const result = SourceDetectionEngine.detectSource(detectionData)
      sourceDetectionResult.value = result
      
      return result
    } catch (error) {
      console.warn('[表单Composable] 来源检测失败:', error)
      return null
    } finally {
      sourceDetecting.value = false
    }
  }
  
  /**
   * 预处理表单数据
   * 在提交前对表单数据进行预处理，包括来源检测、数据清理等
   * 
   * @param {CreateLeadRequest | UpdateLeadRequest} data - 原始表单数据
   * @returns {Promise<CreateLeadRequest | UpdateLeadRequest>} 处理后的表单数据
   * @complexity O(n) - n为表单字段数量，需要遍历所有字段进行清理
   * @flow 复制数据 -> 自动检测来源 -> 填充来源信息 -> 清理空值 -> 返回处理后数据
   * 
   * @example
   * ```typescript
   * const rawData = {
   *   name: '张三',
   *   phone: '13800138000',
   *   email: '',
   *   source: null
   * }
   * 
   * const processedData = await preprocessFormData(rawData)
   * // 处理后: { name: '张三', phone: '13800138000', source: 'website', utmParams: {...} }
   * ```
   */
  async function preprocessFormData(data: CreateLeadRequest | UpdateLeadRequest): Promise<CreateLeadRequest | UpdateLeadRequest> {
    const processedData = { ...data }
    
    // 自动检测来源
    if (options.mode === 'create' && options.autoDetectSource) {
      const sourceResult = await detectSource()
      if (sourceResult) {
        if (!processedData.source && sourceResult.suggestedSource) {
          processedData.source = sourceResult.suggestedSource
        }
        if (sourceResult.utmParams) {
          processedData.utmParams = sourceResult.utmParams
        }
        if (sourceResult.referrer) {
          processedData.referrer = sourceResult.referrer
        }
      }
    }
    
    // 清理空值
    Object.keys(processedData).forEach(key => {
      const value = processedData[key as keyof typeof processedData]
      if (value === '' || value === null || value === undefined) {
        delete processedData[key as keyof typeof processedData]
      }
    })
    
    return processedData
  }
  
  /**
   * 执行提交操作
   * 根据表单模式（创建/编辑）执行相应的API调用
   * 
   * @param {CreateLeadRequest | UpdateLeadRequest} data - 表单数据
   * @returns {Promise<Lead>} 提交成功后的客资对象
   * @throws {Error} 编辑模式下缺少leadId时抛出错误
   * @complexity O(1) - API调用的时间复杂度取决于网络延迟
   * @flow 检查模式 -> 调用对应API -> 返回结果
   * 
   * @example
   * ```typescript
   * // 创建模式
   * const newLead = await executeSubmit({
   *   name: '张三',
   *   phone: '13800138000'
   * })
   * 
   * // 编辑模式
   * const updatedLead = await executeSubmit({
   *   name: '李四',
   *   phone: '13900139000'
   * })
   * ```
   */
  async function executeSubmit(data: CreateLeadRequest | UpdateLeadRequest): Promise<Lead> {
    if (options.mode === 'create') {
      return await leadStore.createLead(data as CreateLeadRequest)
    } else {
      if (!options.leadId) {
        throw new Error('编辑模式下必须提供leadId')
      }
      return await leadStore.updateLead(options.leadId, data as UpdateLeadRequest)
    }
  }
  
  /**
   * 处理提交成功
   * 处理表单提交成功后的状态更新和用户反馈
   * 
   * @param {Lead} lead - 提交成功后返回的客资对象
   * @returns {void}
   * @complexity O(1) - 成功处理为常数时间操作
   * @flow 重置表单状态 -> 显示成功提示 -> 调用成功回调
   * 
   * @example
   * ```typescript
   * const lead = { id: '123', name: '张三', phone: '13800138000' }
   * handleSubmitSuccess(lead)
   * // 会显示成功toast，重置表单状态，调用onSuccess回调
   * ```
   */
  function handleSubmitSuccess(lead: Lead) {
    formState.isDirty = false
    retryCount.value = 0
    
    // 显示成功提示
    if (options.showSuccessToast !== false) {
      toast({
        title: '操作成功',
        description: options.mode === 'create' 
          ? `客资 "${lead.name}" 创建成功` 
          : `客资 "${lead.name}" 更新成功`,
        variant: 'default'
      })
    }
    
    // 调用成功回调
    if (options.onSuccess) {
      options.onSuccess(lead)
    }
  }
  
  /**
   * 处理提交错误
   * 处理表单提交失败后的错误处理和用户反馈
   * 
   * @param {Error} error - 提交过程中发生的错误对象
   * @returns {void}
   * @complexity O(1) - 错误处理为常数时间操作
   * @flow 记录错误日志 -> 显示错误提示 -> 调用错误回调
   * 
   * @example
   * ```typescript
   * const error = new Error('网络连接失败')
   * handleSubmitError(error)
   * // 会显示错误toast，调用onError回调
   * ```
   */
  function handleSubmitError(error: Error) {
    console.error('[表单Composable] 提交失败:', error)
    
    // 显示错误提示
    if (options.showErrorToast !== false) {
      toast({
        title: '操作失败',
        description: error.message || '请稍后重试',
        variant: 'destructive'
      })
    }
    
    // 调用错误回调
    if (options.onError) {
      options.onError(error)
    }
  }
  
  /**
   * 延迟执行
   * 创建一个指定时间的延迟Promise，用于重试机制的指数退避
   * 
   * @param {number} ms - 延迟时间，单位毫秒
   * @returns {Promise<void>} 延迟执行的Promise
   * @complexity O(1) - 延迟创建为常数时间操作
   * @flow 创建Promise -> 设置延迟定时器 -> 延迟后resolve
   * 
   * @example
   * ```typescript
   * // 延迟1秒执行
   * await delay(1000)
   * console.log('1秒后执行')
   * 
   * // 在重试机制中使用
   * for (let i = 0; i < maxRetries; i++) {
   *   try {
   *     return await apiCall()
   *   } catch (error) {
   *     if (i < maxRetries - 1) {
   *       await delay(1000 * (i + 1)) // 指数退避
   *     }
   *   }
   * }
   * ```
   */
  function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
  
  /**
   * 带重试的提交
   * 实现指数退避的重试机制，对网络错误和临时故障提供容错处理
   * 
   * @param {CreateLeadRequest | UpdateLeadRequest} data - 表单数据
   * @returns {Promise<Lead>} 提交成功后的客资对象
   * @throws {Error} 所有重试都失败后抛出最后一次的错误
   * @complexity O(k) - k为最大重试次数，每次重试包含指数退避延迟
   * @flow 循环重试 -> 设置重试延迟 -> 执行提交 -> 处理错误 -> 判断重试条件
   * 
   * @example
   * ```typescript
   * try {
   *   const lead = await submitWithRetry({
   *     name: '张三',
   *     phone: '13800138000'
   *   })
   *   console.log('提交成功:', lead)
   * } catch (error) {
   *   console.error('所有重试都失败:', error)
   * }
   * ```
   */
  async function submitWithRetry(data: CreateLeadRequest | UpdateLeadRequest): Promise<Lead> {
    let lastError: Error
    
    for (let attempt = 0; attempt <= maxRetries.value; attempt++) {
      try {
        if (attempt > 0) {
          retryCount.value = attempt
          await delay(retryDelay.value * attempt) // 指数退避
        }
        
        return await executeSubmit(data)
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('提交失败')
        
        // 如果是最后一次尝试，或者是不可重试的错误，直接抛出
        if (attempt === maxRetries.value || isNonRetryableError(error)) {
          throw lastError
        }
        
        console.warn(`[表单Composable] 提交失败，准备重试 (${attempt + 1}/${maxRetries.value}):`, error)
      }
    }
    
    throw lastError!
  }
  
  /**
   * 判断是否为不可重试的错误
   * 识别不应该进行重试的错误类型，如验证错误、权限错误等
   * 
   * @param {any} error - 错误对象，可能包含status和message属性
   * @returns {boolean} true表示不可重试，false表示可以重试
   * @complexity O(1) - 错误类型判断为常数时间操作
   * @flow 检查HTTP状态码 -> 检查错误关键词 -> 返回判断结果
   * 
   * @example
   * ```typescript
   * const error1 = { status: 400, message: 'Validation failed' }
   * console.log(isNonRetryableError(error1)) // true，验证错误不可重试
   * 
   * const error2 = { status: 500, message: 'Internal server error' }
   * console.log(isNonRetryableError(error2)) // false，服务器错误可以重试
   * 
   * const error3 = { message: 'duplicate entry found' }
   * console.log(isNonRetryableError(error3)) // true，重复错误不可重试
   * ```
   */
  function isNonRetryableError(error: any): boolean {
    // 验证错误、权限错误等不应该重试
    if (error?.status === 400 || error?.status === 401 || error?.status === 403) {
      return true
    }
    
    // 包含特定关键词的错误不重试
    const nonRetryableKeywords = ['validation', 'permission', 'duplicate', 'invalid']
    const errorMessage = error?.message?.toLowerCase() || ''
    
    return nonRetryableKeywords.some(keyword => errorMessage.includes(keyword))
  }
  
  /**
   * 主要的提交方法
   * 执行完整的表单提交流程，包括数据预处理、验证、提交和错误处理
   * 
   * @param {CreateLeadRequest | UpdateLeadRequest} data - 表单数据
   * @returns {Promise<Lead | null>} 提交成功时返回客资对象，失败时返回null
   * @complexity O(n) - 复杂度取决于验证字段数量和网络延迟
   * @flow 防重复提交 -> 预处理数据 -> 验证表单 -> 执行提交 -> 处理结果
   */
  async function submitForm(data: CreateLeadRequest | UpdateLeadRequest): Promise<Lead | null> {
    if (formState.isSubmitting) {
      console.warn('[表单Composable] 表单正在提交中，忽略重复提交')
      return null
    }
    
    formState.isSubmitting = true
    formState.submitCount += 1
    formState.lastSubmitTime = Date.now()
    
    try {
      // 预处理数据
      const processedData = await preprocessFormData(data)
      
      // 验证表单
      const validation = await validateForm(processedData)
      if (!validation.isValid) {
        throw new Error('表单验证失败，请检查输入内容')
      }
      
      // 提交数据
      const result = await submitWithRetry(processedData)
      
      // 处理成功
      handleSubmitSuccess(result)
      
      return result
    } catch (error) {
      const submitError = error instanceof Error ? error : new Error('提交失败')
      handleSubmitError(submitError)
      throw submitError
    } finally {
      formState.isSubmitting = false
      retryCount.value = 0
    }
  }
  
  /**
   * 重置表单状态
   * 将所有表单状态重置为初始值，清空验证错误和来源检测结果
   * 
   * @function resetForm
   * @returns {void}
   * @complexity O(1) - 状态重置为常数时间操作
   * @flow 重置表单状态 -> 清空验证错误 -> 重置来源检测 -> 重置重试计数
   */
  function resetForm() {
    formState.isSubmitting = false
    formState.isValidating = false
    formState.hasErrors = false
    formState.isDirty = false
    formState.isValid = false
    formState.submitCount = 0
    formState.lastSubmitTime = null
    
    validationErrors.value = {}
    validationWarnings.value = {}
    sourceDetectionResult.value = null
    retryCount.value = 0
  }
  
  /**
   * 标记表单为已修改
   * 设置表单的isDirty状态为true，表示用户已经修改了表单内容
   * 
   * @function markAsDirty
   * @returns {void}
   * @complexity O(1) - 状态设置为常数时间操作
   * @flow 设置isDirty状态 -> 触发响应式更新
   */
  function markAsDirty() {
    formState.isDirty = true
  }
  
  /**
   * 手动设置验证错误
   * 批量设置表单验证错误，用于服务器验证结果的同步
   * 
   * @param {Record<string, string>} errors - 错误对象，键为字段名，值为错误信息
   * @returns {void}
   * @complexity O(n) - n为错误字段数量
   * @flow 设置验证错误 -> 更新错误状态 -> 更新有效性状态
   * 
   * @example
   * ```typescript
   * setValidationErrors({
   *   name: '姓名不能为空',
   *   phone: '手机号格式错误',
   *   email: '邮箱地址无效'
   * })
   * ```
   */
  function setValidationErrors(errors: Record<string, string>) {
    validationErrors.value = errors
    formState.hasErrors = Object.keys(errors).length > 0
    formState.isValid = !formState.hasErrors
  }
  
  /**
   * 清除所有验证错误
   * 清空表单的所有验证错误和警告信息，重置错误状态
   * 
   * @function clearValidationErrors
   * @returns {void}
   * @complexity O(1) - 状态清除为常数时间操作
   * @flow 清空错误对象 -> 清空警告对象 -> 重置错误状态
   */
  function clearValidationErrors() {
    validationErrors.value = {}
    validationWarnings.value = {}
    formState.hasErrors = false
  }
  
  /**
   * 验证单个字段
   * 对表单中的单个字段进行实时验证，支持即时反馈
   * 
   * @param {string} fieldName - 字段名称，如 'name', 'phone', 'email' 等
   * @param {any} value - 字段值，类型根据字段而定
   * @returns {Promise<boolean>} 验证结果，true表示验证通过，false表示验证失败
   * @complexity O(1) - 单字段验证为常数时间操作
   * @flow 调用字段验证器 -> 处理验证结果 -> 更新错误状态 -> 返回验证结果
   * 
   * @example
   * ```typescript
   * // 验证姓名字段
   * const isValid = await validateField('name', '张三')
   * if (isValid) {
   *   console.log('姓名验证通过')
   * } else {
   *   console.log('姓名验证失败:', validationErrors.value.name)
   * }
   * 
   * // 验证手机号字段
   * const phoneValid = await validateField('phone', '13800138000')
   * ```
   */
  async function validateField(fieldName: string, value: any): Promise<boolean> {
    try {
      const result = LeadFormValidator.validateField(fieldName, value)
      
      if (result.isValid) {
        // 清除该字段的错误
        if (validationErrors.value[fieldName]) {
          delete validationErrors.value[fieldName]
        }
      } else {
        // 设置字段错误
        validationErrors.value[fieldName] = result.message || '验证失败'
      }
      
      // 更新整体验证状态
      formState.hasErrors = Object.keys(validationErrors.value).length > 0
      
      return result.isValid
    } catch (error) {
      console.error(`[表单Composable] 字段 ${fieldName} 验证失败:`, error)
      validationErrors.value[fieldName] = '验证失败'
      formState.hasErrors = true
      return false
    }
  }
  
  return {
    // 状态
    formState: readonly(formState),
    validationErrors: readonly(validationErrors),
    validationWarnings: readonly(validationWarnings),
    sourceDetectionResult: readonly(sourceDetectionResult),
    sourceDetecting: readonly(sourceDetecting),
    retryCount: readonly(retryCount),
    
    // 计算属性
    canSubmit,
    canRetry,
    submitButtonText,
    
    // 方法
    submitForm,
    validateForm,
    validateField,
    detectSource,
    resetForm,
    markAsDirty,
    setValidationErrors,
    clearValidationErrors,
    
    // 配置
    maxRetries,
    retryDelay
  }
}
