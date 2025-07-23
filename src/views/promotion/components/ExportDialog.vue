<template>
  <Dialog :open="open" @update:open="handleDialogClose">
    <DialogContent class="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle class="flex items-center space-x-2">
          <Download class="h-5 w-5 text-primary" />
          <span>导出审核数据</span>
        </DialogTitle>
        <DialogDescription>
          选择导出条件和格式，生成审核数据报表
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-6">
        <!-- 导出范围 -->
        <div class="space-y-3">
          <Label class="text-sm font-medium">导出范围</Label>
          <RadioGroup v-model="exportOptions.scope" class="space-y-2">
            <div class="flex items-center space-x-2">
              <RadioGroupItem value="current" id="scope-current" />
              <Label for="scope-current" class="text-sm cursor-pointer">
                当前筛选结果 ({{ currentFilteredCount }} 条)
              </Label>
            </div>
            <div class="flex items-center space-x-2">
              <RadioGroupItem value="all" id="scope-all" />
              <Label for="scope-all" class="text-sm cursor-pointer">
                全部数据 ({{ totalCount }} 条)
              </Label>
            </div>
          </RadioGroup>
        </div>

        <!-- 时间范围 -->
        <div class="space-y-3">
          <Label class="text-sm font-medium">时间范围</Label>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <Label class="text-xs text-muted-foreground">开始日期</Label>
              <Input
                v-model="exportOptions.startDate"
                type="date"
                class="text-sm"
              />
            </div>
            <div>
              <Label class="text-xs text-muted-foreground">结束日期</Label>
              <Input
                v-model="exportOptions.endDate"
                type="date"
                class="text-sm"
              />
            </div>
          </div>
        </div>

        <!-- 包含字段 -->
        <div class="space-y-3">
          <Label class="text-sm font-medium">包含字段</Label>
          <div class="grid grid-cols-2 gap-2">
            <div class="flex items-center space-x-2">
              <Checkbox
                id="field-basic"
                v-model:checked="exportOptions.fields.basic"
              />
              <Label for="field-basic" class="text-sm cursor-pointer">
                基础信息
              </Label>
            </div>
            <div class="flex items-center space-x-2">
              <Checkbox
                id="field-agent"
                v-model:checked="exportOptions.fields.agent"
              />
              <Label for="field-agent" class="text-sm cursor-pointer">
                代理信息
              </Label>
            </div>
            <div class="flex items-center space-x-2">
              <Checkbox
                id="field-content"
                v-model:checked="exportOptions.fields.content"
              />
              <Label for="field-content" class="text-sm cursor-pointer">
                推广内容
              </Label>
            </div>
            <div class="flex items-center space-x-2">
              <Checkbox
                id="field-audit"
                v-model:checked="exportOptions.fields.audit"
              />
              <Label for="field-audit" class="text-sm cursor-pointer">
                审核信息
              </Label>
            </div>
            <div class="flex items-center space-x-2">
              <Checkbox
                id="field-stats"
                v-model:checked="exportOptions.fields.stats"
              />
              <Label for="field-stats" class="text-sm cursor-pointer">
                统计数据
              </Label>
            </div>
            <div class="flex items-center space-x-2">
              <Checkbox
                id="field-history"
                v-model:checked="exportOptions.fields.history"
              />
              <Label for="field-history" class="text-sm cursor-pointer">
                审核历史
              </Label>
            </div>
          </div>
        </div>

        <!-- 导出格式 -->
        <div class="space-y-3">
          <Label class="text-sm font-medium">导出格式</Label>
          <RadioGroup v-model="exportOptions.format" class="flex space-x-4">
            <div class="flex items-center space-x-2">
              <RadioGroupItem value="xlsx" id="format-xlsx" />
              <Label for="format-xlsx" class="text-sm cursor-pointer">
                Excel (.xlsx)
              </Label>
            </div>
            <div class="flex items-center space-x-2">
              <RadioGroupItem value="csv" id="format-csv" />
              <Label for="format-csv" class="text-sm cursor-pointer">
                CSV (.csv)
              </Label>
            </div>
          </RadioGroup>
        </div>

        <!-- 导出选项 -->
        <div class="space-y-3">
          <Label class="text-sm font-medium">导出选项</Label>
          <div class="space-y-2">
            <div class="flex items-center space-x-2">
              <Checkbox
                id="option-header"
                v-model:checked="exportOptions.includeHeader"
              />
              <Label for="option-header" class="text-sm cursor-pointer">
                包含表头
              </Label>
            </div>
            <div class="flex items-center space-x-2">
              <Checkbox
                id="option-summary"
                v-model:checked="exportOptions.includeSummary"
              />
              <Label for="option-summary" class="text-sm cursor-pointer">
                包含汇总统计
              </Label>
            </div>
          </div>
        </div>

        <!-- 导出预览 -->
        <div v-if="showPreview" class="p-4 bg-muted/30 rounded-lg">
          <div class="text-sm space-y-1">
            <div class="font-medium">导出预览：</div>
            <div class="text-muted-foreground">
              将导出 {{ getExportCount() }} 条记录，包含 {{ getSelectedFields().length }} 个字段
            </div>
            <div class="text-xs text-muted-foreground">
              预估文件大小：{{ getEstimatedSize() }}
            </div>
          </div>
        </div>
      </div>

      <DialogFooter class="flex justify-between">
        <div class="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            @click="showPreview = !showPreview"
          >
            {{ showPreview ? '隐藏' : '显示' }}预览
          </Button>
        </div>
        <div class="flex space-x-2">
          <Button
            variant="outline"
            @click="handleCancel"
            :disabled="exporting"
          >
            取消
          </Button>
          <Button
            @click="handleExport"
            :disabled="exporting || !isFormValid"
          >
            <div v-if="exporting" class="flex items-center space-x-2">
              <div class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
              <span>导出中...</span>
            </div>
            <div v-else class="flex items-center space-x-1">
              <Download class="h-4 w-4" />
              <span>开始导出</span>
            </div>
          </Button>
        </div>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { toast } from '@/components/ui/toast/use-toast'
