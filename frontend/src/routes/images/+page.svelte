<script lang="ts">
  import { onMount } from 'svelte';
  import { Card, Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Modal, ModalBody, ModalHeader, Input, Select, SelectOption, Badge, FileUpload, FileUploadItem } from '@skeletonlabs/skeleton';
  import { Image, Upload, Search, Trash2, Eye, Download, X, Save, AlertTriangle } from 'lucide-svelte';
  import { api } from '$lib/api';
  import { handleApiError, formatDate } from '$lib/utils';
  import { imageTypeLabels } from '$lib/enums';
  import type { BookImage, AncientBook, RestorationRequest } from '$lib/types';
  import { notifications } from '$stores/notification';

  let images: BookImage[] = [];
  let books: AncientBook[] = [];
  let requests: RestorationRequest[] = [];
  let loading = false;
  let showUploadModal = false;
  let searchQuery = '';
  let typeFilter = '';
  let selectedFiles: File[] = [];

  let uploadForm = {
    bookId: '',
    requestId: '',
    imageType: 'before_restoration' as 'before_restoration' | 'during_restoration' | 'after_restoration',
    description: '',
  };

  const loadData = async () => {
    loading = true;
    try {
      const [imagesRes, booksRes, requestsRes] = await Promise.all([
        api.get('/book-images'),
        api.get('/ancient-books'),
        api.get('/restoration-requests'),
      ]);
      images = imagesRes.data;
      books = booksRes.data;
      requests = requestsRes.data;
    } catch (e) {
      handleApiError(e, '加载图片数据失败');
    } finally {
      loading = false;
    }
  };

  const handleFileSelect = (e: Event) => {
    const target = e.target as HTMLInputElement;
    if (target.files) {
      selectedFiles = Array.from(target.files);
    }
  };

  const uploadImages = async () => {
    if (selectedFiles.length === 0) {
      notifications.add('请选择要上传的图片', 'warning');
      return;
    }

    try {
      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('bookId', uploadForm.bookId);
        formData.append('requestId', uploadForm.requestId);
        formData.append('imageType', uploadForm.imageType);
        formData.append('description', uploadForm.description);

        await api.post('/book-images/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      }

      notifications.add(`成功上传 ${selectedFiles.length} 张图片`, 'success');
      showUploadModal = false;
      selectedFiles = [];
      await loadData();
    } catch (e) {
      handleApiError(e, '上传图片失败');
    }
  };

  const deleteImage = async (image: BookImage) => {
    if (!confirm('确定要删除这张图片吗？')) return;

    try {
      await api.delete(`/book-images/${image.id}`);
      notifications.add('图片已删除', 'success');
      await loadData();
    } catch (e) {
      handleApiError(e, '删除图片失败');
    }
  };

  const getBookTitle = (bookId: string | null | undefined) => {
    if (!bookId) return '-';
    const book = books.find(b => b.id === bookId);
    return book ? `${book.title} (${book.code})` : bookId;
  };

  const getRequestNo = (requestId: string | null | undefined) => {
    if (!requestId) return '-';
    const request = requests.find(r => r.id === requestId);
    return request ? request.requestNo : requestId;
  };

  const getImageUrl = (imagePath: string) => {
    return `/api/book-images/${imagePath}`;
  };

  const checkImageCompleteness = (requestId: string) => {
    const requestImages = images.filter(img => img.requestId === requestId);
    const hasBefore = requestImages.some(img => img.imageType === 'before_restoration');
    const hasAfter = requestImages.some(img => img.imageType === 'after_restoration');
    return { hasBefore, hasAfter, complete: hasBefore && hasAfter };
  };

  const filteredImages = images.filter(image => {
    const matchesSearch = searchQuery === '' || 
      getBookTitle(image.bookId).toLowerCase().includes(searchQuery.toLowerCase()) ||
      image.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === '' || image.imageType === typeFilter;
    return matchesSearch && matchesType;
  });

  onMount(() => {
    loadData();
  });
</script>

<div class="p-6 space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h2 class="text-2xl font-bold text-amber-900">图片管理</h2>
      <p class="text-amber-700/70 mt-1">管理古籍修复前后的照片档案</p>
    </div>
    <Button on:click={() => (showUploadModal = true)} class="bg-primary-600 hover:bg-primary-700">
      <Upload class="w-4 h-4 mr-2" />
      上传图片
    </Button>
  </div>

  <div class="grid grid-cols-4 gap-4">
    <Card class="p-4 card-shadow">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-gray-500">修复前照片</p>
          <p class="text-2xl font-bold mt-1 text-blue-600">
            {images.filter(i => i.imageType === 'before_restoration').length}
          </p>
        </div>
        <div class="p-2 rounded-lg bg-blue-100">
          <Image class="w-5 h-5 text-blue-600" />
        </div>
      </div>
    </Card>
    <Card class="p-4 card-shadow">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-gray-500">修复中照片</p>
          <p class="text-2xl font-bold mt-1 text-yellow-600">
            {images.filter(i => i.imageType === 'during_restoration').length}
          </p>
        </div>
        <div class="p-2 rounded-lg bg-yellow-100">
          <Image class="w-5 h-5 text-yellow-600" />
        </div>
      </div>
    </Card>
    <Card class="p-4 card-shadow">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-gray-500">修复后照片</p>
          <p class="text-2xl font-bold mt-1 text-green-600">
            {images.filter(i => i.imageType === 'after_restoration').length}
          </p>
        </div>
        <div class="p-2 rounded-lg bg-green-100">
          <Image class="w-5 h-5 text-green-600" />
        </div>
      </div>
    </Card>
    <Card class="p-4 card-shadow">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-gray-500">照片完整</p>
          <p class="text-2xl font-bold mt-1 text-emerald-600">
            {new Set(requests.filter(r => checkImageCompleteness(r.id).complete).map(r => r.id)).size}
          </p>
        </div>
        <div class="p-2 rounded-lg bg-emerald-100">
          <CheckCircle class="w-5 h-5 text-emerald-600" />
        </div>
      </div>
    </Card>
  </div>

  <div class="flex items-center gap-4">
    <div class="flex-1 relative">
      <Search class="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <Input bind:value={searchQuery} placeholder="搜索图片..." class="pl-10" />
    </div>
    <Select bind:value={typeFilter} class="w-48">
      <SelectOption value="">全部类型</SelectOption>
      <SelectOption value="before_restoration">修复前</SelectOption>
      <SelectOption value="during_restoration">修复中</SelectOption>
      <SelectOption value="after_restoration">修复后</SelectOption>
    </Select>
  </div>

  <Card class="card-shadow">
    {#if loading}
      <div class="p-8 text-center text-gray-500">加载中...</div>
    {:else if filteredImages.length === 0}
      <div class="p-8 text-center text-gray-500">
        <Image class="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p>暂无图片数据</p>
      </div>
    {:else}
      <div class="grid grid-cols-4 gap-4">
        {#each filteredImages as image}
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
              <div class="flex items-center justify-between">
                <Badge variant={imageTypeLabels[image.imageType].variant} class="text-xs">
                  {imageTypeLabels[image.imageType].name}
                </Badge>
                <span class="text-xs text-gray-500">{formatDate(image.uploadedAt)}</span>
              </div>
              <p class="text-sm font-medium mt-1 truncate">{getBookTitle(image.bookId)}</p>
              <p class="text-xs text-gray-500 truncate">{image.description || '无描述'}</p>
            </div>
            <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
              <Button size="xs" variant="primary" on:click={() => window.open(getImageUrl(image.filePath), '_blank')}>
                <Eye class="w-3 h-3" />
              </Button>
              <Button size="xs" variant="danger" on:click={() => deleteImage(image)}>
                <Trash2 class="w-3 h-3" />
              </Button>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </Card>

  <Card class="card-shadow">
    <h3 class="text-lg font-semibold mb-4 flex items-center">
      <AlertTriangle class="w-5 h-5 mr-2 text-orange-500" />
      照片完整性检查
    </h3>
    <Table>
      <TableHead>
        <TableRow>
          <TableHeader>申请编号</TableHeader>
          <TableHeader>古籍信息</TableHeader>
          <TableHeader>修复前照片</TableHeader>
          <TableHeader>修复后照片</TableHeader>
          <TableHeader>完整性</TableHeader>
        </TableRow>
      </TableHead>
      <TableBody>
        {#each requests as request}
          {@const completeness = checkImageCompleteness(request.id)}
          <TableRow>
            <TableCell class="font-mono text-sm">{request.requestNo}</TableCell>
            <TableCell class="font-medium">{getBookTitle(request.bookId)}</TableCell>
            <TableCell>
              {#if completeness.hasBefore}
                <Badge variant="success">已上传</Badge>
              {:else}
                <Badge variant="danger">缺失</Badge>
              {/if}
            </TableCell>
            <TableCell>
              {#if completeness.hasAfter}
                <Badge variant="success">已上传</Badge>
              {:else}
                <Badge variant="danger">缺失</Badge>
              {/if}
            </TableCell>
            <TableCell>
              {#if completeness.complete}
                <Badge variant="success">完整</Badge>
              {:else}
                <Badge variant="warning">不完整</Badge>
              {/if}
            </TableCell>
          </TableRow>
        {/each}
      </TableBody>
    </Table>
  </Card>
</div>

<Modal bind:open={showUploadModal} maxWidth="lg">
  <ModalHeader>
    <h3 class="text-xl font-bold">上传图片</h3>
  </ModalHeader>
  <ModalBody>
    <div class="space-y-4">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">选择古籍</label>
          <Select bind:value={uploadForm.bookId}>
            <SelectOption value="">请选择古籍</SelectOption>
            {#each books as book}
              <SelectOption value={book.id}>{book.title} ({book.code})</SelectOption>
            {/each}
          </Select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">关联修复申请</label>
          <Select bind:value={uploadForm.requestId}>
            <SelectOption value="">请选择申请</SelectOption>
            {#each requests as request}
              <SelectOption value={request.id}>{request.requestNo} - {getBookTitle(request.bookId)}</SelectOption>
            {/each}
          </Select>
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">图片类型</label>
        <Select bind:value={uploadForm.imageType}>
          <SelectOption value="before_restoration">修复前</SelectOption>
          <SelectOption value="during_restoration">修复中</SelectOption>
          <SelectOption value="after_restoration">修复后</SelectOption>
        </Select>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">图片描述</label>
        <Input bind:value={uploadForm.description} placeholder="请输入图片描述..." />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">选择图片文件</label>
        <input 
          type="file" 
          multiple 
          accept="image/*" 
          on:change={handleFileSelect}
          class="w-full p-2 border border-gray-300 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
        />
        {#if selectedFiles.length > 0}
          <div class="mt-2 text-sm text-gray-600">
            已选择 {selectedFiles.length} 个文件
            <ul class="mt-1 space-y-1">
              {#each selectedFiles as file}
                <li class="text-xs text-gray-500 truncate">• {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</li>
              {/each}
            </ul>
          </div>
        {/if}
      </div>

      <div class="flex justify-end gap-3 pt-4 border-t">
        <Button variant="tertiary" on:click={() => (showUploadModal = false)}>
          <X class="w-4 h-4 mr-2" />
          取消
        </Button>
        <Button variant="primary" on:click={uploadImages}>
          <Save class="w-4 h-4 mr-2" />
          上传
        </Button>
      </div>
    </div>
  </ModalBody>
</Modal>
