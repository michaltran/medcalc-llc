import React from 'react';

/**
 * Lightweight markdown renderer (no external deps)
 * Hỗ trợ: heading, table, list, blockquote, bold, italic, code, link
 */
export default function Markdown({ content }) {
  const html = renderMarkdown(content || '');
  return <div className="md-content" dangerouslySetInnerHTML={{ __html: html }} />;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function inline(text) {
  return text
    .replace(/`([^`]+)`/g, (_, c) => `<code>${escapeHtml(c)}</code>`)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
}

function renderMarkdown(md) {
  const lines = md.split('\n');
  const out = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Heading
    const h = line.match(/^(#{1,4})\s+(.*)/);
    if (h) {
      out.push(`<h${h[1].length}>${inline(escapeHtml(h[2]))}</h${h[1].length}>`);
      i++; continue;
    }

    // Table (markdown pipe table)
    if (line.includes('|') && i + 1 < lines.length && /^\s*\|?\s*[:\-\s|]+$/.test(lines[i+1])) {
      const headerCells = line.split('|').map(s => s.trim()).filter(Boolean);
      i += 2;
      const rows = [];
      while (i < lines.length && lines[i].includes('|')) {
        rows.push(lines[i].split('|').map(s => s.trim()).filter(Boolean));
        i++;
      }
      out.push('<table><thead><tr>' + headerCells.map(c => `<th>${inline(escapeHtml(c))}</th>`).join('') + '</tr></thead><tbody>' +
        rows.map(r => '<tr>' + r.map(c => `<td>${inline(escapeHtml(c))}</td>`).join('') + '</tr>').join('') + '</tbody></table>');
      continue;
    }

    // Blockquote
    if (line.startsWith('>')) {
      const buf = [];
      while (i < lines.length && lines[i].startsWith('>')) {
        buf.push(lines[i].replace(/^>\s?/, ''));
        i++;
      }
      out.push('<blockquote>' + inline(escapeHtml(buf.join(' '))) + '</blockquote>');
      continue;
    }

    // Unordered list
    if (/^[-*]\s+/.test(line)) {
      const buf = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
        buf.push(lines[i].replace(/^[-*]\s+/, ''));
        i++;
      }
      out.push('<ul>' + buf.map(b => `<li>${inline(escapeHtml(b))}</li>`).join('') + '</ul>');
      continue;
    }

    // Ordered list
    if (/^\d+\.\s+/.test(line)) {
      const buf = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        buf.push(lines[i].replace(/^\d+\.\s+/, ''));
        i++;
      }
      out.push('<ol>' + buf.map(b => `<li>${inline(escapeHtml(b))}</li>`).join('') + '</ol>');
      continue;
    }

    // Empty line
    if (!line.trim()) { i++; continue; }

    // Paragraph (collect until blank line)
    const buf = [line];
    i++;
    while (i < lines.length && lines[i].trim() && !lines[i].match(/^(#{1,4}|>|[-*]\s|\d+\.)/) && !lines[i].includes('|')) {
      buf.push(lines[i]); i++;
    }
    out.push('<p>' + inline(escapeHtml(buf.join(' '))) + '</p>');
  }

  return out.join('\n');
}
