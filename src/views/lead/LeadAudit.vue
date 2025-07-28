<!--
  客资审核页面
  
  功能特性：
  - 复用DataTable组件展示待审核客资
  - 基于权限的数据过滤
  - 审核操作按钮和批量操作
  - 实时状态更新
  - 审核记录查看
-->

<template>
  <div class="space-y-6">
    <!-- 页面标题和操作栏 -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">客资审核</h1>
        <p class="text-gray-600 mt-1">审核待处理的客资信息，确保数据质量</p>
      </div>
      
      <div class="flex items-center space-x-3">
        <!-- 批量操作 -->
        <div v-if="selectedLeads.length > 0" class="flex items-center space-x-2">
          <Badge variant="secondary">已选择 {{ selectedLeads.length }} 项</Badge>
          <Button
            v-if="canBatchAudit"
            variant="outline"
            size="sm"
            @click="showBatchAuditDialog = true"
            :disabled="batchAuditLoading"
          >
            <CheckCircleIcon class="w-4 h-4 mr-1" />
            批量审核
          </Button>
        </div>
        
        <!-- 刷新按钮 -->
        <Button variant="outline" size="sm" @click="refreshData" :disabled="loading">
          <RefreshCwIcon class="w-4 h-4 mr-1" :class="{ 'animate-spin': loading }" />
          刷新
        </Button>
        
        <!-- 导出按钮 -->
        <Button
          v-if="canExportAuditData"
          variant="outline"
          size="sm"
          @click="exportAuditData"
          :disabled="exportLoading"
        >
          <DownloadIcon class="w-4 h-4 mr-1" />
          导出
        </Button>
      </div>
    </div>

    <!-- 筛选面板 -->
    <Card>
      <CardContent class="p-4">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          <!-- 审核状态筛选 -->
          <div class="space-y-2">
            <Label>审核状态</Label>
            <Select v-model="filters.auditStatus">
              <SelectTrigger>
                <SelectValue placeholder="选择审核状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">全部状态</SelectItem>
                <SelectItem value="PENDING_AUDIT">待审核</SelectItem>
                <SelectItem value="APPROVED">已通过</SelectItem>
                <SelectItem value="REJECTED">已驳回</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <!-- 销售人员筛选 -->
          <div v-if="canViewAll" class="space-y-2">
            <Label>销售人员</Label>
            <Select v-model="filters.salespersonId">
              <SelectTrigger>
                <SelectValue placeholder="选择销售人员" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">全部销售</SelectItem>
                <SelectItem v-for="sales in salesList" :key="sales.id" :value="sales.id">
                  {{ sales.name }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <!-- 时间范围筛选 -->
          <div class="space-y-2">
            <Label>创建时间</Label>
            <Select v-model="filters.dateRange">
              <SelectTrigger>
                <SelectValue placeholder="选择时间范围" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">全部时间</SelectItem>
                <SelectItem value="today">今天</SelectItem>
                <SelectItem value="week">本周</SelectItem>
                <SelectItem value="month">本月</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <!-- 搜索框 -->
          <div class="space-y-2">
            <Label>搜索</Label>
            <div class="relative">
              <SearchIcon class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                v-model="filters.keyword"
                placeholder="搜索客户姓名或手机号"
                class="pl-10"
                @keyup.enter="applyFilters"
              />
            </div>
          </div>

          <!-- 搜索按钮 -->
          <div class="space-y-2">
            <Label class="invisible">搜索</Label>
            <Button @click="applyFilters" :disabled="loading" class="w-full">
              <SearchIcon class="w-4 h-4 mr-1" />
              搜索
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- 统计信息 -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mobile-stats-grid">
      <Card>
        <CardContent class="p-4">
          <div class="flex items-center">
            <ClockIcon class="w-8 h-8 text-yellow-500" />
            <div class="ml-3">
              <p class="text-sm font-medium text-gray-600">待审核</p>
              <p class="text-2xl font-bold text-gray-900">{{ statistics.pendingCount }}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent class="p-4">
          <div class="flex items-center">
            <CheckCircleIcon class="w-8 h-8 text-green-500" />
            <div class="ml-3">
              <p class="text-sm font-medium text-gray-600">已通过</p>
              <p class="text-2xl font-bold text-gray-900">{{ statistics.approvedCount }}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent class="p-4">
          <div class="flex items-center">
            <XCircleIcon class="w-8 h-8 text-red-500" />
            <div class="ml-3">
              <p class="text-sm font-medium text-gray-600">已驳回</p>
              <p class="text-2xl font-bold text-gray-900">{{ statistics.rejectedCount }}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent class="p-4">
          <div class="flex items-center">
            <TrendingUpIcon class="w-8 h-8 text-blue-500" />
            <div class="ml-3">
              <p class="text-sm font-medium text-gray-600">通过率</p>
              <p class="text-2xl font-bold text-gray-900">{{ Math.round(statistics.approvalRate * 100) }}%</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- 客资列表 -->
    <Card>
      <CardContent class="p-0">
        <DataTable
          :columns="columns"
          :data="leads"
          :loading="loading"
          :pagination="true"
          :selection="true"
          @update:selection="selectedLeads = $event"
          @update:pagination="handlePaginationChange"
        />
      </CardContent>
    </Card>

    <!-- 审核操作面板 -->
    <AuditPanel
      v-if="currentLead"
      :lead="currentLead"
      :open="showAuditPanel"
      @update:open="showAuditPanel = $event"
      @audit="handleAudit"
    />

    <!-- 批量审核对话框 -->
    <Dialog :open="showBatchAuditDialog" @update:open="showBatchAuditDialog = $event">
      <DialogContent class="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>批量审核</DialogTitle>
          <DialogDescription>
            您将对 {{ selectedLeads.length }} 条客资执行批量审核操作
          </DialogDescription>
        </DialogHeader>
        
        <div class="space-y-4 py-4">
          <div class="space-y-2">
            <Label>审核决定</Label>
            <Select v-model="batchAuditDecision.action">
              <SelectTrigger>
                <SelectValue placeholder="选择审核结果" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="APPROVE">通过</SelectItem>
                <SelectItem value="REJECT">驳回</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div class="space-y-2">
            <Label>审核意见</Label>
            <Textarea
              v-model="batchAuditDecision.comment"
              placeholder="请输入审核意见（可选）"
              rows="3"
            />
          </div>
          
          <div v-if="batchAuditDecision.action === 'REJECT'" class="space-y-2">
            <Label>驳回原因</Label>
            <Select v-model="batchAuditDecision.rejectReason">
              <SelectTrigger>
                <SelectValue placeholder="选择驳回原因" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="invalid_phone">手机号无效</SelectItem>
                <SelectItem value="duplicate_lead">重复客资</SelectItem>
                <SelectItem value="incomplete_info">信息不完整</SelectItem>
                <SelectItem value="other">其他原因</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" @click="showBatchAuditDialog = false">取消</Button>
          <Button @click="handleBatchAudit" :disabled="batchAuditLoading">
            <LoaderIcon v-if="batchAuditLoading" class="w-4 h-4 mr-2 animate-spin" />
            确认审核
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, watch, h } from 'vue'
import {
  CheckCircleIcon, XCircleIcon, ClockIcon, TrendingUpIcon,
  RefreshCwIcon, DownloadIcon, SearchIcon, LoaderIcon, EyeIcon
} from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle
} from '@/components/ui/dialog'
import { useToast } from '@/components/ui/toast/use-toast'

