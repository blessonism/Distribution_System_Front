import type { TreeNodeData } from '@/types/personnel';

const allPersonnel: TreeNodeData[] = [
  // 销售总监
  { id: 'director-1', name: '张总监', role: 'director', phone: '13800000001', parentId: null, hasChildren: true },
  { id: 'director-2', name: '刘总监', role: 'director', phone: '13800000010', parentId: null, hasChildren: true },

  // 销售组长
  { id: 'manager-1', name: '王组长', role: 'manager', phone: '13800000002', parentId: 'director-1', hasChildren: true },
  { id: 'manager-2', name: '李组长', role: 'manager', phone: '13800000003', parentId: 'director-1', hasChildren: true },
  { id: 'manager-3', name: '陈组长', role: 'manager', phone: '13800000011', parentId: 'director-2', hasChildren: true },

  // 销售
  { id: 'sales-1', name: '销售小赵', role: 'sales', phone: '13800000004', parentId: 'manager-1', hasChildren: true },
  { id: 'sales-2', name: '销售小钱', role: 'sales', phone: '13800000005', parentId: 'manager-1', hasChildren: true },
  { id: 'sales-3', name: '销售小孙', role: 'sales', phone: '13800000006', parentId: 'manager-2', hasChildren: true },
  { id: 'sales-4', name: '销售小周', role: 'sales', phone: '13800000012', parentId: 'manager-2', hasChildren: false },
  { id: 'sales-5', name: '销售小吴', role: 'sales', phone: '13800000013', parentId: 'manager-3', hasChildren: true },
  
  // 销售组长下的直系代理（新增）
  { id: 'agent-4', name: '直系代理D', role: 'agent', phone: '13800000014', parentId: 'manager-1', hasChildren: false },
  { id: 'agent-5', name: '直系代理E', role: 'agent', phone: '13800000015', parentId: 'manager-1', hasChildren: false },
  { id: 'agent-6', name: '直系代理F', role: 'agent', phone: '13800000016', parentId: 'manager-2', hasChildren: false },
  { id: 'agent-7', name: '直系代理G', role: 'agent', phone: '13800000017', parentId: 'manager-3', hasChildren: false },
  { id: 'agent-8', name: '直系代理H', role: 'agent', phone: '13800000018', parentId: 'manager-3', hasChildren: false },

  // 销售下的代理
  { id: 'agent-1', name: '代理A', role: 'agent', phone: '13800000007', parentId: 'sales-1', hasChildren: false },
  { id: 'agent-2', name: '代理B', role: 'agent', phone: '13800000008', parentId: 'sales-3', hasChildren: false },
  { id: 'agent-3', name: '代理C', role: 'agent', phone: '13800000009', parentId: 'sales-3', hasChildren: false },
  { id: 'agent-9', name: '代理I', role: 'agent', phone: '13800000019', parentId: 'sales-5', hasChildren: false },
  { id: 'agent-10', name: '代理J', role: 'agent', phone: '13800000020', parentId: 'sales-5', hasChildren: false },
];

export default allPersonnel; 