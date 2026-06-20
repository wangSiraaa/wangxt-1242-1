<script lang="ts">
  import { onMount } from 'svelte';
  import { Card, Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Modal, ModalBody, ModalHeader, Input, Select, SelectOption, Textarea, Badge } from '@skeletonlabs/skeleton';
  import { CheckCircle, Clock, AlertTriangle, FileText, Save, X, Search } from 'lucide-svelte';
  import { api } from '$lib/api';
  import { handleApiError, formatDate } from '$lib/utils';
  import { restorationStepLabels, restorationStepStatusLabels } from '$lib/enums';
  import type { RestorationStep, RestorationRequest, Material } from '$lib/types';
  import { notifications } from '$stores/notification';

  let steps: RestorationStep[] = [];
  let requests: RestorationRequest[] = [];
  let materials: Material[] = [];
  let loading = false;
  let showEditModal = false;
  let selectedStep: RestorationStep | null = null;
  let searchQuery = '';
  let statusFilter = '';

  let editForm = {
    materialId: '',
    materialBatch: '',
    notes: '',
    startTime: '',
    endTime: '',
  };

  const loadData = async () => {
    loading = true;
    try {
      const [stepsRes, requestsRes, materialsRes] = await Promise.all([
        api.get('/restoration-steps'),
        api.get('/restoration-requests'),
        api.get('/materials'),
      ]);
      steps = stepsRes.data;
      requests = requestsRes.data;
      materials = materialsRes.data;
    } catch (e) {
      handleApiError(e, '加载工序数据失败');
    } finally {
      loading = false;
    }
  };

  const openEditModal = (step: RestorationStep) => {
    selectedStep = step;
    editForm = {
      materialId: step.materialId || '',
      materialBatch: step.materialBatch || '',
      notes: step.notes || '',
      startTime: step.startTime ? step.startTime.slice(0, 16) : '',
      endTime: step.endTime ? step.endTime.slice(0, 16) : '',
    };
    showEditModal = true;
  };

  const saveStep = async () => {
    if (!selectedStep) return;
    
    try {
      await api.put(`/restoration-steps/${selectedStep.id}`, editForm);
      notifications.add('工序信息已更新', 'success');
      showEditModal = false;
      await loadData();
    } catch (e) {
      handleApiError(e, '保存工序信息失败');
    }
  };

  const startStep = async (step: RestorationStep) => {
    try {
      await api.post(`/restoration-steps/${step.id}/start`);
      notifications.add('工序已开始', 'success');
      await loadData();
    } catch (e) {
      handleApiError(e, '开始工序失败');
    }
  };

  const completeStep = async (step: RestorationStep) => {
    try {
      await api.post(`/restoration-steps/${step.id}/complete`);
      notifications.add('工序已完成', 'success');
      await loadData();
    } catch (e) {
      handleApiError(e, '完成工序失败');
    }
  };

  const getRequestTitle = (requestId: string) => {
    const request = requests.find(r => r.id === requestId);
    if (!request) return requestId;
    const book = request.book;
    return book ? `${book.title} (${book.code})` : requestId;
  };

  const getMaterialName = (materialId: string | null | undefined) => {
    if (!materialId) return '-';
    const material = materials.find(m => m.id === materialId);
    return material ? material.name : materialId;
  };

  const filteredSteps = steps.filter(step => {
    const matchesSearch = searchQuery === '' || 
      getRequestTitle(step.requestId).toLowerCase().includes(searchQuery.toLowerCase()) ||
      restorationStepLabels[step.stepType].toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === '' || step.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  onMount(() => {
    loadData();
  });
</script>

<div class="p-6 space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h2 class="text-2xl font-bold text-amber-900">工序管理</h2>
      <p class="text-amber-700/70 mt-1">管理脱酸、补纸和装帧修复工序</p>
    </div>
  </div>

  <div class="flex items-center gap-4">
    <div class="flex-1 relative">
      <Search class="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <Input bind:value={searchQuery} placeholder="搜索工序..." class="pl-10" />
    </div>
    <Select bind:value={statusFilter} class="w-48">
      <SelectOption value="">全部状态</SelectOption>
      <SelectOption value="pending">待处理</SelectOption>
      <SelectOption value="in_progress">进行中</SelectOption>
      <SelectOption value="completed">已完成</SelectOption>
    </Select>
  </div>

  <Card class="card-shadow">
    {#if loading}
      <div class="p-8 text-center text-gray-500">加载中...</div>
    {:else if filteredSteps.length === 0}
      <div class="p-8 text-center text-gray-500">
        <FileText class="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p>暂无工序数据</p>
      </div>
    {:else}
      <Table>
        <TableHead>
          <TableRow>
            <TableHeader>古籍信息</TableHeader>
            <TableHeader>工序类型</TableHeader>
            <TableHeader>状态</TableHeader>
            <TableHeader>使用材料</TableHeader>
            <TableHeader>材料批号</TableHeader>
            <TableHeader>开始时间</TableHeader>
            <TableHeader>完成时间</TableHeader>
            <TableHeader class="text-right">操作</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {#each filteredSteps as step}
            <TableRow>
              <TableCell class="font-medium">{getRequestTitle(step.requestId)}</TableCell>
              <TableCell>{restorationStepLabels[step.stepType]}</TableCell>
              <TableCell>
                <Badge variant={restorationStepStatusLabels[step.status].variant}>
                  {restorationStepStatusLabels[step.status].name}
                </Badge>
              </TableCell>
              <TableCell>{getMaterialName(step.materialId)}</TableCell>
              <TableCell>
                {#if step.materialBatch}
                  <span class="font-mono text-sm">{step.materialBatch}</span>
                {:else}
                  <span class="text-red-500 text-sm">缺失</span>
                {/if}
              </TableCell>
              <TableCell>{step.startTime ? formatDate(step.startTime) : '-'}</TableCell>
              <TableCell>{step.endTime ? formatDate(step.endTime) : '-'}</TableCell>
              <TableCell class="text-right">
                <div class="flex justify-end gap-2">
                  {#if step.status === 'pending'}
                    <Button size="sm" variant="primary" on:click={() => startStep(step)}>
                      <Clock class="w-4 h-4 mr-1" />
                      开始
                    </Button>
                  {/if}
                  {#if step.status === 'in_progress'}
                    <Button size="sm" variant="success" on:click={() => completeStep(step)}>
                      <CheckCircle class="w-4 h-4 mr-1" />
                      完成
                    </Button>
                  {/if}
                  <Button size="sm" variant="tertiary" on:click={() => openEditModal(step)}>
                    编辑
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          {/each}
        </TableBody>
      </Table>
    {/if}
  </Card>
</div>

<Modal bind:open={showEditModal} maxWidth="md">
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
          <Select bind:value={editForm.materialId}>
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
            {#if !editForm.materialBatch}
              <AlertTriangle class="w-4 h-4 inline ml-1 text-orange-500" />
            {/if}
          </label>
          <Input bind:value={editForm.materialBatch} placeholder="请输入材料批号" required />
          {#if !editForm.materialBatch}
            <p class="text-xs text-red-500 mt-1">材料批号缺失无法提交工序完成</p>
          {/if}
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">开始时间</label>
            <Input type="datetime-local" bind:value={editForm.startTime} />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">完成时间</label>
            <Input type="datetime-local" bind:value={editForm.endTime} />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">备注</label>
          <Textarea bind:value={editForm.notes} placeholder="记录工序操作详情..." rows={3} />
        </div>
      {/if}

      <div class="flex justify-end gap-3 pt-4 border-t">
        <Button variant="tertiary" on:click={() => (showEditModal = false)}>
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
