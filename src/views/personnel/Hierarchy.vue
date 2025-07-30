<template>
  <div class="p-4 h-full">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
      <div class="md:col-span-1 bg-card border rounded-lg p-4 overflow-y-auto">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-semibold">团队层级</h2>
          <Button 
            variant="outline" 
            size="sm" 
            @click="refreshCurrentLevel"
            :disabled="isLoading"
            class="flex items-center gap-1"
          >
            <Loader2 v-if="isLoading" class="h-4 w-4 animate-spin" />
            <RefreshCw v-else class="h-4 w-4" />
            刷新
          </Button>
        </div>
        
        <!-- 层级选择器 -->
        <div class="mb-4">
          <div class="flex items-center space-x-2 mb-2">
            <p class="text-sm font-medium">当前层级:</p>
            <Badge>{{ currentLevelName }}</Badge>
          </div>

          <!-- 权限提示 -->
          <div v-if="getPermissionRestrictions().length > 0" class="mb-2 p-2 bg-muted/50 rounded text-xs text-muted-foreground">
            <p v-for="restriction in getPermissionRestrictions()" :key="restriction">
              {{ restriction }}
            </p>
          </div>

          <div class="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              @click="navigateToLevel('director')"
              :disabled="currentLevel === 'director' || !canViewLevel('director')"
              :class="{ 'opacity-50': !canViewLevel('director') }"
            >
              销售总监
            </Button>
            <Button
              variant="outline"
              size="sm"
              @click="navigateToLevel('manager')"
              :disabled="currentLevel === 'manager' || !canViewLevel('manager')"
              :class="{ 'opacity-50': !canViewLevel('manager') }"
            >
              销售组长
            </Button>
            <Button
              variant="outline"
              size="sm"
              @click="navigateToLevel('sales')"
              :disabled="currentLevel === 'sales' || !canViewLevel('sales')"
              :class="{ 'opacity-50': !canViewLevel('sales') }"
            >
              销售
            </Button>
            <Button
              variant="outline"
              size="sm"
              @click="navigateToLevel('agent')"
              :disabled="currentLevel === 'agent' || !canViewLevel('agent')"
              :class="{ 'opacity-50': !canViewLevel('agent') }"
            >
              代理
            </Button>
          </div>
        </div>
        
        <!-- 人员卡片列表 -->
        <div class="space-y-3">
          <Card 
            v-for="person in currentLevelPersonnel" 
            :key="person.id"
            class="cursor-pointer hover:bg-muted/50 transition-colors"
            :class="{'border-primary': selectedNode?.id === person.id}"
            @click="selectPerson(person)"
          >
            <CardHeader class="p-4 pb-2">
              <CardTitle class="text-base flex items-center justify-between">
                {{ person.name }}
                <Badge :variant="getBadgeVariant(person.role)">{{ roleMap[person.role] }}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent class="p-4 pt-0">
              <div class="text-sm text-muted-foreground">
                <p>电话: {{ person.phone }}</p>
                <div class="flex justify-between items-center mt-2">
                  <p v-if="person.hasChildren" class="text-xs">
                    {{ getChildrenCountText(person) }}
                  </p>
                  <Button 
                    v-if="person.hasChildren" 
                    variant="ghost" 
                    size="sm"
                    @click.stop="drillDown(person)"
                  >
                    查看下级
                    <ChevronRight class="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div v-if="isLoading" class="flex justify-center p-4">
            <Loader2 class="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
          
          <div v-else-if="currentLevelPersonnel.length === 0" class="p-4 text-center text-muted-foreground">
            暂无数据
          </div>
        </div>
        
        <!-- 返回上级按钮 -->
        <div v-if="navigationHistory.length > 0" class="mt-4">
          <Button variant="outline" @click="navigateBack" class="w-full">
            <ChevronLeft class="h-4 w-4 mr-1" />
            返回上级
          </Button>
        </div>
      </div>
      
      <div class="md:col-span-2">
        <NodeDetailCard :node="selectedNode" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, ChevronLeft, Loader2, RefreshCw } from 'lucide-vue-next';
