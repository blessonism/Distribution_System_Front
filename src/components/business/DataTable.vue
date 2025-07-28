<!--
/**
 * @fileoverview 通用数据表格组件
 * 基于Vue 3 Composition API构建的高性能数据表格组件，提供完整的表格展示、分页和自定义渲染功能
 * 支持响应式布局、加载状态、空状态处理、自定义列渲染和灵活的插槽系统
 * 集成Tailwind CSS样式系统，提供现代化的视觉体验和无缝的用户交互
 * 
 * @component DataTable
 * @author Frontend Team
 * @since 1.0.0
 * @version 1.2.0
 * 
 * @description
 * 这是分销系统前端的核心数据表格组件，提供以下核心功能：
 * - 🔧 灵活的列配置系统，支持自定义渲染函数
 * - 📄 完整的分页控制，包含首页、末页、上下页导航
 * - ⚡ 智能加载状态管理，提供骨架屏效果
 * - 🎨 响应式设计，适配不同屏幕尺寸
 * - 🔍 空状态友好提示，提升用户体验
 * - 🧩 插槽系统，支持工具栏和操作区域自定义
 * 
 * @usage
 * ```vue
 * <template>
 *   <DataTable
 *     :columns="tableColumns"
 *     :data="tableData"
 *     :loading="isLoading"
 *     :pagination="true"
 *     :total-items="totalCount"
 *     :current-page="currentPage"
 *     :page-size="pageSize"
 *     @page-change="handlePageChange"
 *   >
 *     <template #toolbar>
 *       <div class="flex gap-2">
 *         <Button @click="handleAdd">添加</Button>
 *         <Button @click="handleRefresh">刷新</Button>
 *       </div>
 *     </template>
 *     <template #actions>
 *       <Button @click="handleExport">导出</Button>
 *     </template>
 *   </DataTable>
 * </template>
 * ```
 * 
 * @example
 * ```typescript
 * // 列配置示例
 * const columns = [
 *   {
 *     id: 'name',
 *     header: '姓名',
 *     accessorKey: 'name'
 *   },
 *   {
 *     id: 'status', 
 *     header: '状态',
 *     cell: ({ row }) => {
 *       const status = row.original.status
 *       return h(Badge, {
 *         variant: status === 'active' ? 'default' : 'secondary'
 *       }, status === 'active' ? '激活' : '禁用')
 *     }
 *   },
 *   {
 *     id: 'actions',
 *     header: '操作',
 *     cell: ({ row }) => {
 *       return h('div', { class: 'flex gap-2' }, [
 *         h(Button, { 
 *           size: 'sm',
 *           onClick: () => handleEdit(row.original)
 *         }, '编辑'),
 *         h(Button, { 
 *           size: 'sm', 
 *           variant: 'destructive',
 *           onClick: () => handleDelete(row.original)
 *         }, '删除')
 *       ])
 *     }
 *   }
 * ]
 * ```
 */
