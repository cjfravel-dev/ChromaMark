/**
 * GitHub-native renderer for ChromaMark. Converts the parsed token stream back
 * into portable GFM using Alerts, details, tables, kbd badges, and text meters.
 */

import { createRenderer } from './index.js';

const ALERT_TYPE = {
  success: 'TIP',
  tip: 'TIP',
  info: 'NOTE',
  muted: 'NOTE',
  warning: 'WARNING',
  danger: 'CAUTION',
};

const TONE_ICON = {
  success: '✅',
  danger: '❌',
  warning: '⚠️',
  info: 'ℹ️',
  tip: '💡',
  muted: '⏸️',
};

function escapeHtml(text) {
  return String(text).replace(/[&<>"]/g, (char) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char]
  ));
}

function escapeMarkdown(text) {
  return escapeHtml(text)
    .replace(/\\/g, '\\\\')
    .replace(/([*_[\]`~])/g, '\\$1');
}

function inlineCode(content) {
  const longest = Math.max(0, ...Array.from(String(content).matchAll(/`+/g), (match) => match[0].length));
  const fence = '`'.repeat(Math.max(1, longest + 1));
  const padding = content.startsWith('`') || content.endsWith('`') ? ' ' : '';
  return `${fence}${padding}${content}${padding}${fence}`;
}

function linkTarget(token) {
  const href = token.attrGet('href') || '';
  const target = /[\s()]/.test(href) ? `<${href.replace(/>/g, '%3E')}>` : href;
  const title = token.attrGet('title');
  return title ? `${target} "${String(title).replace(/"/g, '\\"')}"` : target;
}

function renderPill(meta) {
  const icon = meta.tone ? TONE_ICON[meta.tone] : '🔹';
  return `${icon} <kbd>${escapeHtml(meta.label)}</kbd>`;
}

function renderMeter(meta, cells = 10) {
  const filled = Math.round((Number(meta.width) / 100) * cells);
  return `${'█'.repeat(filled)}${'░'.repeat(cells - filled)} ${escapeMarkdown(meta.value)}`;
}

function renderCritic(meta) {
  switch (meta.kind) {
    case 'add': return `<ins>${escapeMarkdown(meta.content)}</ins>`;
    case 'del': return `~~${escapeMarkdown(meta.content)}~~`;
    case 'sub': return `~~${escapeMarkdown(meta.old)}~~<ins>${escapeMarkdown(meta.neu)}</ins>`;
    case 'mark': return `**${escapeMarkdown(meta.content)}**`;
    case 'comment': return `_(${escapeMarkdown(meta.content)})_`;
    default: return '';
  }
}

function renderInline(children) {
  let output = '';
  const links = [];
  for (const token of children) {
    switch (token.type) {
      case 'text': output += escapeMarkdown(token.content); break;
      case 'softbreak': output += '\n'; break;
      case 'hardbreak': output += '  \n'; break;
      case 'strong_open':
      case 'strong_close': output += '**'; break;
      case 'em_open':
      case 'em_close': output += '_'; break;
      case 's_open':
      case 's_close': output += '~~'; break;
      case 'link_open':
        links.push(linkTarget(token));
        output += '[';
        break;
      case 'link_close': output += `](${links.pop() || ''})`; break;
      case 'code_inline': output += inlineCode(token.content); break;
      case 'image': {
        const src = token.attrGet('src') || '';
        const title = token.attrGet('title');
        const suffix = title ? ` "${String(title).replace(/"/g, '\\"')}"` : '';
        output += `![${escapeMarkdown(token.content || '')}](${src}${suffix})`;
        break;
      }
      case 'html_inline': output += token.content; break;
      case 'cm_pill': output += renderPill(token.meta); break;
      case 'cm_text': output += escapeMarkdown(token.meta.label); break;
      case 'cm_meter': output += renderMeter(token.meta); break;
      case 'cm_critic': output += renderCritic(token.meta); break;
      default: if (token.content) output += escapeMarkdown(token.content);
    }
  }
  return output;
}