import NodeDetailCard from '@/components/business/NodeDetailCard.vue';
import { getPersonnelChildren } from '@/api/personnel';
import type { TreeNodeData, PersonnelRole } from '@/types/personnel';
import { useToast } from '@/components/ui/toast/use-toast';
import type { ApiResponse } from '@/types/api';
import type { AxiosResponse } from 'axios';
import { useHierarchyPermission } from '@/composables/useHierarchyPermission';

const { toast } = useToast();

// 权限控制
const {
  hierarchyDataScope,
  hasHierarchyPermission,
  currentUserRole,
  canViewLevel,
  filterPersonnelData,
  getAccessibleLevels,
  getPermissionRestrictions
} = useHierarchyPermission();

// 状态
const currentLevelPersonnel = ref<TreeNodeData[]>([]);
const selectedNode = ref<TreeNodeData | null>(null);
const isLoading = ref(false);
const currentLevel = ref<PersonnelRole>('director');
const navigationHistory = ref<Array<{
  level: PersonnelRole, 
  parentId: string | null,
  selectedNodeId?: string
}>>([]);

// 添加缓存系统
const roleDataCache = ref<Record<PersonnelRole, Map<string, TreeNodeData>>>({
  director: new Map(),
  manager: new Map(),
  sales: new Map(),
  agent: new Map()
});

// 记录已请求过的父节点ID，避免重复请求
const fetchedParentIds = ref<Set<string | null>>(new Set());

// 记录每个层级最后选中的节点
const lastSelectedNodes = ref<Record<PersonnelRole, string | null>>({
  director: null,
  manager: null,
  sales: null,
  agent: null
});

// 映射
const roleMap: Record<PersonnelRole, string> = {
  director: '销售总监',
  manager: '销售组长',
  sales: '销售',
  agent: '代理',
};

const currentLevelName = computed(() => {
  return roleMap[currentLevel.value];
});

// 获取当前层级的人员数据
const fetchCurrentLevelData = async (parentId: string | null = null) => {
  isLoading.value = true;

  // 先检查缓存
  if (parentId !== null && fetchedParentIds.value.has(parentId)) {
    console.log(`使用缓存：父节点 ${parentId} 下的 ${currentLevel.value} 数据`);
    
    // 从缓存中筛选出当前层级且属于指定父节点的人员
    const cachedItems: TreeNodeData[] = [];
    roleDataCache.value[currentLevel.value].forEach(item => {
      if (item.parentId === parentId) {
        cachedItems.push(item);
      }
    });
    
    if (cachedItems.length > 0) {
      console.log(`从缓存中找到 ${cachedItems.length} 个 ${currentLevelName.value}`);
      currentLevelPersonnel.value = cachedItems;
      
      // 尝试恢复该层级上次选中的节点
      restoreSelectedNode();
      isLoading.value = false;
      return;
    }
  }

  try {
    console.log(`从服务器获取：父节点 ${parentId} 下的 ${currentLevel.value} 数据`);
    const res = await getPersonnelChildren(parentId);
    if (res.data.code === 200 || res.data.success) {
      // 过滤出当前层级的人员
      const levelPersonnel = res.data.data.filter((p: TreeNodeData) => p.role === currentLevel.value);

      // 应用权限过滤
      const filteredPersonnel = filterPersonnelData(levelPersonnel);
      currentLevelPersonnel.value = filteredPersonnel;
      
      // 更新缓存（使用过滤后的数据）
      filteredPersonnel.forEach(person => {
        roleDataCache.value[currentLevel.value].set(person.id, person);
      });
      
      // 标记该父节点已被请求
      if (parentId !== null) {
        fetchedParentIds.value.add(parentId);
      }
      
      // 尝试恢复该层级上次选中的节点
      restoreSelectedNode();
    } else {
      throw new Error(res.data.message || '请求失败');
    }
  } catch (error) {
    toast({
      title: '错误',
      description: '加载数据失败',
      variant: 'destructive',
    });
    currentLevelPersonnel.value = [];
    selectedNode.value = null;
  } finally {
    isLoading.value = false;
  }
};

