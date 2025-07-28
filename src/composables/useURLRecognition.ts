/**
 * @fileoverview URL识别业务逻辑组合式API模块
 * 提供URL识别、平台检测、错误处理等业务逻辑，支持防抖处理、手动覆盖、置信度评估等功能
 * 
 * @module composables/useURLRecognition
 * @requires vue
 * @requires @/types/promotion
 * @requires @/utils/platformRecognition
 * @requires @/composables/useDebounce
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
 * URL识别组合式API
 * 提供智能的URL识别和平台检测功能，支持防抖处理、手动覆盖和置信度评估
 * 
 * @function useURLRecognition
 * @param {URLRecognitionOptions} options - 配置选项，包含防抖延迟、自动识别等设置
 * @returns {Object} URL识别相关的状态、计算属性和操作方法
 * @complexity O(1) - 基础操作为常数时间，URL识别复杂度取决于平台识别算法
 * @flow 初始化状态 -> 设置防抖 -> 监听URL变化 -> 执行识别 -> 返回结果
 * 
 * @example
 * ```typescript
 * const {
 *   inputUrl,
 *   finalPlatform,
 *   hasValidPlatform,
 *   recognizing,
 *   recognizeURL,
 *   setManualPlatform
 * } = useURLRecognition({
 *   debounceDelay: 800,
 *   autoRecognize: true,
 *   minUrlLength: 15
 * })
 * 
 * // 设置URL（自动触发识别）
 * inputUrl.value = 'https://www.douyin.com/user/123456'
 * 
 * // 手动识别URL
 * await recognizeURL('https://space.bilibili.com/123456')
 * 
 * // 手动覆盖识别结果
 * setManualPlatform('XIAOHONGSHU')
 * 
 * // 检查识别结果
 * if (hasValidPlatform.value) {
 *   console.log('检测到平台:', finalPlatform.value)
 * }
 * ```
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
   * 优先使用手动覆盖的平台，否则使用自动识别结果
   * 
   * @complexity O(1) - 简单的条件判断和属性访问
   * @flow
   * 1. 检查是否有手动覆盖且手动平台存在
   * 2. 如果有手动覆盖，返回手动选择的平台
   * 3. 否则返回自动识别结果中的平台
   * 
   * @example
   * ```typescript
   * // 自动识别情况
   * inputUrl.value = 'https://www.douyin.com/user/123'
   * await recognizeURL(inputUrl.value)
   * console.log(finalPlatform.value) // 'DOUYIN'
   * 
   * // 手动覆盖情况
   * setManualPlatform('BILIBILI')
   * console.log(finalPlatform.value) // 'BILIBILI' (优先使用手动设置)
   * ```
   * 
   * @returns 最终确定的平台类型或null
   */
  const finalPlatform = computed<PromotionPlatform | null>(() => {
    if (state.value.manualOverride && state.value.manualPlatform) {
      return state.value.manualPlatform
    }
    return state.value.result?.platform || null
  })

  /**
   * 计算属性：是否有有效的平台识别结果
   * 检查最终平台是否不为null，用于UI显示和逻辑判断
   * 
   * @complexity O(1) - 简单的null检查
   * @flow
   * 1. 获取finalPlatform的值
   * 2. 检查是否不为null
   * 3. 返回布尔结果
   * 
   * @example
   * ```typescript
   * // 有识别结果时
   * inputUrl.value = 'https://space.bilibili.com/123'
   * await recognizeURL(inputUrl.value)
   * console.log(hasValidPlatform.value) // true
   * 
   * // 无识别结果时
   * reset()
   * console.log(hasValidPlatform.value) // false
   * ```
   * 
   * @returns 是否有有效的平台识别结果
   */
  const hasValidPlatform = computed(() => {
    return finalPlatform.value !== null
  })

  /**
   * 计算属性：平台显示信息
   * 获取最终平台的详细显示信息，包括名称、图标、颜色等
   * 
   * @complexity O(1) - 常数时间的信息查找
   * @flow
   * 1. 获取最终确定的平台
   * 2. 如果平台存在，调用getPlatformDisplayInfo获取显示信息
   * 3. 如果平台不存在，返回null
   * 
   * @example
   * ```typescript
   * setManualPlatform('DOUYIN')
   * console.log(platformDisplayInfo.value)
   * // {
   * //   name: '抖音',
   * //   icon: 'douyin-icon',
   * //   color: '#fe2c55',
   * //   description: '抖音短视频平台'
   * // }
   * ```
   * 
   * @returns 平台显示信息对象或null
   */
  const platformDisplayInfo = computed(() => {
    const platform = finalPlatform.value
    return platform ? getPlatformDisplayInfo(platform) : null
  })

  /**
   * 计算属性：是否显示识别结果
   * 判断是否应该在UI中显示识别结果，需要有结果且不在识别中
   * 
   * @complexity O(1) - 简单的布尔逻辑判断
   * @flow
   * 1. 检查识别结果是否存在（不为null）
   * 2. 检查当前是否不在识别过程中
   * 3. 两个条件都满足时返回true
   * 
   * @example
   * ```typescript
   * // 识别完成有结果时
   * await recognizeURL('https://www.douyin.com/user/123')
   * console.log(showRecognitionResult.value) // true
   * 
   * // 正在识别时
   * recognizeURL('https://space.bilibili.com/456') // 不等待
   * console.log(showRecognitionResult.value) // false (recognizing=true)
   * ```
   * 
   * @returns 是否应该显示识别结果
   */
  const showRecognitionResult = computed(() => {
    return state.value.result !== null && !state.value.recognizing
  })

  /**
   * 计算属性：是否显示建议
   * 检查识别结果是否包含平台建议且建议列表不为空
   * 
   * @complexity O(1) - 数组长度检查为常数时间
   * @flow
   * 1. 检查识别结果中是否有suggestions属性
   * 2. 检查suggestions数组长度是否大于0
   * 3. 返回布尔结果
   * 
   * @example
   * ```typescript
   * // 有建议的情况
   * await recognizeURL('https://unknown-platform.com/user/123')
   * if (showSuggestions.value) {
   *   console.log('系统提供了', result.value.suggestions.length, '个建议平台')
   * }
   * ```
   * 
   * @returns 是否有可显示的建议
   */
  const showSuggestions = computed(() => {
    return state.value.result?.suggestions && state.value.result.suggestions.length > 0
  })

  /**
   * 计算属性：识别置信度等级
   * 将数值置信度转换为可读的等级标识，用于UI样式和用户理解
   * 
   * @complexity O(1) - 常数次数的比较操作
   * @flow
   * 1. 获取识别结果的置信度值（0-1）
   * 2. 根据阈值划分等级：>=0.9为high, >=0.7为medium, >=0.5为low
   * 3. 其他情况为very-low
   * 
   * @example
   * ```typescript
   * await recognizeURL('https://www.douyin.com/user/123')
   * console.log(confidenceLevel.value) // 'high' (置信度很高)
   * 
   * await recognizeURL('https://some-ambiguous-url.com')
   * console.log(confidenceLevel.value) // 'low' 或 'very-low'
   * ```
   * 
   * @returns 置信度等级：'high' | 'medium' | 'low' | 'very-low'
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
   * 将数值置信度转换为百分比格式的文本，用于用户界面显示
   * 
   * @complexity O(1) - 简单的数学运算和字符串拼接
   * @flow
   * 1. 获取识别结果的置信度值（0-1）
   * 2. 转换为百分比（乘以100并四舍五入）
   * 3. 添加百分号后缀
   * 
   * @example
   * ```typescript
   * await recognizeURL('https://www.douyin.com/user/123')
   * console.log(confidenceText.value) // '95%'
   * 
   * await recognizeURL('https://uncertain-url.com')
   * console.log(confidenceText.value) // '45%'
   * ```
   * 
   * @returns 百分比格式的置信度文本
   */
  const confidenceText = computed(() => {
    const confidence = state.value.result?.confidence || 0
    return `${Math.round(confidence * 100)}%`
  })

  /**
   * 执行URL识别
   * 对输入的URL进行格式验证和平台识别，支持置信度评估和错误处理
   * 
   * @param {string} url - 要识别的URL地址
   * @returns {Promise<void>}
   * @complexity O(1) - URL验证和平台识别为常数时间操作
   * @flow 检查URL长度 -> 验证URL格式 -> 执行平台识别 -> 更新状态 -> 处理错误
   * 
   * @example
   * ```typescript
   * // 识别抖音URL
   * await recognizeURL('https://www.douyin.com/user/MS4wLjABAAAA...')
   * 
   * // 识别B站URL  
   * await recognizeURL('https://space.bilibili.com/123456789')
   * 
   * // 识别小红书URL
   * await recognizeURL('https://www.xiaohongshu.com/user/profile/5f8c...')
   * 
   * // 处理无效URL
   * await recognizeURL('invalid-url') // 会设置validationError
   * ```
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
   * 允许用户手动覆盖自动识别的结果，用于处理识别错误或用户偏好
   * 
   * @param {PromotionPlatform | null} platform - 手动选择的平台，null表示清除选择
   * @returns {void}
   * @complexity O(1) - 状态设置为常数时间操作
   * @flow 设置手动平台 -> 更新覆盖标志 -> 触发响应式更新
   * 
   * @example
   * ```typescript
   * // 手动设置为抖音平台
   * setManualPlatform('DOUYIN')
   * 
   * // 手动设置为B站平台
   * setManualPlatform('BILIBILI')
   * 
   * // 清除手动设置
   * setManualPlatform(null)
   * ```
   */
  const setManualPlatform = (platform: PromotionPlatform | null) => {
    state.value.manualPlatform = platform
    state.value.manualOverride = platform !== null
  }

  /**
   * 清除手动覆盖，恢复自动识别
   * 移除用户的手动选择，让系统回到自动识别模式
   * 
   * @function clearManualOverride
   * @returns {void}
   * @complexity O(1) - 状态重置为常数时间操作
   * @flow 重置手动覆盖标志 -> 清除手动平台 -> 恢复自动识别
   * 
   * @example
   * ```typescript
   * // 用户之前手动设置了平台
   * setManualPlatform('XIAOHONGSHU')
   * console.log(manualOverride.value) // true
   * 
   * // 清除手动覆盖，恢复自动识别
   * clearManualOverride()
   * console.log(manualOverride.value) // false
   * // 现在会使用自动识别的结果
   * ```
   */
  const clearManualOverride = () => {
    state.value.manualOverride = false
    state.value.manualPlatform = null
  }

  /**
   * 设置输入URL
   * 更新URL输入值，并自动清除手动覆盖以重新触发识别
   * 
   * @param {string} url - 新的URL地址
   * @returns {void}
   * @complexity O(1) - URL设置为常数时间操作
   * @flow 更新URL值 -> 检查手动覆盖 -> 清除覆盖状态 -> 触发防抖识别
   * 
   * @example
   * ```typescript
   * // 设置新的URL（会触发自动识别）
   * setInputUrl('https://www.douyin.com/user/123456')
   * 
   * // 如果之前有手动覆盖，会被自动清除
   * setManualPlatform('BILIBILI') // 手动设置
   * setInputUrl('https://space.bilibili.com/789') // 清除手动设置，重新识别
   * ```
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
   * 将组合式API的所有状态重置为初始值，用于清理或重新开始
   * 
   * @function reset
   * @returns {void}
   * @complexity O(1) - 状态重置为常数时间操作
   * @flow 重置状态对象 -> 清除所有标志 -> 恢复初始状态
   * 
   * @example
   * ```typescript
   * // 在组件卸载或需要重新开始时调用
   * reset()
   * 
   * // 重置后所有状态都回到初始值
   * console.log(inputUrl.value) // ''
   * console.log(hasValidPlatform.value) // false
   * console.log(manualOverride.value) // false
   * ```
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
   * 验证给定URL是否属于系统支持的平台之一
   * 
   * @complexity O(1) - 平台检查为常数时间操作
   * @flow
   * 1. 接收URL字符串参数
   * 2. 调用工具函数isSupportedPlatform进行检查
   * 3. 返回布尔结果
   * 
   * @example
   * ```typescript
   * console.log(checkSupportedPlatform('https://www.douyin.com/user/123')) // true
   * console.log(checkSupportedPlatform('https://unsupported-site.com')) // false
   * console.log(checkSupportedPlatform('invalid-url')) // false
   * ```
   * 
   * @param url - 要检查的URL地址
   * @returns 是否为支持的平台
   */
  const checkSupportedPlatform = (url: string): boolean => {
    return isSupportedPlatform(url)
  }

  /**
   * 获取建议平台的显示信息
   * 将识别结果中的建议平台列表转换为带显示信息的完整对象数组
   * 
   * @complexity O(n) - n为建议平台数量，通常很小
   * @flow
   * 1. 检查识别结果是否包含建议列表
   * 2. 如果没有建议，返回空数组
   * 3. 遍历建议列表，为每个平台获取显示信息
   * 4. 返回包含平台和显示信息的对象数组
   * 
   * @example
   * ```typescript
   * await recognizeURL('https://ambiguous-url.com')
   * const suggestions = getSuggestionDisplayInfo()
   * console.log(suggestions)
   * // [
   * //   {
   * //     platform: 'DOUYIN',
   * //     displayInfo: { name: '抖音', icon: 'douyin-icon', ... }
   * //   },
   * //   {
   * //     platform: 'BILIBILI', 
   * //     displayInfo: { name: 'B站', icon: 'bilibili-icon', ... }
   * //   }
   * // ]
   * ```
   * 
   * @returns 建议平台的显示信息数组
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
   * 停止所有监听器和清理防抖定时器，防止内存泄漏
   * 
   * @complexity O(1) - 固定数量的清理操作
   * @flow
   * 1. 停止URL变化监听器
   * 2. 停止输入变化监听器
   * 3. 清理防抖定时器（如果存在cancel方法）
   * 
   * @example
   * ```typescript
   * // 在组件卸载或需要清理时调用
   * cleanup()
   * 
   * // 手动清理（虽然组件卸载时会自动调用）
   * onBeforeUnmount(() => {
   *   cleanup()
   * })
   * ```
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
