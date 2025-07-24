/**
 * Vue组件生命周期管理工具
 * 用于防止组件卸载时的异步操作错误
 */

import { ref, onBeforeUnmount, onMounted, watch, readonly } from 'vue'

export function useComponentLifecycle() {
  // 组件挂载状态
  const isMounted = ref(false)
  
  // 清理函数列表
  const cleanupFunctions: (() => void)[] = []
  
  // 组件挂载时设置状态
  onMounted(() => {
    isMounted.value = true
  })
  
  // 组件卸载前执行清理
  onBeforeUnmount(() => {
    isMounted.value = false
    
    // 执行所有清理函数
    cleanupFunctions.forEach(cleanup => {
      try {
        cleanup()
      } catch (error) {
        console.warn('清理函数执行失败:', error)
      }
    })
    
    // 清空清理函数列表
    cleanupFunctions.length = 0
  })
  
  /**
   * 添加清理函数
   * @param cleanup 清理函数
   */
  const addCleanup = (cleanup: () => void) => {
    cleanupFunctions.push(cleanup)
  }
  
  /**
   * 安全执行异步操作
   * 只有在组件仍然挂载时才执行
   * @param asyncFn 异步函数
   * @returns Promise
   */
  const safeAsync = async <T>(asyncFn: () => Promise<T>): Promise<T | null> => {
    if (!isMounted.value) {
      console.warn('组件已卸载，跳过异步操作')
      return null
    }
    
    try {
      const result = await asyncFn()
      
      // 再次检查组件是否仍然挂载
      if (!isMounted.value) {
        console.warn('异步操作完成时组件已卸载')
        return null
      }
      
      return result
    } catch (error) {
      // 只有在组件仍然挂载时才抛出错误
      if (isMounted.value) {
        throw error
      }
      console.warn('组件已卸载，忽略异步操作错误:', error)
      return null
    }
  }
  
  /**
   * 安全执行回调函数
   * 只有在组件仍然挂载时才执行
   * @param callback 回调函数
   * @param args 参数
   */
  const safeCallback = <T extends any[]>(callback: (...args: T) => void, ...args: T) => {
    if (isMounted.value) {
      callback(...args)
    }
  }
  
  /**
   * 创建安全的定时器
   * 组件卸载时自动清理
   * @param callback 回调函数
   * @param delay 延迟时间
   * @returns 定时器ID
   */
  const safeTimeout = (callback: () => void, delay: number): number => {
    const timerId = window.setTimeout(() => {
      if (isMounted.value) {
        callback()
      }
    }, delay)
    
    // 添加清理函数
    addCleanup(() => {
      clearTimeout(timerId)
    })
    
    return timerId
  }
  
  /**
   * 创建安全的间隔定时器
   * 组件卸载时自动清理
   * @param callback 回调函数
   * @param interval 间隔时间
   * @returns 定时器ID
   */
  const safeInterval = (callback: () => void, interval: number): number => {
    const intervalId = window.setInterval(() => {
      if (isMounted.value) {
        callback()
      } else {
        clearInterval(intervalId)
      }
    }, interval)
    
    // 添加清理函数
    addCleanup(() => {
      clearInterval(intervalId)
    })
    
    return intervalId
  }
  
  return {
    // 状态
    isMounted: readonly(isMounted),
    
    // 方法
    addCleanup,
    safeAsync,
    safeCallback,
    safeTimeout,
    safeInterval
  }
}

/**
 * 创建安全的watch监听器
 * 组件卸载时自动停止监听
 */
export function useSafeWatch() {
  const { addCleanup } = useComponentLifecycle()
  
  const safeWatch = <T>(
    source: () => T,
    callback: (newValue: T, oldValue: T) => void,
    options?: { immediate?: boolean }
  ) => {
    const stopWatching = watch(source, callback, options)
    addCleanup(stopWatching)
    return stopWatching
  }
  
  return {
    safeWatch
  }
}

/**
 * 防抖函数的安全版本
 * 组件卸载时自动取消
 */
export function useSafeDebounce() {
  const { addCleanup, isMounted } = useComponentLifecycle()
  
  const safeDebounce = <T extends (...args: any[]) => any>(
    fn: T,
    delay: number
  ): T => {
    let timeoutId: number | null = null
    
    const debouncedFn = ((...args: Parameters<T>) => {
      if (timeoutId !== null) {
        clearTimeout(timeoutId)
      }
      
      timeoutId = window.setTimeout(() => {
        if (isMounted.value) {
          fn(...args)
        }
        timeoutId = null
      }, delay)
    }) as T
    
    // 添加清理函数
    addCleanup(() => {
      if (timeoutId !== null) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
    })
    
    return debouncedFn
  }
  
  return {
    safeDebounce
  }
}
