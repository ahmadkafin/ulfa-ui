import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import { mount } from '@vue/test-utils'
import App from '../App.vue'

describe('App', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('mounts renders properly', () => {
    const wrapper = mount(App)
    expect(wrapper.text()).toContain('Let ULFA help with anything')
  })

  it('types stream response progressively with typewriter effect', async () => {
    const wrapper = mount(App)
    const vm = wrapper.vm

    // Simulate sending message
    vm.sendMessage('Halo Ulfa')
    expect(vm.isTyping).toBe(true)
    expect(vm.messages).toHaveLength(2)
    const botMsg = vm.messages[1]
    expect(botMsg.text).toBe('')
    expect(botMsg.isStreaming).toBe(true)

    // Receive streaming token
    vm.handleAiStream({ type: 'token', content: 'Halo dunia' })
    expect(vm.typingQueue).toBe('Halo dunia')

    // Advance timers by a few ticks
    vi.advanceTimersByTime(40)
    expect(botMsg.text.length).toBeGreaterThan(0)
    expect(vm.typingQueue.length).toBeLessThan(10)

    // Send done event
    vm.handleAiStream({ type: 'done', full_content: 'Halo dunia' })
    expect(vm.isBackendDone).toBe(true)

    // Advance timers until fully drained
    vi.advanceTimersByTime(300)
    expect(botMsg.text).toBe('Halo dunia')
    expect(botMsg.isStreaming).toBe(false)
    expect(vm.isTyping).toBe(false)
  })

  it('uses hybrid stepped + smooth increment progress and hides it on first token', async () => {
    const wrapper = mount(App)
    const vm = wrapper.vm
    vm.socket.disconnect()
    vm.socket = { connected: true, emit: vi.fn(), disconnect: vi.fn() }

    vm.sendMessage('Cek data aset pipa')
    const botMsg = vm.messages[1]

    // Phase 0: initial waiting (5% -> capped at 25%)
    expect(botMsg.hasFirstToken).toBe(false)
    expect(botMsg.progress).toBe(5)
    expect(botMsg.progressLabel).toBe('Memahami pertanyaan...')

    vi.advanceTimersByTime(1500)
    expect(botMsg.progress).toBeGreaterThan(5)
    expect(botMsg.progress).toBeLessThanOrEqual(25)

    // Cap should hold even after long wait
    vi.advanceTimersByTime(15000)
    expect(botMsg.progress).toBeLessThanOrEqual(25)
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain(`${botMsg.progress}%`)
    expect(wrapper.text()).toContain('Memahami pertanyaan...')

    // Phase 1: tool_start (30% -> capped at 68%)
    vm.handleAiStream({
      type: 'tool_start',
      tool: 'pipe_asset_lookup',
      message: 'Sedang mengambil data aset pipa...',
    })
    expect(botMsg.progress).toBeGreaterThanOrEqual(30)
    expect(botMsg.progressLabel).toBe('Sedang mengambil data aset pipa...')

    vi.advanceTimersByTime(15000)
    expect(botMsg.progress).toBeGreaterThan(30)
    expect(botMsg.progress).toBeLessThanOrEqual(68)
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Alur Proses AI')
    expect(wrapper.text()).toContain(`${botMsg.progress}%`)
    expect(wrapper.text()).toContain('Sedang mengambil data aset pipa...')

    // Phase 2: tool_end (72% -> capped at 95%)
    vm.handleAiStream({
      type: 'tool_end',
      tool: 'pipe_asset_lookup',
      status: 'success',
    })
    expect(botMsg.progress).toBeGreaterThanOrEqual(72)
    expect(botMsg.progressLabel).toBe('Menyusun jawaban...')

    vi.advanceTimersByTime(15000)
    expect(botMsg.progress).toBeGreaterThan(72)
    expect(botMsg.progress).toBeLessThanOrEqual(95)

    // Phase 3: first token arrives -> progress bar hides automatically
    vm.handleAiStream({ type: 'token', content: 'Berikut data pipa' })
    expect(botMsg.hasFirstToken).toBe(true)
    expect(vm.progressTimer).toBeNull()

    await wrapper.vm.$nextTick()
    expect(wrapper.text()).not.toContain('Menyusun jawaban...')

    vm.handleAiStream({ type: 'done', full_content: 'Berikut data pipa' })
    vi.advanceTimersByTime(500)
    expect(botMsg.text).toBe('Berikut data pipa')
    expect(botMsg.isStreaming).toBe(false)
  })
})
