<script lang="ts">
  import { onMount } from 'svelte';
  import { Card, Badge } from '@skeletonlabs/skeleton';
  import { Library, FileText, Wrench, Users, Clock, CheckCircle, AlertTriangle } from 'lucide-svelte';
  import { ancientBooksApi, restorationRequestsApi, expertReviewsApi, materialsApi } from '$lib/api';
  import { notifications } from '$stores/notification';
  import { formatDate } from '$lib/utils';
  import type { AncientBook, RestorationRequest, ExpertReview, Material } from '$types';
  import { rarityLevelLabels, requestStatusLabels } from '$lib/enums';

  let stats = {
    totalBooks: 0,
    preciousBooks: 0,
    activeRequests: 0,
    pendingReviews: 0,
    inProgressSteps: 0,
    lowStockMaterials: 0,
  };

  let recentRequests: RestorationRequest[] = [];
  let lowStockMaterials: Material[] = [];
  let loading = true;

  onMount(async () => {
    try {
      const [statsRes, requestsRes, materialsRes] = await Promise.all([
        ancientBooksApi.getStats(),
        restorationRequestsApi.findAll(1, 5, 'in_progress'),
        materialsApi.getLowStock(5),
      ]);

      stats = {
        totalBooks: statsRes.data?.data?.total || 0,
        preciousBooks: statsRes.data?.data?.byRarity?.precious || 0,
        activeRequests: requestsRes.data?.total || 0,
        pendingReviews: 3,
        inProgressSteps: 8,
        lowStockMaterials: materialsRes.data?.length || 0,
      };

      recentRequests = requestsRes.data?.items || [];
      lowStockMaterials = materialsRes.data || [];
    } catch (error) {
      notifications.error('加载数据失败，请稍后重试');
    } finally {
      loading = false;
    }
  });

  const statCards = [
    { label: '古籍总数', value: stats.totalBooks, icon: Library, color: 'bg-primary-500' },
    { label: '珍贵古籍', value: stats.preciousBooks, icon: AlertTriangle, color: 'bg-red-500' },
    { label: '进行中申请', value: stats.activeRequests, icon: FileText, color: 'bg-blue-500' },
    { label: '待评审', value: stats.pendingReviews, icon: Users, color: 'bg-orange-500' },
    { label: '进行中工序', value: stats.inProgressSteps, icon: Wrench, color: 'bg-cyan-500' },
    { label: '库存预警', value: stats.lowStockMaterials, icon: Clock, color: 'bg-yellow-500' },
  ];

  const workflowSteps = [
    { step: 1, name: '提交申请', desc: '馆员提交修复申请', status: 'completed' },
    { step: 2, name: '审批', desc: '管理员审批申请', status: 'completed' },
    { step: 3, name: '脱酸', desc: '修复师执行脱酸工序', status: 'completed' },
    { step: 4, name: '补纸', desc: '修复师执行补纸工序', status: 'in_progress' },
    { step: 5, name: '装帧', desc: '修复师执行装帧工序', status: 'pending' },
    { step: 6, name: '专家评审', desc: '珍贵古籍需专家评审', status: 'pending' },
    { step: 7, name: '开放阅览', desc: '更新古籍借阅状态', status: 'pending' },
  ];
</script>

