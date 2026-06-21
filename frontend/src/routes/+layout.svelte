<script lang="ts">
  import '../app.css';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { Library, BookOpen, Wrench, Users, Settings, Home, Clock, Image, FileText } from 'lucide-svelte';
  import { currentUser } from '$stores/user';
  import { notifications } from '$stores/notification';
  import { classNames } from '$lib/utils';

  let isLoggedIn = true;

  const navItems = [
    { label: '首页', href: '/', icon: Home },
    { label: '古籍档案', href: '/books', icon: Library },
    { label: '修复申请', href: '/requests', icon: FileText },
    { label: '工序管理', href: '/steps', icon: Wrench },
    { label: '专家评审', href: '/reviews', icon: Users },
    { label: '图片管理', href: '/images', icon: Image },
    { label: '材料管理', href: '/materials', icon: Clock },
    { label: '借阅限制', href: '/borrowing', icon: BookOpen },
    { label: '系统设置', href: '/settings', icon: Settings },
  ];

  function navigate(href: string) {
    goto(href);
  }

  $: currentPath = $page.url.pathname;
</script>

<div class="flex h-screen overflow-hidden bg-amber-50/30">
  <aside class="w-64 flex-shrink-0 bg-amber-50/80 border-r border-amber-200 flex flex-col">
    <div class="p-4 border-b border-amber-200 bg-gradient-to-r from-primary-700 to-primary-600">
      <div class="flex items-center gap-3 text-white">
        <div class="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
          <BookOpen class="w-6 h-6" />
        </div>
        <div>
          <h1 class="text-lg font-bold tracking-wide">古籍修复排程系统</h1>
          <p class="text-xs text-white/70">Ancient Books Restoration</p>
        </div>
      </div>
    </div>

    <div class="px-4 py-3 border-b border-amber-200">
      <p class="text-xs font-semibold text-amber-800/60 uppercase tracking-wider">功能导航</p>
    </div>

    <nav class="flex-1 overflow-y-auto py-2">
      {#each navItems as item}
        <a
          href={item.href}
          on:click|preventDefault={() => navigate(item.href)}
          class={classNames(
            'flex items-center gap-3 px-4 py-2.5 mx-2 mb-1 rounded-lg text-sm transition-colors',
            currentPath === item.href
              ? 'bg-primary-100 text-primary-700 font-medium'
              : 'hover:bg-amber-100 text-amber-900'
          )}
        >
          <svelte:component this={item.icon} class="w-5 h-5 flex-shrink-0" />
          <span>{item.label}</span>
        </a>
      {/each}
    </nav>

    <div class="p-4 border-t border-amber-200">
      <div class="bg-white rounded-lg p-3 shadow-sm">
        <p class="text-xs text-amber-700 font-medium mb-1">业务规则提醒</p>
        <p class="text-xs text-amber-600/70">珍贵古籍必须通过专家评审才能开放阅览</p>
      </div>
    </div>
  </aside>

  <div class="flex-1 flex flex-col overflow-hidden">
    <header class="h-14 flex-shrink-0 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div class="text-sm text-gray-500">
        当前位置：{navItems.find(n => n.href === currentPath)?.label || '首页'}
      </div>
      <div class="flex items-center gap-4">
        {#if isLoggedIn && $currentUser}
          <div class="flex items-center gap-3">
            <span class="text-sm text-gray-600">欢迎，{$currentUser.name}</span>
            <div class="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-medium text-sm">
              {$currentUser.name.charAt(0)}
            </div>
          </div>
        {:else}
          <div class="flex items-center gap-3">
            <span class="text-sm text-gray-500">游客模式</span>
            <div class="w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center">
              <Users class="w-4 h-4" />
            </div>
          </div>
        {/if}
      </div>
    </header>

    <main class="flex-1 overflow-y-auto">
      <slot />
    </main>
  </div>
</div>

<div class="fixed top-20 right-4 z-50 flex flex-col gap-2 pointer-events-none">
  {#each $notifications as notification (notification.id)}
    <div
      class={classNames(
        'px-4 py-3 rounded-lg shadow-lg min-w-[300px] flex items-center gap-3 pointer-events-auto',
        notification.type === 'success' && 'bg-green-50 border border-green-200 text-green-800',
        notification.type === 'error' && 'bg-red-50 border border-red-200 text-red-800',
        notification.type === 'warning' && 'bg-yellow-50 border border-yellow-200 text-yellow-800',
        notification.type === 'info' && 'bg-blue-50 border border-blue-200 text-blue-800'
      )}
    >
      <div class="flex-1 text-sm font-medium">{notification.message}</div>
      <button on:click={() => notifications.remove(notification.id)} class="text-gray-400 hover:text-gray-600">
        ✕
      </button>
    </div>
  {/each}
</div>
