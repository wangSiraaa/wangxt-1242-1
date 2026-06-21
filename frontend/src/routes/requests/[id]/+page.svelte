<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { Card, Button, Badge, Modal, ModalBody, ModalHeader, Input, Select, SelectOption, Textarea, Checkbox } from '@skeletonlabs/skeleton';
  import { ArrowLeft, Edit2, Save, X, Image, FileText, CheckCircle, Clock, AlertTriangle, ShieldAlert, Send, Eye } from 'lucide-svelte';
  import { api } from '$lib/api';
  import { handleApiError, formatDate } from '$lib/utils';
  import { rarityLevelLabels, requestStatusLabels, restorationStepLabels, restorationStepStatusLabels, imageTypeLabels } from '$lib/enums';
  import type { RestorationRequest, AncientBook, BookImage, ExpertReview, User, Material } from '$types';
  import { notifications } from '$stores/notification';

  let request: RestorationRequest | null = null;
  let book: AncientBook | null = null;
  let images: BookImage[] = [];
  let reviews: ExpertReview[] = [];
  let users: User[] = [];
  let materials: Material[] = [];
  let loading = true;
  let showStepModal = false;
  let showReviewModal = false;
  let selectedStep: any = null;

  let stepForm = {
    materialId: '',
    materialBatch: '',
    notes: '',
  };

  let reviewForm = {
    decision: 'approved' as 'approved' | 'rejected',
    comments: '',
    canOpenToPublic: false,
  };

  let showSupplementModal = false;
  let supplementTargetStep: any = null;
  let supplementForm = {
    materialBatch: '',
    materialId: '',
    notes: '',
  };

  const loadData = async () => {
    const id = $page.params.id;
    loading = true;
    try {
      const [requestRes, imagesRes, reviewsRes, usersRes, materialsRes] = await Promise.all([
        api.get(`/restoration-requests/${id}`),
        api.get(`/book-images?requestId=${id}`),
        api.get(`/expert-reviews?requestId=${id}`),
        api.get('/users'),
        api.get('/materials'),
      ]);
      request = requestRes.data;
      book = request.book;
      images = imagesRes.data;
      reviews = reviewsRes.data;
      users = usersRes.data;
      materials = materialsRes.data;
    } catch (e) {
      const { message } = handleApiError(e, '加载修复申请详情失败');
      notifications.error(message);
    } finally {
      loading = false;
    }
  };

  const openStepModal = (step: any) => {
    selectedStep = step;
    stepForm = {
      materialId: step.materialId || '',
      materialBatch: step.materialBatch || '',
      notes: step.notes || '',
    };
    showStepModal = true;
  };

  const saveStep = async () => {
    if (!selectedStep) return;

    try {
      await api.put(`/restoration-steps/${selectedStep.id}`, stepForm);
      notifications.success('工序信息已更新');
      showStepModal = false;
      await loadData();
    } catch (e) {
      const { message } = handleApiError(e, '保存工序信息失败');
      notifications.error(message);
    }
  };

  const startStep = async (stepId: string) => {
    try {
      await api.put(`/restoration-steps/${stepId}/start`, {});
      notifications.success('工序已开始');
      await loadData();
    } catch (e) {
      const { message } = handleApiError(e, '开始工序失败');
      notifications.error(message);
    }
  };

  const completeStep = async (stepId: string) => {
    try {
      await api.put(`/restoration-steps/${stepId}/complete`, {});
      notifications.success('工序已完成');
      await loadData();
    } catch (e) {
      const { message } = handleApiError(e, '完成工序失败');
      notifications.error(message);
    }
  };

  const submitForReview = async () => {
    if (!request) return;

    try {
      await api.post(`/restoration-requests/${request.id}/submit-review`);
      notifications.success('已提交专家评审');
      await loadData();
    } catch (e) {
      const { message } = handleApiError(e, '提交评审失败');
      notifications.error(message);
    }
  };

  const openReviewModal = () => {
    reviewForm = {
      decision: 'approved',
      comments: '',
      canOpenToPublic: false,
    };
    showReviewModal = true;
  };

  const submitReview = async () => {
    if (!request) return;

    try {
      await api.post('/expert-reviews', {
        requestId: request.id,
        ...reviewForm,
      });
      notifications.success('评审意见已提交');
      showReviewModal = false;
      await loadData();
    } catch (e) {
      const { message } = handleApiError(e, '提交评审失败');
      notifications.error(message);
    }
  };

  const pendingBatchCount = (req: RestorationRequest | null) => {
    if (!req || !req.steps) return 0;
    return req.steps.filter(s => s.status === 'pending_batch').length;
  };

  const openSupplementModal = (step: any) => {
    supplementTargetStep = step;
    supplementForm = {
      materialBatch: '',
      materialId: step.materialId || '',
      notes: step.notes || '',
    };
    showSupplementModal = true;
  };

  const saveSupplement = async () => {
    if (!supplementTargetStep) return;
    if (!supplementForm.materialBatch.trim()) {
      notifications.error('材料批号不能为空');
      return;
    }
    try {
      await api.put(`/restoration-steps/${supplementTargetStep.id}/supplement-batch`, {
        materialBatch: supplementForm.materialBatch.trim(),
        materialId: supplementForm.materialId || undefined,
        notes: supplementForm.notes || undefined,
      });
      notifications.success('材料批号已补录，工序已完成');
      showSupplementModal = false;
      await loadData();
    } catch (e) {
      const { message } = handleApiError(e, '补录材料批号失败');
      notifications.error(message);
    }
  };

  const getUserName = (userId: string | null | undefined) => {
    if (!userId) return '-';
    const user = users.find(u => u.id === userId);
    return user ? user.name : userId;
  };

  const getMaterialName = (materialId: string | null | undefined) => {
    if (!materialId) return '-';
    const material = materials.find(m => m.id === materialId);
    return material ? material.name : '-';
  };

  const getImageUrl = (imagePath: string) => {
    return `/api/book-images/${imagePath}`;
  };

  const getBeforeImage = () => images.find(i => i.imageType === 'before_restoration');
  const getAfterImage = () => images.find(i => i.imageType === 'after_restoration');

  const checkImageCompleteness = () => {
    const hasBefore = images.some(i => i.imageType === 'before_restoration');
    const hasAfter = images.some(i => i.imageType === 'after_restoration');
    return { hasBefore, hasAfter, complete: hasBefore && hasAfter };
  };

  const isPreciousBook = () => {
    return book && (book.rarityLevel === 'precious' || book.rarityLevel === 'national_treasure');
  };

  onMount(() => {
    loadData();
  });
