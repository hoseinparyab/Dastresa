import { describe, expect, it, vi } from 'vitest';
import { EventBus } from '@/core/event-bus';

describe('EventBus', () => {
  it('delivers events to subscribers', () => {
    const bus = new EventBus();
    const handler = vi.fn();
    bus.on('zoom:applied', handler);
    bus.emit('zoom:applied', { scale: 1.2 });
    expect(handler).toHaveBeenCalledWith({ scale: 1.2 });
  });

  it('unsubscribes via returned disposer', () => {
    const bus = new EventBus();
    const handler = vi.fn();
    const off = bus.on('theme:applied', handler);
    off();
    bus.emit('theme:applied', { theme: 'dark' });
    expect(handler).not.toHaveBeenCalled();
  });

  it('supports once', () => {
    const bus = new EventBus();
    const handler = vi.fn();
    bus.once('dom:ready', handler);
    bus.emit('dom:ready', { ready: true });
    bus.emit('dom:ready', { ready: true });
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
