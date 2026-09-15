<template>
  <div class="window-wrapper">
    <ChatHeaderComponent @clearChat="clearChat" :isConnected="isConnected" />
    <ChatBodyComponent
      :messages="messages"
      :quickPrompts="quickPrompts"
      @selectPrompt="sendMessage"
    />
    <ChatInputComponent @sendMessage="sendMessage" :isTyping="isTyping" />
  </div>
</template>

<script>
import io from 'socket.io-client'
import ChatBodyComponent from './components/ChatBody.component.vue'
import ChatHeaderComponent from './components/ChatHeader.component.vue'
import ChatInputComponent from './components/ChatInput.component.vue'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3008'
const SOCKET_PATH = import.meta.env.VITE_SOCKET_PATH || '/socket.io'

export default {
  components: { ChatHeaderComponent, ChatBodyComponent, ChatInputComponent },
  data() {
    return {
      isTyping: false,
      isConnected: false,
      socket: null,
      messages: [],
      currentBotMessageId: null,
      quickPrompts: [
        'Bagaimana cara login digio?',
        'Bagaimana cara registrasi akun baru?',
        'Bagaimana kondisi pipa di wilayah SOR 1?',
      ],
    }
  },
  mounted() {
    this.initSocket()
  },
  beforeUnmount() {
    if (this.socket) {
      this.socket.disconnect()
    }
  },
  methods: {
    initSocket() {
      this.socket = io(SOCKET_URL, {
        path: SOCKET_PATH,
        transports: ['websocket', 'polling'],
      })

      this.socket.on('connect', () => {
        console.log('Socket.IO terhubung ke:', SOCKET_URL)
        this.isConnected = true
      })

      this.socket.on('disconnect', () => {
        console.log('Socket.IO terputus')
        this.isConnected = false
      })

      this.socket.on('connect_error', (error) => {
        console.error('Koneksi Socket Gagal:', error)
        this.isConnected = false
        if (this.isTyping) {
          this.handleStreamError('Koneksi ke server gateway terputus atau gagal terhubung.')
        }
      })

      this.socket.on('ai_stream', (rawEventData) => {
        let eventData = rawEventData
        if (typeof rawEventData === 'string') {
          try {
            eventData = JSON.parse(rawEventData)
          } catch (e) {
            console.error('Gagal mem-parse eventData JSON:', e)
          }
        }
        console.log('[ai_stream received]:', eventData)
        this.handleAiStream(eventData)
      })
    },

    sendMessage(payload) {
      const text = typeof payload === 'string' ? payload.trim() : ''
      if (!text || this.isTyping) return

      this.addMessage({
        id: 'user-' + Date.now(),
        text: text,
        isUser: true,
        time: this.getCurrentTimeString(),
      })

      const botMessageId = 'bot-' + Date.now()
      this.currentBotMessageId = botMessageId
      this.addMessage({
        id: botMessageId,
        text: '',
        isUser: false,
        time: this.getCurrentTimeString(),
        isStreaming: true,
        isError: false,
        steps: [],
        showSteps: true,
      })

      this.isTyping = true

      console.log('Mengirim pertanyaan:', text)
      if (this.socket && this.socket.connected) {
        this.socket.emit('user_ask', { question: text })
      } else {
        // Jika server belum siap/terhubung
        setTimeout(() => {
          this.handleStreamError('Maaf, belum dapat terhubung ke server AI gateway.', true)
        }, 1000)
      }
    },

    handleAiStream(eventData) {
      if (!eventData) return

      const currentMessage = this.messages.find((m) => m.id === this.currentBotMessageId)

      switch (eventData.type) {
        case 'tool_start': {
          const rawTool = eventData.tool || eventData.tool_name || ''
          let toolDesc =
            eventData.message ||
            eventData.tool ||
            eventData.tool_name ||
            eventData.name ||
            'Mencari informasi...'

          const isDatabaseQuery =
            rawTool.toLowerCase().includes('query_database') ||
            (eventData.name && eventData.name.toLowerCase().includes('query_database'))

          const isFromStpQuery =
            rawTool.toLowerCase().includes('run_stored_procedure') ||
            (eventData.name && eventData.name.toLowerCase().includes('run_stored_procedure'))

          if (isDatabaseQuery || isFromStpQuery) {
            toolDesc = 'Sedang Mengambil Dari Database'
          }
          const displayTool = isDatabaseQuery ? 'Database' : rawTool

          console.log('AI sedang menggunakan tool:', toolDesc, rawTool)

          if (currentMessage) {
            if (!currentMessage.steps) currentMessage.steps = []
            const synthIdx = currentMessage.steps.findIndex((s) => s.isSynthesis)
            if (synthIdx !== -1) {
              currentMessage.steps.splice(synthIdx, 1)
            }
            currentMessage.steps.push({
              id: 'step-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
              title: toolDesc,
              tool: displayTool,
              rawTool: rawTool,
              status: 'running',
              time: this.getCurrentTimeString(),
            })
          }
          break
        }

        case 'tool_end': {
          const toolName = eventData.tool || eventData.tool_name || ''
          console.log('Tool selesai:', toolName, 'Status:', eventData.status)

          if (currentMessage && currentMessage.steps) {
            const step =
              currentMessage.steps
                .slice()
                .reverse()
                .find(
                  (s) =>
                    (s.rawTool === toolName || s.tool === toolName || !s.tool) &&
                    s.status === 'running',
                ) ||
              currentMessage.steps
                .slice()
                .reverse()
                .find((s) => s.status === 'running')

            if (step) {
              step.status = eventData.status === 'error' ? 'error' : 'success'
            }
            currentMessage.steps.push({
              id: 'step-synth-' + Date.now(),
              title: 'Menyusun balasan',
              tool: '',
              isSynthesis: true,
              status: 'running',
              time: this.getCurrentTimeString(),
            })
          }
          break
        }

        case 'token': {
          const chunk = eventData.content !== undefined ? eventData.content : eventData.text || ''
          if (currentMessage) {
            currentMessage.text += chunk
          }
          break
        }

        case 'done': {
          console.log('AI selesai menjawab!')
          this.isTyping = false
          if (currentMessage) {
            if (eventData.full_content) {
              currentMessage.text = eventData.full_content
            }
            currentMessage.isStreaming = false
            if (currentMessage.steps) {
              currentMessage.steps.forEach((s) => {
                if (s.status === 'running') {
                  s.status = 'success'
                }
              })
            }
          }
          this.currentBotMessageId = null
          break
        }

        case 'error': {
          const errorMsg =
            eventData.message ||
            eventData.detail ||
            eventData.error ||
            'Gagal memproses permintaan.'
          console.warn('Backend mengirim pesan status error:', errorMsg)

          if (currentMessage && currentMessage.steps) {
            const runningStep = currentMessage.steps.find((s) => s.status === 'running')
            if (runningStep) {
              runningStep.status = 'error'
            }
          }
          this.handleStreamError(errorMsg, false)
          break
        }

        default: {
          console.log('Event stream lain-lain:', eventData)
        }
      }
    },

    handleStreamError(errorMessage, isSystemError = true) {
      this.isTyping = false
      const currentMessage = this.messages.find((m) => m.id === this.currentBotMessageId)
      const errorText = errorMessage || 'Terjadi kesalahan saat memproses permintaan.'

      if (currentMessage) {
        if (!currentMessage.text) {
          currentMessage.text = errorText
        } else {
          currentMessage.text += `\n\n*(Catatan: ${errorText})*`
        }
        currentMessage.isStreaming = false
        currentMessage.isError = isSystemError

        if (currentMessage.steps) {
          currentMessage.steps.forEach((s) => {
            if (s.status === 'running') {
              s.status = 'error'
            }
          })
        }
      }
      this.currentBotMessageId = null
    },

    addMessage(messageObj) {
      this.messages.push(messageObj)
    },

    clearChat() {
      this.messages = []
      this.isTyping = false
      this.currentBotMessageId = null
    },

    getCurrentTimeString() {
      const now = new Date()
      return now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    },
  },
}
</script>
