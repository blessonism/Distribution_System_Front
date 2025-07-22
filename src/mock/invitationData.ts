import type { InvitationCode, InvitationRecord, InvitationStats } from '@/types/invitation'
import type { UserRole } from '@/types/api'
import dayjs from 'dayjs'

// 生成随机邀请码
function generateInviteCode(length: number = 8): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// 生成随机日期
function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

// 模拟邀请码数据
export const mockInvitationCodes: InvitationCode[] = [
  // 超级管理员的邀请码
  {
    id: '1',
    userId: '1',
    code: generateInviteCode(),
    targetRole: 'director',
    status: 'active',
    usageCount: 2,
    maxUsage: 5,
    expiresAt: dayjs().add(30, 'day').toISOString(),
    createdAt: dayjs().subtract(15, 'day').toISOString(),
    updatedAt: dayjs().toISOString()
  },
  {
    id: '2',
    userId: '1',
    code: generateInviteCode(),
    targetRole: 'leader',
    status: 'active',
    usageCount: 3,
    maxUsage: 5,
    expiresAt: dayjs().add(15, 'day').toISOString(),
    createdAt: dayjs().subtract(20, 'day').toISOString(),
    updatedAt: dayjs().toISOString()
  },
  {
    id: '3',
    userId: '1',
    code: generateInviteCode(),
    targetRole: 'sales',
    status: 'active',
    usageCount: 1,
    maxUsage: 5,
    expiresAt: dayjs().add(30, 'day').toISOString(),
    createdAt: dayjs().subtract(10, 'day').toISOString(),
    updatedAt: dayjs().toISOString()
  },
  {
    id: '4',
    userId: '1',
    code: generateInviteCode(),
    targetRole: 'agent',
    status: 'active',
    usageCount: 5,
    maxUsage: 10,
    expiresAt: dayjs().add(60, 'day').toISOString(),
    createdAt: dayjs().subtract(5, 'day').toISOString(),
    updatedAt: dayjs().toISOString()
  },
  
  // 销售总监的邀请码
  {
    id: '5',
    userId: '2',
    code: generateInviteCode(),
    targetRole: 'leader',
    status: 'active',
    usageCount: 1,
    maxUsage: 3,
    expiresAt: dayjs().add(20, 'day').toISOString(),
    createdAt: dayjs().subtract(12, 'day').toISOString(),
    updatedAt: dayjs().toISOString()
  },
  {
    id: '6',
    userId: '2',
    code: generateInviteCode(),
    targetRole: 'sales',
    status: 'active',
    usageCount: 2,
    maxUsage: 5,
    expiresAt: dayjs().add(25, 'day').toISOString(),
    createdAt: dayjs().subtract(8, 'day').toISOString(),
    updatedAt: dayjs().toISOString()
  },
  {
    id: '7',
    userId: '2',
    code: generateInviteCode(),
    targetRole: 'agent',
    status: 'inactive',
    usageCount: 3,
    maxUsage: 3,
    createdAt: dayjs().subtract(30, 'day').toISOString(),
    updatedAt: dayjs().subtract(1, 'day').toISOString()
  },
  
  // 销售组长的邀请码
  {
    id: '8',
    userId: '3',
    code: generateInviteCode(),
    targetRole: 'sales',
    status: 'active',
    usageCount: 1,
    maxUsage: 2,
    expiresAt: dayjs().add(15, 'day').toISOString(),
    createdAt: dayjs().subtract(15, 'day').toISOString(),
    updatedAt: dayjs().toISOString()
  },
  {
    id: '9',
    userId: '3',
    code: generateInviteCode(),
    targetRole: 'agent',
    status: 'active',
    usageCount: 4,
    maxUsage: 10,
    expiresAt: dayjs().add(40, 'day').toISOString(),
    createdAt: dayjs().subtract(10, 'day').toISOString(),
    updatedAt: dayjs().toISOString()
  },
  
  // 销售人员的邀请码
  {
    id: '10',
    userId: '4',
    code: generateInviteCode(),
    targetRole: 'agent',
    status: 'active',
    usageCount: 2,
    maxUsage: 5,
    expiresAt: dayjs().add(20, 'day').toISOString(),
    createdAt: dayjs().subtract(7, 'day').toISOString(),
    updatedAt: dayjs().toISOString()
  }
]

