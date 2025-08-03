// Copyright Year Logic Tests
const { updateCopyrightYear } = require('../src/utils');

describe('Copyright Year Logic', () => {
  let mockElement;
  let originalGetElementById;
  let originalGetFullYear;

  beforeEach(() => {
    // Create fresh mock element for each test
    mockElement = { textContent: '' };
    
    // Mock document.getElementById
    originalGetElementById = document.getElementById;
    document.getElementById = jest.fn(() => mockElement);
    
    // Store original getFullYear for restoration
    originalGetFullYear = Date.prototype.getFullYear;
  });

  afterEach(() => {
    // Restore original functions
    document.getElementById = originalGetElementById;
    Date.prototype.getFullYear = originalGetFullYear;
  });

  test('should show only start year when current year equals start year', () => {
    // Mock Date.prototype.getFullYear to return 2025
    Date.prototype.getFullYear = jest.fn(() => 2025);

    updateCopyrightYear();

    expect(document.getElementById).toHaveBeenCalledWith('copyright-year');
    expect(mockElement.textContent).toBe('2025');
  });

  test('should show year range when current year is after start year', () => {
    // Mock Date.prototype.getFullYear to return 2026
    Date.prototype.getFullYear = jest.fn(() => 2026);

    updateCopyrightYear();

    expect(document.getElementById).toHaveBeenCalledWith('copyright-year');
    expect(mockElement.textContent).toBe('2025-2026');
  });

  test('should show correct range for future years', () => {
    // Mock Date.prototype.getFullYear to return 2030
    Date.prototype.getFullYear = jest.fn(() => 2030);

    updateCopyrightYear();

    expect(document.getElementById).toHaveBeenCalledWith('copyright-year');
    expect(mockElement.textContent).toBe('2025-2030');
  });

  test('should handle case when element is not found', () => {
    document.getElementById.mockReturnValue(null);

    // Should not throw an error
    expect(() => updateCopyrightYear()).not.toThrow();
    expect(document.getElementById).toHaveBeenCalledWith('copyright-year');
  });

  test('should work with various future years', () => {
    const testCases = [
      { year: 2025, expected: '2025' },
      { year: 2026, expected: '2025-2026' },
      { year: 2027, expected: '2025-2027' },
      { year: 2035, expected: '2025-2035' },
      { year: 2050, expected: '2025-2050' }
    ];

    testCases.forEach(({ year, expected }) => {
      // Reset mock element
      mockElement.textContent = '';
      
      // Mock Date.prototype.getFullYear
      Date.prototype.getFullYear = jest.fn(() => year);

      updateCopyrightYear();

      expect(mockElement.textContent).toBe(expected);
    });
  });
});