function renderSummaryInline(children) {
  let output = '';
  for (const token of children) {
    switch (token.type) {
      case 'text': output += escapeHtml(token.content); break;
      case 'softbreak': output += ' '; break;
      case 'hardbreak': output += '<br>'; break;
      case 'strong_open': output += '<strong>'; break;
      case 'strong_close': output += '</strong>'; break;
      case 'em_open': output += '<em>'; break;
      case 'em_close': output += '</em>'; break;
      case 's_open': output += '<del>'; break;
      case 's_close': output += '</del>'; break;
      case 'link_open': {
        const href = escapeHtml(token.attrGet('href') || '');
        const title = token.attrGet('title');
        output += `<a href="${href}"${title ? ` title="${escapeHtml(title)}"` : ''}>`;
        break;
      }
      case 'link_close': output += '</a>'; break;
      case 'code_inline': output += `<code>${escapeHtml(token.content)}</code>`; break;
      case 'image': {
        const src = escapeHtml(token.attrGet('src') || '');
        const alt = escapeHtml(token.content || '');
        const title = token.attrGet('title');
        output += `<img src="${src}" alt="${alt}"${title ? ` title="${escapeHtml(title)}"` : ''}>`;
        break;
      }
      case 'html_inline': output += token.content; break;
      case 'cm_pill': output += renderPill(token.meta); break;
      case 'cm_text': output += escapeHtml(token.meta.label); break;
      case 'cm_meter': {
        const filled = Math.round((Number(token.meta.width) / 100) * 10);
        output += `${'█'.repeat(filled)}${'░'.repeat(10 - filled)} ${escapeHtml(token.meta.value)}`;
        break;
      }
      case 'cm_critic': {
        const meta = token.meta;
        if (meta.kind === 'add') output += `<ins>${escapeHtml(meta.content)}</ins>`;
        else if (meta.kind === 'del') output += `<del>${escapeHtml(meta.content)}</del>`;
        else if (meta.kind === 'sub') {
          output += `<del>${escapeHtml(meta.old)}</del><ins>${escapeHtml(meta.neu)}</ins>`;
        } else if (meta.kind === 'mark') output += `<strong>${escapeHtml(meta.content)}</strong>`;
        else if (meta.kind === 'comment') output += `<em>(${escapeHtml(meta.content)})</em>`;
        break;
      }
      default: if (token.content) output += escapeHtml(token.content);
    }
  }
  return output;
}

