import themeCss from '../theme/chromamark.css';
import ChromaMarkSlim, { configureTheme } from './browser-slim-core.js';

configureTheme(themeCss);

export * from './browser-slim-core.js';
export default ChromaMarkSlim;
