<script lang="ts">
  import { onMount } from 'svelte';
  import { Card, Button, Input, Select, Modal } from '@skeletonlabs/skeleton';
  import { Library, Plus, Search, Filter, Eye, Edit, Trash2 } from 'lucide-svelte';
  import { ancientBooksApi } from '$lib/api';
  import { notifications } from '$stores/notification';
  import { formatDate, truncate, handleApiError } from '$lib/utils';
  import type { AncientBook, RarityLevel, BorrowingStatus } from '$types';
  import { rarityLevelLabels, borrowingStatusLabels } from '$lib/enums';
  import { goto } from '$app/navigation';

  let books: AncientBook[] = [];
  let total = 0;
  let page = 1;
  let limit = 10;
  let keyword = '';
  let selectedRarity = '';
  let selectedStatus = '';
  let loading = false;
  let showCreateModal = false;
  let selectedBook: AncientBook | null = null;

  let rarityLevels: { level: RarityLevel; name: string }[] = [];
  let borrowingStatuses: { status: BorrowingStatus; name: string }[] = [];

  let formData = {
    bookCode: '',
    title: '',
    author: '',
    dynasty: '',
    era: '',
    rarityLevel: 'common' as RarityLevel,
    borrowingStatus: 'available' as BorrowingStatus,
    description: '',
    condition: '',
    pages: undefined as number | undefined,
    material: '',
    provenance: '',
    catalogNumber: '',
    shelfLocation: '',
  };

  onMount(async () => {
    await loadEnums();
    await loadBooks();
  });

  async function loadEnums() {
    try {
      const [rarityRes, statusRes] = await Promise.all([
        ancientBooksApi.getRarityLevels(),
        ancientBooksApi.getBorrowingStatuses(),
      ]);
      rarityLevels = rarityRes.data?.data || [];
      borrowingStatuses = statusRes.data?.data || [];
    } catch (error) {
      notifications.error('加载枚举数据失败');
    }
  }

  async function loadBooks() {
    loading = true;
    try {
      const response = await ancientBooksApi.findAll(
        page,
        limit,
        selectedRarity || undefined,
        selectedStatus || undefined,
        keyword || undefined,
      );
      books = response.data?.items || [];
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
    await loadBooks();
  }

  async function handleCreate() {
    try {
      const response = await ancientBooksApi.create(formData);
      notifications.success('古籍档案创建成功');
      showCreateModal = false;
      resetForm();
      await loadBooks();
    } catch (error) {
      const { message } = handleApiError(error);
      notifications.error(message);
    }
  }

  async function handleDelete(book: AncientBook) {
    if (!confirm(`确定要删除古籍《${book.title}》吗？`)) return;
    
    try {
      await ancientBooksApi.remove(book.id);
      notifications.success('删除成功');
      await loadBooks();
    } catch (error) {
      const { message } = handleApiError(error);
      notifications.error(message);
    }
  }

  function resetForm() {
    formData = {
      bookCode: '',
      title: '',
      author: '',
      dynasty: '',
      era: '',
      rarityLevel: 'common',
      borrowingStatus: 'available',
      description: '',
      condition: '',
      pages: undefined,
      material: '',
      provenance: '',
      catalogNumber: '',
      shelfLocation: '',
    };
  }

  function viewDetail(book: AncientBook) {
    goto(`/books/${book.id}`);
  }

  $: totalPages = Math.ceil(total / limit);
</script>

<div class="p-6 space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h2 class="text-2xl font-bold text-amber-900">古籍档案管理</h2>
      <p class="text-amber-700/70 mt-1">管理馆藏古籍档案信息</p>
    </div>
    <Button on:click={() => (showCreateModal = true)} class="bg-primary-600 hover:bg-primary-700">
      <Plus class="w-4 h-4 mr-2" />
      新增古籍
    </Button>
  </div>

  <Card class="p-6 card-shadow">
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div class="relative">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          bind:value={keyword}
          placeholder="搜索书名、编号、作者..."
          class="pl-10"
          on:keydown={(e) => e.key === 'Enter' && handleSearch()}
        />
      </div>
      <Select bind:value={selectedRarity} on:change={handleSearch}>
        <option value="">全部珍贵等级</option>
        {#each rarityLevels as level}
          <option value={level.level}>{level.name}</option>
        {/each}
      </Select>
      <Select bind:value={selectedStatus} on:change={handleSearch}>
        <option value="">全部借阅状态</option>
        {#each borrowingStatuses as status}
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
    {:else if books.length > 0}
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-amber-200">
              <th class="text-left py-3 px-4 text-sm font-semibold text-amber-800">编号</th>
              <th class="text-left py-3 px-4 text-sm font-semibold text-amber-800">书名</th>
              <th class="text-left py-3 px-4 text-sm font-semibold text-amber-800">朝代</th>
              <th class="text-left py-3 px-4 text-sm font-semibold text-amber-800">珍贵等级</th>
              <th class="text-left py-3 px-4 text-sm font-semibold text-amber-800">借阅状态</th>
              <th class="text-left py-3 px-4 text-sm font-semibold text-amber-800">创建时间</th>
              <th class="text-left py-3 px-4 text-sm font-semibold text-amber-800">操作</th>
            </tr>
          </thead>
          <tbody>
            {#each books as book}
              <tr class="border-b border-amber-100 hover:bg-amber-50/50 transition-colors">
                <td class="py-3 px-4 font-mono text-sm text-gray-600">{book.bookCode}</td>
                <td class="py-3 px-4">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-14 bg-amber-100 rounded flex items-center justify-center">
                      <Library class="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p class="font-medium text-gray-800">{book.title}</p>
                      {#if book.author}
                        <p class="text-xs text-gray-500">{book.author}</p>
                      {/if}
                    </div>
                  </div>
                </td>
                <td class="py-3 px-4 text-sm text-gray-600">{book.dynasty || '-'}</td>
                <td class="py-3 px-4">
                  <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium {rarityLevelLabels[book.rarityLevel].bgColor} {rarityLevelLabels[book.rarityLevel].color}">
                    {rarityLevelLabels[book.rarityLevel].name}
                  </span>
                </td>
                <td class="py-3 px-4">
                  <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium {borrowingStatusLabels[book.borrowingStatus].bgColor} {borrowingStatusLabels[book.borrowingStatus].color}">
                    {borrowingStatusLabels[book.borrowingStatus].name}
                  </span>
                </td>
                <td class="py-3 px-4 text-sm text-gray-500">{formatDate(book.createdAt)}</td>
                <td class="py-3 px-4">
                  <div class="flex items-center gap-2">
                    <button
                      on:click={() => viewDetail(book)}
                      class="p-1.5 rounded hover:bg-blue-50 text-blue-600 transition-colors"
                      title="查看详情"
                    >
                      <Eye class="w-4 h-4" />
                    </button>
                    <button
                      on:click={() => (selectedBook = book)}
                      class="p-1.5 rounded hover:bg-amber-50 text-amber-600 transition-colors"
                      title="编辑"
                    >
                      <Edit class="w-4 h-4" />
                    </button>
                    <button
                      on:click={() => handleDelete(book)}
                      class="p-1.5 rounded hover:bg-red-50 text-red-600 transition-colors"
                      title="删除"
                    >
                      <Trash2 class="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
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
                loadBooks();
              }}
            >
              上一页
            </Button>
            {#each Array.from({ length: Math.min(5, totalPages) }, _, i)}
              <button
                on:click={() => {
                  page = i + 1;
                  loadBooks();
                }}
                class={[
                  'px-3 py-1 rounded text-sm transition-colors',
                  page === i + 1
                    ? 'bg-primary-600 text-white'
                    : 'hover:bg-amber-100 text-gray-700'
                ].join(' ')}
              >
                {i + 1}
              </button>
            {/each}
            <Button
              size="sm"
              variant="soft"
              disabled={page === totalPages}
              on:click={() => {
                page++;
                loadBooks();
              }}
            >
              下一页
            </Button>
          </div>
        </div>
      {/if}
    {:else}
      <div class="text-center py-16">
        <Library class="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <p class="text-lg font-medium text-gray-600 mb-2">暂无古籍档案</p>
        <p class="text-gray-500">点击上方按钮创建新的古籍档案</p>
      </div>
    {/if}
  </Card>

  <Modal open={showCreateModal} on:close={() => (showCreateModal = false)}>
    <div class="p-6">
      <h3 class="text-xl font-bold text-amber-900 mb-6">新增古籍档案</h3>
      
      <div class="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">古籍编号 *</label>
            <Input bind:value={formData.bookCode} placeholder="如：GJ-2024-001" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">书名 *</label>
            <Input bind:value={formData.title} placeholder="请输入书名" />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">作者</label>
            <Input bind:value={formData.author} placeholder="请输入作者" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">朝代</label>
            <Input bind:value={formData.dynasty} placeholder="如：宋代" />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">年代</label>
            <Input bind:value={formData.era} placeholder="如：北宋仁宗年间" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">页数</label>
            <Input
              type="number"
              bind:value={formData.pages}
              placeholder="请输入页数"
            />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">珍贵等级 *</label>
            <Select bind:value={formData.rarityLevel}>
              {#each rarityLevels as level}
                <option value={level.level}>{level.name}</option>
              {/each}
            </Select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">借阅状态 *</label>
            <Select bind:value={formData.borrowingStatus}>
              {#each borrowingStatuses as status}
                <option value={status.status}>{status.name}</option>
              {/each}
            </Select>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">材质</label>
            <Input bind:value={formData.material} placeholder="如：宣纸、绢本" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">来源</label>
            <Input bind:value={formData.provenance} placeholder="如：故宫博物院旧藏" />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">目录号</label>
            <Input bind:value={formData.catalogNumber} placeholder="请输入目录号" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">书架位置</label>
            <Input bind:value={formData.shelfLocation} placeholder="如：A-3-2-15" />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">破损情况</label>
          <textarea
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none"
            rows={3}
            bind:value={formData.condition}
            placeholder="请描述古籍破损情况"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">描述</label>
          <textarea
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none"
            rows={3}
            bind:value={formData.description}
            placeholder="请输入古籍详细描述"
          />
        </div>
      </div>

      <div class="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
        <Button variant="ghost" on:click={() => (showCreateModal = false)}>
          取消
        </Button>
        <Button class="bg-primary-600 hover:bg-primary-700" on:click={handleCreate}>
          确认创建
        </Button>
      </div>
    </div>
  </Modal>
</div>
