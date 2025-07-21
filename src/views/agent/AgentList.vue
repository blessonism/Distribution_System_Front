<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <h1 class="text-2xl font-semibold">代理管理</h1>
      <Button v-if="hasCreatePermission" @click="openCreateDialog">
        <PlusIcon class="h-4 w-4 mr-2" />
        添加代理
      </Button>
    </div>

    <!-- 错误提示 -->
    <div v-if="showErrorAlert" class="bg-destructive/15 border border-destructive text-destructive px-4 py-3 rounded-md flex items-start">
      <span class="mr-2 mt-0.5">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide-alert-circle"><circle cx="12" cy="12" r="10"></circle><line x1="12" x2="12" y1="8" y2="12"></line><line x1="12" x2="12.01" y1="16" y2="16"></line></svg>
      </span>
      <div>
        <h4 class="font-medium">错误</h4>
        <p class="text-sm">{{ errorMessage }}</p>
      </div>
      <button @click="showErrorAlert = false" class="ml-auto">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide-x"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>
      </button>
    </div>

    <!-- 过滤和搜索区域 -->
    <div class="bg-white p-4 rounded-lg shadow space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <div>
          <label class="text-sm font-medium mb-1 block">代理状态</label>
          <select 
            v-model="filters.status" 
            class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">全部状态</option>
            <option v-for="status in agentStatusOptions" :key="status.value" :value="status.value">
              {{ status.label }}
            </option>
          </select>
        </div>
        <div>
          <label class="text-sm font-medium mb-1 block">代理属性</label>
          <select 
            v-model="filters.category" 
            class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">全部属性</option>
            <option v-for="category in agentCategoryOptions" :key="category.value" :value="category.value">
              {{ category.label }}
            </option>
          </select>
        </div>
        <div>
          <label class="text-sm font-medium mb-1 block">代理级别</label>
          <select 
            v-model="filters.level" 
            class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">全部级别</option>
            <option v-for="level in agentLevelOptions" :key="level.value" :value="level.value">
              {{ level.label }}
            </option>
          </select>
        </div>
        <div>
          <label class="text-sm font-medium mb-1 block">搜索代理</label>
          <div class="flex space-x-2">
            <Input 
              :value="filters.keyword" 
              placeholder="搜索名称/电话/微信" 
              class="w-full" 
              @input="handleSearchInput"
            />
            <Button variant="outline" @click="searchAgents" :disabled="isSearching">
              <SearchIcon :class="{ 'animate-spin': isSearching }" class="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      <div class="flex flex-wrap gap-2">
        <Button 
          size="sm" 
          variant="outline" 
          :class="{ 'bg-primary/10': filters.isAdded }"
          @click="toggleFilter('isAdded')"
        >
          <CheckIcon v-if="filters.isAdded" class="h-4 w-4 mr-1" />
          已添加
        </Button>
        <Button 
          size="sm" 
          variant="outline" 
          :class="{ 'bg-primary/10': filters.isPosting }"
          @click="toggleFilter('isPosting')"
        >
          <CheckIcon v-if="filters.isPosting" class="h-4 w-4 mr-1" />
          发帖
        </Button>
        <Button 
          size="sm" 
          variant="outline" 
          :class="{ 'bg-primary/10': filters.isIntercept }"
          @click="toggleFilter('isIntercept')"
        >
          <CheckIcon v-if="filters.isIntercept" class="h-4 w-4 mr-1" />
          截流
        </Button>
        <Button 
          size="sm" 
          variant="outline" 
          :class="{ 'bg-primary/10': filters.isAttracting }"
          @click="toggleFilter('isAttracting')"
        >
          <CheckIcon v-if="filters.isAttracting" class="h-4 w-4 mr-1" />
          引流获客
        </Button>
        <Button 
          size="sm" 
          variant="outline" 
          :class="{ 'bg-primary/10': filters.isInGroup }"
          @click="toggleFilter('isInGroup')"
        >
          <CheckIcon v-if="filters.isInGroup" class="h-4 w-4 mr-1" />
          进群
        </Button>
        <Button size="sm" variant="outline" @click="resetFiltersHandler">
          <RefreshCcwIcon class="h-3 w-3 mr-1" />
          重置筛选
        </Button>
      </div>
    </div>

    <!-- 表格区域 -->
    <div class="relative">
      <!-- 加载指示器 -->
      <div v-if="loading.list" class="absolute inset-0 bg-white/70 flex items-center justify-center z-10 rounded-lg">
        <div class="flex flex-col items-center">
          <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          <p class="mt-2 text-sm text-muted-foreground">加载中...</p>
        </div>
      </div>
      
    <DataTable
      :columns="columns"
        :data="agentList"
        :loading="loading.list"
      :pagination="true"
      :total-items="totalItems"
        :page-size="listState.pagination.pageSize"
        :current-page="listState.pagination.page"
      @page-change="handlePageChange"
      empty-text="暂无代理数据"
    >
      <template #toolbar>
          <Button v-if="hasExportPermission" variant="outline" size="sm" @click="exportData">
          <DownloadIcon class="h-4 w-4 mr-1" />
          导出数据
        </Button>
      </template>
      <template #actions>
        <Button 
            v-if="hasDeletePermission"
          variant="destructive" 
          size="sm" 
            :disabled="listState.selectedAgents.length === 0"
          @click="confirmBatchDelete"
        >
          <TrashIcon class="h-4 w-4 mr-1" />
          批量删除
        </Button>
      </template>
    </DataTable>
    </div>

    <!-- 创建/编辑代理对话框 -->
    <Dialog :open="showAgentDialog" @update:open="showAgentDialog = $event">
      <DialogContent class="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{{ editMode ? '编辑代理' : '添加代理' }}</DialogTitle>
          <DialogDescription>
            {{ editMode ? '更新代理信息' : '填写代理基本信息，创建新代理' }}
          </DialogDescription>
        </DialogHeader>
        <form @submit.prevent="handleSubmitAgent" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-2">
              <label class="text-sm font-medium">代理姓名</label>
              <Input v-model="agentForm.name" required />
            </div>
            <div class="space-y-2">
              <label class="text-sm font-medium">电话号码</label>
              <Input v-model="agentForm.phone" required />
            </div>
            <div class="space-y-2">
              <label class="text-sm font-medium">微信名称</label>
              <Input v-model="agentForm.wechatName" required />
            </div>
            <div class="space-y-2">
              <label class="text-sm font-medium">小红书IP</label>
              <Input v-model="agentForm.redBookAccount" />
            </div>
            <div class="space-y-2">
              <label class="text-sm font-medium">推荐人/推荐码</label>
              <Input v-model="agentForm.referrer" />
            </div>
            <div class="space-y-2">
              <label class="text-sm font-medium">代理属性</label>
              <select 
                v-model="agentForm.category" 
                class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">请选择</option>
                <option v-for="category in agentCategoryOptions" :key="category.value" :value="category.value">
                  {{ category.label }}
                </option>
              </select>
            </div>
            <div class="space-y-2">
              <label class="text-sm font-medium">代理级别</label>
              <select 
                v-model="agentForm.level" 
                class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">请选择</option>
                <option v-for="level in agentLevelOptions" :key="level.value" :value="level.value">
                  {{ level.label }}
                </option>
              </select>
            </div>
          </div>
          
          <div class="flex flex-wrap gap-4">
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" v-model="agentForm.isAdded" class="rounded border-gray-300" />
              <span class="text-sm">已添加</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" v-model="agentForm.isPosting" class="rounded border-gray-300" />
              <span class="text-sm">发帖</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" v-model="agentForm.isIntercept" class="rounded border-gray-300" />
              <span class="text-sm">截流</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" v-model="agentForm.isAttracting" class="rounded border-gray-300" />
              <span class="text-sm">引流获客</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" v-model="agentForm.isInGroup" class="rounded border-gray-300" />
              <span class="text-sm">进群</span>
            </label>
          </div>
          
          <div class="space-y-2">
            <label class="text-sm font-medium">备注</label>
            <textarea 
              v-model="agentForm.notes" 
              class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px]"
            ></textarea>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" @click="showAgentDialog = false">取消</Button>
            <Button type="submit" :loading="submitting">{{ editMode ? '更新' : '创建' }}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <!-- 确认删除对话框 -->
    <Dialog :open="showDeleteDialog" @update:open="showDeleteDialog = $event">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>确认删除</DialogTitle>
          <DialogDescription>
            {{ deleteMode === 'single' ? '确定要删除该代理吗？此操作不可撤销。' : `确定要删除选中的 ${listState.selectedAgents.length} 个代理吗？此操作不可撤销。` }}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" @click="showDeleteDialog = false">取消</Button>
          <Button 
            type="button" 
            variant="destructive" 
            :loading="deleting"
            @click="confirmDelete"
          >
            删除
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, h } from 'vue'
import { 
  PlusIcon, CheckIcon, SearchIcon, TrashIcon, 
  PencilIcon, MoreHorizontalIcon, DownloadIcon, RefreshCcwIcon
} from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import DataTable from '@/components/business/DataTable.vue'
import { 
  Dialog, DialogContent, DialogDescription, 
  DialogFooter, DialogHeader, DialogTitle
} from '@/components/ui/dialog'
import type { ColumnDef } from '@tanstack/vue-table'
import { agentApi } from '@/api/agent'
import { AgentStatus, AgentCategory, AgentLevel, type Agent } from '@/types/agent'
import { useAgentStore } from '@/store/agent'
import { useUserStore } from '@/store/user'
import { useListState } from '@/composables/useListState'
import { useDebounce } from '@/composables/useDebounce'
import { storeToRefs } from 'pinia'

