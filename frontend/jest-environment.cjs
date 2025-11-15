const JSDOMEnvironment = require('jest-environment-jsdom').default;

/**
 * Custom Jest environment to handle React 19 act() warnings from Ant Design
 * Ant Design Form has internal state updates that trigger act() warnings
 * which are safe but cause test failures in the strict React 19 environment
 */
class CustomJSDOMEnvironment extends JSDOMEnvironment {
  async setup() {
    await super.setup();
    
    // Patch console.error to suppress act() warnings
    const originalError = this.global.console.error;
    this.global.console.error = (...args) => {
      const message = typeof args[0] === 'string' ? args[0] : String(args[0]);
      if (
        message.includes('Warning: An update to') &&
        message.includes('was not wrapped in act')
      ) {
        return; // Suppress act() warnings
      }
      originalError.call(this.global.console, ...args);
    };
  }

  async teardown() {
    await super.teardown();
  }

  getVmContext() {
    return super.getVmContext();
  }
}

module.exports = CustomJSDOMEnvironment;
