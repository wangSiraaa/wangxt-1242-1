<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { Card, Button, Badge, Modal, ModalBody, ModalHeader, Input, Select, SelectOption, Textarea } from '@skeletonlabs/skeleton';
  import { ArrowLeft, Edit2, Save, X, Image, FileText, History, BookOpen, ShieldAlert } from 'lucide-svelte';
  import { api } from '$lib/api';
  import { handleApiError, formatDate } from '$lib/utils';
  import { rarityLevelLabels, bookStatusLabels, restorationStepLabels, restorationStepStatusLabels, requestStatusLabels } from '$lib/enums';
  import type { AncientBook, RestorationRequest, BookImage, BorrowingRestriction } from '$types';
  import { notifications } from '$stores/notification';

  let book: AncientBook | null = null;
  let requests: RestorationRequest[] = [];
  let images: BookImage[] = [];
  let restrictions: BorrowingRestriction[] = [];
  let loading = true;
  let showEditModal = false;
  let activeTab = 'info';

  let editForm = {
    title: '',
    code: '',
    author: '',
    dynasty: '',
    publicationDate: '',
    rarityLevel: 'general' as AncientBook['rarityLevel'],
    status: 'available' as AncientBook['status'],
    description: '',
    physicalCondition: '',
    location: '',
    callNumber: '',
  };

  const loadData = async () => {
    const id = $page.params.id;
    loading = true;
    try {
      const [bookRes, requestsRes, imagesRes, restrictionsRes] = await Promise.all([
        api.get(`/ancient-books/${id}`),
        api.get(`/restoration-requests?bookId=${id}`),
        api.get(`/book-images?bookId=${id}`),
        api.get(`/borrowing-restrictions?bookId=${id}`),
      ]);
      book = bookRes.data;
      requests = requestsRes.data;
      images = imagesRes.data;
      restrictions = restrictionsRes.data;
      
      editForm = {
        title: book.title,
        code: book.code,
        author: book.author || '',
        dynasty: book.dynasty || '',
        publicationDate: book.publicationDate ? book.publicationDate.slice(0, 10) : '',
        rarityLevel: book.rarityLevel,
        status: book.status,
        description: book.description || '',
        physicalCondition: book.physicalCondition || '',
        location: book.location || '',
        callNumber: book.callNumber || '',
      };
    } catch (e) {
      handleApiError(e, '加载古籍详情失败');
    } finally {
      loading = false;
    }
  };

  const updateBook = async () => {
    if (!book) return;

    try {
      await api.put(`/ancient-books/${book.id}`, editForm);
      notifications.add('古籍信息已更新', 'success');
      showEditModal = false;
      await loadData();
    } catch (e) {
      handleApiError(e, '更新古籍信息失败');
    }
  };

  const getImageUrl = (imagePath: string) => {
    return `/api/book-images/${imagePath}`;
  };

  const getActiveRestriction = () => {
    return restrictions.find(r => r.status === 'active');
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
      {#if book}
        <div class="flex items-center gap-3">
          <h2 class="text-2xl font-bold text-amber-900">{book.title}</h2>
          <Badge variant={book.rarityLevel === 'national_treasure' || book.rarityLevel === 'precious' ? 'warning' : 'secondary'}>
            {rarityLevelLabels[book.rarityLevel]}
          </Badge>
          <Badge variant={bookStatusLabels[book.status].variant}>
            {bookStatusLabels[book.status].name}
          </Badge>
          {#if book.rarityLevel === 'national_treasure' || book.rarityLevel === 'precious'}
            <ShieldAlert class="w-5 h-5 text-red-500" />
          {/if}
        </div>
        <p class="text-amber-700/70 mt-1">编号：{book.code}</p>
      {/if}
    </div>
    <Button variant="primary" on:click={() => (showEditModal = true)}>
      <Edit2 class="w-4 h-4 mr-2" />
      编辑
    </Button>
  </div>

  {#if loading}
    <div class="p-12 text-center text-gray-500">加载中...</div>
  {:else if book}
    {#const activeRestriction = getActiveRestriction()}
      {#if activeRestriction}
        <Card class="p-4 bg-red-50 border-red-200">
          <div class="flex items-center gap-3">
            <ShieldAlert class="w-6 h-6 text-red-500" />
            <div>
              <p class="font-semibold text-red-700">当前有借阅限制</p>
              <p class="text-sm text-red-600">
                限制类型：{restrictionTypeLabels[activeRestriction.type]}
                {#if activeRestriction.requireExpertReview}
                  <span class="ml-2">· 需要专家评审</span>
                {/if}
              </p>
            </div>
          </div>
        </Card>
      {/if}
    {/if}

    <div class="flex gap-2 border-b">
      <Button variant={activeTab === 'info' ? 'primary' : 'tertiary'} on:click={() => (activeTab = 'info')}>
        <BookOpen class="w-4 h-4 mr-2" />
        基本信息
      </Button>
      <Button variant={activeTab === 'restoration' ? 'primary' : 'tertiary'} on:click={() => (activeTab = 'restoration')}>
        <FileText class="w-4 h-4 mr-2" />
        修复记录
      </Button>
      <Button variant={activeTab === 'images' ? 'primary' : 'tertiary'} on:click={() => (activeTab = 'images')}>
        <Image class="w-4 h-4 mr-2" />
        图片档案
      </Button>
      <Button variant={activeTab === 'history' ? 'primary' : 'tertiary'} on:click={() => (activeTab = 'history')}>
        <History class="w-4 h-4 mr-2" />
        借阅历史
      </Button>
    </div>

    {#if activeTab === 'info' && book}
      <div class="grid grid-cols-2 gap-6">
        <Card class="card-shadow p-6">
          <h3 class="text-lg font-semibold mb-4">基本信息</h3>
          <div class="space-y-3">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <p class="text-sm text-gray-500">古籍编号</p>
                <p class="font-mono font-medium">{book.code}</p>
              </div>
              <div>
                <p class="text-sm text-gray-500">索书号</p>
                <p class="font-medium">{book.callNumber || '-'}</p>
              </div>
              <div>
                <p class="text-sm text-gray-500">作者</p>
                <p class="font-medium">{book.author || '-'}</p>
              </div>
              <div>
                <p class="text-sm text-gray-500">朝代</p>
                <p class="font-medium">{book.dynasty || '-'}</p>
              </div>
              <div>
                <p class="text-sm text-gray-500">出版日期</p>
                <p class="font-medium">{book.publicationDate ? formatDate(book.publicationDate) : '-'}</p>
              </div>
              <div>
                <p class="text-sm text-gray-500">馆藏位置</p>
                <p class="font-medium">{book.location || '-'}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card class="card-shadow p-6">
          <h3 class="text-lg font-semibold mb-4">状态信息</h3>
          <div class="space-y-3">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <p class="text-sm text-gray-500">珍贵等级</p>
                <Badge variant={book.rarityLevel === 'national_treasure' || book.rarityLevel === 'precious' ? 'warning' : 'secondary'} class="mt-1">
                  {rarityLevelLabels[book.rarityLevel]}
                </Badge>
              </div>
              <div>
                <p class="text-sm text-gray-500">当前状态</p>
                <Badge variant={bookStatusLabels[book.status].variant} class="mt-1">
                  {bookStatusLabels[book.status].name}
                </Badge>
              </div>
            </div>
            <div>
              <p class="text-sm text-gray-500">物理状况</p>
              <p class="mt-1">{book.physicalCondition || '-'}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">描述</p>
              <p class="mt-1">{book.description || '-'}</p>
            </div>
          </div>
        </Card>
      </div>
    {:else if activeTab === 'restoration'}
      <Card class="card-shadow">
        {#if requests.length === 0}
          <div class="p-8 text-center text-gray-500">
            <FileText class="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>暂无修复记录</p>
          </div>
        {:else}
          <div class="divide-y">
            {#each requests as request}
              <div class="p-4">
                <div class="flex items-center justify-between mb-3">
                  <div>
                    <p class="font-semibold">{request.requestNo}</p>
                    <p class="text-sm text-gray-500">申请时间：{formatDate(request.createdAt)}</p>
                  </div>
                  <Badge variant={requestStatusLabels[request.status].variant}>
                    {requestStatusLabels[request.status].name}
                  </Badge>
                </div>
                <p class="text-sm text-gray-600 mb-3">{request.description || '无描述'}</p>
                <div class="flex gap-2">
                  {#each request.steps || [] as step}
                    <Badge variant={restorationStepStatusLabels[step.status].variant}>
                      {restorationStepLabels[step.stepType]}: {restorationStepStatusLabels[step.status].name}
                    </Badge>
                  {/each}
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </Card>
    {:else if activeTab === 'images'}
      <Card class="card-shadow p-6">
        {#if images.length === 0}
          <div class="p-8 text-center text-gray-500">
            <Image class="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>暂无图片档案</p>
          </div>
        {:else}
          <div class="grid grid-cols-4 gap-4">
            {#each images as image}
              <div class="relative group">
                <div class="aspect-video rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                  <img 
                    src={getImageUrl(image.filePath)} 
                    alt={image.description || imageTypeLabels[image.imageType]}
                    class="w-full h-full object-cover"
                    onerror="this.style.display='none'; this.parentElement.innerHTML='<div class=\'w-full h-full flex items-center justify-center text-gray-400\'><Image class=\'w-12 h-12\' /></div>'"
                  />
                </div>
                <div class="mt-2">
                  <Badge variant={imageTypeLabels[image.imageType].variant} class="text-xs">
                    {imageTypeLabels[image.imageType].name}
                  </Badge>
                  <p class="text-xs text-gray-500 mt-1">{formatDate(image.uploadedAt)}</p>
                  <p class="text-xs truncate">{image.description || '无描述'}</p>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </Card>
    {:else if activeTab === 'history'}
      <Card class="card-shadow p-6">
        <div class="p-8 text-center text-gray-500">
          <History class="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>借阅历史功能开发中</p>
        </div>
      </Card>
    {/if}
  </div>
}

<Modal bind:open={showEditModal} maxWidth="lg">
  <ModalHeader>
    <h3 class="text-xl font-bold">编辑古籍信息</h3>
  </ModalHeader>
  <ModalBody>
    <div class="space-y-4">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">古籍名称 <span class="text-red-500">*</span></label>
          <Input bind:value={editForm.title} required />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">古籍编号 <span class="text-red-500">*</span></label>
          <Input bind:value={editForm.code} required />
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">作者</label>
          <Input bind:value={editForm.author} />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">朝代</label>
          <Input bind:value={editForm.dynasty} />
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">出版日期</label>
          <Input type="date" bind:value={editForm.publicationDate} />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">索书号</label>
          <Input bind:value={editForm.callNumber} />
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">珍贵等级 <span class="text-red-500">*</span></label>
          <Select bind:value={editForm.rarityLevel}>
            <SelectOption value="general">普通</SelectOption>
            <SelectOption value="rare">善本</SelectOption>
            <SelectOption value="precious">珍贵</SelectOption>
            <SelectOption value="national_treasure">国宝级</SelectOption>
          </Select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">当前状态 <span class="text-red-500">*</span></label>
          <Select bind:value={editForm.status}>
            <SelectOption value="available">可借阅</SelectOption>
            <SelectOption value="under_restoration">修复中</SelectOption>
            <SelectOption value="restricted">限制阅览</SelectOption>
            <SelectOption value="archived">已归档</SelectOption>
          </Select>
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">馆藏位置</label>
        <Input bind:value={editForm.location} />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">物理状况</label>
        <Textarea bind:value={editForm.physicalCondition} rows={2} />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">描述</label>
        <Textarea bind:value={editForm.description} rows={2} />
      </div>

      <div class="flex justify-end gap-3 pt-4 border-t">
        <Button variant="tertiary" on:click={() => (showEditModal = false)}>
          <X class="w-4 h-4 mr-2" />
          取消
        </Button>
        <Button variant="primary" on:click={updateBook}>
          <Save class="w-4 h-4 mr-2" />
          保存
        </Button>
      </div>
    </div>
  </ModalBody>
</Modal>