function protectBlockMarkers(text) {
  return text.replace(
    /(^|\n)(#{1,6}(?=[ \t])|[-+=](?=[ \t])|\d+[.)](?=[ \t])|[=-]{2,}(?=[ \t]*(?:\n|$)))/g,
    (_match, lineStart, marker) => {
      if (/^\d/.test(marker)) {
        return `${lineStart}${marker.slice(0, -1)}\\${marker.slice(-1)}`;
      }
      return `${lineStart}\\${marker}`;
    },
  );
}

function inlineString(ctx, text) {
  const tokens = ctx.md.parseInline(text || '', {});
  return renderInline((tokens[0] && tokens[0].children) || []);
}

function summaryString(ctx, text) {
  const tokens = ctx.md.parseInline(text || '', {});
  return renderSummaryInline((tokens[0] && tokens[0].children) || []);
}

function buildTree(tokens) {
  const root = { type: 'root', children: [] };
  const stack = [root];
  for (const token of tokens) {
    const parent = stack[stack.length - 1];
    if (token.nesting === 1) {
      const node = { type: token.type.replace(/_open$/, ''), token, children: [] };
      parent.children.push(node);
      stack.push(node);
    } else if (token.nesting === -1) {
      stack.pop();
    } else {
      parent.children.push({ type: token.type, token, children: token.children || [] });
    }
  }
  return root;
}

function renderBlocks(ctx, children) {
  return children
    .map((child) => renderNode(ctx, child))
    .filter(Boolean)
    .join('\n\n');
}

function indentBlock(text, firstPrefix, restPrefix) {
  return text
    .split('\n')
    .map((line, index) => (line ? `${index === 0 ? firstPrefix : restPrefix}${line}` : ''))
    .join('\n');
}

function renderList(ctx, node, ordered) {
  let number = Number(node.token.attrGet('start') || 1);
  return node.children
    .filter((child) => child.type === 'list_item')
    .map((item) => {
      const marker = ordered ? `${number++}. ` : '- ';
      return indentBlock(renderBlocks(ctx, item.children), marker, ' '.repeat(marker.length));
    })
    .join('\n');
}

function collectTableRows(node) {
  const rows = [];
  const visit = (current) => {
    for (const child of current.children) {
      if (child.type === 'tr') {
        rows.push(child.children
          .filter((cell) => cell.type === 'th' || cell.type === 'td')
          .map((cell) => {
            const style = cell.token.attrGet('style') || '';
            const match = /text-align:(left|center|right)/.exec(style);
            return {
              inline: cell.children.find((part) => part.type === 'inline'),
              align: match ? match[1] : null,
            };
          }));
      } else if (child.children) {
        visit(child);
      }
    }
  };
  visit(node);
  return rows;
}

function tableCell(cell) {
  return (cell && cell.inline ? renderInline(cell.inline.children) : '')
    .replace(/\|/g, '\\|')
    .replace(/\n/g, '<br>');
}

function renderTable(node) {
  const rows = collectTableRows(node);
  if (!rows.length) return '';
  const width = Math.max(...rows.map((row) => row.length));
  const line = (row) => `| ${Array.from({ length: width }, (_, index) => tableCell(row[index])).join(' | ')} |`;
  const delimiter = (cell) => {
    if (cell && cell.align === 'left') return ':---';
    if (cell && cell.align === 'center') return ':---:';
    if (cell && cell.align === 'right') return '---:';
    return '---';
  };
  return [
    line(rows[0]),
    `| ${Array.from({ length: width }, (_, index) => delimiter(rows[0][index])).join(' | ')} |`,
    ...rows.slice(1).map(line),
  ].join('\n');
}

function quote(text) {
  return text.split('\n').map((line) => (line ? `> ${line}` : '>')).join('\n');
}

function renderContainer(ctx, node) {
  const meta = node.token.meta;
  const body = renderBlocks(ctx, node.children);
  if (meta.structure === 'details') {
    const icon = meta.tone ? `${TONE_ICON[meta.tone]} ` : '';
    const open = meta.open ? ' open' : '';
    return [
      `<details${open}>`,
      `<summary>${icon}${summaryString(ctx, meta.summary)}</summary>`,
      '',
      body,
      '',
      '</details>',
    ].join('\n');
  }

  const lines = [`[!${ALERT_TYPE[meta.tone] || 'NOTE'}]`];
  if (meta.title) lines.push(`**${inlineString(ctx, meta.title)}**`);
  if (meta.title && body) lines.push('');
  if (body) lines.push(body);
  return quote(lines.join('\n'));
}

function renderFields(ctx, node) {
  const rows = node.token.meta.rows;
  return [
    '| Field | Value |',
    '| --- | --- |',
    ...rows.map(([key, value]) =>
      `| ${escapeMarkdown(key).replace(/\|/g, '\\|')} | ${inlineString(ctx, value).replace(/\|/g, '\\|').replace(/\n/g, '<br>')} |`),
  ].join('\n');
}

function codeFence(token) {
  const content = String(token.content).replace(/\n$/, '');
  const longest = Math.max(0, ...Array.from(content.matchAll(/`+/g), (match) => match[0].length));
  const fence = '`'.repeat(Math.max(3, longest + 1));
  return `${fence}${token.info || ''}\n${content}\n${fence}`;
}

function renderNode(ctx, node) {
  switch (node.type) {
    case 'root': return renderBlocks(ctx, node.children);
    case 'paragraph': {
      const inline = node.children.find((child) => child.type === 'inline');
      return inline ? protectBlockMarkers(renderInline(inline.children)) : '';
    }
    case 'heading': {
      const inline = node.children.find((child) => child.type === 'inline');
      return `${'#'.repeat(Number(node.token.tag.slice(1)))} ${inline ? renderInline(inline.children) : ''}`;
    }
    case 'blockquote': return quote(renderBlocks(ctx, node.children));
    case 'bullet_list': return renderList(ctx, node, false);
    case 'ordered_list': return renderList(ctx, node, true);
    case 'list_item': return renderBlocks(ctx, node.children);
    case 'table': return renderTable(node);
    case 'fence': return codeFence(node.token);
    case 'code_block': return codeFence({ ...node.token, info: '' });
    case 'hr': return '---';
    case 'cm_container': return renderContainer(ctx, node);
    case 'cm_fields': return renderFields(ctx, node);
    case 'inline': return renderInline(node.children);
    case 'html_block': return String(node.token.content).replace(/\n$/, '');
    default: return node.token && node.token.content ? escapeMarkdown(node.token.content) : '';
  }
}

/**
 * Render ChromaMark source to GitHub-native GFM.
 * @param {unknown} source ChromaMark source
 * @param {{allowHtml?:boolean, rendererOptions?:object}} [options]
 */
export function renderGitHub(source, options = {}) {
  const md = createRenderer(options.rendererOptions);
  if (options.allowHtml) md.options.html = true;
  const tokens = md.parse(String(source ?? ''), {});
  const output = renderBlocks({ md }, buildTree(tokens).children);
  return output ? `${output.replace(/\n+$/, '')}\n` : '';
}