import DataTable from '@/components/business/DataTable.vue'
import AuditPanel from './components/AuditPanel.vue'

import type { Lead, LeadAuditStatus } from '@/types/lead'
import type { AuditDecision } from '@/types/leadAudit'
import { leadAuditApi } from '@/api/leadAudit'
import { useLeadAuditPermission } from '@/composables/useLeadAuditPermission'

// Composables
const { toast } = useToast()
const {
  canViewAll,
  canBatchAudit,
  canExportAuditData,
  getPermissionFilters
} = useLeadAuditPermission({ autoRefresh: true })

// 响应式数据
const loading = ref(false)
const exportLoading = ref(false)
const batchAuditLoading = ref(false)
const leads = ref<Lead[]>([])
const selectedLeads = ref<Lead[]>([])
const currentLead = ref<Lead | null>(null)
const showAuditPanel = ref(false)
const showBatchAuditDialog = ref(false)

// 筛选条件
const filters = reactive({
  auditStatus: 'PENDING_AUDIT' as LeadAuditStatus | 'ALL',
  salespersonId: 'ALL',
  dateRange: 'ALL',
  keyword: ''
})

// 分页信息
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

// 统计信息
const statistics = reactive({
  pendingCount: 0,
  approvedCount: 0,
  rejectedCount: 0,
  approvalRate: 0
})

// 批量审核决定
const batchAuditDecision = reactive<AuditDecision>({
  action: 'APPROVE',
  comment: '',
  rejectReason: undefined
})

// 销售人员列表
const salesList = ref([
  { id: 'S001', name: '张三' },
  { id: 'S002', name: '李四' },
  { id: 'S003', name: '王五' },
  { id: 'S004', name: '赵六' }
])

