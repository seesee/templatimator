// Utility functions extracted for testing

// --- Minimal YAML parser (only for simple key: value and lists) ---
function parseYAML(yaml) {
  const lines = yaml.split('\n');
  let obj = {};
  let currentKey = null;
  let currentList = null;
  for (let line of lines) {
    line = line.trim();
    if (!line || line.startsWith('#')) continue;
    if (line.includes(':')) {
      let [key, ...rest] = line.split(':');
      key = key.trim();
      let value = rest.join(':').trim();
      if (value === '') {
        // Start of a list
        currentKey = key;
        currentList = [];
        obj[key] = currentList;
      } else if (value.startsWith('[') && value.endsWith(']')) {
        // Inline list
        obj[key] = value
          .slice(1, -1)
          .split(',')
          .map((v) => v.trim());
      } else if (value === 'true' || value === 'false') {
        obj[key] = value === 'true';
      } else if (!isNaN(Number(value))) {
        obj[key] = Number(value);
      } else {
        obj[key] = value;
      }
    } else if (line.startsWith('-') && currentList) {
      currentList.push(line.slice(1).trim());
    }
  }
  return obj;
}

// --- Minimal Jinja2-like template engine ---
// Supports: {{ var }}, {% for x in xs %}...{% endfor %}, {% if cond %}...{% endif %}
function renderTemplate(template, context) {
  // Replace {{ var }} with value
  function getValue(path, ctx) {
    return path
      .split('.')
      .reduce((a, b) => (a && a[b] !== undefined ? a[b] : ''), ctx);
  }
  // Handle loops and conditionals
  function processBlock(tmpl, ctx) {
    // For loops
    tmpl = tmpl.replace(
      /{%\s*for\s+(\w+)\s+in\s+([\w.]+)\s*%}([\s\S]*?){%\s*endfor\s*%}/g,
      (m, varName, arrName, block) => {
        const arr = getValue(arrName, ctx);
        if (!Array.isArray(arr)) return '';
        return arr
          .map((item, idx) => {
            const newCtx = Object.assign({}, ctx);
            newCtx[varName] = item;
            newCtx.loop = { index: idx, index1: idx + 1 };
            return processBlock(block, newCtx);
          })
          .join('');
      }
    );
    // If statements
    tmpl = tmpl.replace(
      /{%\s*if\s+([\w.]+)\s*%}([\s\S]*?){%\s*endif\s*%}/g,
      (m, cond, block) => {
        const val = getValue(cond, ctx);
        if (val) return processBlock(block, ctx);
        return '';
      }
    );
    // Variable replacement
    tmpl = tmpl.replace(
      /{{\s*([\w.]+)\s*}}/g,
      (m, varPath) => {
        const val = getValue(varPath, ctx);
        return val !== undefined ? val : '';
      }
    );
    return tmpl;
  }
  return processBlock(template, context);
}

