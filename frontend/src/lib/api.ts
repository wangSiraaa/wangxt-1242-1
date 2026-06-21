import axios from 'axios';
import type {
  AncientBook,
  RestorationRequest,
  RestorationStep,
  ExpertReview,
  Material,
  BookImage,
  User,
  WorkflowStatus,
  PaginationResult,
  CreateRestorationRequestDto,
  UpdateRestorationRequestDto,
  UpdateRequestStatusDto,
  CompleteStepDto,
  CreateExpertReviewDto,
  CreateBookImageDto,
} from '$types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export { api };

export const ancientBooksApi = {
  findAll: (
    page = 1,
    limit = 10,
    rarityLevel?: string,
    status?: string,
    keyword?: string,
  ) =>
    api.get<PaginationResult<AncientBook>>('/books', {
      params: { page, limit, rarityLevel, status, keyword },
    }),

  findOne: (id: string) => api.get<AncientBook>(`/books/${id}`),

  findByCode: (bookCode: string) => api.get<AncientBook>(`/books/code/${bookCode}`),

  getStats: () => api.get('/books/stats'),

  getRarityLevels: () => api.get('/books/rarity-levels'),

  getBorrowingStatuses: () => api.get('/books/borrowing-statuses'),

  create: (data: Partial<AncientBook>) => api.post<AncientBook>('/books', data),

  update: (id: string, data: Partial<AncientBook>) =>
    api.put<AncientBook>(`/books/${id}`, data),

  updateStatus: (id: string, status: string) =>
    api.put<AncientBook>(`/books/${id}/status`, { status }),

  remove: (id: string) => api.delete(`/books/${id}`),
};

export const restorationRequestsApi = {
  findAll: (page = 1, limit = 10, status?: string, bookId?: string) =>
    api.get<PaginationResult<RestorationRequest>>('/restoration-requests', {
      params: { page, limit, status, bookId },
    }),

  findOne: (id: string) =>
    api.get<RestorationRequest>(`/restoration-requests/${id}`),

  getWorkflowStatus: (id: string) =>
    api.get<WorkflowStatus>(`/restoration-requests/${id}/workflow`),

  create: (data: CreateRestorationRequestDto) =>
    api.post<RestorationRequest>('/restoration-requests', data),

  update: (id: string, data: UpdateRestorationRequestDto) =>
    api.put<RestorationRequest>(`/restoration-requests/${id}`, data),

  updateStatus: (id: string, data: UpdateRequestStatusDto) =>
    api.put<RestorationRequest>(`/restoration-requests/${id}/status`, data),

  remove: (id: string) => api.delete(`/restoration-requests/${id}`),
};

export const restorationStepsApi = {
  findByRequestId: (requestId: string) =>
    api.get<RestorationStep[]>('/restoration-steps', {
      params: { requestId },
    }),

  findOne: (id: string) =>
    api.get<RestorationStep>(`/restoration-steps/${id}`),

  getStepTypes: () => api.get('/restoration-steps/types'),

  getStepStatuses: () => api.get('/restoration-steps/statuses'),

  startStep: (id: string, restorerId: string) =>
    api.put<RestorationStep>(`/restoration-steps/${id}/start`, {
      restorerId,
    }),

  completeStep: (id: string, data: CompleteStepDto) =>
    api.put<RestorationStep>(`/restoration-steps/${id}/complete`, data),

  remove: (id: string) => api.delete(`/restoration-steps/${id}`),
};

export const expertReviewsApi = {
  findAll: (requestId?: string, expertId?: string, decision?: string) =>
    api.get<ExpertReview[]>('/expert-reviews', {
      params: { requestId, expertId, decision },
    }),

  getPendingReviews: (expertId?: string) =>
    api.get<ExpertReview[]>('/expert-reviews/pending', {
      params: { expertId },
    }),

  findOne: (id: string) => api.get<ExpertReview>(`/expert-reviews/${id}`),

  create: (data: CreateExpertReviewDto) =>
    api.post<ExpertReview>('/expert-reviews', data),

  update: (id: string, data: Partial<ExpertReview>) =>
    api.put<ExpertReview>(`/expert-reviews/${id}`, data),

  remove: (id: string) => api.delete(`/expert-reviews/${id}`),
};