// 恢复选中节点
const restoreSelectedNode = () => {
  const lastSelectedId = lastSelectedNodes.value[currentLevel.value];
  if (lastSelectedId) {
    const lastSelected = currentLevelPersonnel.value.find((p: TreeNodeData) => p.id === lastSelectedId);
    if (lastSelected) {
      selectedNode.value = lastSelected;
    } else {
      selectedNode.value = null;
    }
  } else {
    selectedNode.value = null;
  }
};

// 选择人员
const selectPerson = (person: TreeNodeData) => {
  selectedNode.value = person;
  // 记住当前层级选中的节点
  lastSelectedNodes.value[currentLevel.value] = person.id;
};

// 向下钻取到下一级
const drillDown = (person: TreeNodeData) => {
  if (!person.hasChildren) return;
  
  // 保存当前状态到历史记录，包括选中的节点ID
  navigationHistory.value.push({
    level: currentLevel.value,
    parentId: person.parentId,
    selectedNodeId: selectedNode.value?.id
  });
  
  // 根据当前层级确定下一层级
  const nextLevel = getNextLevel(currentLevel.value);
  if (nextLevel) {
    currentLevel.value = nextLevel;
    fetchCurrentLevelData(person.id);
  }
};

// 返回上一级
const navigateBack = () => {
  if (navigationHistory.value.length === 0) return;
  
  const lastNavigation = navigationHistory.value.pop();
  if (lastNavigation) {
    currentLevel.value = lastNavigation.level;
    fetchCurrentLevelData(lastNavigation.parentId);
    
    // 如果有保存的选中节点ID，尝试恢复选中状态
    if (lastNavigation.selectedNodeId) {
      // 在数据加载完成后尝试恢复选中状态
      setTimeout(() => {
        const previousSelected = currentLevelPersonnel.value.find(
          p => p.id === lastNavigation.selectedNodeId
        );
        if (previousSelected) {
          selectedNode.value = previousSelected;
        }
      }, 100);
    }
  }
};

// 直接导航到指定层级
const navigateToLevel = (level: PersonnelRole) => {
  if (level === currentLevel.value) return;

  // 检查权限
  if (!canViewLevel(level)) {
    toast({
      title: '权限不足',
      description: `您无权查看${roleMap[level]}层级`,
      variant: 'destructive',
    });
    return;
  }

  // 保存当前选中节点
  if (selectedNode.value) {
    lastSelectedNodes.value[currentLevel.value] = selectedNode.value.id;
  }
  
  // 清空历史记录
  navigationHistory.value = [];
  
  // 设置当前层级并获取数据
  currentLevel.value = level;
  
  // 根据层级确定获取方式
  if (level === 'director') {
    // 销售总监是顶层，直接获取
    fetchCurrentLevelData(null);
  } else {
    // 检查缓存中是否已有数据
    if (roleDataCache.value[level].size > 0) {
      console.log(`使用缓存：显示所有缓存的 ${roleMap[level]} 数据`);
      currentLevelPersonnel.value = Array.from(roleDataCache.value[level].values());
      restoreSelectedNode();
    } else {
      // 对于其他层级，需要获取所有该层级的人员
      fetchAllPersonnelByLevel(level);
    }
  }
};

// 监听层级变化，重置选中状态
watch(currentLevel, (newLevel, oldLevel) => {
  console.log(`层级从 ${oldLevel} 变为 ${newLevel}`);
  // 当层级变化时，尝试恢复该层级上次选中的节点
  const lastSelectedId = lastSelectedNodes.value[newLevel];
  if (lastSelectedId) {
    setTimeout(() => {
      const lastSelected = currentLevelPersonnel.value.find(p => p.id === lastSelectedId);
      if (lastSelected) {
        selectedNode.value = lastSelected;
      }
    }, 100);
  } else {
    selectedNode.value = null;
  }
});