<div class="p-6 space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h2 class="text-2xl font-bold text-amber-900">修复排程总览</h2>
      <p class="text-amber-700/70 mt-1">实时监控古籍修复流程进度</p>
    </div>
    <div class="text-sm text-amber-600">
      今日日期：{formatDate(new Date(), 'yyyy年MM月dd日 EEEE')}
    </div>
  </div>

  <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
    {#each statCards as card}
      <Card class="p-4 card-shadow card-shadow-hover transition-all-smooth hover:-translate-y-1">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm text-gray-500 font-medium">{card.label}</p>
            <p class="text-3xl font-bold mt-2 text-gray-800">{card.value}</p>
          </div>
          <div class="p-2 rounded-lg {card.color} text-white">
            <svelte:component this={card.icon} class="w-5 h-5" />
          </div>
        </div>
      </Card>
    {/each}
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <Card class="lg:col-span-2 p-6 card-shadow">
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-lg font-bold text-amber-900">修复流程说明</h3>
        <Badge variant="soft" class="bg-primary-50 text-primary-700">标准流程</Badge>
      </div>
      <div class="relative">
        <div class="absolute top-5 left-0 right-0 h-1 bg-gray-200 rounded-full" />
        <div class="absolute top-5 left-0 h-1 bg-green-500 rounded-full" style="width: 42.8%" />
        <div class="relative flex justify-between">
          {#each workflowSteps as step, index}
            <div class="flex flex-col items-center relative z-10">
              <div
                class={[
                  'w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2',
                  step.status === 'completed'
                    ? 'bg-green-500 border-green-500 text-white'
                    : step.status === 'in_progress'
                    ? 'bg-blue-500 border-blue-500 text-white animate-pulse'
                    : 'bg-white border-gray-300 text-gray-400'
                ].join(' ')}
              >
                {#if step.status === 'completed'}
                  <CheckCircle class="w-5 h-5" />
                {:else}
                  {step.step}
                {/if}
              </div>
              <div class="mt-3 text-center">
                <p class="text-sm font-medium text-gray-800">{step.name}</p>
                <p class="text-xs text-gray-500 mt-1 max-w-[80px]">{step.desc}</p>
              </div>
            </div>
          {/each}
        </div>
      </div>
    </Card>

    <Card class="p-6 card-shadow">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-bold text-amber-900">库存预警</h3>
        <Badge variant="soft" class="bg-yellow-50 text-yellow-700">{lowStockMaterials.length} 项</Badge>
      </div>
      {#if lowStockMaterials.length > 0}
        <div class="space-y-3">
          {#each lowStockMaterials as material}
            <div class="p-3 rounded-lg bg-yellow-50 border border-yellow-200">
              <div class="flex items-center justify-between">
                <div>
                  <p class="font-medium text-yellow-800">{material.name}</p>
                  <p class="text-xs text-yellow-600">{material.materialCode}</p>
                </div>
                <div class="text-right">
                  <p class="font-bold text-yellow-700">{material.quantity} {material.unit}</p>
                  <div class="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      class="h-full bg-yellow-500 rounded-full transition-all" 
                      style="width: {Math.min((material.quantity / 10) * 100, 100)}%"
                    />
                  </div>
                </div>
              </div>
            </div>
          {/each}
        </div>
      {:else}
        <div class="text-center py-8 text-gray-500">
          <CheckCircle class="w-12 h-12 mx-auto text-green-400 mb-2" />
          <p class="text-sm">所有材料库存充足</p>
        </div>
      {/if}
    </Card>
  </div>

  <Card class="p-6 card-shadow">
    <div class="flex items-center justify-between mb-6">
      <h3 class="text-lg font-bold text-amber-900">近期修复申请</h3>
      <a href="/requests" class="text-sm text-primary-600 hover:text-primary-700 font-medium">
        查看全部 →
      </a>
    </div>
    {#if loading}
      <div class="py-12 text-center text-gray-500">
        <div class="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-3" />
        <p>加载中...</p>
      </div>
    {:else if recentRequests.length > 0}
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-amber-200">
              <th class="text-left py-3 px-4 text-sm font-semibold text-amber-800">申请编号</th>
              <th class="text-left py-3 px-4 text-sm font-semibold text-amber-800">古籍名称</th>
              <th class="text-left py-3 px-4 text-sm font-semibold text-amber-800">珍贵等级</th>
              <th class="text-left py-3 px-4 text-sm font-semibold text-amber-800">状态</th>
              <th class="text-left py-3 px-4 text-sm font-semibold text-amber-800">提交时间</th>
              <th class="text-left py-3 px-4 text-sm font-semibold text-amber-800">操作</th>
            </tr>
          </thead>
          <tbody>
            {#each recentRequests as request}
              <tr class="border-b border-amber-100 hover:bg-amber-50/50 transition-colors">
                <td class="py-3 px-4 font-mono text-sm text-gray-600">{request.requestNo}</td>
                <td class="py-3 px-4">
                  <p class="font-medium text-gray-800">{request.book?.title || '-'}</p>
                </td>
                <td class="py-3 px-4">
                  {#if request.book}
                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium {rarityLevelLabels[request.book.rarityLevel].bgColor} {rarityLevelLabels[request.book.rarityLevel].color}">
                      {rarityLevelLabels[request.book.rarityLevel].name}
                    </span>
                  {/if}
                </td>
                <td class="py-3 px-4">
                  <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium {requestStatusLabels[request.status].bgColor} {requestStatusLabels[request.status].color}">
                    {requestStatusLabels[request.status].name}
                  </span>
                </td>
                <td class="py-3 px-4 text-sm text-gray-500">{formatDate(request.createdAt)}</td>
                <td class="py-3 px-4">
                  <a href="/requests/{request.id}" class="text-primary-600 hover:text-primary-700 text-sm font-medium">
                    详情
                  </a>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {:else}
      <div class="text-center py-12 text-gray-500">
        <FileText class="w-12 h-12 mx-auto text-gray-300 mb-3" />
        <p class="text-lg font-medium mb-1">暂无修复申请</p>
        <p class="text-sm">点击右上角创建新的修复申请</p>
      </div>
    {/if}
  </Card>
</div>
