<template>
  <div class="space-y-4">
    <!-- 搜索和操作区域 -->
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-2">
        <Input
          v-if="searchable"
          v-model="searchQuery"
          type="text"
          :placeholder="searchPlaceholder"
          class="w-64"
          @input="handleSearch"
        />
        <slot name="toolbar" />
      </div>
      <div class="flex items-center space-x-2">
        <slot name="actions" />
      </div>
    </div>

    <!-- 表格 -->
    <div class="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
            <TableHead v-for="header in headerGroup.headers" :key="header.id">
              <FlexRender
                v-if="!header.isPlaceholder"
                :render="header.column.columnDef.header"
                :props="header.getContext()"
              />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <template v-if="table.getRowModel().rows?.length">
            <TableRow
              v-for="row in table.getRowModel().rows"
              :key="row.id"
              :data-state="row.getIsSelected() && 'selected'"
              class="hover:bg-gray-50"
            >
              <TableCell v-for="cell in row.getVisibleCells()" :key="cell.id">
                <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
              </TableCell>
            </TableRow>
          </template>
          <template v-else>
            <TableRow>
              <TableCell
                :colspan="columns.length"
                class="h-24 text-center text-gray-500"
              >
                <div class="flex flex-col items-center justify-center">
                  <div class="text-lg font-medium">{{ emptyText }}</div>
                  <div v-if="searchQuery" class="text-sm text-gray-400 mt-1">
                    没有找到与 "{{ searchQuery }}" 相关的结果
                  </div>
                </div>
              </TableCell>
            </TableRow>
          </template>
        </TableBody>
      </Table>
    </div>

    <!-- 分页 -->
    <div v-if="pagination" class="flex items-center justify-between">
      <div class="text-sm text-gray-700">
        共 {{ totalItems }} 条记录
      </div>
      <div class="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          :disabled="currentPage === 1"
          @click="handlePageChange(currentPage - 1)"
        >
          上一页
        </Button>
        <div class="text-sm">
          第 {{ currentPage }} 页 / 共 {{ totalPages }} 页
        </div>
        <Button
          variant="outline"
          size="sm"
          :disabled="currentPage === totalPages"
          @click="handlePageChange(currentPage + 1)"
        >
          下一页
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" generic="T">
import { computed, ref, watch } from 'vue'
import {
  FlexRender,
  getCoreRowModel,
  useVueTable,
  type ColumnDef,
  type RowSelectionState,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
} from '@tanstack/vue-table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface DataTableProps {
  columns: ColumnDef<T>[]
  data: T[]
  loading?: boolean
  searchable?: boolean
  searchPlaceholder?: string
  emptyText?: string
  pagination?: boolean
  totalItems?: number
  pageSize?: number
  currentPage?: number
  onPageChange?: (page: number) => void
  onSearch?: (query: string) => void
  rowSelection?: RowSelectionState
  onRowSelectionChange?: (selection: RowSelectionState) => void
}

const props = withDefaults(defineProps<DataTableProps>(), {
  loading: false,
  searchable: true,
  searchPlaceholder: '搜索...',
  emptyText: '暂无数据',
  pagination: true,
  totalItems: 0,
  pageSize: 10,
  currentPage: 1,
})

const emit = defineEmits<{
  pageChange: [page: number]
  search: [query: string]
  rowSelectionChange: [selection: RowSelectionState]
}>()

const searchQuery = ref('')
const sorting = ref<SortingState>([])
const columnFilters = ref<ColumnFiltersState>([])
const columnVisibility = ref<VisibilityState>({})
const rowSelection = ref<RowSelectionState>({})

const table = useVueTable({
  get data() {
    return props.data
  },
  get columns() {
    return props.columns
  },
  state: {
    get sorting() {
      return sorting.value
    },
    get columnFilters() {
      return columnFilters.value
    },
    get columnVisibility() {
      return columnVisibility.value
    },
    get rowSelection() {
      return props.rowSelection || rowSelection.value
    },
  },
  enableRowSelection: true,
  onSortingChange: (updaterOrValue) => {
    sorting.value = typeof updaterOrValue === 'function' ? updaterOrValue(sorting.value) : updaterOrValue
  },
  onRowSelectionChange: (updaterOrValue) => {
    const newSelection = typeof updaterOrValue === 'function' ? updaterOrValue(rowSelection.value) : updaterOrValue
    if (props.onRowSelectionChange) {
      props.onRowSelectionChange(newSelection)
    } else {
      rowSelection.value = newSelection
    }
  },
  getCoreRowModel: getCoreRowModel(),
})

const totalPages = computed(() =>
  props.pagination ? Math.ceil(props.totalItems / props.pageSize) : 1
)

const handleSearch = () => {
  emit('search', searchQuery.value)
}

const handlePageChange = (page: number) => {
  emit('pageChange', page)
}

watch(
  () => props.currentPage,
  (newPage) => {
    if (newPage) {
      // 可以在这里添加页面变化的逻辑
    }
  }
)
</script>