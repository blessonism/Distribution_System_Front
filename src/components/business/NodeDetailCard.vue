<!--
/**
 * @fileoverview 人员节点详情卡片组件
 * 基于Vue 3 Composition API构建的人员节点详细信息展示卡片，提供完整的组织架构节点分析
 * 支持团队统计、业绩概览、直接下级展示和上级信息查询等多维度数据展示功能
 * 集成实时数据加载、模拟数据生成和响应式布局设计，确保最佳的用户体验
 * 
 * @component NodeDetailCard
 * @author Frontend Team
 * @since 1.0.0
 * @version 1.3.0
 * 
 * @description
 * NodeDetailCard是PersonnelTree系统中的详情展示组件，提供以下核心功能：
 * - 👤 完整的人员基础信息展示，包含头像、姓名、角色和联系方式
 * - 📊 实时团队统计数据，支持按角色分类的下级人员统计
 * - 🎯 业绩概览面板，展示成交数据和目标达成情况
 * - 🔗 直接下级列表，支持展开/收起和分页展示
 * - ⬆️ 上级信息查询，动态加载上级人员基本信息
 * - 📱 响应式网格布局，适配不同屏幕尺寸的设备
 * - 🎨 现代化UI设计，使用shadcn-vue组件和Tailwind CSS
 * 
 * @features
 * - **智能数据加载**: 根据节点选择动态加载相关数据
 * - **分层权限展示**: 根据角色层级显示不同的统计维度
 * - **实时状态管理**: 支持加载状态、错误处理和空状态展示
 * - **交互式界面**: ID显示切换、下级列表展开等用户交互
 * - **数据可视化**: 进度条、徽章和统计卡片的视觉展示
 * 
 * @usage
 * ```vue
 * <template>
 *   <NodeDetailCard
 *     :node="selectedNode"
 *   />
 * </template>
 * ```
 * 
 * @example
 * ```typescript
 * // 基础使用示例
 * const selectedNode: TreeNodeData = {
 *   id: 'node_001',
 *   name: '张经理',
 *   role: 'manager',
 *   phone: '13800138000',
 *   parentId: 'director_001',
 *   hasChildren: true
 * }
 * 
 * // 选择节点时会自动加载详情数据
 * function handleNodeSelect(node: TreeNodeData) {
 *   selectedNode.value = node
 *   // NodeDetailCard会自动加载:
 *   // - 直接下级列表
 *   // - 团队统计数据
 *   // - 上级信息
 *   // - 业绩概览
 * }
 * ```
 * 
 * @performance
 * - 使用watch监听节点变化，避免不必要的数据重载
 * - 模拟数据生成优化，减少计算复杂度
 * - 分页式下级列表展示，提升大团队数据的渲染性能
 * - 条件渲染优化，根据数据状态智能显示组件
 */
-->

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
                <div v-else>
                  <!-- 显示前3个下级 -->
                  <div class="divide-y">
                    <div 
                      v-for="subordinate in directSubordinates.slice(0, showMore ? directSubordinates.length : 3)" 
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
                  
                  <!-- 显示更多/收起按钮 -->
                  <div v-if="directSubordinates.length > 3" class="text-center mt-0">
                    <Button variant="ghost" size="sm" class="text-xs" @click="showMore = !showMore">
                      {{ showMore ? '收起' : `显示更多(${directSubordinates.length - 3})` }}
                    </Button>
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
/**
 * @fileoverview NodeDetailCard组件的核心逻辑实现
 * 使用Vue 3 Composition API实现人员节点详情的完整功能，包含数据加载、统计计算和状态管理
 */
import { defineProps, ref, watch, onMounted } from 'vue';
import type { TreeNodeData, PersonnelRole } from '@/types/personnel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Loader2, EyeIcon, EyeOffIcon } from 'lucide-vue-next';
import { getPersonnelChildren } from '@/api/personnel';

/**
 * 组件属性接口定义
 * 定义NodeDetailCard组件的输入属性
 * 
 * @interface Props
 * 
 * @property {TreeNodeData | null} node - 当前选中的人员节点数据，null时显示空状态
 * 
 * @example
 * ```typescript
 * const props = {
 *   node: {
 *     id: 'node_001',
 *     name: '张经理',
 *     role: 'manager',
 *     phone: '13800138000',
 *     parentId: 'director_001',
 *     hasChildren: true
 *   }
 * }
 * ```
 */
const props = defineProps<{
  /** 人员节点数据对象 */
  node: TreeNodeData | null;
}>();

/**
 * 组件响应式状态管理
 * 管理组件的各种状态和数据
 */
/** 数据加载状态 */
const isLoading = ref(false);
/** 下级列表展开状态 */
const showMore = ref(false);
/** ID完整显示状态 */
const showFullId = ref(false);
/** 直接下级人员列表 */
const directSubordinates = ref<TreeNodeData[]>([]);

