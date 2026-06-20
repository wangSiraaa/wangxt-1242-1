<script lang="ts">
  import { onMount } from 'svelte';
  import { Card, Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Modal, ModalBody, ModalHeader, Input, Select, SelectOption, Badge, Checkbox } from '@skeletonlabs/skeleton';
  import { Settings, Users, Plus, Edit2, Trash2, Save, X, Shield, Database, Bell, Palette } from 'lucide-svelte';
  import { api } from '$lib/api';
  import { handleApiError } from '$lib/utils';
  import { roleLabels } from '$lib/enums';
  import type { User } from '$lib/types';
  import { notifications } from '$stores/notification';
  import { userStore } from '$stores/user';

  let users: User[] = [];
  let loading = false;
  let showUserModal = false;
  let selectedUser: User | null = null;
  let activeTab = 'users';
  let isNewUser = false;

  let userForm = {
    username: '',
    password: '',
    name: '',
    email: '',
    phone: '',
    role: 'librarian' as User['role'],
    isActive: true,
  };

  let settings = {
    autoCreateSteps: true,
    requireMaterialBatch: true,
    requireExpertReviewForPrecious: true,
    requireImagesBeforeOpen: true,
    notificationEmail: true,
    notificationSms: false,
    theme: 'light' as 'light' | 'dark',
    language: 'zh-CN' as 'zh-CN' | 'en-US',
  };

  const loadData = async () => {
    loading = true;
    try {
      const usersRes = await api.get('/users');
      users = usersRes.data;
    } catch (e) {
      handleApiError(e, '加载数据失败');
    } finally {
      loading = false;
    }
  };

  const openCreateUserModal = () => {
    isNewUser = true;
    selectedUser = null;
    userForm = {
      username: '',
      password: '',
      name: '',
      email: '',
      phone: '',
      role: 'librarian',
      isActive: true,
    };
    showUserModal = true;
  };

  const openEditUserModal = (user: User) => {
    isNewUser = false;
    selectedUser = user;
    userForm = {
      username: user.username,
      password: '',
      name: user.name,
      email: user.email || '',
      phone: user.phone || '',
      role: user.role,
      isActive: user.isActive,
    };
    showUserModal = true;
  };

  const saveUser = async () => {
    try {
      if (isNewUser) {
        await api.post('/users', userForm);
        notifications.add('用户创建成功', 'success');
      } else if (selectedUser) {
        const updateData = { ...userForm };
        if (!updateData.password) {
          delete (updateData as Partial<typeof updateData>).password;
        }
        await api.put(`/users/${selectedUser.id}`, updateData);
        notifications.add('用户更新成功', 'success');
      }
      showUserModal = false;
      await loadData();
    } catch (e) {
      handleApiError(e, '保存用户失败');
    }
  };

  const deleteUser = async (user: User) => {
    if (!confirm('确定要删除这个用户吗？')) return;

    try {
      await api.delete(`/users/${user.id}`);
      notifications.add('用户已删除', 'success');
      await loadData();
    } catch (e) {
      handleApiError(e, '删除用户失败');
    }
  };

  const saveSettings = async () => {
    try {
      localStorage.setItem('appSettings', JSON.stringify(settings));
      notifications.add('设置已保存', 'success');
    } catch (e) {
      handleApiError(e, '保存设置失败');
    }
  };

  const testDatabase = async () => {
    try {
      const res = await api.get('/business-rules/health');
      notifications.add('数据库连接正常', 'success');
      console.log('Health check:', res.data);
    } catch (e) {
      handleApiError(e, '数据库连接测试失败');
    }
  };

  onMount(() => {
    loadData();
    const savedSettings = localStorage.getItem('appSettings');
    if (savedSettings) {
      settings = { ...settings, ...JSON.parse(savedSettings) };
    }
  });
</script>