// 使用Pinia Store
const agentStore = useAgentStore()
const userStore = useUserStore()
const { agentList, totalItems, listState, loading } = storeToRefs(agentStore)

// 使用列表状态管理
const { syncStateToURL, navigateToDetail, applyFilters, resetFilters, updatePagination } = useListState()

// 状态选项
const agentStatusOptions = [
  { value: AgentStatus.ACTIVE, label: '活跃' },
  { value: AgentStatus.INACTIVE, label: '非活跃' },
  { value: AgentStatus.PENDING, label: '待审核' },
  { value: AgentStatus.BLOCKED, label: '已封禁' },
]

// 属性选项
const agentCategoryOptions = [
  { value: AgentCategory.A, label: 'A类(执行力强)' },
  { value: AgentCategory.B, label: 'B类(被动催促)' },
  { value: AgentCategory.C, label: 'C类(引导从事)' },
  { value: AgentCategory.D, label: 'D类(沉默代理)' },
]

// 级别选项
const agentLevelOptions = [
  { value: AgentLevel.SV1, label: 'SV1伙伴' },
  { value: AgentLevel.SV2, label: 'SV2伙伴' },
  { value: AgentLevel.SV3, label: 'SV3伙伴' },
  { value: AgentLevel.SV4, label: 'SV4伙伴' },
  { value: AgentLevel.SV5, label: 'SV5伙伴' },
  { value: AgentLevel.SV6, label: 'SV6伙伴' },
]