// 获取指定层级的所有人员
const fetchAllPersonnelByLevel = async (level: PersonnelRole) => {
  isLoading.value = true;
  currentLevelPersonnel.value = []; // 清空当前数据，避免显示旧数据
  selectedNode.value = null; // 清空选中状态
  
  // 检查缓存中是否已有该层级的数据
  if (roleDataCache.value[level].size > 0) {
    console.log(`使用缓存中的 ${roleMap[level]} 数据，共 ${roleDataCache.value[level].size} 条`);
    currentLevelPersonnel.value = Array.from(roleDataCache.value[level].values());
    restoreSelectedNode();
    isLoading.value = false;
    return;
  }
  
  try {
    // 打印日志，帮助调试
    console.log(`开始获取 ${roleMap[level]} 层级的所有人员`);
    
    if (level === 'director') {
      // 直接获取所有销售总监
      const res = await getPersonnelChildren(null);
      if (res.data.code === 200 || res.data.success) {
        const directors = res.data.data.filter((p: TreeNodeData) => p.role === 'director');
        directors.forEach((d: TreeNodeData) => roleDataCache.value[level].set(d.id, d));
        currentLevelPersonnel.value = directors;
        console.log(`找到 ${directors.length} 个销售总监`);
      }
    } 
    else if (level === 'manager') {
      // 检查是否已有销售总监数据
      if (roleDataCache.value.director.size === 0) {
        // 获取所有销售总监
        const directorRes = await getPersonnelChildren(null);
        if (directorRes.data.code === 200 || directorRes.data.success) {
          const directors = directorRes.data.data.filter((p: TreeNodeData) => p.role === 'director');
          directors.forEach(d => roleDataCache.value.director.set(d.id, d));
          console.log(`找到 ${directors.length} 个销售总监，开始获取销售组长`);
          
          // 获取每个销售总监下的销售组长
          const managerPromises = directors
            .filter((d: TreeNodeData) => d.hasChildren)
            .map((director: TreeNodeData) => {
              // 检查是否已经请求过
              if (fetchedParentIds.value.has(director.id)) {
                return Promise.resolve(null); // 跳过已请求的
              }
              fetchedParentIds.value.add(director.id);
              return getPersonnelChildren(director.id);
            })
            .filter(p => p !== null); // 过滤掉跳过的请求
          
          const managerResults = await Promise.allSettled(managerPromises);
          
          managerResults.forEach((result) => {
            if (result.status === 'fulfilled' && result.value && 
                (result.value.data.code === 200 || result.value.data.success)) {
              const managers = result.value.data.data.filter((p: TreeNodeData) => p.role === 'manager');
              managers.forEach((m: TreeNodeData) => roleDataCache.value.manager.set(m.id, m));
            }
          });
          
          currentLevelPersonnel.value = Array.from(roleDataCache.value.manager.values());
          console.log(`找到 ${currentLevelPersonnel.value.length} 个销售组长`);
        }
      } else {
        // 已有销售总监数据，直接获取所有销售组长
        const directors = Array.from(roleDataCache.value.director.values());
        console.log(`从缓存中找到 ${directors.length} 个销售总监，开始获取销售组长`);
        
        // 获取每个销售总监下的销售组长
        const managerPromises = directors
          .filter((d: TreeNodeData) => d.hasChildren)
          .map((director: TreeNodeData) => {
            // 检查是否已经请求过
            if (fetchedParentIds.value.has(director.id)) {
              return Promise.resolve(null); // 跳过已请求的
            }
            fetchedParentIds.value.add(director.id);
            return getPersonnelChildren(director.id);
          })
          .filter(p => p !== null); // 过滤掉跳过的请求
        
        if (managerPromises.length > 0) {
          const managerResults = await Promise.allSettled(managerPromises);
          
          managerResults.forEach((result) => {
            if (result.status === 'fulfilled' && result.value && 
                (result.value.data.code === 200 || result.value.data.success)) {
              const managers = result.value.data.data.filter((p: TreeNodeData) => p.role === 'manager');
              managers.forEach((m: TreeNodeData) => roleDataCache.value.manager.set(m.id, m));
            }
          });
        }
        
        currentLevelPersonnel.value = Array.from(roleDataCache.value.manager.values());
        console.log(`找到 ${currentLevelPersonnel.value.length} 个销售组长`);
      }
    } 
    else if (level === 'sales') {
      // 检查是否已有销售组长数据
      if (roleDataCache.value.manager.size === 0) {
        await fetchAllPersonnelByLevel('manager'); // 先获取销售组长
      }
      
      // 已有销售组长数据，开始获取销售
      const managers = Array.from(roleDataCache.value.manager.values());
      console.log(`从缓存中找到 ${managers.length} 个销售组长，开始获取销售`);
      
      // 获取每个销售组长下的销售
      const salesPromises = managers
        .filter((m: TreeNodeData) => m.hasChildren)
        .map((manager: TreeNodeData) => {
          // 检查是否已经请求过
          if (fetchedParentIds.value.has(manager.id)) {
            return Promise.resolve(null); // 跳过已请求的
          }
          fetchedParentIds.value.add(manager.id);
          return getPersonnelChildren(manager.id);
        })
        .filter(p => p !== null); // 过滤掉跳过的请求
      
      if (salesPromises.length > 0) {
        const salesResults = await Promise.allSettled(salesPromises);
        
        salesResults.forEach((result) => {
          if (result.status === 'fulfilled' && result.value && 
              (result.value.data.code === 200 || result.value.data.success)) {
            const salesList = result.value.data.data.filter((p: TreeNodeData) => p.role === 'sales');
            salesList.forEach((s: TreeNodeData) => roleDataCache.value.sales.set(s.id, s));
          }
        });
      }
      
      currentLevelPersonnel.value = Array.from(roleDataCache.value.sales.values());
      console.log(`找到 ${currentLevelPersonnel.value.length} 个销售`);
    }
    
    // 尝试恢复该层级上次选中的节点
    restoreSelectedNode();
    
  } catch (error) {
    console.error('获取数据失败:', error);
    toast({
      title: '错误',
      description: '加载数据失败',
      variant: 'destructive',
    });
    currentLevelPersonnel.value = [];
  } finally {
    isLoading.value = false;
  }
};

