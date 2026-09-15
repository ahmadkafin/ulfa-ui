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

        <!-- Send Icon saat Siap Kirim -->
        <svg
          v-else
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="2.5"
          stroke="currentColor"
          class="w-5 h-5"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"
          />
        </svg>
      </button>
    </form>
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
