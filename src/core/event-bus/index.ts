import type { EventMap, EventName, Unsubscribe } from '@/core/types/events';
import type { IEventBus } from '@/core/contracts';

type Handler<T> = (payload: T) => void;

export class EventBus implements IEventBus {
  private readonly listeners = new Map<EventName, Set<Handler<unknown>>>();

  on<T extends EventName>(event: T, handler: (payload: EventMap[T]) => void): Unsubscribe {
    const set = this.listeners.get(event) ?? new Set();
    set.add(handler as Handler<unknown>);
    this.listeners.set(event, set);
    return () => this.off(event, handler);
  }

  once<T extends EventName>(event: T, handler: (payload: EventMap[T]) => void): Unsubscribe {
    const wrapped = ((payload: EventMap[T]) => {
      this.off(event, wrapped);
      handler(payload);
    }) as (payload: EventMap[T]) => void;
    return this.on(event, wrapped);
  }

  off<T extends EventName>(event: T, handler: (payload: EventMap[T]) => void): void {
    this.listeners.get(event)?.delete(handler as Handler<unknown>);
  }

  emit<T extends EventName>(event: T, payload: EventMap[T]): void {
    const set = this.listeners.get(event);
    if (!set) return;
    for (const handler of [...set]) {
      try {
        (handler as Handler<EventMap[T]>)(payload);
      } catch (error) {
        console.error(`[Dastresa] Event handler error for ${event}`, error);
      }
    }
  }
}

export function createEventBus(): IEventBus {
  return new EventBus();
}
