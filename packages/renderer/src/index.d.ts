import type MarkdownIt from 'markdown-it';

export type HighlightFunction = (
  code: string,
  language: string,
  attributes: string,
) => string;

export interface RendererOptions {
  container?: boolean;
  details?: boolean;
  fields?: boolean;
  pill?: boolean;
  text?: boolean;
  meter?: boolean;
  critic?: boolean;
  highlight?: HighlightFunction;
}

export type ChromaMarkPlugin = (
  markdownIt: MarkdownIt,
  options?: RendererOptions,
) => void;

export interface RenderAnsiOptions {
  color?: 'auto' | 'always' | 'never';
  width?: number;
  rendererOptions?: RendererOptions;
}

export interface RenderGitHubOptions {
  allowHtml?: boolean;
  rendererOptions?: RendererOptions;
}

export interface LintOptions {
  disable?: string[];
}

export interface LintDiagnostic {
  line: number;
  column: number;
  severity: 'warning';
  rule: string;
  message: string;
}

export type ThemePresetName = 'github-light' | 'github-dark' | 'ocean' | 'sunset' | 'monochrome';
export type ThemeSlot = {
  foreground?: string;
  background?: string;
  border?: string;
};
export interface ThemeConfig {
  preset?: ThemePresetName;
  tones?: Partial<Record<'success' | 'danger' | 'warning' | 'info' | 'tip' | 'muted', ThemeSlot>>;
  neutral?: Pick<ThemeSlot, 'background' | 'border'>;
}
export type ThemeInput = ThemePresetName | ThemeConfig;
export type ThemeVariables = Record<string, string>;

declare const chromamark: ChromaMarkPlugin;

export default chromamark;
export const LANGUAGE_VERSION: '0.1';

export function createRenderer(options?: RendererOptions): MarkdownIt;
export function render(source: unknown, options?: RendererOptions): string;
export function renderAnsi(source: unknown, options?: RenderAnsiOptions): string;
export function renderGitHub(source: unknown, options?: RenderGitHubOptions): string;
export function colorEnabled(
  option?: 'auto' | 'always' | 'never',
  env?: Record<string, string | undefined>,
  isTTY?: boolean,
): boolean;
export function lint(source: unknown, options?: LintOptions): LintDiagnostic[];
export const THEME_PRESETS: Readonly<Record<ThemePresetName, Readonly<ThemeVariables>>>;
export function resolveTheme(theme?: ThemeInput): ThemeVariables;
export function applyTheme(target: Element | Document, theme?: ThemeInput): Element;
