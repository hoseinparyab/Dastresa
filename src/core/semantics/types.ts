/** Normalized semantic models for Dastresa Understand (1.2.0). No raw DOM as API. */

export type PageType =
  | 'ARTICLE'
  | 'NEWS'
  | 'DOCUMENT'
  | 'FORM'
  | 'SHOPPING'
  | 'GOVERNMENT'
  | 'BANKING'
  | 'SEARCH'
  | 'SOCIAL'
  | 'UNKNOWN';

export interface ElementInfo {
  tag: string;
  role?: string;
  label?: string;
  textPreview?: string;
  selectorHint?: string;
}

export interface HeadingInfo {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  text: string;
  id?: string;
  children: HeadingInfo[];
}

export interface ArticleInfo {
  title?: string;
  textPreview?: string;
  paragraphCount: number;
}

export interface LinkInfo {
  text: string;
  href?: string;
  external: boolean;
}

export interface ButtonInfo {
  text: string;
  type?: string;
  disabled: boolean;
}

export interface FormFieldValidation {
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  min?: string;
  max?: string;
}

export interface FormFieldInfo {
  id?: string;
  name?: string;
  type: string;
  label?: string;
  placeholder?: string;
  description?: string;
  required: boolean;
  disabled: boolean;
  readonly: boolean;
  autocomplete?: string;
  validation?: FormFieldValidation;
}

export interface FormInfo {
  name?: string;
  action?: string;
  method?: string;
  fields: FormFieldInfo[];
}

export interface SectionInfo {
  label?: string;
  headingLevel?: number;
  textPreview?: string;
}

export interface PageLandmarks {
  header?: ElementInfo;
  navigation: ElementInfo[];
  main?: ElementInfo;
  complementary: ElementInfo[];
  footer?: ElementInfo;
}

export interface PageStructure {
  url: string;
  title: string;
  lang: string;
  landmarks: PageLandmarks;
  headings: HeadingInfo[];
  headingFlat: Array<{ level: number; text: string; id?: string }>;
  articles: ArticleInfo[];
  links: LinkInfo[];
  buttons: ButtonInfo[];
  forms: FormInfo[];
  inputs: FormFieldInfo[];
  sections: SectionInfo[];
  paragraphCount: number;
  imageCount: number;
  textLength: number;
  analyzedAt: number;
}

export interface PageTypeResult {
  type: PageType;
  confidence: number;
  signals: string[];
}

export interface FormAnalysisResult {
  forms: FormInfo[];
  fieldCount: number;
}

export interface ReaderStructure {
  title: string;
  byline?: string;
  toc: Array<{ id: string; level: number; text: string }>;
  sectionCount: number;
}
