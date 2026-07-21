import type { EventMap, EventName, Unsubscribe } from '@/core/types/events';
import type { FeatureId } from '@/core/constants';

export interface FeatureContext {
  bus: IEventBus;
  storage: IStorage;
  document: Document;
  window: Window;
}

export interface IFeature {
  readonly id: FeatureId | string;
  readonly name: string;
  readonly version: string;
  initialize(ctx: FeatureContext): Promise<void> | void;
  dispose(): Promise<void> | void;
  enable(): Promise<void> | void;
  disable(): Promise<void> | void;
  isEnabled(): boolean;
}

export interface IEventBus {
  on<T extends EventName>(event: T, handler: (payload: EventMap[T]) => void): Unsubscribe;
  once<T extends EventName>(event: T, handler: (payload: EventMap[T]) => void): Unsubscribe;
  off<T extends EventName>(event: T, handler: (payload: EventMap[T]) => void): void;
  emit<T extends EventName>(event: T, payload: EventMap[T]): void;
}

export interface IStorage {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;
  watch<T>(key: string, listener: (value: T | undefined) => void): Unsubscribe;
}

export interface DomSnapshot {
  title: string;
  lang: string;
  paragraphCount: number;
  imageCount: number;
  ready: boolean;
  textLength: number;
}

export interface IDomAnalyzer {
  analyze(doc?: Document): DomSnapshot;
  findReadableRoots(doc?: Document): HTMLElement[];
  isReady(doc?: Document): boolean;
}

export interface ReadableDocument {
  title: string;
  byline?: string;
  html: string;
  text: string;
  paragraphs: string[];
}

export interface IReadableContentProvider {
  getContent(): ReadableDocument | null;
}

export type SpeechState = 'idle' | 'playing' | 'paused' | 'stopped';

export interface ISpeechEngine {
  play(paragraphs?: string[]): Promise<void>;
  pause(): void;
  resume(): void;
  stop(): void;
  setVoice(voiceURI: string): void;
  setRate(rate: number): void;
  setPitch(pitch: number): void;
  setVolume(volume: number): void;
  getState(): SpeechState;
}

export type StyleTokenMap = Record<string, string>;

export interface IStyleController {
  apply(tokens: StyleTokenMap): void;
  reset(): void;
}

export interface IModuleRegistry {
  register(feature: IFeature): void;
  get(id: string): IFeature | undefined;
  getAll(): IFeature[];
  loadLazy(
    id: string,
    loader: () => Promise<{ default?: IFeature; feature?: IFeature }>,
  ): Promise<IFeature>;
}

export interface IExtensionPoint {
  readonly id: string;
  readonly capability: string;
  readonly status: 'future';
}
