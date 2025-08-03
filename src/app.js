// Import utility functions (when available)
let utils = {};
if (typeof require !== 'undefined') {
  try {
    utils = require('./utils');
  } catch (e) {
    // Utils not available, define functions inline
  }
}

// --- Minimal YAML parser (only for simple key: value and lists) ---
function parseYAML(yaml) {
  if (utils.parseYAML) return utils.parseYAML(yaml);
  
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
  // Escape HTML
  md = md.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

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
      return '<code>' + code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") + '</code>';
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
      html += line.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") + '\n';
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

// --- LocalStorage Management ---
const TEMPLATES_KEY = 'standalone_templates';
const KVPS_KEY = 'standalone_kvps';
const CSS_KEY = 'standalone_css';

function getTemplates() {
  return JSON.parse(localStorage.getItem(TEMPLATES_KEY) || '[]');
}
function setTemplates(arr) {
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(arr));
}
function getKVPs() {
  return JSON.parse(localStorage.getItem(KVPS_KEY) || '[]');
}
function setKVPs(arr) {
  localStorage.setItem(KVPS_KEY, JSON.stringify(arr));
}
function getCSSs() {
  return JSON.parse(localStorage.getItem(CSS_KEY) || '[]');
}
function setCSSs(arr) {
  localStorage.setItem(CSS_KEY, JSON.stringify(arr));
}

// --- UI State ---
let selectedTemplate = null;
let selectedKVP = null;
let selectedCSS = null;

// --- Default Templates ---
const defaultTemplates = [
  {
    name: 'Markdown List',
    content: `# Shopping List for {{ name }}
{% for item in items %}
- {{ item }}
{% endfor %}`
  },
  {
    name: 'CSV Table',
    content: `name, item
{% for item in items %}
{{ name }}, {{ item }}
{% endfor %}`
  },
  {
    name: 'HTML Table',
    content: `<table border="1">
  <tr><th>Name</th><th>Item</th></tr>
  {% for item in items %}
  <tr><td>{{ name }}</td><td>{{ item }}</td></tr>
  {% endfor %}
</table>`
  }
];

// --- Default KVPs ---
const defaultKVPs = [
  {
    name: 'Example',
    content: `{
  "name": "Chris",
  "items": ["apple", "banana", "carrot"]
}`
  }
];

// --- Default CSSs ---
const defaultCSSs = [
  {
    name: 'Templatimator Example',
    content: `/* All output is wrapped in .templatimator-output */
.templatimator-output {
  font-family: 'Segoe UI', Arial, sans-serif;
  color: #222;
  background: #fff;
  padding: 1em;
  border-radius: 8px;
  max-width: 700px;
  margin: 0 auto;
}
.templatimator-output h1, .templatimator-output h2, .templatimator-output h3 {
  font-family: 'Segoe UI', Arial, sans-serif;
  color: #2d7ff9;
  margin-top: 1.2em;
  margin-bottom: 0.5em;
}
.templatimator-output ul, .templatimator-output ol {
  margin: 0 0 1em 2em;
  padding: 0;
}
.templatimator-output li {
  margin: 0.2em 0;
}
.templatimator-output blockquote {
  border-left: 3px solid #b3c7e6;
  margin: 0.5em 0;
  padding: 0.5em 1em;
  background: #f0f4fa;
  color: #555;
}
.templatimator-output pre {
  background: #eaeaea;
  padding: 0.7em;
  border-radius: 4px;
  overflow-x: auto;
}
.templatimator-output code {
  background: #eaeaea;
  padding: 0.1em 0.3em;
  border-radius: 3px;
  font-size: 0.95em;
}
.templatimator-output table {
  border-collapse: collapse;
  margin: 1em 0;
}
.templatimator-output th, .templatimator-output td {
  border: 1px solid #bbb;
  padding: 0.3em 0.7em;
}
.templatimator-output th {
  background: #f0f4fa;
}
.templatimator-output p {
  margin: 0.5em 0 1em 0;
}
`
  }
];

// --- Initialisation ---
function init() {
  // Load defaults if not present
  if (getTemplates().length === 0) {
    setTemplates(defaultTemplates);
  }
  if (getKVPs().length === 0) {
    setKVPs(defaultKVPs);
  }
  if (getCSSs().length === 0) {
    setCSSs(defaultCSSs);
  }
  renderTemplateList();
  renderKVPList();
  renderCSSList();
  document.getElementById('formatSelect').value = 'html';
  renderOutput();
}

