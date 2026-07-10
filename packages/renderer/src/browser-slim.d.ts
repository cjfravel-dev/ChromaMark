import type { RendererOptions, ThemeInput } from './index.js';
import type MarkdownIt from 'markdown-it';

export type SlimRenderer = (source: string, options?: RendererOptions) => string;
export type RenderTarget = string | Element;
export type RenderResult = Element | null;

export interface ChromaMarkSlimApi {
  readonly theme: string;
  configureRenderer(renderer: SlimRenderer): void;
  configureMarkdownIt(markdownIt: MarkdownIt, options?: RendererOptions): MarkdownIt;
  configureTheme(css: string): void;
  render(source: unknown, options?: RendererOptions): string;
  renderElement(target: RenderTarget, options?: RendererOptions): RenderResult | Promise<RenderResult>;
  renderAll(selector?: string, options?: RendererOptions): Array<RenderResult | Promise<RenderResult>>;
  renderSrc(target: RenderTarget, options?: RendererOptions): Promise<RenderResult>;
  injectTheme(document?: Document): void;
  autoRender(options?: RendererOptions & { selector?: string }): Array<RenderResult | Promise<RenderResult>>;
  applyTheme(target: Element | Document, theme?: ThemeInput): Element;
}

export function configureRenderer(renderer: SlimRenderer): void;
export function configureMarkdownIt(markdownIt: MarkdownIt, options?: RendererOptions): MarkdownIt;
export function configureTheme(css: string): void;
export function render(source: unknown, options?: RendererOptions): string;
export function renderElement(
  target: RenderTarget,
  options?: RendererOptions,
): RenderResult | Promise<RenderResult>;
export function renderAll(
  selector?: string,
  options?: RendererOptions,
): Array<RenderResult | Promise<RenderResult>>;
export function renderSrc(target: RenderTarget, options?: RendererOptions): Promise<RenderResult>;
export function injectTheme(document?: Document): void;
export function autoRender(
  options?: RendererOptions & { selector?: string },
): Array<RenderResult | Promise<RenderResult>>;
export function applyTheme(target: Element | Document, theme?: ThemeInput): Element;

export const ChromaMarkSlim: ChromaMarkSlimApi;
export default ChromaMarkSlim;
