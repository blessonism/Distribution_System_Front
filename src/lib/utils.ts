/**
 * @fileoverview 通用工具函数库
 * 提供应用程序中常用的工具函数，包括CSS类名合并、TanStack Table值更新等核心功能
 * 基于现代Web开发最佳实践，提供类型安全且高性能的工具函数集合
 * 
 * @author Frontend Team
 * @since 1.0.0
 * @version 1.2.0
 * 
 * @description
 * utils.ts是整个Vue应用的通用工具函数库，主要功能包括：
 * - 🎨 CSS类名智能合并，基于clsx和tailwind-merge的最佳实践
 * - 📊 TanStack Table值更新器，提供类型安全的响应式数据更新
 * - ⚡ 高性能实现，确保在频繁调用场景下的性能表现
 * - 🔧 TypeScript完全支持，提供完整的类型推导和安全检查
 * - 🚀 轻量级设计，最小化bundle大小和运行时开销
 * 
 * @features
 * - **CSS类名合并**: 智能处理Tailwind CSS类名冲突和重复
 * - **条件样式**: 支持条件性类名应用和动态样式切换
 * - **表格数据更新**: 为TanStack Table提供响应式数据更新机制
 * - **类型安全**: 完整的TypeScript类型定义和推导支持
 * - **性能优化**: 针对高频调用场景的性能优化实现
 * 
 * @example
 * ```typescript
 * // CSS类名合并示例
 * const buttonClass = cn(
 *   'px-4 py-2 rounded',
 *   'bg-blue-500 hover:bg-blue-600',
 *   isActive && 'bg-blue-700',
 *   isDisabled && 'opacity-50 cursor-not-allowed'
 * )
 * 
 * // TanStack Table值更新示例
 * const tableData = ref([{ id: 1, name: 'John' }])
 * valueUpdater(newData => [...newData, { id: 2, name: 'Jane' }], tableData)
 * ```
 */

import type { Updater } from '@tanstack/vue-table'
import type { Ref } from 'vue'
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * CSS类名智能合并函数
 * 基于clsx和tailwind-merge的组合，提供Tailwind CSS类名的智能合并和冲突解决
 * 
 * @function cn
 * @param {...ClassValue[]} inputs - 可变数量的类名输入，支持字符串、对象、数组等多种格式
 * @returns {string} 合并后的CSS类名字符串
 * 
 * @complexity O(n) - n为输入类名的总数，线性时间复杂度
 * @flow 输入收集 → clsx标准化 → tailwind-merge冲突解决 → 最终类名输出
 * 
 * @description 合并策略：
 * - 使用clsx处理条件性类名和多种输入格式的标准化
 * - 使用tailwind-merge解决Tailwind CSS类名冲突（如bg-red-500 vs bg-blue-500）
 * - 确保最后出现的类名具有更高优先级
 * - 自动去除重复类名和无效类名
 * 
 * @example
 * ```typescript
 * // 基础类名合并
 * cn('px-4', 'py-2', 'rounded')
 * // 返回: 'px-4 py-2 rounded'
 * 
 * // 条件性类名应用
 * cn('btn', isActive && 'btn-active', isDisabled && 'btn-disabled')
 * // 返回: 'btn btn-active' (当isActive为true，isDisabled为false时)
 * 
 * // Tailwind冲突解决
 * cn('bg-red-500', 'bg-blue-500')
 * // 返回: 'bg-blue-500' (后者覆盖前者)
 * 
 * // 复杂条件和对象语法
 * cn(
 *   'base-class',
 *   {
 *     'active-class': isActive,
 *     'disabled-class': isDisabled
 *   },
 *   variant === 'primary' && 'primary-styles',
 *   ['additional', 'classes']
 * )
 * ```
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * TanStack Table值更新器函数
 * 为TanStack Vue Table提供类型安全的响应式数据更新机制，支持函数式和直接值更新
 * 
 * @function valueUpdater
 * @template T - 更新器类型，必须扩展自TanStack的Updater类型
 * @param {T} updaterOrValue - 更新器函数或直接值，支持两种更新模式
 * @param {Ref} ref - Vue响应式引用，将被更新的目标数据
 * @returns {void}
 * 
 * @complexity O(1) - 简单的类型检查和值赋值，常数时间复杂度
 * @flow 类型检查 → 函数调用或直接赋值 → 响应式更新触发
 * 
 * @description 更新机制：
 * - 函数模式：当updaterOrValue是函数时，以当前值作为参数调用该函数
 * - 直接模式：当updaterOrValue是值时，直接替换当前值
 * - 自动触发Vue的响应式更新系统
 * - 完全兼容TanStack Table的更新器模式
 * 
 * @example
 * ```typescript
 * // 表格数据引用
 * const tableData = ref([
 *   { id: 1, name: 'John', age: 25 },
 *   { id: 2, name: 'Jane', age: 30 }
 * ])
 * 
 * // 函数式更新 - 添加新项
 * valueUpdater(
 *   (currentData) => [...currentData, { id: 3, name: 'Bob', age: 35 }],
 *   tableData
 * )
 * 
 * // 函数式更新 - 过滤数据
 * valueUpdater(
 *   (currentData) => currentData.filter(item => item.age > 25),
 *   tableData
 * )
 * 
 * // 直接值更新 - 完全替换
 * valueUpdater(
 *   [{ id: 1, name: 'Alice', age: 28 }],
 *   tableData
 * )
 * 
 * // 在TanStack Table中的典型使用
 * const table = useVueTable({
 *   data: tableData,
 *   columns,
 *   onSortingChange: updaterOrValue => valueUpdater(updaterOrValue, sorting),
 *   onColumnFiltersChange: updaterOrValue => valueUpdater(updaterOrValue, columnFilters),
 *   onColumnVisibilityChange: updaterOrValue => valueUpdater(updaterOrValue, columnVisibility),
 *   onRowSelectionChange: updaterOrValue => valueUpdater(updaterOrValue, rowSelection),
 * })
 * ```
 */
export function valueUpdater<T extends Updater<any>>(updaterOrValue: T, ref: Ref) {
  ref.value
    = typeof updaterOrValue === 'function'
      ? updaterOrValue(ref.value)
      : updaterOrValue
}