import { Download } from 'lucide-vue-next'
import type { AuditFilterParams } from '@/types/promotion'

// Props 定义
interface Props {
  open: boolean
  currentFilters?: AuditFilterParams
  currentFilteredCount?: number
  totalCount?: number
}

const props = withDefaults(defineProps<Props>(), {
  currentFilteredCount: 0,
  totalCount: 0
})

// Emits 定义
interface Emits {
  'update:open': [value: boolean]
  close: []
  export: [options: ExportOptions]
}

const emit = defineEmits<Emits>()

// 导出选项接口
interface ExportOptions {
  scope: 'current' | 'all'
  startDate: string
  endDate: string
  format: 'xlsx' | 'csv'
  fields: {
    basic: boolean
    agent: boolean
    content: boolean
    audit: boolean
    stats: boolean
    history: boolean
  }
  includeHeader: boolean
  includeSummary: boolean
}

// 响应式数据
const exporting = ref(false)
const showPreview = ref(false)

const exportOptions = ref<ExportOptions>({
  scope: 'current',
  startDate: getDefaultStartDate(),
  endDate: getDefaultEndDate(),
  format: 'xlsx',
  fields: {
    basic: true,
    agent: true,
    content: true,
    audit: true,
    stats: false,
    history: false
  },
  includeHeader: true,
  includeSummary: false
})

// 计算属性
const isFormValid = computed(() => {
  const hasFields = Object.values(exportOptions.value.fields).some(v => v)
  const hasValidDateRange = !exportOptions.value.startDate || 
                           !exportOptions.value.endDate || 
                           new Date(exportOptions.value.startDate) <= new Date(exportOptions.value.endDate)
  
  return hasFields && hasValidDateRange
})

// 方法
function getDefaultStartDate(): string {
  const date = new Date()
  date.setMonth(date.getMonth() - 1)
  return date.toISOString().split('T')[0]
}

function getDefaultEndDate(): string {
  return new Date().toISOString().split('T')[0]
}

function getExportCount(): number {
  return exportOptions.value.scope === 'current' 
    ? props.currentFilteredCount 
    : props.totalCount
}

