import { describe, it, expect, vi, beforeEach } from 'vitest';
import { playOrderChime } from './audio-chime';

describe('audio-chime utility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('handles playback in browser environment with complete AudioContext mock', () => {
    const mockOsc = {
      type: '',
      frequency: { setValueAtTime: vi.fn() },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };

    const mockGain = {
      gain: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
    };

    class MockAudioContext {
      currentTime = 0;
      state = 'suspended';
      destination = {};
      resume() {
        this.state = 'running';
      }
      createOscillator() {
        return mockOsc;
      }
      createGain() {
        return mockGain;
      }
    }

    (window as any).AudioContext = MockAudioContext;

    expect(() => playOrderChime()).not.toThrow();
  });

  it('handles errors gracefully when AudioContext throws', () => {
    class FailingAudioContext {
      constructor() {
        throw new Error('Audio blocked');
      }
    }

    (window as any).AudioContext = FailingAudioContext;

    expect(() => playOrderChime()).not.toThrow();
  });
});