// --- Template List UI ---
function renderTemplateList() {
  const list = document.getElementById('templateList');
  const templates = getTemplates();
  list.innerHTML = '';
  templates.forEach((tpl, idx) => {
    const li = document.createElement('li');
    li.textContent = tpl.name;
    if (selectedTemplate === idx) li.classList.add('selected');
    li.onclick = () => selectTemplate(idx);
    const del = document.createElement('button');
    del.textContent = '✕';
    del.className = 'del';
    del.onclick = (e) => {
      e.stopPropagation();
      deleteTemplate(idx);
    };
    li.appendChild(del);
    list.appendChild(li);
  });
}
function selectTemplate(idx) {
  selectedTemplate = idx;
  const templates = getTemplates();
  document.getElementById('templateInput').value =
    templates[idx].content;
  document.getElementById('templateName').value = templates[idx].name;
  renderTemplateList();
  renderOutput();
}
function saveTemplate() {
  const name = document.getElementById('templateName').value.trim();
  const content = document.getElementById('templateInput').value;
  if (!name) return alert('Template name required');
  let templates = getTemplates();
  if (selectedTemplate !== null) {
    templates[selectedTemplate] = { name, content };
  } else {
    templates.push({ name, content });
    selectedTemplate = templates.length - 1;
  }
  setTemplates(templates);
  renderTemplateList();
  renderOutput();
}
function deleteTemplate(idx) {
  let templates = getTemplates();
  templates.splice(idx, 1);
  setTemplates(templates);
  if (selectedTemplate === idx) {
    selectedTemplate = null;
    document.getElementById('templateInput').value = '';
    document.getElementById('templateName').value = '';
  }
  renderTemplateList();
  renderOutput();
}

// --- KVP List UI ---
function renderKVPList() {
  const list = document.getElementById('kvpList');
  const kvps = getKVPs();
  list.innerHTML = '';
  kvps.forEach((kvp, idx) => {
    const li = document.createElement('li');
    li.textContent = kvp.name;
    if (selectedKVP === idx) li.classList.add('selected');
    li.onclick = () => selectKVP(idx);
    const del = document.createElement('button');
    del.textContent = '✕';
    del.className = 'del';
    del.onclick = (e) => {
      e.stopPropagation();
      deleteKVP(idx);
    };
    li.appendChild(del);
    list.appendChild(li);
  });
}
function selectKVP(idx) {
  selectedKVP = idx;
  const kvps = getKVPs();
  document.getElementById('kvpInput').value = kvps[idx].content;
  document.getElementById('kvpName').value = kvps[idx].name;
  renderKVPList();
  renderOutput();
}
function saveKVP() {
  const name = document.getElementById('kvpName').value.trim();
  const content = document.getElementById('kvpInput').value;
  if (!name) return alert('KVP set name required');
  let kvps = getKVPs();
  if (selectedKVP !== null) {
    kvps[selectedKVP] = { name, content };
  } else {
    kvps.push({ name, content });
    selectedKVP = kvps.length - 1;
  }
  setKVPs(kvps);
  renderKVPList();
  renderOutput();
}
function deleteKVP(idx) {
  let kvps = getKVPs();
  kvps.splice(idx, 1);
  setKVPs(kvps);
  if (selectedKVP === idx) {
    selectedKVP = null;
    document.getElementById('kvpInput').value = '';
    document.getElementById('kvpName').value = '';
  }
  renderKVPList();
  renderOutput();
}

// --- CSS List UI ---
function renderCSSList() {
  const list = document.getElementById('cssList');
  const csss = getCSSs();
  list.innerHTML = '';
  csss.forEach((css, idx) => {
    const li = document.createElement('li');
    li.textContent = css.name;
    if (selectedCSS === idx) li.classList.add('selected');
    li.onclick = () => selectCSS(idx);
    const del = document.createElement('button');
    del.textContent = '✕';
    del.className = 'del';
    del.onclick = (e) => {
      e.stopPropagation();
      deleteCSS(idx);
    };
    li.appendChild(del);
    list.appendChild(li);
  });
}
function selectCSS(idx) {
  selectedCSS = idx;
  const csss = getCSSs();
  document.getElementById('cssInput').value = csss[idx].content;
  document.getElementById('cssName').value = csss[idx].name;
  renderCSSList();
  renderOutput();
}
function saveCSS() {
  const name = document.getElementById('cssName').value.trim();
  const content = document.getElementById('cssInput').value;
  if (!name) return alert('CSS set name required');
  let csss = getCSSs();
  if (selectedCSS !== null) {
    csss[selectedCSS] = { name, content };
  } else {
    csss.push({ name, content });
    selectedCSS = csss.length - 1;
  }
  setCSSs(csss);
  renderCSSList();
  renderOutput();
}
function deleteCSS(idx) {
  let csss = getCSSs();
  csss.splice(idx, 1);
  setCSSs(csss);
  if (selectedCSS === idx) {
    selectedCSS = null;
    document.getElementById('cssInput').value = '';
    document.getElementById('cssName').value = '';
  }
  renderCSSList();
  renderOutput();
}