function getSelectedFields(): string[] {
  const fieldMap = {
    basic: '基础信息',
    agent: '代理信息', 
    content: '推广内容',
    audit: '审核信息',
    stats: '统计数据',
    history: '审核历史'
  }
  
  return Object.entries(exportOptions.value.fields)
    .filter(([, selected]) => selected)
    .map(([key]) => fieldMap[key as keyof typeof fieldMap])
}

function getEstimatedSize(): string {
  const recordCount = getExportCount()
  const fieldCount = getSelectedFields().length
  
  // 简单估算：每个字段平均30字节，加上格式开销
  const estimatedBytes = recordCount * fieldCount * 30 * 1.2
  
  if (estimatedBytes < 1024) {
    return `${Math.round(estimatedBytes)} B`
  } else if (estimatedBytes < 1024 * 1024) {
    return `${Math.round(estimatedBytes / 1024)} KB` 
  } else {
    return `${(estimatedBytes / (1024 * 1024)).toFixed(1)} MB`
  }
}

function validateDateRange(): boolean {
  if (!exportOptions.value.startDate || !exportOptions.value.endDate) {
    return true // 允许为空
  }
  
  const start = new Date(exportOptions.value.startDate)
  const end = new Date(exportOptions.value.endDate)
  
  return start <= end
}

function resetOptions() {
  exportOptions.value = {
    scope: 'current',
    startDate: getDefaultStartDate(),
    endDate: getDefaultEndDate(),
    format: 'xlsx',
    fields: {
      basic: true,
      agent: true,
      content: true,
      audit: true,
      stats: false,
      history: false
    },
    includeHeader: true,
    includeSummary: false
  }
  showPreview.value = false
}

function handleDialogClose(value: boolean) {
  if (!value) {
    emit('update:open', false)
    emit('close')
  }
}

function handleCancel() {
  resetOptions()
  handleDialogClose(false)
}

async function handleExport() {
  if (!isFormValid.value) {
    toast({
      title: '导出失败',
      description: '请检查导出设置',
      variant: 'destructive'
    })
    return
  }

  if (!validateDateRange()) {
    toast({
      title: '日期范围错误',
      description: '开始日期不能晚于结束日期',
      variant: 'destructive'
    })
    return
  }

  const selectedFieldsCount = Object.values(exportOptions.value.fields).filter(v => v).length
  if (selectedFieldsCount === 0) {
    toast({
      title: '未选择字段',
      description: '请至少选择一个要导出的字段',
      variant: 'destructive'
    })
    return
  }

  exporting.value = true

  try {
    await emit('export', { ...exportOptions.value })
    
    toast({
      title: '导出成功',
      description: `已导出 ${getExportCount()} 条记录`,
      variant: 'default'
    })
    
    handleDialogClose(false)
    
  } catch (error: any) {
    console.error('导出失败:', error)
    toast({
      title: '导出失败',
      description: error.message || '导出过程中发生错误',
      variant: 'destructive'
    })
  } finally {
    exporting.value = false
  }
}

// 监听对话框打开状态
watch(() => props.open, (isOpen) => {
  if (isOpen) {
    resetOptions()
  }
})

// 监听日期变化进行验证
watch([() => exportOptions.value.startDate, () => exportOptions.value.endDate], () => {
  if (!validateDateRange()) {
    console.warn('日期范围无效')
  }
})
</script>

<style scoped>
/* 单选按钮和复选框样式增强 */
.cursor-pointer {
  cursor: pointer;
}

/* 预览区域样式 */
.bg-muted\/30 {
  background-color: rgba(var(--muted) / 0.3);
}

/* 响应式调整 */
@media (max-width: 640px) {
  .grid-cols-2 {
    grid-template-columns: repeat(1, minmax(0, 1fr));
  }
  
  .flex.space-x-4 {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .flex.space-x-4 > div {
    margin-left: 0;
  }
}

/* 加载动画 */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

/* 表单验证状态 */
.invalid-date {
  border-color: rgb(239 68 68);
  box-shadow: 0 0 0 1px rgb(239 68 68);
}

/* 禁用状态 */
button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 字段选择网格样式 */
.grid-cols-2 > div {
  min-height: 2rem;
  display: flex;
  align-items: center;
}
</style>