// 清除特定层级的缓存数据
const clearLevelCache = (level: PersonnelRole) => {
  console.log(`清除 ${roleMap[level]} 层级的缓存数据`);
  roleDataCache.value[level].clear();
  if (level === 'director') {
    // 清除顶层缓存时，同时清除所有子层级缓存
    roleDataCache.value.manager.clear();
    roleDataCache.value.sales.clear();
    roleDataCache.value.agent.clear();
    fetchedParentIds.value.clear();
  } else if (level === 'manager') {
    // 清除中间层缓存时，同时清除所有子层级缓存
    roleDataCache.value.sales.clear();
    roleDataCache.value.agent.clear();
    // 移除所有销售组长的父节点ID
    const managers = Array.from(roleDataCache.value.manager.values());
    managers.forEach(m => {
      if (m.parentId) {
        fetchedParentIds.value.delete(m.parentId);
      }
    });
  }
};

// 刷新数据按钮的处理函数
const refreshCurrentLevel = () => {
  clearLevelCache(currentLevel.value);
  if (currentLevel.value === 'director') {
    fetchCurrentLevelData(null);
  } else {
    fetchAllPersonnelByLevel(currentLevel.value);
  }
};

// 获取下一级层级
const getNextLevel = (currentLevel: PersonnelRole): PersonnelRole | null => {
  const levels: PersonnelRole[] = ['director', 'manager', 'sales', 'agent'];
  const currentIndex = levels.indexOf(currentLevel);
  
  if (currentIndex < levels.length - 1) {
    return levels[currentIndex + 1];
  }
  
  return null;
};

// 获取子节点数量文本
const getChildrenCountText = (person: TreeNodeData) => {
  const nextLevel = getNextLevel(person.role);
  if (!nextLevel) return '';
  
  return `有下属${roleMap[nextLevel]}`;
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

// 初始化
onMounted(() => {
  // 检查基本权限
  if (!hasHierarchyPermission.value) {
    toast({
      title: '权限不足',
      description: '您无权访问层级关系功能',
      variant: 'destructive',
    });
    return;
  }

  // 根据用户角色设置初始层级
  const accessibleLevels = getAccessibleLevels();
  if (accessibleLevels.length > 0) {
    // 设置为用户可访问的最高层级
    currentLevel.value = accessibleLevels[0];
  }

  fetchCurrentLevelData();
});
</script> 