/**
 * @fileoverview 任务提交表单管理组合式API模块
 * 提供完整的推广任务提交功能，包括表单验证、字段管理、URL自动识别、状态管理等
 * 
 * @module composables/useTaskSubmission
 * @requires vue
 * @requires @/store/promotion
 * @requires @/composables/useURLRecognition
 * @requires @/types/promotion
 * @requires @/components/ui/toast/use-toast
 */
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import type { Ref } from 'vue'
import { usePromotionStore } from '@/store/promotion'
import { useURLRecognition } from '@/composables/useURLRecognition'
import type { 
  PromotionPlatform, 
  PromotionContentType,
  TaskSubmissionRequest 
} from '@/types/promotion'
import { toast } from '@/components/ui/toast/use-toast'

/**
 * 表单验证规则接口
 */
export interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  validator?: (value: any) => string | null
}

/**
 * 表单字段验证结果
 */
export interface FieldValidation {
  isValid: boolean
  error: string | null
}

/**
 * 表单验证结果
 */
export interface FormValidation {
  isValid: boolean
  errors: Record<string, string | null>
}

/**
 * 任务提交配置选项
 */
export interface TaskSubmissionOptions {
  /** 是否启用自动URL识别 */
  enableAutoRecognition?: boolean
  /** 是否在提交成功后自动跳转 */
  autoRedirectOnSuccess?: boolean
  /** 提交成功后的跳转路径 */
  successRedirectPath?: string
  /** 是否显示成功提示 */
  showSuccessToast?: boolean
  /** 是否显示错误提示 */
  showErrorToast?: boolean
}

/**
 * 任务提交表单管理组合式API
 * 提供完整的推广任务提交功能，包括表单验证、URL识别、状态管理和提交流程
 * 
 * @function useTaskSubmission
 * @param {TaskSubmissionOptions} options - 配置选项，包含自动识别、跳转等设置
 * @returns {Object} 任务提交相关的状态、计算属性和操作方法
 * @complexity O(1) - 基础操作为常数时间，表单验证复杂度取决于字段数量
 * @flow 初始化配置 -> 设置验证规则 -> 提供管理方法 -> 处理提交流程
 * 
 * @example
 * ```typescript
 * const {
 *   formData,
 *   isFormValid,
 *   formErrors,
 *   isSubmitting,
 *   updateField,
 *   submitTask,
 *   resetForm
 * } = useTaskSubmission({
 *   enableAutoRecognition: true,
 *   autoRedirectOnSuccess: true,
 *   showSuccessToast: true
 * })
 * 
 * // 更新表单字段
 * updateField('contentUrl', 'https://www.douyin.com/video/123')
 * 
 * // 提交任务
 * const success = await submitTask()
 * if (success) {
 *   console.log('任务提交成功')
 * }
 * ```
 */