</script>

<div class="p-6 space-y-6">
  <div class="flex items-center gap-4">
    <Button variant="tertiary" on:click={() => history.back()}>
      <ArrowLeft class="w-4 h-4 mr-2" />
      返回
    </Button>
    <div class="flex-1">
      {#if request && book}
        <div class="flex items-center gap-3">
          <h2 class="text-2xl font-bold text-amber-900">{book.title}</h2>
          <Badge variant={requestStatusLabels[request.status].variant}>
            {requestStatusLabels[request.status].name}
          </Badge>
          {#if isPreciousBook()}
            <ShieldAlert class="w-5 h-5 text-red-500" />
          {/if}
        </div>
        <p class="text-amber-700/70 mt-1">
          申请编号：{request.requestNo} · 提交时间：{formatDate(request.createdAt)}
        </p>
      {/if}
    </div>
    {#if request && request.status === 'steps_completed'}
      {#if pendingBatchCount(request) > 0}
        <Button variant="warning" disabled title="存在待补录工序，请先补齐材料批号">
          <AlertTriangle class="w-4 h-4 mr-2" />
          待补录 {pendingBatchCount(request)} 项
        </Button>
      {:else}
        <Button variant="primary" on:click={submitForReview}>
          <Send class="w-4 h-4 mr-2" />
          提交专家评审
        </Button>
      {/if}
    {/if}
    {#if request && request.status === 'review_pending'}
      <Button variant="primary" on:click={openReviewModal}>
        <Eye class="w-4 h-4 mr-2" />
        专家评审
      </Button>
    {/if}
  </div>

  {#if loading}
    <div class="p-12 text-center text-gray-500">加载中...</div>
  {:else if request && book}
    {#if isPreciousBook()}
      <Card class="p-4 bg-red-50 border-red-200">
        <div class="flex items-center gap-3">
          <ShieldAlert class="w-6 h-6 text-red-500" />
          <div>
            <p class="font-semibold text-red-700">珍贵古籍提示</p>
            <p class="text-sm text-red-600">
              此书为{rarityLevelLabels[book.rarityLevel]}古籍，必须通过专家评审才能开放阅览
            </p>
          </div>
        </div>
      </Card>
    {/if}

    {#const imageCompleteness = checkImageCompleteness()}
      {#if !imageCompleteness.complete}
        <Card class="p-4 bg-orange-50 border-orange-200">
          <div class="flex items-center gap-3">
            <AlertTriangle class="w-6 h-6 text-orange-500" />
            <div>
              <p class="font-semibold text-orange-700">照片不完整</p>
              <p class="text-sm text-orange-600">
                修复前后照片不完整，开放阅览前请确保已上传完整的照片档案
              </p>
            </div>
          </div>
        </Card>
      {/if}
    {/if}

    <div class="grid grid-cols-3 gap-6">
      <div class="col-span-2 space-y-6">
        <Card class="card-shadow p-6">
          <h3 class="text-lg font-semibold mb-4 flex items-center">
            <FileText class="w-5 h-5 mr-2 text-blue-500" />
            基本信息
          </h3>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <p class="text-sm text-gray-500">古籍编号</p>
              <p class="font-mono font-medium">{book.code}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">珍贵等级</p>
              <Badge variant={book.rarityLevel === 'national_treasure' || book.rarityLevel === 'precious' ? 'warning' : 'secondary'} class="mt-1">
                {rarityLevelLabels[book.rarityLevel]}
              </Badge>
            </div>
            <div>
              <p class="text-sm text-gray-500">申请馆员</p>
              <p class="font-medium">{getUserName(request.submittedBy)}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">修复师</p>
              <p class="font-medium">{getUserName(request.assigneeId)}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">优先级</p>
              <p class="font-medium">{request.priority || '普通'}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">预计完成</p>
              <p class="font-medium">{request.estimatedDate ? formatDate(request.estimatedDate) : '-'}</p>
            </div>
          </div>
          <div class="mt-4 pt-4 border-t">
            <p class="text-sm text-gray-500">修复说明</p>
            <p class="mt-1">{request.description || '无'}</p>
          </div>
        </Card>

        <Card class="card-shadow p-6">
          <h3 class="text-lg font-semibold mb-4 flex items-center">
            <Clock class="w-5 h-5 mr-2 text-amber-500" />
            修复工序
          </h3>
          <div class="space-y-4">
            {#each request.steps || [] as step}
              <div class="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div class="flex items-center justify-between mb-3">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full flex items-center justify-center {step.status === 'completed' ? 'bg-green-100' : step.status === 'in_progress' ? 'bg-amber-100' : step.status === 'pending_batch' ? 'bg-amber-100' : 'bg-gray-100'}">
                      {#if step.status === 'completed'}
                        <CheckCircle class="w-5 h-5 text-green-600" />
                      {:else if step.status === 'in_progress'}
                        <Clock class="w-5 h-5 text-amber-600" />
                      {:else if step.status === 'pending_batch'}
                        <AlertTriangle class="w-5 h-5 text-amber-500" />
                      {:else}
                        <Clock class="w-5 h-5 text-gray-400" />
                      {/if}
                    </div>
                    <div>
                      <p class="font-semibold">{restorationStepLabels[step.stepType]}</p>
                      <p class="text-sm text-gray-500">
                        {step.startTime ? `开始：${formatDate(step.startTime)}` : '未开始'}
                        {#if step.endTime}
                          · 完成：{formatDate(step.endTime)}
                        {/if}
                      </p>
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <Badge variant={restorationStepStatusLabels[step.status].variant}>
                      {restorationStepStatusLabels[step.status].name}
                    </Badge>
                    {#if step.status === 'pending'}
                      <Button size="sm" variant="primary" on:click={() => startStep(step.id)}>
                        开始
                      </Button>
                    {/if}
                    {#if step.status === 'in_progress'}
                      <Button size="sm" variant="success" on:click={() => completeStep(step.id)}>
                        完成
                      </Button>
                    {/if}
                    {#if step.status === 'pending_batch'}
                      <Button size="sm" variant="warning" on:click={() => openSupplementModal(step)}>
                        <AlertTriangle class="w-3.5 h-3.5 mr-1" />
                        补录
                      </Button>
                    {/if}
                    <Button size="sm" variant="tertiary" on:click={() => openStepModal(step)}>
                      编辑
                    </Button>
                  </div>
                </div>
                <div class="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p class="text-gray-500">使用材料</p>
                    <p>{getMaterialName(step.materialId) || '-'}</p>
                  </div>
                  <div>
                    <p class="text-gray-500">材料批号</p>
                    {#if step.materialBatch}
                      <p class="font-mono">{step.materialBatch}</p>
                    {:else if step.status === 'pending_batch'}
                      <p class="text-amber-600 flex items-center">
                        <AlertTriangle class="w-4 h-4 mr-1" />
                        待补录
                      </p>
                    {:else}
                      <p class="text-red-500 flex items-center">
                        <AlertTriangle class="w-4 h-4 mr-1" />
                        缺失
                      </p>
                    {/if}
                  </div>
                  <div>
                    <p class="text-gray-500">修复师备注</p>
                    <p class="truncate">{step.notes || '-'}</p>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </Card>

        {#if reviews.length > 0}
          <Card class="card-shadow p-6">
            <h3 class="text-lg font-semibold mb-4 flex items-center">
              <CheckCircle class="w-5 h-5 mr-2 text-green-500" />
              专家评审记录
            </h3>
            <div class="space-y-4">
              {#each reviews as review}
                <div class="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center gap-2">
                      <Badge variant={review.decision === 'approved' ? 'success' : 'danger'}>
                        {review.decision === 'approved' ? '通过' : '驳回'}
                      </Badge>
                      <span class="text-sm text-gray-500">
                        专家：{getUserName(review.expertId)} · {formatDate(review.reviewDate)}
                      </span>
                    </div>
                    <Badge variant={review.canOpenToPublic ? 'success' : 'warning'}>
                      {review.canOpenToPublic ? '可开放阅览' : '不可开放阅览'}
                    </Badge>
                  </div>
                  <p class="text-sm">{review.comments || '无评审意见'}</p>
                </div>
              {/each}
            </div>
          </Card>
        {/if}
      </div>

      <div class="space-y-6">
        <Card class="card-shadow p-6">
          <h3 class="text-lg font-semibold mb-4 flex items-center">
            <Image class="w-5 h-5 mr-2 text-purple-500" />
            照片档案
          </h3>
          <div class="space-y-4">
            <div>
              <p class="text-sm font-medium text-gray-700 mb-2">修复前照片</p>
              {@const beforeImage = getBeforeImage()}
              {#if beforeImage}
                <div class="aspect-video rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                  <img 
                    src={getImageUrl(beforeImage.filePath)} 
                    alt="修复前"
                    class="w-full h-full object-cover"
                    onerror="this.style.display='none'; this.parentElement.innerHTML='<div class=\'w-full h-full flex items-center justify-center text-gray-400\'><Image class=\'w-12 h-12\' /></div>'"
                  />
                </div>
                <p class="text-xs text-gray-500 mt-1">{formatDate(beforeImage.uploadedAt)}</p>
              {:else}
                <div class="aspect-video rounded-lg bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                  <div class="text-center text-gray-400">
                    <Image class="w-8 h-8 mx-auto mb-1" />
                    <p class="text-sm">未上传</p>
                  </div>
                </div>
              {/if}
            </div>
            <div>
              <p class="text-sm font-medium text-gray-700 mb-2">修复后照片</p>
              {@const afterImage = getAfterImage()}
              {#if afterImage}
                <div class="aspect-video rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                  <img 
                    src={getImageUrl(afterImage.filePath)} 
                    alt="修复后"
                    class="w-full h-full object-cover"
                    onerror="this.style.display='none'; this.parentElement.innerHTML='<div class=\'w-full h-full flex items-center justify-center text-gray-400\'><Image class=\'w-12 h-12\' /></div>'"
                  />
                </div>
                <p class="text-xs text-gray-500 mt-1">{formatDate(afterImage.uploadedAt)}</p>
              {:else}
                <div class="aspect-video rounded-lg bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                  <div class="text-center text-gray-400">
                    <Image class="w-8 h-8 mx-auto mb-1" />
                    <p class="text-sm">未上传</p>
                  </div>
                </div>
              {/if}
            </div>
          </div>
        </Card>

        <Card class="card-shadow p-6">
          <h3 class="text-lg font-semibold mb-4">流程进度</h3>
          <div class="space-y-3">
            <div class="flex items-center gap-3">
              <div class="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle class="w-4 h-4 text-green-600" />
              </div>
              <div class="flex-1">
                <p class="text-sm font-medium">提交修复申请</p>
                <p class="text-xs text-gray-500">{formatDate(request.createdAt)}</p>
              </div>
            </div>
            {#each request.steps || [] as step}
              <div class="flex items-center gap-3">
                <div class="w-6 h-6 rounded-full {step.status === 'completed' ? 'bg-green-100' : step.status === 'in_progress' ? 'bg-amber-100' : step.status === 'pending_batch' ? 'bg-amber-100' : 'bg-gray-100'} flex items-center justify-center">
                  {#if step.status === 'completed'}
                    <CheckCircle class="w-4 h-4 text-green-600" />
                  {:else if step.status === 'in_progress'}
                    <Clock class="w-4 h-4 text-amber-600" />
                  {:else if step.status === 'pending_batch'}
                    <AlertTriangle class="w-4 h-4 text-amber-500" />
                  {:else}
                    <Clock class="w-4 h-4 text-gray-400" />
                  {/if}
                </div>
                <div class="flex-1">
                  <p class="text-sm font-medium">{restorationStepLabels[step.stepType]}</p>
                  <p class="text-xs text-gray-500">
                    {step.status === 'completed' ? `完成于 ${formatDate(step.endTime!)}` : restorationStepStatusLabels[step.status].name}
                  </p>
                </div>
              </div>
            {/each}
            <div class="flex items-center gap-3">
              <div class="w-6 h-6 rounded-full {reviews.length > 0 ? 'bg-green-100' : request.status === 'review_pending' ? 'bg-amber-100' : 'bg-gray-100'} flex items-center justify-center">
                {#if reviews.length > 0}
                  <CheckCircle class="w-4 h-4 text-green-600" />
                {:else if request.status === 'review_pending'}
                  <Clock class="w-4 h-4 text-amber-600" />
                {:else}
                  <Clock class="w-4 h-4 text-gray-400" />
                {/if}
              </div>
              <div class="flex-1">
                <p class="text-sm font-medium">专家评审</p>
                <p class="text-xs text-gray-500">
                  {reviews.length > 0 ? `完成于 ${formatDate(reviews[reviews.length - 1].reviewDate)}` : request.status === 'review_pending' ? '待评审' : '未开始'}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  {/if}
</div>

<Modal bind:open={showStepModal} maxWidth="md">
  <ModalHeader>
    <h3 class="text-xl font-bold">编辑工序信息</h3>
  </ModalHeader>
  <ModalBody>
    <div class="space-y-4">
      {#if selectedStep}
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">工序类型</label>
            <Input value={restorationStepLabels[selectedStep.stepType]} disabled />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">当前状态</label>
            <Badge variant={restorationStepStatusLabels[selectedStep.status].variant} class="inline-block mt-2">
              {restorationStepStatusLabels[selectedStep.status].name}
            </Badge>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">使用材料</label>
          <Select bind:value={stepForm.materialId}>
            <SelectOption value="">请选择材料</SelectOption>
            {#each materials as material}
              <SelectOption value={material.id}>{material.name} (库存: {material.stock})</SelectOption>
            {/each}
          </Select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            材料批号
            <span class="text-red-500">*</span>
            {#if !stepForm.materialBatch}
              <AlertTriangle class="w-4 h-4 inline ml-1 text-orange-500" />
            {/if}
          </label>
          <Input bind:value={stepForm.materialBatch} placeholder="请输入材料批号" required />
          {#if !stepForm.materialBatch}
            <p class="text-xs text-amber-600 mt-1 flex items-center">
              <AlertTriangle class="w-3 h-3 mr-1" />
              未填写批号将保存为「待补录」状态，专家评审前需补齐
            </p>
          {/if}
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">修复备注</label>
          <Textarea bind:value={stepForm.notes} placeholder="记录工序操作详情..." rows={3} />
        </div>
      {/if}

      <div class="flex justify-end gap-3 pt-4 border-t">
        <Button variant="tertiary" on:click={() => (showStepModal = false)}>
          <X class="w-4 h-4 mr-2" />
          取消
        </Button>
        <Button variant="primary" on:click={saveStep}>
          <Save class="w-4 h-4 mr-2" />
          保存
        </Button>
      </div>
    </div>
  </ModalBody>
</Modal>

<Modal bind:open={showReviewModal} maxWidth="lg">
  <ModalHeader>
    <h3 class="text-xl font-bold">专家评审</h3>
  </ModalHeader>
  <ModalBody>
    <div class="space-y-4">
      {#if request && book}
        <div class="p-4 bg-amber-50 rounded-lg border border-amber-200">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <p class="text-sm text-gray-500">古籍名称</p>
              <p class="font-semibold">{book.title}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">珍贵等级</p>
              <Badge variant={book.rarityLevel === 'national_treasure' || book.rarityLevel === 'precious' ? 'warning' : 'secondary'}>
                {rarityLevelLabels[book.rarityLevel]}
              </Badge>
              {#if isPreciousBook()}
                <ShieldAlert class="w-4 h-4 inline ml-1 text-red-500" />
              {/if}
            </div>
          </div>
        </div>

        {#if pendingBatchCount(request) > 0}
          <div class="p-4 bg-red-50 rounded-lg border border-red-200 flex items-start gap-3">
            <AlertTriangle class="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <p class="font-semibold text-red-700">存在待补录材料批号的工序</p>
              <p class="text-sm text-red-600">
                当前有 {pendingBatchCount(request)} 道工序未补齐材料批号，请先补齐批号后再进行专家评审
              </p>
            </div>
          </div>
        {/if}

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">评审决定</label>
          <Select bind:value={reviewForm.decision}>
            <SelectOption value="approved">通过</SelectOption>
            <SelectOption value="rejected">驳回</SelectOption>
          </Select>
        </div>

        <div>
          <Checkbox bind:checked={reviewForm.canOpenToPublic} label="是否可重新开放阅览" />
          {#const imageCompleteness = checkImageCompleteness()}
            {#if !imageCompleteness.complete}
              <p class="text-xs text-orange-600 mt-1 flex items-center">
                <AlertTriangle class="w-3 h-3 mr-1" />
                警告：修复前后照片不完整，开放阅览前需补充照片
              </p>
            {/if}
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
        <Button
          variant="primary"
          on:click={submitReview}
          disabled={request ? pendingBatchCount(request) > 0 : false}
        >
          <Save class="w-4 h-4 mr-2" />
          提交评审
        </Button>
      </div>
    </div>
  </ModalBody>
</Modal>

<Modal bind:open={showSupplementModal} maxWidth="md">
  <ModalHeader>
    <h3 class="text-xl font-bold">补录材料批号</h3>
  </ModalHeader>
  <ModalBody>
    <div class="space-y-4">
      {#if supplementTargetStep}
        <div class="p-3 bg-amber-50 rounded-lg border border-amber-200 flex items-start gap-2">
          <AlertTriangle class="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
          <div>
            <p class="text-sm font-medium text-amber-800">
              工序：{restorationStepLabels[supplementTargetStep.stepType]}
            </p>
            <p class="text-xs text-amber-700">
              该工序已暂存为「待补录」状态，补齐材料批号后将转为已完成
            </p>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            材料批号
            <span class="text-red-500">*</span>
          </label>
          <Input bind:value={supplementForm.materialBatch} placeholder="请输入材料批号" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">使用材料（可选）</label>
          <Select bind:value={supplementForm.materialId}>
            <SelectOption value="">请选择材料</SelectOption>
            {#each materials as material}
              <SelectOption value={material.id}>{material.name} (库存: {material.stock})</SelectOption>
            {/each}
          </Select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">备注</label>
          <Textarea bind:value={supplementForm.notes} placeholder="补充说明..." rows={3} />
        </div>
      {/if}

      <div class="flex justify-end gap-3 pt-4 border-t">
        <Button variant="tertiary" on:click={() => (showSupplementModal = false)}>
          <X class="w-4 h-4 mr-2" />
          取消
        </Button>
        <Button variant="warning" on:click={saveSupplement}>
          <Save class="w-4 h-4 mr-2" />
          确认补录
        </Button>
      </div>
    </div>
  </ModalBody>
</Modal>
