/**
 * @fileoverview 防抖和节流工具函数模块
 * 提供用于控制函数执行频率的Vue 3 composables
 * 
 * @module composables/useDebounce
 * @requires vue
 */

import { ref } from 'vue'

/**
 * 创建一个防抖函数的组合式API
 * 防抖确保在指定延迟时间内只执行最后一次调用，常用于搜索框输入、按钮点击等场景
 * 
 * @template T 原函数类型
 * @param {T} fn - 需要防抖的原始函数
 * @param {number} [delay=300] - 防抖延迟时间（毫秒），默认300ms
 * @returns {{debouncedFn: Function, cancel: Function, isDebouncing: Ref<boolean>}} 防抖函数对象
 * @complexity O(1) - 单次调用的时间复杂度，但会延迟执行
 * @flow 调用防抖函数 -> 清除旧定时器 -> 设置新定时器 -> 延迟执行原函数
 * 
 * @example
 * ```typescript
 * const searchUser = (query: string) => api.searchUsers(query)
 * const { debouncedFn, cancel, isDebouncing } = useDebounce(searchUser, 500)
 * 
 * // 在搜索框中使用
 * const handleSearch = (query: string) => {
 *   debouncedFn(query) // 只有在停止输入500ms后才会执行
 * }
 * 
 * // 取消防抖
 * cancel()
 * ```
 */
export function useDebounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number = 300
) {
  // 定时器引用
  const timer = ref<number | null>(null)
  // 是否正在执行
  const isDebouncing = ref(false)
  
  /**
   * 防抖包装函数
   * 每次调用都会重置定时器，只有在延迟时间内没有新调用时才执行原函数
   * 
   * @param {...Parameters<T>} args - 原函数的参数列表
   * @returns {Promise<ReturnType<T>>} 包装在Promise中的原函数返回值
   * @complexity O(1) - 设置定时器的常数时间操作
   * @flow 清除旧定时器 -> 设置新定时器 -> 延迟后执行原函数 -> 更新状态
   */
  const debouncedFn = (...args: Parameters<T>): Promise<ReturnType<T>> => {
    isDebouncing.value = true
    
    return new Promise((resolve, reject) => {
      // 如果已经有定时器，清除它
      if (timer.value !== null) {
        clearTimeout(timer.value)
      }
      
      // 设置新的定时器
      timer.value = window.setTimeout(() => {
        try {
          const result = fn(...args)
          resolve(result)
          isDebouncing.value = false
        } catch (error) {
          reject(error)
          isDebouncing.value = false
        }
      }, delay)
    })
  }
  
  /**
   * 取消当前防抖定时器
   * 立即清除待执行的函数调用并重置状态
   * 
   * @returns {void}
   * @complexity O(1) - 清除定时器的常数时间操作
   * @flow 清除定时器 -> 重置状态引用 -> 更新防抖标志
   * 
   * @example
   * ```typescript
   * // 在组件卸载时取消防抖
   * onUnmounted(() => {
   *   cancel()
   * })
   * ```
   */
  const cancel = () => {
    if (timer.value !== null) {
      clearTimeout(timer.value)
      timer.value = null
    }
    isDebouncing.value = false
  }
  
  return {
    debouncedFn,
    cancel,
    isDebouncing
  }
}

/**
 * 创建一个节流函数的组合式API
 * 节流确保在指定时间间隔内最多执行一次函数，常用于滚动事件、窗口缩放等高频触发场景
 * 
 * @template T 原函数类型
 * @param {T} fn - 需要节流的原始函数
 * @param {number} [delay=300] - 节流间隔时间（毫秒），默认300ms
 * @returns {{throttledFn: Function, isThrottling: Ref<boolean>}} 节流函数对象
 * @complexity O(1) - 单次调用的时间复杂度
 * @flow 检查上次执行时间 -> 判断是否可以执行 -> 执行或跳过 -> 更新状态
 * 
 * @example
 * ```typescript
 * const handleScroll = () => {
 *   // 处理滚动逻辑
 *   console.log('Scrolling...')
 * }
 * const { throttledFn, isThrottling } = useThrottle(handleScroll, 100)
 * 
 * // 在滚动事件中使用
 * window.addEventListener('scroll', throttledFn) // 最多每100ms执行一次
 * 
 * // 检查是否正在节流
 * if (isThrottling.value) {
 *   console.log('函数调用被节流跳过')
 * }
 * ```
 */
export function useThrottle<T extends (...args: any[]) => any>(
  fn: T,
  delay: number = 300
) {
  // 上次执行时间
  let lastTime = 0
  // 是否正在执行
  const isThrottling = ref(false)
  
  /**
   * 节流包装函数
   * 根据上次执行时间判断是否应该执行原函数，如果间隔不足则跳过执行
   * 
   * @param {...Parameters<T>} args - 原函数的参数列表
   * @returns {ReturnType<T> | undefined} 原函数返回值，如果被节流则返回undefined
   * @complexity O(1) - 时间检查和条件判断的常数时间操作
   * @flow 获取当前时间 -> 计算时间间隔 -> 判断是否执行 -> 更新状态和执行时间
   */
  const throttledFn = (...args: Parameters<T>): ReturnType<T> | undefined => {
    const now = Date.now()
    
    // 如果距离上次执行已经超过指定时间，执行函数
    if (now - lastTime >= delay) {
      lastTime = now
      isThrottling.value = false
      return fn(...args)
    } else {
      isThrottling.value = true
      return undefined
    }
  }
  
  return {
    throttledFn,
    isThrottling
  }
} 