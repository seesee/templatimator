// Template Engine Tests
const { renderTemplate } = require('../src/utils');

describe('Template Engine', () => {
  describe('renderTemplate', () => {
    test('should render simple variable replacement', () => {
      const template = 'Hello {{ name }}!';
      const context = { name: 'World' };
      const result = renderTemplate(template, context);
      expect(result).toBe('Hello World!');
    });

    test('should render multiple variables', () => {
      const template = '{{ greeting }} {{ name }}, you have {{ count }} messages.';
      const context = { greeting: 'Hello', name: 'Chris', count: 5 };
      const result = renderTemplate(template, context);
      expect(result).toBe('Hello Chris, you have 5 messages.');
    });

    test('should handle missing variables gracefully', () => {
      const template = 'Hello {{ name }}! Your age is {{ age }}.';
      const context = { name: 'Chris' };
      const result = renderTemplate(template, context);
      expect(result).toBe('Hello Chris! Your age is .');
    });

    test('should render for loops', () => {
      const template = `Shopping List:
{% for item in items %}
- {{ item }}
{% endfor %}`;
      const context = { items: ['apple', 'banana', 'orange'] };
      const result = renderTemplate(template, context);
      expect(result).toContain('- apple');
      expect(result).toContain('- banana');
      expect(result).toContain('- orange');
    });

    test('should handle empty arrays in for loops', () => {
      const template = `Items:
{% for item in items %}
- {{ item }}
{% endfor %}Done`;
      const context = { items: [] };
      const result = renderTemplate(template, context);
      expect(result).toBe('Items:\nDone');
    });

    test('should render if statements - truthy condition', () => {
      const template = `{% if hasItems %}You have items!{% endif %}`;
      const context = { hasItems: true };
      const result = renderTemplate(template, context);
      expect(result).toBe('You have items!');
    });

    test('should render if statements - falsy condition', () => {
      const template = `{% if hasItems %}You have items!{% endif %}No items shown.`;
      const context = { hasItems: false };
      const result = renderTemplate(template, context);
      expect(result).toBe('No items shown.');
    });

    test('should handle nested objects', () => {
      const template = 'Hello {{ user.name }}, your email is {{ user.email }}.';
      const context = { user: { name: 'Chris', email: 'chris@example.com' } };
      const result = renderTemplate(template, context);
      expect(result).toBe('Hello Chris, your email is chris@example.com.');
    });

    test('should provide loop variables', () => {
      const template = `{% for item in items %}{{ loop.index1 }}. {{ item }}
{% endfor %}`;
      const context = { items: ['first', 'second'] };
      const result = renderTemplate(template, context);
      expect(result).toContain('1. first');
      expect(result).toContain('2. second');
    });
  });
});