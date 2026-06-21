<script lang="ts">
  import { onMount } from 'svelte';
  import { Card, Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Modal, ModalBody, ModalHeader, Input, Select, SelectOption, Textarea, Badge } from '@skeletonlabs/skeleton';
  import { Package, Plus, Search, Edit2, Trash2, Save, X, AlertTriangle, CheckCircle } from 'lucide-svelte';
  import { api } from '$lib/api';
  import { handleApiError, formatDate } from '$lib/utils';
  import { materialTypeLabels, materialStatusLabels } from '$lib/enums';
  import type { Material } from '$types';
  import { notifications } from '$stores/notification';

  let materials: Material[] = [];
  let loading = false;
  let showCreateModal = false;
  let showEditModal = false;
  let selectedMaterial: Material | null = null;
  let searchQuery = '';
  let typeFilter = '';

  let createForm = {
    code: '',
    name: '',
    type: 'paper' as Material['type'],
    specification: '',
    stock: 0,
    unit: '',
    manufacturer: '',
    batchNumber: '',
    expiryDate: '',
    status: 'in_stock' as Material['status'],
    description: '',
  };

  let editForm = { ...createForm };

  const loadData = async () => {
    loading = true;
    try {
      const res = await api.get('/materials');
      materials = res.data;
    } catch (e) {
      const { message } = handleApiError(e, '加载材料数据失败');
      notifications.error(message);
    } finally {
      loading = false;
    }
  };

  const openCreateModal = () => {
    createForm = {
      code: '',
      name: '',
      type: 'paper',
      specification: '',
      stock: 0,
      unit: '',
      manufacturer: '',
      batchNumber: '',
      expiryDate: '',
      status: 'in_stock',
      description: '',
    };
    showCreateModal = true;
  };

  const openEditModal = (material: Material) => {
    selectedMaterial = material;
    editForm = {
      code: material.code,
      name: material.name,
      type: material.type,
      specification: material.specification || '',
      stock: material.stock,
      unit: material.unit,
      manufacturer: material.manufacturer || '',
      batchNumber: material.batchNumber || '',
      expiryDate: material.expiryDate ? material.expiryDate.slice(0, 10) : '',
      status: material.status,
      description: material.description || '',
    };
    showEditModal = true;
  };

  const createMaterial = async () => {
    try {
      await api.post('/materials', createForm);
      notifications.success('材料创建成功');
      showCreateModal = false;
      await loadData();
    } catch (e) {
      const { message } = handleApiError(e, '创建材料失败');
      notifications.error(message);
    }
  };

  const updateMaterial = async () => {
    if (!selectedMaterial) return;

    try {
      await api.put(`/materials/${selectedMaterial.id}`, editForm);
      notifications.success('材料更新成功');
      showEditModal = false;
      await loadData();
    } catch (e) {
      const { message } = handleApiError(e, '更新材料失败');
      notifications.error(message);
    }
  };

  const deleteMaterial = async (material: Material) => {
    if (!confirm('确定要删除这个材料吗？')) return;

    try {
      await api.delete(`/materials/${material.id}`);
      notifications.success('材料已删除');
      await loadData();
    } catch (e) {
      const { message } = handleApiError(e, '删除材料失败');
      notifications.error(message);
    }
  };

  const getStockStatus = (material: Material) => {
    if (material.stock <= 0) return { variant: 'danger', text: '缺货' };
    if (material.stock < 10) return { variant: 'warning', text: '库存不足' };
    return { variant: 'success', text: '充足' };
  };

  const filteredMaterials = materials.filter(material => {
    const matchesSearch = searchQuery === '' || 
      material.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      material.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      material.manufacturer?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === '' || material.type === typeFilter;
    return matchesSearch && matchesType;
  });

  onMount(() => {
    loadData();
  });
</script>

