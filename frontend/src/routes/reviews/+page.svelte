<script lang="ts">
  import { onMount } from 'svelte';
  import { Card, Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Modal, ModalBody, ModalHeader, Input, Select, SelectOption, Textarea, Badge, Checkbox } from '@skeletonlabs/skeleton';
  import { CheckCircle, XCircle, AlertTriangle, FileText, Save, X, Search, Eye, ShieldAlert } from 'lucide-svelte';
  import { api } from '$lib/api';
  import { handleApiError, formatDate } from '$lib/utils';
  import { requestStatusLabels, rarityLevelLabels, restorationStepStatusLabels } from '$lib/enums';
  import type { ExpertReview, RestorationRequest, User } from '$types';
  import { notifications } from '$stores/notification';

  let reviews: ExpertReview[] = [];
  let requests: RestorationRequest[] = [];
  let users: User[] = [];
  let loading = false;
  let showReviewModal = false;
  let selectedRequest: RestorationRequest | null = null;
  let searchQuery = '';
  let statusFilter = '';

  let reviewForm = {
    decision: 'approved' as 'approved' | 'rejected',
    comments: '',
    canOpenToPublic: false,
  };

  const loadData = async () => {
    loading = true;
    try {
      const [reviewsRes, requestsRes, usersRes] = await Promise.all([
        api.get('/expert-reviews'),
        api.get('/restoration-requests'),
        api.get('/users'),
      ]);
      reviews = reviewsRes.data;
      requests = requestsRes.data;
      users = usersRes.data;
    } catch (e) {
      const { message } = handleApiError(e, '加载评审数据失败');
      notifications.error(message);
    } finally {
      loading = false;
    }
  };

  const openReviewModal = (request: RestorationRequest) => {
    selectedRequest = request;
    reviewForm = {
      decision: 'approved',
      comments: '',
      canOpenToPublic: false,
    };
    showReviewModal = true;
  };

  const submitReview = async () => {
    if (!selectedRequest) return;
    
    try {
      await api.post('/expert-reviews', {
        requestId: selectedRequest.id,
        ...reviewForm,
      });
      notifications.success('评审意见已提交');
      showReviewModal = false;
      await loadData();
    } catch (e) {
      const { message } = handleApiError(e, '提交评审意见失败');
      notifications.error(message);
    }
  };

  const getBookTitle = (requestId: string) => {
    const request = requests.find(r => r.id === requestId);
    if (!request) return requestId;
    const book = request.book;
    return book ? `${book.title} (${book.code})` : requestId;
  };

  const getExpertName = (expertId: string | null | undefined) => {
    if (!expertId) return '-';
    const expert = users.find(u => u.id === expertId);
    return expert ? expert.name : expertId;
  };

  const getReviewForRequest = (requestId: string) => {
    return reviews.find(r => r.requestId === requestId);
  };

  const pendingBatchCount = (request: RestorationRequest | null): number => {
    if (!request?.steps) return 0;
    return request.steps.filter(s => s.status === 'pending_batch').length;
  };

  const pendingRequests = requests.filter(r => r.status === 'review_pending');
  const reviewedRequests = requests.filter(r => r.status === 'completed' || r.status === 'review_rejected');

  const filteredPending = pendingRequests.filter(r => {
    return searchQuery === '' || getBookTitle(r.id).toLowerCase().includes(searchQuery.toLowerCase());
  });

  const filteredReviewed = reviewedRequests.filter(r => {
    const matchesSearch = searchQuery === '' || getBookTitle(r.id).toLowerCase().includes(searchQuery.toLowerCase());
    const review = getReviewForRequest(r.id);
    const matchesStatus = statusFilter === '' || (review && review.decision === statusFilter);
    return matchesSearch && matchesStatus;
  });

  onMount(() => {
    loadData();
  });
</script>