/**
 * 上级信息状态对象
 * 管理上级人员的基本信息和加载状态
 * 
 * @interface ParentInfo
 * 
 * @property {boolean} isLoading - 上级信息加载状态
 * @property {string} name - 上级人员姓名
 * @property {PersonnelRole} role - 上级人员角色
 * @property {string} id - 上级人员ID
 * 
 * @example
 * ```typescript
 * parentInfo.value = {
 *   isLoading: false,
 *   name: '李总监',
 *   role: 'director',
 *   id: 'director_001'
 * }
 * ```
 */
const parentInfo = ref({
  isLoading: false,
  name: '',
  role: '' as PersonnelRole,
  id: ''
});

/**
 * 团队统计数据对象
 * 存储团队规模和角色分布统计信息
 * 
 * @interface TeamStats
 * 
 * @property {number} total - 团队总人数
 * @property {number} managerCount - 销售组长数量
 * @property {number} salesCount - 销售人员数量
 * @property {number} agentCount - 代理人数量
 * 
 * @example
 * ```typescript
 * teamStats.value = {
 *   total: 15,
 *   managerCount: 3,
 *   salesCount: 8,
 *   agentCount: 4
 * }
 * ```
 */
const teamStats = ref({
  total: 0,
  managerCount: 0,
  salesCount: 0,
  agentCount: 0
});

/**
 * 团队业绩数据对象
 * 存储团队的业绩表现和目标达成情况
 * 
 * @interface TeamPerformance
 * 
 * @property {number} monthlyDeals - 本月成交数量
 * @property {number} monthlyAmount - 本月成交金额
 * @property {number} targetPercentage - 目标达成百分比
 * 
 * @example
 * ```typescript
 * teamPerformance.value = {
 *   monthlyDeals: 25,
 *   monthlyAmount: 850000,
 *   targetPercentage: 78
 * }
 * ```
 */
const teamPerformance = ref({
  monthlyDeals: 0,
  monthlyAmount: 0,
  targetPercentage: 0
});

/**
 * 角色名称映射表
 * 将系统角色代码映射为用户友好的中文显示名称
 * 
 * @const roleMap
 * @type {Record<PersonnelRole, string>}
 * 
 * @complexity O(1) - 哈希表查找，常数时间复杂度
 * 
 * @example
 * ```typescript
 * const roleName = roleMap['manager'] // '销售组长'
 * const directorName = roleMap['director'] // '销售总监'
 * ```
 */
const roleMap: Record<PersonnelRole, string> = {
  director: '销售总监',
  manager: '销售组长',
  sales: '销售',
  agent: '代理',
};

/**
 * 获取角色对应的头像URL
 * 根据用户角色返回对应的头像图片地址（当前为占位实现）
 * 
 * @function getAvatarUrl
 * @param {PersonnelRole} role - 用户角色标识
 * @returns {string} 头像图片URL地址
 * 
 * @complexity O(1) - 简单条件判断，常数时间复杂度
 * 
 * @todo 实现基于角色的头像映射逻辑
 * @todo 添加头像加载失败的降级处理
 * 
 * @example
 * ```typescript
 * const avatarUrl = getAvatarUrl('director') // '' (当前返回空字符串)
 * ```
 */
const getAvatarUrl = (role: PersonnelRole) => {
  // TODO: 实现基于角色的头像URL映射
  return '';
};

/**
 * 格式化金额显示
 * 将数字金额转换为本地化的千分位分隔格式
 * 
 * @function formatAmount
 * @param {number} amount - 要格式化的金额数值
 * @returns {string} 格式化后的金额字符串
 * 
 * @complexity O(1) - 简单数值转换，常数时间复杂度
 * 
 * @example
 * ```typescript
 * formatAmount(1234567) // "1,234,567"
 * formatAmount(0) // "0"
 * formatAmount(null) // "0"
 * ```
 */
const formatAmount = (amount: number) => {
  return amount ? amount.toLocaleString() : '0';
};

/**
 * 获取角色对应的徽章样式变体
 * 根据人员角色返回相应的Badge组件样式变体
 * 
 * @function getBadgeVariant
 * @param {PersonnelRole} role - 人员角色标识
 * @returns {string} Badge组件的变体名称
 * 
 * @complexity O(1) - 简单switch语句，常数时间复杂度
 * @flow 角色输入 → 条件匹配 → 样式返回 → 徽章渲染
 * 
 * @example
 * ```typescript
 * getBadgeVariant('director') // 'default'
 * getBadgeVariant('manager') // 'secondary'
 * getBadgeVariant('sales') // 'outline'
 * getBadgeVariant('agent') // 'destructive'
 * ```
 */
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

/**
 * 获取下属人员数据
 * 从API获取当前节点的直接下级人员列表，并触发统计数据计算
 * 
 * @async
 * @function fetchSubordinates
 * @returns {Promise<void>}
 * 
 * @complexity O(n) - n为下级人员数量，需要遍历计算统计
 * @flow API请求 → 数据处理 → 统计计算 → 业绩生成 → 状态更新
 * 
 * @example
 * ```typescript
 * // 节点选择时自动调用
 * await fetchSubordinates()
 * // 会更新：
 * // - directSubordinates.value
 * // - teamStats.value
 * // - teamPerformance.value
 * ```
 */
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

