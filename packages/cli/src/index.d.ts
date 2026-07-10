import type {
  LintDiagnostic,
  LintOptions,
  RendererOptions,
  RenderAnsiOptions,
  RenderGitHubOptions,
} from '@chromamark/renderer';

export interface CompileOptions {
  title?: string;
  theme?: string;
  rendererOptions?: RendererOptions;
}

export function render(source: unknown, options?: RendererOptions): string;
export function renderAnsi(source: unknown, options?: RenderAnsiOptions): string;
export function renderGitHub(source: unknown, options?: RenderGitHubOptions): string;
export function lint(source: unknown, options?: LintOptions): LintDiagnostic[];
export function theme(): string;
export function compile(source: unknown, options?: CompileOptions): string;

export type {
  LintDiagnostic,
  LintOptions,
  RendererOptions,
  RenderAnsiOptions,
  RenderGitHubOptions,
};