export const materialsApi = {
  findAll: (page = 1, limit = 10, category?: string, keyword?: string) =>
    api.get<PaginationResult<Material>>('/materials', {
      params: { page, limit, category, keyword },
    }),

  getLowStock: (threshold = 10) =>
    api.get<Material[]>('/materials/low-stock', { params: { threshold } }),

  getCategories: () => api.get('/materials/categories'),

  findOne: (id: string) => api.get<Material>(`/materials/${id}`),

  findByCode: (materialCode: string) =>
    api.get<Material>(`/materials/code/${materialCode}`),

  create: (data: Partial<Material>) =>
    api.post<Material>('/materials', data),

  update: (id: string, data: Partial<Material>) =>
    api.put<Material>(`/materials/${id}`, data),

  remove: (id: string) => api.delete(`/materials/${id}`),
};

export const bookImagesApi = {
  findByBookId: (bookId: string, imageType?: string) =>
    api.get<BookImage[]>(`/book-images/book/${bookId}`, {
      params: { imageType },
    }),

  findByRequestId: (requestId: string, imageType?: string) =>
    api.get<BookImage[]>(`/book-images/request/${requestId}`, {
      params: { imageType },
    }),

  getImageTypes: () => api.get('/book-images/types'),

  checkRestorationImages: (requestId: string) =>
    api.get(`/book-images/check/${requestId}`),

  findOne: (id: string) => api.get<BookImage>(`/book-images/${id}`),

  create: (data: CreateBookImageDto) =>
    api.post<BookImage>('/book-images', data),

  createBatch: (data: CreateBookImageDto[]) =>
    api.post<BookImage[]>('/book-images/batch', data),

  uploadRestorationImages: (
    requestId: string,
    beforeImage: CreateBookImageDto,
    afterImage: CreateBookImageDto,
  ) =>
    api.post(`/book-images/restoration/${requestId}`, {
      beforeImage,
      afterImage,
    }),

  update: (id: string, data: Partial<BookImage>) =>
    api.put<BookImage>(`/book-images/${id}`, data),

  remove: (id: string) => api.delete(`/book-images/${id}`),
};

export const usersApi = {
  findAll: (role?: string) =>
    api.get<User[]>('/users', { params: { role } }),

  getRoles: () => api.get('/users/roles'),

  getLibrarians: () => api.get<User[]>('/users/librarians'),

  getRestorers: () => api.get<User[]>('/users/restorers'),

  getExperts: () => api.get<User[]>('/users/experts'),

  findOne: (id: string) => api.get<User>(`/users/${id}`),

  findByUsername: (username: string) =>
    api.get<User>(`/users/username/${username}`),

  create: (data: Partial<User>) => api.post<User>('/users', data),

  update: (id: string, data: Partial<User>) =>
    api.put<User>(`/users/${id}`, data),

  remove: (id: string) => api.delete(`/users/${id}`),
};

export const businessRulesApi = {
  validatePreciousReview: (requestId: string) =>
    api.get(`/business-rules/validate/precious-review/${requestId}`),

  validateMaterialBatch: (stepId: string) =>
    api.get(`/business-rules/validate/material-batch/${stepId}`),

  validateRestorationImages: (requestId: string) =>
    api.get(`/business-rules/validate/restoration-images/${requestId}`),

  checkCanOpen: (requestId: string) =>
    api.get(`/business-rules/can-open/${requestId}`),

  getWorkflow: (requestId: string) =>
    api.get(`/business-rules/workflow/${requestId}`),

  getRules: () => api.get('/business-rules/rules'),
};

export default api;
