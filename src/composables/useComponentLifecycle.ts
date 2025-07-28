/**
 * @fileoverview Vue组件生命周期管理组合式API模块
 * 提供安全的组件生命周期管理功能，防止组件卸载后的异步操作错误，包括安全的异步操作、定时器管理、监听器管理等
 * 
 * @module composables/useComponentLifecycle
 * @requires vue
 */

import { ref, onBeforeUnmount, onMounted, watch, readonly } from 'vue'

/**
 * Vue组件生命周期管理的核心组合式API
 * 提供安全的异步操作、定时器管理和清理函数管理功能
 * 
 * @complexity O(1) - 初始化和状态管理均为常数时间复杂度
 * @flow
 * 1. 初始化挂载状态和清理函数列表
 * 2. 在组件挂载时设置isMounted为true
 * 3. 在组件卸载前执行所有清理函数并重置状态
 * 4. 提供安全的异步操作和定时器管理方法
 * 
 * @example
 * ```typescript
 * // 基础使用
 * const {
 *   isMounted,
 *   addCleanup,
 *   safeAsync,
 *   safeCallback,
 *   safeTimeout,
 *   safeInterval
 * } = useComponentLifecycle()
 * 
 * // 安全执行异步操作
 * const result = await safeAsync(async () => {
 *   const data = await fetchUserData()
 *   return data
 * })
 * 
 * // 安全设置定时器
 * safeTimeout(() => {
 *   console.log('3秒后执行，组件卸载时自动清理')
 * }, 3000)
 * 
 * // 添加自定义清理函数
 * addCleanup(() => {
 *   // 清理WebSocket连接、事件监听器等
 *   socket.disconnect()
 * })
 * ```
 * 
 * @returns 组件生命周期管理工具集
 */
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
   * 添加清理函数到清理列表
   * 这些函数将在组件卸载前自动执行
   * 
   * @complexity O(1) - 数组push操作为常数时间
   * @flow
   * 1. 将清理函数添加到cleanupFunctions数组
   * 2. 在组件卸载时会自动调用所有清理函数
   * 
   * @example
   * ```typescript
   * // 添加WebSocket清理
   * addCleanup(() => {
   *   websocket.close()
   *   console.log('WebSocket连接已关闭')
   * })
   * 
   * // 添加事件监听器清理
   * const removeListener = () => window.removeEventListener('resize', handleResize)
   * addCleanup(removeListener)
   * ```
   * 
   * @param cleanup - 清理函数，将在组件卸载前执行
   */
  const addCleanup = (cleanup: () => void) => {
    cleanupFunctions.push(cleanup)
  }
  
  /**
   * 安全执行异步操作，防止组件卸载后的状态更新错误
   * 在异步操作前后都会检查组件挂载状态，确保操作安全性
   * 
   * @complexity O(1) + O(f) - 常数时间检查加上异步函数f的时间复杂度
   * @flow
   * 1. 检查组件是否仍然挂载，未挂载则直接返回null
   * 2. 执行异步函数
   * 3. 异步操作完成后再次检查组件挂载状态
   * 4. 如果组件已卸载，返回null；否则返回结果
   * 5. 异常处理：组件已卸载时忽略错误，否则抛出错误
   * 
   * @example
   * ```typescript
   * // 安全的API调用
   * const userData = await safeAsync(async () => {
   *   return await userApi.fetchProfile(userId)
   * })
   * 
   * if (userData) {
   *   // 只有在组件仍然挂载时才更新状态
   *   user.value = userData
   * }
   * 
   * // 安全的文件上传
   * const uploadResult = await safeAsync(async () => {
   *   return await uploadFile(file)
   * })
   * ```
   * 
   * @template T - 异步函数返回值类型
   * @param asyncFn - 要安全执行的异步函数
   * @returns Promise<T | null> - 异步函数结果或null（组件已卸载时）
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
   * 安全执行回调函数，防止组件卸载后的无效调用
   * 只在组件仍然挂载时执行回调，避免内存泄漏和错误
   * 
   * @complexity O(1) + O(f) - 常数时间检查加上回调函数f的时间复杂度
   * @flow
   * 1. 检查组件挂载状态
   * 2. 如果组件仍然挂载，执行回调函数并传入参数
   * 3. 如果组件已卸载，静默跳过执行
   * 
   * @example
   * ```typescript
   * // 安全的事件处理
   * const handleClick = (event: MouseEvent) => {
   *   console.log('按钮被点击', event)
   * }
   * 
   * // 在异步操作后安全调用
   * setTimeout(() => {
   *   safeCallback(handleClick, mockEvent)
   * }, 5000)
   * 
   * // 安全的状态更新
   * safeCallback((newValue: string) => {
   *   inputValue.value = newValue
   * }, 'new value')
   * ```
   * 
   * @template T - 回调函数参数类型数组
   * @param callback - 要安全执行的回调函数
   * @param args - 传递给回调函数的参数
   */
  const safeCallback = <T extends any[]>(callback: (...args: T) => void, ...args: T) => {
    if (isMounted.value) {
      callback(...args)
    }
  }
  
  /**
   * 创建安全的延时定时器，组件卸载时自动清理
   * 在执行回调前检查组件挂载状态，防止无效执行
   * 
   * @complexity O(1) - 创建定时器和添加清理函数均为常数时间
   * @flow
   * 1. 使用setTimeout创建定时器
   * 2. 在回调执行前检查组件挂载状态
   * 3. 将定时器清理函数添加到清理列表
   * 4. 组件卸载时自动清理定时器
   * 
   * @example
   * ```typescript
   * // 延迟显示消息
   * const timerId = safeTimeout(() => {
   *   showMessage.value = true
   * }, 3000)
   * 
   * // 延迟API调用
   * safeTimeout(async () => {
   *   const data = await fetchData()
   *   if (data) {
   *     results.value = data
   *   }
   * }, 2000)
   * 
   * // 延迟路由跳转
   * safeTimeout(() => {
   *   router.push('/dashboard')
   * }, 1500)
   * ```
   * 
   * @param callback - 延时执行的回调函数
   * @param delay - 延迟时间（毫秒）
   * @returns 定时器ID，可用于手动清理
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
   * 创建安全的间隔定时器，组件卸载时自动清理
   * 每次执行前检查组件挂载状态，确保安全性
   * 
   * @complexity O(1) - 创建定时器和添加清理函数均为常数时间
   * @flow
   * 1. 使用setInterval创建间隔定时器
   * 2. 每次回调执行前检查组件挂载状态
   * 3. 如果组件已卸载，立即清理定时器
   * 4. 将定时器清理函数添加到清理列表
   * 
   * @example
   * ```typescript
   * // 定期刷新数据
   * const intervalId = safeInterval(async () => {
   *   const latestData = await refreshData()
   *   data.value = latestData
   * }, 30000) // 每30秒刷新
   * 
   * // 实时时钟
   * safeInterval(() => {
   *   currentTime.value = new Date().toLocaleTimeString()
   * }, 1000) // 每秒更新
   * 
   * // 定期健康检查
   * safeInterval(async () => {
   *   const status = await checkServerHealth()
   *   serverStatus.value = status
   * }, 60000) // 每分钟检查
   * ```
   * 
   * @param callback - 间隔执行的回调函数
   * @param interval - 间隔时间（毫秒）
   * @returns 定时器ID，可用于手动清理
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
 * 创建安全的watch监听器组合式API
 * 监听器在组件卸载时自动停止，防止内存泄漏
 * 
 * @complexity O(1) - 创建监听器为常数时间复杂度
 * @flow
 * 1. 获取组件生命周期管理实例
 * 2. 创建安全的watch函数
 * 3. 自动将停止监听函数添加到清理列表
 * 4. 组件卸载时自动停止所有监听器
 * 
 * @example
 * ```typescript
 * const { safeWatch } = useSafeWatch()
 * 
 * // 监听响应式数据变化
 * safeWatch(
 *   () => user.value.id,
 *   (newId, oldId) => {
 *     console.log(`用户ID从 ${oldId} 变更为 ${newId}`)
 *     fetchUserProfile(newId)
 *   }
 * )
 * 
 * // 立即执行的监听器
 * safeWatch(
 *   () => route.params.id,
 *   (id) => {
 *     loadPageData(id)
 *   },
 *   { immediate: true }
 * )
 * ```
 * 
 * @returns 安全监听器工具集
 */
