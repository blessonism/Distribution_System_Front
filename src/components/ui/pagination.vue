<template>
  <div class="flex items-center justify-between">
    <!-- 页码信息 -->
    <div class="text-sm text-muted-foreground">
      第 {{ currentPage }} 页，共 {{ totalPages }} 页
    </div>

    <!-- 分页控件 -->
    <div class="flex items-center space-x-2">
      <!-- 上一页 -->
      <Button
        variant="outline"
        size="sm"
        @click="handlePrevious"
        :disabled="currentPage <= 1"
      >
        <ChevronLeft class="h-4 w-4" />
        上一页
      </Button>

      <!-- 页码按钮 -->
      <div class="flex items-center space-x-1">
        <!-- 第一页 -->
        <Button
          v-if="showFirstPage"
          variant="ghost"
          size="sm"
          @click="handlePageChange(1)"
          :class="{ 'bg-primary text-primary-foreground': currentPage === 1 }"
          class="w-8 h-8 p-0"
        >
          1
        </Button>

        <!-- 前省略号 -->
        <span v-if="showStartEllipsis" class="px-2 text-muted-foreground">...</span>

        <!-- 中间页码 -->
        <Button
          v-for="page in visiblePages"
          :key="page"
          variant="ghost"
          size="sm"
          @click="handlePageChange(page)"
          :class="{ 'bg-primary text-primary-foreground': currentPage === page }"
          class="w-8 h-8 p-0"
        >
          {{ page }}
        </Button>

        <!-- 后省略号 -->
        <span v-if="showEndEllipsis" class="px-2 text-muted-foreground">...</span>

        <!-- 最后一页 -->
        <Button
          v-if="showLastPage"
          variant="ghost"
          size="sm"
          @click="handlePageChange(totalPages)"
          :class="{ 'bg-primary text-primary-foreground': currentPage === totalPages }"
          class="w-8 h-8 p-0"
        >
          {{ totalPages }}
        </Button>
      </div>

      <!-- 下一页 -->
      <Button
        variant="outline"
        size="sm"
        @click="handleNext"
        :disabled="currentPage >= totalPages"
      >
        下一页
        <ChevronRight class="h-4 w-4" />
      </Button>
    </div>

    <!-- 每页条数选择 -->
    <div class="flex items-center space-x-2">
      <span class="text-sm text-muted-foreground">每页</span>
      <Select :value="pageSize.toString()" @update:value="handlePageSizeChange">
        <SelectTrigger class="w-20 h-8">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="10">10</SelectItem>
          <SelectItem value="20">20</SelectItem>
          <SelectItem value="50">50</SelectItem>
          <SelectItem value="100">100</SelectItem>
        </SelectContent>
      </Select>
      <span class="text-sm text-muted-foreground">条</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'

// Props 定义
interface Props {
  currentPage: number
  totalPages: number
  pageSize: number
  maxVisiblePages?: number
}

const props = withDefaults(defineProps<Props>(), {
  maxVisiblePages: 5
})

// Emits 定义
interface Emits {
  pageChange: [page: number]
  pageSizeChange: [pageSize: number]
}

const emit = defineEmits<Emits>()

// 计算可见页码
const visiblePages = computed(() => {
  const { currentPage, totalPages, maxVisiblePages } = props
  const pages: number[] = []
  
  if (totalPages <= maxVisiblePages) {
    // 总页数不超过最大显示页数，显示所有页码
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i)
    }
  } else {
    // 计算显示范围
    const half = Math.floor(maxVisiblePages / 2)
    let start = Math.max(1, currentPage - half)
    let end = Math.min(totalPages, start + maxVisiblePages - 1)
    
    // 调整起始位置
    if (end - start < maxVisiblePages - 1) {
      start = Math.max(1, end - maxVisiblePages + 1)
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i)
    }
  }
  
  return pages
})

// 计算是否显示省略号和首末页
const showFirstPage = computed(() => {
  return props.totalPages > props.maxVisiblePages && visiblePages.value[0] > 1
})

const showLastPage = computed(() => {
  return props.totalPages > props.maxVisiblePages && 
         visiblePages.value[visiblePages.value.length - 1] < props.totalPages
})

const showStartEllipsis = computed(() => {
  return showFirstPage.value && visiblePages.value[0] > 2
})

const showEndEllipsis = computed(() => {
  return showLastPage.value && 
         visiblePages.value[visiblePages.value.length - 1] < props.totalPages - 1
})

// 事件处理
const handlePageChange = (page: number) => {
  if (page !== props.currentPage && page >= 1 && page <= props.totalPages) {
    emit('pageChange', page)
  }
}

const handlePrevious = () => {
  if (props.currentPage > 1) {
    handlePageChange(props.currentPage - 1)
  }
}

const handleNext = () => {
  if (props.currentPage < props.totalPages) {
    handlePageChange(props.currentPage + 1)
  }
}

const handlePageSizeChange = (value: string) => {
  const newPageSize = parseInt(value, 10)
  if (newPageSize !== props.pageSize) {
    emit('pageSizeChange', newPageSize)
  }
}
</script>

<style scoped>
/* 按钮激活状态 */
.bg-primary {
  background-color: hsl(var(--primary));
}

.text-primary-foreground {
  color: hsl(var(--primary-foreground));
}

/* 按钮悬停效果 */
.button-hover {
  transition: all 0.2s ease-in-out;
}

.button-hover:hover {
  background-color: hsl(var(--accent));
}

/* 禁用状态样式 */
button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 响应式调整 */
@media (max-width: 640px) {
  .flex.items-center.justify-between {
    flex-direction: column;
    gap: 0.5rem;
    align-items: center;
  }
  
  .flex.items-center.space-x-2:last-child {
    order: -1;
  }
}
</style>