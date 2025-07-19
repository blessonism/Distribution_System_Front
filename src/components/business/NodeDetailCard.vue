<template>
  <Card v-if="node" class="w-full">
    <CardHeader>
      <CardTitle>人员详情</CardTitle>
    </CardHeader>
    <CardContent class="space-y-4">
      <div class="grid grid-cols-12 gap-4">
        <!-- 左侧：头像和名称 -->
        <div class="col-span-6 flex items-center space-x-4">
          <Avatar size="lg" class="border-2 border-primary/10">
            <AvatarImage :src="getAvatarUrl(node.role)" />
            <AvatarFallback>{{ node.name.charAt(0) }}</AvatarFallback>
          </Avatar>
          <div>
            <p class="text-xl font-bold">{{ node.name }}</p>
            <Badge :variant="getBadgeVariant(node.role)" class="mt-1">{{ roleMap[node.role] }}</Badge>
          </div>
        </div>
        
        <!-- 右侧：基本信息 -->
        <div class="col-span-6">
          <div class="rounded-lg bg-muted/40 p-3 border border-border/30">
            <h3 class="text-xs uppercase font-medium text-muted-foreground mb-2">基本信息</h3>
            <div class="space-y-2 text-sm">
              <div class="grid grid-cols-4">
                <p class="col-span-1 text-muted-foreground">ID</p>
                <div class="col-span-3">
                  <div class="flex items-center">
                    <p class="font-medium">{{ showFullId ? node.id : node.id.substring(0, 10) + '...' }}</p>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      class="h-5 w-5 ml-1" 
                      @click="showFullId = !showFullId"
                      title="点击显示/隐藏完整ID"
                    >
                      <EyeIcon v-if="!showFullId" class="h-3 w-3" />
                      <EyeOffIcon v-else class="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
              <div class="grid grid-cols-4">
                <p class="col-span-1 text-muted-foreground">电话</p>
                <p class="col-span-3 font-medium">{{ node.phone }}</p>
              </div>
              <div v-if="node.parentId" class="grid grid-cols-4">
                <p class="col-span-1 text-muted-foreground">上级</p>
                <div class="col-span-3">
                  <p v-if="parentInfo.isLoading" class="text-sm text-muted-foreground flex items-center">
                    <Loader2 class="h-3 w-3 mr-1 animate-spin" />正在加载...
                  </p>
                  <p v-else-if="parentInfo.name" class="font-medium">
                    {{ parentInfo.name }}
                    <span class="text-xs text-muted-foreground">({{ roleMap[parentInfo.role] || '' }})</span>
                  </p>
                  <p v-else class="italic text-muted-foreground text-sm">未找到上级信息</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 团队统计数据 -->
      <Card>
        <CardHeader class="p-3">
          <CardTitle class="text-base">团队结构统计</CardTitle>
        </CardHeader>
        <CardContent class="p-3">
          <!-- 加载状态 -->
          <div v-if="isLoading" class="flex items-center justify-center py-6">
            <Loader2 class="h-5 w-5 animate-spin text-muted-foreground mr-2" />
            <span class="text-muted-foreground">加载中...</span>
          </div>

          <div v-else-if="!node.hasChildren" class="py-2 text-muted-foreground text-center text-sm">
            该人员没有下级团队
          </div>

          <!-- 团队结构统计 -->
          <div v-else class="space-y-3">
            <!-- 团队规模 -->
            <div class="rounded-lg bg-muted p-3 text-center">
              <h3 class="text-sm font-medium text-muted-foreground mb-1">团队总规模</h3>
              <p class="text-2xl font-bold">{{ teamStats.total || 0 }}</p>
            </div>

            <!-- 不同角色统计 -->
            <div class="grid grid-cols-3 gap-2 mt-2">
              <div v-if="node.role === 'director'" class="rounded-lg bg-blue-50 p-2 text-center">
                <h4 class="text-xs text-blue-500 font-medium">销售组长</h4>
                <p class="text-xl font-semibold text-blue-600">{{ teamStats.managerCount || 0 }}</p>
              </div>
              <div v-if="['director', 'manager'].includes(node.role)" class="rounded-lg bg-green-50 p-2 text-center">
                <h4 class="text-xs text-green-500 font-medium">销售</h4>
                <p class="text-xl font-semibold text-green-600">{{ teamStats.salesCount || 0 }}</p>
              </div>
              <div class="rounded-lg bg-amber-50 p-2 text-center">
                <h4 class="text-xs text-amber-500 font-medium">代理</h4>
                <p class="text-xl font-semibold text-amber-600">{{ teamStats.agentCount || 0 }}</p>
              </div>
            </div>

            <!-- 直接下级 -->
            <div class="mt-4">
              <h3 class="text-sm font-medium mb-2">直接下级</h3>
              <div class="rounded-lg border p-2">
                <div v-if="directSubordinates.length === 0" class="text-center text-muted-foreground py-2 text-sm">
                  暂无直接下级
                </div>
                <div v-else class="divide-y">
                  <div 
                    v-for="subordinate in directSubordinates.slice(0, 3)" 
                    :key="subordinate.id"
                    class="py-2 flex items-center justify-between"
                  >
                    <div class="flex items-center">
                      <Avatar class="h-6 w-6 mr-2">
                        <AvatarFallback class="text-xs">
                          {{ subordinate.name.charAt(0) }}
                        </AvatarFallback>
                      </Avatar>
                      <span class="text-sm">{{ subordinate.name }}</span>
                    </div>
                    <Badge variant="outline">{{ roleMap[subordinate.role] }}</Badge>
                  </div>
                </div>
                <div v-if="directSubordinates.length > 3" class="text-center mt-2">
                  <Button variant="ghost" size="sm" class="text-xs" @click="showMore = !showMore">
                    {{ showMore ? '收起' : `显示更多(${directSubordinates.length - 3})` }}
                  </Button>
                </div>
                <div v-if="showMore" class="divide-y mt-1">
                  <div 
                    v-for="subordinate in directSubordinates.slice(3)" 
                    :key="subordinate.id"
                    class="py-2 flex items-center justify-between"
                  >
                    <div class="flex items-center">
                      <Avatar class="h-6 w-6 mr-2">
                        <AvatarFallback class="text-xs">
                          {{ subordinate.name.charAt(0) }}
                        </AvatarFallback>
                      </Avatar>
                      <span class="text-sm">{{ subordinate.name }}</span>
                    </div>
                    <Badge variant="outline">{{ roleMap[subordinate.role] }}</Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- 业绩统计 -->
      <Card v-if="node.hasChildren">
        <CardHeader class="p-3">
          <CardTitle class="text-base">业绩概览</CardTitle>
        </CardHeader>
        <CardContent class="p-3">
          <div class="grid grid-cols-2 gap-4">
            <div class="text-center">
              <p class="text-sm text-muted-foreground">本月成交</p>
              <p class="text-xl font-bold">{{ teamPerformance.monthlyDeals || 0 }}</p>
            </div>
            <div class="text-center">
              <p class="text-sm text-muted-foreground">本月金额</p>
              <p class="text-xl font-bold text-green-600">¥{{ formatAmount(teamPerformance.monthlyAmount) }}</p>
            </div>
          </div>
          <Separator class="my-3" />
          <div class="flex justify-between items-center">
            <p class="text-sm text-muted-foreground">本季度目标达成</p>
            <p class="text-sm font-medium">
              {{ teamPerformance.targetPercentage || 0 }}%
            </p>
          </div>
          <div class="relative w-full h-2 mt-1 overflow-hidden rounded-full bg-secondary">
            <div
              class="h-full w-full flex-1 bg-primary transition-all"
              :style="{ width: `${teamPerformance.targetPercentage || 0}%` }"
            />
          </div>
        </CardContent>
      </Card>
    </CardContent>
  </Card>
  <Card v-else class="w-full h-64 flex items-center justify-center">
    <p class="text-muted-foreground">请在左侧选择一个节点查看详情</p>
  </Card>
