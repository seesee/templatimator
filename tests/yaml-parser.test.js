// YAML Parser Tests
const { parseYAML } = require('../src/utils');

describe('YAML Parser', () => {
  test('should parse simple key-value pairs', () => {
    const yaml = `name: Chris
age: 30
active: true`;
    const result = parseYAML(yaml);
    expect(result).toEqual({
      name: 'Chris',
      age: 30,
      active: true
    });
  });

  test('should parse boolean values', () => {
    const yaml = `enabled: true
disabled: false`;
    const result = parseYAML(yaml);
    expect(result).toEqual({
      enabled: true,
      disabled: false
    });
  });

  test('should parse numeric values', () => {
    const yaml = `count: 42
price: 19.99
zero: 0`;
    const result = parseYAML(yaml);
    expect(result).toEqual({
      count: 42,
      price: 19.99,
      zero: 0
    });
  });

  test('should parse inline arrays', () => {
    const yaml = `fruits: [apple, banana, orange]
numbers: [1, 2, 3]`;
    const result = parseYAML(yaml);
    expect(result).toEqual({
      fruits: ['apple', 'banana', 'orange'],
      numbers: ['1', '2', '3']
    });
  });

  test('should parse multi-line arrays', () => {
    const yaml = `items:
- apple
- banana
- orange`;
    const result = parseYAML(yaml);
    expect(result).toEqual({
      items: ['apple', 'banana', 'orange']
    });
  });

  test('should ignore comments and empty lines', () => {
    const yaml = `# This is a comment
name: Chris
# Another comment

age: 30
`;
    const result = parseYAML(yaml);
    expect(result).toEqual({
      name: 'Chris',
      age: 30
    });
  });

  test('should handle values with colons', () => {
    const yaml = `url: https://example.com:8080
time: 14:30:00`;
    const result = parseYAML(yaml);
    expect(result).toEqual({
      url: 'https://example.com:8080',
      time: '14:30:00'
    });
  });

  test('should handle empty input', () => {
    const result = parseYAML('');
    expect(result).toEqual({});
  });

  test('should handle whitespace-only input', () => {
    const result = parseYAML('   \n  \n  ');
    expect(result).toEqual({});
  });

  test('should parse mixed content', () => {
    const yaml = `name: Chris
active: true
count: 5
tags: [developer, javascript]
skills:
- JavaScript
- Node.js
- React`;
    const result = parseYAML(yaml);
    expect(result).toEqual({
      name: 'Chris',
      active: true,
      count: 5,
      tags: ['developer', 'javascript'],
      skills: ['JavaScript', 'Node.js', 'React']
    });
  });
});