-->
<template>
  <div class="w-full">
    <!-- 工具栏 -->
    <div class="flex justify-between items-center mb-4">
      <div>
        <slot name="toolbar"></slot>
      </div>
      <div>
        <slot name="actions"></slot>
      </div>
    </div>

    <!-- 表格 -->
    <div class="rounded-md border">
      <table class="w-full caption-bottom text-sm">
        <thead class="[&_tr]:border-b">
          <tr class="border-b transition-colors hover:bg-muted/20">
            <th 
              v-for="column in columns" 
              :key="column.id || column.accessorKey" 
              class="h-12 px-4 text-left align-middle font-medium text-muted-foreground"
            >
              <template v-if="typeof column.header === 'function'">
                <component :is="renderHeaderContent(column)" />
              </template>
              <template v-else>
                {{ column.header }}
              </template>
            </th>
          </tr>
        </thead>
        <tbody class="[&_tr:last-child]:border-0">
          <template v-if="!loading && safeData.length > 0">
            <tr 
              v-for="(row, index) in safeData" 
              :key="index"
              class="border-b transition-colors hover:bg-muted/20"
            >
              <td 
                v-for="column in columns" 
                :key="column.id || column.accessorKey" 
                class="p-4 align-middle"
              >
                <template v-if="column.cell">
                  <component :is="renderCellContent(column, row)" />
                </template>
                <template v-else>
                  {{ getColumnValue(row, column) }}
                </template>
              </td>
            </tr>
          </template>
          <template v-else-if="loading">
            <tr v-for="i in 5" :key="i">
              <td 
                v-for="column in columns" 
                :key="column.id || column.accessorKey" 
                class="p-4 align-middle"
              >
                <div class="h-4 bg-muted/30 rounded animate-pulse"></div>
              </td>
            </tr>
          </template>
          <template v-else>
            <tr>
              <td :colspan="columns.length" class="h-24 text-center">
                <div class="flex flex-col items-center justify-center">
                  <p class="text-muted-foreground">{{ emptyText || '暂无数据' }}</p>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <!-- 分页 -->
    <div v-if="pagination && totalItems > 0" class="flex items-center justify-end space-x-2 py-4">
      <div class="text-sm text-muted-foreground">
        共 <span class="font-medium">{{ totalItems }}</span> 条记录
      </div>
      <div class="space-x-1">
        <button
          class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors h-8 w-8 border border-input bg-background hover:bg-accent hover:text-accent-foreground"
          :disabled="currentPage === 1"
          @click="handlePageChange(1)"
        >
          <span class="sr-only">首页</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevrons-left"><path d="m11 17-5-5 5-5"/><path d="m18 17-5-5 5-5"/></svg>
        </button>
        <button
          class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors h-8 w-8 border border-input bg-background hover:bg-accent hover:text-accent-foreground"
          :disabled="currentPage === 1"
          @click="handlePageChange(currentPage - 1)"
        >
          <span class="sr-only">上一页</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-left"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <button
          v-for="page in displayedPages"
          :key="page"
          class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors h-8 min-w-[2rem] border border-input"
          :class="page === currentPage ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-accent hover:text-accent-foreground'"
          @click="handlePageChange(page)"
        >
          {{ page }}
        </button>
        <button
          class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors h-8 w-8 border border-input bg-background hover:bg-accent hover:text-accent-foreground"
          :disabled="currentPage === totalPages"
          @click="handlePageChange(currentPage + 1)"
        >
          <span class="sr-only">下一页</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-right"><path d="m9 18 6-6-6-6"/></svg>
        </button>
        <button
          class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors h-8 w-8 border border-input bg-background hover:bg-accent hover:text-accent-foreground"
          :disabled="currentPage === totalPages"
          @click="handlePageChange(totalPages)"
        >
          <span class="sr-only">末页</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevrons-right"><path d="m13 17 5-5-5-5"/><path d="m6 17 5-5-5-5"/></svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * @fileoverview DataTable组件的核心逻辑实现
 * 使用Vue 3 Composition API和 TypeScript实现的高性能数据表格组件
 */
import { computed, h, defineComponent, markRaw } from 'vue'

/**
 * 表格列定义接口
 * 定义数据表格中单个列的完整配置信息，支持灵活的数据访问和自定义渲染
 * 
 * @interface Column
 * 
 * @property {string} [id] - 列的唯一标识符，用于key绑定和追踪
 * @property {string} [accessorKey] - 数据对象中的属性名，用于自动获取列值
 * @property {string | (() => any)} [header] - 列标题，支持字符串或自定义渲染函数
 * @property {(props: { row: any }) => any} [cell] - 自定义单元格渲染函数
 * 
 * @example
 * ```typescript
 * const column: Column = {
 *   id: 'status',
 *   header: '状态',
 *   accessorKey: 'status',
 *   cell: ({ row }) => {
 *     return h(Badge, { 
 *       variant: row.original.status === 'active' ? 'default' : 'secondary' 
 *     }, row.original.status)
 *   }
 * }
 * ```
 */
interface Column {
  /** 列的唯一标识符 */
  id?: string
  /** 数据对象中的属性名 */
  accessorKey?: string
  /** 列标题，支持字符串或自定义渲染函数 */
  header?: string | (() => any)
  /** 自定义单元格渲染函数 */
  cell?: (props: { row: any }) => any
}

