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
})
