<template>
  <div class="p-4 h-full">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
      <div class="md:col-span-1 bg-card border rounded-lg p-4 overflow-y-auto">
        <h2 class="text-lg font-semibold mb-4">团队层级</h2>
        <PersonnelTree
          :nodes="treeData"
          :expanded-node-ids="expandedNodeIds"
          @toggle="handleToggle"
          @select="handleSelect"
        />
      </div>
      <div class="md:col-span-2">
        <NodeDetailCard :node="selectedNode" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import PersonnelTree from '@/components/business/PersonnelTree.vue';
import NodeDetailCard from '@/components/business/NodeDetailCard.vue';
import { getPersonnelChildren } from '@/api/personnel';
import type { TreeNodeData } from '@/types/personnel';
import { useToast } from '@/components/ui/toast/use-toast';

const { toast } = useToast();

const treeData = ref<TreeNodeData[]>([]);
const expandedNodeIds = ref<Set<string>>(new Set());
const selectedNode = ref<TreeNodeData | null>(null);

const findNodeAndApply = (nodes: TreeNodeData[], nodeId: string, callback: (node: TreeNodeData) => void): boolean => {
  for (const node of nodes) {
    if (node.id === nodeId) {
      callback(node);
      return true;
    }
    if (node.children) {
      if (findNodeAndApply(node.children, nodeId, callback)) {
        return true;
      }
    }
  }
  return false;
};

const loadChildren = async (node: TreeNodeData) => {
  if (node.children) return;

  findNodeAndApply(treeData.value, node.id, n => n.isLoading = true);
  
  try {
    const res = await getPersonnelChildren(node.id);
    if (res.data.code === 200 || res.data.success) {
      findNodeAndApply(treeData.value, node.id, n => {
        n.children = res.data.data;
        n.isLoading = false;
      });
    } else {
      throw new Error(res.data.message || '请求失败');
    }
  } catch (error) {
    toast({
      title: '错误',
      description: '加载子节点失败',
      variant: 'destructive',
    });
    findNodeAndApply(treeData.value, node.id, n => n.isLoading = false);
  }
};

const handleToggle = async (node: TreeNodeData) => {
  if (expandedNodeIds.value.has(node.id)) {
    expandedNodeIds.value.delete(node.id);
  } else {
    expandedNodeIds.value.add(node.id);
    if (node.hasChildren) {
      await loadChildren(node);
    }
  }
};

const handleSelect = (node: TreeNodeData) => {
  selectedNode.value = node;
};

onMounted(async () => {
  try {
    const res = await getPersonnelChildren();
    if (res.data.code === 200 || res.data.success) {
      treeData.value = res.data.data;
    } else {
      throw new Error(res.data.message || '请求失败');
    }
  } catch (error) {
    toast({
      title: '错误',
      description: '加载初始数据失败',
      variant: 'destructive',
    });
  }
});
</script> 