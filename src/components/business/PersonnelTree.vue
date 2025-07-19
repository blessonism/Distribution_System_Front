<template>
  <div>
    <div v-for="node in nodes" :key="node.id" class="relative">
      <TreeNode
        :node="node"
        :is-expanded="expandedNodeIds.has(node.id)"
        @toggle="emit('toggle', node)"
        @select="emit('select', node)"
      />
      <div v-if="expandedNodeIds.has(node.id) && node.children && node.children.length > 0" class="pl-6">
        <PersonnelTree
          :nodes="node.children"
          :expanded-node-ids="expandedNodeIds"
          @toggle="emit('toggle', $event)"
          @select="emit('select', $event)"
        />
      </div>
      <div v-else-if="expandedNodeIds.has(node.id) && node.isLoading" class="pl-10 py-2">
        <p class="text-sm text-muted-foreground animate-pulse">加载中...</p>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
// This is needed for recursive components in <script setup>
export default {
  name: 'PersonnelTree',
};
</script>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';
import type { TreeNodeData } from '@/types/personnel';
import TreeNode from './TreeNode.vue';

defineProps<{
  nodes: TreeNodeData[];
  expandedNodeIds: Set<string>;
}>();

const emit = defineEmits<{
  (e: 'toggle', node: TreeNodeData): void;
  (e: 'select', node: TreeNodeData): void;
}>();
</script> 