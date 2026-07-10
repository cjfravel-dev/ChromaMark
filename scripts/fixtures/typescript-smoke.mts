import chromamark, {
  LANGUAGE_VERSION,
  colorEnabled,
  createRenderer,
  lint,
  render,
  renderAnsi,
  type RendererOptions,
} from '@chromamark/renderer';
import BrowserChromaMark, {
  autoRender,
  injectTheme,
  renderElement,
} from '@chromamark/renderer/browser';
import { compile, theme } from '@chromamark/cli';

const options: RendererOptions = { pill: true, critic: false };
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
const diagnostics = lint('[!unknown x]', { disable: ['CM001'] });
const page: string = compile('[!pass]', { title: 'Report', rendererOptions: options });
const css: string = theme();
const version: string = LANGUAGE_VERSION;
const enabled: boolean = colorEnabled('auto', {}, false);

injectTheme(document);
const rendered: Element | null | Promise<Element | null> = renderElement('#report', options);
const all = autoRender({ ...options, selector: '.chromamark' });
const browserVersion: string = BrowserChromaMark.LANGUAGE_VERSION;

void [html, ansi, diagnostics, page, css, version, enabled, rendered, all, browserVersion];
