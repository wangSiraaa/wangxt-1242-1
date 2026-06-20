<script lang="ts">
  import { onMount } from 'svelte';
  import { Card, Button, Input, Select, Modal, Badge } from '@skeletonlabs/skeleton';
  import { FileText, Plus, Search, Filter, Eye, Clock, AlertTriangle, CheckCircle } from 'lucide-svelte';
  import { restorationRequestsApi, ancientBooksApi, usersApi } from '$lib/api';
  import { notifications } from '$stores/notification';
  import { formatDate, handleApiError, classNames } from '$lib/utils';
  import type { RestorationRequest, AncientBook, User, RequestStatus } from '$types';
  import { requestStatusLabels, rarityLevelLabels, userRoleLabels } from '$lib/enums';
  import { goto } from '$app/navigation';

  let requests: RestorationRequest[] = [];
  let books: AncientBook[] = [];
  let librarians: User[] = [];
  let total = 0;
  let page = 1;
  let limit = 10;
  let keyword = '';
  let selectedStatus = '';
  let loading = false;
  let showCreateModal = false;

  let statusOptions: { status: RequestStatus; name: string }[] = [];

  let formData = {
    bookId: '',
    submittedBy: '',
    priority: 'normal' as 'normal' | 'high' | 'urgent',
    reason: '',
    expectedDuration: undefined as number | undefined,
    notes: '',
  };

  onMount(async () => {
    await loadOptions();
    await loadRequests();
  });

  async function loadOptions() {
    try {
      const [booksRes, librariansRes] = await Promise.all([
        ancientBooksApi.findAll(1, 100),
        usersApi.getLibrarians(),
      ]);
      books = booksRes.data?.items || [];
      librarians = librariansRes.data || [];
      
      statusOptions = Object.entries(requestStatusLabels).map(([status, label]) => ({
        status: status as RequestStatus,
        name: label.name,
      }));
    } catch (error) {
      notifications.error('加载选项数据失败');
    }
  }

  async function loadRequests() {
    loading = true;
    try {
      const response = await restorationRequestsApi.findAll(
        page,
        limit,
        selectedStatus || undefined,
      );
      requests = response.data?.items || [];
      total = response.data?.total || 0;
    } catch (error) {
      const { message } = handleApiError(error);
      notifications.error(message);
    } finally {
      loading = false;
    }
  }

  async function handleSearch() {
    page = 1;
    await loadRequests();
  }

  async function handleCreate() {
    if (!formData.bookId || !formData.submittedBy || !formData.reason) {
      notifications.error('请填写必填项');
      return;
    }

    try {
      const response = await restorationRequestsApi.create({
        bookId: formData.bookId,
        submittedBy: formData.submittedBy,
        priority: formData.priority,
        reason: formData.reason,
        expectedDuration: formData.expectedDuration,
        notes: formData.notes,
      });
      notifications.success('修复申请创建成功');
      showCreateModal = false;
      resetForm();
      await loadRequests();
    } catch (error) {
      const { message } = handleApiError(error);
      notifications.error(message);
    }
  }

  function resetForm() {
    formData = {
      bookId: '',
      submittedBy: '',
      priority: 'normal',
      reason: '',
      expectedDuration: undefined,
      notes: '',
    };
  }

  function viewDetail(request: RestorationRequest) {
    goto(`/requests/${request.id}`);
  }

  function getPriorityColor(priority: string) {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      default:
        return 'bg-gray-400';
    }
  }

  $: totalPages = Math.ceil(total / limit);
  $: availableBooks = books.filter(b => b.borrowingStatus !== 'under_restoration');
</script>

