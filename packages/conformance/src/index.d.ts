export interface ConformanceOptions {
  container?: boolean;
  details?: boolean;
  fields?: boolean;
  pill?: boolean;
  text?: boolean;
  meter?: boolean;
  critic?: boolean;
}

export interface ConformanceCase {
  name: string;
  source: string;
  options?: ConformanceOptions;
  html: string;
}

export interface ConformanceCorpus {
  version: 1;
  languageVersion: string;
  cases: ConformanceCase[];
}

export interface ConformanceFailure {
  name: string;
  expected: string;
  actual: string | null;
  error: string | null;
}

export interface ConformanceResult {
  ok: boolean;
  total: number;
  passed: number;
  failed: number;
  failures: ConformanceFailure[];
}

export type ConformanceRenderer = (
  source: string,
  options: ConformanceOptions,
) => string | Promise<string>;

export interface RunConformanceOptions {
  corpus?: ConformanceCorpus;
  languageVersion?: string;
}

export const CORPUS_SCHEMA_VERSION: 1;
export function loadCorpus(): ConformanceCorpus;
export function loadSchema(): Record<string, unknown>;
export function validateCorpus(corpus: unknown): string[];
export function assertCorpus(corpus: unknown): ConformanceCorpus;
export function runConformance(
  render: ConformanceRenderer,
  options?: RunConformanceOptions,
): Promise<ConformanceResult>;
