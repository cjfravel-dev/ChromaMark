# Theme presets and safe customization

ChromaMark themes use the existing semantic tone variables. Applications can
select a built-in preset or override only recognized tone slots; arbitrary CSS
is never accepted.

Built-in presets:

- `github-light`
- `github-dark`
- `ocean`
- `sunset`
- `monochrome`

```js
import {
  THEME_PRESETS,
  resolveTheme,
  applyTheme,
} from '@chromamark/renderer';

const variables = resolveTheme('ocean');

applyTheme(document, {
  preset: 'ocean',
  tones: {
    success: {
      foreground: '#123456',
      background: '#eef6ff',
      border: 'navy',
    },
  },
});
```

Overrides are limited to the six semantic tones (`success`, `danger`,
`warning`, `info`, `tip`, `muted`) and the slots `foreground`, `background`,
and `border`. Neutral styling supports `background` and `border`. Values must be
hex colors or plain CSS color names; functions such as `url()` and
`expression()` are rejected.

`applyTheme()` accepts an `Element` or `Document` and writes only the 20 known
`--cm-*` custom properties. The CDN/global API exposes the same
`THEME_PRESETS`, `resolveTheme()`, and `applyTheme()` members.