<div class="p-6 space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h2 class="text-2xl font-bold text-amber-900">修复申请管理</h2>
      <p class="text-amber-700/70 mt-1">管理古籍修复申请的提交和审批</p>
    </div>
    <Button on:click={() => (showCreateModal = true)} class="bg-primary-600 hover:bg-primary-700">
      <Plus class="w-4 h-4 mr-2" />
      提交申请
    </Button>
  </div>

  <div class="grid grid-cols-4 gap-4">
    {#each statusOptions.slice(0, 4) as status}
      <Card class="p-4 card-shadow">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">{status.name}</p>
            <p class="text-2xl font-bold mt-1 text-gray-800">
              {requests.filter(r => r.status === status.status).length}
            </p>
          </div>
          <div class="p-2 rounded-lg {requestStatusLabels[status.status].bgColor}">
            {#if status.status === 'completed'}
              <CheckCircle class="w-5 h-5 text-green-600" />
            {:else if status.status === 'review_pending'}
              <AlertTriangle class="w-5 h-5 text-orange-600" />
            {:else}
              <Clock class="w-5 h-5 text-gray-600" />
            {/if}
          </div>
        </div>
      </Card>
    {/each}
  </div>

  <Card class="p-6 card-shadow">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div class="relative">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          bind:value={keyword}
          placeholder="搜索申请编号、书名..."
          class="pl-10"
          on:keydown={(e) => e.key === 'Enter' && handleSearch()}
        />
      </div>
      <Select bind:value={selectedStatus} on:change={handleSearch}>
        <option value="">全部状态</option>
        {#each statusOptions as status}
          <option value={status.status}>{status.name}</option>
        {/each}
      </Select>
      <Button on:click={handleSearch} variant="soft">
        <Filter class="w-4 h-4 mr-2" />
        筛选
      </Button>
    </div>

    {#if loading}
      <div class="py-16 text-center">
        <div class="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-3" />
        <p class="text-gray-500">加载中...</p>
      </div>
    {:else if requests.length > 0}
      <div class="space-y-4">
        {#each requests as request}
          <div
            class="p-4 rounded-lg border border-amber-200 hover:border-primary-300 hover:shadow-md transition-all cursor-pointer"
            on:click={() => viewDetail(request)}
          >
            <div class="flex items-start justify-between">
              <div class="flex items-start gap-4">
                <div class="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <FileText class="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <div class="flex items-center gap-3 mb-1">
                    <span class="font-mono text-sm text-gray-500">{request.requestNo}</span>
                    <span class="inline-flex items-center gap-1">
                      <span class="w-2 h-2 rounded-full {getPriorityColor(request.priority)}" />
                      <span class="text-xs text-gray-500">
                        {request.priority === 'urgent' ? '紧急' : request.priority === 'high' ? '高' : '普通'}
                      </span>
                    </span>
                    {#if request.book?.isPrecious}
                      <Badge variant="soft" class="bg-red-50 text-red-700 text-xs">需专家评审</Badge>
                    {/if}
                  </div>
                  <h4 class="font-semibold text-gray-800 text-lg">{request.book?.title || '-'}</h4>
                  <div class="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <span>申请人：{request.submittedByUser?.name || '-'}</span>
                    <span>提交时间：{formatDate(request.createdAt)}</span>
                    {#if request.expectedDuration}
                      <span>预计工期：{request.expectedDuration} 天</span>
                    {/if}
                  </div>
                  {#if request.reason}
                    <p class="text-sm text-gray-600 mt-2 line-clamp-1">{request.reason}</p>
                  {/if}
                </div>
              </div>
              <div class="flex flex-col items-end gap-2">
                <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium {requestStatusLabels[request.status].bgColor} {requestStatusLabels[request.status].color}">
                  {requestStatusLabels[request.status].name}
                </span>
                {#if request.book}
                  <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium {rarityLevelLabels[request.book.rarityLevel].bgColor} {rarityLevelLabels[request.book.rarityLevel].color}">
                    {rarityLevelLabels[request.book.rarityLevel].name}
                  </span>
                {/if}
                <button
                  class="text-primary-600 hover:text-primary-700 text-sm font-medium mt-2"
                  on:click|stopPropagation={() => viewDetail(request)}
                >
                  查看详情 →
                </button>
              </div>
            </div>

            {#if request.steps && request.steps.length > 0}
              <div class="mt-4 pt-4 border-t border-amber-100">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-xs font-medium text-gray-500">修复工序进度</span>
                  <span class="text-xs text-gray-500">
                    {request.steps.filter(s => s.status === 'completed').length} / {request.steps.length} 已完成
                  </span>
                </div>
                <div class="flex gap-2">
                  {#each request.steps as step}
                    <div
                      class={classNames(
                        'flex-1 h-2 rounded-full overflow-hidden',
                        step.status === 'completed' ? 'bg-green-500' :
                        step.status === 'in_progress' ? 'bg-blue-500' : 'bg-gray-200'
                      )}
                      title={`${step.stepType} - ${step.status === 'completed' ? '已完成' : step.status === 'in_progress' ? '进行中' : '待执行'}`}
                    />
                  {/each}
                </div>
              </div>
            {/if}
          </div>
        {/each}
      </div>

      {#if totalPages > 1}
        <div class="flex items-center justify-between mt-6 pt-4 border-t border-amber-100">
          <p class="text-sm text-gray-500">
            共 {total} 条记录，第 {page} / {totalPages} 页
          </p>
          <div class="flex items-center gap-2">
            <Button
              size="sm"
              variant="soft"
              disabled={page === 1}
              on:click={() => {
                page--;
                loadRequests();
              }}
            >
              上一页
            </Button>
            <Button
              size="sm"
              variant="soft"
              disabled={page === totalPages}
              on:click={() => {
                page++;
                loadRequests();
              }}
            >
              下一页
            </Button>
          </div>
        </div>
      {/if}
    {:else}
      <div class="text-center py-16">
        <FileText class="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <p class="text-lg font-medium text-gray-600 mb-2">暂无修复申请</p>
        <p class="text-gray-500">点击上方按钮提交新的修复申请</p>
      </div>
    {/if}
  </Card>

  <Modal open={showCreateModal} on:close={() => (showCreateModal = false)}>
    <div class="p-6 max-w-2xl">
      <h3 class="text-xl font-bold text-amber-900 mb-6">提交修复申请</h3>
      
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">选择古籍 *</label>
          <Select bind:value={formData.bookId}>
            <option value="">请选择需要修复的古籍</option>
            {#each availableBooks as book}
              <option value={book.id}>
                {book.bookCode} - {book.title} ({rarityLevelLabels[book.rarityLevel].name})
              </option>
            {/each}
          </Select>
          {#if availableBooks.length === 0}
            <p class="text-xs text-orange-600 mt-1">当前没有可修复的古籍</p>
          {/if}
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">申请人 *</label>
          <Select bind:value={formData.submittedBy}>
            <option value="">请选择申请人</option>
            {#each librarians as lib}
              <option value={lib.id}>{lib.name}</option>
            {/each}
          </Select>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">优先级</label>
            <Select bind:value={formData.priority}>
              <option value="normal">普通</option>
              <option value="high">高</option>
              <option value="urgent">紧急</option>
            </Select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">预计工期（天）</label>
            <Input
              type="number"
              bind:value={formData.expectedDuration}
              placeholder="如：7"
            />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">修复原因 *</label>
          <textarea
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none"
            rows={4}
            bind:value={formData.reason}
            placeholder="请详细描述古籍破损情况和修复原因"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">备注</label>
          <textarea
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none"
            rows={2}
            bind:value={formData.notes}
            placeholder="其他需要说明的信息"
          />
        </div>
      </div>

      <div class="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
        <Button variant="ghost" on:click={() => (showCreateModal = false)}>
          取消
        </Button>
        <Button class="bg-primary-600 hover:bg-primary-700" on:click={handleCreate}>
          提交申请
        </Button>
      </div>
    </div>
  </Modal>
</div>
