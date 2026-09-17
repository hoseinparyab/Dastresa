import { createRoot, type Root } from 'react-dom/client';
import type { FeatureContext, IFeature } from '@/core/contracts';
import { EVENTS, FEATURE_IDS, STORAGE_KEYS } from '@/core/constants';
import { analyzePage, classifyPage, type PageType } from '@/core/semantics';
import { parseSettings, type DastresaSettings, type UiChrome } from '@/core/settings';
import { patchStoredSettings } from '@/features/settings/services/patch-settings';
import { ToolbarApp } from '@/features/toolbar/ToolbarApp';
import { clampPos, CHIP_H, CHIP_W, isLegacyTopLeft, resolveToolbarPosition } from '@/features/toolbar/geometry';
import { TOOLBAR_CSS } from '@/features/toolbar/styles';
import { pageTypeMessageKey, t, type AppLocale } from '@/shared/i18n/messages';

export class ToolbarFeature implements IFeature {
  readonly id = FEATURE_IDS.TOOLBAR;
  readonly name = 'Accessibility Toolbar';
  readonly version = '1.2.0';
  private enabled = true;
  private host?: HTMLElement;
  private root?: Root;
  private ctx?: FeatureContext;
  private pos = { x: 24, y: 24 };
  private locale: AppLocale = 'fa';
  private dir: 'ltr' | 'rtl' = 'rtl';
  private readerMode = false;
  private readingFocus = false;
  private summarizing = false;
  private pageType: PageType = 'UNKNOWN';
  private uiChrome: UiChrome = 'dark';
  private unsubs: Array<() => void> = [];
  private migrated = false;

  initialize(ctx: FeatureContext): void {
    this.ctx = ctx;
    void this.hydrateFromStorage().then(() => {
      this.refreshPageType();
      this.mount();
      this.render();
    });

    this.unsubs.push(
      ctx.bus.on(EVENTS.SETTINGS_CHANGED, ({ settings }) => {
        this.applySettings(settings);
        // Keep saved XY; only re-clamp so locale/chrome refreshes don't jump the chip.
        this.pos = clampPos(
          ctx.window,
          settings.toolbarPosition ?? this.pos,
          CHIP_W,
          CHIP_H,
        );
        this.render();
      }),
    );
    this.unsubs.push(
      ctx.bus.on(EVENTS.PAGE_TYPE_DETECTED, ({ result }) => {
        this.pageType = result.type;
        this.render();
      }),
    );
    this.unsubs.push(
      ctx.bus.on(EVENTS.SUMMARY_STARTED, () => {
        this.summarizing = true;
        this.render();
      }),
    );
    this.unsubs.push(
      ctx.bus.on(EVENTS.SUMMARY_READY, () => {
        this.summarizing = false;
        this.render();
      }),
    );
    this.unsubs.push(
      ctx.bus.on(EVENTS.SUMMARY_FAILED, () => {
        this.summarizing = false;
        this.render();
      }),
    );
  }

  private applySettings(settings: DastresaSettings): void {
    this.locale = settings.locale === 'en' ? 'en' : 'fa';
    this.dir = settings.dir === 'ltr' ? 'ltr' : 'rtl';
    this.readerMode = settings.readerMode;
    this.readingFocus = settings.readingFocus;
    this.uiChrome = settings.uiChrome === 'light' ? 'light' : 'dark';
  }

  private refreshPageType(): void {
    if (!this.ctx) return;
    try {
      this.pageType = classifyPage(analyzePage(this.ctx.document)).type;
    } catch {
      this.pageType = 'UNKNOWN';
    }
  }

  private async hydrateFromStorage(): Promise<void> {
    if (!this.ctx) return;
    const raw = await this.ctx.storage.get<unknown>(STORAGE_KEYS.SETTINGS);
    const settings = parseSettings(raw);
    this.applySettings(settings);
    const resolved = resolveToolbarPosition(this.ctx.window, settings.toolbarPosition, false);
    this.pos = resolved;

    if (
      !this.migrated &&
      (isLegacyTopLeft(settings.toolbarPosition) ||
        settings.toolbarPosition.x !== resolved.x ||
        settings.toolbarPosition.y !== resolved.y)
    ) {
      this.migrated = true;
      await patchStoredSettings(this.ctx.storage, { toolbarPosition: resolved });
    }
  }

  private mount(): void {
    if (!this.ctx || this.host) return;
    this.host = this.ctx.document.createElement('div');
    this.host.id = 'Dastresa-toolbar-host';
    this.host.setAttribute('data-Dastresa', 'toolbar');
    this.host.style.cssText =
      'all:initial;position:fixed;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none;z-index:2147483646;';
    const shadow = this.host.attachShadow({ mode: 'open' });
    const style = this.ctx.document.createElement('style');
    style.textContent = TOOLBAR_CSS;
    const mount = this.ctx.document.createElement('div');
    shadow.appendChild(style);
    shadow.appendChild(mount);
    this.ctx.document.documentElement.appendChild(this.host);
    this.root = createRoot(mount);
  }

  private render(): void {
    if (!this.root || !this.ctx) return;
    const pageTypeLabel = t(this.locale, pageTypeMessageKey(this.pageType));
    this.root.render(
      <ToolbarApp
        x={this.pos.x}
        y={this.pos.y}
        locale={this.locale}
        dir={this.dir}
        readerMode={this.readerMode}
        readingFocus={this.readingFocus}
        summarizing={this.summarizing}
        uiChrome={this.uiChrome}
        pageTypeLabel={pageTypeLabel}
        onCommand={(command) => {
          if (command === 'settings') {
            try {
              void chrome.runtime.sendMessage({ type: 'open-options' });
            } catch {
              // ignore when messaging unavailable
            }
          }
          this.ctx?.bus.emit(EVENTS.TOOLBAR_COMMAND, { command });
        }}
        onMoved={(nx, ny) => {
          if (this.pos.x === nx && this.pos.y === ny) return;
          this.pos = { x: nx, y: ny };
          this.ctx?.bus.emit(EVENTS.TOOLBAR_MOVED, { x: nx, y: ny });
        }}
      />,
    );
  }

  dispose(): void {
    this.unsubs.forEach((u) => u());
    this.unsubs = [];
    this.root?.unmount();
    this.host?.remove();
    this.root = undefined;
    this.host = undefined;
  }

  enable(): void {
    this.enabled = true;
    if (!this.host) {
      void this.hydrateFromStorage().then(() => {
        this.mount();
        this.render();
      });
    } else {
      this.render();
    }
  }

  disable(): void {
    this.enabled = false;
    this.root?.unmount();
    this.host?.remove();
    this.root = undefined;
    this.host = undefined;
  }

  isEnabled(): boolean {
    return this.enabled;
  }
}

export const feature = new ToolbarFeature();
export default feature;