export function useTaskSubmission(options: TaskSubmissionOptions = {}) {
  const {
    enableAutoRecognition = true,
    autoRedirectOnSuccess = true,
    successRedirectPath = '/promotion/my-tasks',
    showSuccessToast = true,
    showErrorToast = true
  } = options

  const promotionStore = usePromotionStore()
  
  // URL识别功能
  const urlRecognition = useURLRecognition({
    autoRecognize: enableAutoRecognition,
    debounceDelay: 500
  })

  // 表单验证规则
  const validationRules: Record<keyof TaskSubmissionRequest, ValidationRule> = {
    platform: {
      required: true
    },
    contentType: {
      required: true
    },
    contentUrl: {
      required: true,
      minLength: 10,
      maxLength: 2048,
      validator: (value: string) => {
        if (!value) return '请输入推广内容链接'
        
        // URL格式验证
        try {
          let normalizedUrl = value.trim()
          if (!/^https?:\/\//i.test(normalizedUrl)) {
            normalizedUrl = `https://${normalizedUrl}`
          }
          new URL(normalizedUrl)
          return null
        } catch {
          return 'URL格式无效'
        }
      }
    },
    contentDescription: {
      required: true,
      minLength: 10,
      maxLength: 500,
      validator: (value: string) => {
        if (!value || value.trim().length === 0) {
          return '请输入内容描述'
        }
        if (value.trim().length < 10) {
          return '内容描述至少需要10个字符'
        }
        if (value.trim().length > 500) {
          return '内容描述不能超过500个字符'
        }
        return null
      }
    }
  }

  /**
   * 验证单个表单字段
   * 根据预定义的验证规则对指定字段进行验证
   * 
   * @param {keyof TaskSubmissionRequest} field - 字段名称，如 'platform', 'contentUrl' 等
   * @param {any} value - 字段值，类型根据字段而定
   * @returns {FieldValidation} 验证结果，包含是否有效和错误信息
   * @complexity O(1) - 单字段验证为常数时间操作
   * @flow 获取验证规则 -> 执行必填验证 -> 执行长度验证 -> 执行格式验证 -> 执行自定义验证
   * 
   * @example
   * ```typescript
   * // 验证推广链接
   * const urlValidation = validateField('contentUrl', 'https://www.douyin.com/video/123')
   * if (!urlValidation.isValid) {
   *   console.error('URL验证失败:', urlValidation.error)
   * }
   * 
   * // 验证内容描述
   * const descValidation = validateField('contentDescription', '这是一个精彩的推广内容')
   * ```
   */
  const validateField = (field: keyof TaskSubmissionRequest, value: any): FieldValidation => {
    const rule = validationRules[field]
    if (!rule) {
      return { isValid: true, error: null }
    }

    // 必填验证
    if (rule.required && (!value || (typeof value === 'string' && value.trim().length === 0))) {
      return { isValid: false, error: `${getFieldDisplayName(field)}不能为空` }
    }

    // 字符串长度验证
    if (typeof value === 'string') {
      if (rule.minLength && value.length < rule.minLength) {
        return { isValid: false, error: `${getFieldDisplayName(field)}至少需要${rule.minLength}个字符` }
      }
      if (rule.maxLength && value.length > rule.maxLength) {
        return { isValid: false, error: `${getFieldDisplayName(field)}不能超过${rule.maxLength}个字符` }
      }
    }

    // 正则表达式验证
    if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
      return { isValid: false, error: `${getFieldDisplayName(field)}格式不正确` }
    }

    // 自定义验证器
    if (rule.validator) {
      const error = rule.validator(value)
      if (error) {
        return { isValid: false, error }
      }
    }

    return { isValid: true, error: null }
  }

  /**
   * 验证整个表单
   * 对表单中的所有字段进行批量验证，收集所有验证错误
   * 
   * @function validateForm
   * @returns {FormValidation} 表单验证结果，包含整体有效性和各字段错误信息
   * @complexity O(n) - n为表单字段数量，需要验证每个字段
   * @flow 获取表单数据 -> 遍历所有字段 -> 调用字段验证 -> 收集错误信息 -> 返回验证结果
   * 
   * @example
   * ```typescript
   * const validation = validateForm()
   * if (!validation.isValid) {
   *   console.log('表单验证失败:')
   *   Object.entries(validation.errors).forEach(([field, error]) => {
   *     if (error) {
   *       console.log(`${field}: ${error}`)
   *     }
   *   })
   * }
   * ```
   */
  const validateForm = (): FormValidation => {
    const form = promotionStore.submissionForm
    const errors: Record<string, string | null> = {}
    let isValid = true

    // 验证每个字段
    Object.keys(form).forEach(key => {
      const field = key as keyof TaskSubmissionRequest
      const validation = validateField(field, form[field])
      errors[field] = validation.error
      if (!validation.isValid) {
        isValid = false
      }
    })

    return { isValid, errors }
  }

  /**
   * 获取字段的中文显示名称
   * 将英文字段名转换为用户友好的中文显示名称
   * 
   * @param {keyof TaskSubmissionRequest} field - 字段名称
   * @returns {string} 字段的中文显示名称
   * @complexity O(1) - 字典查找为常数时间操作
   * @flow 查找字段映射表 -> 返回中文名称或原始字段名
   * 
   * @example
   * ```typescript
   * console.log(getFieldDisplayName('platform')) // "推广平台"
   * console.log(getFieldDisplayName('contentUrl')) // "推广链接"
   * console.log(getFieldDisplayName('contentDescription')) // "内容描述"
   * ```
   */
  const getFieldDisplayName = (field: keyof TaskSubmissionRequest): string => {
    const displayNames: Record<keyof TaskSubmissionRequest, string> = {
      platform: '推广平台',
      contentType: '内容类型',
      contentUrl: '推广链接',
      contentDescription: '内容描述'
    }
    return displayNames[field] || field
  }

  /**
   * 计算属性：表单是否有效
   */
  const isFormValid = computed(() => {
    return validateForm().isValid
  })

  /**
   * 计算属性：表单验证错误
   */
  const formErrors = computed(() => {
    return validateForm().errors
  })

  /**
   * 计算属性：是否正在提交
   */
  const isSubmitting = computed(() => {
    return promotionStore.submissionLoading
  })

  /**
   * 计算属性：提交错误信息
   */
  const submissionError = computed(() => {
    return promotionStore.submissionError
  })

  /**
   * 计算属性：当前表单数据
   */
  const formData = computed(() => {
    return promotionStore.submissionForm
  })

  /**
   * 更新单个表单字段
   * 更新指定字段的值，如果是URL字段且启用自动识别则触发平台识别
   * 
   * @param {keyof TaskSubmissionRequest} field - 要更新的字段名
   * @param {any} value - 新的字段值
   * @returns {void}
   * @complexity O(1) - 字段更新为常数时间操作
   * @flow 更新store中的字段值 -> 检查是否为URL字段 -> 触发自动识别
   * 
   * @example
   * ```typescript
   * // 更新推广平台
   * updateField('platform', 'DOUYIN')
   * 
   * // 更新推广链接（会触发自动平台识别）
   * updateField('contentUrl', 'https://www.douyin.com/video/123456')
   * 
   * // 更新内容描述
   * updateField('contentDescription', '这是一个关于美食的推广视频')
   * ```
   */
  const updateField = (field: keyof TaskSubmissionRequest, value: any) => {
    promotionStore.updateSubmissionForm({ [field]: value })
    
    // 如果是URL字段，触发平台识别
    if (field === 'contentUrl' && enableAutoRecognition && value) {
      urlRecognition.setInputUrl(value)
    }
  }

  /**
   * 批量更新表单数据
   * 一次性更新多个字段的值，提高更新效率
   * 
   * @param {Partial<TaskSubmissionRequest>} updates - 要更新的字段对象
   * @returns {void}
   * @complexity O(1) - 批量更新为常数时间操作
   * @flow 调用store的批量更新方法 -> 更新多个字段
   * 
   * @example
   * ```typescript
   * // 批量更新多个字段
   * updateForm({
   *   platform: 'DOUYIN',
   *   contentType: 'VIDEO',
   *   contentDescription: '美食制作教程视频'
   * })
   * ```
   */
  const updateForm = (updates: Partial<TaskSubmissionRequest>) => {
    promotionStore.updateSubmissionForm(updates)
  }

  /**
   * 重置表单到初始状态
   * 清空所有表单字段和URL识别结果，恢复到初始状态
   * 
   * @function resetForm
   * @returns {void}
   * @complexity O(1) - 状态重置为常数时间操作
   * @flow 重置store中的表单数据 -> 重置URL识别状态
   * 
   * @example
   * ```typescript
   * // 提交失败或需要重新开始时重置表单
   * resetForm()
   * console.log('表单已重置到初始状态')
   * ```
   */
  const resetForm = () => {
    promotionStore.resetSubmissionForm()
    urlRecognition.reset()
  }

  /**
   * 提交推广任务
   * 执行完整的任务提交流程，包括表单验证、数据构建、API调用和结果处理
   * 
   * @function submitTask
   * @returns {Promise<boolean>} 提交是否成功
   * @complexity O(n) - 复杂度取决于表单验证和网络请求时间
   * @flow 表单验证 -> 构建请求数据 -> 调用提交API -> 处理结果 -> 显示反馈
   * 
   * @example
   * ```typescript
   * // 提交任务前确保表单已填写
   * if (isFormValid.value) {
   *   try {
   *     const success = await submitTask()
   *     if (success) {
   *       console.log('任务提交成功')
   *       // 可以进行页面跳转或其他后续操作
   *     }
   *   } catch (error) {
   *     console.error('提交过程中发生错误:', error)
   *   }
   * } else {
   *   console.log('表单验证失败，请检查填写内容')
   * }
   * ```
   */
  const submitTask = async (): Promise<boolean> => {
    try {
      // 表单验证
      const validation = validateForm()
      if (!validation.isValid) {
        if (showErrorToast) {
          const firstError = Object.values(validation.errors).find(error => error !== null)
          toast({
            title: '表单验证失败',
            description: firstError || '请检查表单填写',
            variant: 'destructive'
          })
        }
        return false
      }

      // 构建提交请求
      const request: TaskSubmissionRequest = {
        ...promotionStore.submissionForm,
        autoDetectedPlatform: urlRecognition.result?.platform
      }

      // 提交任务
      const newTask = await promotionStore.submitTask(request)

      // 成功提示
      if (showSuccessToast) {
        toast({
          title: '提交成功',
          description: `任务 ${newTask.id} 已提交，等待审核`,
          variant: 'default'
        })
      }

      // 重置表单
      resetForm()

      // 自动跳转
      if (autoRedirectOnSuccess && successRedirectPath) {
        // 这里可以使用 Vue Router 进行跳转
        // 由于这是一个 composable，我们返回成功状态，让调用方处理跳转
      }

      return true

    } catch (error) {
      console.error('[任务提交] 提交失败:', error)
      
      if (showErrorToast) {
        toast({
          title: '提交失败',
          description: error instanceof Error ? error.message : '提交过程中发生错误',
          variant: 'destructive'
        })
      }
      
      return false
    }
  }

  /**
   * 监听URL识别结果，自动更新平台
   */
  const stopWatchingPlatform = watch(() => urlRecognition.finalPlatform, (platform) => {
    if (platform && enableAutoRecognition) {
      updateField('platform', platform)
    }
  })

  /**
   * 清理函数
   * 停止所有监听器和清理相关资源，防止内存泄漏
   * 
   * @function cleanup
   * @returns {void}
   * @complexity O(1) - 清理操作为常数时间
   * @flow 停止URL识别监听 -> 清理URL识别资源
   * 
   * @example
   * ```typescript
   * // 在组件卸载时手动调用清理
   * onBeforeUnmount(() => {
   *   cleanup()
   * })
   * ```
   */
  const cleanup = () => {
    stopWatchingPlatform()
    urlRecognition.cleanup?.()
  }

  // 组件卸载时自动清理
  onBeforeUnmount(() => {
    cleanup()
  })

  return {
    // 表单数据
    formData,
    
    // 验证状态
    isFormValid,
    formErrors,
    
    // 提交状态
    isSubmitting,
    submissionError,
    
    // URL识别
    urlRecognition,
    
    // 方法
    updateField,
    updateForm,
    resetForm,
    submitTask,
    validateField,
    validateForm,
    cleanup,
    
    // 配置
    options: {
      enableAutoRecognition,
      autoRedirectOnSuccess,
      successRedirectPath,
      showSuccessToast,
      showErrorToast
    }
  }
}
