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
      typingQueue: '',
      typingTimer: null,
      isBackendDone: false,
      finalFullContent: null,
    }
  },
  mounted() {
    this.initSocket()
  },
  beforeUnmount() {
    this.clearTypingState()
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

      this.clearTypingState()

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
      this.typingQueue = ''
      this.isBackendDone = false
      this.finalFullContent = null

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
          if (chunk) {
            this.typingQueue += chunk
            this.startTypingStream()
          }
          break
        }

        case 'done': {
          console.log('AI selesai menjawab dari backend!')
          this.isBackendDone = true
          if (eventData.full_content) {
            this.finalFullContent = eventData.full_content
            const currentMsg = this.messages.find((m) => m.id === this.currentBotMessageId)
            if (currentMsg) {
              const currentTotal = (currentMsg.text || '') + this.typingQueue
              if (eventData.full_content.startsWith(currentTotal)) {
                this.typingQueue += eventData.full_content.slice(currentTotal.length)
              }
            }
          }

          if (!this.typingQueue || this.typingQueue.length === 0) {
            this.finishTypingStream()
          } else {
            this.startTypingStream()
          }
          break
        }

        case 'error': {
          const errorMsg =
            eventData.message ||
            eventData.detail ||
            eventData.error ||
            'Gagal memproses permintaan.'
          console.warn('Backend mengirim pesan status error:', errorMsg)

          this.clearTypingState()
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

    startTypingStream() {
      if (this.typingTimer) return

      const TICK_INTERVAL = 18 // ms (~55 ticks/detik)

      this.typingTimer = setInterval(() => {
        const currentMessage = this.messages.find((m) => m.id === this.currentBotMessageId)
        if (!currentMessage) {
          this.clearTypingState()
          return
        }

        if (this.typingQueue.length > 0) {
          let stepSize
          const qLen = this.typingQueue.length

          if (this.isBackendDone) {
            if (qLen > 100) stepSize = 8
            else if (qLen > 50) stepSize = 5
            else if (qLen > 20) stepSize = 3
            else if (qLen > 10) stepSize = 2
            else stepSize = 1
          } else {
            if (qLen > 120) stepSize = 6
            else if (qLen > 60) stepSize = 4
            else if (qLen > 25) stepSize = 2
            else stepSize = 1
          }

          const chars = this.typingQueue.slice(0, stepSize)
          this.typingQueue = this.typingQueue.slice(stepSize)
          currentMessage.text = (currentMessage.text || '') + chars
        }

        if (this.typingQueue.length === 0 && this.isBackendDone) {
          this.finishTypingStream()
        }
      }, TICK_INTERVAL)
    },

    finishTypingStream() {
      this.clearTypingTimer()
      const currentMessage = this.messages.find((m) => m.id === this.currentBotMessageId)

      if (currentMessage) {
        if (this.finalFullContent) {
          currentMessage.text = this.finalFullContent
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

      this.isTyping = false
      this.currentBotMessageId = null
      this.typingQueue = ''
      this.isBackendDone = false
      this.finalFullContent = null
    },

    clearTypingTimer() {
      if (this.typingTimer) {
        clearInterval(this.typingTimer)
        this.typingTimer = null
      }
    },

    clearTypingState() {
      this.clearTypingTimer()
      this.typingQueue = ''
      this.isBackendDone = false
      this.finalFullContent = null
    },

    handleStreamError(errorMessage, isSystemError = true) {
      this.clearTypingState()
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
      this.clearTypingState()
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