export function useSafeWatch() {
  const { addCleanup } = useComponentLifecycle()
  
  /**
   * 创建安全的watch监听器
   * 自动在组件卸载时停止监听，防止内存泄漏
   * 
   * @complexity O(1) - 创建监听器和添加清理函数均为常数时间
   * @flow
   * 1. 使用Vue的watch创建监听器
   * 2. 获取停止监听的函数
   * 3. 将停止函数添加到清理列表
   * 4. 返回停止函数供手动调用
   * 
   * @template T - 监听源数据类型
   * @param source - 监听源函数，返回要监听的值
   * @param callback - 值变化时的回调函数
   * @param options - 监听选项，如是否立即执行
   * @returns 停止监听的函数
   */
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
 * 防抖函数的安全版本组合式API
 * 组件卸载时自动取消待执行的防抖函数，防止内存泄漏
 * 
 * @complexity O(1) - 创建防抖函数为常数时间复杂度
 * @flow
 * 1. 获取组件生命周期管理实例
 * 2. 创建安全的防抖函数
 * 3. 自动管理定时器清理
 * 4. 组件卸载时取消所有待执行的防抖任务
 * 
 * @example
 * ```typescript
 * const { safeDebounce } = useSafeDebounce()
 * 
 * // 防抖搜索
 * const debouncedSearch = safeDebounce(async (keyword: string) => {
 *   const results = await searchApi.search(keyword)
 *   searchResults.value = results
 * }, 500)
 * 
 * // 防抖保存
 * const debouncedSave = safeDebounce(() => {
 *   saveFormData(formState.value)
 * }, 1000)
 * 
 * // 在输入事件中使用
 * const handleInput = (event: Event) => {
 *   const value = (event.target as HTMLInputElement).value
 *   debouncedSearch(value)
 * }
 * ```
 * 
 * @returns 安全防抖工具集
 */
export function useSafeDebounce() {
  const { addCleanup, isMounted } = useComponentLifecycle()
  
  /**
   * 创建安全的防抖函数
   * 在组件卸载时自动清理待执行的防抖任务
   * 
   * @complexity O(1) - 创建防抖函数和管理定时器均为常数时间
   * @flow
   * 1. 创建防抖函数，管理定时器状态
   * 2. 每次调用时清除之前的定时器
   * 3. 设置新的延迟执行定时器
   * 4. 执行前检查组件挂载状态
   * 5. 将定时器清理函数添加到清理列表
   * 
   * @template T - 原函数类型
   * @param fn - 要防抖的原函数
   * @param delay - 防抖延迟时间（毫秒）
   * @returns 防抖处理后的函数
   */
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
