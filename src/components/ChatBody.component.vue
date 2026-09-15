<template>
  <div
    ref="chatContainer"
    class="flex-1 overflow-y-auto p-4 flex flex-col transition-all duration-300"
    :class="messages.length != 0 ? 'space-y-4' : 'justify-center items-center text-center p-6'"
  >
    <template v-if="messages.length != 0">
      <template v-for="message in messages" :key="message.id || message">
        <!-- Balasan Bot AI -->
        <div class="flex w-full justify-start items-end gap-3" v-if="!message.isUser">
          <!-- Avatar -->
          <div
            class="w-10 h-10 rounded-full bg-brand-primary flex items-center justify-center shrink-0"
          >
            <img src="@/assets/Ulfa_2_thinking.png" class="w-8 h-8 object-contain" />
          </div>

          <!-- Wrapper Stepper + Bubble -->
          <div class="flex flex-col gap-2 max-w-[85%]">
            <!-- 1. VERTICAL STEPPER (Alur Proses: tool_start -> tool_end) -->
            <div
              v-if="message.steps && message.steps.length > 0"
              class="bg-brand-surface/75 border border-brand-border/70 rounded-2xl p-3 shadow-sm transition-all duration-300 backdrop-blur-sm"
            >
              <!-- Stepper Header (Collapsible) -->
              <div
                class="flex items-center justify-between cursor-pointer select-none py-0.5"
                :class="{ 'pb-2.5 border-b border-brand-border/40': message.showSteps !== false }"
                @click="message.showSteps = !message.showSteps"
              >
                <div class="flex items-center gap-2">
                  <div
                    class="w-5 h-5 rounded-full bg-brand-primary/15 flex items-center justify-center text-brand-primary"
                  >
                    <svg
                      class="w-3 h-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      stroke-width="2.5"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                      />
                    </svg>
                  </div>
                  <span class="text-xs font-semibold text-brand-text tracking-wide">
                    Alur Proses AI
                  </span>
                  <span
                    class="text-[10px] text-brand-text/60 bg-brand-bg px-2 py-0.5 rounded-full border border-brand-border/40 font-mono"
                  >
                    {{ message.steps.filter((s) => s.status === 'success').length }}/{{
                      message.steps.length
                    }}
                    selesai
                  </span>
                </div>

                <button
                  class="text-brand-text/50 hover:text-brand-primary text-xs flex items-center gap-1 transition cursor-pointer"
                >
                  <span class="text-[11px] font-medium">{{
                    message.showSteps !== false ? 'Sembunyikan' : 'Detail'
                  }}</span>
                  <svg
                    class="w-3.5 h-3.5 transition-transform duration-200"
                    :class="{ 'rotate-180': message.showSteps === false }"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              <!-- Stepper Body (Vertical Steps) -->
              <div v-show="message.showSteps !== false" class="mt-3 pl-1 pr-1 space-y-0 relative">
                <div
                  v-for="(step, sIdx) in message.steps"
                  :key="step.id || sIdx"
                  class="flex gap-3 relative pb-3.5 last:pb-0.5"
                >
                  <!-- Garis vertikal penghubung stepper -->
                  <div
                    v-if="sIdx < message.steps.length - 1"
                    class="absolute left-[11px] top-6 bottom-0 w-[2px] transition-colors duration-300"
                    :class="step.status === 'success' ? 'bg-emerald-500/40' : 'bg-brand-border'"
                  ></div>

                  <!-- Ikon Node Status Stepper -->
                  <div class="relative z-10 shrink-0">
                    <!-- Status: Running -->
                    <div
                      v-if="step.status === 'running'"
                      class="w-6 h-6 rounded-full bg-amber-500/15 border-2 border-amber-400 flex items-center justify-center animate-pulse"
                    >
                      <svg
                        class="w-3 h-3 animate-spin text-amber-400"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          class="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          stroke-width="4"
                        ></circle>
                        <path
                          class="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                        ></path>
                      </svg>
                    </div>

                    <!-- Status: Success -->
                    <div
                      v-else-if="step.status === 'success'"
                      class="w-6 h-6 rounded-full bg-emerald-500/15 border-2 border-emerald-500/60 text-emerald-400 flex items-center justify-center shadow-sm"
                    >
                      <svg
                        class="w-3 h-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        stroke-width="3"
                      >
                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>

                    <!-- Status: Error -->
                    <div
                      v-else
                      class="w-6 h-6 rounded-full bg-rose-500/15 border-2 border-rose-500 text-rose-400 flex items-center justify-center"
                    >
                      <svg
                        class="w-3 h-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        stroke-width="3"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </div>
                  </div>

                  <!-- Konten Stepper -->
                  <div class="flex-1 pt-0.5 min-w-0">
                    <div class="flex items-center justify-between gap-2">
                      <p
                        class="text-xs font-medium leading-tight truncate"
                        :class="
                          step.status === 'running'
                            ? 'text-amber-300 font-semibold'
                            : 'text-brand-text/90'
                        "
                      >
                        {{ step.title }}
                      </p>
                      <span
                        class="text-[10px] shrink-0 font-medium px-1.5 py-0.5 rounded"
                        :class="{
                          'text-amber-300/90 bg-amber-400/10': step.status === 'running',
                          'text-emerald-400 bg-emerald-400/10': step.status === 'success',
                          'text-rose-400 bg-rose-400/10': step.status === 'error',
                        }"
                      >
                        {{
                          step.status === 'running'
                            ? 'Memproses...'
                            : step.status === 'success'
                              ? 'Selesai'
                              : 'Gagal'
                        }}
                      </span>
                    </div>

                    <!-- Tag Tool jika ada -->
                    <div v-if="step.tool" class="mt-1 flex items-center gap-1.5">
                      <span class="text-[10px] text-brand-text/50">Sumber:</span>
                      <code
                        class="font-mono text-[10px] text-brand-primary/80 bg-brand-bg px-1.5 py-0.5 rounded border border-brand-border/40"
                      >
                        {{
                          step.tool.toLowerCase().includes('query_database')
                            ? 'Database'
                            : step.tool
                        }}
                      </code>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 2. CHAT BUBBLE (HANYA BERISI BALASAN JAWABAN) -->
            <div
              v-if="
                message.text ||
                (message.isStreaming && (!message.steps || message.steps.length === 0))
              "
              class="chat-bubble-bot relative flex flex-col w-fit min-w-[100px] max-w-full"
              :class="{ '!border-rose-500/40 !bg-rose-950/20': message.isError }"
            >
              <div class="bubble-tail-left"></div>

              <!-- Animasi Loading Dots ketika belum ada teks sama sekali dan tidak ada stepper -->
              <div
                v-if="
                  message.isStreaming &&
                  !message.text &&
                  (!message.steps || message.steps.length === 0)
                "
                class="flex items-center justify-center gap-2 py-2 px-3 min-w-[64px]"
              >
                <span class="w-2.5 h-2.5 rounded-full bg-brand-primary animate-bounce"></span>
                <span
                  class="w-2.5 h-2.5 rounded-full bg-brand-primary animate-bounce [animation-delay:0.2s]"
                ></span>
                <span
                  class="w-2.5 h-2.5 rounded-full bg-brand-primary animate-bounce [animation-delay:0.4s]"
                ></span>
              </div>

              <!-- Teks Balasan Jawaban (Markdown Stream) -->
              <div
                v-if="message.text"
                class="prose prose-invert prose-sm max-w-none markdown-content overflow-x-auto"
                v-html="renderMarkDown(message.text?.answer?.answer || message.text)"
              ></div>

              <!-- Indikator Mengetik saat Streaming Berlangsung -->
              <div
                v-if="message.isStreaming && message.text"
                class="flex items-center gap-1.5 text-[11px] text-brand-primary/80 mt-2 font-mono animate-pulse"
              >
                <span class="w-1.5 h-1.5 rounded-full bg-brand-primary"></span>
                <span>AI sedang menulis...</span>
              </div>

              <!-- Notifikasi Error jika ada error sistem/jaringan -->
              <div
                v-if="message.isError"
                class="flex items-center gap-1.5 text-xs text-rose-400 mt-2"
              >
                <span>⚠️ Terjadi kendala koneksi saat streaming</span>
              </div>

              <!-- Waktu Pengiriman -->
              <span
                class="text-[10px] text-brand-text/50 self-end mt-1 font-mono whitespace-nowrap"
              >
                {{ message.time || '12:00' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Pesan Pengguna (User) -->
        <div class="flex w-full justify-end items-end gap-3" v-if="message.isUser">
          <div class="chat-bubble-user relative flex flex-col min-w-[72px]">
            <div class="bubble-tail-right"></div>

            <span>{{ message.text }}</span>

            <span class="text-[10px] text-black/50 self-end mt-1 font-mono whitespace-nowrap">
              {{ message.time || '12:00' }}
            </span>
          </div>

          <div class="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center shrink-0">
            👤
          </div>
        </div>
      </template>
    </template>

    <!-- Empty State / Layar Selamat Datang -->
    <div v-else class="max-w-sm flex flex-col items-center animate-fade-in">
      <div class="logo-bg-rounded">
        <img
          src="/src/assets/Ulfa_2_thinking.png"
          alt="Ulfa Assistant Large Logo"
          class="w-full h-full object-contain"
        />
      </div>
      <h1 class="text-3xl font-extrabold text-brand-text tracking-tight leading-tight mb-2">
        Let <span class="text-brand-primary">ULFA</span> help with anything
      </h1>
      <p class="text-sm text-brand-text/60 font-medium mb-6">Fast answers. Powered by AI.</p>

      <!-- Quick Prompt Suggestions -->
      <div v-if="quickPrompts && quickPrompts.length > 0" class="flex flex-col gap-2 w-full">
        <p class="text-xs text-brand-text/50 font-medium mb-0.5 text-left">Contoh pertanyaan:</p>
        <button
          v-for="(prompt, idx) in quickPrompts"
          :key="idx"
          @click="$emit('selectPrompt', prompt)"
          class="text-left text-xs bg-brand-surface/70 hover:bg-brand-surface border border-brand-border/60 hover:border-brand-primary/50 text-brand-text/80 hover:text-brand-primary px-3.5 py-2.5 rounded-xl transition shadow-sm flex items-center justify-between group cursor-pointer"
        >
          <span>{{ prompt }}</span>
          <span class="text-brand-text/30 group-hover:text-brand-primary transition">→</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { marked } from 'marked'

export default {
  name: 'ChatBodyComponent',
  props: {
    messages: {
      type: Array,
      default: () => [],
    },
    quickPrompts: {
      type: Array,
      default: () => [],
    },
  },
  emits: ['selectPrompt'],
  watch: {
    messages: {
      deep: true,
      handler() {
        this.scrollToBottom()
      },
    },
  },
  methods: {
    renderMarkDown(rawText) {
      if (!rawText) return ''
      const content =
        typeof rawText === 'object'
          ? rawText?.answer?.answer || rawText?.answer || rawText?.text || JSON.stringify(rawText)
          : String(rawText)
      return marked(content, {
        breaks: true,
      })
    },
    scrollToBottom() {
      this.$nextTick(() => {
        const el = this.$refs.chatContainer
        if (el) {
          el.scrollTop = el.scrollHeight
        }
      })
    },
  },
}
</script>