// 模拟邀请历史数据
export const mockInvitationHistory: InvitationRecord[] = [
  // 超级管理员的邀请记录
  {
    id: '1',
    inviterId: '1',
    inviterName: '系统管理员',
    inviteeId: '2',
    inviteeName: '张总监',
    inviteCode: mockInvitationCodes[0].code,
    targetRole: 'director',
    actualRole: 'director',
    registeredAt: dayjs().subtract(14, 'day').toISOString(),
    status: 'completed'
  },
  {
    id: '2',
    inviterId: '1',
    inviterName: '系统管理员',
    inviteeId: '3',
    inviteeName: '李组长',
    inviteCode: mockInvitationCodes[1].code,
    targetRole: 'leader',
    actualRole: 'leader',
    registeredAt: dayjs().subtract(18, 'day').toISOString(),
    status: 'completed'
  },
  {
    id: '3',
    inviterId: '1',
    inviterName: '系统管理员',
    inviteeId: '4',
    inviteeName: '王销售',
    inviteCode: mockInvitationCodes[2].code,
    targetRole: 'sales',
    actualRole: 'sales',
    registeredAt: dayjs().subtract(9, 'day').toISOString(),
    status: 'completed'
  },
  {
    id: '4',
    inviterId: '1',
    inviterName: '系统管理员',
    inviteeId: '5',
    inviteeName: '赵代理',
    inviteCode: mockInvitationCodes[3].code,
    targetRole: 'agent',
    actualRole: 'agent',
    registeredAt: dayjs().subtract(4, 'day').toISOString(),
    status: 'completed'
  },
  
  // 销售总监的邀请记录
  {
    id: '5',
    inviterId: '2',
    inviterName: '张总监',
    inviteeId: '6',
    inviteeName: '陈组长',
    inviteCode: mockInvitationCodes[4].code,
    targetRole: 'leader',
    actualRole: 'leader',
    registeredAt: dayjs().subtract(10, 'day').toISOString(),
    status: 'completed'
  },
  {
    id: '6',
    inviterId: '2',
    inviterName: '张总监',
    inviteeId: '7',
    inviteeName: '吴代理',
    inviteCode: mockInvitationCodes[6].code,
    targetRole: 'agent',
    actualRole: 'agent',
    registeredAt: dayjs().subtract(29, 'day').toISOString(),
    status: 'completed'
  },
  
  // 更多邀请记录
  {
    id: '7',
    inviterId: '3',
    inviterName: '李组长',
    inviteeId: '8',
    inviteeName: '周代理',
    inviteCode: mockInvitationCodes[8].code,
    targetRole: 'agent',
    actualRole: 'agent',
    registeredAt: dayjs().subtract(8, 'day').toISOString(),
    status: 'completed'
  },
  {
    id: '8',
    inviterId: '4',
    inviterName: '王销售',
    inviteeId: '9',
    inviteeName: '郑代理',
    inviteCode: mockInvitationCodes[9].code,
    targetRole: 'agent',
    actualRole: 'agent',
    registeredAt: dayjs().subtract(5, 'day').toISOString(),
    status: 'completed'
  },
  
  // 待确认邀请
  {
    id: '9',
    inviterId: '1',
    inviterName: '系统管理员',
    inviteeId: '',
    inviteeName: '未知用户',
    inviteCode: mockInvitationCodes[0].code,
    targetRole: 'director',
    actualRole: 'director',
    registeredAt: dayjs().subtract(1, 'day').toISOString(),
    status: 'pending'
  },
  {
    id: '10',
    inviterId: '2',
    inviterName: '张总监',
    inviteeId: '',
    inviteeName: '未知用户',
    inviteCode: mockInvitationCodes[5].code,
    targetRole: 'sales',
    actualRole: 'sales',
    registeredAt: dayjs().subtract(2, 'day').toISOString(),
    status: 'pending'
  }
]

// 模拟邀请统计数据
export const mockInvitationStats: InvitationStats = {
  totalInvites: mockInvitationHistory.length,
  monthlyInvites: mockInvitationHistory.filter(invite => 
    dayjs(invite.registeredAt).isAfter(dayjs().startOf('month'))
  ).length,
  roleBreakdown: mockInvitationHistory.reduce((acc, invite) => {
    const role = invite.actualRole
    acc[role] = (acc[role] || 0) + 1
    return acc
  }, {} as Record<UserRole, number>),
  recentInvites: mockInvitationHistory
    .filter(invite => dayjs(invite.registeredAt).isAfter(dayjs().subtract(30, 'day')))
    .slice(0, 5),
  conversionRate: 80 // 假设80%的转化率
} 