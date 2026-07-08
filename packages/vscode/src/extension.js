'use strict';

/**
 * ChromaMark VS Code extension. Contributes the ChromaMark renderer to the
 * built-in Markdown preview (via extendMarkdownIt) so `:::` blocks, pills,
 * meters, fields and inline diff render live. Syntax highlighting is provided
 * separately by the injection grammar in syntaxes/.
 *
 * The renderer is an ES module; it is imported dynamically during activation so
 * the CommonJS extension host can await it before extendMarkdownIt is called.
 */

let chromamark;

async function activate() {
  const mod = await import('@chromamark/renderer');
  chromamark = mod.default;

  return {
    extendMarkdownIt(md) {
      return md.use(chromamark);
    },
  };
}

function deactivate() {}

module.exports = { activate, deactivate };
