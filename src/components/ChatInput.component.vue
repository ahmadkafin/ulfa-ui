<template>
  <div class="chat-input-area">
    <form @submit.prevent="sendMessage" class="flex gap-2 items-center">
      <input
        type="text"
        :placeholder="isTyping ? 'Ulfa sedang merespons...' : 'Tulis pesan ke Ulfa...'"
        class="chat-box-input disabled:opacity-60 disabled:cursor-not-allowed"
        v-model="inputMessage"
        :disabled="isTyping"
      />
      <button
        type="submit"
        class="btn-send-chat disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer"
        :disabled="!inputMessage.trim() || isTyping"
      >
        <!-- Spinner Icon saat AI Streaming -->
        <svg
          v-if="isTyping"
          class="w-5 h-5 animate-spin text-black"
          xmlns="http://www.w3.org/2000/svg"
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

        <!-- Send Icon saat Siap Kirim (Arrow Up Slim) -->
        <svg
          v-else
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="2"
          stroke="currentColor"
          class="w-5 h-5"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 19.5V4.5m0 0-6 6m6-6 6 6" />
        </svg>
      </button>
    </form>
    <div class="text-center mt-2">
      <p class="text-[11px] text-brand-text/50 font-normal select-none">
        AI bisa membuat kesalahan. Periksa kembali untuk memastikan keakuratannya.
      </p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ChatInputComponent',
  props: ['isTyping'],
  data() {
    return {
      inputMessage: '',
    }
  },
  methods: {
    sendMessage() {
      this.$emit('sendMessage', this.inputMessage)
      this.inputMessage = ''
    },
  },
}
</script>
