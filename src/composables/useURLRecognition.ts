/**
 * URL识别业务逻辑 Composable
 * 提供URL识别、平台检测、错误处理等业务逻辑
 */
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import type { Ref } from 'vue'
import type { 
  PromotionPlatform, 
  URLRecognitionResult 
} from '@/types/promotion'
import { 
  recognizePlatformFromURL, 
  validateURL, 
  getPlatformDisplayInfo,
  isSupportedPlatform
} from '@/utils/platformRecognition'
import { useDebounce } from '@/composables/useDebounce'

/**
 * URL识别状态接口
 */
export interface URLRecognitionState {
  /** 当前输入的URL */
  inputUrl: string
  /** 是否正在识别 */
  recognizing: boolean
  /** 识别结果 */
  result: URLRecognitionResult | null
  /** 验证错误信息 */
  validationError: string | null
  /** 是否手动覆盖了识别结果 */
  manualOverride: boolean
  /** 手动选择的平台 */
  manualPlatform: PromotionPlatform | null
}

/**
 * URL识别配置选项
 */
export interface URLRecognitionOptions {
  /** 防抖延迟时间（毫秒） */
  debounceDelay?: number
  /** 是否自动识别 */
  autoRecognize?: boolean
  /** 最小URL长度触发识别 */
  minUrlLength?: number
}

/**
 * URL识别 Composable
 * @param options - 配置选项
 */
export function useURLRecognition(options: URLRecognitionOptions = {}) {
  const {
    debounceDelay = 500,
    autoRecognize = true,
    minUrlLength = 10
  } = options

  // 状态管理
  const state = ref<URLRecognitionState>({
    inputUrl: '',
    recognizing: false,
    result: null,
    validationError: null,
    manualOverride: false,
    manualPlatform: null
  })

  // 防抖处理的URL
  const debouncedUrl = useDebounce(() => state.value.inputUrl, debounceDelay)

  /**
   * 计算属性：最终确定的平台
   */
  const finalPlatform = computed<PromotionPlatform | null>(() => {
    if (state.value.manualOverride && state.value.manualPlatform) {
      return state.value.manualPlatform
    }
    return state.value.result?.platform || null
  })

  /**
   * 计算属性：是否有有效的平台识别结果
   */
  const hasValidPlatform = computed(() => {
    return finalPlatform.value !== null
  })

  /**
   * 计算属性：平台显示信息
   */
  const platformDisplayInfo = computed(() => {
    const platform = finalPlatform.value
    return platform ? getPlatformDisplayInfo(platform) : null
  })

  /**
   * 计算属性：是否显示识别结果
   */
  const showRecognitionResult = computed(() => {
    return state.value.result !== null && !state.value.recognizing
  })

  /**
   * 计算属性：是否显示建议
   */
  const showSuggestions = computed(() => {
    return state.value.result?.suggestions && state.value.result.suggestions.length > 0
  })

  /**
   * 计算属性：识别置信度等级
   */
  const confidenceLevel = computed(() => {
    const confidence = state.value.result?.confidence || 0
    if (confidence >= 0.9) return 'high'
    if (confidence >= 0.7) return 'medium'
    if (confidence >= 0.5) return 'low'
    return 'very-low'
  })

  /**
   * 计算属性：置信度显示文本
   */
  const confidenceText = computed(() => {
    const confidence = state.value.result?.confidence || 0
    return `${Math.round(confidence * 100)}%`
  })

  /**
   * 执行URL识别
   * @param url - 要识别的URL
   */
  const recognizeURL = async (url: string) => {
    if (!url || url.length < minUrlLength) {
      state.value.result = null
      state.value.validationError = null
      return
    }

    state.value.recognizing = true
    state.value.validationError = null

    try {
      // 首先验证URL格式
      const validation = validateURL(url)
      if (!validation.isValid) {
        state.value.validationError = validation.error || 'URL格式无效'
        state.value.result = null
        return
      }

      // 执行平台识别
      const result = recognizePlatformFromURL(url)
      state.value.result = result

      // 如果识别成功且没有手动覆盖，清除手动选择
      if (result.platform && !state.value.manualOverride) {
        state.value.manualPlatform = null
      }

    } catch (error) {
      console.error('[URL识别] 识别过程发生错误:', error)
      state.value.validationError = '识别过程发生错误'
      state.value.result = null
    } finally {
      state.value.recognizing = false
    }
  }

  /**
   * 手动设置平台
   * @param platform - 手动选择的平台
   */
  const setManualPlatform = (platform: PromotionPlatform | null) => {
    state.value.manualPlatform = platform
    state.value.manualOverride = platform !== null
  }

  /**
   * 清除手动覆盖，恢复自动识别
   */
  const clearManualOverride = () => {
    state.value.manualOverride = false
    state.value.manualPlatform = null
  }

  /**
   * 设置输入URL
   * @param url - 新的URL
   */
  const setInputUrl = (url: string) => {
    state.value.inputUrl = url
    
    // 如果URL变化，清除手动覆盖（可选行为）
    if (state.value.manualOverride) {
      // 可以选择保持手动覆盖或清除
      // 这里选择清除，让用户重新选择
      clearManualOverride()
    }
  }

  /**
   * 重置所有状态
   */
  const reset = () => {
    state.value = {
      inputUrl: '',
      recognizing: false,
      result: null,
      validationError: null,
      manualOverride: false,
      manualPlatform: null
    }
  }

  /**
   * 检查URL是否为支持的平台
   * @param url - 要检查的URL
   */
  const checkSupportedPlatform = (url: string): boolean => {
    return isSupportedPlatform(url)
  }

  /**
   * 获取建议平台的显示信息
   */
  const getSuggestionDisplayInfo = () => {
    if (!state.value.result?.suggestions) {
      return []
    }
    
    return state.value.result.suggestions.map(platform => ({
      platform,
      displayInfo: getPlatformDisplayInfo(platform)
    }))
  }

  // 监听防抖后的URL变化，自动执行识别
  const stopWatchingUrl = watch(debouncedUrl, (newUrl) => {
    if (autoRecognize && newUrl) {
      recognizeURL(newUrl)
    }
  })

  // 监听输入URL的变化，清除之前的错误
  const stopWatchingInput = watch(() => state.value.inputUrl, () => {
    if (state.value.validationError) {
      state.value.validationError = null
    }
  })

  /**
   * 清理函数
   */
  const cleanup = () => {
    stopWatchingUrl()
    stopWatchingInput()
    // 清理防抖定时器
    if (debouncedUrl && typeof debouncedUrl.cancel === 'function') {
      debouncedUrl.cancel()
    }
  }

  // 组件卸载时自动清理
  onBeforeUnmount(() => {
    cleanup()
  })

  return {
    // 状态
    state: computed(() => state.value),
    
    // 计算属性
    finalPlatform,
    hasValidPlatform,
    platformDisplayInfo,
    showRecognitionResult,
    showSuggestions,
    confidenceLevel,
    confidenceText,
    
    // 方法
    recognizeURL,
    setManualPlatform,
    clearManualOverride,
    setInputUrl,
    reset,
    checkSupportedPlatform,
    cleanup,
    getSuggestionDisplayInfo,
    
    // 便捷访问
    inputUrl: computed({
      get: () => state.value.inputUrl,
      set: setInputUrl
    }),
    recognizing: computed(() => state.value.recognizing),
    validationError: computed(() => state.value.validationError),
    result: computed(() => state.value.result),
    manualOverride: computed(() => state.value.manualOverride)
  }
}