<div class="p-6 space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h2 class="text-2xl font-bold text-amber-900">专家评审</h2>
      <p class="text-amber-700/70 mt-1">审核修复完成的古籍是否可重新开放阅览</p>
    </div>
  </div>

  <div class="grid grid-cols-3 gap-4">
    <Card class="p-4 card-shadow">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-gray-500">待评审</p>
          <p class="text-2xl font-bold mt-1 text-orange-600">{pendingRequests.length}</p>
        </div>
        <div class="p-2 rounded-lg bg-orange-100">
          <AlertTriangle class="w-5 h-5 text-orange-600" />
        </div>
      </div>
    </Card>
    <Card class="p-4 card-shadow">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-gray-500">已通过</p>
          <p class="text-2xl font-bold mt-1 text-green-600">
            {reviews.filter(r => r.decision === 'approved').length}
          </p>
        </div>
        <div class="p-2 rounded-lg bg-green-100">
          <CheckCircle class="w-5 h-5 text-green-600" />
        </div>
      </div>
    </Card>
    <Card class="p-4 card-shadow">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-gray-500">已驳回</p>
          <p class="text-2xl font-bold mt-1 text-red-600">
            {reviews.filter(r => r.decision === 'rejected').length}
          </p>
        </div>
        <div class="p-2 rounded-lg bg-red-100">
          <XCircle class="w-5 h-5 text-red-600" />
        </div>
      </div>
    </Card>
  </div>

  <div class="flex items-center gap-4">
    <div class="flex-1 relative">
      <Search class="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <Input bind:value={searchQuery} placeholder="搜索古籍..." class="pl-10" />
    </div>
    <Select bind:value={statusFilter} class="w-48">
      <SelectOption value="">全部评审结果</SelectOption>
      <SelectOption value="approved">已通过</SelectOption>
      <SelectOption value="rejected">已驳回</SelectOption>
    </Select>
  </div>

  <Card class="card-shadow">
    <h3 class="text-lg font-semibold mb-4 flex items-center">
      <AlertTriangle class="w-5 h-5 mr-2 text-orange-500" />
      待评审申请
    </h3>
    {#if loading}
      <div class="p-8 text-center text-gray-500">加载中...</div>
    {:else if filteredPending.length === 0}
      <div class="p-8 text-center text-gray-500">
        <CheckCircle class="w-12 h-12 mx-auto mb-3 text-green-300" />
        <p>暂无待评审申请</p>
      </div>
    {:else}
      <Table>
        <TableHead>
          <TableRow>
            <TableHeader>古籍信息</TableHeader>
            <TableHeader>珍贵等级</TableHeader>
            <TableHeader>申请编号</TableHeader>
            <TableHeader>修复师</TableHeader>
            <TableHeader>工序完成时间</TableHeader>
            <TableHeader>照片状态</TableHeader>
            <TableHeader class="text-right">操作</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {#each filteredPending as request}
            <TableRow>
              <TableCell class="font-medium">{getBookTitle(request.id)}</TableCell>
              <TableCell>
                <Badge variant={request.book?.rarityLevel === 'national_treasure' || request.book?.rarityLevel === 'precious' ? 'warning' : 'secondary'}>
                  {request.book ? rarityLevelLabels[request.book.rarityLevel] : '-'}
                </Badge>
                {#if request.book && (request.book.rarityLevel === 'national_treasure' || request.book.rarityLevel === 'precious')}
                  <ShieldAlert class="w-4 h-4 inline ml-1 text-red-500" />
                {/if}
              </TableCell>
              <TableCell class="font-mono text-sm">{request.requestNo}</TableCell>
              <TableCell>{getExpertName(request.assigneeId)}</TableCell>
              <TableCell>{request.updatedAt ? formatDate(request.updatedAt) : '-'}</TableCell>
              <TableCell>
                {#if request.beforeImageId && request.afterImageId}
                  <Badge variant="success">已上传</Badge>
                {:else}
                  <Badge variant="warning">缺失</Badge>
                {/if}
              </TableCell>
              <TableCell class="text-right">
                <Button size="sm" variant="primary" on:click={() => openReviewModal(request)}>
                  <Eye class="w-4 h-4 mr-1" />
                  评审
                </Button>
              </TableCell>
            </TableRow>
          {/each}
        </TableBody>
      </Table>
    {/if}
  </Card>

  <Card class="card-shadow">
    <h3 class="text-lg font-semibold mb-4 flex items-center">
      <FileText class="w-5 h-5 mr-2 text-blue-500" />
      已评审记录
    </h3>
    {#if loading}
      <div class="p-8 text-center text-gray-500">加载中...</div>
    {:else if filteredReviewed.length === 0}
      <div class="p-8 text-center text-gray-500">
        <FileText class="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p>暂无评审记录</p>
      </div>
    {:else}
      <Table>
        <TableHead>
          <TableRow>
            <TableHeader>古籍信息</TableHeader>
            <TableHeader>评审结果</TableHeader>
            <TableHeader>评审专家</TableHeader>
            <TableHeader>是否开放阅览</TableHeader>
            <TableHeader>评审时间</TableHeader>
            <TableHeader>评审意见</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {#each filteredReviewed as request}
            {@const review = getReviewForRequest(request.id)}
            <TableRow>
              <TableCell class="font-medium">{getBookTitle(request.id)}</TableCell>
              <TableCell>
                {#if review}
                  <Badge variant={review.decision === 'approved' ? 'success' : 'danger'}>
                    {review.decision === 'approved' ? '通过' : '驳回'}
                  </Badge>
                {:else}
                  -
                {/if}
              </TableCell>
              <TableCell>{review ? getExpertName(review.expertId) : '-'}</TableCell>
              <TableCell>
                {#if review}
                  {review.canOpenToPublic ? '是' : '否'}
                {:else}
                  -
                {/if}
              </TableCell>
              <TableCell>{review ? formatDate(review.reviewDate) : '-'}</TableCell>
              <TableCell class="max-w-xs truncate">{review?.comments || '-'}</TableCell>
            </TableRow>
          {/each}
        </TableBody>
      </Table>
    {/if}
  </Card>
</div>

<Modal bind:open={showReviewModal} maxWidth="lg">
  <ModalHeader>
    <h3 class="text-xl font-bold">专家评审</h3>
  </ModalHeader>
  <ModalBody>
    <div class="space-y-4">
      {#if selectedRequest}
        <div class="p-4 bg-amber-50 rounded-lg border border-amber-200">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <p class="text-sm text-gray-500">古籍名称</p>
              <p class="font-semibold">{selectedRequest.book?.title}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">古籍编号</p>
              <p class="font-mono">{selectedRequest.book?.code}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">珍贵等级</p>
              <Badge variant={selectedRequest.book?.rarityLevel === 'national_treasure' || selectedRequest.book?.rarityLevel === 'precious' ? 'warning' : 'secondary'}>
                {selectedRequest.book ? rarityLevelLabels[selectedRequest.book.rarityLevel] : '-'}
              </Badge>
              {#if selectedRequest.book && (selectedRequest.book.rarityLevel === 'national_treasure' || selectedRequest.book.rarityLevel === 'precious')}
                <p class="text-xs text-red-600 mt-1 flex items-center">
                  <ShieldAlert class="w-3 h-3 mr-1" />
                  珍贵古籍必须通过专家评审
                </p>
              {/if}
            </div>
            <div>
              <p class="text-sm text-gray-500">申请编号</p>
              <p class="font-mono">{selectedRequest.requestNo}</p>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-3 gap-4">
          <Card class="p-4">
            <p class="text-sm text-gray-500">脱酸工序</p>
            {#each selectedRequest.steps?.filter(s => s.stepType === 'deacidification') || [] as step}
              <Badge variant={restorationStepStatusLabels[step.status].variant} class="mt-1">
                {restorationStepStatusLabels[step.status].name}
              </Badge>
            {/each}
          </Card>
          <Card class="p-4">
            <p class="text-sm text-gray-500">补纸工序</p>
            {#each selectedRequest.steps?.filter(s => s.stepType === 'paper_mending') || [] as step}
              <Badge variant={restorationStepStatusLabels[step.status].variant} class="mt-1">
                {restorationStepStatusLabels[step.status].name}
              </Badge>
            {/each}
          </Card>
          <Card class="p-4">
            <p class="text-sm text-gray-500">装帧工序</p>
            {#each selectedRequest.steps?.filter(s => s.stepType === 'binding') || [] as step}
              <Badge variant={restorationStepStatusLabels[step.status].variant} class="mt-1">
                {restorationStepStatusLabels[step.status].name}
              </Badge>
            {/each}
          </Card>
        </div>

        {#if pendingBatchCount(selectedRequest) > 0}
          <div class="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertTriangle class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div class="text-sm text-red-800">
              存在 {pendingBatchCount(selectedRequest)} 道待补录材料批号的工序，专家评审前必须补齐。请通知修复师先补录材料批号后再提交评审。
            </div>
          </div>
        {/if}

        <div class="p-4 bg-gray-50 rounded-lg">
          <p class="text-sm font-medium text-gray-700 mb-2">修复说明</p>
          <p class="text-gray-600">{selectedRequest.description || '无'}</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">评审决定</label>
          <Select bind:value={reviewForm.decision}>
            <SelectOption value="approved">通过</SelectOption>
            <SelectOption value="rejected">驳回</SelectOption>
          </Select>
        </div>

        <div>
          <Checkbox bind:checked={reviewForm.canOpenToPublic} label="是否可重新开放阅览" />
          {#if !selectedRequest.beforeImageId || !selectedRequest.afterImageId}
            <p class="text-xs text-orange-600 mt-1 flex items-center">
              <AlertTriangle class="w-3 h-3 mr-1" />
              警告：修复前后照片不完整，开放阅览前需补充照片
            </p>
          {/if}
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">评审意见</label>
          <Textarea bind:value={reviewForm.comments} placeholder="请输入评审意见..." rows={4} />
        </div>
      {/if}

      <div class="flex justify-end gap-3 pt-4 border-t">
        <Button variant="tertiary" on:click={() => (showReviewModal = false)}>
          <X class="w-4 h-4 mr-2" />
          取消
        </Button>
        <Button variant="primary" on:click={submitReview} disabled={pendingBatchCount(selectedRequest) > 0}>
          <Save class="w-4 h-4 mr-2" />
          提交评审
        </Button>
      </div>
    </div>
  </ModalBody>
</Modal>
