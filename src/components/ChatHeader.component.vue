<template>
  <div class="header-wrapper">
    <div class="flex items-center gap-3">
      <div class="relative">
        <div class="status-indicator-wrapper">
          <img
            src="/src/assets/Ulfa_front_1.png"
            alt="Ulfa Avatar"
            class="w-full h-full rounded-full object-cover"
          />
        </div>
        <span
          class="status-indicator transition-colors duration-300"
          :class="isConnected ? '!bg-emerald-500' : '!bg-rose-500'"
        ></span>
      </div>
      <div>
        <h3 class="text-sm font-semibold text-brand-text tracking-wide leading-none mb-1">Ulfa</h3>
        <p
          class="text-xs font-medium leading-none transition-colors duration-300"
          :class="isConnected ? 'text-brand-primary' : 'text-rose-400'"
        >
          {{ isConnected ? 'Online (Streaming)' : 'Terputus' }}
        </p>
      </div>
    </div>

    <button
      @click="$emit('clearChat')"
      class="text-brand-text/70 hover:text-brand-primary hover:bg-brand-surface px-2.5 py-1.5 rounded-lg transition text-xs font-medium cursor-pointer"
      title="Reset riwayat percakapan"
    >
      Reset
    </button>
  </div>
</template>

<script>
export default {
  name: 'ChatHeaderComponent',
  props: {
    isConnected: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['clearChat'],
}
</script>