</template>

<script setup lang="ts">
import { defineProps, ref, watch, onMounted } from 'vue';
import type { TreeNodeData, PersonnelRole } from '@/types/personnel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Loader2, EyeIcon, EyeOffIcon } from 'lucide-vue-next';
import { getPersonnelChildren } from '@/api/personnel';

const props = defineProps<{
  node: TreeNodeData | null;
}>();

// 状态管理
const isLoading = ref(false);
const showMore = ref(false);
const showFullId = ref(false);
const directSubordinates = ref<TreeNodeData[]>([]);
const parentInfo = ref({
  isLoading: false,
  name: '',
  role: '' as PersonnelRole,
  id: ''
});
const teamStats = ref({
  total: 0,
  managerCount: 0,
  salesCount: 0,
  agentCount: 0
});
const teamPerformance = ref({
  monthlyDeals: 0,
  monthlyAmount: 0,
  targetPercentage: 0
});

const roleMap: Record<PersonnelRole, string> = {
  director: '销售总监',
  manager: '销售组长',
  sales: '销售',
  agent: '代理',
};

const getAvatarUrl = (role: PersonnelRole) => {
  //
  return '';
};

// 格式化金额
const formatAmount = (amount: number) => {
  return amount ? amount.toLocaleString() : '0';
};

