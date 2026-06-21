<script lang="ts">
  import { onMount } from 'svelte';
  import { Card, Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Modal, ModalBody, ModalHeader, Input, Select, SelectOption, Textarea, Badge, Checkbox } from '@skeletonlabs/skeleton';
  import { Ban, Plus, Search, Edit2, Trash2, Save, X, AlertTriangle, Clock, CheckCircle, BookOpen } from 'lucide-svelte';
  import { api } from '$lib/api';
  import { handleApiError, formatDate } from '$lib/utils';
  import { restrictionTypeLabels, restrictionStatusLabels, rarityLevelLabels } from '$lib/enums';
  import type { BorrowingRestriction, AncientBook, BorrowingRecord } from '$types';
  import { notifications } from '$stores/notification';

  let restrictions: BorrowingRestriction[] = [];
  let books: AncientBook[] = [];
  let records: BorrowingRecord[] = [];
  let loading = false;
  let showCreateModal = false;
  let showEditModal = false;
  let selectedRestriction: BorrowingRestriction | null = null;
  let searchQuery = '';
  let typeFilter = '';
  let activeTab = 'restrictions';

  let createForm = {
    bookId: '',
    type: 'under_restoration' as BorrowingRestriction['type'],
    reason: '',
    startDate: '',
    endDate: '',
    isPermanent: false,
    requireExpertReview: false,
  };

  let editForm = { ...createForm };

  const loadData = async () => {
    loading = true;
    try {
      const [restrictionsRes, booksRes, recordsRes] = await Promise.all([
        api.get('/borrowing-restrictions'),
        api.get('/ancient-books'),
        api.get('/borrowing-records'),
      ]);
      restrictions = restrictionsRes.data;
      books = booksRes.data;
      records = recordsRes.data;
    } catch (e) {
      handleApiError(e, '加载借阅限制数据失败');
    } finally {
      loading = false;
    }
  };

  const openCreateModal = () => {
    createForm = {
      bookId: '',
      type: 'under_restoration',
      reason: '',
      startDate: new Date().toISOString().slice(0, 10),
      endDate: '',
      isPermanent: false,
      requireExpertReview: false,
    };
    showCreateModal = true;
  };

  const openEditModal = (restriction: BorrowingRestriction) => {
    selectedRestriction = restriction;
    editForm = {
      bookId: restriction.bookId,
      type: restriction.type,
      reason: restriction.reason || '',
      startDate: restriction.startDate ? restriction.startDate.slice(0, 10) : '',
      endDate: restriction.endDate ? restriction.endDate.slice(0, 10) : '',
      isPermanent: restriction.isPermanent,
      requireExpertReview: restriction.requireExpertReview,
    };
    showEditModal = true;
  };

  const createRestriction = async () => {
    try {
      await api.post('/borrowing-restrictions', createForm);
      notifications.add('借阅限制创建成功', 'success');
      showCreateModal = false;
      await loadData();
    } catch (e) {
      handleApiError(e, '创建借阅限制失败');
    }
  };

  const updateRestriction = async () => {
    if (!selectedRestriction) return;

    try {
      await api.put(`/borrowing-restrictions/${selectedRestriction.id}`, editForm);
      notifications.add('借阅限制更新成功', 'success');
      showEditModal = false;
      await loadData();
    } catch (e) {
      handleApiError(e, '更新借阅限制失败');
    }
  };

  const toggleRestriction = async (restriction: BorrowingRestriction) => {
    try {
      const newStatus = restriction.status === 'active' ? 'inactive' : 'active';
      await api.patch(`/borrowing-restrictions/${restriction.id}/status`, { status: newStatus });
      notifications.add(`借阅限制已${newStatus === 'active' ? '启用' : '停用'}`, 'success');
      await loadData();
    } catch (e) {
      handleApiError(e, '更新借阅限制状态失败');
    }
  };

  const deleteRestriction = async (restriction: BorrowingRestriction) => {
    if (!confirm('确定要删除这个借阅限制吗？')) return;

    try {
      await api.delete(`/borrowing-restrictions/${restriction.id}`);
      notifications.add('借阅限制已删除', 'success');
      await loadData();
    } catch (e) {
      handleApiError(e, '删除借阅限制失败');
    }
  };

  const getBookTitle = (bookId: string) => {
    const book = books.find(b => b.id === bookId);
    return book ? `${book.title} (${book.code})` : bookId;
  };

  const getBookRarity = (bookId: string) => {
    const book = books.find(b => b.id === bookId);
    return book ? rarityLevelLabels[book.rarityLevel] : '-';
  };

  const getActiveRestriction = (bookId: string) => {
    return restrictions.find(r => r.bookId === bookId && r.status === 'active');
  };

  const filteredRestrictions = restrictions.filter(restriction => {
    const matchesSearch = searchQuery === '' || 
      getBookTitle(restriction.bookId).toLowerCase().includes(searchQuery.toLowerCase()) ||
      restriction.reason?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === '' || restriction.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const booksWithRestrictions = books.filter(book => getActiveRestriction(book.id));
  const booksAvailable = books.filter(book => !getActiveRestriction(book.id));

  onMount(() => {
    loadData();
  });
</script>

<div class="p-6 space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h2 class="text-2xl font-bold text-amber-900">借阅限制管理</h2>
      <p class="text-amber-700/70 mt-1">管理古籍的借阅限制和开放阅览控制</p>
    </div>
    <Button on:click={openCreateModal} class="bg-primary-600 hover:bg-primary-700">
      <Plus class="w-4 h-4 mr-2" />
      新增限制
    </Button>
  </div>

  <div class="grid grid-cols-4 gap-4">
    <Card class="p-4 card-shadow">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-gray-500">古籍总数</p>
          <p class="text-2xl font-bold mt-1 text-gray-800">{books.length}</p>
        </div>
        <div class="p-2 rounded-lg bg-blue-100">
          <BookOpen class="w-5 h-5 text-blue-600" />
        </div>
      </div>
    </Card>
    <Card class="p-4 card-shadow">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-gray-500">可借阅</p>
          <p class="text-2xl font-bold mt-1 text-green-600">{booksAvailable.length}</p>
        </div>
        <div class="p-2 rounded-lg bg-green-100">
          <CheckCircle class="w-5 h-5 text-green-600" />
        </div>
      </div>
    </Card>
    <Card class="p-4 card-shadow">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-gray-500">限制中</p>
          <p class="text-2xl font-bold mt-1 text-orange-600">{booksWithRestrictions.length}</p>
        </div>
        <div class="p-2 rounded-lg bg-orange-100">
          <Ban class="w-5 h-5 text-orange-600" />
        </div>
      </div>
    </Card>
    <Card class="p-4 card-shadow">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-gray-500">需专家评审</p>
          <p class="text-2xl font-bold mt-1 text-red-600">
            {restrictions.filter(r => r.requireExpertReview && r.status === 'active').length}
          </p>
        </div>
        <div class="p-2 rounded-lg bg-red-100">
          <AlertTriangle class="w-5 h-5 text-red-600" />
        </div>
      </div>
    </Card>
  </div>

  <div class="flex gap-2 border-b">
    <Button 
      variant={activeTab === 'restrictions' ? 'primary' : 'tertiary'} 
      on:click={() => (activeTab = 'restrictions')}
    >
      借阅限制列表
    </Button>
    <Button 
      variant={activeTab === 'books' ? 'primary' : 'tertiary'} 
      on:click={() => (activeTab = 'books')}
    >
      古籍借阅状态
    </Button>
    <Button 
      variant={activeTab === 'records' ? 'primary' : 'tertiary'} 
      on:click={() => (activeTab = 'records')}
    >
      借阅记录
    </Button>
  </div>

  {#if activeTab === 'restrictions'}
    <div class="flex items-center gap-4">
      <div class="flex-1 relative">
        <Search class="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <Input bind:value={searchQuery} placeholder="搜索借阅限制..." class="pl-10" />
      </div>
      <Select bind:value={typeFilter} class="w-48">
        <SelectOption value="">全部类型</SelectOption>
        <SelectOption value="under_restoration">修复中</SelectOption>
        <SelectOption value="rare_book">珍贵古籍</SelectOption>
        <SelectOption value="fragile">易损古籍</SelectOption>
        <SelectOption value="research_only">仅供研究</SelectOption>
        <SelectOption value="other">其他</SelectOption>
      </Select>
    </div>

    <Card class="card-shadow">
      {#if loading}
        <div class="p-8 text-center text-gray-500">加载中...</div>
      {:else if filteredRestrictions.length === 0}
        <div class="p-8 text-center text-gray-500">
          <Ban class="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>暂无借阅限制数据</p>
        </div>
      {:else}
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>古籍信息</TableHeader>
              <TableHeader>珍贵等级</TableHeader>
              <TableHeader>限制类型</TableHeader>
              <TableHeader>限制原因</TableHeader>
              <TableHeader>开始日期</TableHeader>
              <TableHeader>结束日期</TableHeader>
              <TableHeader>专家评审</TableHeader>
              <TableHeader>状态</TableHeader>
              <TableHeader class="text-right">操作</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {#each filteredRestrictions as restriction}
              <TableRow>
                <TableCell class="font-medium">{getBookTitle(restriction.bookId)}</TableCell>
                <TableCell>{getBookRarity(restriction.bookId)}</TableCell>
                <TableCell>{restrictionTypeLabels[restriction.type]}</TableCell>
                <TableCell class="max-w-xs truncate">{restriction.reason || '-'}</TableCell>
                <TableCell>{restriction.startDate ? formatDate(restriction.startDate) : '-'}</TableCell>
                <TableCell>
                  {#if restriction.isPermanent}
                    <Badge variant="warning">永久</Badge>
                  {:else}
                    {restriction.endDate ? formatDate(restriction.endDate) : '-'}
                  {/if}
                </TableCell>
                <TableCell>
                  {restriction.requireExpertReview ? (
                    <Badge variant="danger">需要</Badge>
                  ) : (
                    <Badge variant="success">不需要</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={restrictionStatusLabels[restriction.status].variant}>
                    {restrictionStatusLabels[restriction.status].name}
                  </Badge>
                </TableCell>
                <TableCell class="text-right">
                  <div class="flex justify-end gap-2">
                    <Button 
                      size="sm" 
                      variant={restriction.status === 'active' ? 'warning' : 'success'}
                      on:click={() => toggleRestriction(restriction)}
                    >
                      {restriction.status === 'active' ? '停用' : '启用'}
                    </Button>
                    <Button size="sm" variant="tertiary" on:click={() => openEditModal(restriction)}>
                      <Edit2 class="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="danger" on:click={() => deleteRestriction(restriction)}>
                      <Trash2 class="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            {/each}
          </TableBody>
        </Table>
      {/if}
    </Card>
  {:else if activeTab === 'books'}
    <Card class="card-shadow">
      <h3 class="text-lg font-semibold mb-4">古籍借阅状态一览</h3>
      {#if loading}
        <div class="p-8 text-center text-gray-500">加载中...</div>
      {:else}
        <div class="grid grid-cols-4 gap-4">
          {#each books as book}
            {@const restriction = getActiveRestriction(book.id)}
            <Card class="p-4 {restriction ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}">
              <div class="flex items-start justify-between">
                <div>
                  <p class="font-semibold">{book.title}</p>
                  <p class="text-xs text-gray-500 font-mono">{book.code}</p>
                  <Badge variant={book.rarityLevel === 'national_treasure' || book.rarityLevel === 'precious' ? 'warning' : 'secondary'} class="mt-1">
                    {rarityLevelLabels[book.rarityLevel]}
                  </Badge>
                </div>
                {#if restriction}
                  <Ban class="w-5 h-5 text-red-500" />
                {:else}
                  <CheckCircle class="w-5 h-5 text-green-500" />
                {/if}
              </div>
              {#if restriction}
                <div class="mt-3 pt-3 border-t border-red-200">
                  <p class="text-xs text-red-600">{restrictionTypeLabels[restriction.type]}</p>
                  <p class="text-xs text-gray-500 mt-1">{restriction.reason || '无原因说明'}</p>
                </div>
              {/if}
            </Card>
          {/each}
        </div>
      {/if}
    </Card>
  {:else}
    <Card class="card-shadow">
      <h3 class="text-lg font-semibold mb-4">借阅记录</h3>
      {#if loading}
        <div class="p-8 text-center text-gray-500">加载中...</div>
      {:else if records.length === 0}
        <div class="p-8 text-center text-gray-500">
          <Clock class="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>暂无借阅记录</p>
        </div>
      {:else}
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>古籍信息</TableHeader>
              <TableHeader>借阅人</TableHeader>
              <TableHeader>借阅日期</TableHeader>
              <TableHeader>应还日期</TableHeader>
              <TableHeader>实际归还</TableHeader>
              <TableHeader>状态</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {#each records as record}
              <TableRow>
                <TableCell class="font-medium">{getBookTitle(record.bookId)}</TableCell>
                <TableCell>{record.borrowerName || '-'}</TableCell>
                <TableCell>{formatDate(record.borrowDate)}</TableCell>
                <TableCell>{record.dueDate ? formatDate(record.dueDate) : '-'}</TableCell>
                <TableCell>{record.returnDate ? formatDate(record.returnDate) : '-'}</TableCell>
                <TableCell>
                  <Badge variant={record.status === 'returned' ? 'success' : 'warning'}>
                    {record.status === 'returned' ? '已归还' : '借阅中'}
                  </Badge>
                </TableCell>
              </TableRow>
            {/each}
          </TableBody>
        </Table>
      {/if}
    </Card>
  {/if}
</div>

<Modal bind:open={showCreateModal} maxWidth="lg">
  <ModalHeader>
    <h3 class="text-xl font-bold">新增借阅限制</h3>
  </ModalHeader>
  <ModalBody>
    <div class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">选择古籍 <span class="text-red-500">*</span></label>
        <Select bind:value={createForm.bookId}>
          <SelectOption value="">请选择古籍</SelectOption>
          {#each books as book}
            <SelectOption value={book.id}>{book.title} ({book.code}) - {rarityLevelLabels[book.rarityLevel]}</SelectOption>
          {/each}
        </Select>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">限制类型 <span class="text-red-500">*</span></label>
          <Select bind:value={createForm.type}>
            <SelectOption value="under_restoration">修复中</SelectOption>
            <SelectOption value="rare_book">珍贵古籍</SelectOption>
            <SelectOption value="fragile">易损古籍</SelectOption>
            <SelectOption value="research_only">仅供研究</SelectOption>
            <SelectOption value="other">其他</SelectOption>
          </Select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            需要专家评审
            <AlertTriangle class="w-4 h-4 inline ml-1 text-orange-500" />
          </label>
          <Checkbox bind:checked={createForm.requireExpertReview} label="开放阅览前需专家评审" />
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">限制原因</label>
        <Textarea bind:value={createForm.reason} placeholder="请输入限制原因..." rows={2} />
      </div>

      <div class="grid grid-cols-3 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">开始日期</label>
          <Input type="date" bind:value={createForm.startDate} />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">结束日期</label>
          <Input type="date" bind:value={createForm.endDate} disabled={createForm.isPermanent} />
        </div>
        <div class="flex items-end">
          <Checkbox bind:checked={createForm.isPermanent} label="永久限制" />
        </div>
      </div>

      <div class="flex justify-end gap-3 pt-4 border-t">
        <Button variant="tertiary" on:click={() => (showCreateModal = false)}>
          <X class="w-4 h-4 mr-2" />
          取消
        </Button>
        <Button variant="primary" on:click={createRestriction}>
          <Save class="w-4 h-4 mr-2" />
          保存
        </Button>
      </div>
    </div>
  </ModalBody>
</Modal>

<Modal bind:open={showEditModal} maxWidth="lg">
  <ModalHeader>
    <h3 class="text-xl font-bold">编辑借阅限制</h3>
  </ModalHeader>
  <ModalBody>
    <div class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">选择古籍 <span class="text-red-500">*</span></label>
        <Select bind:value={editForm.bookId}>
          <SelectOption value="">请选择古籍</SelectOption>
          {#each books as book}
            <SelectOption value={book.id}>{book.title} ({book.code}) - {rarityLevelLabels[book.rarityLevel]}</SelectOption>
          {/each}
        </Select>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">限制类型 <span class="text-red-500">*</span></label>
          <Select bind:value={editForm.type}>
            <SelectOption value="under_restoration">修复中</SelectOption>
            <SelectOption value="rare_book">珍贵古籍</SelectOption>
            <SelectOption value="fragile">易损古籍</SelectOption>
            <SelectOption value="research_only">仅供研究</SelectOption>
            <SelectOption value="other">其他</SelectOption>
          </Select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">需要专家评审</label>
          <Checkbox bind:checked={editForm.requireExpertReview} label="开放阅览前需专家评审" />
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">限制原因</label>
        <Textarea bind:value={editForm.reason} rows={2} />
      </div>

      <div class="grid grid-cols-3 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">开始日期</label>
          <Input type="date" bind:value={editForm.startDate} />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">结束日期</label>
          <Input type="date" bind:value={editForm.endDate} disabled={editForm.isPermanent} />
        </div>
        <div class="flex items-end">
          <Checkbox bind:checked={editForm.isPermanent} label="永久限制" />
        </div>
      </div>

      <div class="flex justify-end gap-3 pt-4 border-t">
        <Button variant="tertiary" on:click={() => (showEditModal = false)}>
          <X class="w-4 h-4 mr-2" />
          取消
        </Button>
        <Button variant="primary" on:click={updateRestriction}>
          <Save class="w-4 h-4 mr-2" />
          保存
        </Button>
      </div>
    </div>
  </ModalBody>
</Modal>