/**
 * 计算团队统计信息
 * 基于下级人员列表计算各角色的数量分布统计
 * 
 * @function calculateTeamStats
 * @param {TreeNodeData[]} subordinates - 下级人员数据数组
 * @returns {void}
 * 
 * @complexity O(n) - n为下级人员数量，需要遍历所有人员
 * @flow 数据输入 → 统计重置 → 角色遍历 → 计数累加 → 结果更新
 * 
 * @example
 * ```typescript
 * const subordinates = [
 *   { role: 'manager', name: '张组长' },
 *   { role: 'sales', name: '李销售' },
 *   { role: 'agent', name: '王代理' }
 * ]
 * 
 * calculateTeamStats(subordinates)
 * // teamStats.value = {
 * //   total: 3,
 * //   managerCount: 1,
 * //   salesCount: 1,
 * //   agentCount: 1
 * // }
 * ```
 */
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

/**
 * 生成模拟业绩数据
 * 为演示目的生成随机的团队业绩数据（实际项目中应从API获取真实数据）
 * 
 * @function generateMockPerformanceData
 * @returns {void}
 * 
 * @complexity O(1) - 简单随机数生成，常数时间复杂度
 * @flow 随机计算 → 数据生成 → 状态更新 → 界面刷新
 * 
 * @todo 替换为真实的业绩数据API调用
 * @todo 添加业绩数据的缓存机制
 * 
 * @example
 * ```typescript
 * generateMockPerformanceData()
 * // teamPerformance.value = {
 * //   monthlyDeals: 15,        // 5-24 之间的随机值
 * //   monthlyAmount: 750000,   // 100000-1100000 之间的随机值
 * //   targetPercentage: 85     // 1-100 之间的随机值
 * // }
 * ```
 */
const generateMockPerformanceData = () => {
  teamPerformance.value = {
    monthlyDeals: Math.floor(Math.random() * 20) + 5,
    monthlyAmount: Math.floor(Math.random() * 1000000) + 100000,
    targetPercentage: Math.floor(Math.random() * 100) + 1
  };
};

/**
 * 获取上级人员信息
 * 从API获取当前节点的上级人员基本信息并更新显示状态
 * 
 * @async
 * @function fetchParentInfo
 * @returns {Promise<void>}
 * 
 * @complexity O(1) - API调用，常数时间复杂度（不考虑网络延迟）
 * @flow 上级检查 → 加载状态 → API调用 → 数据处理 → 错误处理
 * 
 * @example
 * ```typescript
 * // 节点选择时自动调用
 * await fetchParentInfo()
 * // 会更新 parentInfo.value 的所有字段
 * ```
 */
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

/**
 * 模拟获取人员信息的API
 * 为演示目的提供的模拟API函数（实际项目中应替换为真实API）
 * 
 * @async
 * @function getPersonnelById
 * @param {string} id - 人员ID
 * @returns {Promise<Object>} 模拟的API响应对象
 * 
 * @complexity O(1) - 简单模拟逻辑，常数时间复杂度
 * @flow ID输入 → 延迟模拟 → 角色判断 → 数据生成 → 响应返回
 * 
 * @todo 替换为真实的人员信息API调用
 * @todo 添加错误响应的模拟场景
 * 
 * @example
 * ```typescript
 * const response = await getPersonnelById('parent_001')
 * // 返回结构:
 * // {
 * //   data: {
 * //     code: 200,
 * //     success: true,
 * //     data: {
 * //       id: 'parent_001',
 * //       name: '张组长',
 * //       role: 'manager',
 * //       phone: '13800138000'
 * //     }
 * //   }
 * // }
 * ```
 */
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

/**
 * 监听节点变化
 * 当选中的节点发生变化时，自动加载相关数据并重置组件状态
 * 
 * @watcher nodeWatcher
 * @param {TreeNodeData | null} newNode - 新选中的节点数据
 * @returns {void}
 * 
 * @complexity O(1) - 触发异步函数调用，常数时间复杂度
 * @flow 节点变化 → 数据加载 → 状态重置 → 界面更新
 * 
 * @features
 * - 自动数据加载：新节点选中时加载下级和上级信息
 * - 状态重置：确保UI状态的正确性
 * - 空节点处理：清空所有数据和状态
 * - 立即执行：组件初始化时立即执行一次
 * 
 * @example
 * ```typescript
 * // 当用户在树形控件中选择不同节点时自动触发
 * selectedNode.value = newNode
 * // 监听器会自动：
 * // 1. 调用 fetchSubordinates() 获取下级
 * // 2. 调用 fetchParentInfo() 获取上级
 * // 3. 重置 showMore 和 showFullId 状态
 * // 4. 清空无效节点的数据
 * ```
 */
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