/**
 * DataTable组件属性接口
 * 定义数据表格组件的完整属性配置，支持数据展示、分页控制和状态管理
 * 
 * @interface Props
 * 
 * @property {Column[]} columns - 表格列配置数组，定义表格的结构和渲染方式
 * @property {any[] | undefined} data - 表格数据数组，支持undefined以处理加载状态
 * @property {boolean} [loading=false] - 加载状态，控制骨架屏显示
 * @property {boolean} [pagination=false] - 是否启用分页功能
 * @property {number} [totalItems=0] - 数据总数，用于分页计算
 * @property {number} [pageSize=10] - 每页显示数量
 * @property {number} [currentPage=1] - 当前页码
 * @property {string} [emptyText='暂无数据'] - 空状态提示文本
 * 
 * @example
 * ```typescript
 * const props: Props = {
 *   columns: tableColumns,
 *   data: tableData,
 *   loading: false,
 *   pagination: true,
 *   totalItems: 100,
 *   pageSize: 20,
 *   currentPage: 1,
 *   emptyText: '暂无用户数据'
 * }
 * ```
 */
interface Props {
  /** 表格列配置数组 */
  columns: Column[]
  /** 表格数据数组 */
  data: any[] | undefined
  /** 加载状态 */
  loading?: boolean
  /** 是否启用分页 */
  pagination?: boolean
  /** 数据总数 */
  totalItems?: number
  /** 每页数量 */
  pageSize?: number
  /** 当前页码 */
  currentPage?: number
  /** 空状态提示文本 */
  emptyText?: string
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  pagination: false,
  totalItems: 0,
  pageSize: 10,
  currentPage: 1,
  emptyText: '暂无数据'
})

const emit = defineEmits<{
  (e: 'page-change', page: number): void
}>()

// 确保data是一个安全的数组
const safeData = computed(() => {
  return Array.isArray(props.data) ? props.data : []
})

// 获取列值
const getColumnValue = (row: any, column: Column) => {
  if (!column.accessorKey) return ''
  return row[column.accessorKey]
}

// 渲染表头内容
const renderHeaderContent = (column: Column) => {
  if (typeof column.header === 'function') {
    try {
      const headerContent = column.header()
      return h(() => headerContent)
    } catch (error) {
      console.error('Error rendering header content:', error)
      return h('span', 'Error')
    }
  }
  return h('span', column.header)
}

// 渲染单元格内容
const renderCellContent = (column: Column, row: any) => {
  if (!column.cell) return null
  
  // 检查row是否存在
  if (!row) {
    console.error('表格行数据不存在', { column })
    return h('div', { class: 'text-red-500 text-xs' }, '行数据错误')
  }
  
  // 修改：支持两种访问方式，兼容原有的API调用
  try {
    // 准备传递的参数，同时支持直接访问row和通过row.original访问
    const rowParam = {
      row: {
        ...row,  // 直接将row数据传递
        original: row  // 同时提供original属性以兼容旧代码
      }
    };
    
    const cellContent = column.cell(rowParam);
    
    // 如果是对象且有template和setup属性，则创建一个组件
    if (cellContent && typeof cellContent === 'object' && cellContent.template) {
      const component = defineComponent({
        template: cellContent.template,
        setup: cellContent.setup || (() => ({}))
      })
      
      return markRaw(component)
    }
    
    // 否则使用渲染函数
    return h(() => cellContent)
  } catch (error) {
    console.error('Error rendering cell content:', error, { column, row })
    return h('div', { class: 'text-red-500 text-xs' }, `渲染错误: ${error instanceof Error ? error.message : '未知错误'}`)
  }
}

// 分页相关
const totalPages = computed(() => {
  return Math.max(1, Math.ceil(props.totalItems / props.pageSize))
})

const displayedPages = computed(() => {
  const current = props.currentPage
  const total = totalPages.value
  const delta = 2 // 当前页前后显示的页数
  
  if (total <= 5) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }
  
  let start = Math.max(1, current - delta)
  let end = Math.min(total, current + delta)
  
  // 调整开始和结束，确保始终显示5个页码
  if (end - start < 4) {
    if (start === 1) {
      end = Math.min(start + 4, total)
    } else if (end === total) {
      start = Math.max(end - 4, 1)
    }
  }
  
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
})

// 处理页码变更
const handlePageChange = (page: number) => {
  if (page < 1 || page > totalPages.value) return
  emit('page-change', page)
}
</script>

<script lang="ts">
export default {
  name: 'DataTable'
}
</script>