// 表单相关
const showAgentDialog = ref(false)
const editMode = ref(false)
const currentAgentId = ref<string | null>(null)
const agentForm = ref({
  name: '',
  phone: '',
  wechatName: '',
  redBookAccount: '',
  referrer: '',
  category: '',
  level: '',
  isAdded: false,
  isPosting: false,
  isIntercept: false,
  isAttracting: false,
  isInGroup: false,
  notes: '',
})
const submitting = ref(false)

// 删除相关
const showDeleteDialog = ref(false)
const deleteMode = ref<'single' | 'batch'>('single')
const deleting = ref(false)

// 权限相关
const hasCreatePermission = computed(() => {
  const userRole = userStore.userRole
  return ['super_admin', 'director', 'leader'].includes(userRole || '')
})

const hasEditPermission = computed(() => {
  const userRole = userStore.userRole
  return ['super_admin', 'director', 'leader'].includes(userRole || '')
})

const hasDeletePermission = computed(() => {
  const userRole = userStore.userRole
  return ['super_admin', 'director'].includes(userRole || '')
})

const hasExportPermission = computed(() => {
  const userRole = userStore.userRole
  return ['super_admin', 'director', 'leader'].includes(userRole || '')
})

// 错误处理相关
const errorMessage = ref('')
const showErrorAlert = ref(false)

// 处理API错误的函数
const handleApiError = (error: any, defaultMessage: string) => {
  console.error(defaultMessage, error)
  
  // 尝试从错误响应中获取更详细的信息
  if (error.response && error.response.data && error.response.data.message) {
    errorMessage.value = error.response.data.message
  } else if (error.message) {
    errorMessage.value = error.message
  } else {
    errorMessage.value = defaultMessage
  }
  
  showErrorAlert.value = true
  
  // 5秒后自动关闭错误提示
  setTimeout(() => {
    showErrorAlert.value = false
  }, 5000)
}

// 获取代理列表数据
const fetchAgents = async () => {
  try {
    await agentStore.fetchAgentList()
    // 同步状态到URL
    syncStateToURL()
    // 加载成功后清除任何错误信息
    showErrorAlert.value = false
  } catch (error) {
    handleApiError(error, '加载代理列表失败')
  }
}