// --- Parse KVP input (JSON or YAML) ---
function parseKVPInput() {
  const raw = document.getElementById('kvpInput').value.trim();
  if (!raw) return {};
  try {
    if (raw.startsWith('{') || raw.startsWith('[')) {
      return JSON.parse(raw);
    } else {
      return parseYAML(raw);
    }
  } catch (e) {
    return {};
  }
}

// --- Output Rendering ---
function renderOutput() {
  const template = document.getElementById('templateInput').value;
  const context = parseKVPInput();
  const format = document.getElementById('formatSelect').value;
  const csss = getCSSs();
  const css = (selectedCSS !== null && csss[selectedCSS])
    ? csss[selectedCSS].content
    : '';
  let output = '';
  let htmlOutput = '';
  try {
    output = renderTemplate(template, context);
  } catch (e) {
    output = 'Error rendering template: ' + e.message;
  }
  if (format === 'html' || format === 'pdf') {
    // If the template is Markdown (heuristic: contains markdown heading or list), render as HTML
    let contentHTML;
    if (
      /^# /.test(template) ||
      /^- /.test(template) ||
      /\n- /.test(template) ||
      /\n\d+\. /.test(template)
    ) {
      contentHTML = markdownToHTML(output);
    } else {
      contentHTML = output;
    }
    htmlOutput =
      `<div class="templatimator-output">${contentHTML}</div>` +
      (css
        ? `<style>${css}</style>`
        : '');
  } else if (format === 'markdown') {
    htmlOutput = `<pre>${escapeHTML(output)}</pre>`;
  } else if (format === 'csv' || format === 'txt') {
    htmlOutput = `<pre>${escapeHTML(output)}</pre>`;
  }
  document.getElementById('output').innerHTML = htmlOutput;
}

// --- Copy Output ---
function copyOutput() {
  const format = document.getElementById('formatSelect').value;
  const outputDiv = document.getElementById('output');
  const copyBtn = document.getElementById('copyBtn');
  let success = false;
  if (format === 'html' || format === 'pdf') {
    // Copy as HTML
    try {
      const range = document.createRange();
      range.selectNodeContents(outputDiv);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      document.execCommand('copy');
      sel.removeAllRanges();
      success = true;
    } catch (e) {
      success = false;
    }
  } else {
    // Copy as plain text
    const text = outputDiv.innerText;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(
        () => {
          success = true;
          flashButton(copyBtn, true);
        },
        () => {
          success = false;
          flashButton(copyBtn, false);
        }
      );
      return;
    } else {
      // Fallback for older browsers
      try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        success = true;
      } catch (e) {
        success = false;
      }
    }
  }
  flashButton(copyBtn, success);
}

function flashButton(btn, success) {
  btn.classList.remove('flash-success', 'flash-fail');
  void btn.offsetWidth; // force reflow
  btn.classList.add(success ? 'flash-success' : 'flash-fail');
  setTimeout(() => {
    btn.classList.remove('flash-success', 'flash-fail');
  }, 500);
}

// --- Download Output ---
function downloadOutput() {
  const format = document.getElementById('formatSelect').value;
  const outputDiv = document.getElementById('output');
  let content = '';
  let mime = 'text/plain';
  let ext = 'txt';
  if (format === 'html' || format === 'pdf') {
    content = outputDiv.innerHTML;
    mime = 'text/html';
    ext = 'html';
  } else {
    content = outputDiv.innerText;
    if (format === 'csv') {
      mime = 'text/csv';
      ext = 'csv';
    } else if (format === 'markdown') {
      mime = 'text/markdown';
      ext = 'md';
    }
  }
  if (format === 'pdf') {
    // Use browser print dialog for PDF
    window.print();
    return;
  }
  const blob = new Blob([content], { type: mime });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'output.' + ext;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  }, 100);
}

// --- Utility ---
function escapeHTML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// --- Live update on input ---
document.getElementById('templateInput').addEventListener('input', renderOutput);
document.getElementById('kvpInput').addEventListener('input', renderOutput);
document.getElementById('cssInput').addEventListener('input', renderOutput);
document.getElementById('formatSelect').addEventListener('change', renderOutput);

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

// --- Start ---
document.addEventListener('DOMContentLoaded', () => {
  init();
  updateCopyrightYear();
});