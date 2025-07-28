<!--
/**
 * @fileoverview 递归树形节点单元组件
 * 基于Vue 3 Composition API构建的可交互树形节点组件，用于PersonnelTree中的单个节点渲染
 * 支持展开/收缩控制、节点选择交互、头像展示和角色映射显示
 * 集成Tailwind CSS样式和shadcn-vue组件，提供现代化的节点视觉效果
 * 
 * @component TreeNode
 * @author Frontend Team  
 * @since 1.0.0
 * @version 1.0.1
 * 
 * @description
 * TreeNode是PersonnelTree组件系统中的核心单元组件，负责渲染组织架构中的单个人员节点
 * 主要功能包括：
 * - 🔽 展开/收缩控制，支持子节点的显示切换
 * - 👤 人员信息展示，包含头像、姓名和角色标识
 * - 🎯 节点选择交互，支持点击选中和事件传递
 * - 🎨 响应式悬停效果，提升用户交互体验
 * - 📱 移动端适配，确保在不同设备上的正常显示
 * 
 * @usage
 * ```vue
 * <template>
 *   <TreeNode
 *     :node="personnelNode"
 *     :is-expanded="expandedStatus"
 *     @toggle="handleToggle"
 *     @select="handleSelect"
 *   />
 * </template>
 * ```
 * 
 * @example
 * ```typescript
 * // 基础使用示例
 * const nodeData: TreeNodeData = {
 *   id: '001',
 *   name: '张经理',
 *   role: 'manager',
 *   phone: '13800138000',
 *   parentId: null,
 *   hasChildren: true
 * }
 * 
 * function handleToggle(node: TreeNodeData) {
 *   console.log('切换节点:', node.name)
 * }
 * 
 * function handleSelect(node: TreeNodeData) {
 *   console.log('选择节点:', node.name)
 * }
 * ```
 */
