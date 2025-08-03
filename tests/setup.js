// Jest setup file
// Set up DOM environment
global.localStorage = {
  data: {},
  getItem: function(key) {
    return this.data[key] || null;
  },
  setItem: function(key, value) {
    this.data[key] = value;
  },
  removeItem: function(key) {
    delete this.data[key];
  },
  clear: function() {
    this.data = {};
  }
};

// Mock alert function
global.alert = jest.fn();

// Clean up between tests
beforeEach(() => {
  global.localStorage.clear();
  jest.clearAllMocks();
});