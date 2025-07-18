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
              {{ column.header }}
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
import { computed, h, defineComponent, markRaw } from 'vue'

interface Column {
  id?: string
  accessorKey?: string
  header?: string
  cell?: (props: { row: any }) => any
}

interface Props {
  columns: Column[]
  data: any[] | undefined
  loading?: boolean
  pagination?: boolean
  totalItems?: number
  pageSize?: number
  currentPage?: number
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

// 渲染单元格内容
const renderCellContent = (column: Column, row: any) => {
  if (!column.cell) return null
  
  try {
    const cellContent = column.cell({ row })
    
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
    console.error('Error rendering cell content:', error)
    return h('span', 'Error')
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