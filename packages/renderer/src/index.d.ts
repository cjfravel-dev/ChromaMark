import type MarkdownIt from 'markdown-it';

export interface RendererOptions {
  container?: boolean;
  details?: boolean;
  fields?: boolean;
  pill?: boolean;
  text?: boolean;
  meter?: boolean;
  critic?: boolean;
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

declare const chromamark: ChromaMarkPlugin;

export default chromamark;
export const LANGUAGE_VERSION: '0.1';

export function createRenderer(options?: RendererOptions): MarkdownIt;
export function render(source: unknown, options?: RendererOptions): string;
export function renderAnsi(source: unknown, options?: RenderAnsiOptions): string;
export function colorEnabled(
  option?: 'auto' | 'always' | 'never',
  env?: Record<string, string | undefined>,
  isTTY?: boolean,
): boolean;
export function lint(source: unknown, options?: LintOptions): LintDiagnostic[];
