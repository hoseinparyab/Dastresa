import { describe, expect, it } from 'vitest';
import { MemoryStorage } from '@/features/storage/services/chrome-storage';

describe('MemoryStorage', () => {
  it('stores and retrieves values', async () => {
    const storage = new MemoryStorage();
    await storage.set('k', { a: 1 });
    await expect(storage.get('k')).resolves.toEqual({ a: 1 });
  });

  it('notifies watchers', async () => {
    const storage = new MemoryStorage();
    const values: unknown[] = [];
    storage.watch('k', (v) => values.push(v));
    await storage.set('k', 'hello');
    expect(values).toEqual(['hello']);
  });
});