<div class="p-6 space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h2 class="text-2xl font-bold text-amber-900">材料管理</h2>
      <p class="text-amber-700/70 mt-1">管理修复用纸张、胶粘剂、颜料等材料库存</p>
    </div>
    <Button on:click={openCreateModal} class="bg-primary-600 hover:bg-primary-700">
      <Plus class="w-4 h-4 mr-2" />
      新增材料
    </Button>
  </div>

  <div class="grid grid-cols-4 gap-4">
    <Card class="p-4 card-shadow">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-gray-500">材料总数</p>
          <p class="text-2xl font-bold mt-1 text-gray-800">{materials.length}</p>
        </div>
        <div class="p-2 rounded-lg bg-blue-100">
          <Package class="w-5 h-5 text-blue-600" />
        </div>
      </div>
    </Card>
    <Card class="p-4 card-shadow">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-gray-500">库存充足</p>
          <p class="text-2xl font-bold mt-1 text-green-600">
            {materials.filter(m => m.stock >= 10).length}
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
          <p class="text-sm text-gray-500">库存不足</p>
          <p class="text-2xl font-bold mt-1 text-orange-600">
            {materials.filter(m => m.stock > 0 && m.stock < 10).length}
          </p>
        </div>
        <div class="p-2 rounded-lg bg-orange-100">
          <AlertTriangle class="w-5 h-5 text-orange-600" />
        </div>
      </div>
    </Card>
    <Card class="p-4 card-shadow">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-gray-500">已缺货</p>
          <p class="text-2xl font-bold mt-1 text-red-600">
            {materials.filter(m => m.stock <= 0).length}
          </p>
        </div>
        <div class="p-2 rounded-lg bg-red-100">
          <AlertTriangle class="w-5 h-5 text-red-600" />
        </div>
      </div>
    </Card>
  </div>

  <div class="flex items-center gap-4">
    <div class="flex-1 relative">
      <Search class="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <Input bind:value={searchQuery} placeholder="搜索材料..." class="pl-10" />
    </div>
    <Select bind:value={typeFilter} class="w-48">
      <SelectOption value="">全部类型</SelectOption>
      <SelectOption value="paper">纸张</SelectOption>
      <SelectOption value="adhesive">胶粘剂</SelectOption>
      <SelectOption value="pigment">颜料</SelectOption>
      <SelectOption value="tool">工具</SelectOption>
      <SelectOption value="other">其他</SelectOption>
    </Select>
  </div>

  <Card class="card-shadow">
    {#if loading}
      <div class="p-8 text-center text-gray-500">加载中...</div>
    {:else if filteredMaterials.length === 0}
      <div class="p-8 text-center text-gray-500">
        <Package class="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p>暂无材料数据</p>
      </div>
    {:else}
      <Table>
        <TableHead>
          <TableRow>
            <TableHeader>材料编码</TableHeader>
            <TableHeader>材料名称</TableHeader>
            <TableHeader>类型</TableHeader>
            <TableHeader>规格</TableHeader>
            <TableHeader>库存数量</TableHeader>
            <TableHeader>生产厂家</TableHeader>
            <TableHeader>批号</TableHeader>
            <TableHeader>有效期</TableHeader>
            <TableHeader>状态</TableHeader>
            <TableHeader class="text-right">操作</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {#each filteredMaterials as material}
            {@const stockStatus = getStockStatus(material)}
            <TableRow>
              <TableCell class="font-mono text-sm">{material.code}</TableCell>
              <TableCell class="font-medium">{material.name}</TableCell>
              <TableCell>{materialTypeLabels[material.type]}</TableCell>
              <TableCell>{material.specification || '-'}</TableCell>
              <TableCell>
                <span class="font-mono">{material.stock}</span> {material.unit}
                {#if material.stock < 10}
                  <AlertTriangle class="w-4 h-4 inline ml-1 text-orange-500" />
                {/if}
              </TableCell>
              <TableCell>{material.manufacturer || '-'}</TableCell>
              <TableCell>
                {#if material.batchNumber}
                  <span class="font-mono text-sm">{material.batchNumber}</span>
                {:else}
                  <span class="text-red-500 text-sm">缺失</span>
                {/if}
              </TableCell>
              <TableCell>{material.expiryDate ? formatDate(material.expiryDate) : '-'}</TableCell>
              <TableCell>
                <Badge variant={stockStatus.variant}>{stockStatus.text}</Badge>
              </TableCell>
              <TableCell class="text-right">
                <div class="flex justify-end gap-2">
                  <Button size="sm" variant="tertiary" on:click={() => openEditModal(material)}>
                    <Edit2 class="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="danger" on:click={() => deleteMaterial(material)}>
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
</div>

<Modal bind:open={showCreateModal} maxWidth="lg">
  <ModalHeader>
    <h3 class="text-xl font-bold">新增材料</h3>
  </ModalHeader>
  <ModalBody>
    <div class="space-y-4">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">材料编码 <span class="text-red-500">*</span></label>
          <Input bind:value={createForm.code} placeholder="如：MAT-2024-001" required />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">材料名称 <span class="text-red-500">*</span></label>
          <Input bind:value={createForm.name} placeholder="如：古籍修复专用纸" required />
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">材料类型 <span class="text-red-500">*</span></label>
          <Select bind:value={createForm.type}>
            <SelectOption value="paper">纸张</SelectOption>
            <SelectOption value="adhesive">胶粘剂</SelectOption>
            <SelectOption value="pigment">颜料</SelectOption>
            <SelectOption value="tool">工具</SelectOption>
            <SelectOption value="other">其他</SelectOption>
          </Select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">规格型号</label>
          <Input bind:value={createForm.specification} placeholder="如：A4、70g" />
        </div>
      </div>

      <div class="grid grid-cols-3 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">库存数量 <span class="text-red-500">*</span></label>
          <Input type="number" bind:value={createForm.stock} min="0" required />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">计量单位 <span class="text-red-500">*</span></label>
          <Input bind:value={createForm.unit} placeholder="如：张、瓶、个" required />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">状态</label>
          <Select bind:value={createForm.status}>
            <SelectOption value="in_stock">在库</SelectOption>
            <SelectOption value="in_use">使用中</SelectOption>
            <SelectOption value="expired">已过期</SelectOption>
          </Select>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">生产厂家</label>
          <Input bind:value={createForm.manufacturer} placeholder="请输入生产厂家" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            材料批号
            <span class="text-red-500">*</span>
            {#if !createForm.batchNumber}
              <AlertTriangle class="w-4 h-4 inline ml-1 text-orange-500" />
            {/if}
          </label>
          <Input bind:value={createForm.batchNumber} placeholder="请输入材料批号" required />
          {#if !createForm.batchNumber}
            <p class="text-xs text-red-500 mt-1">材料批号缺失无法用于工序</p>
          {/if}
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">有效期</label>
        <Input type="date" bind:value={createForm.expiryDate} />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">备注</label>
        <Textarea bind:value={createForm.description} placeholder="请输入材料描述..." rows={2} />
      </div>

      <div class="flex justify-end gap-3 pt-4 border-t">
        <Button variant="tertiary" on:click={() => (showCreateModal = false)}>
          <X class="w-4 h-4 mr-2" />
          取消
        </Button>
        <Button variant="primary" on:click={createMaterial}>
          <Save class="w-4 h-4 mr-2" />
          保存
        </Button>
      </div>
    </div>
  </ModalBody>
</Modal>

<Modal bind:open={showEditModal} maxWidth="lg">
  <ModalHeader>
    <h3 class="text-xl font-bold">编辑材料</h3>
  </ModalHeader>
  <ModalBody>
    <div class="space-y-4">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">材料编码 <span class="text-red-500">*</span></label>
          <Input bind:value={editForm.code} required />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">材料名称 <span class="text-red-500">*</span></label>
          <Input bind:value={editForm.name} required />
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">材料类型 <span class="text-red-500">*</span></label>
          <Select bind:value={editForm.type}>
            <SelectOption value="paper">纸张</SelectOption>
            <SelectOption value="adhesive">胶粘剂</SelectOption>
            <SelectOption value="pigment">颜料</SelectOption>
            <SelectOption value="tool">工具</SelectOption>
            <SelectOption value="other">其他</SelectOption>
          </Select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">规格型号</label>
          <Input bind:value={editForm.specification} />
        </div>
      </div>

      <div class="grid grid-cols-3 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">库存数量 <span class="text-red-500">*</span></label>
          <Input type="number" bind:value={editForm.stock} min="0" required />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">计量单位 <span class="text-red-500">*</span></label>
          <Input bind:value={editForm.unit} required />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">状态</label>
          <Select bind:value={editForm.status}>
            <SelectOption value="in_stock">在库</SelectOption>
            <SelectOption value="in_use">使用中</SelectOption>
            <SelectOption value="expired">已过期</SelectOption>
          </Select>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">生产厂家</label>
          <Input bind:value={editForm.manufacturer} />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            材料批号
            <span class="text-red-500">*</span>
          </label>
          <Input bind:value={editForm.batchNumber} required />
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">有效期</label>
        <Input type="date" bind:value={editForm.expiryDate} />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">备注</label>
        <Textarea bind:value={editForm.description} rows={2} />
      </div>

      <div class="flex justify-end gap-3 pt-4 border-t">
        <Button variant="tertiary" on:click={() => (showEditModal = false)}>
          <X class="w-4 h-4 mr-2" />
          取消
        </Button>
        <Button variant="primary" on:click={updateMaterial}>
          <Save class="w-4 h-4 mr-2" />
          保存
        </Button>
      </div>
    </div>
  </ModalBody>
</Modal>
