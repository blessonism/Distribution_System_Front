<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <h1 class="text-2xl font-semibold">客资管理</h1>
      <div class="flex space-x-2">
        <Button variant="outline" @click="$router.push('/lead/audit')">
          <CheckCircleIcon class="h-4 w-4 mr-2" />
          客资审核
        </Button>
        <Button @click="showAddDialog = true">
          <PlusIcon class="h-4 w-4 mr-2" />
          新增客资
        </Button>
      </div>
    </div>

    <!-- 筛选面板 -->
    <div class="bg-white p-4 rounded-lg shadow space-y-4 mobile-filters">
      <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mobile-filter-row">
        <!-- 客户姓名搜索 -->
        <div>
          <Label class="text-sm font-medium mb-1 block">客户姓名</Label>
          <div class="flex space-x-2">
            <Input 
              v-model="filters.name" 
              placeholder="搜索客户姓名..." 
              class="w-full" 
              @keyup.enter="handleSearch"
            />
            <Button variant="outline" @click="handleSearch">
              <SearchIcon class="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <!-- 状态筛选 -->
        <div>
          <Label class="text-sm font-medium mb-1 block">状态</Label>
          <Select 
            v-model="filters.status" 
            class="w-full"
          >
            <SelectTrigger>
              <SelectValue placeholder="选择状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="PENDING">待处理</SelectItem>
              <SelectItem value="FOLLOWING">跟进中</SelectItem>
              <SelectItem value="CONVERTED">已转化</SelectItem>
              <SelectItem value="INVALID">无效</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <!-- 来源筛选 -->
        <div>
          <Label class="text-sm font-medium mb-1 block">来源</Label>
          <Select 
            v-model="filters.source" 
            class="w-full"
          >
            <SelectTrigger>
              <SelectValue placeholder="选择来源" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部来源</SelectItem>
              <SelectItem value="搜索引擎">搜索引擎</SelectItem>
              <SelectItem value="客户推荐">客户推荐</SelectItem>
              <SelectItem value="广告投放">广告投放</SelectItem>
              <SelectItem value="社交媒体-小红书">社交媒体-小红书</SelectItem>
              <SelectItem value="线下活动">线下活动</SelectItem>
              <SelectItem value="合作渠道">合作渠道</SelectItem>
              <SelectItem value="官网咨询">官网咨询</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <!-- 归属销售筛选 -->
        <div>
          <Label class="text-sm font-medium mb-1 block">归属销售</Label>
          <Select
            v-model="filters.salespersonId"
            class="w-full"
          >
            <SelectTrigger>
              <SelectValue placeholder="选择销售" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部销售</SelectItem>
              <SelectItem v-for="sales in salesList" :key="sales.id" :value="sales.id">
                {{ sales.name }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- 审核状态筛选 -->
        <div>
          <Label class="text-sm font-medium mb-1 block">审核状态</Label>
          <Select
            v-model="filters.auditStatus"
            class="w-full"
          >
            <SelectTrigger>
              <SelectValue placeholder="选择审核状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="PENDING_AUDIT">待审核</SelectItem>
              <SelectItem value="APPROVED">已通过</SelectItem>
              <SelectItem value="REJECTED">已驳回</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div class="flex space-x-2">
        <Button size="sm" variant="outline" @click="handleSearch">
          <SearchIcon class="h-4 w-4 mr-1" />
          搜索
        </Button>
        <Button size="sm" variant="outline" @click="handleReset">
          <RefreshCcwIcon class="h-3 w-3 mr-1" />
          重置筛选
        </Button>
      </div>
    </div>

    <!-- 数据表格 -->
    <div class="mobile-table-container">
      <DataTable
        :columns="columns"
        :data="leads"
        :loading="loading"
        :pagination="true"
        :total-items="total"
        class="mobile-table"
      :page-size="pagination.pageSize"
      :current-page="pagination.page"
      @page-change="handlePageChange"
      empty-text="暂无客资数据"
    >
      <template #toolbar>
        <Button variant="outline" size="sm" @click="exportData" v-if="leads.length > 0">
          <DownloadIcon class="h-4 w-4 mr-1" />
          导出数据
        </Button>
      </template>
      <template #actions>
        <Button 
          variant="destructive" 
          size="sm" 
          :disabled="selectedLeads.length === 0"
          @click="confirmBatchDelete"
        >
          <TrashIcon class="h-4 w-4 mr-1" />
          批量删除
        </Button>
      </template>
      </DataTable>
    </div>
    
    <!-- 新增客资弹窗 -->
    <Dialog :open="showAddDialog" @update:open="showAddDialog = $event">
      <DialogContent class="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>新增客资</DialogTitle>
          <DialogDescription>
            请填写客户的基本信息，带 * 的字段为必填项。
          </DialogDescription>
        </DialogHeader>

        <LeadForm
          mode="create"
          :loading="addLoading"
          @submit="handleAddLead"
          @cancel="showAddDialog = false"
        />
      </DialogContent>
    </Dialog>
    
    <!-- 客资详情/编辑弹窗 -->
    <Dialog :open="showEditDialog" @update:open="showEditDialog = $event">
      <DialogContent class="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>客资详情</DialogTitle>
          <DialogDescription>
            查看和编辑客资信息。
          </DialogDescription>
        </DialogHeader>
        <form @submit.prevent="handleUpdateLead">
          <div class="grid gap-4 py-4">
            <div class="grid grid-cols-4 items-center gap-4">
              <Label class="text-right" for="edit-name">客户姓名</Label>
              <Input
                id="edit-name"
                v-model="currentLead.name"
                class="col-span-3"
                required
              />
            </div>
            <div class="grid grid-cols-4 items-center gap-4">
              <Label class="text-right" for="edit-phone">联系电话</Label>
              <Input
                id="edit-phone"
                v-model="currentLead.phone"
                class="col-span-3"
                required
              />
            </div>
            <div class="grid grid-cols-4 items-center gap-4">
              <Label class="text-right" for="edit-status">状态</Label>
              <Select v-model="currentLead.status" class="col-span-3">
                <SelectTrigger>
                  <SelectValue placeholder="选择状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">待处理</SelectItem>
                  <SelectItem value="FOLLOWING">跟进中</SelectItem>
                  <SelectItem value="CONVERTED">已转化</SelectItem>
                  <SelectItem value="INVALID">无效</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="grid grid-cols-4 items-center gap-4">
              <Label class="text-right" for="edit-source">来源</Label>
              <Select v-model="currentLead.source" class="col-span-3">
                <SelectTrigger>
                  <SelectValue placeholder="选择来源" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="搜索引擎">搜索引擎</SelectItem>
                  <SelectItem value="客户推荐">客户推荐</SelectItem>
                  <SelectItem value="广告投放">广告投放</SelectItem>
                  <SelectItem value="社交媒体-小红书">社交媒体-小红书</SelectItem>
                  <SelectItem value="线下活动">线下活动</SelectItem>
                  <SelectItem value="合作渠道">合作渠道</SelectItem>
                  <SelectItem value="官网咨询">官网咨询</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="grid grid-cols-4 items-center gap-4">
              <Label class="text-right" for="edit-salesperson">归属销售</Label>
              <Select v-model="currentLead.salespersonId" class="col-span-3">
                <SelectTrigger>
                  <SelectValue placeholder="选择销售" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="sales in salesList" :key="sales.id" :value="sales.id">
                    {{ sales.name }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" @click="showEditDialog = false">取消</Button>
            <Button type="submit">保存</Button>
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
            {{ deleteMode === 'single' ? '确定要删除该客资吗？此操作不可撤销。' : `确定要删除选中的 ${selectedLeads.length} 个客资吗？此操作不可撤销。` }}
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
import { ref, onMounted, reactive, h } from 'vue'
import {
  PlusIcon, CheckIcon, SearchIcon, TrashIcon,
  PencilIcon, MoreHorizontalIcon, DownloadIcon, RefreshCcwIcon, CheckCircleIcon
} from 'lucide-vue-next'
import DataTable from '@/components/business/DataTable.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  Dialog, DialogContent, DialogDescription, 
  DialogFooter, DialogHeader, DialogTitle
} from '@/components/ui/dialog'
import { 
  Select, SelectContent, SelectItem, 
  SelectTrigger, SelectValue 
} from '@/components/ui/select'
import { getLeads, createLead, updateLead } from '@/api/lead'
import type { Lead, LeadStatus, CreateLeadRequest } from '@/types/lead'
import LeadForm from './components/LeadForm.vue'

// 状态变量
const leads = ref<Lead[]>([])
const loading = ref(false)
const total = ref(0)
const pagination = reactive({
  page: 1,
  pageSize: 10
})

// 筛选条件
const filters = reactive({
  name: '',
  status: 'all',
  source: 'all',
  salespersonId: 'all',
  auditStatus: 'all'
})

// 新增客资弹窗
const showAddDialog = ref(false)
const addLoading = ref(false)

// 编辑客资弹窗
const showEditDialog = ref(false)
const currentLead = reactive<Partial<Lead>>({})

// 删除相关
const showDeleteDialog = ref(false)
const deleteMode = ref<'single' | 'batch'>('single')
const deleting = ref(false)
const currentLeadId = ref<string | null>(null)
const selectedLeads = ref<string[]>([])

// 销售人员列表
const salesList = [
  { id: 'S001', name: '张三' },
  { id: 'S002', name: '李四' },
  { id: 'S003', name: '王五' },
  { id: 'S004', name: '赵六' },
  { id: 'S005', name: '孙月' },
  { id: 'S006', name: '周鹏' },
  { id: 'S007', name: '吴佳琪' }
]

// 状态映射
const statusMap: Record<LeadStatus, { text: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  PENDING: { text: '待处理', variant: 'secondary' },
  FOLLOWING: { text: '跟进中', variant: 'default' },
  CONVERTED: { text: '已转化', variant: 'outline' },
  INVALID: { text: '无效', variant: 'destructive' }
}

// 表格列定义
const columns = [
  {
    id: 'select',
    header: () => {
      return h('div', { class: 'flex items-center justify-center' }, [
        h('input', {
          type: 'checkbox',
          checked: leads.value.length > 0 && selectedLeads.value.length === leads.value.length,
          indeterminate: selectedLeads.value.length > 0 && selectedLeads.value.length < leads.value.length,
          class: 'rounded border-gray-300',
          onClick: (e: Event) => {
            e.stopPropagation()
          },
          onChange: (e: Event) => {
            const target = e.target as HTMLInputElement
            
            if (target.checked) {
              // 全选
              const allCurrentPageLeadIds = leads.value.map(lead => lead.id)
              selectedLeads.value = Array.from(new Set([...selectedLeads.value, ...allCurrentPageLeadIds]))
            } else {
              // 取消全选
              const allCurrentPageLeadIds = new Set(leads.value.map(lead => lead.id))
              selectedLeads.value = selectedLeads.value.filter(id => !allCurrentPageLeadIds.has(id))
            }
          }
        })
      ])
    },
    cell: ({ row }: { row: Lead }) => {
      return h('div', { class: 'flex items-center justify-center' }, [
        h('input', {
          type: 'checkbox',
          checked: selectedLeads.value.includes(row.id),
          class: 'rounded border-gray-300',
          onClick: (e: Event) => {
            e.stopPropagation()
          },
          onChange: (e: Event) => {
            const target = e.target as HTMLInputElement
            if (target.checked) {
              if (!selectedLeads.value.includes(row.id)) {
                selectedLeads.value.push(row.id)
              }
            } else {
              const index = selectedLeads.value.indexOf(row.id)
              if (index !== -1) {
                selectedLeads.value.splice(index, 1)
              }
            }
          }
        })
      ])
    }
  },
  {
    accessorKey: 'name',
    header: '客户姓名',
    cell: ({ row }: { row: Lead }) => {
      return h('div', {}, [
        h('div', { class: 'font-medium' }, row.name),
        h('div', { class: 'text-xs text-gray-500' }, row.phone)
      ])
    }
  },
  {
    accessorKey: 'status',
    header: '状态',
    cell: ({ row }: { row: Lead }) => {
      const statusInfo = statusMap[row.status]
      return h(Badge, { variant: statusInfo.variant }, () => statusInfo.text)
    }
  },
  {
    accessorKey: 'auditStatus',
    header: '审核状态',
    cell: ({ row }: { row: Lead }) => {
      const auditStatusMap = {
        'PENDING_AUDIT': { text: '待审核', variant: 'secondary' },
        'APPROVED': { text: '已通过', variant: 'default' },
        'REJECTED': { text: '已驳回', variant: 'destructive' }
      }
      const auditInfo = auditStatusMap[row.auditStatus || 'PENDING_AUDIT']
      return h(Badge, { variant: auditInfo.variant }, () => auditInfo.text)
    }
  },
  {
    accessorKey: 'source',
    header: '来源'
  },
  {
    accessorKey: 'salespersonName',
    header: '归属销售'
  },
  {
    accessorKey: 'createdAt',
    header: '创建时间',
    cell: ({ row }: { row: Lead }) => {
      return new Date(row.createdAt).toLocaleString()
    }
  },
  {
    id: 'actions',
    header: '操作',
    cell: ({ row }: { row: Lead }) => {
      return h('div', { class: 'flex items-center space-x-2' }, [
        h(Button, {
          size: 'sm',
          variant: 'ghost',
          class: 'h-8 w-8 p-0',
          onClick: () => handleViewLead(row)
        }, () => h(PencilIcon, { class: 'h-4 w-4' })),
        
        h(Button, {
          size: 'sm',
          variant: 'ghost',
          class: 'h-8 w-8 p-0',
          onClick: () => deleteLead(row.id)
        }, () => h(TrashIcon, { class: 'h-4 w-4' }))
      ])
    }
  }
]

// 获取客资列表
async function fetchLeads() {
  loading.value = true
  try {
    const res = await getLeads({
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...filters
    })
    leads.value = res.list
    total.value = res.total
  } catch (error) {
    console.error('获取客资列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 分页处理
function handlePageChange(page: number) {
  pagination.page = page
  fetchLeads()
}

// 搜索处理
function handleSearch() {
  pagination.page = 1 // 重置到第一页
  fetchLeads()
}

// 重置筛选条件
function handleReset() {
  Object.keys(filters).forEach(key => {
    if (key === 'name') {
      filters[key as keyof typeof filters] = ''
    } else {
      filters[key as keyof typeof filters] = 'all'
    }
  })
  pagination.page = 1
  fetchLeads()
}

// 查看/编辑客资
function handleViewLead(lead: Lead) {
  // 复制客资数据到当前编辑对象
  Object.assign(currentLead, lead)
  showEditDialog.value = true
}

// 新增客资
async function handleAddLead(leadData: CreateLeadRequest) {
  addLoading.value = true
  try {
    await createLead(leadData)

    // 关闭弹窗
    showAddDialog.value = false

    // 刷新列表
    fetchLeads()
  } catch (error) {
    console.error('新增客资失败:', error)
    throw error // 让LeadForm组件处理错误
  } finally {
    addLoading.value = false
  }
}

// 更新客资
async function handleUpdateLead() {
  try {
    if (currentLead.id) {
      await updateLead(currentLead.id, {
        name: currentLead.name,
        phone: currentLead.phone,
        status: currentLead.status,
        source: currentLead.source,
        salespersonId: currentLead.salespersonId
      })
      
      showEditDialog.value = false
      
      // 刷新列表
      fetchLeads()
    }
  } catch (error) {
    console.error('更新客资失败:', error)
  }
}

// 删除单个客资
function deleteLead(id: string) {
  currentLeadId.value = id
  deleteMode.value = 'single'
  showDeleteDialog.value = true
}

// 批量删除确认
function confirmBatchDelete() {
  deleteMode.value = 'batch'
  showDeleteDialog.value = true
}

// 确认删除
async function confirmDelete() {
  deleting.value = true
  try {
    if (deleteMode.value === 'single' && currentLeadId.value) {
      // 这里应该调用删除API
      console.log('删除单个客资:', currentLeadId.value)
    } else {
      // 这里应该调用批量删除API
      console.log('批量删除客资:', selectedLeads.value)
      selectedLeads.value = []
    }
    
    showDeleteDialog.value = false
    fetchLeads()
  } catch (error) {
    console.error('删除客资失败:', error)
  } finally {
    deleting.value = false
  }
}

// 导出数据
function exportData() {
  console.log('导出客资数据')
  // 这里应该调用导出API
}

// 初始化
onMounted(() => {
  fetchLeads()
})
</script>

<style scoped>
/* 防止出现双滚动条 */
:deep(.scrollbar-thin) {
  overflow: hidden !important;
}
</style>