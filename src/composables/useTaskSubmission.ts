/**
 * 任务提交业务逻辑 Composable
 * 封装任务提交表单管理、验证、提交等业务逻辑
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
 * 任务提交 Composable
 * @param options - 配置选项
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
   * 验证单个字段
   * @param field - 字段名
   * @param value - 字段值
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
   * 获取字段显示名称
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
   * 更新表单字段
   * @param field - 字段名
   * @param value - 字段值
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
   * @param updates - 更新数据
   */
  const updateForm = (updates: Partial<TaskSubmissionRequest>) => {
    promotionStore.updateSubmissionForm(updates)
  }

  /**
   * 重置表单
   */
  const resetForm = () => {
    promotionStore.resetSubmissionForm()
    urlRecognition.reset()
  }

  /**
   * 提交任务
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
