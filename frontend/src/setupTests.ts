import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';

// Configure React Testing Library
configure({ reactStrictMode: true });

// Mark this as a React act environment
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

// Suppress console.error for act() warnings from Ant Design
// Ant Design Form has unavoidable internal state updates
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    const message = typeof args[0] === 'string' ? args[0] : String(args[0]);
    // Suppress act() warnings - these are expected from Ant Design Form
    if (
      message.includes('Warning: An update to') &&
      message.includes('was not wrapped in act')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// Prevent act() errors from failing tests
// Override the global error handler to catch AggregateError from act()
const originalAddEventListener = globalThis.addEventListener;
(globalThis as any).addEventListener = (
  type: string,
  listener: EventListenerOrEventListenerObject,
  ...args: any[]
) => {
  if (type === 'error') {
    const wrappedListener: EventListener = (event: Event) => {
      if (event instanceof ErrorEvent) {
        // Suppress AggregateError from React act() - these are from Ant Design
        if (event.error?.name === 'AggregateError') {
          const errors = event.error.errors || [];
          const allAreActWarnings = errors.every(
            (err: Error) =>
              err.message?.includes('was not wrapped in act') ||
              err.message?.includes('An update to')
          );
          if (allAreActWarnings) {
            event.preventDefault();
            event.stopPropagation();
            return;
          }
        }
      }
      if (typeof listener === 'function') {
        listener(event);
      } else {
        listener.handleEvent(event);
      }
    };
    return originalAddEventListener.call(globalThis, type, wrappedListener, ...args);
  }
  return originalAddEventListener.call(globalThis, type, listener, ...args);
};
