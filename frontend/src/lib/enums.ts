import type {
  RarityLevel,
  BorrowingStatus,
  RequestStatus,
  StepType,
  StepStatus,
  ReviewDecision,
  UserRole,
  ImageType,
  RestrictionType,
} from '$types';

export const rarityLevelLabels: Record<RarityLevel, { name: string; color: string; bgColor: string }> = {
  common: { name: '普通', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  rare: { name: '善本', color: 'text-blue-600', bgColor: 'bg-blue-50' },
  precious: { name: '珍贵', color: 'text-orange-600', bgColor: 'bg-orange-50' },
  national_treasure: { name: '国宝级', color: 'text-red-600', bgColor: 'bg-red-50' },
};

export const borrowingStatusLabels: Record<
  BorrowingStatus,
  { name: string; color: string; bgColor: string }
> = {
  available: { name: '可借阅', color: 'text-green-600', bgColor: 'bg-green-50' },
  restricted: { name: '限制借阅', color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
  under_restoration: { name: '修复中', color: 'text-blue-600', bgColor: 'bg-blue-50' },
  permanently_restricted: { name: '永久限制', color: 'text-red-600', bgColor: 'bg-red-50' },
};

export const requestStatusLabels: Record<
  RequestStatus,
  { name: string; color: string; bgColor: string }
> = {
  draft: { name: '草稿', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  submitted: { name: '已提交', color: 'text-blue-600', bgColor: 'bg-blue-50' },
  approved: { name: '已批准', color: 'text-green-600', bgColor: 'bg-green-50' },
  in_progress: { name: '修复中', color: 'text-cyan-600', bgColor: 'bg-cyan-50' },
  steps_completed: { name: '工序完成', color: 'text-teal-600', bgColor: 'bg-teal-50' },
  review_pending: { name: '待评审', color: 'text-orange-600', bgColor: 'bg-orange-50' },
  review_approved: { name: '评审通过', color: 'text-green-600', bgColor: 'bg-green-50' },
  review_rejected: { name: '评审驳回', color: 'text-red-600', bgColor: 'bg-red-50' },
  completed: { name: '已完成', color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
  cancelled: { name: '已取消', color: 'text-gray-500', bgColor: 'bg-gray-100' },
};

export const stepTypeLabels: Record<StepType, { name: string; order: number; description: string }> = {
  deacidification: {
    name: '脱酸',
    order: 1,
    description: '使用碱性溶液去除纸张酸性物质，延长纸张寿命',
  },
  paper_mending: {
    name: '补纸',
    order: 2,
    description: '使用合适的补纸材料修复破损页面',
  },
  binding: {
    name: '装帧',
    order: 3,
    description: '重新装订书籍，包括线装、包角等工艺',
  },
};

export const stepStatusLabels: Record<
  StepStatus,
  { name: string; color: string; bgColor: string }
> = {
  pending: { name: '待执行', color: 'text-gray-500', bgColor: 'bg-gray-100' },
  in_progress: { name: '执行中', color: 'text-blue-600', bgColor: 'bg-blue-50' },
  completed: { name: '已完成', color: 'text-green-600', bgColor: 'bg-green-50' },
};

export const reviewDecisionLabels: Record<
  ReviewDecision,
  { name: string; color: string; bgColor: string }
> = {
  approved: { name: '通过', color: 'text-green-600', bgColor: 'bg-green-50' },
  rejected: { name: '驳回', color: 'text-red-600', bgColor: 'bg-red-50' },
  needs_revision: { name: '需修改', color: 'text-orange-600', bgColor: 'bg-orange-50' },
};

export const userRoleLabels: Record<
  UserRole,
  { name: string; color: string; bgColor: string; description: string }
> = {
  librarian: {
    name: '馆员',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    description: '负责提交修复申请、借阅管理',
  },
  restorer: {
    name: '修复师',
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50',
    description: '负责执行修复工序',
  },
  expert: {
    name: '专家',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    description: '负责珍贵古籍的评审',
  },
  admin: {
    name: '管理员',
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
    description: '系统管理员',
  },
};

export const stepTypeOrder: StepType[] = ['deacidification', 'paper_mending', 'binding'];

export const bookStatusLabels: Record<
  string,
  { name: string; variant: string }
> = {
  available: { name: '可借阅', variant: 'success' },
  under_restoration: { name: '修复中', variant: 'warning' },
  restricted: { name: '限制阅览', variant: 'warning' },
  archived: { name: '已归档', variant: 'secondary' },
};

export const restorationStepLabels: Record<StepType, string> = {
  deacidification: '脱酸',
  paper_mending: '补纸',
  binding: '装帧',
};

export const restorationStepStatusLabels: Record<
  StepStatus,
  { name: string; variant: string }
> = {
  pending: { name: '待执行', variant: 'secondary' },
  in_progress: { name: '执行中', variant: 'warning' },
  completed: { name: '已完成', variant: 'success' },
};

export const imageTypeLabels: Record<
  ImageType,
  { name: string; variant: string }
> = {
  cover: { name: '封面', variant: 'secondary' },
  inside_page: { name: '内页', variant: 'secondary' },
  before_restoration: { name: '修复前', variant: 'warning' },
  after_restoration: { name: '修复后', variant: 'success' },
  detail: { name: '细节', variant: 'secondary' },
};

export const restrictionTypeLabels: Record<RestrictionType, string> = {
  full: '完全限制',
  reading_room_only: '仅阅览室内',
  supervised: '监督下阅览',
  digital_only: '仅数字版',
};