// 获取徽章变体
const getBadgeVariant = (role: PersonnelRole) => {
  switch (role) {
    case 'director':
      return 'default';
    case 'manager':
      return 'secondary';
    case 'sales':
      return 'outline';
    case 'agent':
      return 'destructive';
    default:
      return 'outline';
  }
};

// 获取下属人员
const fetchSubordinates = async () => {
  if (!props.node || !props.node.hasChildren) return;
  
  isLoading.value = true;
  try {
    // 获取直接下级
    const res = await getPersonnelChildren(props.node.id);
    if (res.data.code === 200 || res.data.success) {
      directSubordinates.value = res.data.data;
      
      // 计算统计信息
      calculateTeamStats(res.data.data);
      
      // 模拟业绩数据 (实际项目中应该从API获取)
      generateMockPerformanceData();
    }
  } catch (error) {
    console.error('获取下级失败:', error);
    directSubordinates.value = [];
  } finally {
    isLoading.value = false;
  }
};

// 计算团队统计信息
const calculateTeamStats = (subordinates: TreeNodeData[]) => {
  // 重置统计
  teamStats.value = {
    total: subordinates.length,
    managerCount: 0,
    salesCount: 0,
    agentCount: 0
  };
  
  // 计算各角色数量
  subordinates.forEach(person => {
    if (person.role === 'manager') {
      teamStats.value.managerCount++;
    } else if (person.role === 'sales') {
      teamStats.value.salesCount++;
    } else if (person.role === 'agent') {
      teamStats.value.agentCount++;
    }
  });
};

// 生成模拟业绩数据 (实际项目应从API获取)
const generateMockPerformanceData = () => {
  teamPerformance.value = {
    monthlyDeals: Math.floor(Math.random() * 20) + 5,
    monthlyAmount: Math.floor(Math.random() * 1000000) + 100000,
    targetPercentage: Math.floor(Math.random() * 100) + 1
  };
};

// 获取上级信息
const fetchParentInfo = async () => {
  if (!props.node || !props.node.parentId) {
    parentInfo.value = { isLoading: false, name: '', role: '' as PersonnelRole, id: '' };
    return;
  }
  
  parentInfo.value.isLoading = true;
  try {
    // 使用父节点的ID进行请求
    const parentId = props.node.parentId;
    const res = await getPersonnelById(parentId);
    if (res.data.code === 200 || res.data.success) {
      const data = res.data.data;
      parentInfo.value = {
        isLoading: false,
        name: data.name,
        role: data.role as PersonnelRole,
        id: data.id
      };
    } else {
      throw new Error('获取上级信息失败');
    }
  } catch (error) {
    console.error('获取上级信息失败:', error);
    parentInfo.value = { 
      isLoading: false, 
      name: '', 
      role: '' as PersonnelRole,
      id: props.node.parentId || ''  // 保留ID以备后用
    };
  }
};

// 模拟获取人员信息的API (实际项目中应替换为真实API)
const getPersonnelById = async (id: string) => {
  // 模拟API延迟
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // 简单模拟不同角色的上级
  const role = props.node?.role;
  let parentRole: PersonnelRole = 'director';
  let parentName = '';
  
  if (role === 'sales') {
    parentRole = 'manager';
    parentName = '张组长';
  } else if (role === 'manager') {
    parentRole = 'director';
    parentName = '李总监';
  } else if (role === 'agent') {
    parentRole = 'sales';
    parentName = '王销售';
  }
  
  // 模拟API响应
  return {
    data: {
      code: 200,
      success: true,
      data: {
        id,
        name: parentName || `上级${id.substring(0, 4)}`,
        role: parentRole,
        phone: '13800138000'
      }
    }
  };
};

// 监听节点变化
watch(() => props.node, (newNode) => {
  if (newNode) {
    fetchSubordinates();
    fetchParentInfo(); // 添加获取上级信息
    showMore.value = false; // 重置显示更多状态
    showFullId.value = false; // 重置ID显示状态
  } else {
    directSubordinates.value = [];
    parentInfo.value = { isLoading: false, name: '', role: '' as PersonnelRole, id: '' };
    teamStats.value = { total: 0, managerCount: 0, salesCount: 0, agentCount: 0 };
  }
}, { immediate: true });
</script> 