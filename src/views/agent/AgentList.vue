<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <h1 class="text-2xl font-semibold">代理管理</h1>
      <Button @click="openCreateDialog">
        <PlusIcon class="h-4 w-4 mr-2" />
        添加代理
      </Button>
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
              v-model="filters.keyword" 
              placeholder="搜索名称/电话/微信" 
              class="w-full" 
            />
            <Button variant="outline" @click="searchAgents">
              <SearchIcon class="h-4 w-4" />
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
        <Button size="sm" variant="outline" @click="resetFilters">
          <RefreshCcwIcon class="h-3 w-3 mr-1" />
          重置筛选
        </Button>
      </div>
    </div>

    <!-- 表格区域 -->
    <DataTable
      :columns="columns"
      :data="agents"
      :loading="loading"
      :pagination="true"
      :total-items="totalItems"
      :page-size="pagination.pageSize"
      :current-page="pagination.page"
      @page-change="handlePageChange"
      empty-text="暂无代理数据"
    >
      <template #toolbar>
        <Button variant="outline" size="sm" @click="exportData">
          <DownloadIcon class="h-4 w-4 mr-1" />
          导出数据
        </Button>
      </template>
      <template #actions>
        <Button 
          variant="destructive" 
          size="sm" 
          :disabled="selectedAgents.length === 0"
          @click="confirmBatchDelete"
        >
          <TrashIcon class="h-4 w-4 mr-1" />
          批量删除
        </Button>
      </template>
    </DataTable>

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
            {{ deleteMode === 'single' ? '确定要删除该代理吗？此操作不可撤销。' : `确定要删除选中的 ${selectedAgents.length} 个代理吗？此操作不可撤销。` }}
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
import { ref, onMounted, computed } from 'vue'
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

// 代理数据
const agents = ref<Agent[]>([])
const totalItems = ref(0)
const loading = ref(false)
const selectedAgents = ref<string[]>([])

// 分页配置
const pagination = ref({
  page: 1,
  pageSize: 10,
})

// 筛选条件
const filters = ref({
  keyword: '',
  status: '',
  category: '',
  level: '',
  isAdded: false,
  isPosting: false,
  isIntercept: false,
  isAttracting: false,
  isInGroup: false,
})

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

// 表格列定义
const columns = [
  {
    id: 'select',
    header: '选择',
    cell: ({ row }) => {
      return {
        template: `
          <input 
            type="checkbox" 
            :checked="selectedAgents.includes(row.id)" 
            @change="toggleSelection(row.id)"
            class="rounded border-gray-300"
          />
        `,
        setup() {
          const toggleSelection = (id) => {
            const index = selectedAgents.value.indexOf(id)
            if (index === -1) {
              selectedAgents.value.push(id)
            } else {
              selectedAgents.value.splice(index, 1)
            }
          }
          return { selectedAgents, toggleSelection, row }
        }
      }
    }
  },
  {
    accessorKey: 'name',
    header: '代理姓名',
    cell: ({ row }) => {
      return {
        template: `
          <div>
            <div class="font-medium">{{ row.name }}</div>
            <div class="text-xs text-gray-500">{{ row.phone }}</div>
          </div>
        `,
        setup() {
          return { row }
        }
      }
    }
  },
  {
    accessorKey: 'wechatName',
    header: '微信名称'
  },
  {
    accessorKey: 'addedDate',
    header: '添加日期',
    cell: ({ row }) => {
      return {
        template: `<div>{{ formatDate(row.addedDate) }}</div>`,
        setup() {
          const formatDate = (dateString) => {
            if (!dateString) return '未知'
            try {
              const date = new Date(dateString)
              return date.toLocaleDateString()
            } catch (e) {
              return dateString
            }
          }
          return { row, formatDate }
        }
      }
    }
  },
  {
    accessorKey: 'redBookAccount',
    header: '小红书账号'
  },
  {
    accessorKey: 'category',
    header: '代理属性',
    cell: ({ row }) => {
      return {
        template: `
          <span :class="getBgColor(row.category)" class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium">
            {{ getLabel(row.category) }}
          </span>
        `,
        setup() {
          const getLabel = (category) => {
            switch (category) {
              case AgentCategory.A: return 'A类'
              case AgentCategory.B: return 'B类'
              case AgentCategory.C: return 'C类'
              case AgentCategory.D: return 'D类'
              default: return '未分类'
            }
          }
          
          const getBgColor = (category) => {
            switch (category) {
              case AgentCategory.A: return 'bg-green-100 text-green-800'
              case AgentCategory.B: return 'bg-blue-100 text-blue-800'
              case AgentCategory.C: return 'bg-yellow-100 text-yellow-800'
              case AgentCategory.D: return 'bg-red-100 text-red-800'
              default: return 'bg-gray-100 text-gray-800'
            }
          }
          
          return { row, getLabel, getBgColor }
        }
      }
    }
  },
  {
    accessorKey: 'level',
    header: '代理级别',
    cell: ({ row }) => {
      return {
        template: `
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            {{ row.level }}
          </span>
        `,
        setup() {
          return { row }
        }
      }
    }
  },
  {
    accessorKey: 'status',
    header: '状态',
    cell: ({ row }) => {
      return {
        template: `
          <span :class="getBgColor(row.status)" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">
            {{ getLabel(row.status) }}
          </span>
        `,
        setup() {
          const getLabel = (status) => {
            switch (status) {
              case AgentStatus.ACTIVE: return '活跃'
              case AgentStatus.INACTIVE: return '非活跃'
              case AgentStatus.PENDING: return '待审核'
              case AgentStatus.BLOCKED: return '已封禁'
              default: return '未知'
            }
          }
          
          const getBgColor = (status) => {
            switch (status) {
              case AgentStatus.ACTIVE: return 'bg-green-100 text-green-800'
              case AgentStatus.INACTIVE: return 'bg-yellow-100 text-yellow-800'
              case AgentStatus.PENDING: return 'bg-blue-100 text-blue-800'
              case AgentStatus.BLOCKED: return 'bg-red-100 text-red-800'
              default: return 'bg-gray-100 text-gray-800'
            }
          }
          
          return { row, getLabel, getBgColor }
        }
      }
    }
  },
  {
    id: 'flags',
    header: '标记',
    cell: ({ row }) => {
      return {
        template: `
          <div class="flex space-x-1">
            <span v-if="row.isAdded" class="inline-flex items-center px-1.5 rounded-sm text-xs font-medium bg-green-100 text-green-800" title="已添加">
              添加
            </span>
            <span v-if="row.isPosting" class="inline-flex items-center px-1.5 rounded-sm text-xs font-medium bg-blue-100 text-blue-800" title="发帖">
              发帖
            </span>
            <span v-if="row.isIntercept" class="inline-flex items-center px-1.5 rounded-sm text-xs font-medium bg-purple-100 text-purple-800" title="截流">
              截流
            </span>
            <span v-if="row.isAttracting" class="inline-flex items-center px-1.5 rounded-sm text-xs font-medium bg-yellow-100 text-yellow-800" title="引流获客">
              引流
            </span>
            <span v-if="row.isInGroup" class="inline-flex items-center px-1.5 rounded-sm text-xs font-medium bg-pink-100 text-pink-800" title="进群">
              进群
            </span>
          </div>
        `,
        setup() {
          return { row }
        }
      }
    }
  },
  {
    id: 'actions',
    header: '操作',
    cell: ({ row }) => {
      return {
        template: `
          <div class="flex items-center space-x-2">
            <Button size="sm" variant="ghost" class="h-8 w-8 p-0" @click="onEdit(row.id)">
              <PencilIcon class="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" class="h-8 w-8 p-0" @click="onDelete(row.id)">
              <TrashIcon class="h-4 w-4" />
            </Button>
            <router-link :to="{ name: 'AgentDetail', params: { id: row.id } }">
              <Button size="sm" variant="ghost" class="h-8 w-8 p-0">
                <MoreHorizontalIcon class="h-4 w-4" />
              </Button>
            </router-link>
          </div>
        `,
        setup() {
          const onEdit = (id) => {
            editAgent(id)
          }
          
          const onDelete = (id) => {
            deleteAgent(id)
          }
          
          return { row, onEdit, onDelete, PencilIcon, TrashIcon, MoreHorizontalIcon, Button }
        }
      }
    }
  }
]