// 筛选条件
const filters = computed(() => listState.value.filters)

// 切换筛选条件
const toggleFilter = (filterName: string) => {
  if (filterName === 'isAdded' || filterName === 'isPosting' || 
      filterName === 'isIntercept' || filterName === 'isAttracting' || 
      filterName === 'isInGroup') {
    const key = filterName as 'isAdded' | 'isPosting' | 'isIntercept' | 'isAttracting' | 'isInGroup';
    agentStore.updateFilters({ [key]: !filters.value[key] });
  }
  searchAgents()
}

// 重置筛选条件
const resetFiltersHandler = () => {
  resetFilters()
  fetchAgents()
}

// 搜索代理
const searchAgents = () => {
  fetchAgents()
}

// 搜索代理 - 使用防抖
const { debouncedFn: debouncedSearch, isDebouncing: isSearching } = useDebounce(searchAgents, 500)

// 搜索输入框变化处理
const handleSearchInput = (e: Event) => {
  const target = e.target as HTMLInputElement
  agentStore.updateFilters({ keyword: target.value })
  debouncedSearch()
}

// 处理分页变更
const handlePageChange = (page: number) => {
  updatePagination(page)
  fetchAgents()
}

// 打开创建代理对话框
const openCreateDialog = () => {
  editMode.value = false
  resetAgentForm()
  showAgentDialog.value = true
}

// 编辑代理
const editAgent = async (agentId: string) => {
  try {
    const agent = await agentApi.getAgent(agentId)
    agentForm.value = {
      name: agent.name,
      phone: agent.phone,
      wechatName: agent.wechatName,
      redBookAccount: agent.redBookAccount || '',
      referrer: agent.referrer || '',
      category: agent.category,
      level: agent.level,
      isAdded: agent.isAdded,
      isPosting: agent.isPosting,
      isIntercept: agent.isIntercept,
      isAttracting: agent.isAttracting,
      isInGroup: agent.isInGroup,
      notes: agent.notes || '',
    }
    currentAgentId.value = agentId
    editMode.value = true
    showAgentDialog.value = true
  } catch (error) {
    console.error('Failed to get agent details:', error)
    // TODO: 显示错误提示
  }
}

// 重置表单
const resetAgentForm = () => {
  agentForm.value = {
    name: '',
    phone: '',
    wechatName: '',
    redBookAccount: '',
    referrer: '',
    category: '',
    level: '',
    isAdded: false,
    isPosting: false,
    isIntercept: false,
    isAttracting: false,
    isInGroup: false,
    notes: '',
  }
  currentAgentId.value = null
}

// 提交代理表单
const handleSubmitAgent = async () => {
  submitting.value = true
  try {
    const formData = {
      ...agentForm.value,
      category: agentForm.value.category as AgentCategory,
      level: agentForm.value.level as AgentLevel
    };
    
    if (editMode.value && currentAgentId.value) {
      await agentStore.updateAgent(currentAgentId.value, formData as any)
    } else {
      await agentStore.createAgent(formData as any)
    }
    showAgentDialog.value = false
    fetchAgents()
  } catch (error) {
    handleApiError(error, editMode.value ? '更新代理失败' : '创建代理失败')
  } finally {
    submitting.value = false
  }
}

// 删除单个代理
const deleteAgent = (agentId: string) => {
  currentAgentId.value = agentId
  deleteMode.value = 'single'
  showDeleteDialog.value = true
}

// 批量删除代理
const confirmBatchDelete = () => {
  deleteMode.value = 'batch'
  showDeleteDialog.value = true
}

// 确认删除
const confirmDelete = async () => {
  deleting.value = true
  try {
    if (deleteMode.value === 'single' && currentAgentId.value) {
      await agentStore.deleteAgent(currentAgentId.value)
    } else if (deleteMode.value === 'batch') {
      await agentStore.batchDeleteAgents(listState.value.selectedAgents)
    }
    showDeleteDialog.value = false
    fetchAgents()
  } catch (error) {
    handleApiError(error, '删除代理失败')
  } finally {
    deleting.value = false
  }
}

