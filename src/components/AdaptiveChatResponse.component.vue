<template>
  <div class="max-w-xl mx-auto p-5 rounded-2xl text-brand-text">
    {{ parsedData }}
    <template v-if="parsedData.steps.length > 0">
      <p class="text-sm font-medium text-brand-text/80 mb-4 leading-relaxed">
        {{ parsedData.intro }}
      </p>

      <div class="space-y-3" :class="{ 'mb-5': parsedData.outro }">
        <div
          v-for="step in parsedData.steps"
          :key="step.id"
          class="flex gap-3 bg-brand-bg/50 border border-brand-border/40 p-3 rounded-xl items-start"
        >
          <span
            class="flex-shrink-0 w-6 h-6 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-bold flex items-center justify-center font-mono mt-0.5"
          >
            {{ step.id }}
          </span>

          <p class="text-sm leading-relaxed text-brand-text/90">
            <span
              v-for="(part, index) in splitMarkdown(step.content)"
              :key="index"
              :class="index % 2 === 1 ? 'text-brand-primary font-bold' : ''"
            >
              {{ part }}
            </span>
          </p>
        </div>
      </div>

      <p
        v-if="parsedData.outro"
        class="text-xs text-brand-text/60 border-t border-brand-border/60 pt-3 leading-relaxed"
      >
        {{ parsedData.outro }}
      </p>
    </template>

    <template v-else>
      <p class="text-sm leading-relaxed text-brand-text/90">
        {{ parsedData.intro }}
      </p>
    </template>
  </div>
</template>

<script>
export default {
  name: 'AdaptiveChatResponse',
  props: {
    // Menerima string respons dari API chatbot
    apiResponse: {
      type: String,
      default: '',
    },
  },
  computed: {
    parsedData() {
      const text = this.apiResponse
      if (!text) return { intro: '', steps: [], outro: '' }

      // Regex handal untuk menangkap pola angka "1. ", "2. ", dst
      const stepRegex = /(\d+)\.\s*(.*?)(?=\s*\d+\.|$)/g
      const steps = []
      let match

      const firstStepIndex = text.search(/\d+\./)

      // Jika TIDAK ADA pola angka sama sekali (Skenario B)
      if (firstStepIndex === -1) {
        return {
          intro: text.trim(),
          steps: [],
          outro: '',
        }
      }

      // Jika ADA pola angka (Skenario A)
      const introText = text.substring(0, firstStepIndex).trim()
      let outroText = ''

      while ((match = stepRegex.exec(text)) !== null) {
        let stepText = match[2].trim()

        // PERBAIKAN CRITICAL: Menggunakan (?:...) agar tidak mengacaukan index array regex
        if (stepText.includes('Jika Anda')) {
          const outroIndex = stepText.search(/Jika Anda (?:masih|memiliki)/)
          if (outroIndex !== -1) {
            outroText = stepText.substring(outroIndex).trim()
            stepText = stepText.substring(0, outroIndex).trim()
          }
        }

        steps.push({
          id: parseInt(match[1]),
          content: stepText,
        })
      }
      let w = {
        intro: introText,
        steps: steps,
        outro: outroText,
      }
      console.log(w)

      return {
        intro: introText,
        steps: steps,
        outro: outroText,
      }
    },
  },
  methods: {
    splitMarkdown(text) {
      if (!text) return []
      return text.split('**')
    },
  },
}
</script>