// 表格列定义
const columns = computed(() => [
  {
    accessorKey: 'name',
    header: '客户姓名'
  },
  {
    accessorKey: 'phone',
    header: '联系电话'
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
    accessorKey: 'agentName',
    header: '归属代理'
  },
  {
    accessorKey: 'auditStatus',
    header: '审核状态',
    cell: ({ row }: { row: Lead }) => {
      const statusMap = {
        'PENDING_AUDIT': { text: '待审核', variant: 'secondary' as const },
        'APPROVED': { text: '已通过', variant: 'default' as const },
        'REJECTED': { text: '已驳回', variant: 'destructive' as const }
      }
      const status = statusMap[row.auditStatus || 'PENDING_AUDIT']
      return h(Badge, { variant: status.variant }, () => status.text)
    }
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
      if (row.auditStatus === 'PENDING_AUDIT') {
        return h(Button, {
          size: 'sm',
          variant: 'outline',
          onClick: () => handleAuditClick(row)
        }, () => [
          h(CheckCircleIcon, { class: 'w-4 h-4 mr-1' }),
          '审核'
        ])
      }
      return h(Button, {
        size: 'sm',
        variant: 'ghost',
        onClick: () => handleViewClick(row)
      }, () => [
        h(EyeIcon, { class: 'w-4 h-4 mr-1' }),
        '查看'
      ])
    }
  }
])

// 获取客资列表
async function fetchLeads() {
  loading.value = true
  try {
    const permissionFilters = getPermissionFilters()
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      auditStatus: filters.auditStatus === 'ALL' ? undefined : filters.auditStatus,
      salespersonId: filters.salespersonId === 'ALL' ? undefined : filters.salespersonId,
      keyword: filters.keyword || undefined,
      ...permissionFilters
    }
    
    const response = await leadAuditApi.getAuditableLeads(params)
    leads.value = response.list
    pagination.total = response.total
  } catch (error) {
    console.error('获取客资列表失败:', error)
    toast({
      title: '获取数据失败',
      description: '请稍后重试',
      variant: 'destructive'
    })
  } finally {
    loading.value = false
  }
}

// 获取统计信息
async function fetchStatistics() {
  try {
    const response = await leadAuditApi.getAuditStatistics()
    Object.assign(statistics, response)
  } catch (error) {
    console.error('获取统计信息失败:', error)
  }
}

// 应用筛选条件
function applyFilters() {
  pagination.page = 1
  fetchLeads()
}

// 刷新数据
function refreshData() {
  fetchLeads()
  fetchStatistics()
}

// 分页变化处理
function handlePaginationChange(newPagination: any) {
  Object.assign(pagination, newPagination)
  fetchLeads()
}

// 审核操作
async function handleAudit(decision: AuditDecision) {
  if (!currentLead.value) return
  
  try {
    await leadAuditApi.auditLead(currentLead.value.id, decision)
    
    toast({
      title: '审核成功',
      description: `客资已${decision.action === 'APPROVE' ? '通过' : '驳回'}审核`,
      variant: 'default'
    })
    
    showAuditPanel.value = false
    refreshData()
  } catch (error) {
    console.error('审核失败:', error)
    toast({
      title: '审核失败',
      description: '请稍后重试',
      variant: 'destructive'
    })
  }
}

// 批量审核
async function handleBatchAudit() {
  if (selectedLeads.value.length === 0) return
  
  batchAuditLoading.value = true
  try {
    const leadIds = selectedLeads.value.map(lead => lead.id)
    await leadAuditApi.batchAuditLeads({
      leadIds,
      decision: batchAuditDecision
    })
    
    toast({
      title: '批量审核成功',
      description: `已${batchAuditDecision.action === 'APPROVE' ? '通过' : '驳回'} ${leadIds.length} 条客资`,
      variant: 'default'
    })
    
    showBatchAuditDialog.value = false
    selectedLeads.value = []
    refreshData()
  } catch (error) {
    console.error('批量审核失败:', error)
    toast({
      title: '批量审核失败',
      description: '请稍后重试',
      variant: 'destructive'
    })
  } finally {
    batchAuditLoading.value = false
  }
}

// 导出数据
async function exportAuditData() {
  exportLoading.value = true
  try {
    const blob = await leadAuditApi.exportAuditRecords(filters)
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-records-${new Date().toISOString().split('T')[0]}.xlsx`
    a.click()
    window.URL.revokeObjectURL(url)
    
    toast({
      title: '导出成功',
      description: '审核记录已导出',
      variant: 'default'
    })
  } catch (error) {
    console.error('导出失败:', error)
    toast({
      title: '导出失败',
      description: '请稍后重试',
      variant: 'destructive'
    })
  } finally {
    exportLoading.value = false
  }
}

// 处理审核按钮点击
function handleAuditClick(lead: Lead) {
  currentLead.value = lead
  showAuditPanel.value = true
}

// 处理查看按钮点击
function handleViewClick(lead: Lead) {
  currentLead.value = lead
  showAuditPanel.value = true
}

// 监听筛选条件变化
watch(filters, () => {
  applyFilters()
}, { deep: true })

// 组件挂载时初始化
onMounted(() => {
  fetchLeads()
  fetchStatistics()
})
</script>