// 获取代理列表数据
const fetchAgents = async () => {
  loading.value = true
  try {
    const { page, pageSize } = pagination.value
    
    const queryParams = {
      page,
      pageSize,
      keyword: filters.value.keyword,
      status: filters.value.status || undefined,
      category: filters.value.category || undefined,
      level: filters.value.level || undefined,
      isAdded: filters.value.isAdded ? true : undefined,
      isPosting: filters.value.isPosting ? true : undefined,
      isIntercept: filters.value.isIntercept ? true : undefined,
      isAttracting: filters.value.isAttracting ? true : undefined,
      isInGroup: filters.value.isInGroup ? true : undefined,
    }
    
    const response = await agentApi.getAgentList(queryParams)
    agents.value = response.data
    totalItems.value = response.total
  } catch (error) {
    console.error('Failed to fetch agents:', error)
    // TODO: 显示错误提示
  } finally {
    loading.value = false
  }
}

// 切换筛选条件
const toggleFilter = (filterName: string) => {
  filters.value[filterName as keyof typeof filters.value] = !filters.value[filterName as keyof typeof filters.value]
  searchAgents()
}

// 重置筛选条件
const resetFilters = () => {
  filters.value = {
    keyword: '',
    status: '',
    category: '',
    level: '',
    isAdded: false,
    isPosting: false,
    isIntercept: false,
    isAttracting: false,
    isInGroup: false,
  }
  searchAgents()
}

// 搜索代理
const searchAgents = () => {
  pagination.value.page = 1
  fetchAgents()
}

// 处理分页变更
const handlePageChange = (page: number) => {
  pagination.value.page = page
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
      redBookAccount: agent.redBookAccount,
      referrer: agent.referrer,
      category: agent.category,
      level: agent.level,
      isAdded: agent.isAdded,
      isPosting: agent.isPosting,
      isIntercept: agent.isIntercept,
      isAttracting: agent.isAttracting,
      isInGroup: agent.isInGroup,
      notes: agent.notes,
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
    if (editMode.value && currentAgentId.value) {
      await agentApi.updateAgent(currentAgentId.value, agentForm.value)
    } else {
      await agentApi.createAgent(agentForm.value as any)
    }
    showAgentDialog.value = false
    fetchAgents()
  } catch (error) {
    console.error('Failed to save agent:', error)
    // TODO: 显示错误提示
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
      await agentApi.deleteAgent(currentAgentId.value)
    } else if (deleteMode.value === 'batch') {
      await agentApi.batchDeleteAgents(selectedAgents.value)
      selectedAgents.value = []
    }
    showDeleteDialog.value = false
    fetchAgents()
  } catch (error) {
    console.error('Failed to delete agent(s):', error)
    // TODO: 显示错误提示
  } finally {
    deleting.value = false
  }
}

// 导出数据
const exportData = async () => {
  try {
    const { keyword, status, category, level } = filters.value
    const blob = await agentApi.exportAgents({ keyword, status, category, level })
    
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

// 初始化
onMounted(() => {
  fetchAgents()
})
</script> 