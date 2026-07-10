import {
  LANGUAGE_VERSION,
  type RendererOptions,
} from './index.js';
import type MarkdownIt from 'markdown-it';

export { LANGUAGE_VERSION };

export interface BrowserOptions extends RendererOptions {
  selector?: string;
}

export type RenderTarget = string | Element;
export type RenderResult = Element | null;
export type AsyncRenderResult = Promise<RenderResult>;

export interface ChromaMarkBrowserApi {
  readonly LANGUAGE_VERSION: typeof LANGUAGE_VERSION;
  readonly theme: string;
  render(source: unknown, options?: RendererOptions): string;
  renderElement(target: RenderTarget, options?: RendererOptions): RenderResult | AsyncRenderResult;
  renderAll(
    selector?: string,
    options?: RendererOptions,
  ): Array<RenderResult | AsyncRenderResult>;
  renderSrc(target: RenderTarget, options?: RendererOptions): AsyncRenderResult;
  injectTheme(document?: Document): void;
  autoRender(options?: BrowserOptions): Array<RenderResult | AsyncRenderResult>;
  createRenderer(options?: RendererOptions): MarkdownIt;
}

export let theme: string;
export function configureTheme(css: string): void;
export function render(source: unknown, options?: RendererOptions): string;
export function renderElement(
  target: RenderTarget,
  options?: RendererOptions,
): RenderResult | AsyncRenderResult;
export function renderAll(
  selector?: string,
  options?: RendererOptions,
): Array<RenderResult | AsyncRenderResult>;
export function renderSrc(target: RenderTarget, options?: RendererOptions): AsyncRenderResult;
export function injectTheme(document?: Document): void;
export function autoRender(options?: BrowserOptions): Array<RenderResult | AsyncRenderResult>;

export const ChromaMark: ChromaMarkBrowserApi;
export default ChromaMark;
