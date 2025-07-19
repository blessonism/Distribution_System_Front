import type { TreeNodeData } from '@/types/personnel';

const allPersonnel: TreeNodeData[] = [
  // 销售总监
  { id: 'director-1', name: '张总监', role: 'director', phone: '13800000001', parentId: null, hasChildren: true },

  // 销售组长
  { id: 'manager-1', name: '王组长', role: 'manager', phone: '13800000002', parentId: 'director-1', hasChildren: true },
  { id: 'manager-2', name: '李组长', role: 'manager', phone: '13800000003', parentId: 'director-1', hasChildren: true },

  // 销售
  { id: 'sales-1', name: '销售小赵', role: 'sales', phone: '13800000004', parentId: 'manager-1', hasChildren: true },
  { id: 'sales-2', name: '销售小钱', role: 'sales', phone: '13800000005', parentId: 'manager-1', hasChildren: false },
  { id: 'sales-3', name: '销售小孙', role: 'sales', phone: '13800000006', parentId: 'manager-2', hasChildren: true },

  // 代理
  { id: 'agent-1', name: '代理A', role: 'agent', phone: '13800000007', parentId: 'sales-1', hasChildren: false },
  { id: 'agent-2', name: '代理B', role: 'agent', phone: '13800000008', parentId: 'sales-3', hasChildren: false },
  { id: 'agent-3', name: '代理C', role: 'agent', phone: '13800000009', parentId: 'sales-3', hasChildren: false },
];

export default allPersonnel; 