<div class="p-6 space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h2 class="text-2xl font-bold text-amber-900">系统设置</h2>
      <p class="text-amber-700/70 mt-1">管理系统配置、用户权限和业务规则</p>
    </div>
  </div>

  <div class="flex gap-2 border-b">
    <Button 
      variant={activeTab === 'users' ? 'primary' : 'tertiary'} 
      on:click={() => (activeTab = 'users')}
    >
      <Users class="w-4 h-4 mr-2" />
      用户管理
    </Button>
    <Button 
      variant={activeTab === 'business' ? 'primary' : 'tertiary'} 
      on:click={() => (activeTab = 'business')}
    >
      <Shield class="w-4 h-4 mr-2" />
      业务规则
    </Button>
    <Button 
      variant={activeTab === 'notifications' ? 'primary' : 'tertiary'} 
      on:click={() => (activeTab = 'notifications')}
    >
      <Bell class="w-4 h-4 mr-2" />
      通知设置
    </Button>
    <Button 
      variant={activeTab === 'appearance' ? 'primary' : 'tertiary'} 
      on:click={() => (activeTab = 'appearance')}
    >
      <Palette class="w-4 h-4 mr-2" />
      外观设置
    </Button>
    <Button 
      variant={activeTab === 'system' ? 'primary' : 'tertiary'} 
      on:click={() => (activeTab = 'system')}
    >
      <Database class="w-4 h-4 mr-2" />
      系统信息
    </Button>
  </div>

  {#if activeTab === 'users'}
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-lg font-semibold">用户列表</h3>
        <p class="text-sm text-gray-500">管理系统用户和角色权限</p>
      </div>
      <Button on:click={openCreateUserModal} class="bg-primary-600 hover:bg-primary-700">
        <Plus class="w-4 h-4 mr-2" />
        新增用户
      </Button>
    </div>

    <Card class="card-shadow">
      {#if loading}
        <div class="p-8 text-center text-gray-500">加载中...</div>
      {:else if users.length === 0}
        <div class="p-8 text-center text-gray-500">
          <Users class="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>暂无用户数据</p>
        </div>
      {:else}
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>用户名</TableHeader>
              <TableHeader>姓名</TableHeader>
              <TableHeader>角色</TableHeader>
              <TableHeader>邮箱</TableHeader>
              <TableHeader>电话</TableHeader>
              <TableHeader>状态</TableHeader>
              <TableHeader class="text-right">操作</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {#each users as user}
              <TableRow>
                <TableCell class="font-mono">{user.username}</TableCell>
                <TableCell class="font-medium">{user.name}</TableCell>
                <TableCell>
                  <Badge variant={user.role === 'admin' ? 'danger' : user.role === 'expert' ? 'warning' : 'secondary'}>
                    {roleLabels[user.role]}
                  </Badge>
                </TableCell>
                <TableCell>{user.email || '-'}</TableCell>
                <TableCell>{user.phone || '-'}</TableCell>
                <TableCell>
                  <Badge variant={user.isActive ? 'success' : 'danger'}>
                    {user.isActive ? '启用' : '禁用'}
                  </Badge>
                </TableCell>
                <TableCell class="text-right">
                  <div class="flex justify-end gap-2">
                    <Button size="sm" variant="tertiary" on:click={() => openEditUserModal(user)}>
                      <Edit2 class="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="danger" on:click={() => deleteUser(user)}>
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
  {:else if activeTab === 'business'}
    <Card class="card-shadow p-6 space-y-6">
      <h3 class="text-lg font-semibold">业务规则配置</h3>
      
      <div class="space-y-4">
        <div class="p-4 bg-amber-50 rounded-lg border border-amber-200">
          <Checkbox 
            bind:checked={settings.autoCreateSteps} 
            label="自动创建修复工序"
          />
          <p class="text-sm text-gray-500 mt-1 ml-6">提交修复申请时自动创建脱酸、补纸、装帧三道工序</p>
        </div>

        <div class="p-4 bg-amber-50 rounded-lg border border-amber-200">
          <Checkbox 
            bind:checked={settings.requireMaterialBatch} 
            label="强制材料批号验证"
          />
          <p class="text-sm text-gray-500 mt-1 ml-6">修复材料批号缺失时不允许提交工序完成</p>
        </div>

        <div class="p-4 bg-amber-50 rounded-lg border border-amber-200">
          <Checkbox 
            bind:checked={settings.requireExpertReviewForPrecious} 
            label="珍贵古籍强制专家评审"
          />
          <p class="text-sm text-gray-500 mt-1 ml-6">珍贵等级为「珍贵」和「国宝级」的古籍必须通过专家评审</p>
        </div>

        <div class="p-4 bg-amber-50 rounded-lg border border-amber-200">
          <Checkbox 
            bind:checked={settings.requireImagesBeforeOpen} 
            label="开放阅览前照片检查"
          />
          <p class="text-sm text-gray-500 mt-1 ml-6">开放阅览前必须上传修复前后的完整照片</p>
        </div>
      </div>

      <div class="flex justify-end pt-4 border-t">
        <Button variant="primary" on:click={saveSettings}>
          <Save class="w-4 h-4 mr-2" />
          保存设置
        </Button>
      </div>
    </Card>
  {:else if activeTab === 'notifications'}
    <Card class="card-shadow p-6 space-y-6">
      <h3 class="text-lg font-semibold">通知设置</h3>
      
      <div class="space-y-4">
        <div class="p-4 bg-gray-50 rounded-lg">
          <Checkbox 
            bind:checked={settings.notificationEmail} 
            label="邮件通知"
          />
          <p class="text-sm text-gray-500 mt-1 ml-6">流程状态变更时发送邮件通知</p>
        </div>

        <div class="p-4 bg-gray-50 rounded-lg">
          <Checkbox 
            bind:checked={settings.notificationSms} 
            label="短信通知"
          />
          <p class="text-sm text-gray-500 mt-1 ml-6">重要流程节点发送短信提醒</p>
        </div>
      </div>

      <div class="flex justify-end pt-4 border-t">
        <Button variant="primary" on:click={saveSettings}>
          <Save class="w-4 h-4 mr-2" />
          保存设置
        </Button>
      </div>
    </Card>
  {:else if activeTab === 'appearance'}
    <Card class="card-shadow p-6 space-y-6">
      <h3 class="text-lg font-semibold">外观设置</h3>
      
      <div class="grid grid-cols-2 gap-6">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">主题模式</label>
          <Select bind:value={settings.theme}>
            <SelectOption value="light">浅色模式</SelectOption>
            <SelectOption value="dark">深色模式</SelectOption>
          </Select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">语言</label>
          <Select bind:value={settings.language}>
            <SelectOption value="zh-CN">简体中文</SelectOption>
            <SelectOption value="en-US">English</SelectOption>
          </Select>
        </div>
      </div>

      <div class="flex justify-end pt-4 border-t">
        <Button variant="primary" on:click={saveSettings}>
          <Save class="w-4 h-4 mr-2" />
          保存设置
        </Button>
      </div>
    </Card>
  {:else}
    <Card class="card-shadow p-6 space-y-6">
      <h3 class="text-lg font-semibold">系统信息</h3>
      
      <div class="grid grid-cols-2 gap-4">
        <div class="p-4 bg-gray-50 rounded-lg">
          <p class="text-sm text-gray-500">系统名称</p>
          <p class="font-semibold">图书馆古籍修复排程系统</p>
        </div>
        <div class="p-4 bg-gray-50 rounded-lg">
          <p class="text-sm text-gray-500">版本号</p>
          <p class="font-mono font-semibold">v1.0.0</p>
        </div>
        <div class="p-4 bg-gray-50 rounded-lg">
          <p class="text-sm text-gray-500">技术栈</p>
          <p class="font-semibold">NestJS + SvelteKit + PostgreSQL</p>
        </div>
        <div class="p-4 bg-gray-50 rounded-lg">
          <p class="text-sm text-gray-500">数据库状态</p>
          <Badge variant="success" class="mt-1">正常</Badge>
        </div>
      </div>

      <div class="flex gap-3 pt-4 border-t">
        <Button variant="primary" on:click={testDatabase}>
          <Database class="w-4 h-4 mr-2" />
          测试数据库连接
        </Button>
        <Button variant="tertiary" on:click={() => notifications.add('这是一条测试通知', 'info')}>
          <Bell class="w-4 h-4 mr-2" />
          测试通知
        </Button>
      </div>
    </Card>
  {/if}
</div>

<Modal bind:open={showUserModal} maxWidth="lg">
  <ModalHeader>
    <h3 class="text-xl font-bold">{isNewUser ? '新增用户' : '编辑用户'}</h3>
  </ModalHeader>
  <ModalBody>
    <div class="space-y-4">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">用户名 <span class="text-red-500">*</span></label>
          <Input bind:value={userForm.username} placeholder="请输入用户名" required />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            密码 {#if isNewUser}<span class="text-red-500">*</span>{/if}
          </label>
          <Input 
            type="password" 
            bind:value={userForm.password} 
            placeholder={isNewUser ? '请输入密码' : '不修改请留空'}
            required={isNewUser}
          />
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">姓名 <span class="text-red-500">*</span></label>
        <Input bind:value={userForm.name} placeholder="请输入姓名" required />
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">角色 <span class="text-red-500">*</span></label>
          <Select bind:value={userForm.role}>
            <SelectOption value="librarian">馆员</SelectOption>
            <SelectOption value="restorer">修复师</SelectOption>
            <SelectOption value="expert">专家</SelectOption>
            <SelectOption value="admin">管理员</SelectOption>
          </Select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">状态</label>
          <Checkbox bind:checked={userForm.isActive} label="启用账号" />
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
          <Input type="email" bind:value={userForm.email} placeholder="请输入邮箱" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">电话</label>
          <Input bind:value={userForm.phone} placeholder="请输入电话" />
        </div>
      </div>

      <div class="flex justify-end gap-3 pt-4 border-t">
        <Button variant="tertiary" on:click={() => (showUserModal = false)}>
          <X class="w-4 h-4 mr-2" />
          取消
        </Button>
        <Button variant="primary" on:click={saveUser}>
          <Save class="w-4 h-4 mr-2" />
          保存
        </Button>
      </div>
    </div>
  </ModalBody>
</Modal>