// --- Improved Markdown to HTML parser ---
// Handles: headings, bold, italics, code, lists, links, blockquotes, code blocks, tables, paragraphs
function markdownToHTML(md) {
  // Helper function for HTML escaping
  function escapeHtml(text) {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  // Split into lines for block parsing
  const lines = md.split(/\r?\n/);
  let html = '';
  let inList = false, listType = '', inBlockquote = false, inCodeBlock = false, inTable = false;
  let tableHeader = '', tableAlign = '', tableRows = [];
  let codeBlockLang = '';
  let paragraph = [];

  function flushParagraph() {
    if (paragraph.length) {
      html += '<p>' + inlineMarkdown(paragraph.join(' ')) + '</p>';
      paragraph = [];
    }
  }

  function flushList() {
    if (inList) {
      html += (listType === 'ul' ? '</ul>' : '</ol>');
      inList = false;
      listType = '';
    }
  }

  function flushBlockquote() {
    if (inBlockquote) {
      html += '</blockquote>';
      inBlockquote = false;
    }
  }

  function flushTable() {
    if (inTable) {
      html += '<table><thead><tr>';
      tableHeader.split('|').forEach(h => {
        if (h.trim()) html += '<th>' + h.trim() + '</th>';
      });
      html += '</tr></thead><tbody>';
      tableRows.forEach(row => {
        html += '<tr>';
        row.split('|').forEach(c => {
          if (c.trim()) html += '<td>' + c.trim() + '</td>';
        });
        html += '</tr>';
      });
      html += '</tbody></table>';
      inTable = false;
      tableHeader = '';
      tableAlign = '';
      tableRows = [];
    }
  }

  function inlineMarkdown(text) {
    // Inline code (escape HTML entities in code content)
    text = text.replace(/`([^`]+)`/g, (match, code) => {
      return '<code>' + escapeHtml(code) + '</code>';
    });
    // Bold and italics
    text = text.replace(/\*\*\*([^\*]+)\*\*\*/g, '<b><i>$1</i></b>');
    text = text.replace(/\*\*([^\*]+)\*\*/g, '<b>$1</b>');
    text = text.replace(/\*([^\*]+)\*/g, '<i>$1</i>');
    // Links
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
    return text;
  }

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Code block (fenced)
    if (/^```/.test(line)) {
      if (!inCodeBlock) {
        flushParagraph();
        flushList();
        flushBlockquote();
        flushTable();
        inCodeBlock = true;
        codeBlockLang = line.replace(/^```/, '').trim();
        html += '<pre><code>';
      } else {
        inCodeBlock = false;
        html += '</code></pre>';
      }
      continue;
    }
    if (inCodeBlock) {
      html += escapeHtml(line) + '\n';
      continue;
    }

    // Table
    if (/^\|(.+)\|$/.test(line)) {
      if (!inTable) {
        flushParagraph();
        flushList();
        flushBlockquote();
        inTable = true;
        tableHeader = line;
        tableRows = [];
      } else {
        tableRows.push(line);
      }
      continue;
    }
    if (inTable && /^(\|[\s:-]+\|)$/.test(line)) {
      tableAlign = line;
      continue;
    }
    if (inTable && !/^\|(.+)\|$/.test(line)) {
      flushTable();
    }

    // Blockquote
    if (/^> /.test(line)) {
      flushParagraph();
      flushList();
      flushTable();
      if (!inBlockquote) {
        inBlockquote = true;
        html += '<blockquote>';
      }
      html += inlineMarkdown(line.replace(/^> /, '')) + ' ';
      continue;
    } else {
      flushBlockquote();
    }

    // Unordered list
    if (/^\s*[-*+] /.test(line)) {
      flushParagraph();
      if (!inList || listType !== 'ul') {
        flushList();
        inList = true;
        listType = 'ul';
        html += '<ul>';
      }
      html += '<li>' + inlineMarkdown(line.replace(/^\s*[-*+] /, '')) + '</li>';
      continue;
    }
    // Ordered list
    if (/^\s*\d+\. /.test(line)) {
      flushParagraph();
      if (!inList || listType !== 'ol') {
        flushList();
        inList = true;
        listType = 'ol';
        html += '<ol>';
      }
      html += '<li>' + inlineMarkdown(line.replace(/^\s*\d+\. /, '')) + '</li>';
      continue;
    }
    // Heading
    let headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      flushParagraph();
      flushList();
      html += `<h${headingMatch[1].length}>${inlineMarkdown(headingMatch[2])}</h${headingMatch[1].length}>`;
      continue;
    }
    // Horizontal rule
    if (/^---+$/.test(line)) {
      flushParagraph();
      flushList();
      html += '<hr />';
      continue;
    }
    // Blank line
    if (/^\s*$/.test(line)) {
      flushParagraph();
      flushList();
      flushBlockquote();
      flushTable();
      continue;
    }
    // Paragraph text
    paragraph.push(line.trim());
  }
  // Flush any remaining blocks
  flushParagraph();
  flushList();
  flushBlockquote();
  flushTable();

  // Remove extra spaces between block elements
  html = html.replace(/>\s+</g, '><');
  return html;
}

// --- Copyright Year Management ---
function updateCopyrightYear() {
  const currentYear = new Date().getFullYear();
  const startYear = 2025;
  const yearElement = document.getElementById('copyright-year');
  
  if (yearElement) {
    if (currentYear === startYear) {
      yearElement.textContent = startYear.toString();
    } else {
      yearElement.textContent = `${startYear}-${currentYear}`;
    }
  }
}

// Export for Node.js testing environment
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    parseYAML,
    renderTemplate,
    markdownToHTML,
    updateCopyrightYear
  };
}