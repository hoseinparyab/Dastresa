import { safeQueryAll } from '@/core/utils';
import type {
  ElementInfo,
  FormFieldInfo,
  FormFieldValidation,
  FormInfo,
  HeadingInfo,
} from './types';

function preview(text: string | null | undefined, max = 120): string | undefined {
  const t = (text ?? '').replace(/\s+/g, ' ').trim();
  if (!t) return undefined;
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}

function accessibleName(el: Element): string | undefined {
  const aria = el.getAttribute('aria-label')?.trim();
  if (aria) return aria;
  const labelledBy = el.getAttribute('aria-labelledby');
  if (labelledBy && el.ownerDocument) {
    const parts = labelledBy
      .split(/\s+/)
      .map((id) => el.ownerDocument?.getElementById(id)?.textContent?.trim())
      .filter(Boolean);
    if (parts.length) return parts.join(' ');
  }
  if (el instanceof HTMLElement) {
    const title = el.title?.trim();
    if (title) return title;
  }
  return preview(el.textContent, 80);
}

export function toElementInfo(el: Element): ElementInfo {
  return {
    tag: el.tagName.toLowerCase(),
    role: el.getAttribute('role') ?? undefined,
    label: accessibleName(el),
    textPreview: preview(el.textContent, 100),
    selectorHint: el.id ? `#${CSS.escape(el.id)}` : el.tagName.toLowerCase(),
  };
}

function fieldLabel(el: HTMLElement): string | undefined {
  const doc = el.ownerDocument;
  if (!doc) return accessibleName(el);

  if (el.id) {
    const byFor = doc.querySelector(`label[for="${CSS.escape(el.id)}"]`);
    if (byFor) return preview(byFor.textContent, 80);
  }

  const wrapping = el.closest('label');
  if (wrapping) return preview(wrapping.textContent, 80);

  return accessibleName(el);
}

function fieldDescription(el: HTMLElement): string | undefined {
  const describedBy = el.getAttribute('aria-describedby');
  if (!describedBy || !el.ownerDocument) return undefined;
  const parts = describedBy
    .split(/\s+/)
    .map((id) => el.ownerDocument?.getElementById(id)?.textContent?.trim())
    .filter(Boolean);
  return parts.length ? parts.join(' ') : undefined;
}

function fieldValidation(el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement):
  | FormFieldValidation
  | undefined {
  const validation: FormFieldValidation = {};
  if ('minLength' in el && el.minLength >= 0 && el.getAttribute('minlength')) {
    validation.minLength = el.minLength;
  }
  if ('maxLength' in el && el.maxLength >= 0 && el.getAttribute('maxlength')) {
    validation.maxLength = el.maxLength;
  }
  if (el instanceof HTMLInputElement) {
    if (el.pattern) validation.pattern = el.pattern;
    if (el.min) validation.min = el.min;
    if (el.max) validation.max = el.max;
  }
  return Object.keys(validation).length ? validation : undefined;
}

export function analyzeField(el: HTMLElement): FormFieldInfo | null {
  if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement)) {
    return null;
  }
  if (el instanceof HTMLInputElement && (el.type === 'hidden' || el.type === 'submit' || el.type === 'button' || el.type === 'image' || el.type === 'reset')) {
    return null;
  }

  const type =
    el instanceof HTMLSelectElement
      ? 'select'
      : el instanceof HTMLTextAreaElement
        ? 'textarea'
        : el.type || 'text';

  return {
    id: el.id || undefined,
    name: el.name || undefined,
    type,
    label: fieldLabel(el),
    placeholder: 'placeholder' in el ? el.placeholder || undefined : undefined,
    description: fieldDescription(el),
    required: el.required || el.getAttribute('aria-required') === 'true',
    disabled: el.disabled,
    readonly: 'readOnly' in el ? Boolean(el.readOnly) : false,
    autocomplete: el.autocomplete || undefined,
    validation: fieldValidation(el),
  };
}

export function analyzeForms(doc: Document): FormInfo[] {
  const forms = safeQueryAll(doc, 'form');
  const results: FormInfo[] = [];

  for (const form of forms) {
    if (!(form instanceof HTMLFormElement)) continue;
    const fields: FormFieldInfo[] = [];
    const controls = form.querySelectorAll('input, select, textarea');
    for (const control of controls) {
      if (!(control instanceof HTMLElement)) continue;
      const info = analyzeField(control);
      if (info) fields.push(info);
    }
    results.push({
      name: form.getAttribute('name') || form.id || undefined,
      action: form.getAttribute('action') || undefined,
      method: (form.getAttribute('method') || 'get').toLowerCase(),
      fields,
    });
  }

  // Orphan fields outside <form>
  if (results.length === 0) {
    const orphans: FormFieldInfo[] = [];
    for (const control of safeQueryAll(doc, 'input, select, textarea')) {
      if (!(control instanceof HTMLElement) || control.closest('form')) continue;
      const info = analyzeField(control);
      if (info) orphans.push(info);
    }
    if (orphans.length >= 2) {
      results.push({ fields: orphans });
    }
  }

  return results;
}

export function buildHeadingTree(doc: Document): {
  tree: HeadingInfo[];
  flat: Array<{ level: number; text: string; id?: string }>;
} {
  const nodes = safeQueryAll(doc, 'h1, h2, h3, h4, h5, h6');
  const flat: Array<{ level: number; text: string; id?: string }> = [];
  const roots: HeadingInfo[] = [];
  const stack: HeadingInfo[] = [];

  for (const node of nodes) {
    const level = Number(node.tagName.charAt(1)) as 1 | 2 | 3 | 4 | 5 | 6;
    if (!Number.isFinite(level) || level < 1 || level > 6) continue;
    const text = preview(node.textContent, 160) ?? '';
    if (!text) continue;
    const item: HeadingInfo = {
      level,
      text,
      id: node.id || undefined,
      children: [],
    };
    flat.push({ level, text, id: item.id });

    while (stack.length && stack[stack.length - 1]!.level >= level) {
      stack.pop();
    }
    const parent = stack[stack.length - 1];
    if (parent) parent.children.push(item);
    else roots.push(item);
    stack.push(item);
  }

  return { tree: roots, flat };
}

export function collectLandmarks(doc: Document) {
  const header =
    doc.querySelector('header, [role="banner"]') ?? undefined;
  const footer =
    doc.querySelector('footer, [role="contentinfo"]') ?? undefined;
  const main =
    doc.querySelector('main, [role="main"]') ?? undefined;
  const navigation = safeQueryAll(doc, 'nav, [role="navigation"]').slice(0, 12);
  const complementary = safeQueryAll(doc, 'aside, [role="complementary"]').slice(0, 12);

  return {
    header: header ? toElementInfo(header) : undefined,
    footer: footer ? toElementInfo(footer) : undefined,
    main: main ? toElementInfo(main) : undefined,
    navigation: navigation.map(toElementInfo),
    complementary: complementary.map(toElementInfo),
  };
}
