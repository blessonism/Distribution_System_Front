import { ref } from 'vue'

/**
 * 创建一个防抖函数
 * @param fn 需要防抖的函数
 * @param delay 防抖延迟时间，默认为300毫秒
 * @returns 防抖后的函数和取消函数
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
   * @param args 原函数参数
   * @returns 原函数返回值的Promise
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
   * 取消防抖
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
 * 创建一个节流函数
 * @param fn 需要节流的函数
 * @param delay 节流延迟时间，默认为300毫秒
 * @returns 节流后的函数
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
   * @param args 原函数参数
   * @returns 原函数返回值
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