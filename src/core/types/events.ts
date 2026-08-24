import type { DastresaSettings } from '@/core/settings';

export type Unsubscribe = () => void;

export type EventMap = {
  'settings:changed': { settings: DastresaSettings };
  'toolbar:command': {
    command:
      | 'reader'
      | 'read'
      | 'pause'
      | 'resume'
      | 'stop'
      | 'zoom-in'
      | 'zoom-out'
      | 'contrast'
      | 'focus'
      | 'summary'
      | 'settings'
      | 'exit'
      | 'reset';
  };
  'toolbar:moved': { x: number; y: number };
  'extension:exited': undefined;
  'extension:activated': undefined;
  'reader:activated': undefined;
  'reader:deactivated': undefined;
  'reader:content-ready': {
    title: string;
    text: string;
    paragraphs: string[];
    html: string;
  };
  'speech:state': {
    state: 'idle' | 'playing' | 'paused' | 'stopped';
  };
  'speech:paragraph': { index: number; text: string };
  'focus:paragraph': { index: number };
  'theme:applied': { theme: string };
  'zoom:applied': { scale: number };
  'dom:ready': { ready: boolean };
  'dom:changed': { reason: string };
  'summary:started': undefined;
  'summary:ready': { summary: string; title: string };
  'summary:failed': { message: string };
};

export type EventName = keyof EventMap;
