export type UserRole = 'librarian' | 'restorer' | 'expert' | 'admin';
export type RarityLevel = 'common' | 'rare' | 'precious' | 'national_treasure';
export type BorrowingStatus = 'available' | 'restricted' | 'under_restoration' | 'permanently_restricted';
export type RequestStatus = 'draft' | 'submitted' | 'approved' | 'in_progress' | 'review_pending' | 'review_approved' | 'review_rejected' | 'completed' | 'cancelled';
export type StepType = 'deacidification' | 'paper_mending' | 'binding';
export type StepStatus = 'pending' | 'in_progress' | 'completed';
export type ReviewDecision = 'approved' | 'rejected' | 'needs_revision';
export type ImageType = 'before_restoration' | 'after_restoration' | 'during_restoration' | 'detail' | 'cover';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  email?: string;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AncientBook {
  id: string;
  bookCode: string;
  title: string;
  author?: string;
  dynasty?: string;
  era?: string;
  rarityLevel: RarityLevel;
  borrowingStatus: BorrowingStatus;
  description?: string;
  condition?: string;
  dimensions?: string;
  pages?: number;
  material?: string;
  provenance?: string;
  catalogNumber?: string;
  shelfLocation?: string;
  createdAt: Date;
  updatedAt: Date;
  isPrecious?: boolean;
}

export interface Material {
  id: string;
  materialCode: string;
  name: string;
  category: string;
  batchNumber: string;
  quantity: number;
  unit: string;
  supplier?: string;
  purchaseDate?: Date;
  expiryDate?: Date;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  hasValidBatchNumber?: boolean;
}

export interface RestorationRequest {
  id: string;
  requestNo: string;
  bookId: string;
  book?: AncientBook;
  submittedBy: string;
  submittedByUser?: User;
  approvedBy?: string;
  approvedByUser?: User;
  status: RequestStatus;
  priority: 'normal' | 'high' | 'urgent';
  reason: string;
  expectedDuration?: number;
  notes?: string;
  submittedAt?: Date;
  approvedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  steps?: RestorationStep[];
  reviews?: ExpertReview[];
  images?: BookImage[];
  requiresExpertReview?: boolean;
  hasApprovedReview?: boolean;
  hasCompleteImages?: boolean;
  canComplete?: boolean;
}

export interface RestorationStep {
  id: string;
  requestId: string;
  request?: RestorationRequest;
  stepType: StepType;
  stepOrder: number;
  status: StepStatus;
  restorerId?: string;
  restorer?: User;
  materialId?: string;
  material?: Material;
  materialBatchNumber?: string;
  description?: string;
  notes?: string;
  startedAt?: Date;
  completedAt?: Date;
  durationMinutes?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExpertReview {
  id: string;
  requestId: string;
  request?: RestorationRequest;
  expertId: string;
  expert?: User;
  decision: ReviewDecision;
  comments: string;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface BookImage {
  id: string;
  bookId: string;
  book?: AncientBook;
  requestId?: string;
  request?: RestorationRequest;
  imageType: ImageType;
  imageUrl: string;
  thumbnailUrl?: string;
  caption?: string;
  takenAt: Date;
  takenById?: string;
  takenBy?: User;
  size?: number;
  mimeType?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BorrowingRestriction {
  id: string;
  bookId: string;
  book?: AncientBook;
  reason: string;
  restrictedBy: string;
  restrictedByUser?: User;
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BorrowingRecord {
  id: string;
  bookId: string;
  book?: AncientBook;
  borrower: string;
  borrowedAt: Date;
  dueDate: Date;
  returnedAt?: Date;
  purpose?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowStatus {
  currentStep: string;
  currentStatus: RequestStatus;
  completedSteps: { type: StepType; name: string; completed: boolean }[];
  nextSteps: { type: StepType; name: string; canStart: boolean }[];
  requiresExpertReview: boolean;
  hasExpertReview: boolean;
  canComplete: boolean;
  canOpenForReading: boolean;
}

export interface PaginationResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