// 导出数据
const exportData = async () => {
  try {
    const exportParams = {
      keyword: filters.value.keyword,
      status: filters.value.status ? filters.value.status as AgentStatus : undefined,
      category: filters.value.category ? filters.value.category as AgentCategory : undefined,
      level: filters.value.level ? filters.value.level as AgentLevel : undefined
    };
    
    const blob = await agentApi.exportAgents(exportParams)
    
    // 创建临时下载链接
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `agents-export-${new Date().toISOString().slice(0, 10)}.xlsx`
    link.click()
    
    // 释放URL对象
    setTimeout(() => {
      window.URL.revokeObjectURL(url)
    }, 100)
  } catch (error) {
    console.error('Failed to export agents:', error)
    // TODO: 显示错误提示
  }
}

// 查看代理详情
const viewAgentDetail = (agentId: string) => {
  navigateToDetail(agentId)
}

// 处理代理选择
const toggleSelectAgent = (id: string) => {
  agentStore.toggleSelectAgent(id)
}

// 处理全选/取消全选
const toggleSelectAll = (checked: boolean) => {
  if (checked) {
    agentStore.selectAllAgents()
  } else {
    agentStore.deselectCurrentPageAgents()
  }
}

// 判断代理是否被选中
const isAgentSelected = (id: string) => {
  return listState.value.selectedAgents.includes(id)
}

// 判断是否全选
const isAllSelected = computed(() => {
  return agentList.value.length > 0 && 
         agentList.value.every(agent => listState.value.selectedAgents.includes(agent.id))
})

// 判断是否部分选中
const isIndeterminate = computed(() => {
  return listState.value.selectedAgents.length > 0 && 
         !isAllSelected.value
})

// 根据用户角色过滤操作列
const getAvailableActions = (agentId: string) => {
  const actions = []
  
  // 查看详情按钮对所有角色可见
  actions.push({
    icon: MoreHorizontalIcon,
    tooltip: '查看详情',
    onClick: () => viewAgentDetail(agentId),
    show: true
  })
  
  // 编辑按钮根据权限显示
  actions.push({
    icon: PencilIcon,
    tooltip: '编辑代理',
    onClick: () => editAgent(agentId),
    show: hasEditPermission.value
  })
  
  // 删除按钮根据权限显示
  actions.push({
    icon: TrashIcon,
    tooltip: '删除代理',
    onClick: () => deleteAgent(agentId),
    show: hasDeletePermission.value
  })
  
  return actions.filter(action => action.show)
}

