<!--
/**
 * @fileoverview 递归人员组织架构树组件
 * 基于Vue 3 Composition API构建的可递归组织架构树组件，支持动态加载、展开收缩和节点选择
 * 用于展示分销系统中的多层级人员组织结构，支持懒加载和层级导航
 * 集成加载状态管理、节点交互控制和有序展示等高级功能
 * 
 * @component PersonnelTree
 * @author Frontend Team  
 * @since 1.0.0
 * @version 1.1.0
 */
-->
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
/**
 * @fileoverview PersonnelTree组件的核心逻辑实现
 * 使用Vue 3 Composition API实现递归组织架构树
 */
import { defineProps, defineEmits } from 'vue';
import type { TreeNodeData } from '@/types/personnel';
import TreeNode from './TreeNode.vue';

/**
 * 组件属性定义
 * 定义人员树组件的输入属性，支持节点数据和展开状态管理
 * 
 * @interface Props
 * 
 * @property {TreeNodeData[]} nodes - 树节点数据数组，包含当前层级的所有节点
 * @property {Set<string>} expandedNodeIds - 已展开节点ID集合，用于控制节点的展开/收缩状态
 * 
 * @example
 * ```typescript
 * const props = {
 *   nodes: [
 *     {
 *       id: '1',
 *       name: '总经理',
 *       role: 'director',
 *       phone: '13800138000',
 *       parentId: null,
 *       hasChildren: true,
 *       children: [...]
 *     }
 *   ],
 *   expandedNodeIds: new Set(['1', '2'])
 * }
 * ```
 */
defineProps<{
  /** 树节点数据数组 */
  nodes: TreeNodeData[];
  /** 已展开节点ID集合 */
  expandedNodeIds: Set<string>;
}>();

/**
 * 组件事件定义
 * 定义人员树组件对外发出的事件，支持节点操作的事件传递
 * 
 * @events
 * 
 * @event toggle - 节点展开/收缩事件，参数为被操作的节点数据
 * @event select - 节点选择事件，参数为被选中的节点数据
 * 
 * @example
 * ```typescript
 * // 事件处理示例
 * function handleToggle(node: TreeNodeData) {
 *   if (expandedIds.value.has(node.id)) {
 *     expandedIds.value.delete(node.id)
 *   } else {
 *     expandedIds.value.add(node.id)
 *     // 如果需要加载子节点
 *     if (node.hasChildren && !node.children) {
 *       loadChildren(node.id)
 *     }
 *   }
 * }
 * 
 * function handleSelect(node: TreeNodeData) {
 *   selectedNode.value = node
 *   // 更新详情面板或执行其他逻辑
 * }
 * ```
 */

const emit = defineEmits<{
  (e: 'toggle', node: TreeNodeData): void;
  (e: 'select', node: TreeNodeData): void;
}>();
</script> 