-->
<template>
  <div class="flex items-center space-x-2 p-2 rounded-md hover:bg-muted/50 transition-colors cursor-pointer">
    <div @click="toggle" class="w-6 text-center">
      <ChevronRight
        v-if="node.hasChildren"
        :class="['h-4 w-4 text-muted-foreground transition-transform', isExpanded && 'rotate-90']"
      />
    </div>

    <div @click="selectNode" class="flex-1 flex items-center space-x-2">
      <Avatar size="sm">
        <AvatarImage :src="getAvatarUrl(node.role)" />
        <AvatarFallback>{{ node.name.charAt(0) }}</AvatarFallback>
      </Avatar>
      <div>
        <p class="font-medium text-sm">{{ node.name }}</p>
        <p class="text-xs text-muted-foreground">{{ roleMap[node.role] }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * @fileoverview TreeNode组件的核心逻辑实现
 * 使用Vue 3 Composition API实现单个树形节点的交互控制和数据展示
 */
import { defineProps, defineEmits, computed } from 'vue';
import type { TreeNodeData, PersonnelRole } from '@/types/personnel';
import { ChevronRight } from 'lucide-vue-next';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

/**
 * 组件属性定义
 * 定义TreeNode组件的输入属性，包含节点数据和展开状态
 * 
 * @interface Props
 * 
 * @property {TreeNodeData} node - 树节点数据对象，包含人员信息和层级关系
 * @property {boolean} isExpanded - 节点展开状态，控制子节点的显示/隐藏
 * 
 * @example
 * ```typescript
 * const props = {
 *   node: {
 *     id: '001',
 *     name: '张经理',
 *     role: 'manager',
 *     phone: '13800138000',
 *     parentId: null,
 *     hasChildren: true
 *   },
 *   isExpanded: false
 * }
 * ```
 */
const props = defineProps<{
  /** 树节点数据对象 */
  node: TreeNodeData;
  /** 节点展开状态 */
  isExpanded: boolean;
}>();

/**
 * 组件事件定义
 * 定义TreeNode组件对外发出的事件，支持节点操作的事件传递
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
 *   if (node.hasChildren) {
 *     // 切换子节点展开状态
 *     expandedNodes.value.toggle(node.id)
 *   }
 * }
 * 
 * function handleSelect(node: TreeNodeData) {
 *   // 设置选中节点
 *   selectedNode.value = node
 *   // 显示节点详情
 *   showNodeDetails(node)
 * }
 * ```
 */
const emit = defineEmits<{
  (e: 'toggle', node: TreeNodeData): void;
  (e: 'select', node: TreeNodeData): void;
}>();

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
 * // 获取角色显示名称
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
 * 根据用户角色返回对应的头像图片地址，当前返回空字符串使用默认头像
 * 
 * @function getAvatarUrl
 * @param {PersonnelRole} role - 用户角色标识
 * @returns {string} 头像图片URL地址
 * 
 * @complexity O(1) - 简单条件判断，常数时间复杂度
 * @flow 角色输入 → 条件匹配 → URL返回 → 头像显示
 * 
 * @example
 * ```typescript
 * // 获取不同角色的头像
 * const directorAvatar = getAvatarUrl('director') // '' (使用默认头像)
 * const managerAvatar = getAvatarUrl('manager')  // '' (使用默认头像)
 * 
 * // 扩展示例 - 可能的实现
 * const getAvatarUrl = (role: PersonnelRole) => {
 *   const avatarMap = {
 *     director: '/avatars/director.png',
 *     manager: '/avatars/manager.png',
 *     sales: '/avatars/sales.png',
 *     agent: '/avatars/agent.png'
 *   }
 *   return avatarMap[role] || '/avatars/default.png'
 * }
 * ```
 * 
 * @todo 实现基于角色的头像映射逻辑
 * @todo 添加头像加载失败的降级处理
 */
const getAvatarUrl = (role: PersonnelRole) => {
  // TODO: 实现基于角色的头像URL映射
  return ''; 
};

/**
 * 处理节点展开/收缩操作
 * 当用户点击展开图标时，检查节点是否有子节点，如有则发出toggle事件
 * 
 * @function toggle
 * @returns {void}
 * 
 * @complexity O(1) - 简单条件检查和事件发出，常数时间复杂度
 * @flow 点击触发 → 子节点检查 → 事件发出 → 父组件处理
 * 
 * @example
 * ```typescript
 * // 使用示例
 * // 用户点击展开图标时自动调用
 * // 只有hasChildren为true的节点才会发出事件
 * 
 * // 父组件中的处理
 * function handleToggle(node: TreeNodeData) {
 *   if (expandedNodes.has(node.id)) {
 *     expandedNodes.delete(node.id)
 *   } else {
 *     expandedNodes.add(node.id)
 *     // 如果需要动态加载子节点
 *     if (!node.children) {
 *       loadChildNodes(node.id)
 *     }
 *   }
 * }
 * ```
 */
const toggle = () => {
  if (props.node.hasChildren) {
    emit('toggle', props.node);
  }
};

/**
 * 处理节点选择操作
 * 当用户点击节点内容区域时，发出select事件通知父组件
 * 
 * @function selectNode
 * @returns {void}
 * 
 * @complexity O(1) - 直接事件发出，常数时间复杂度
 * @flow 点击触发 → 事件发出 → 父组件处理 → 状态更新
 * 
 * @example
 * ```typescript
 * // 使用示例
 * // 用户点击节点内容区域时自动调用
 * 
 * // 父组件中的处理
 * function handleSelect(node: TreeNodeData) {
 *   selectedNodeId.value = node.id
 *   selectedNodeInfo.value = {
 *     name: node.name,
 *     role: node.role,
 *     phone: node.phone
 *   }
 *   
 *   // 显示节点详细信息
 *   showNodeDetails.value = true
 *   
 *   // 高亮选中节点
 *   highlightNode(node.id)
 * }
 * ```
 */
const selectNode = () => {
  emit('select', props.node);
};
</script> 