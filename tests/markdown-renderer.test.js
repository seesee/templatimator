// Markdown Renderer Tests
const { markdownToHTML } = require('../src/utils');

describe('Markdown Renderer', () => {
  test('should render headings', () => {
    const markdown = `# Heading 1
## Heading 2
### Heading 3`;
    const result = markdownToHTML(markdown);
    expect(result).toContain('<h1>Heading 1</h1>');
    expect(result).toContain('<h2>Heading 2</h2>');
    expect(result).toContain('<h3>Heading 3</h3>');
  });

  test('should render paragraphs', () => {
    const markdown = `This is a paragraph.

This is another paragraph.`;
    const result = markdownToHTML(markdown);
    expect(result).toContain('<p>This is a paragraph.</p>');
    expect(result).toContain('<p>This is another paragraph.</p>');
  });

  test('should render bold and italic text', () => {
    const markdown = `This is **bold** text.
This is *italic* text.
This is ***bold and italic*** text.`;
    const result = markdownToHTML(markdown);
    expect(result).toContain('<b>bold</b>');
    expect(result).toContain('<i>italic</i>');
    expect(result).toContain('<b><i>bold and italic</i></b>');
  });

  test('should render inline code', () => {
    const markdown = 'Use the `console.log()` function.';
    const result = markdownToHTML(markdown);
    expect(result).toContain('<code>console.log()</code>');
  });

  test('should render code blocks', () => {
    const markdown = `\`\`\`javascript
function hello() {
  console.log("Hello");
}
\`\`\``;
    const result = markdownToHTML(markdown);
    expect(result).toContain('<pre><code>');
    expect(result).toContain('function hello()');
    expect(result).toContain('</code></pre>');
  });

  test('should render unordered lists', () => {
    const markdown = `- Item 1
- Item 2
- Item 3`;
    const result = markdownToHTML(markdown);
    expect(result).toContain('<ul>');
    expect(result).toContain('<li>Item 1</li>');
    expect(result).toContain('<li>Item 2</li>');
    expect(result).toContain('<li>Item 3</li>');
    expect(result).toContain('</ul>');
  });

  test('should render ordered lists', () => {
    const markdown = `1. First item
2. Second item
3. Third item`;
    const result = markdownToHTML(markdown);
    expect(result).toContain('<ol>');
    expect(result).toContain('<li>First item</li>');
    expect(result).toContain('<li>Second item</li>');
    expect(result).toContain('<li>Third item</li>');
    expect(result).toContain('</ol>');
  });

  test('should render links', () => {
    const markdown = '[Google](https://google.com)';
    const result = markdownToHTML(markdown);
    expect(result).toContain('<a href="https://google.com">Google</a>');
  });

  test('should render blockquotes', () => {
    const markdown = '> This is a blockquote.';
    const result = markdownToHTML(markdown);
    expect(result).toContain('<blockquote>');
    expect(result).toContain('This is a blockquote.');
    expect(result).toContain('</blockquote>');
  });

  test('should render horizontal rules', () => {
    const markdown = '---';
    const result = markdownToHTML(markdown);
    expect(result).toContain('<hr />');
  });

  test('should render tables', () => {
    const markdown = `| Name | Age |
|------|-----|
| John | 30  |
| Jane | 25  |`;
    const result = markdownToHTML(markdown);
    expect(result).toContain('<table>');
    expect(result).toContain('<thead>');
    expect(result).toContain('<tbody>');
    expect(result).toContain('<th>Name</th>');
    expect(result).toContain('<th>Age</th>');
    expect(result).toContain('<td>John</td>');
    expect(result).toContain('<td>30</td>');
  });

  test('should escape HTML entities', () => {
    const markdown = 'Code: `<script>alert("xss")</script>`';
    const result = markdownToHTML(markdown);
    expect(result).toContain('&lt;script&gt;');
    expect(result).toContain('&lt;/script&gt;');
    expect(result).not.toContain('<script>');
  });

  test('should handle empty input', () => {
    const result = markdownToHTML('');
    expect(result).toBe('');
  });

  test('should handle mixed content', () => {
    const markdown = `# My Project

This is a **great** project with the following features:

- Feature 1
- Feature 2
- Feature 3

Visit [our website](https://example.com) for more info.

\`\`\`
npm install my-project
\`\`\`

> Thanks for using our project!`;

    const result = markdownToHTML(markdown);
    expect(result).toContain('<h1>My Project</h1>');
    expect(result).toContain('<b>great</b>');
    expect(result).toContain('<ul>');
    expect(result).toContain('<li>Feature 1</li>');
    expect(result).toContain('<a href="https://example.com">our website</a>');
    expect(result).toContain('<pre><code>');
    expect(result).toContain('<blockquote>');
  });
});