// 表格列定义
const columns = [
  {
    id: 'select',
    header: () => {
      return h('div', { class: 'flex items-center justify-center' }, [
        h('input', {
          type: 'checkbox',
          checked: isAllSelected.value,
          indeterminate: isIndeterminate.value,
          class: 'rounded border-gray-300',
          onClick: (e: Event) => {
            e.stopPropagation()
          },
          onChange: (e: Event) => {
            // 获取事件目标元素
            const target = e.target as HTMLInputElement
            toggleSelectAll(target.checked)
          }
        })
      ])
    },
    cell: ({ row }: { row: any }) => {
      // 兼容新旧两种访问方式
      const agentId = row.id || (row.original && row.original.id)
      if (!agentId) {
        console.error('无法获取代理ID:', row)
        return h('div', {}, '数据错误')
      }
      
      return h('div', { class: 'flex items-center justify-center' }, [
        h('input', {
          type: 'checkbox',
          // 使用计算属性检查当前行是否被选中
          checked: isAgentSelected(agentId),
          class: 'rounded border-gray-300',
          onClick: (e: Event) => {
            e.stopPropagation() // 阻止事件冒泡
          },
          onChange: (e: Event) => {
            toggleSelectAgent(agentId)
          }
        })
      ])
    }
  },
  {
    accessorKey: 'name',
    header: '代理姓名',
    cell: ({ row }: { row: any }) => {
      return h('div', {}, [
        h('div', { class: 'font-medium' }, row.name),
        h('div', { class: 'text-xs text-gray-500' }, row.phone)
      ])
    }
  },
  {
    accessorKey: 'wechatName',
    header: '微信名称',
    cell: ({ row }: { row: any }) => h('div', {}, row.wechatName || '-')
  },
  {
    accessorKey: 'addedDate',
    header: '添加日期',
    cell: ({ row }: { row: any }) => {
      const formatDate = (dateString: string) => {
        if (!dateString) return '未知'
        try {
          const date = new Date(dateString)
          return date.toLocaleDateString()
        } catch (e) {
          return dateString
        }
      }
      return h('div', {}, formatDate(row.addedDate))
    }
  },
  {
    accessorKey: 'redBookAccount',
    header: '小红书账号',
    cell: ({ row }: { row: any }) => h('div', {}, row.redBookAccount || '-')
  },
  {
    accessorKey: 'category',
    header: '代理属性',
    cell: ({ row }: { row: any }) => {
      const getLabel = (category: string) => {
        switch (category) {
          case AgentCategory.A: return 'A类'
          case AgentCategory.B: return 'B类'
          case AgentCategory.C: return 'C类'
          case AgentCategory.D: return 'D类'
          default: return '未分类'
        }
      }
      
      const getBgColor = (category: string) => {
        switch (category) {
          case AgentCategory.A: return 'bg-green-100 text-green-800'
          case AgentCategory.B: return 'bg-blue-100 text-blue-800'
          case AgentCategory.C: return 'bg-yellow-100 text-yellow-800'
          case AgentCategory.D: return 'bg-red-100 text-red-800'
          default: return 'bg-gray-100 text-gray-800'
        }
      }
      
      return h('span', { 
        class: `inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getBgColor(row.category)}` 
      }, getLabel(row.category))
    }
  },
  {
    accessorKey: 'level',
    header: '代理级别',
    cell: ({ row }: { row: any }) => {
      return h('span', {
        class: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800'
      }, row.level)
    }
  },
  {
    accessorKey: 'status',
    header: '状态',
    cell: ({ row }: { row: any }) => {
      const getLabel = (status: string) => {
        switch (status) {
          case AgentStatus.ACTIVE: return '活跃'
          case AgentStatus.INACTIVE: return '非活跃'
          case AgentStatus.PENDING: return '待审核'
          case AgentStatus.BLOCKED: return '已封禁'
          default: return '未知'
        }
      }
      
      const getBgColor = (status: string) => {
        switch (status) {
          case AgentStatus.ACTIVE: return 'bg-green-100 text-green-800'
          case AgentStatus.INACTIVE: return 'bg-yellow-100 text-yellow-800'
          case AgentStatus.PENDING: return 'bg-blue-100 text-blue-800'
          case AgentStatus.BLOCKED: return 'bg-red-100 text-red-800'
          default: return 'bg-gray-100 text-gray-800'
        }
      }
      
      return h('span', { 
        class: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getBgColor(row.status)}` 
      }, getLabel(row.status))
    }
  },
  {
    id: 'flags',
    header: '标记',
    cell: ({ row }: { row: any }) => {
      // 创建各种标记
      const flags = []
      
      if (row.isAdded) {
        flags.push(h('span', {
          class: 'inline-flex items-center px-1.5 rounded-sm text-xs font-medium bg-green-100 text-green-800',
          title: '已添加'
        }, '添加'))
      }
      
      if (row.isPosting) {
        flags.push(h('span', {
          class: 'inline-flex items-center px-1.5 rounded-sm text-xs font-medium bg-blue-100 text-blue-800',
          title: '发帖'
        }, '发帖'))
      }
      
      if (row.isIntercept) {
        flags.push(h('span', {
          class: 'inline-flex items-center px-1.5 rounded-sm text-xs font-medium bg-purple-100 text-purple-800',
          title: '截流'
        }, '截流'))
      }
      
      if (row.isAttracting) {
        flags.push(h('span', {
          class: 'inline-flex items-center px-1.5 rounded-sm text-xs font-medium bg-yellow-100 text-yellow-800',
          title: '引流获客'
        }, '引流'))
      }
      
      if (row.isInGroup) {
        flags.push(h('span', {
          class: 'inline-flex items-center px-1.5 rounded-sm text-xs font-medium bg-pink-100 text-pink-800',
          title: '进群'
        }, '进群'))
      }
      
      return h('div', { class: 'flex space-x-1' }, flags)
    }
  },
  {
    id: 'actions',
    header: '操作',
    cell: ({ row }: { row: any }) => {
      const agentId = row.id
      const availableActions = getAvailableActions(agentId)
      
      return h('div', { class: 'flex items-center space-x-2' }, 
        availableActions.map(action => 
        h(Button, {
          size: 'sm',
          variant: 'ghost',
          class: 'h-8 w-8 p-0',
            onClick: (e: Event) => {
              e.stopPropagation()
              action.onClick()
            },
            title: action.tooltip
          }, () => h(action.icon, { class: 'h-4 w-4' }))
        )
      )
    }
  }
]

// 初始化
onMounted(() => {
  fetchAgents()
})
</script> 