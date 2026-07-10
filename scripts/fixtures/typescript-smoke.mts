import chromamark, {
  LANGUAGE_VERSION,
  colorEnabled,
  createRenderer,
  lint,
  render,
  renderAnsi,
  renderGitHub,
  resolveTheme,
  type ThemeConfig,
  type RenderGitHubOptions,
  type RendererOptions,
} from '@chromamark/renderer';
import BrowserChromaMark, {
  autoRender,
  injectTheme,
  renderElement,
} from '@chromamark/renderer/browser';
import { compile, renderGitHub as renderGitHubFromCli, theme } from '@chromamark/cli';
import {
  loadCorpus,
  runConformance,
  type ConformanceResult,
} from '@chromamark/conformance';

const options: RendererOptions = {
  pill: true,
  critic: false,
  highlight(code, language, attrs) {
    return `${language}:${attrs}:${code}`;
  },
};
const md = createRenderer(options);
md.use(chromamark, options);
md.set({ linkify: false });
md.enable('table');
md.disable('html');
md.use((instance) => {
  instance.set({ typographer: false });
});

const html: string = render('[!pass]', options);
const ansi: string = renderAnsi('[!pass]', { color: 'never', width: 80 });
const githubOptions: RenderGitHubOptions = { allowHtml: false, rendererOptions: options };
const github: string = renderGitHub('[!pass]', githubOptions);
const themeConfig: ThemeConfig = {
  preset: 'ocean',
  tones: { success: { foreground: '#123456' } },
};
const variables: Record<string, string> = resolveTheme(themeConfig);
const cliGithub: string = renderGitHubFromCli('[!pass]', githubOptions);
const diagnostics = lint('[!unknown x]', { disable: ['CM001'] });
const page: string = compile('[!pass]', { title: 'Report', rendererOptions: options });
const css: string = theme();
const version: string = LANGUAGE_VERSION;
const enabled: boolean = colorEnabled('auto', {}, false);
const conformance: Promise<ConformanceResult> = runConformance(render, {
  corpus: loadCorpus(),
  languageVersion: LANGUAGE_VERSION,
});

injectTheme(document);
const rendered: Element | null | Promise<Element | null> = renderElement('#report', options);
const all = autoRender({ ...options, selector: '.chromamark' });
const browserVersion: string = BrowserChromaMark.LANGUAGE_VERSION;

void [
  html, ansi, github, cliGithub, diagnostics, page, css, version, enabled,
  conformance, variables, rendered, all, browserVersion,
];
